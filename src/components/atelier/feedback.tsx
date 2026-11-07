import { useState } from "react";
import { sendFeedback } from "@/lib/makeup/feedback";
import {
  feedbackSchema,
  REVIEW_CONSENT_TEXT,
  REVIEW_PHOTO_MAX_BYTES,
} from "@/lib/makeup/feedback-schema";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-9" aria-hidden="true">
      <path
        d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
        fill={filled ? "#a8475f" : "none"}
        stroke="#a8475f"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Formulario de opinión al final del flujo. */
export function FeedbackForm({ situation }: { situation?: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [publicationConsent, setPublicationConsent] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoLoading, setPhotoLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"sent" | "not-configured" | "failed">("sent");

  if (state === "done") {
    return (
      <section className="mt-12 text-center" aria-live="polite">
        <h2 className="font-display text-3xl">
          Gracias por <em>tu opinión</em>
        </h2>
        <div className="hair" />
        <p className="text-muted">
          {emailStatus === "sent"
            ? "Nos ayuda a hacer NEUSTA mejor para ti."
            : emailStatus === "not-configured"
              ? "Tu opinión se guardó, pero el aviso por correo aún no está configurado."
              : "Tu opinión se guardó, pero no se pudo enviar el aviso por correo."}
        </p>
        <p className="mt-3 text-sm text-muted">
          {publicationConsent
            ? "Tu reseña queda pendiente de revisión. No se publicará automáticamente."
            : "Tu opinión es privada y no se publicará."}
        </p>
      </section>
    );
  }

  const submit = async () => {
    if (state === "sending" || photoLoading) return;
    const parsed = feedbackSchema.safeParse({
      rating,
      comment,
      situation,
      displayName,
      contactEmail: contactEmail.trim(),
      publicationConsent,
      photo: publicationConsent ? photo : undefined,
    });
    if (!parsed.success) {
      setValidationError(
        "Revisa la puntuación y el correo. Para autorizar la publicación, añade nombre y comentario.",
      );
      return;
    }
    setValidationError("");
    setState("sending");
    try {
      const result = await sendFeedback({ data: parsed.data });
      setEmailStatus(result.emailStatus);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <section className="mt-12 text-center">
      <h2 className="font-display text-3xl">
        ¿Cómo te fue <em>con tu look?</em>
      </h2>
      <div className="hair" />
      <p className="text-muted">Tu opinión nos ayuda a mejorar.</p>
      <form
        className="glass mt-5 rounded-3xl p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <fieldset className="min-w-0" disabled={state === "sending"}>
          <legend className="sr-only">Tu opinión</legend>
          <div className="flex justify-center gap-2" role="radiogroup" aria-label="Puntuación">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} de 5`}
                className="min-h-11 min-w-11"
                onClick={() => setRating(n)}
              >
                <Star filled={n <= rating} />
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-4 text-left">
            <label className="block text-sm" htmlFor="neusta-review-name">
              Nombre que quieres mostrar ({publicationConsent ? "obligatorio" : "opcional"})
              <input
                id="neusta-review-name"
                autoComplete="nickname"
                value={displayName}
                maxLength={80}
                required={publicationConsent}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
              />
            </label>
            <label className="block text-sm" htmlFor="neusta-review-email">
              Correo de contacto (opcional y privado; nunca se publica)
              <input
                id="neusta-review-email"
                type="email"
                autoComplete="email"
                value={contactEmail}
                maxLength={254}
                onChange={(event) => setContactEmail(event.target.value)}
                className="mt-1 min-h-12 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
              />
            </label>
          </div>
          <label className="sr-only" htmlFor="neusta-opinion">
            Tu comentario
          </label>
          <textarea
            id="neusta-opinion"
            value={comment}
            maxLength={1000}
            required={publicationConsent}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Cuéntanos qué te gustó o qué cambiarías…"
            className="mt-4 h-28 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
          />
          <label className="mt-4 flex min-h-11 items-start gap-3 text-left text-sm">
            <input
              type="checkbox"
              checked={publicationConsent}
              disabled={photoLoading}
              onChange={(event) => {
                setPublicationConsent(event.target.checked);
                if (!event.target.checked) setPhoto(undefined);
              }}
              className="mt-1 size-5 shrink-0 accent-[#a8475f]"
            />
            <span>{REVIEW_CONSENT_TEXT} Es opcional: puedes enviar tu opinión sin autorizar.</span>
          </label>
          {publicationConsent ? (
            <div className="mt-4 text-left text-sm">
              <label htmlFor="neusta-review-photo">
                Foto para tu reseña (opcional, JPG o PNG, hasta 300 KB)
              </label>
              <input
                id="neusta-review-photo"
                type="file"
                accept="image/jpeg,image/png"
                disabled={photoLoading}
                className="mt-2 block min-h-11 w-full max-w-full"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPhoto(undefined);
                  setValidationError("");
                  if (!file) return;
                  if (
                    !["image/jpeg", "image/png"].includes(file.type) ||
                    file.size > REVIEW_PHOTO_MAX_BYTES
                  ) {
                    setValidationError("Elige una foto JPG o PNG de hasta 300 KB.");
                    event.target.value = "";
                    return;
                  }
                  const reader = new FileReader();
                  setPhotoLoading(true);
                  reader.onload = () => {
                    setPhoto(String(reader.result));
                    setPhotoLoading(false);
                  };
                  reader.onerror = () => {
                    setValidationError("No se pudo leer la foto. Prueba con otra.");
                    setPhotoLoading(false);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {photo ? (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={photo}
                    alt="Foto elegida para tu reseña"
                    className="size-16 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    className="min-h-11 underline"
                    onClick={() => {
                      setPhoto(undefined);
                      const input = document.getElementById(
                        "neusta-review-photo",
                      ) as HTMLInputElement | null;
                      if (input) input.value = "";
                    }}
                  >
                    Quitar foto
                  </button>
                </div>
              ) : null}
              <p className="mt-2 text-muted">
                Solo guardamos esta foto si la adjuntas. No reutilizamos la del análisis de
                maquillaje.
              </p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={rating < 1 || state === "sending" || photoLoading}
            className="bg-ink mt-4 min-h-12 w-full rounded-full px-6 font-semibold text-white disabled:opacity-50"
          >
            {state === "sending" ? "Enviando…" : "Enviar opinión"}
          </button>
          {validationError ? (
            <p className="mt-3 text-sm text-muted" role="alert">
              {validationError}
            </p>
          ) : null}
          {state === "error" ? (
            <p className="mt-3 text-sm text-muted" role="alert">
              No pude enviarla. Inténtalo de nuevo en un momento.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted">
              El correo siempre es privado. Solo usaremos tu reseña como testimonio si lo autorizas
              y la aprobamos.
            </p>
          )}
        </fieldset>
      </form>
    </section>
  );
}
