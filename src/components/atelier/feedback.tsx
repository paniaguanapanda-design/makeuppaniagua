import { useState } from "react";
import { CONSENT_DATA, CONSENT_PUBLISH, sendFeedback } from "@/lib/makeup/feedback";

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

const TAGS = [
  "Me encantó el look",
  "Fácil de seguir",
  "Me reconocí en la foto",
  "Tardó mucho",
  "No me reconocí",
  "Quiero más opciones",
];

/** Reseña al final del flujo: estrellas, texto, foto opcional y consentimiento. */
export function FeedbackForm({
  situation,
  look,
  photo,
}: {
  situation?: string;
  look?: string;
  /** Su foto en JPEG, solo si la hizo con la cámara. */
  photo?: string;
}) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sharePhoto, setSharePhoto] = useState(true);
  const [consentData, setConsentData] = useState(false);
  const [consentPublish, setConsentPublish] = useState(false);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [emailStatus, setEmailStatus] = useState<"sent" | "not-configured" | "failed">("sent");

  if (state === "done") {
    return (
      <section className="mt-12 text-center" aria-live="polite">
        <h2 className="font-display text-3xl">
          Gracias{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""} <em>por tu reseña</em>
        </h2>
        <div className="hair" />
        <p className="text-muted">
          {emailStatus === "sent"
            ? "Nos ayuda a hacer NEUSTA mejor para ti."
            : "Tu reseña se guardó correctamente."}
        </p>
      </section>
    );
  }

  const ready = rating > 0 && consentData;

  const submit = async () => {
    setTouched(true);
    if (!ready || state === "sending") return;
    setState("sending");
    const text = [tags.length ? `[${tags.join(" · ")}]` : "", comment.trim()]
      .filter(Boolean)
      .join(" ");
    try {
      const result = await sendFeedback({
        data: {
          rating,
          comment: text.slice(0, 1000),
          situation,
          look,
          name: name.trim().slice(0, 60),
          photo: photo && sharePhoto ? photo : "",
          consentData: true,
          consentPublish,
        },
      });
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
      <p className="text-muted">Déjanos tu reseña. Nos ayuda a mejorar.</p>
      <div className="glass mt-5 rounded-3xl p-5 text-left">
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
        {touched && rating < 1 ? (
          <p className="mt-1 text-center text-xs text-blush">Elige de 1 a 5 estrellas.</p>
        ) : null}

        <p className="mt-5 text-sm font-medium text-ink">¿Qué destacarías?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setTags((list) => (on ? list.filter((t) => t !== tag) : [...list, tag]))
                }
                className={`min-h-10 rounded-full border px-3.5 text-sm transition-colors ${
                  on ? "border-blush bg-blush text-white" : "border-line bg-white/70 text-ink"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-sm font-medium text-ink" htmlFor="neusta-opinion">
          Tu reseña
        </label>
        <textarea
          id="neusta-opinion"
          value={comment}
          maxLength={900}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Qué te gustó, cómo te viste, qué cambiarías…"
          className="mt-2 h-28 w-full rounded-2xl border border-line bg-white p-3 text-base text-ink"
        />

        <label className="mt-4 block text-sm font-medium text-ink" htmlFor="neusta-nombre">
          Tu nombre <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="neusta-nombre"
          type="text"
          autoComplete="given-name"
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.target.value)}
          placeholder="Cómo quieres que aparezca"
          className="mt-2 min-h-12 w-full rounded-2xl border border-line bg-white px-3 text-base text-ink"
        />

        {photo ? (
          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-white/70 p-3 text-sm">
            <img
              src={photo}
              alt="Tu foto para la reseña"
              className="size-14 rounded-xl object-cover"
            />
            <span className="flex-1">Enviar mi foto con la reseña</span>
            <input
              type="checkbox"
              checked={sharePhoto}
              onChange={(event) => setSharePhoto(event.target.checked)}
              className="size-5 accent-[#a8475f]"
            />
          </label>
        ) : null}

        <div className="mt-4 space-y-3 rounded-2xl bg-white/60 p-4 text-sm">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentData}
              onChange={(event) => setConsentData(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[#a8475f]"
            />
            <span>
              {CONSENT_DATA} <span className="text-blush">*</span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentPublish}
              onChange={(event) => setConsentPublish(event.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-[#a8475f]"
            />
            <span>{CONSENT_PUBLISH} (opcional)</span>
          </label>
          {touched && !consentData ? (
            <p className="text-xs text-blush">Necesitamos tu permiso para guardar la reseña.</p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted">
            Usamos el correo de tu cuenta. Tus datos solo se usan para lo que marques y puedes pedir
            que los borremos cuando quieras.
          </p>
        </div>

        <button
          type="button"
          disabled={state === "sending"}
          onClick={submit}
          className={`bg-ink mt-5 min-h-12 w-full rounded-full px-6 font-semibold text-white ${ready ? "" : "opacity-60"}`}
        >
          {state === "sending" ? "Enviando…" : "Enviar reseña"}
        </button>
        {state === "error" ? (
          <p className="mt-3 text-center text-sm text-muted" role="alert">
            No pude enviarla. Inténtalo de nuevo en un momento.
          </p>
        ) : null}
      </div>
    </section>
  );
}
