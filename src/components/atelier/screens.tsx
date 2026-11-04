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
    <main data-testid="home" className="flex flex-col text-center">
      <section className="relative min-h-[100svh] overflow-hidden bg-clay">
        <img
          src="/studio/olivo.jpg"
          alt="Retrato de estudio, una de las referencias de ORLA"
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/35 via-transparent via-30% to-[#e9b6c0]/35" />
        <p className="brand absolute inset-x-0 top-8 text-ink">ORLA</p>

        <div className="glass absolute inset-x-3.5 bottom-3.5 rounded-[2rem] px-5 pb-5 pt-7">
          <h1 className="text-[2.6rem] leading-[1.02]">
            Tu look,
            <br />
            <em>a tu medida</em>
          </h1>
          <div className="hair" />
          <p className="mb-5 text-[13px] leading-6 text-muted">Elige la ocasión y te guiamos.</p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-testid="start"
              onClick={onStart}
              className="bg-ink min-h-[3.1rem] px-6 text-[14px] font-medium"
            >
              Empezar
            </button>
            <button
              type="button"
              onClick={onDirectory}
              className="min-h-11 rounded-full border border-blush/35 bg-white/55 px-6 text-[13px] font-medium text-blush"
            >
              Explorar estilistas
            </button>
          </div>
        </div>
      </section>

      <div className="px-6 pb-12 pt-8">
        <p className="text-xs tracking-wide text-muted tabular-nums">
          {counts
            ? `${counts.brands} casas · ${counts.stylists} estilistas · ${counts.products} productos`
            : catalogError
              ? catalogError
              : "Abriendo el catálogo"}
        </p>
        <div className="hair" />
        <ol className="mt-4 flex flex-col gap-5">
          {[
            ["La ocasión", "Día, cita, boda o fiesta."],
            ["Tus palabras", "Tu gusto y lo que ya usas."],
            ["Tu referencia", "Tres looks; tú eliges."],
          ].map(([title, line]) => (
            <li key={title}>
              <span className="block font-display text-2xl">{title}</span>
              <span className="mt-0.5 block text-sm text-muted">{line}</span>
            </li>
          ))}
        </ol>
        <a
          href="/orla-con-voz.mp4?v=4"
          download="ORLA-video.mp4"
          className="mt-6 inline-flex min-h-11 items-center text-sm text-blush underline decoration-line underline-offset-4"
        >
          Ver el vídeo de ORLA
        </a>
      </div>
    </main>
  );
}

export function OccasionScreen({ onPick }: { onPick: (id: SituationId) => void }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-9 text-center">
      <p className="brand text-ink">ORLA</p>
      <div className="dots mt-6" aria-hidden="true">
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
      <h1 className="mt-7 text-[2.4rem] leading-[1.04] sm:text-6xl">
        ¿Para qué <em>ocasión</em>?
      </h1>
      <div className="hair" />
      <p className="text-sm text-muted">Elige una.</p>
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {SITUATIONS.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`occasion-${item.id}`}
              onClick={() => onPick(item.id)}
              className="occasion-tile flex min-h-[7rem] flex-col items-center justify-center gap-1.5 px-3 py-4 text-center"
            >
              <Icon className="size-[22px] text-blush" strokeWidth={1.5} aria-hidden="true" />
              <span className="block font-display text-[1.4rem] font-semibold leading-none">{item.label}</span>
              <span className="block text-[11px] text-muted">{item.line}</span>
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
        el roster de estilistas es de la casa ORLA.
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
