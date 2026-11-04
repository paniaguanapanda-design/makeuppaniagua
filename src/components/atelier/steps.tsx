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

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="brand text-ink">NEUSTA</p>
      <h1 data-testid="look-title" className="mt-7 text-center text-4xl sm:text-6xl">
        {card.title}
      </h1>
      <div className="hair" />
      <p className="mx-auto max-w-2xl text-center text-sm text-muted">
        {occasion.label} · {card.line}
      </p>
      {summary ? <p className="mt-2 text-sm">{summary}</p> : null}
      {note ? (
        <p className="mt-4 max-w-2xl rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          Lo que usas: {note}
        </p>
      ) : null}
      {skin ? (
        <p className="mt-3 max-w-2xl rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          {skinFromPhoto ? "En la foto, no es un diagnóstico" : "Tu piel"}: {skin}
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-20">
          <img
            src={card.imageUrl}
            alt=""
            data-testid="reference-image"
            className="w-full rounded-2xl border border-line object-cover"
          />
          <p className="mt-3 text-sm text-muted">
            Referencia de cómo quedaría. No es un filtro puesto encima de la foto.
          </p>
        </div>
        <div>
          {error ? (
            <button type="button" onClick={onRetry} className="min-h-11 rounded-full bg-ink px-5 text-surface">
              Reintentar los productos
            </button>
          ) : null}
          {plan ? (
            <aside className="glass rounded-[1.6rem] p-5 text-center">
              <p className="text-xs tracking-widest text-muted uppercase">Estilista</p>
              <h2 className="mt-2 text-3xl">{plan.stylist.name}</h2>
              <p className="text-sm text-muted">
                {plan.stylist.city} · {plan.stylist.years} años
              </p>
              <p className="mt-3">{plan.stylist.signature}</p>
            </aside>
          ) : (
            <p className="text-sm text-muted">Buscando los productos de esta opción.</p>
          )}
          <h2 className="mt-8 text-2xl">Pasos y productos</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step.order} className="rounded-2xl border border-line bg-surface px-4 py-4">
                <p className="text-xs tracking-widest text-muted uppercase">
                  {index + 1} · {ZONE_LABEL[step.zone]}
                </p>
                <p className="mt-1 font-display text-2xl">{step.title}</p>
                <p className="mt-2 text-sm">{step.instruction}</p>
                {(() => {
                  const hers = kit ? hersForZone({ age: "joven", tastes: [], note, skin, kit }, step.zone) : "";
                  return hers ? (
                    <p className="mt-3 text-sm">Usa lo que ya tienes: {hers}</p>
                  ) : (
                    <>
                      <p className="mt-3 text-sm text-muted">Si te falta, uno de droguería:</p>
                      <p className="text-sm">
                        {step.product.brandName} · {step.product.name}
                      </p>
                      <p className="text-sm text-muted tabular-nums">
                        {step.product.shade} · {step.product.finish} · {Math.round(step.product.priceEur)} €
                      </p>
                    </>
                  );
                })()}
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted">
            El catálogo no vende ni reserva estilistas. El orden es para repetir la referencia en la piel.
          </p>
        </div>
      </div>
    </div>
  );
}
