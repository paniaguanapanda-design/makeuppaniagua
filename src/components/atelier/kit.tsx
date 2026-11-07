import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { StepLabel } from "@/components/atelier/ui";
import {
  AGES,
  TASTES,
  composeNote,
  type AgeId,
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

export type KitDraft = {
  age: AgeId | null;
  tastes: TasteId[];
  kit: Record<KitField, string>;
  skin: string;
};

export function KitScreen({
  initial,
  remembered,
  onDraft,
  onContinue,
}: {
  initial: KitDraft | null;
  remembered: boolean;
  onDraft: (draft: KitDraft) => void;
  onContinue: (person: PersonBrief) => void;
}) {
  const [age, setAge] = useState<AgeId | null>(initial?.age ?? null);
  const [tastes, setTastes] = useState<TasteId[]>(initial?.tastes ?? []);
  const [kit, setKit] = useState(initial?.kit ?? EMPTY_KIT);
  const [skin, setSkin] = useState(initial?.skin ?? "");
  const filled = Object.values(kit).filter((value) => value.trim()).length + (skin.trim() ? 1 : 0);
  const [open, setOpen] = useState(filled > 0);

  useEffect(() => {
    onDraft({ age, tastes, kit, skin });
  }, [age, tastes, kit, skin, onDraft]);

  function toggleTaste(id: TasteId) {
    setTastes((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function go() {
    if (!age) return;
    const next = {
      base: kit.base.trim().slice(0, 240),
      ojos: kit.ojos.trim().slice(0, 240),
      labios: kit.labios.trim().slice(0, 240),
      resto: kit.resto.trim().slice(0, 240),
    };
    onContinue({
      age,
      tastes,
      kit: next,
      skin: skin.trim().slice(0, 300),
      note: composeNote(next),
    });
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-32 pt-6">
      <StepLabel step={2} />
      <h1 className="mt-3 text-4xl">Cuéntame de ti</h1>
      <p className="mt-3 text-muted">Solo la edad es necesaria. Lo demás afina el resultado.</p>
      {remembered ? (
        <p className="mt-3 rounded-2xl bg-blush/10 px-4 py-3 text-sm text-ink">
          He recordado tus respuestas de la última vez. Cambia lo que quieras.
        </p>
      ) : null}

      <fieldset className="mt-8">
        <legend className="font-display text-2xl">Edad</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {AGES.map((item) => {
            const on = age === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => setAge(item.id)}
                className={`select-tile min-h-12 rounded-2xl border px-4 py-3 text-left ${on ? "is-on" : ""}`}
              >
                <span className="block font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
        {age ? (
          <p className="mt-3 text-sm text-muted">{AGES.find((item) => item.id === age)?.line}</p>
        ) : null}
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-display text-2xl">Qué te gusta</legend>
        <p className="mt-1 text-sm text-muted">Elige las que quieras.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TASTES.map((item) => {
            const on = tastes.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTaste(item.id)}
                className={`select-tile min-h-11 rounded-full border px-4 text-sm ${on ? "is-on" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="soft-card mt-8 overflow-hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="kit-extra"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        >
          <span>
            <span className="block font-display text-xl">Tu neceser y tu piel</span>
            <span className="block text-sm text-muted">
              {filled ? `${filled} de 5 respondidas` : "Opcional · uso lo que ya tienes"}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {open ? (
          <div id="kit-extra" className="flex flex-col gap-5 border-t border-line px-4 pb-5 pt-4">
            {FIELDS.map((field) => (
              <label key={field.id} className="block">
                <span className="text-sm font-medium">{field.label}</span>
                <textarea
                  value={kit[field.id]}
                  onChange={(event) =>
                    setKit((current) => ({
                      ...current,
                      [field.id]: event.target.value.slice(0, 240),
                    }))
                  }
                  rows={2}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-base"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-sm font-medium">Cómo está tu piel</span>
              <textarea
                value={skin}
                onChange={(event) => setSkin(event.target.value.slice(0, 300))}
                rows={2}
                placeholder="Granos, seca, grasa, sensible, manchas, ojeras. Si lo dejas en blanco, lo miro en la foto."
                className="mt-2 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-base"
              />
            </label>
          </div>
        ) : null}
      </section>

      <div className="app-fixed-bar border-t border-line bg-bg/95 px-5 pt-3 backdrop-blur-md">
        <button
          type="button"
          data-testid="kit-continue"
          disabled={!age}
          onClick={go}
          className="w-full min-h-14 rounded-full bg-ink text-base text-surface"
        >
          {age ? "Seguir" : "Elige tu edad para seguir"}
        </button>
      </div>
    </main>
  );
}
