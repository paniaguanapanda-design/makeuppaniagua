import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionsFor, referencePrompt, type OptionId } from "@/lib/makeup/references";
import type { PersonBrief } from "@/lib/makeup/profile";
import type { FaceRead, SituationId, ZoneId } from "@/lib/makeup/types";

const schema = z.object({
  situation: z.enum(["dia", "oficina", "entrevista", "cita", "boda", "fiesta", "fotos", "editorial"]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z.array(z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"])).max(8),
  age: z.enum(["menor", "joven", "treinta", "cuarenta", "madura", "silver"]),
  tastes: z.array(z.enum(["natural", "poco", "color", "luminosa", "mate", "ceja", "labio", "ojo"])).max(8),
  note: z.string().max(800),
  skin: z.string().max(300),
  photo: z.string().startsWith("data:image/").max(1_600_000),
});

export type ReferenceCard = {
  id: OptionId;
  title: string;
  line: string;
  imageUrl: string;
};

export type ReferenceResult = {
  cards: ReferenceCard[];
  skinSeen: string;
  skinFromPhoto: boolean;
  limited?: boolean;
  imageError?: string;
};

const SKIN_ASK =
  "Mira solo la piel de este rostro, para maquillaje. No diagnostiques ni des consejos médicos. " +
  "Si se ve con claridad, responde en una frase corta en español, solo con lo visible entre: ojeras, granos, brillo, sequedad, rojeces, manchas. " +
  "Si la piel se ve pareja, responde exactamente: Piel pareja. No inventes. Máximo 140 caracteres.";

function textFromResponse(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as { output_text?: unknown; output?: unknown };
  if (typeof root.output_text === "string") return root.output_text;
  const chunks: string[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;
    const rec = node as { type?: unknown; text?: unknown; content?: unknown; output?: unknown };
    if ((rec.type === "output_text" || rec.type === "text") && typeof rec.text === "string") chunks.push(rec.text);
    walk(rec.content);
    walk(rec.output);
  };
  walk(root.output);
  return chunks.join(" ");
}

async function readSkin(photo: string) {
  const key = process.env.XAI_API_KEY;
  if (!key) return "";
  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(18_000),
      body: JSON.stringify({
        model: "grok-4.3",
        store: false,
        reasoning: { effort: "none" },
        input: [
          {
            role: "user",
            content: [
              { type: "input_image", image_url: photo },
              { type: "input_text", text: SKIN_ASK },
            ],
          },
        ],
      }),
    });
    if (!response.ok) {
      console.warn("[imagine] skin analysis failed", response.status);
      return "";
    }
    const payload = await response.json();
    return textFromResponse(payload).trim().slice(0, 160);
  } catch {
    return "";
  }
}

function imageApiError(status: number): string {
  switch (status) {
    case 401:
      return "xAI no acepta la clave configurada (401). Revisa XAI_API_KEY.";
    case 402:
      return "xAI rechazó la solicitud por facturación (402). Revisa el crédito de la cuenta asociada a la clave.";
    case 403:
      return "xAI denegó el acceso (403). Revisa los permisos de la clave y del modelo.";
    case 400:
    case 404:
    case 422:
      return `xAI rechazó la solicitud de imagen (${status}). Revisa el modelo, la foto y el formato de la solicitud.`;
    case 429:
      return "xAI ha limitado las solicitudes (429). Revisa tus límites y vuelve a intentarlo más tarde.";
    default:
      return `No pude crear la imagen: xAI respondió ${status}. Inténtalo más tarde.`;
  }
}

async function editPortrait(photo: string, prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("La generación no está configurada: falta XAI_API_KEY.");

  let response: Response;
  try {
    response = await fetch("https://api.x.ai/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: "grok-imagine-image-2.0",
        prompt,
        image: { url: photo, type: "image_url" },
        n: 1,
      }),
    });
  } catch {
    throw new Error("No pude conectar con xAI o la solicitud tardó demasiado. Inténtalo de nuevo.");
  }

  if (!response.ok) {
    // Never log or return the upstream body: it may contain private request data.
    console.warn("[imagine] image edit failed", response.status);
    throw new Error(imageApiError(response.status));
  }

  let payload: { data?: { url?: string }[] };
  try {
    payload = await response.json();
  } catch {
    throw new Error("xAI devolvió una respuesta de imagen no válida. Inténtalo de nuevo.");
  }
  const url = payload?.data?.[0]?.url;
  if (!url || typeof url !== "string")
    throw new Error("xAI no devolvió una imagen. Inténtalo de nuevo.");
  return url;
}

export const referenceLooks = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ReferenceResult> => {
    const key = process.env.XAI_API_KEY;
    // Accept the existing misspelled variable; the canonical name takes precedence.
    const flag = process.env.ENABLE_IMAGE_GEN ?? process.env.ENEBLE_IMAGE_GEN;
    const configuredMax = Number(process.env.MAX_IMAGE_GENERATIONS ?? 1);
    const max = Number.isFinite(configuredMax)
      ? Math.min(3, Math.max(1, Math.floor(configuredMax)))
      : 1;

    const situation = data.situation as SituationId;
    const read: FaceRead = {
      shape: data.shape,
      undertone: data.undertone,
      depth: data.depth,
      skinHex: "#000000",
    };
    const options = optionsFor(situation);
    const written = data.skin.trim();
    const skin = written || (await readSkin(data.photo));
    const person: PersonBrief = {
      age: data.age,
      tastes: data.tastes,
      note: data.note,
      skin,
      skinFromPhoto: !written && Boolean(skin),
      kit: { base: "", ojos: "", labios: "", resto: "" },
    };

    if (!key || flag === "false") {
      const cards: ReferenceCard[] = options.slice(0, 3).map((option) => ({
        id: option.id,
        title: option.title,
        line: option.line,
        imageUrl: "",
      }));
      return {
        cards,
        skinSeen: skin,
        skinFromPhoto: !written && Boolean(skin),
        ...(!key && flag !== "false"
          ? { imageError: "La generación no está configurada: falta XAI_API_KEY." }
          : {}),
      };
    }

    const toGenerate = options.slice(0, max);

    const settled = await Promise.allSettled(
      toGenerate.map((option) =>
        editPortrait(
          data.photo,
          referencePrompt(situation, option, read, data.owned as ZoneId[], person),
        ),
      ),
    );

    const cards: ReferenceCard[] = [];
    let imageError: string | undefined;
    settled.forEach((result, index) => {
      const option = toGenerate[index];
      if (!option) return;
      if (result.status === "fulfilled") {
        cards.push({
          id: option.id,
          title: option.title,
          line: option.line,
          imageUrl: result.value,
        });
      } else {
        imageError ??=
          result.reason instanceof Error
            ? result.reason.message
            : "No pude crear la imagen con xAI.";
      }
    });

    // Keep every option once, including when only some image requests succeeded.
    const generated = new Map(cards.map((card) => [card.id, card]));
    const resultCards = options.slice(0, 3).map(
      (option) =>
        generated.get(option.id) ?? {
          id: option.id,
          title: option.title,
          line: option.line,
          imageUrl: "",
        },
    );

    return {
      cards: resultCards,
      skinSeen: skin,
      skinFromPhoto: !written && Boolean(skin),
      ...(imageError ? { imageError } : {}),
    };
  });
