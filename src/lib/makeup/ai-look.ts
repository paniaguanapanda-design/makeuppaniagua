import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { optionsFor, referencePrompt } from "@/lib/makeup/references";
import type { SituationId, ZoneId } from "@/lib/makeup/types";

const schema = z.object({
  situation: z.enum(["dia", "oficina", "entrevista", "cita", "boda", "fiesta", "fotos", "editorial"]),
  optionId: z.enum(["piel", "poco", "natural", "definido", "cargado"]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z.array(z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"])).max(8),
  photo: z.string().startsWith("data:image/jpeg;base64,").max(1_600_000),
});

type GeminiPart = { inlineData?: { mimeType?: string; data?: string } };

/** Pide a Gemini que edite la foto de la usuaria con el look. Sin clave, falla rápido y la app usa el pintado local. */
export const aiLook = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<{ imageUrl: string }> => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("sin-clave");
    const option = optionsFor(data.situation as SituationId).find((o) => o.id === data.optionId);
    if (!option) throw new Error("look-desconocido");
    const prompt = referencePrompt(
      data.situation as SituationId,
      option,
      { shape: data.shape, undertone: data.undertone, depth: data.depth, skinHex: "#000000" },
      data.owned as ZoneId[],
    );
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(55_000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: data.photo.split(",")[1] } },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );
    if (!response.ok) throw new Error("ia-no-disponible");
    const payload = (await response.json()) as { candidates?: { content?: { parts?: GeminiPart[] } }[] };
    const part = payload.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part?.inlineData?.data) throw new Error("ia-vacia");
    return { imageUrl: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}` };
  });
