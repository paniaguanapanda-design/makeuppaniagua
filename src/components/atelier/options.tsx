import { ArrowRight } from "lucide-react";
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
      <p className="step-eyebrow text-center">Paso 4 de 4</p>
      <h1 className="mx-auto mt-3 max-w-3xl text-center text-4xl">
        {cards?.length === 1 ? "Un look" : cards?.length === 2 ? "Dos looks" : "Tres looks"}{" "}
        <em>para ti</em>
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
        <p className="mt-4 text-sm text-blush">
          No pude leer este rostro, así que no armo una referencia genérica.
        </p>
      )}
      {skinLine ? <p className="mx-auto mt-2 max-w-2xl text-center text-sm">{skinLine}</p> : null}
      {error ? (
        <div className="mt-6">
          <p className="text-sm text-blush">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface"
          >
            Reintentar
          </button>
        </div>
      ) : null}
      <div className="mt-7 flex flex-col gap-3">
        {cards
          ? cards.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`option-${item.id}`}
                onClick={() => onChoose(item)}
                disabled={!item.imageUrl}
                aria-busy={!item.imageUrl && !item.error}
                aria-label={`${item.title}: ${item.line}`}
                className="look-choice-card"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={`${item.title}, generado con Grok`}
                    className="look-choice-image object-cover"
                  />
                ) : (
                  <span
                    className={`look-choice-image ${item.error ? "bg-clay/60" : "animate-pulse bg-clay/60"}`}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1 py-3 pr-4 text-left">
                  <span className="block font-display text-[1.4rem] leading-tight">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.line}</span>
                  <span
                    className="mt-1 block text-xs leading-5"
                    role={item.error ? "alert" : "status"}
                  >
                    {item.error ??
                      (item.imageUrl ? "Generado con Grok" : "Grok está generando tu foto…")}
                  </span>
                </span>
                <span className="look-choice-arrow" aria-hidden="true">
                  <ArrowRight className="size-4" />
                </span>
              </button>
            ))
          : loading
            ? [0, 1, 2].map((item) => (
                <div key={item} className="look-choice-card">
                  <div className="look-choice-image animate-pulse bg-clay/60" />
                  <p className="flex-1 px-4 py-4 text-sm text-muted">
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
      {cards?.some((item) => item.error) ? (
        <p role="alert" className="mt-4 text-sm">
          Esta solicitud ya consumió su plaza. Vuelve al inicio para comenzar otra prueba si te
          queda crédito.
        </p>
      ) : null}
      <p className="mt-6 text-center text-sm text-muted">
        NEUSTA no guarda tu foto. Se envía a xAI para generar los looks.
      </p>
    </div>
  );
}
