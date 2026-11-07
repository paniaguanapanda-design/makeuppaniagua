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

export function KitScreen({
  onContinue,
  initial,
}: {
  onContinue: (person: PersonBrief) => void;
  initial?: PersonBrief | null;
}) {
  const [age, setAge] = useState<AgeId | null>(initial?.age ?? null);
  const [tastes, setTastes] = useState<TasteId[]>(initial?.tastes ?? []);
  const [kit, setKit] = useState(initial?.kit ?? EMPTY_KIT);
  const [skin, setSkin] = useState(initial?.skin ?? "");
  const [minutes, setMinutes] = useState<"5" | "15" | "30">(initial?.minutes ?? "15");
  const [intensity, setIntensity] = useState<"suave" | "media" | "intensa">(
    initial?.intensity ?? "media",
  );
  const [sensitivities, setSensitivities] = useState(initial?.sensitivities ?? "");

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
      minutes,
      intensity,
      sensitivities: sensitivities.trim().slice(0, 300),
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
            <span
              className={
                age === item.id ? "mt-1 block text-sm text-clay" : "mt-1 block text-sm text-muted"
              }
            >
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

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-2xl">Tiempo disponible</span>
          <select
            value={minutes}
            onChange={(event) => setMinutes(event.target.value as typeof minutes)}
            className="mt-3 min-h-11 w-full rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <option value="5">5 minutos · rutina rápida</option>
            <option value="15">15 minutos · con calma</option>
            <option value="30">30 minutos · más detalle</option>
          </select>
        </label>
        <label className="block">
          <span className="text-2xl">Intensidad que prefieres</span>
          <select
            value={intensity}
            onChange={(event) => setIntensity(event.target.value as typeof intensity)}
            className="mt-3 min-h-11 w-full rounded-2xl border border-line bg-surface px-4 py-3"
          >
            <option value="suave">Suave</option>
            <option value="media">Media</option>
            <option value="intensa">Intensa</option>
          </select>
        </label>
      </div>
      <label className="mt-8 block">
        <span className="text-2xl">Alergias o sensibilidad (opcional)</span>
        <textarea
          value={sensitivities}
          onChange={(event) => setSensitivities(event.target.value.slice(0, 300))}
          rows={2}
          maxLength={300}
          placeholder="Solo lo que ya sabes: ingredientes o productos que evitas. No se deduce de la foto."
          className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
        />
        <span className="mt-2 block text-sm text-muted">
          No podemos verificar ingredientes ni garantizar que un producto sea seguro para tu
          alergia.
        </span>
      </label>
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
            placeholder="Granos, seca, grasa, sensible, manchas, rojeces, ojeras. Opcional. La foto no permite diagnosticar tu piel."
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
