import { useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { CONSENT_DATA, CONSENT_PUBLISH, FEEDBACK_TAGS, sendFeedback } from "@/lib/makeup/feedback";

const RATING_WORDS = ["", "No me gustó", "Regular", "Está bien", "Me gustó", "¡Me encantó!"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Tag = (typeof FEEDBACK_TAGS)[number];

export function FeedbackScreen({
  situation,
  look,
  lookImage,
  photo,
  source,
  onDone,
}: {
  situation: string;
  look: string;
  lookImage: string;
  /** Su foto en JPEG (solo si la hizo con la cámara). */
  photo: string;
  source: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consentData, setConsentData] = useState(false);
  const [consentPublish, setConsentPublish] = useState(false);
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const emailOk = EMAIL.test(email.trim());
  const ready = rating > 0 && emailOk && consentData;

  function toggle(tag: Tag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  async function submit() {
    setTouched(true);
    if (!ready || state === "sending") return;
    setState("sending");
    try {
      await sendFeedback({
        data: {
          rating,
          tags,
          comment: comment.slice(0, 1200),
          name: name.trim().slice(0, 60),
          email: email.trim(),
          photo,
          lookImage,
          consentData: true,
          consentPublish,
          situation,
          look,
          source,
        },
      });
      setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="pop-in mb-6 grid size-16 place-items-center rounded-full bg-blush text-white">
          <Check className="size-8" strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="text-4xl">Gracias{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}</h1>
        <p className="mt-3 text-muted">Tu reseña nos ayuda a hacer NEUSTA mejor para ti.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-8 min-h-14 w-full rounded-full bg-ink px-8 text-surface"
        >
          Volver al inicio
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-8 pb-16">
      <h1 className="text-center text-4xl leading-tight">
        ¿Cómo te fue con <span className="text-blush">{look ? `«${look}»` : "tu look"}</span>?
      </h1>
      <p className="mt-3 text-center text-sm text-muted">Deja tu reseña. Nos ayuda a mejorar.</p>

      <fieldset className="mt-8">
        <legend className="sr-only">Valoración</legend>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} de 5 estrellas`}
              aria-pressed={rating === star}
              className="icon-button size-12"
            >
              <Star
                className={`size-9 transition-colors duration-150 ${star <= rating ? "fill-blush text-blush" : "text-line"}`}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <p className="mt-2 h-5 text-center text-sm text-blush" aria-live="polite">
          {touched && !rating ? "Elige de 1 a 5 estrellas" : RATING_WORDS[rating]}
        </p>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">¿Qué destacarías?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {FEEDBACK_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag)}
                className={`select-tile min-h-11 rounded-full border px-4 text-sm ${on ? "is-on" : ""}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Tu reseña</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1200))}
          placeholder="Qué te gustó, cómo te viste, qué cambiarías…"
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          rows={4}
        />
      </label>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium">Tu nombre (opcional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            autoComplete="given-name"
            placeholder="Cómo quieres que aparezca"
            className="mt-2 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Tu correo</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.slice(0, 160))}
            onBlur={() => email && setTouched(true)}
            placeholder="nombre@correo.com"
            aria-invalid={touched && !emailOk}
            className="mt-2 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          />
          {touched && !emailOk ? (
            <span className="mt-1 block text-xs text-blush">
              Escribe un correo válido para enviar tu reseña.
            </span>
          ) : null}
        </label>
      </div>

      {photo ? (
        <div className="soft-card mt-6 flex items-center gap-4 p-3">
          <img
            src={photo}
            alt="Tu foto, que se enviará con la reseña"
            className="size-16 rounded-xl object-cover"
          />
          <p className="text-sm text-muted">Esta es la foto que se enviará con tu reseña.</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-3 rounded-2xl bg-clay/60 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consentData}
            onChange={(e) => setConsentData(e.target.checked)}
            className="consent-check mt-0.5"
          />
          <span>
            {CONSENT_DATA} <span className="text-blush">*</span>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consentPublish}
            onChange={(e) => setConsentPublish(e.target.checked)}
            className="consent-check mt-0.5"
          />
          <span>{CONSENT_PUBLISH} (opcional)</span>
        </label>
        {touched && !consentData ? (
          <p className="text-xs text-blush">Necesitamos tu permiso para guardar la reseña.</p>
        ) : null}
        <p className="text-xs leading-relaxed text-muted">
          Tus datos solo se usan para lo que marques. Puedes pedir que los borremos cuando quieras
          respondiendo a cualquiera de nuestros correos.
        </p>
      </div>

      {state === "error" ? (
        <p className="mt-4 rounded-2xl bg-blush/10 px-4 py-3 text-sm text-blush" role="alert">
          No pude enviarla. Revisa tu conexión y prueba otra vez.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={state === "sending"}
        className={`mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-surface ${ready ? "" : "opacity-60"}`}
      >
        {state === "sending" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {state === "sending" ? "Enviando…" : "Enviar reseña"}
      </button>
    </main>
  );
}
