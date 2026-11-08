import {
  Aperture,
  Briefcase,
  Flower2,
  Gem,
  Heart,
  Mic,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { SITUATIONS, type Directory, type SituationId } from "@/lib/makeup/types";
import { useLang } from "@/lib/i18n";

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
export function HomeScreen({ onStart }: { onStart: () => void }) {
  const { t } = useLang();
  return (
    <main data-testid="home" className="flex flex-col text-center">
      <section className="relative min-h-[calc(100svh-4.25rem)] overflow-hidden bg-clay">
        <img
          src="/studio/home-portrait.png"
          alt={t("home.alt")}
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/35 via-transparent via-30% to-[#e9b6c0]/35" />
        <p className="brand absolute inset-x-0 top-8 text-ink">NEUSTA</p>

        <div className="home-card glass absolute inset-x-3.5 rounded-[2rem] px-5 pb-5 pt-7">
          <h1 className="text-[2.6rem] leading-[1.02]">
            {t("home.title1")}
            <br />
            <em>{t("home.title2")}</em>
          </h1>
          <div className="hair" />
          <button
            type="button"
            data-testid="start"
            onClick={onStart}
            className="bg-ink mt-1 min-h-[3.1rem] w-full px-6 text-[14px] font-medium"
          >
            {t("home.start")}
          </button>
        </div>
      </section>
    </main>
  );
}

export function OccasionScreen({ onPick }: { onPick: (id: SituationId) => void }) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-9 text-center">
      <p className="brand text-ink">NEUSTA</p>
      <div className="dots mt-6" aria-hidden="true">
        <i className="on" />
        <i />
        <i />
        <i />
      </div>
      <h1 className="mt-7 text-[2.4rem] leading-[1.04] sm:text-6xl">
        {t("occ.title1")} <em>{t("occ.title2")}</em>?
      </h1>
      <div className="hair" />
      <p className="text-sm text-muted">{t("occ.sub")}</p>
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
              <span className="block font-display text-[1.4rem] font-semibold leading-none">
                {t(`sit.${item.id}`)}
              </span>
              <span className="block text-[11px] text-muted">{t(`sit.${item.id}.line`)}</span>
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
  const { t } = useLang();
  if (!directory) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl">{t("dir.title")}</h1>
        <p className="mt-4 text-muted">{error ?? t("dir.loading")}</p>
        {error ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 min-h-11 rounded-full bg-ink px-5 text-surface"
          >
            {t("common.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">{t("dir.eyebrow")}</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">{t("dir.title")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t("dir.intro")}</p>
      <h2 className="mt-12 text-3xl">{t("dir.stylists")}</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {directory.stylists.map((stylist) => (
          <li
            key={stylist.id}
            className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline"
          >
            <div>
              <p className="font-display text-2xl">{stylist.name}</p>
              <p className="text-sm text-muted">
                {stylist.city} · {stylist.focus}
              </p>
              <p className="mt-2 max-w-xl">{stylist.signature}</p>
            </div>
            <p className="text-sm text-muted tabular-nums">
              {t("common.years", { n: stylist.years })}
            </p>
          </li>
        ))}
      </ul>
      {TIER_ORDER.map((tier) => {
        const brands = directory.brands.filter((brand) => brand.tier === tier);
        if (!brands.length) return null;
        return (
          <section key={tier} className="mt-12">
            <h2 className="text-3xl">{t(`tier.${tier}`)}</h2>
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
