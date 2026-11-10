import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { z } from "zod";
import { skinPrompt } from "@/lib/makeup/profile";
import { optionsFor, referencePrompt } from "@/lib/makeup/references";
import type { SituationId, ZoneId } from "@/lib/makeup/types";

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
  optionId: z.enum(["natural", "medio", "glam"]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z
    .array(
      z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"]),
    )
    .max(8),
  photo: z.string().startsWith("data:image/jpeg;base64,").max(1_600_000),
  /** Lo que la maquilladora vio en la piel y lo que contó la usuaria. */
  skin: z.string().max(400).optional(),
});

type GeminiPart = { inlineData?: { mimeType?: string; data?: string } };

/** Pide a Gemini que edite la foto de la usuaria con el look. Sin clave, falla rápido y la app usa el pintado local. */
export const aiLook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(schema)
  .handler(async ({ data, context }): Promise<{ imageUrl: string }> => {
    const grokKey = process.env.XAI_API_KEY;
    const key = process.env.GEMINI_API_KEY;
    if (!grokKey && !key) {
      console.error("[ai-look] sin XAI_API_KEY ni GEMINI_API_KEY en el servidor");
      throw new Error("sin-clave");
    }
    const { refundImageQuota, takeImageQuota } = await import("./quota.server");
    if (!(await takeImageQuota(context.userId))) {
      console.log(`[ai-look] límite diario alcanzado (${data.optionId})`);
      throw new Error("limite-diario");
    }
    // Si la imagen no llega, se devuelve el cupo: solo cuentan las que se generan.
    const started = Date.now();
    try {
      const result = await generate(data, grokKey, key);
      console.log(`[xai] imagen ${data.optionId} generada en ${Date.now() - started} ms`);
      return result;
    } catch (error) {
      console.error(
        `[ai-look] fallo ${data.optionId} tras ${Date.now() - started} ms:`,
        error instanceof Error ? error.message : String(error),
      );
      await refundImageQuota(context.userId);
      throw error;
    }
  });

async function generate(
  data: z.infer<typeof schema>,
  grokKey: string | undefined,
  key: string | undefined,
): Promise<{ imageUrl: string }> {
  const option = optionsFor(data.situation as SituationId).find((o) => o.id === data.optionId);
  if (!option) throw new Error("look-desconocido");
  const prompt =
    referencePrompt(
      data.situation as SituationId,
      option,
      { shape: data.shape, undertone: data.undertone, depth: data.depth, skinHex: "#000000" },
      data.owned as ZoneId[],
    ) + (data.skin ? ` ${skinPrompt(data.skin, true)}` : "");
  if (grokKey) {
    const edit = await fetch("https://api.x.ai/v1/images/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${grokKey}` },
      signal: AbortSignal.timeout(55_000),
      body: JSON.stringify({
        model: "grok-imagine-image-2.0",
        prompt,
        image: { url: data.photo, type: "image_url" },
        aspect_ratio: "3:4",
      }),
    });
    if (!edit.ok) {
      const body = (await edit.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 220);
      throw new Error(`grok-${edit.status}: ${body}`);
    }
    const made = (await edit.json()) as { data?: { url?: string; b64_json?: string }[] };
    const item = made.data?.[0];
    if (item?.b64_json) return { imageUrl: `data:image/jpeg;base64,${item.b64_json}` };
    if (!item?.url) throw new Error("grok-vacia");
    const file = await fetch(item.url, { signal: AbortSignal.timeout(20_000) });
    if (!file.ok) throw new Error("grok-descarga");
    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    return {
      imageUrl: `data:${file.headers.get("content-type") ?? "image/jpeg"};base64,${bytes}`,
    };
  }
  if (!key) throw new Error("sin-clave");
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
  if (!response.ok) {
    const body = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 220);
    throw new Error(`ia-${response.status}: ${body}`);
  }
  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: GeminiPart[] } }[];
  };
  const part = payload.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) throw new Error("ia-vacia");
  return {
    imageUrl: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
  };
}
