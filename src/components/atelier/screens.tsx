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
        Asesoría de maquillaje · A tu manera
      </p>
      <h1 className="mt-4 max-w-[20ch] text-[2.65rem] leading-[1.04] tracking-[-0.045em]">
        Primero la ocasión. Después, tu rostro.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        Un look pensado para ti: lo que te gusta, tu piel y lo que ya tienes.
      </p>

      <figure className="home-portrait relative mt-6 overflow-hidden rounded-[1.6rem]">
        <img
          src="/studio/olivo.jpg"
          alt="Retrato de estudio, una de las referencias de ORLA"
          className="h-full w-full object-cover object-[center_38%]"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-12 text-white">
          <span>
            <span className="block text-[10px] tracking-[0.16em] uppercase">Tu piel · Tu estilo</span>
            <span className="mt-1 block font-display text-xl">Belleza sin fórmulas</span>
          </span>
          <span className="mb-1 rounded-full border border-white/60 px-3 py-1 text-[10px] tracking-wide">
            ORLA STUDIO
          </span>
        </figcaption>
      </figure>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          data-testid="start"
          onClick={onStart}
          className="flex min-h-12 items-center justify-between rounded-2xl bg-ink px-5 text-left text-surface"
        >
          <span>Empezar mi look</span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDirectory}
          className="min-h-12 rounded-2xl border border-line bg-surface px-5 text-left"
        >
          Explorar casas y estilistas
        </button>
      </div>
      <p className="mt-4 text-xs tracking-wide text-muted tabular-nums">
        {counts
          ? `${counts.brands} casas · ${counts.stylists} estilistas · ${counts.products} productos`
          : catalogError
            ? catalogError
            : "Abriendo el catálogo"}
      </p>
      <ol className="mt-7 divide-y divide-line border-y border-line">
        {[
          ["01", "La ocasión", "Día, cita, boda o cualquier plan."],
          ["02", "Tus palabras", "Tu gusto, tu piel y lo que ya usas."],
          ["03", "Tu referencia", "Tres opciones; tú eliges los pasos."],
        ].map(([index, title, line]) => (
          <li key={index} className="flex items-start gap-4 py-4">
            <span className="pt-0.5 text-xs font-medium tracking-widest text-blush">{index}</span>
            <span>
              <span className="block font-display text-xl">{title}</span>
              <span className="mt-1 block text-sm text-muted">{line}</span>
            </span>
          </li>
        ))}
      </ol>
      <a
        href="/orla-con-voz.mp4?v=4"
        download="ORLA-video.mp4"
        className="mt-5 inline-flex min-h-11 items-center text-sm text-muted underline decoration-line underline-offset-4"
      >
        Ver y descargar el vídeo de ORLA
      </a>
    </main>
  );
}

export function OccasionScreen({ onPick }: { onPick: (id: SituationId) => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">Paso 1</p>
      <h1 className="mt-3 max-w-2xl text-4xl sm:text-6xl">¿Para qué es el maquillaje?</h1>
      <p className="mt-4 max-w-xl text-muted">
        Después preguntas qué productos ya tienes. La cámara viene al final.
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
              className="soft-card flex min-h-36 flex-col items-start justify-between p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blush"
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
