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

/** Texto de la cláusula, guardado aquí para que la pantalla y la política coincidan. */
export const CONSENT_DATA =
  "Acepto que NEUSTA guarde mi correo, mi foto y mi reseña para mejorar el servicio y contactarme sobre ella.";
export const CONSENT_PUBLISH =
  "Autorizo que NEUSTA publique mi reseña, mi nombre y mi foto en su web y redes.";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.enum(FEEDBACK_TAGS)).max(FEEDBACK_TAGS.length),
  comment: z.string().max(1200),
  name: z.string().max(60),
  email: z.string().trim().email().max(160),
  photo: z.union([z.literal(""), z.string().startsWith("data:image/jpeg").max(1_600_000)]),
  lookImage: z.string().max(2000),
  consentData: z.literal(true),
  consentPublish: z.boolean(),
  situation: z.string().max(40),
  look: z.string().max(80),
  source: z.string().max(20),
});

export const sendFeedback = createServerFn({ method: "POST" })
  .validator(schema)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      insert into feedback
        (rating, tags, comment, name, email, photo, look_image, consent_data, consent_publish, situation, look, source)
      values
        (${data.rating}, ${data.tags.join(" | ")}, ${data.comment.trim()}, ${data.name.trim()},
         ${data.email.toLowerCase()}, ${data.photo}, ${data.lookImage}, ${data.consentData},
         ${data.consentPublish}, ${data.situation}, ${data.look}, ${data.source})`;
    return { ok: true };
  });

export type Review = {
  id: number;
  createdAt: string;
  rating: number;
  tags: string;
  comment: string;
  name: string;
  email: string;
  photo: string;
  lookImage: string;
  consentPublish: boolean;
  situation: string;
  look: string;
  source: string;
};

/** Lista privada de reseñas. Protegida con la clave REVIEWS_ADMIN_KEY. */
export const listReviews = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().max(200), onlyPublic: z.boolean().optional() }))
  .handler(async ({ data }): Promise<Review[]> => {
    const expected = process.env.REVIEWS_ADMIN_KEY;
    if (!expected) throw new Error("Falta configurar REVIEWS_ADMIN_KEY en el servidor.");
    if (data.key !== expected) throw new Error("Clave incorrecta.");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      created_at: string | Date;
      rating: number;
      tags: string;
      comment: string;
      name: string;
      email: string;
      photo: string;
      look_image: string;
      consent_publish: boolean;
      situation: string;
      look: string;
      source: string;
    }>`
      select id, created_at, rating, tags, comment, name, email, photo, look_image,
             consent_publish, situation, look, source
      from feedback
      where ${data.onlyPublic ? true : null}::boolean is null or consent_publish
      order by created_at desc
      limit 500`;
    return rows.map((row) => ({
      id: Number(row.id),
      createdAt: new Date(row.created_at).toISOString(),
      rating: row.rating,
      tags: row.tags,
      comment: row.comment,
      name: row.name,
      email: row.email,
      photo: row.photo,
      lookImage: row.look_image,
      consentPublish: row.consent_publish,
      situation: row.situation,
      look: row.look,
      source: row.source,
    }));
  });
