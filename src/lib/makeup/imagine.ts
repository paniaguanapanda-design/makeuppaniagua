import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionsFor, referencePrompt, type OptionId } from "@/lib/makeup/references";
import type { PersonBrief } from "@/lib/makeup/profile";
import type { FaceRead, FaceShape, SituationId, ZoneId } from "@/lib/makeup/types";

const schema = z.object({
  situation: z.enum([
    "dia",
    "oficina",
    "entrevista",
    "cita",
    "boda",
    "fiesta",
    "fotos",
    "editorial",
  ]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z
    .array(
      z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"]),
    )
    .max(8),
  age: z.enum(["menor", "joven", "treinta", "cuarenta", "madura", "silver"]),
  tastes: z
    .array(z.enum(["natural", "poco", "color", "luminosa", "mate", "ceja", "labio", "ojo"]))
    .max(8),
  note: z.string().max(800),
  skin: z.string().max(300),
  years: z.number().int().min(10).max(110).optional(),
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
  analysis: FaceAnalysis | null;
  limited?: boolean;
  shape: FaceShape;
};

export type FaceAnalysis = {
  shape: FaceShape | null;
  skinType: string;
  quality: string;
  concerns: string[];
  darkCircles: "no" | "leves" | "marcadas";
  advice: string;
};

const ANALYSIS_ASK = [
  "Eres una maquilladora profesional con 20 años de experiencia. Observa este rostro SOLO para planificar el maquillaje.",
  "No hagas diagnósticos médicos ni uses términos clínicos. Describe solo lo que se ve en la foto, con tacto y en positivo.",
  "Responde EXCLUSIVAMENTE con un objeto JSON válido, sin texto antes ni después, con estas claves:",
  '"forma": una de "ovalado", "redondo", "cuadrado", "corazon", "alargado";',
  '"tipo_piel": una de "seca", "grasa", "mixta", "normal";',
  '"calidad": frase corta (máx. 90 caracteres) sobre textura, luminosidad y uniformidad;',
  '"a_tener_en_cuenta": lista (0 a 4) con solo lo visible entre "granos", "rojeces", "manchas", "brillo", "poros", "sequedad", "líneas de expresión";',
  '"ojeras": una de "no", "leves", "marcadas";',
  '"consejo": una frase (máx. 140 caracteres) como la diría una maquilladora a su clienta.',
  "Si algo no se ve con claridad, no lo inventes.",
].join(" ");

const SHAPES: FaceShape[] = ["ovalado", "redondo", "cuadrado", "corazon", "alargado"];
const CONCERNS = [
  "granos",
  "rojeces",
  "manchas",
  "brillo",
  "poros",
  "sequedad",
  "líneas de expresión",
];

function parseAnalysis(raw: string): FaceAnalysis | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const json = JSON.parse(match[0]) as Record<string, unknown>;
    const text = (value: unknown, max: number) =>
      typeof value === "string" ? value.trim().slice(0, max) : "";
    const shape = SHAPES.find((item) => item === json.forma) ?? null;
    const concerns = Array.isArray(json.a_tener_en_cuenta)
      ? json.a_tener_en_cuenta
          .filter((item): item is string => typeof item === "string" && CONCERNS.includes(item))
          .slice(0, 4)
      : [];
    const circles = json.ojeras === "leves" || json.ojeras === "marcadas" ? json.ojeras : "no";
    return {
      shape,
      skinType: ["seca", "grasa", "mixta", "normal"].includes(String(json.tipo_piel))
        ? String(json.tipo_piel)
        : "",
      quality: text(json.calidad, 120),
      concerns,
      darkCircles: circles,
      advice: text(json.consejo, 180),
    };
  } catch {
    return null;
  }
}

/** Resumen en palabras sencillas; alimenta el prompt de imagen y los pasos. */
export function analysisLine(analysis: FaceAnalysis) {
  const parts = [
    analysis.skinType ? `piel ${analysis.skinType}` : "",
    ...analysis.concerns,
    analysis.darkCircles !== "no" ? `ojeras ${analysis.darkCircles}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Piel pareja";
}

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
    if ((rec.type === "output_text" || rec.type === "text") && typeof rec.text === "string")
      chunks.push(rec.text);
    walk(rec.content);
    walk(rec.output);
  };
  walk(root.output);
  return chunks.join(" ");
}

async function analyzeFace(photo: string): Promise<FaceAnalysis | null> {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;
  try {
    const response = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: "grok-4.3",
        store: false,
        reasoning: { effort: "none" },
        input: [
          {
            role: "user",
            content: [
              { type: "input_image", image_url: photo },
              { type: "input_text", text: ANALYSIS_ASK },
            ],
          },
        ],
      }),
    });
    if (!response.ok) {
      console.error("[imagine] análisis", response.status);
      return null;
    }
    return parseAnalysis(textFromResponse(await response.json()));
  } catch (error) {
    console.error("[imagine] análisis", String(error));
    return null;
  }
}

async function editPortrait(photo: string, prompt: string): Promise<string> {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("Sin XAI_API_KEY");

  const response = await fetch("https://api.x.ai/v1/images/edits", {
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

  const text = await response.text();
  if (!response.ok) throw new Error(`xAI ${response.status}: ${text.slice(0, 300)}`);

  const payload = JSON.parse(text) as { data?: { url?: string }[] };
  const url = payload.data?.[0]?.url;
  if (!url) throw new Error("Sin URL de imagen");
  return url;
}

export const referenceLooks = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ReferenceResult> => {
    const key = process.env.XAI_API_KEY;
    const flag = process.env.ENABLE_IMAGE_GEN;
    const max = Number(process.env.MAX_IMAGE_GENERATIONS ?? 1);

    const situation = data.situation as SituationId;
    const read: FaceRead = {
      shape: data.shape,
      undertone: data.undertone,
      depth: data.depth,
      skinHex: "#000000",
    };
    const options = optionsFor(situation);
    const written = data.skin.trim();
    const analysis = await analyzeFace(data.photo);
    if (analysis?.shape) read.shape = analysis.shape;
    const seen = analysis ? analysisLine(analysis) : "";
    const skin = [written, seen].filter(Boolean).join(". En la foto: ");
    const person: PersonBrief = {
      age: data.age,
      years: data.years,
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
      return { cards, skinSeen: seen, skinFromPhoto: Boolean(seen), analysis, shape: read.shape };
    }

    const wanted = Math.min(options.length, Math.max(1, max));
    const { takeImageQuota } = await import("./guard.server");
    const granted = await takeImageQuota(wanted);
    if (granted === 0) {
      const cards: ReferenceCard[] = options.slice(0, 3).map((option) => ({
        id: option.id,
        title: option.title,
        line: option.line,
        imageUrl: "",
      }));
      return {
        cards,
        skinSeen: seen,
        skinFromPhoto: Boolean(seen),
        analysis,
        shape: read.shape,
        limited: true,
      };
    }
    const toGenerate = options.slice(0, granted);

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
      } else {
        console.error("[imagine] fail", option.id, String(result.reason));
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

    return { cards, skinSeen: seen, skinFromPhoto: Boolean(seen), analysis, shape: read.shape };
  });
