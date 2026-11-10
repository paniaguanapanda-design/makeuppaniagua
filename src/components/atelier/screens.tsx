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
import { SITUATIONS, type SituationId } from "@/lib/makeup/types";
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

export function HomeScreen({ onStart }: { onStart: () => void }) {
  const { t } = useLang();
  return (
    <main data-testid="home" className="flex flex-col text-center">
      <section className="relative min-h-[calc(100svh-3.5rem-var(--nav-h,0px))] overflow-hidden bg-clay">
        <img
          src="/studio/home-portrait.png"
          alt={t("home.alt")}
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/35 via-transparent via-30% to-[#e9b6c0]/35" />

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
      <div className="dots" aria-hidden="true">
        <i />
        <i className="on" />
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
