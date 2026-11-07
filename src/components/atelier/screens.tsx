import {
  Aperture,
  ArrowRight,
  Briefcase,
  Flower2,
  Gem,
  Heart,
  MapPin,
  Mic,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { StepLabel } from "@/components/atelier/ui";
import { SITUATIONS, type Directory, type SituationId } from "@/lib/makeup/types";

const ICONS: Record<SituationId, LucideIcon> = {
  dia: Sun,
  oficina: Briefcase,
  entrevista: Mic,
  cita: Heart,
  boda: Flower2,
  fiesta: Moon,
  fotos: Aperture,
  editorial: Gem,
};

export function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <main data-testid="home" className="home-hero mx-auto flex max-w-md flex-col px-5 pt-4 pb-10">
      <figure className="relative w-full flex-1 overflow-hidden rounded-[1.75rem]">
        <img
          src="/studio/olivo.jpg"
          alt="Retrato de una mujer con maquillaje natural y luminoso"
          className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
          fetchPriority="high"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <h1 className="absolute inset-x-0 bottom-6 px-4 text-center font-display text-[2.9rem] leading-[1.03] tracking-tight text-ink">
          Tu look,
          <br />a tu medida
        </h1>
      </figure>

      <button
        type="button"
        data-testid="start"
        onClick={onStart}
        className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-lg text-surface"
      >
        Empezar
        <ArrowRight className="size-5" aria-hidden="true" />
      </button>
    </main>
  );
}

export function OccasionScreen({
  selected,
  onPick,
}: {
  selected: SituationId | null;
  onPick: (id: SituationId) => void;
}) {
  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <StepLabel step={1} />
      <h1 className="mt-3 text-4xl">¿Para qué ocasión?</h1>
      <p className="mt-2 text-sm text-muted">
        Así sé cuánta intensidad y qué duración necesita tu look.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {SITUATIONS.map((item) => {
          const Icon = ICONS[item.id];
          const on = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => onPick(item.id)}
              className={`soft-card tap-card flex flex-col items-start gap-2 p-4 text-left ${on ? "is-on" : ""}`}
            >
              <span className="grid size-10 place-items-center rounded-full bg-blush/10 text-blush">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span className="font-medium leading-tight">{item.label}</span>
              <span className="text-xs leading-snug text-muted">{item.line}</span>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DirectoryScreen({
  directory,
  error,
  onRetry,
}: {
  directory: Directory | null;
  error: string | null;
  onRetry: () => void;
}) {
  if (!directory) {
    return (
      <main className="mx-auto max-w-md px-5 pb-16 pt-8">
        <h1 className="text-4xl">Estilistas</h1>
        {error ? (
          <div className="mt-6 rounded-2xl border border-blush/30 bg-blush/5 p-4">
            <p className="text-sm text-blush">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 min-h-11 rounded-full bg-ink px-5 text-surface"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3" aria-label="Cargando">
            {[0, 1, 2, 3].map((item) => (
              <li key={item} className="soft-card flex items-center gap-4 p-4">
                <span className="skeleton size-12 rounded-full" />
                <span className="flex-1 space-y-2">
                  <span className="skeleton block h-4 w-2/3 rounded" />
                  <span className="skeleton block h-3 w-1/2 rounded" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <h1 className="text-4xl">Estilistas</h1>
      <p className="mt-2 text-sm text-muted">
        Cada look lo firma uno de ellos. Su forma de trabajar guía tus pasos.
      </p>
      <ul className="mt-6 space-y-3">
        {directory.stylists.map((s) => (
          <li key={s.id} className="soft-card p-4">
            <div className="flex items-center gap-4">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full bg-blush/10 font-display text-lg text-blush"
                aria-hidden="true"
              >
                {initials(s.name)}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight">{s.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3" aria-hidden="true" />
                  {s.city} · {s.years} años de oficio
                </p>
              </div>
            </div>
            <p className="mt-3 inline-block rounded-full bg-clay px-3 py-1 text-xs text-ink">
              {s.focus}
            </p>
            {s.signature ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.signature}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
