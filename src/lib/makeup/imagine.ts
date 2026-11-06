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
};

// Control de coste
const MAX_IMAGE_GENERATIONS = Number(process.env.MAX_IMAGE_GENERATIONS ?? 1);
const ENABLE_IMAGE_GENERATION = !!process.env.XAI_API_KEY && process.env.ENABLE_IMAGE_GEN !== "false";

// Límite por IP (en memoria, se reinicia con cold starts de Vercel)
const MAX_GENERATIONS_PER_IP = Number(process.env.MAX_GENERATIONS_PER_IP ?? 5);
const ipUsage = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

function checkAndIncrementIp(ip: string): boolean {
  const now = Date.now();
  const entry = ipUsage.get(ip);

  if (!entry || now > entry.resetAt) {
    ipUsage.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_GENERATIONS_PER_IP) {
    return false;
  }

  entry.count += 1;
  return true;
}

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
    if (!response.ok) return "";
    const payload = await response.json();
    return textFromResponse(payload).trim().slice(0, 160);
  } catch {
    return "";
  }
}

async function editPortrait(photo: string, prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("Sin clave de imagen.");
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    signal: AbortSignal.timeout(55_000),
    body: JSON.stringify({
      model: "grok-2-image",
      prompt,
      image: photo,
      n: 1,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "No pude crear la referencia.");
  }
  const payload = (await response.json()) as { data?: { url?: string }[] };
  const url = payload.data?.[0]?.url;
  if (!url) throw new Error("La referencia llegó vacía.");
  return url;
}

export const referenceLooks = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data, request }): Promise<ReferenceResult> => {
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

    // Modo sin generación de imágenes
    if (!ENABLE_IMAGE_GENERATION) {
      const cards: ReferenceCard[] = options.slice(0, 3).map((option) => ({
        id: option.id,
        title: option.title,
        line: option.line,
        imageUrl: "",
      }));
      return { cards, skinSeen: skin, skinFromPhoto: !written && Boolean(skin) };
    }

    // Límite por IP
    const ip = getClientIp(request.headers);
    const allowed = checkAndIncrementIp(ip);

    if (!allowed) {
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
        limited: true,
      };
    }

    const toGenerate = options.slice(0, Math.max(1, MAX_IMAGE_GENERATIONS));

    const settled = await Promise.allSettled(
      toGenerate.map((option) =>
        editPortrait(
          data.photo,
          referencePrompt(situation, option, read, data.owned as ZoneId[], person),
        ),
      ),
    );

    const cards: ReferenceCard[] = [];
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
      }
    });

    for (let i = cards.length; i < 3 && i < options.length; i++) {
      const option = options[i];
      cards.push({
        id: option.id,
        title: option.title,
        line: option.line,
        imageUrl: "",
      });
    }

    if (!cards.length) {
      throw new Error("No pude generar referencias. Prueba con otra foto.");
    }

    return { cards, skinSeen: skin, skinFromPhoto: !written && Boolean(skin) };
  });
