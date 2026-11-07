import { ArrowRight } from "lucide-react";
import {
  SHAPE_LABEL,
  TONE_LABEL,
  type FaceRead,
  type SituationId,
  situationById,
} from "@/lib/makeup/types";
import type { ReferenceCard } from "@/lib/makeup/imagine";

import type { PortraitAnalysis } from "@/lib/makeup/consultation";

export function OptionsScreen({
  analysis,
  onRetake,
  situation,
  read,
  summary,
  skinLine,
  preferences = "",
  cards,
  loading,
  error,
  onRetry,
  onChoose,
}: {
  analysis?: PortraitAnalysis | null;
  onRetake?: () => void;
  situation: SituationId;
  read: FaceRead | null;
  summary: string;
  skinLine: string;
  readingSkin?: boolean;
  preferences?: string;
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
      {read && !analysis && !error ? (
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm" role="status">
          Estoy analizando tu foto para preparar tres looks de maquillaje para{" "}
          {occasion.label.toLowerCase()}.
          {preferences
            ? ` Según tus preferencias: ${preferences}.`
            : " Adaptados a tus preferencias."}
        </p>
      ) : null}
      {!read ? (
        <p className="mt-4 text-sm text-blush">
          No pude leer este rostro. Prueba otra foto con buena luz y la cara visible.
        </p>
      ) : null}
      {analysis ? (
        <div className="mx-auto mt-4 max-w-2xl text-center text-sm">
          {summary ? <p>{summary}</p> : null}
          {analysis.forma_rostro || analysis.subtono_piel ? (
            <p className="mt-2">
              Como orientación para tu maquillaje:{" "}
              {[
                analysis.forma_rostro
                  ? `rostro ${SHAPE_LABEL[analysis.forma_rostro].toLowerCase()}`
                  : "",
                analysis.subtono_piel
                  ? `subtono ${TONE_LABEL[analysis.subtono_piel].toLowerCase()}`
                  : "",
              ]
                .filter(Boolean)
                .join(" y ")}
              .
            </p>
          ) : null}
          {analysis.observaciones ? <p className="mt-2">{analysis.observaciones}</p> : null}
          {analysis.advertencias.length ? (
            <details className="mt-2">
              <summary>Consejos para una foto más precisa</summary>
              {analysis.advertencias.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </details>
          ) : null}
        </div>
      ) : null}
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
      {onRetake ? (
        <button
          type="button"
          onClick={onRetake}
          className="mt-4 min-h-11 rounded-full border border-line px-5"
        >
          Usar otra foto
        </button>
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
                      ? "Preparando tu primera propuesta."
                      : "Preparando otra opción para ti."}
                  </p>
                </div>
              ))
            : null}
      </div>
      {cards?.some((item) => item.error) ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface"
        >
          Reintentar solo los looks fallidos
        </button>
      ) : null}
      <p className="mt-6 text-center text-sm text-muted">
        NEUSTA no guarda tu foto. Se envía a xAI para analizarla y generar los looks. Los tonos y
        acabados son orientativos.
      </p>
    </div>
  );
}
