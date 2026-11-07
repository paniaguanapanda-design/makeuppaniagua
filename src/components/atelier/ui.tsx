import { Sparkles } from "lucide-react";

import { FLOW, FLOW_LABEL } from "@/components/atelier/flow";

/** Barra fina de progreso bajo la cabecera. */
export function FlowProgress({ step }: { step: number }) {
  const total = FLOW.length;
  return (
    <div
      className="h-1 w-full bg-line/60"
      role="progressbar"
      aria-label="Progreso"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={step}
      aria-valuetext={`Paso ${step} de ${total}: ${FLOW_LABEL[step - 1]}`}
    >
      <div
        className="h-full rounded-r-full bg-blush transition-[width] duration-500 ease-out"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  );
}

/** Etiqueta "Paso X de 5 · Nombre" consistente en todas las pantallas. */
export function StepLabel({ step, extra }: { step: number; extra?: string }) {
  return (
    <p className="text-xs font-medium tracking-widest text-blush uppercase">
      Paso {step} de {FLOW.length} · {FLOW_LABEL[step - 1]}
      {extra ? <span className="text-muted"> · {extra}</span> : null}
    </p>
  );
}

/** Marco cuando aún no hay imagen generada: cálido, nunca un hueco roto. */
export function LookPlaceholder({
  title,
  hint,
  compact = false,
}: {
  title: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`${compact ? "aspect-[16/9]" : "frame-portrait"} look-placeholder flex flex-col items-center justify-center gap-3 px-6 text-center`}
    >
      <span className="grid size-14 place-items-center rounded-full bg-surface/80 text-blush shadow-sm">
        <Sparkles className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="font-display text-2xl text-ink">{title}</span>
      {hint ? <span className="max-w-[16rem] text-sm text-muted">{hint}</span> : null}
    </div>
  );
}
