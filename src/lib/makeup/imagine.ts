import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { imageGenerationConfig } from "@/lib/makeup/image-config";
import { optionsFor, type OptionId } from "@/lib/makeup/references";
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
  owned: z
    .array(
      z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"]),
    )
    .max(8),
  skin: z.string().max(300),
  photo: z.string().startsWith("data:image/jpeg;base64,").max(1_600_000),
  requestId: z.string().uuid(),
});

export type ReferenceCard = {
  id: OptionId;
  title: string;
  line: string;
  /** Zonas que lleva este look. */
  zones: ZoneId[];
  /** Solo contiene la edición devuelta por Grok; nunca un filtro local. */
  imageUrl: string;
  error?: string;
};

export type ReferenceResult = {
  trialId: string;
  remaining: number;
  cards: ReferenceCard[];
  skinSeen: string;
  skinFromPhoto: boolean;
};

/** Catálogo de las referencias que se generarán con Grok. */
export const referenceLooks = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ReferenceResult> => {
    const situation = data.situation as SituationId;
    const config = imageGenerationConfig();
    if (!config.enabled)
      throw new Error("La generación con Grok está desactivada. No se aplicarán filtros locales.");
    if (!process.env.XAI_API_KEY) throw new Error("Falta configurar Grok en el servidor.");
    const { creditContext } = await import("./credit.server");
    const { reserveTrial, remainingCredit } = await import("./credit-store.server");
    const { sql, userId } = await creditContext();
    const trialId = await reserveTrial(sql, userId, data.requestId, situation, data.photo);
    const cards: ReferenceCard[] = optionsFor(situation)
      .slice(0, config.max)
      .map((option) => ({
        id: option.id,
        title: option.title,
        line: option.line,
        zones: option.zones,
        imageUrl: "",
      }));
    return {
      cards,
      skinSeen: data.skin.trim(),
      skinFromPhoto: false,
      trialId,
      remaining: await remainingCredit(sql, userId),
    };
  });
