import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
  situation: z.string().max(40).optional(),
});

/** Guarda una opinión anónima (sin foto, sin datos personales). */
export const sendFeedback = createServerFn({ method: "POST" })
  .validator(feedbackSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`
      insert into opiniones (rating, comment, situation)
      values (${data.rating}, ${data.comment}, ${data.situation ?? null})
    `;
    return { ok: true };
  });
