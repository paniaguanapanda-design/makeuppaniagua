import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { paintPortrait, type Recipe } from "@/lib/makeup/paint";
import {
  DEPTH_LABEL,
  PAINT_ZONES,
  SHAPE_LABEL,
  SHAPE_NOTE,
  TONE_LABEL,
  ZONE_LABEL,
  type Capture,
  type LookPlan,
  type PaintZone,
  type Product,
  type SituationId,
  type Step,
  situationById,
} from "@/lib/makeup/types";

function recipeFrom(plan: LookPlan): Recipe {
  const zones = {} as Recipe["zones"];
  for (const zone of PAINT_ZONES) {
    const step = plan.steps.find((item) => item.zone === zone);
    zones[zone] = {
      enabled: true,
      intensity: plan.intensities[zone] ?? 0.5,
      hex: step?.product.hex ?? "#c4a090",
    };
  }
  return { zones };
}

export function StudioScreen({
  situation,
  capture,
  plan,
  error,
  onRetry,
  onContinue,
}: {
  situation: SituationId;
  capture: Capture;
  plan: LookPlan | null;
  error: string | null;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [wipe, setWipe] = useState(0);
  const [open, setOpen] = useState(1);

  useEffect(() => {
    if (!plan) return;
    setSteps(plan.steps);
    setRecipe(recipeFrom(plan));
    setWipe(0);
    setOpen(plan.steps[0]?.order ?? 1);
  }, [plan]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    paintPortrait(canvas, capture.photo, capture.landmarks, recipe, wipe, {
      situation,
      read: capture.read,
    });
  }, [capture, recipe, wipe, situation]);

  const occasion = situationById(situation);

  function toggleZone(zone: PaintZone) {
    setRecipe((current) => {
      if (!current) return current;
      const item = current.zones[zone];
      return { zones: { ...current.zones, [zone]: { ...item, enabled: !item.enabled } } };
    });
  }

  function setIntensity(zone: PaintZone, intensity: number) {
    setRecipe((current) => {
      if (!current) return current;
      const item = current.zones[zone];
      return { zones: { ...current.zones, [zone]: { ...item, intensity } } };
    });
  }

  function swapShade(step: Step, product: Product) {
    setSteps((current) =>
      current.map((item) =>
        item.order === step.order ? { ...item, product, tension: false } : item,
      ),
    );
    if (step.zone === "fijador") return;
    const zone = step.zone;
    setRecipe((current) => {
      if (!current || !(zone in current.zones)) return current;
      const paintZone = zone as PaintZone;
      return {
        zones: {
          ...current.zones,
          [paintZone]: { ...current.zones[paintZone], hex: product.hex, enabled: true },
        },
      };
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">{occasion.label}</p>
      <h1 data-testid="look-title" className="mt-3 text-4xl sm:text-6xl">
        {plan ? plan.title : "Maquillando tu cara"}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        {plan
          ? `Representación virtual generada para tu rostro. ${plan.promise}`
          : (error ?? "Estoy ajustando el maquillaje a tu rostro y a la ocasión.")}
      </p>
      {error ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface"
        >
          Reintentar
        </button>
      ) : null}

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-20">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
            <canvas ref={canvasRef} data-testid="studio-canvas" className="studio-canvas" />
          </div>
          <label className="mt-4 block text-sm text-muted">
            <span className="flex justify-between">
              <span>Look</span>
              <span>Sin producto</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={wipe}
              aria-label="Comparar con la piel sin producto"
              onChange={(event) => setWipe(Number(event.target.value))}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PAINT_ZONES.map((zone) => {
              const item = recipe?.zones[zone];
              const on = item?.enabled !== false;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => toggleZone(zone)}
                  className={
                    on
                      ? "min-h-11 rounded-full border border-ink bg-ink px-3 text-sm text-surface"
                      : "min-h-11 rounded-full border border-line bg-surface px-3 text-sm"
                  }
                >
                  {ZONE_LABEL[zone]}
                </button>
              );
            })}
          </div>
          {capture.read ? (
            <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-2xl border border-line bg-surface p-3">
                <dt className="text-muted">Forma</dt>
                <dd data-testid="read-shape">{SHAPE_LABEL[capture.read.shape]}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3">
                <dt className="text-muted">Subtono</dt>
                <dd data-testid="read-tone">{TONE_LABEL[capture.read.undertone]}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-3">
                <dt className="text-muted">Profundidad</dt>
                <dd data-testid="read-depth">{DEPTH_LABEL[capture.read.depth]}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">
              No encontré los puntos de la cara, así que no pude maquillarla.
            </p>
          )}
          {capture.read ? <p className="mt-3 text-sm">{SHAPE_NOTE[capture.read.shape]}</p> : null}
          <p className="mt-3 text-sm text-muted">
            {capture.source === "camera"
              ? "Maquillaje aplicado sobre tu cara. La luz de la habitación cambia el tono."
              : "Maquillaje aplicado sobre este retrato, no sobre tu cámara."}
          </p>
        </div>

        <div>
          {plan ? (
            <aside className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-xs tracking-widest text-muted uppercase">Estilista</p>
              <h2 className="mt-2 text-3xl">{plan.stylist.name}</h2>
              <p className="text-sm text-muted">
                {plan.stylist.city} · {plan.stylist.years} años
              </p>
              <p className="mt-3">{plan.stylist.signature}</p>
              <p className="mt-2 text-sm text-muted">{plan.stylist.focus}</p>
            </aside>
          ) : null}

          <h2 className="mt-6 text-2xl">Lo que te puse</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {steps.map((step) => {
              const isOpen = step.order === open;
              const alternates = plan?.alternates[step.zone] ?? [];
              const zoneRecipe =
                step.zone === "fijador" || !recipe ? null : recipe.zones[step.zone as PaintZone];
              return (
                <li key={step.order} className="rounded-2xl border border-line bg-surface">
                  <button
                    type="button"
                    onClick={() => setOpen(step.order)}
                    className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-line"
                      style={{ backgroundColor: step.product.hex }}
                    />
                    <span>
                      <span className="block">{ZONE_LABEL[step.zone]}</span>
                      <span className="text-sm text-muted">
                        {step.product.brandName} · {step.product.shade}
                      </span>
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-line px-4 py-4">
                      <p className="text-sm text-muted">
                        {step.zone === "fijador"
                          ? "Cierra el look. En la foto no se ve; el resto ya está encima."
                          : "Esta capa ya está en la cara. Si cambias el tono, lo vuelvo a aplicar."}
                      </p>
                      <p className="mt-3 text-sm">
                        {step.product.brandName} · {step.product.name}
                      </p>
                      <p className="text-sm text-muted tabular-nums">
                        {step.product.shade} · {step.product.finish} ·{" "}
                        {Math.round(step.product.priceEur)} €
                      </p>
                      {step.tension ? (
                        <p className="mt-2 text-sm text-blush">
                          Este subtono no encaja con la lectura. Puedo cambiar el círculo.
                        </p>
                      ) : null}
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {alternates.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            aria-label={`${product.brandName} ${product.shade}`}
                            onClick={() => swapShade(step, product)}
                            className={
                              product.id === step.product.id
                                ? "size-11 shrink-0 rounded-full border-2 border-ink"
                                : "size-11 shrink-0 rounded-full border border-line"
                            }
                            style={{ backgroundColor: product.hex }}
                          />
                        ))}
                      </div>
                      {zoneRecipe ? (
                        <label className="mt-2 block text-sm text-muted">
                          Cuánto {ZONE_LABEL[step.zone].toLowerCase()} dejé
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={zoneRecipe.intensity}
                            onChange={(event) =>
                              setIntensity(step.zone as PaintZone, Number(event.target.value))
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-sm text-muted">
            Es maquillaje virtual sobre la foto, no producto en la piel. El catálogo no vende ni
            reserva estilistas.
          </p>
        </div>
      </div>
      <div className="app-fixed-bar px-5 py-3">
        <button
          type="button"
          data-testid="studio-continue"
          disabled={!plan}
          onClick={onContinue}
          className="home-cta min-h-12 w-full px-6 text-sm font-medium"
        >
          Ver los pasos de mi look
        </button>
      </div>
    </div>
  );
}
