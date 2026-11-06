import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { imageGenerationConfig } from "@/lib/makeup/image-config";
import { optionsFor, type OptionId } from "@/lib/makeup/references";
import type { SituationId, ZoneId } from "@/lib/makeup/types";

const schema = z.object({
  situation: z.enum(["dia", "oficina", "entrevista", "cita", "boda", "fiesta", "fotos", "editorial"]),
  owned: z.array(z.enum(["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios", "fijador"])).max(8),
  skin: z.string().max(300),
});

export type ReferenceCard = {
  id: OptionId;
  title: string;
  line: string;
  /** Zonas que lleva este look. */
  zones: ZoneId[];
  generateAi: boolean;
  /** Se rellena en el celular, pintando sobre la foto. La foto nunca sale del dispositivo. */
  imageUrl: string;
};

export type ReferenceResult = {
  cards: ReferenceCard[];
  skinSeen: string;
  skinFromPhoto: boolean;
};

/** Las cinco referencias de la ocasión. Sin servicios externos: el dibujo se hace en el celular. */
export const referenceLooks = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }): Promise<ReferenceResult> => {
    const situation = data.situation as SituationId;
    const config = imageGenerationConfig();
    const cards: ReferenceCard[] = optionsFor(situation).map((option, index) => ({
      id: option.id,
      title: option.title,
      line: option.line,
      zones: option.zones,
      generateAi: config.enabled && index < config.max,
      imageUrl: "",
    }));
    return { cards, skinSeen: data.skin.trim(), skinFromPhoto: false };
  });
