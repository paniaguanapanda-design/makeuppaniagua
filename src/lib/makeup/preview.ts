import { emptyRecipe, paintPortrait, type Recipe } from "@/lib/makeup/paint";
import { visibleZones, type OptionId } from "@/lib/makeup/references";
import type { ReferenceCard } from "@/lib/makeup/imagine";
import type { Capture, Depth, PaintZone, SituationId, Undertone, ZoneId } from "@/lib/makeup/types";

const RUBOR: Record<Undertone, string> = { calido: "#d98873", frio: "#d4809a", neutro: "#d88a86" };
const LABIOS: Record<Undertone, string> = { calido: "#b8604f", frio: "#a8506a", neutro: "#b05a5e" };
const OJOS: Record<Undertone, string> = { calido: "#a8745a", frio: "#8a6a82", neutro: "#8d6a62" };
const CEJAS: Record<Depth, string> = { clara: "#8a6a55", media: "#5a4034", profunda: "#2f2320" };
const BASE: Record<Depth, string> = { clara: "#e8c4ac", media: "#d0a07f", profunda: "#8a5a3f" };

/** Qué tan fuerte se pinta cada zona en cada nivel. 0 = no se pinta. */
const LEVEL: Record<OptionId, Partial<Record<PaintZone, number>>> = {
  piel: { cejas: 0.45, labios: 0.35 },
  poco: { cejas: 0.5, rubor: 0.3, labios: 0.4 },
  natural: { base: 0.35, cejas: 0.55, rubor: 0.4, labios: 0.5 },
  definido: { base: 0.5, cejas: 0.6, rubor: 0.5, labios: 0.65, iluminador: 0.45 },
  cargado: { base: 0.6, cejas: 0.65, contorno: 0.5, rubor: 0.6, ojos: 0.6, labios: 0.8, iluminador: 0.4 },
};

function recipeFor(card: ReferenceCard, capture: Capture, owned: ZoneId[]): Recipe {
  const read = capture.read;
  const undertone = read?.undertone ?? "neutro";
  const depth = read?.depth ?? "media";
  const level = LEVEL[card.id];
  const shown = new Set<string>(
    visibleZones({ id: card.id, title: card.title, line: card.line, prompt: "", zones: card.zones }, owned),
  );
  const hex: Record<PaintZone, string> = {
    base: BASE[depth],
    contorno: "#8c6048",
    rubor: RUBOR[undertone],
    ojos: OJOS[undertone],
    labios: LABIOS[undertone],
    iluminador: "#f3dcc4",
    cejas: CEJAS[depth],
  };
  const recipe = emptyRecipe();
  (Object.keys(recipe.zones) as PaintZone[]).forEach((zone) => {
    const intensity = level[zone] ?? 0;
    recipe.zones[zone] = {
      enabled: intensity > 0 && shown.has(zone),
      intensity,
      hex: hex[zone],
    };
  });
  return recipe;
}

/** Pinta el look sobre la foto de la usuaria y devuelve una imagen. Todo ocurre en el celular. */
export function renderCard(
  card: ReferenceCard,
  capture: Capture,
  situation: SituationId,
  owned: ZoneId[],
): string {
  const target = document.createElement("canvas");
  paintPortrait(target, capture.photo, capture.landmarks, recipeFor(card, capture, owned), 0, {
    situation,
    read: capture.read,
    boost: 1.7,
  });
  return target.toDataURL("image/jpeg", 0.88);
}
