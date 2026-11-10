import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  AGE_YEARS,
  ageFromYears,
  TASTES,
  composeNote,
  type KitField,
  type PersonBrief,
  type TasteId,
} from "@/lib/makeup/profile";

const EMPTY_KIT: Record<KitField, string> = { base: "", ojos: "", labios: "", resto: "" };

const FIELDS: { id: KitField }[] = [
  { id: "base" },
  { id: "ojos" },
  { id: "labios" },
  { id: "resto" },
];

/** Lo que lleva escrito, para no perderlo al ir atrás y adelante. */
export type KitDraft = {
  years: number | null;
  tastes: TasteId[];
  kit: Record<KitField, string>;
  skin: string;
};

export function KitScreen({
  initial,
  onDraft,
  onContinue,
}: {
  initial: KitDraft | null;
  onDraft: (draft: KitDraft) => void;
  onContinue: (person: PersonBrief) => void;
}) {
  const [years, setYears] = useState<number | null>(initial?.years ?? null);
  const { t } = useLang();
  const [tastes, setTastes] = useState<TasteId[]>(initial?.tastes ?? []);
  const [kit, setKit] = useState(initial?.kit ?? EMPTY_KIT);
  const [skin, setSkin] = useState(initial?.skin ?? "");

  useEffect(() => {
    onDraft({ years, tastes, kit, skin });
  }, [years, tastes, kit, skin, onDraft]);

  function toggleTaste(id: TasteId) {
    setTastes((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function go() {
    if (!years) return;
    const next = {
      base: kit.base.trim().slice(0, 240),
      ojos: kit.ojos.trim().slice(0, 240),
      labios: kit.labios.trim().slice(0, 240),
      resto: kit.resto.trim().slice(0, 240),
    };
    onContinue({
      age: ageFromYears(years),
      years,
      tastes,
      kit: next,
      skin: skin.trim().slice(0, 300),
      note: composeNote(next),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8">
      <p className="step-eyebrow">{t("kit.step")}</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">{t("kit.title")}</h1>
      <p className="mt-4 text-muted">{t("kit.intro")}</p>

      <label className="mt-8 block">
        <span className="block text-2xl">{t("kit.age")}</span>
        <span className="mt-1 block text-sm text-muted">{t("kit.ageNote")}</span>
        <span className="relative mt-3 block">
          <select
            data-testid="age-select"
            value={years ?? ""}
            onChange={(event) => setYears(event.target.value ? Number(event.target.value) : null)}
            className="min-h-13 w-full appearance-none rounded-2xl border border-line bg-surface px-4 py-3.5 pr-12 text-base text-ink"
          >
            <option value="">{t("kit.agePick")}</option>
            {AGE_YEARS.map((value) => (
              <option key={value} value={value}>
                {t("common.years", { n: value })}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </span>
      </label>

      <h2 className="mt-8 text-2xl">{t("kit.tastes")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {TASTES.map((item) => {
          const on = tastes.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleTaste(item.id)}
              className={
                on
                  ? "min-h-11 rounded-full border border-ink bg-ink px-4 text-sm text-surface"
                  : "min-h-11 rounded-full border border-line bg-surface px-4 text-sm"
              }
            >
              {t(`taste.${item.id}`)}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col gap-6">
        {FIELDS.map((field) => (
          <label key={field.id} className="block">
            <span className="text-2xl">{t(`kit.${field.id}`)}</span>
            <textarea
              value={kit[field.id]}
              onChange={(event) =>
                setKit((current) => ({ ...current, [field.id]: event.target.value.slice(0, 240) }))
              }
              rows={3}
              placeholder={t(`kit.${field.id}.ph`)}
              className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
            />
          </label>
        ))}
        <label className="block">
          <span className="text-2xl">{t("kit.skin")}</span>
          <textarea
            value={skin}
            onChange={(event) => setSkin(event.target.value.slice(0, 300))}
            rows={3}
            placeholder={t("kit.skin.ph")}
            className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          />
        </label>
      </div>

      <div className="app-fixed-bar border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            data-testid="kit-continue"
            disabled={!years}
            onClick={go}
            className="min-h-11 rounded-full bg-ink px-6 text-surface disabled:opacity-40"
          >
            {years ? t("kit.continue") : t("kit.agePick")}
          </button>
        </div>
      </div>
    </div>
  );
}
