import { useState } from "react";
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

export function KitScreen({ onContinue }: { onContinue: (person: PersonBrief) => void }) {
  const [age, setAge] = useState<AgeId | null>(null);
  const [tastes, setTastes] = useState<TasteId[]>([]);
  const [kit, setKit] = useState(EMPTY_KIT);
  const [skin, setSkin] = useState("");

  function toggleTaste(id: TasteId) {
    setTastes((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-8">
      <p className="text-xs tracking-widest text-muted uppercase">Paso 2</p>
      <h1 className="mt-3 text-4xl sm:text-6xl">Cuéntame cómo te maquillas</h1>
      <p className="mt-4 text-muted">
        No hay una lista de marcas. Escribe lo que usas, con tus palabras, y cómo está tu piel. Si una casilla no
        aplica, déjala en blanco.
      </p>

      <h2 className="mt-8 text-2xl">Edad</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {AGES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={age === item.id}
            onClick={() => setAge(item.id)}
            className={
              age === item.id
                ? "min-h-11 rounded-2xl border border-ink bg-ink px-4 py-3 text-left text-surface"
                : "min-h-11 rounded-2xl border border-line bg-surface px-4 py-3 text-left"
            }
          >
            <span className="block font-medium">{item.label}</span>
            <span className={age === item.id ? "mt-1 block text-sm text-clay" : "mt-1 block text-sm text-muted"}>
              {item.line}
            </span>
          </button>
        ))}
      </div>

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
              onChange={(event) => setKit((current) => ({ ...current, [field.id]: event.target.value.slice(0, 240) }))}
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
            disabled={!age}
            onClick={go}
            className="min-h-11 rounded-full bg-ink px-6 text-surface disabled:opacity-40"
          >
            {age ? "Seguir" : "Elige una edad"}
          </button>
        </div>
      </div>
    </div>
  );
}
