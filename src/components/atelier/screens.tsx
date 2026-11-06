import {
  Aperture,
  Briefcase,
  Flower2,
  Gem,
  Heart,
  Mic,
  Moon,
  Sun,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import {
  SITUATIONS,
  type Directory,
  type SituationId,
} from "@/lib/makeup/types";

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

export function HomeScreen({
  counts,
  catalogError,
  onStart,
  onDirectory,
}: {
  counts: Directory["counts"] | null;
  catalogError: string | null;
  onStart: () => void;
  onDirectory: () => void;
}) {
  return (
    <main data-testid="home" className="mx-auto flex max-w-md flex-col px-5 pb-12 pt-6">
      <figure className="relative overflow-hidden rounded-[1.75rem]">
        <img
          src="/studio/olivo.jpg"
          alt=""
          className="h-72 w-full object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#faf7f2] to-transparent" />
      </figure>

      <div className="-mt-16 px-2">
        <h1 className="text-center text-5xl leading-[0.95] tracking-tight">
          Tu look,<br />a tu medida
        </h1>
        <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-blush">
          <span className="h-px w-8 bg-blush/40" />
          <span className="text-lg">♡</span>
          <span className="h-px w-8 bg-blush/40" />
        </div>
        <p className="mt-4 text-center text-muted">
          Sube una foto y elige la ocasión
        </p>

        <button
          type="button"
          data-testid="start"
          onClick={onStart}
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ink text-lg text-surface shadow-lg"
        >
          Empezar
          <ArrowRight className="size-5" />
        </button>

        <button
          type="button"
          onClick={onDirectory}
          className="mt-5 w-full text-center text-sm text-muted"
        >
          Explorar estilistas
        </button>
      </div>
    </main>
  );
}

export function OccasionScreen({ onPick }: { onPick: (id: SituationId) => void }) {
  return (
    <div className="mx-auto max-w-md px-5 pb-16 pt-8">
      <h1 className="text-center text-4xl">¿Para qué ocasión?</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Elige la ocasión para sugerirte el look perfecto.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {SITUATIONS.slice(0, 6).map((item) => {
          const Icon = ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item.id)}
              className="soft-card flex flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/50 p-5 text-center backdrop-blur-md transition hover:bg-white/70"
            >
              <Icon className="size-7 text-blush" strokeWidth={1.5} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
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
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-3xl">Directorio</h1>
        <p className="mt-3 text-muted">{error ?? "Cargando..."}</p>
        {error && (
          <button type="button" onClick={onRetry} className="mt-4 rounded-full bg-ink px-5 py-2 text-surface">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-16 pt-8">
      <h1 className="text-3xl">Casas y estilistas</h1>
      <p className="mt-2 text-sm text-muted">Referencia de la casa NEUSTA.</p>
      <ul className="mt-6 space-y-4">
        {directory.stylists.map((s) => (
          <li key={s.id} className="rounded-2xl border border-line bg-white/60 p-4 backdrop-blur-sm">
            <p className="font-display text-xl">{s.name}</p>
            <p className="text-sm text-muted">{s.city} · {s.focus}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
