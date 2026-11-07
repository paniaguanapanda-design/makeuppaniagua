import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

export const FEEDBACK_TAGS = [
  "Me encantó el look",
  "Fácil de seguir",
  "Me reconocí en la foto",
  "Tardó mucho",
  "No me reconocí",
  "Quiero más opciones",
] as const;

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.enum(FEEDBACK_TAGS)).max(FEEDBACK_TAGS.length),
  comment: z.string().max(1200),
  situation: z.string().max(40),
  look: z.string().max(80),
  source: z.string().max(20),
});

export const sendFeedback = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into feedback (rating, tags, comment, situation, look, source)
      values (${data.rating}, ${data.tags.join(" | ")}, ${data.comment.trim()}, ${data.situation}, ${data.look}, ${data.source})`;
    return { ok: true };
  });
