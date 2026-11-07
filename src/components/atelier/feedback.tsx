import { useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { FEEDBACK_TAGS, sendFeedback } from "@/lib/makeup/feedback";

const RATING_WORDS = ["", "No me gustó", "Regular", "Está bien", "Me gustó", "¡Me encantó!"];

type Tag = (typeof FEEDBACK_TAGS)[number];

export function FeedbackScreen({
  situation,
  look,
  source,
  onDone,
}: {
  situation: string;
  look: string;
  source: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function toggle(tag: Tag) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag],
    );
  }

  async function submit() {
    if (!rating || state === "sending") return;
    setState("sending");
    try {
      await sendFeedback({
        data: { rating, tags, comment: comment.slice(0, 1200), situation, look, source },
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
        <h1 className="text-4xl">Gracias</h1>
        <p className="mt-3 text-muted">Tu opinión nos ayuda a hacer NEUSTA mejor para ti.</p>
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
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <h1 className="text-center text-4xl leading-tight">
        ¿Cómo te fue con <span className="text-blush">{look ? `«${look}»` : "tu look"}</span>?
      </h1>
      <p className="mt-3 text-center text-sm text-muted">
        Estamos probando NEUSTA. Tu opinión decide qué mejoramos.
      </p>

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
          {RATING_WORDS[rating]}
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
        <span className="text-sm font-medium">¿Algo más? (opcional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1200))}
          placeholder="Qué te gustó, qué cambiarías, qué echaste en falta…"
          className="mt-2 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          rows={4}
        />
      </label>

      {state === "error" ? (
        <p className="mt-4 rounded-2xl bg-blush/10 px-4 py-3 text-sm text-blush" role="alert">
          No pude enviarla. Revisa tu conexión y prueba otra vez.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={rating === 0 || state === "sending"}
        className="mt-6 inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full bg-ink text-surface"
      >
        {state === "sending" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {rating === 0
          ? "Elige de 1 a 5 estrellas"
          : state === "sending"
            ? "Enviando…"
            : "Enviar opinión"}
      </button>

      <p className="mt-4 text-center text-xs text-muted">Anónimo. No guardamos tu foto.</p>
    </main>
  );
}
