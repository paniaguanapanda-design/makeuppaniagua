import { useState } from "react";
import { sendFeedback } from "@/lib/makeup/feedback";

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
      </section>
    );
  }

  const submit = async () => {
    if (rating < 1) return;
    setState("sending");
    try {
      const result = await sendFeedback({ data: { rating, comment, situation } });
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
      <div className="glass mt-5 rounded-3xl p-5">
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
        <label className="sr-only" htmlFor="neusta-opinion">
          Tu comentario
        </label>
        <textarea
          id="neusta-opinion"
          value={comment}
          maxLength={1000}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Cuéntanos qué te gustó o qué cambiarías…"
          className="mt-4 h-28 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
        />
        <button
          type="button"
          disabled={rating < 1 || state === "sending"}
          onClick={submit}
          className="bg-ink mt-4 min-h-12 w-full rounded-full px-6 font-semibold text-white disabled:opacity-50"
        >
          {state === "sending" ? "Enviando…" : "Enviar opinión"}
        </button>
        {state === "error" ? (
          <p className="mt-3 text-sm text-muted" role="alert">
            No pude enviarla. Inténtalo de nuevo en un momento.
          </p>
        ) : (
          <p className="mt-3 text-xs text-muted">
            Anónima. No pedimos nombre ni correo, ni guardamos tu foto.
          </p>
        )}
      </div>
    </section>
  );
}
