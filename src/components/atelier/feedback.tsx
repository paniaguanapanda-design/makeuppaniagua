import { useState } from "react";
import { Star } from "lucide-react";

export function FeedbackScreen({
  onDone,
}: {
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    // Aquí puedes guardar el feedback (por ahora solo simulamos)
    console.log({ rating, comment });
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full border border-blush/30 bg-blush/10">
          <span className="text-3xl text-blush">✓</span>
        </div>
        <h1 className="text-3xl">Gracias por tu opinión</h1>
        <p className="mt-3 text-muted">Nos ayuda a hacer NEUSTA mejor para ti.</p>
        <button
          type="button"
          onClick={onDone}
          className="mt-8 min-h-12 rounded-full bg-ink px-8 text-surface"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-16 pt-10">
      <p className="text-center text-xs tracking-widest text-muted uppercase">NEUSTA</p>
      <h1 className="mt-4 text-center text-4xl leading-tight">
        ¿Cómo te fue <span className="text-blush">con tu</span> look?
      </h1>
      <p className="mt-3 text-center text-sm text-muted">Tu opinión nos ayuda a mejorar.</p>

      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1"
          >
            <Star
              className={`size-9 ${star <= rating ? "fill-blush text-blush" : "text-line"}`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos qué te gustó o qué cambiarías..."
        className="mt-6 w-full resize-none rounded-2xl border border-line bg-surface/70 px-4 py-3 text-sm backdrop-blur-sm"
        rows={4}
      />

      <button
        type="button"
        onClick={submit}
        disabled={rating === 0}
        className="mt-6 w-full min-h-12 rounded-full bg-blush text-white disabled:opacity-40"
      >
        Enviar opinión
      </button>

      <p className="mt-4 text-center text-xs text-muted">Anónimo. No guardamos tu foto.</p>
    </div>
  );
}
