import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { z } from "zod";
import { getSql } from "@/lib/db";

/** Textos de la cláusula, compartidos por el formulario y el correo. */
export const CONSENT_DATA =
  "Acepto que NEUSTA guarde mi correo, mi foto y mi reseña para mejorar el servicio y contactarme sobre ella.";
export const CONSENT_PUBLISH =
  "Autorizo que NEUSTA publique mi reseña, mi nombre y mi foto en su web y redes.";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
  situation: z.string().max(40).optional(),
  look: z.string().max(80).optional(),
  name: z.string().trim().max(60).optional(),
  photo: z
    .union([z.literal(""), z.string().startsWith("data:image/jpeg;base64,").max(1_600_000)])
    .optional(),
  consentData: z.literal(true),
  consentPublish: z.boolean(),
});

type Review = {
  id: string;
  rating: number;
  comment: string;
  situation?: string;
  look?: string;
  name: string;
  email: string;
  photo: string;
  consentPublish: boolean;
};

type FeedbackEmailStatus = "sent" | "not-configured" | "failed";

async function sendFeedbackEmail(review: Review): Promise<FeedbackEmailStatus> {
  const { id, rating, comment, situation } = review;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.FEEDBACK_EMAIL_TO?.trim();
  const from = process.env.FEEDBACK_EMAIL_FROM?.trim();
  if (!apiKey || !to || !from) return "not-configured";

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `neusta-feedback-${id}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nueva reseña NEUSTA · ${rating}/5${review.consentPublish ? " · se puede publicar" : ""}`,
        reply_to: review.email || undefined,
        text: [
          "Nueva reseña para NEUSTA",
          `Puntuación: ${rating}/5`,
          `Nombre: ${review.name || "No indicado"}`,
          `Correo: ${review.email || "No disponible"}`,
          `Ocasión: ${situation || "No indicada"}`,
          `Look elegido: ${review.look || "No indicado"}`,
          `Se puede publicar: ${review.consentPublish ? "Sí, lo autorizó" : "No, solo uso interno"}`,
          `Foto: ${review.photo ? "adjunta" : "no envió foto"}`,
          "",
          "Reseña:",
          comment || "(Sin comentario)",
        ].join("\n"),
        attachments: review.photo
          ? [{ filename: `resena-${id}.jpg`, content: review.photo.split(",")[1] }]
          : undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error(
      "[feedback] Resend request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return "failed";
  }

  if (!response.ok) {
    console.error(`[feedback] Resend returned HTTP ${response.status}`);
    return "failed";
  }

  return "sent";
}

/** Guarda la reseña con el correo de la cuenta y, si la envía, su foto. Requiere su consentimiento. */
export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(feedbackSchema)
  .handler(async ({ data, context }): Promise<{ ok: true; emailStatus: FeedbackEmailStatus }> => {
    const sql = await getSql();
    const [account] = await sql<{
      email: string;
    }>`select email from "user" where id = ${context.userId}`;
    const email = account?.email ?? "";
    const name = data.name ?? "";
    const photo = data.photo ?? "";
    const [opinion] = await sql<{ id: string | number }>`
      insert into opiniones
        (rating, comment, situation, look, name, email, photo, consent_data, consent_publish)
      values
        (${data.rating}, ${data.comment}, ${data.situation ?? null}, ${data.look ?? ""}, ${name},
         ${email}, ${photo}, ${data.consentData}, ${data.consentPublish})
      returning id
    `;
    if (!opinion) throw new Error("No se pudo guardar la opinión.");
    const emailStatus = await sendFeedbackEmail({
      id: String(opinion.id),
      rating: data.rating,
      comment: data.comment,
      situation: data.situation,
      look: data.look,
      name,
      email,
      photo,
      consentPublish: data.consentPublish,
    });
    return { ok: true, emailStatus };
  });

export type AdminReview = {
  id: number;
  createdAt: string;
  rating: number;
  comment: string;
  name: string;
  email: string;
  photo: string;
  consentPublish: boolean;
  situation: string;
  look: string;
};

/** Lista privada de reseñas para el equipo. Protegida con la clave REVIEWS_ADMIN_KEY. */
export const listReviews = createServerFn({ method: "POST" })
  .validator(z.object({ key: z.string().max(200), onlyPublic: z.boolean().optional() }))
  .handler(async ({ data }): Promise<AdminReview[]> => {
    const expected = process.env.REVIEWS_ADMIN_KEY;
    if (!expected) throw new Error("Falta configurar REVIEWS_ADMIN_KEY en el servidor.");
    if (data.key !== expected) throw new Error("Clave incorrecta.");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      created_at: string | Date;
      rating: number;
      comment: string;
      name: string;
      email: string;
      photo: string;
      consent_publish: boolean;
      situation: string | null;
      look: string;
    }>`
      select id, created_at, rating, comment, name, email, photo, consent_publish, situation, look
      from opiniones
      where ${data.onlyPublic ? true : null}::boolean is null or consent_publish
      order by created_at desc
      limit 500`;
    return rows.map((row) => ({
      id: Number(row.id),
      createdAt: new Date(row.created_at).toISOString(),
      rating: row.rating,
      comment: row.comment,
      name: row.name,
      email: row.email,
      photo: row.photo,
      consentPublish: row.consent_publish,
      situation: row.situation ?? "",
      look: row.look,
    }));
  });
