import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

import { feedbackSchema, REVIEW_CONSENT_TEXT, REVIEW_CONSENT_VERSION } from "./feedback-schema";

type FeedbackEmailStatus = "sent" | "not-configured" | "failed";

async function sendFeedbackEmail({
  id,
  rating,
  comment,
  situation,
  displayName,
  contactEmail,
  publicationConsent,
  hasPhoto,
}: {
  id: string;
  rating: number;
  comment: string;
  situation?: string;
  displayName: string;
  contactEmail?: string;
  publicationConsent: boolean;
  hasPhoto: boolean;
}): Promise<FeedbackEmailStatus> {
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
        subject: "Nueva opinión para NEUSTA",
        text: [
          "Nueva opinión para NEUSTA",
          `Referencia: ${id}`,
          `Nombre: ${displayName || "No indicado"}`,
          `Correo privado (no publicar): ${contactEmail || "No indicado"}`,
          `Publicación: ${publicationConsent ? "PENDIENTE de revisión; autorización recibida" : "PRIVADA; sin autorización"}`,
          `Foto opcional: ${hasPhoto ? "Guardada para revisión; no se adjunta al correo" : "No adjunta"}`,
          ...(publicationConsent
            ? [`Autorización (${REVIEW_CONSENT_VERSION}): ${REVIEW_CONSENT_TEXT}`]
            : []),
          `Puntuación: ${rating}/5`,
          `Ocasión: ${situation || "No indicada"}`,
          "Comentario:",
          comment || "(Sin comentario)",
        ].join("\n"),
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

/** Siempre privada o pendiente: ninguna opinión se publica automáticamente. */
export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(feedbackSchema)
  .handler(async ({ data }): Promise<{ ok: true; emailStatus: FeedbackEmailStatus }> => {
    const sql = await getSql();
    const [opinion] = await sql<{ id: string | number }>`
      insert into opiniones (
        rating, comment, situation, display_name, contact_email, photo_data_url,
        publication_consent, consent_at, consent_version, consent_text, publication_status
      )
      values (
        ${data.rating}, ${data.comment}, ${data.situation ?? null},
        ${data.displayName || null}, ${data.contactEmail || null}, ${data.photo ?? null},
        ${data.publicationConsent}, case when ${data.publicationConsent} then now() else null end,
        ${data.publicationConsent ? REVIEW_CONSENT_VERSION : null},
        ${data.publicationConsent ? REVIEW_CONSENT_TEXT : null},
        ${data.publicationConsent ? "pending" : "private"}
      )
      returning id
    `;
    if (!opinion) throw new Error("No se pudo guardar la opinión.");
    const emailStatus = await sendFeedbackEmail({
      id: String(opinion.id),
      rating: data.rating,
      comment: data.comment,
      situation: data.situation,
      displayName: data.displayName,
      contactEmail: data.contactEmail,
      publicationConsent: data.publicationConsent,
      hasPhoto: Boolean(data.photo),
    });
    return { ok: true, emailStatus };
  });
