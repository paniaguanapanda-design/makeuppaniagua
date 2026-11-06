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

const TIER_ORDER = ["lujo", "prestigio", "accesible"] as const;
const TIER_LABEL: Record<string, string> = {
  lujo: "Lujo",
  prestigio: "Prestigio",
  accesible: "Accesible",
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
    <main data-testid="home" className="mx-auto flex max-w-6xl flex-col px-5 pb-12 pt-7">
      <p className="text-[11px] font-medium tracking-[0.18em] text-blush uppercase">
        Asesoría de maquillaje
      </p>
      <h1 className="mt-4 max-w-[18ch] text-[2.75rem] leading-[1.02] tracking-[-0.045em]">
        Tu look, a tu medida
      </h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-muted">
        Sube una foto y elige la ocasión. Te mostramos 3 opciones pensadas para ti.
      </p>

      <figure className="home-portrait relative mt-6 overflow-hidden rounded-[1.6rem]">
        <img
          src="/studio/olivo.jpg"
          alt="Retrato de estudio"
          className="h-full w-full object-cover object-[center_38%]"
        />
      </figure>

      <div className="mt-6">
        <button
          type="button"
          data-testid="start"
          onClick={onStart}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-ink px-6 text-left text-lg text-surface"
        >
          <span>Empezar</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={onDirectory}
        className="mt-4 text-sm text-muted underline underline-offset-4"
      >
        Explorar casas y estilistas
      </button>

      <p className="mt-6 text-xs tracking-wide text-muted tabular-nums">
        {counts
          ? `${counts.brands} casas · ${counts.stylists} estilistas · ${counts.products} productos`
          : catalogError
            ? catalogError
            : "Abriendo el catálogo"}
      </p>
    </main>
  );
}

export function OccasionScreen({ onPick }: { onPick: (id: SituationId) => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">Paso 1 de 3</p>
      <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl">¿Para qué ocasión?</h1>
      <p className="mt-3 max-w-xl text-muted">
        Elige una. Podrás cambiarla después.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SITUATIONS.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`occasion-${item.id}`}
              onClick={() => onPick(item.id)}
              className="soft-card flex min-h-36 flex-col items-start justify-between p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush"
            >
              <Icon className="size-5 text-blush" strokeWidth={1.75} aria-hidden="true" />
              <span className="mt-6 block font-display text-2xl">{item.label}</span>
              <span className="mt-1 block text-sm text-muted">{item.line}</span>
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl">Directorio</h1>
        <p className="mt-4 text-muted">{error ?? "Abriendo casas y estilistas."}</p>
        {error ? (
          <button type="button" onClick={onRetry} className="mt-6 min-h-11 rounded-full bg-ink px-5 text-surface">
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">Catálogo editorial</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">Casas y estilistas</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Referencia para armar el look. No es una tienda ni una cita real con estas personas:
        el roster de estilistas es de la casa NEUSTA.
      </p>
      <h2 className="mt-12 text-3xl">Estilistas</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {directory.stylists.map((stylist) => (
          <li key={stylist.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline">
            <div>
              <p className="font-display text-2xl">{stylist.name}</p>
              <p className="text-sm text-muted">
                {stylist.city} · {stylist.focus}
              </p>
              <p className="mt-2 max-w-xl">{stylist.signature}</p>
            </div>
            <p className="text-sm text-muted tabular-nums">{stylist.years} años</p>
          </li>
        ))}
      </ul>
      {TIER_ORDER.map((tier) => {
        const brands = directory.brands.filter((brand) => brand.tier === tier);
        if (!brands.length) return null;
        return (
          <section key={tier} className="mt-12">
            <h2 className="text-3xl">{TIER_LABEL[tier] ?? tier}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {brands.map((brand) => (
                <li key={brand.id} className="soft-card p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-2xl">{brand.name}</p>
                    <p className="text-sm text-muted tabular-nums">{brand.productCount}</p>
                  </div>
                  <p className="text-sm text-muted">{brand.origin}</p>
                  <p className="mt-2">{brand.note}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
