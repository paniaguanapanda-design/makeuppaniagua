import { ArrowRight } from "lucide-react";
import type { FaceRead, SituationId } from "@/lib/makeup/types";
import type { ReferenceCard } from "@/lib/makeup/imagine";
import type { FaceAnalysis } from "@/lib/makeup/analysis";
import { useLang } from "@/lib/i18n";

export function OptionsScreen({
  situation,
  read,
  analysis,
  analyzing,
  aiPending,
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
  /** True mientras la imagen con IA de esa tarjeta todavía no ha llegado. */
  aiPending: (cardId: string) => boolean;
  summary: string;
  skinLine: string;
  readingSkin: boolean;
  cards: ReferenceCard[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onChoose: (card: ReferenceCard) => void;
}) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="step-eyebrow text-center">{t("opt.step")}</p>
      <h1 className="mx-auto mt-3 max-w-3xl text-center text-4xl">
        {t("opt.title1")} <em>{t("opt.title2")}</em>
      </h1>
      <div className="hair" />
      <p className="text-center text-sm text-muted">
        {t("opt.sub", { occasion: t(`sit.${situation}`) })}
      </p>
      {analysis ? (
        <section
          className="glass mx-auto mt-6 max-w-xl rounded-[1.6rem] p-5 text-center"
          aria-label={t("opt.analysis")}
        >
          <p className="step-eyebrow">{t("opt.analysis")}</p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[11px] text-muted">{t("opt.face")}</dt>
              <dd className="font-medium">
                {t(`shape.${analysis.shape ?? read?.shape ?? "ovalado"}`)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">{t("opt.skin")}</dt>
              <dd className="font-medium">
                {analysis.skinType ? t(`skinType.${analysis.skinType}`) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted">{t("opt.circles")}</dt>
              <dd className="font-medium">{t(`circles.${analysis.darkCircles}`)}</dd>
            </div>
          </dl>
          {read ? (
            <p className="mt-3 text-xs text-muted">
              {t("opt.tone", {
                tone: t(`tone.${read.undertone}`).toLowerCase(),
                depth: t(`toneDepth.${read.depth}`).toLowerCase(),
              })}
            </p>
          ) : null}
          {analysis.quality ? <p className="mt-2 text-sm text-muted">{analysis.quality}</p> : null}
          {analysis.concerns.length ? (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {analysis.concerns.map((item) => (
                <span key={item} className="rounded-full bg-white/70 px-3 py-1 text-xs text-ink">
                  {t(`concern.${item}`)}
                </span>
              ))}
            </div>
          ) : null}
          {analysis.advice ? (
            <p className="mt-4 font-display text-lg leading-snug">
              <em>«{analysis.advice}»</em>
            </p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted">{t("opt.disclaimer")}</p>
        </section>
      ) : analyzing ? (
        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-muted" aria-live="polite">
          {t("opt.analyzing")}
        </p>
      ) : read ? (
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm">
          {t(`shape.${read.shape}`)} · {t(`tone.${read.undertone}`)} ·{" "}
          {t(`toneDepth.${read.depth}`)}. {t(`shapeNote.${read.shape}`)}
          {summary ? ` ${summary}.` : ""}
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-blush">{t("opt.unreadable")}</p>
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
            {t("common.retry")}
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
                aria-label={`${t(`level.${item.id}`)}: ${t(`line.${situation}.${item.id}`)}`}
                className="look-choice-card"
              >
                <span className="relative shrink-0">
                  <img src={item.imageUrl} alt="" className="look-choice-image object-cover" />
                  {aiPending(item.id) ? (
                    <span className="ai-badge" aria-live="polite">
                      {t("opt.aiPending")}
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 py-3 pr-4 text-left">
                  <span className="block font-display text-[1.4rem] leading-tight">
                    {t(`level.${item.id}`)}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    {t(`line.${situation}.${item.id}`)}
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
                    {item === 0 ? (readingSkin ? t("opt.load1") : t("opt.load1b")) : t("opt.load2")}
                  </p>
                </div>
              ))
            : null}
      </div>
      <p className="mt-6 text-center text-sm text-muted">{t("opt.privacy")}</p>
    </div>
  );
}
