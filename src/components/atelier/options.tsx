import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { LookPlaceholder, StepLabel } from "@/components/atelier/ui";
import {
  DEPTH_LABEL,
  SHAPE_LABEL,
  SHAPE_NOTE,
  TONE_LABEL,
  type FaceRead,
  type SituationId,
  situationById,
} from "@/lib/makeup/types";
import type { FaceAnalysis, ReferenceCard } from "@/lib/makeup/imagine";

const WAITING = [
  "Leyendo la forma de tu rostro…",
  "Buscando tu subtono…",
  "Eligiendo colores para la ocasión…",
  "Aplicando el maquillaje a tu foto…",
  "Dando los últimos retoques…",
];

function useWaitingLine(active: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const timer = window.setInterval(
      () => setIndex((value) => Math.min(value + 1, WAITING.length - 1)),
      4500,
    );
    return () => window.clearInterval(timer);
  }, [active]);
  return { line: WAITING[index], progress: (index + 1) / WAITING.length };
}

export function OptionsScreen({
  situation,
  read,
  analysis,
  summary,
  skinLine,
  readingSkin,
  cards,
  loading,
  error,
  limited,
  onRetry,
  onChoose,
}: {
  situation: SituationId;
  read: FaceRead | null;
  analysis: FaceAnalysis | null;
  summary: string;
  skinLine: string;
  readingSkin: boolean;
  cards: ReferenceCard[] | null;
  loading: boolean;
  error: string | null;
  limited: boolean;
  onRetry: () => void;
  onChoose: (card: ReferenceCard) => void;
}) {
  const occasion = situationById(situation);
  const waiting = useWaitingLine(loading && !cards);

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <StepLabel step={4} extra={occasion.label} />
      <h1 className="mt-3 text-4xl">Tus looks</h1>

      {loading && !cards ? (
        <div className="mt-4" aria-live="polite">
          <p className="text-muted">{readingSkin ? waiting.line : "Preparando tus opciones…"}</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line/60">
            <div
              className="h-full rounded-full bg-blush transition-[width] duration-[4000ms] ease-out"
              style={{ width: `${Math.round(waiting.progress * 92)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">Suele tardar entre 15 y 40 segundos.</p>
        </div>
      ) : (
        <p className="mt-3 text-muted">
          Tres niveles pensados para tu rostro: natural, medio y glamuroso. Elige uno y te enseño
          los pasos.
        </p>
      )}

      {analysis ? (
        <section className="soft-card mt-5 p-4" aria-label="Análisis de tu maquilladora">
          <p className="text-xs font-medium tracking-widest text-blush uppercase">
            Lo que veo como maquilladora
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Rostro</dt>
              <dd className="font-medium">
                {SHAPE_LABEL[analysis.shape ?? read?.shape ?? "ovalado"]}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Piel</dt>
              <dd className="font-medium capitalize">{analysis.skinType || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Ojeras</dt>
              <dd className="font-medium capitalize">{analysis.darkCircles}</dd>
            </div>
            {read ? (
              <div>
                <dt className="text-xs text-muted">Tono</dt>
                <dd className="font-medium">
                  {TONE_LABEL[read.undertone]} · {DEPTH_LABEL[read.depth]}
                </dd>
              </div>
            ) : null}
          </dl>
          {analysis.quality ? <p className="mt-3 text-sm text-muted">{analysis.quality}</p> : null}
          {analysis.concerns.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {analysis.concerns.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-clay px-3 py-1 text-xs capitalize text-ink"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {analysis.advice ? (
            <p className="mt-3 border-t border-line pt-3 font-display text-lg leading-snug">
              «{analysis.advice}»
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted">
            Orientación de maquillaje, no un diagnóstico.
          </p>
        </section>
      ) : read ? (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Lo que veo en tu foto">
          {[SHAPE_LABEL[read.shape], TONE_LABEL[read.undertone], DEPTH_LABEL[read.depth]].map(
            (label) => (
              <span key={label} className="rounded-full bg-clay px-3 py-1 text-xs text-ink">
                {label}
              </span>
            ),
          )}
        </div>
      ) : !loading ? (
        <p className="mt-4 rounded-2xl bg-blush/10 px-4 py-3 text-sm text-blush">
          No pude leer bien este rostro. Prueba con otra foto con más luz.
        </p>
      ) : null}
      {read && !analysis && !loading ? (
        <p className="mt-3 text-sm text-muted">
          {SHAPE_NOTE[read.shape]}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : null}
      {skinLine && !analysis ? <p className="mt-2 text-sm text-muted">{skinLine}</p> : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-blush/30 bg-blush/5 p-4" role="alert">
          <p className="text-sm text-blush">
            No pude crear las imágenes esta vez. Puedes seguir con los pasos o reintentarlo.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-surface"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : null}
      {limited ? (
        <p className="mt-6 rounded-2xl bg-clay px-4 py-3 text-sm text-ink">
          Hoy ya has creado muchas imágenes, así que te enseño los looks sin foto. Los pasos y
          productos siguen siendo para ti. Mañana podrás volver a ver las referencias.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-5">
        {cards
          ? cards.map((item) => (
              <button
                key={item.id}
                type="button"
                data-testid={`option-${item.id}`}
                onClick={() => onChoose(item)}
                className="soft-card tap-card group overflow-hidden text-left"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={`Referencia del look ${item.title}`}
                    className="frame-portrait w-full object-cover"
                  />
                ) : (
                  <LookPlaceholder title={item.title} compact />
                )}
                <span className="flex items-center justify-between gap-3 px-4 py-4">
                  <span>
                    <span className="block font-display text-2xl">{item.title}</span>
                    <span className="mt-1 block text-sm text-muted">{item.line}</span>
                  </span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-surface transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </span>
              </button>
            ))
          : loading
            ? [0, 1, 2].map((item) => (
                <div key={item} className="soft-card overflow-hidden" aria-hidden="true">
                  <div className="frame-portrait skeleton" />
                  <div className="space-y-2 px-4 py-4">
                    <span className="skeleton block h-5 w-1/2 rounded" />
                    <span className="skeleton block h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))
            : null}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Tu foto solo se usa para crear estas referencias. No se guarda salvo que nos dejes tu reseña
        y lo autorices.
      </p>
    </main>
  );
}
