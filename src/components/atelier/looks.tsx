import { useEffect, useState } from "react";
import { Bookmark, ChevronDown, Trash2 } from "lucide-react";
import { LookPlaceholder } from "@/components/atelier/ui";
import { loadLooks, removeLook, type SavedLook } from "@/lib/makeup/memory";
import { ZONE_LABEL, situationById } from "@/lib/makeup/types";

function when(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

function LookImage({ look }: { look: SavedLook }) {
  const [broken, setBroken] = useState(false);
  if (!look.imageUrl || broken) return <LookPlaceholder title={look.title} />;
  return (
    <img
      src={look.imageUrl}
      alt={`Referencia del look ${look.title}`}
      onError={() => setBroken(true)}
      loading="lazy"
      className="frame-portrait w-full object-cover"
    />
  );
}

export function LooksScreen({ onStart }: { onStart: () => void }) {
  const [looks, setLooks] = useState<SavedLook[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setLooks(loadLooks());
  }, []);

  function drop(id: string) {
    removeLook(id);
    setLooks(loadLooks());
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <h1 className="text-4xl">Mis looks</h1>
      <p className="mt-2 text-sm text-muted">Se guardan solo en este móvil.</p>

      {looks && looks.length === 0 ? (
        <div className="soft-card mt-8 flex flex-col items-center px-6 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-blush/10 text-blush">
            <Bookmark className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-2xl">Aún no tienes looks</p>
          <p className="mt-2 text-sm text-muted">
            Cuando encuentres uno que te guste, pulsa «Guardar look».
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-6 min-h-12 rounded-full bg-ink px-6 text-surface"
          >
            Crear mi primer look
          </button>
        </div>
      ) : null}

      <ul className="mt-6 space-y-5">
        {(looks ?? []).map((look) => {
          const expanded = open === look.id;
          return (
            <li key={look.id} className="soft-card overflow-hidden">
              <LookImage look={look} />
              <div className="px-4 py-4">
                <p className="text-xs tracking-widest text-blush uppercase">
                  {situationById(look.situation).label} · {when(look.savedAt)}
                </p>
                <p className="mt-1 font-display text-2xl">{look.title}</p>
                <p className="text-sm text-muted">{look.line}</p>
                {look.stylist ? (
                  <p className="mt-1 text-xs text-muted">Firmado por {look.stylist}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : look.id)}
                    className="inline-flex min-h-11 items-center gap-1 text-sm font-medium"
                  >
                    {expanded ? "Ocultar pasos" : `Ver ${look.steps.length} pasos`}
                    <ChevronDown
                      className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => drop(look.id)}
                    aria-label={`Borrar el look ${look.title}`}
                    className="icon-button text-muted"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                {expanded ? (
                  <ol className="mt-2 space-y-3 border-t border-line pt-4">
                    {look.steps.map((step, index) => (
                      <li key={`${step.zone}-${index}`} className="flex gap-3 text-sm">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-blush text-xs text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">
                            {ZONE_LABEL[step.zone]} · {step.title}
                          </p>
                          <p className="text-muted">{step.instruction}</p>
                          <p className="mt-1 text-xs text-muted">{step.product}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
