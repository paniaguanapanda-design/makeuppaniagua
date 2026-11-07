import { hersForZone, type PersonBrief } from "@/lib/makeup/profile";
import { optionById, visibleZones, type OptionId } from "@/lib/makeup/references";
import {
  ZONE_LABEL,
  type LookPlan,
  type SituationId,
  type ZoneId,
  situationById,
} from "@/lib/makeup/types";
import type { ReferenceCard } from "@/lib/makeup/imagine";
import { LookPlaceholder, StepLabel } from "@/components/atelier/ui";

export function StepsScreen({
  situation,
  card,
  plan,
  error,
  onRetry,
  ownedZones,
  note,
  skin,
  skinFromPhoto,
  kit,
  summary,
}: {
  situation: SituationId;
  card: ReferenceCard;
  plan: LookPlan | null;
  error: string | null;
  onRetry: () => void;
  ownedZones: ZoneId[];
  note: string;
  skin: string;
  skinFromPhoto: boolean;
  kit: PersonBrief["kit"] | null;
  summary: string;
}) {
  const occasion = situationById(situation);
  const option = optionById(situation, card.id as OptionId);
  const zones = visibleZones(option, ownedZones);
  const steps = (plan?.steps ?? []).filter((step) => zones.includes(step.zone));
  const missingCost = steps
    .filter(
      (step) => !(kit && hersForZone({ age: "joven", tastes: [], note, skin, kit }, step.zone)),
    )
    .reduce((sum, step) => sum + step.product.priceEur, 0);

  return (
    <main className="mx-auto max-w-md px-5 pb-8 pt-6">
      <StepLabel step={5} extra={occasion.label} />
      <h1 data-testid="look-title" className="mt-3 text-4xl">
        {card.title}
      </h1>
      <p className="mt-3 text-muted">{card.line}</p>

      <div className="mt-6">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={`Referencia del look ${card.title}`}
            data-testid="reference-image"
            className="frame-portrait w-full rounded-[1.5rem] border border-line object-cover"
          />
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-line">
            <LookPlaceholder title={card.title} compact />
          </div>
        )}
        {card.imageUrl ? (
          <p className="mt-2 text-xs text-muted">
            Referencia de cómo quedaría. No es un filtro sobre tu foto.
          </p>
        ) : null}
      </div>

      {summary || note || skin ? (
        <details className="soft-card mt-5 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Lo que he tenido en cuenta</summary>
          <div className="mt-2 space-y-2 text-muted">
            {summary ? <p>{summary}.</p> : null}
            {note ? <p>Lo que usas: {note}</p> : null}
            {skin ? (
              <p>
                {skinFromPhoto ? "En la foto (no es un diagnóstico)" : "Tu piel"}: {skin}
              </p>
            ) : null}
          </div>
        </details>
      ) : null}

      <div className="mt-6">
        {error ? (
          <div className="rounded-2xl border border-blush/30 bg-blush/5 p-4" role="alert">
            <p className="text-sm text-blush">No pude cargar los productos.</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-11 rounded-full bg-ink px-5 text-surface"
            >
              Reintentar
            </button>
          </div>
        ) : null}
        {plan ? (
          <aside className="flex items-center gap-4 rounded-2xl bg-clay/60 p-4">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-full bg-surface font-display text-lg text-blush"
              aria-hidden="true"
            >
              {plan.stylist.name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Look firmado por</p>
              <p className="font-display text-xl leading-tight">{plan.stylist.name}</p>
              <p className="text-xs text-muted">
                {plan.stylist.city} · {plan.stylist.years} años de oficio
              </p>
            </div>
          </aside>
        ) : !error ? (
          <div className="space-y-3" aria-label="Cargando los pasos">
            {[0, 1, 2].map((item) => (
              <div key={item} className="soft-card space-y-2 p-4">
                <span className="skeleton block h-3 w-1/4 rounded" />
                <span className="skeleton block h-5 w-2/3 rounded" />
                <span className="skeleton block h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : null}
        {plan ? <h2 className="mt-8 font-display text-2xl">Paso a paso</h2> : null}
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((step, index) => (
            <li key={step.order} className="soft-card flex gap-4 px-4 py-4">
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-blush text-sm font-medium text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-widest text-muted uppercase">
                  {ZONE_LABEL[step.zone]}
                </p>
                <p className="mt-1 font-display text-xl leading-snug">{step.title}</p>
                <p className="mt-2 text-sm">{step.instruction}</p>
                {(() => {
                  const hers = kit
                    ? hersForZone({ age: "joven", tastes: [], note, skin, kit }, step.zone)
                    : "";
                  return hers ? (
                    <p className="mt-3 rounded-xl bg-blush/10 px-3 py-2 text-sm">
                      Usa lo que ya tienes: {hers}
                    </p>
                  ) : (
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-bg px-3 py-2">
                      <span
                        className="size-6 shrink-0 rounded-full border border-line"
                        style={{ background: step.product.hex }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 text-sm">
                        <p className="truncate">
                          {step.product.brandName} · {step.product.name}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {step.product.shade} · {step.product.finish} ·{" "}
                          {Math.round(step.product.priceEur)} €
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </li>
          ))}
        </ol>
        {missingCost > 0 ? (
          <p className="mt-4 text-right text-sm text-muted tabular-nums">
            Lo que te falta: ~{Math.round(missingCost)} € en droguería
          </p>
        ) : null}
        <p className="mt-6 text-xs text-muted">
          El catálogo no vende ni reserva estilistas. El orden es para repetir la referencia en la
          piel.
        </p>
      </div>
    </main>
  );
}
