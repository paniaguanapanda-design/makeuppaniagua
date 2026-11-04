import {
  DEPTH_LABEL,
  SHAPE_LABEL,
  SHAPE_NOTE,
  TONE_LABEL,
  type FaceRead,
  type SituationId,
  situationById,
} from "@/lib/makeup/types";
import type { ReferenceCard } from "@/lib/makeup/imagine";

export function OptionsScreen({
  situation,
  read,
  summary,
  skinLine,
  readingSkin,
  cards,
  loading,
  error,
  onRetry,
  onChoose,
}: {
  situation: SituationId;
  read: FaceRead | null;
  summary: string;
  skinLine: string;
  readingSkin: boolean;
  cards: ReferenceCard[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onChoose: (card: ReferenceCard) => void;
}) {
  const occasion = situationById(situation);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">{occasion.label}</p>
      <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl">Tres formas de quedar</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Cada imagen es una referencia de cómo quedaría en este rostro. Van de casi nada a un look más hecho:
        las primeras usan pocos productos y no saturan. Elige una. Los pasos llegan después.
      </p>
      {read ? (
        <p className="mt-4 max-w-2xl text-sm">
          {SHAPE_LABEL[read.shape]} · {TONE_LABEL[read.undertone]} · {DEPTH_LABEL[read.depth]}.{" "}
          {SHAPE_NOTE[read.shape]}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : (
        <p className="mt-4 text-sm text-blush">No pude leer este rostro, así que no armo una referencia genérica.</p>
      )}
      {skinLine ? <p className="mt-2 max-w-2xl text-sm">{skinLine}</p> : null}
      {error ? (
        <div className="mt-6">
          <p className="text-sm text-blush">{error}</p>
          <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface">
            Reintentar
          </button>
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards
          ? cards.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`option-${item.id}`}
                onClick={() => onChoose(item)}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left"
              >
                <img src={item.imageUrl} alt="" className="frame-portrait w-full object-cover" />
                <span className="block px-4 py-4">
                  <span className="block font-display text-2xl">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted">{item.line}</span>
                </span>
              </button>
            ))
          : loading
            ? [0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="frame-portrait animate-pulse bg-clay/40" />
                  <p className="px-4 py-4 text-sm text-muted">
                    {item === 0
                      ? readingSkin
                        ? "Miro la piel en la foto y ajusto el maquillaje."
                        : "Ajustando el maquillaje a esta cara."
                      : "Preparando otra opción."}
                  </p>
                </div>
              ))
            : null}
      </div>
      <p className="mt-6 text-sm text-muted">
        La foto no se guarda. Se usa un momento para crear estas referencias.
      </p>
    </div>
  );
}
