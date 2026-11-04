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
      <p className="brand text-ink">ORLA</p>
      <h1 className="mx-auto mt-7 max-w-3xl text-center text-4xl sm:text-6xl">
        Tres looks <em>para ti</em>
      </h1>
      <div className="hair" />
      <p className="text-center text-sm text-muted">{occasion.label} · Elige tu favorito.</p>
      {read ? (
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm">
          {SHAPE_LABEL[read.shape]} · {TONE_LABEL[read.undertone]} · {DEPTH_LABEL[read.depth]}.{" "}
          {SHAPE_NOTE[read.shape]}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : (
        <p className="mt-4 text-sm text-blush">No pude leer este rostro, así que no armo una referencia genérica.</p>
      )}
      {skinLine ? <p className="mx-auto mt-2 max-w-2xl text-center text-sm">{skinLine}</p> : null}
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
                className="look-card overflow-hidden text-center"
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
                <div key={item} className="overflow-hidden rounded-[1.6rem] border border-line bg-surface">
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
      <p className="mt-6 text-center text-sm text-muted">Tu foto no se guarda.</p>
    </div>
  );
}
