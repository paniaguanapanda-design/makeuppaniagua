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
import type { FaceAnalysis } from "@/lib/makeup/analysis";

export function OptionsScreen({
  situation,
  read,
  analysis,
  analyzing,
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
  analysis: FaceAnalysis | null;
  analyzing: boolean;
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
        Tres looks <em>para ti</em>
      </h1>
      <div className="hair" />
      <p className="text-center text-sm text-muted">
        {occasion.label} · Natural, medio o glamuroso. Elige tu favorito.
      </p>
      {analysis ? (
        <section
          className="glass mx-auto mt-6 max-w-xl rounded-[1.6rem] p-5 text-center"
          aria-label="Lo que veo como maquilladora"
        >
          <p className="step-eyebrow">Lo que veo como maquilladora</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[11px] text-muted">Rostro</dt>
              <dd className="font-medium">
                {SHAPE_LABEL[analysis.shape ?? read?.shape ?? "ovalado"]}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">Piel</dt>
              <dd className="font-medium capitalize">{analysis.skinType || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">Ojeras</dt>
              <dd className="font-medium capitalize">{analysis.darkCircles}</dd>
            </div>
          </dl>
          {read ? (
            <p className="mt-3 text-xs text-muted">
              Tono {TONE_LABEL[read.undertone].toLowerCase()} ·{" "}
              {DEPTH_LABEL[read.depth].toLowerCase()}
            </p>
          ) : null}
          {analysis.quality ? <p className="mt-2 text-sm text-muted">{analysis.quality}</p> : null}
          {analysis.concerns.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {analysis.concerns.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/70 px-3 py-1 text-xs capitalize text-ink"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {analysis.advice ? (
            <p className="mt-4 font-display text-lg leading-snug">
              <em>«{analysis.advice}»</em>
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted">
            Orientación de maquillaje, no un diagnóstico.
          </p>
        </section>
      ) : analyzing ? (
        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-muted" aria-live="polite">
          Estoy mirando tu rostro y tu piel como lo haría una maquilladora…
        </p>
      ) : read ? (
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm">
          {SHAPE_LABEL[read.shape]} · {TONE_LABEL[read.undertone]} · {DEPTH_LABEL[read.depth]}.{" "}
          {SHAPE_NOTE[read.shape]}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-blush">
          No pude leer este rostro, así que no armo una referencia genérica.
        </p>
      )}
      {skinLine && !analysis ? (
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm">{skinLine}</p>
      ) : null}
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
                aria-label={`${item.title}: ${item.line}`}
                className="look-choice-card"
              >
                <img src={item.imageUrl} alt="" className="look-choice-image object-cover" />
                <span className="min-w-0 flex-1 py-3 pr-4 text-left">
                  <span className="block font-display text-[1.4rem] leading-tight">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">{item.line}</span>
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
      <p className="mt-6 text-center text-sm text-muted">
        Tu foto solo se usa para crear tus looks. No se guarda salvo que la compartas en tu reseña.
      </p>
    </div>
  );
}
