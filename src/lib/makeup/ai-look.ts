import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { imageApiError, imageGenerationConfig } from "@/lib/makeup/image-config";
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
  trialId: z.string().uuid(),
  optionId: z.enum(["piel", "poco", "natural", "definido", "cargado"]),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z
    .array(
      z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"]),
    )
    .max(8),
  photo: z.string().startsWith("data:image/jpeg;base64,").max(1_600_000),
});

/** Edita exclusivamente con Grok. Los errores nunca producen una imagen local. */
export const aiLook = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<{ imageUrl: string }> => {
    const grokKey = process.env.XAI_API_KEY;
    if (!grokKey) throw new Error("Falta configurar XAI_API_KEY para generar los looks con Grok.");
    const config = imageGenerationConfig();
    const allowed = optionsFor(data.situation as SituationId).slice(0, config.max);
    if (!config.enabled) throw new Error("La generación de imágenes está desactivada.");
    if (!allowed.some((option) => option.id === data.optionId)) {
      throw new Error("Este look no está permitido por el límite de generación configurado.");
    }
    const option = optionsFor(data.situation as SituationId).find((o) => o.id === data.optionId);
    if (!option) throw new Error("look-desconocido");
    const prompt = referencePrompt(
      data.situation as SituationId,
      option,
      { shape: data.shape, undertone: data.undertone, depth: data.depth, skinHex: "#000000" },
      data.owned as ZoneId[],
    );
    const { creditContext } = await import("./credit.server");
    const { claimGeneration } = await import("./credit-store.server");
    const { sql, userId } = await creditContext();
    // Consume before the paid call, including failures/timeouts: never retry a
    // possibly billable request automatically or let an attacker spend again.
    await claimGeneration(sql, userId, data.trialId, data.situation, data.photo, data.optionId);
    let edit: Response;
    try {
      edit = await fetch("https://api.x.ai/v1/images/edits", {
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
    } catch {
      throw new Error(
        "No pude conectar con xAI o la solicitud tardó demasiado. Inténtalo de nuevo.",
      );
    }
    if (!edit.ok) {
      console.warn("[ai-look] xAI edit failed", edit.status);
      throw new Error(imageApiError(edit.status));
    }
    let made: { data?: { url?: string; b64_json?: string }[] };
    try {
      made = await edit.json();
    } catch {
      throw new Error("xAI devolvió una respuesta de imagen no válida.");
    }
    const item = made?.data?.[0];
    if (item?.b64_json) return { imageUrl: `data:image/jpeg;base64,${item.b64_json}` };
    if (!item?.url) throw new Error("xAI no devolvió una imagen.");
    try {
      const file = await fetch(item.url, { signal: AbortSignal.timeout(20_000) });
      if (!file.ok) throw new Error("download failed");
      const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
      return {
        imageUrl: `data:${file.headers.get("content-type") ?? "image/jpeg"};base64,${bytes}`,
      };
    } catch {
      throw new Error("La imagen se creó, pero no pude descargarla desde xAI.");
    }
  });
