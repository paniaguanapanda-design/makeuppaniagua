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
      <p className="text-xs tracking-widest text-muted uppercase">Paso 3 de 3 · {occasion.label}</p>
      <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Tus looks</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Elige el que más se acerque a lo que buscas. Puedes ver los pasos después.
      </p>

      {read ? (
        <p className="mt-4 max-w-2xl text-sm">
          {SHAPE_LABEL[read.shape]} · {TONE_LABEL[read.undertone]} · {DEPTH_LABEL[read.depth]}.{" "}
          {SHAPE_NOTE[read.shape]}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : (
        <p className="mt-4 text-sm text-blush">No pude leer bien este rostro. Prueba con otra foto.</p>
      )}

      {skinLine ? <p className="mt-2 max-w-2xl text-sm">{skinLine}</p> : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-blush/30 bg-blush/5 p-4">
          <p className="text-sm text-blush">{error}</p>
          <button type="button" onClick={onRetry} className="mt-3 min-h-11 rounded-full bg-ink px-5 text-surface">
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards
          ? cards.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`option-${item.id}`}
                onClick={() => onChoose(item)}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-blush"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="frame-portrait w-full object-cover" />
                ) : (
                  <div className="frame-portrait flex items-center justify-center bg-clay/30">
                    <span className="text-sm text-muted">Referencia visual no disponible</span>
                  </div>
                )}
                <span className="block px-4 py-4">
                  <span className="block font-display text-2xl">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted">{item.line}</span>
                </span>
              </button>
            ))
          : loading
            ? [0, 1, 2].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="frame-portrait animate-pulse bg-clay/40" />
                  <p className="px-4 py-4 text-sm text-muted">
                    {item === 0
                      ? readingSkin
                        ? "Analizando tu rostro…"
                        : "Preparando tus opciones…"
                      : "Generando otra opción…"}
                  </p>
                </div>
              ))
            : null}
      </div>

      <p className="mt-6 text-sm text-muted">
        La foto no se guarda. Se usa solo para crear estas referencias.
      </p>
    </div>
  );
}
