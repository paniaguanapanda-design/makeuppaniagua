import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
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

const FIELDS: { id: KitField; label: string; placeholder: string }[] = [
  {
    id: "base",
    label: "Piel y base",
    placeholder: "Nada, una BB, o la base que tengas. Marca, tono, si es ligera o cubre.",
  },
  {
    id: "ojos",
    label: "Ojos",
    placeholder: "Rímel, lápiz, sombra. Como tú lo llamas.",
  },
  {
    id: "labios",
    label: "Labios",
    placeholder: "Bálsamo, labial, brillo, el color que usas.",
  },
  {
    id: "resto",
    label: "Cejas, rubor y lo demás",
    placeholder: "Lo que tengas, aunque sea uno solo.",
  },
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
      <p className="text-xs tracking-widest text-muted uppercase">Paso 2</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">Cuéntame cómo te maquillas</h1>
      <p className="mt-4 text-muted">
        No hay una lista de marcas. Escribe lo que usas, con tus palabras, y cómo está tu piel. Si
        una casilla no aplica, déjala en blanco.
      </p>

      <label className="mt-8 block">
        <span className="block text-2xl">Tu edad</span>
        <span className="mt-1 block text-sm text-muted">
          Solo la usa tu maquilladora. No se muestra a nadie.
        </span>
        <span className="relative mt-3 block">
          <select
            data-testid="age-select"
            value={years ?? ""}
            onChange={(event) => setYears(event.target.value ? Number(event.target.value) : null)}
            className="min-h-13 w-full appearance-none rounded-2xl border border-line bg-surface px-4 py-3.5 pr-12 text-base text-ink"
          >
            <option value="">Elige tu edad</option>
            {AGE_YEARS.map((value) => (
              <option key={value} value={value}>
                {value} años
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </span>
      </label>

      <h2 className="mt-8 text-2xl">Qué te gusta</h2>
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
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col gap-6">
        {FIELDS.map((field) => (
          <label key={field.id} className="block">
            <span className="text-2xl">{field.label}</span>
            <textarea
              value={kit[field.id]}
              onChange={(event) =>
                setKit((current) => ({ ...current, [field.id]: event.target.value.slice(0, 240) }))
              }
              rows={3}
              placeholder={field.placeholder}
              className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
            />
          </label>
        ))}
        <label className="block">
          <span className="text-2xl">Cómo está tu piel</span>
          <textarea
            value={skin}
            onChange={(event) => setSkin(event.target.value.slice(0, 300))}
            rows={3}
            placeholder="Granos, seca, grasa, sensible, manchas, rojeces, ojeras. Si lo dejas en blanco, lo miro en la foto."
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
            {years ? "Seguir" : "Elige tu edad"}
          </button>
        </div>
      </div>
    </div>
  );
}
