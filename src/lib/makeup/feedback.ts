import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { z } from "zod";
import { getSql } from "@/lib/db";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000),
  situation: z.string().max(40).optional(),
});

type FeedbackEmailStatus = "sent" | "not-configured" | "failed";

async function sendFeedbackEmail({
  id,
  rating,
  comment,
  situation,
}: {
  id: string;
  rating: number;
  comment: string;
  situation?: string;
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
        subject: "Nueva opinión anónima para NEUSTA",
        text: [
          "Nueva opinión anónima para NEUSTA",
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

/** Guarda una opinión sin solicitar datos identificativos ni enviar fotos. */
export const sendFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(feedbackSchema)
  .handler(async ({ data }): Promise<{ ok: true; emailStatus: FeedbackEmailStatus }> => {
    const sql = await getSql();
    const [opinion] = await sql<{ id: string | number }>`
      insert into opiniones (rating, comment, situation)
      values (${data.rating}, ${data.comment}, ${data.situation ?? null})
      returning id
    `;
    if (!opinion) throw new Error("No se pudo guardar la opinión.");
    const emailStatus = await sendFeedbackEmail({
      id: String(opinion.id),
      rating: data.rating,
      comment: data.comment,
      situation: data.situation,
    });
    return { ok: true, emailStatus };
  });
