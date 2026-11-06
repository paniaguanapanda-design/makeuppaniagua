import { personPrompt, type PersonBrief } from "@/lib/makeup/profile";
import type {
  Depth,
  FaceRead,
  FaceShape,
  SituationId,
  Undertone,
  ZoneId,
} from "@/lib/makeup/types";

export const OPTION_IDS = ["piel", "poco", "natural", "definido", "cargado"] as const;
export type OptionId = (typeof OPTION_IDS)[number];

export type LookOption = {
  id: OptionId;
  title: string;
  line: string;
  prompt: string;
  zones: ZoneId[];
};

const SHAPE_FIT: Record<FaceShape, string> = {
  ovalado: "Oval face: place blush slightly toward the temple.",
  redondo:
    "Round face: lift the color toward the temples and do not put a round patch on the cheek apple.",
  cuadrado: "Square face: soften the jaw corners and round the blush.",
  corazon: "Heart-shaped face: little product on the temples, blush lower on the cheek.",
  alargado:
    "Long face: blush sits horizontal at mid-cheek. Do not lengthen the nose with highlight.",
};

const TONE_FIT: Record<Undertone, string> = {
  calido: "Warm undertone: peach, bronze and brown-rose. No cool pink, no blue-red.",
  frio: "Cool undertone: rose, mauve and taupe. No orange.",
  neutro: "Neutral undertone: shades that look like they came from this skin.",
};

const DEPTH_FIT: Record<Depth, string> = {
  clara: "Fair skin: sheer pigment, nothing chalky or mask-like.",
  media: "Medium skin: the color has to read, without looking painted on.",
  profunda: "Deep skin: rich shades matched to this depth. No pale or ashy colors.",
};

const OCCASION: Record<SituationId, string> = {
  dia: "Daytime, in real daylight.",
  oficina: "An office day. Professional and quiet.",
  entrevista: "A close-up interview. Use a polished makeup look suitable for an interview.",
  cita: "A date. Warm, but still like her.",
  boda: "A wedding guest in daylight photos.",
  fiesta: "A night out. Visible evening makeup, with stronger eye and lip definition.",
  fotos: "A portrait session. Skin should look like skin on camera.",
  editorial: "A studio story. Visible fashion makeup with deliberate color and definition.",
};

const LEVEL: Record<OptionId, { prompt: string; zones: ZoneId[] }> = {
  piel: {
    zones: ["base", "cejas", "rubor", "ojos", "labios"],
    prompt:
      "NATURAL MAKEUP: apply satin foundation matched to the existing skin, visibly rosy-peach blush blended on the cheeks, softly filled brows, light taupe eyeshadow, a fine brown lash-line eyeliner, black mascara on separated lashes, and clearly visible rose-nude lipstick. Light intensity, but unmistakably wearing makeup rather than bare skin.",
  },
  poco: {
    zones: ["cejas", "rubor", "labios"],
    prompt:
      "Very few products. Natural skin, a whisper of sheer blush, a quiet lip. No eyeshadow, no contour, no highlighter. Not saturated.",
  },
  natural: {
    zones: ["base", "cejas", "rubor", "ojos", "labios", "iluminador"],
    prompt:
      "SOFT GLAM MAKEUP: apply satin foundation, visible rose blush, defined filled brows, bronze or mauve eyeshadow with a darker outer corner, a clean thin winged eyeliner, black mascara with fuller lashes, subtle cheekbone highlighter, and medium-depth rose lipstick with a satin finish. Medium intensity: visibly more eye definition and richer lip color than the natural look.",
  },
  definido: {
    zones: ["base", "cejas", "contorno", "rubor", "ojos", "labios", "iluminador"],
    prompt:
      "DEFINED GLAM MAKEUP: apply full but realistic satin foundation, sculpted brows, softly blended cheek contour, visible rose blush and cheekbone highlighter, a dimensional brown or plum smoky eyeshadow, precise black winged eyeliner, long defined black mascara lashes, and a clearly pigmented berry-red satin lipstick within the natural lip outline. Strongest intensity: a complete professional makeup transformation, with richer eyes and lips than soft glam, blended rather than theatrical.",
  },
  cargado: {
    zones: ["base", "cejas", "contorno", "rubor", "ojos", "labios"],
    prompt:
      "The most makeup of this set, still blended into the skin. Richer color, but not a mask, not clownish and not oversaturated.",
  },
};

