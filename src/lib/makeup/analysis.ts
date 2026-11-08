import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import type { FaceShape } from "@/lib/makeup/types";

/**
 * Análisis de maquilladora profesional: forma del rostro, tipo y calidad de piel,
 * lo que hay que tener en cuenta y ojeras. Solo orientación de maquillaje.
 */
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

async function askGrok(photo: string): Promise<FaceAnalysis | null> {
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

export const analyzeFace = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ photo: z.string().startsWith("data:image/").max(1_600_000) }))
  .handler(async ({ data }): Promise<FaceAnalysis | null> => askGrok(data.photo));