const COPY: Record<SituationId, { title: string; line: string }[]> = {
  dia: [
    { title: "Día natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Dos toques", line: "Rubor mínimo y labio. Nada más." },
    { title: "Día soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Día glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Día hecho", line: "El más completo del día, todavía ligero." },
  ],
  oficina: [
    { title: "Oficina natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Poco", line: "Labio y un rubor que no llega a la cámara." },
    { title: "Oficina soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Oficina glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Presente", line: "Lo más hecho que cabe en una oficina." },
  ],
  entrevista: [
    { title: "Entrevista natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Labio claro", line: "Un punto de color y la ceja en su sitio." },
    { title: "Entrevista soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Entrevista glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Firme", line: "Un poco más de estructura, sin dramatismo." },
  ],
  cita: [
    { title: "Cita natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Calor bajo", line: "Un rubor que sale de la piel." },
    { title: "Cita soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Cita glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Cita de noche", line: "El más hecho, todavía creíble." },
  ],
  boda: [
    { title: "Invitada natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Invitada mínima", line: "Rubor y labio, sin máscara." },
    { title: "Invitada soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Invitada glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Foto de grupo", line: "Lo más hecho, sin verse pesado." },
  ],
  fiesta: [
    { title: "Fiesta natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Poco de noche", line: "Labio y rubor. El ojo, limpio." },
    { title: "Fiesta soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Fiesta glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Fiesta", line: "El más cargado, mezclado en la piel." },
  ],
  fotos: [
    { title: "Retrato natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Poco", line: "Un toque de color y la ceja." },
    { title: "Retrato soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Retrato glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Retrato", line: "Contraste suficiente, sin máscara." },
  ],
  editorial: [
    { title: "Editorial natural", line: "Labial rosado, rubor y mirada definida." },
    { title: "Un labio", line: "Pocos productos, un solo acento." },
    { title: "Editorial soft glam", line: "Sombras satinadas, delineado y labios con color." },
    { title: "Editorial glam", line: "Ojos ahumados, pestañas y labial intenso." },
    { title: "Contraste", line: "El más gráfico, todavía real." },
  ],
};

export function optionsFor(situation: SituationId): LookOption[] {
  return OPTION_IDS.flatMap((id, index) => {
    if (id === "poco" || id === "cargado") return [];
    const copy = COPY[situation][index];
    const level = LEVEL[id];
    return {
      id,
      title: copy?.title ?? id,
      line: copy?.line ?? "",
      prompt: `${OCCASION[situation]} ${level.prompt}`,
      zones: level.zones,
    };
  });
}

export function optionById(situation: SituationId, id: OptionId) {
  return optionsFor(situation).find((item) => item.id === id) ?? optionsFor(situation)[1];
}

/** The kit says what the user owns, not which makeup areas must stay bare. */
export function visibleZones(option: LookOption, _owned: ZoneId[]) {
  return option.zones;
}

export function referencePrompt(
  situation: SituationId,
  option: LookOption,
  read: FaceRead,
  owned: ZoneId[] = [],
  person?: PersonBrief,
) {
  const zones = visibleZones(option, owned);
  return [
    "Edit this photograph. Keep the exact same person: same face, age, identity, hair, expression, pose, clothing and background.",
    "Do not replace them with another model. Do not paste makeup on top like a filter or face paint.",
    "Show a real photograph of this person after a makeup artist finished the look, blended into their skin.",
    "Apply actual cosmetic color to the lips, cheeks and eyes. This is a virtual makeup try-on, NOT a skin retouch, beauty filter or smoothing task. A merely softened or unchanged face is not a completed makeup look.",
    SHAPE_FIT[read.shape],
    TONE_FIT[read.undertone],
    DEPTH_FIT[read.depth],
    option.prompt,
    person ? personPrompt(person) : "",
    `Complete all these makeup areas: ${zones.join(", ")}. Match cosmetic pigments to the original skin tone; do not lighten or recolor the skin itself.`,
    owned.length
      ? `Products already owned: ${owned.join(", ")}. These are available products, not restrictions: still complete the whole makeup look.`
      : "",
    "Make the makeup clearly visible at portrait size: distinct lipstick color, blush on cheeks, eyeshadow, eyeliner and mascara. Keep edges professionally blended, not painted patches.",
    "Preserve pores, fine lines and natural skin texture. Do not blur, airbrush, smooth, de-age or reshape the face. No clown makeup, theatrical face paint, harsh outlines, oversized lips, plastic skin or beauty filter.",
    "No text, no watermark, no extra people.",
  ]
    .filter(Boolean)
    .join(" ");
}
