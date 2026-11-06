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
  entrevista: "A close-up interview. The face should look rested, not styled.",
  cita: "A date. Warm, but still like her.",
  boda: "A wedding guest in daylight photos.",
  fiesta: "A night out. Even the lightest option stays wearable.",
  fotos: "A portrait session. Skin should look like skin on camera.",
  editorial: "A studio story. Restraint still reads as fashion.",
};

const LEVEL: Record<OptionId, { prompt: string; zones: ZoneId[] }> = {
  piel: {
    zones: ["cejas", "labios"],
    prompt:
      "Almost no makeup. Bare real skin, a groomed brow and a lip tint that looks like her own mouth. No blush, no eyeshadow, no contour, no highlighter. Very unsaturated.",
  },
  poco: {
    zones: ["cejas", "rubor", "labios"],
    prompt:
      "Very few products. Natural skin, a whisper of sheer blush, a quiet lip. No eyeshadow, no contour, no highlighter. Not saturated.",
  },
  natural: {
    zones: ["base", "cejas", "rubor", "labios"],
    prompt:
      "Natural makeup with few products. Sheer skin, unsaturated blush, soft brow, lip close to her coloring. No smoky eye and no heavy pigment.",
  },
  definido: {
    zones: ["base", "cejas", "rubor", "labios", "iluminador"],
    prompt:
      "A finished but light look. Makeup is visible and neat, still sheer, not saturated and not glamorous.",
  },
  cargado: {
    zones: ["base", "cejas", "contorno", "rubor", "ojos", "labios"],
    prompt:
      "The most makeup of this set, still blended into the skin. Richer color, but not a mask, not clownish and not oversaturated.",
  },
};

const COPY: Record<SituationId, { title: string; line: string }[]> = {
  dia: [
    { title: "Piel sola", line: "Cejas y un labio que parece el suyo." },
    { title: "Dos toques", line: "Rubor mínimo y labio. Nada más." },
    { title: "Día natural", line: "Piel uniforme, sin verse maquillada." },
    { title: "Día suave", line: "Se nota, pero no satura." },
    { title: "Día hecho", line: "El más completo del día, todavía ligero." },
  ],
  oficina: [
    { title: "Sin rastro", line: "Casi no se ve producto." },
    { title: "Poco", line: "Labio y un rubor que no llega a la cámara." },
    { title: "Reunión", line: "Piel en calma y color bajo." },
    { title: "Pulida", line: "Nítida, sin cara de evento." },
    { title: "Presente", line: "Lo más hecho que cabe en una oficina." },
  ],
  entrevista: [
    { title: "Rostro limpio", line: "Que se vea descansada, no peinada." },
    { title: "Labio claro", line: "Un punto de color y la ceja en su sitio." },
    { title: "Primer plano", line: "La base no se ve." },
    { title: "Nítida", line: "Se lee en cámara sin saturarse." },
    { title: "Firme", line: "Un poco más de estructura, sin dramatismo." },
  ],
  cita: [
    { title: "Casi tú", line: "El labio y poco más." },
    { title: "Calor bajo", line: "Un rubor que sale de la piel." },
    { title: "Cita natural", line: "Pocos productos, nada cargado." },
    { title: "Cita", line: "Pómulo y labio, sin ahumar el ojo." },
    { title: "Cita de noche", line: "El más hecho, todavía creíble." },
  ],
  boda: [
    { title: "Piel de día", line: "Casi nada, aguanta la luz." },
    { title: "Invitada mínima", line: "Rubor y labio, sin máscara." },
    { title: "Luz natural", line: "Piel luminosa con pocos productos." },
    { title: "Invitada", line: "Se ve en la foto sin saturar." },
    { title: "Foto de grupo", line: "Lo más hecho, sin verse pesado." },
  ],
  fiesta: [
    { title: "Noche corta", line: "Salir con casi nada encima." },
    { title: "Poco de noche", line: "Labio y rubor. El ojo, limpio." },
    { title: "Natural de noche", line: "Se nota que saliste, no que te pintaron." },
    { title: "Noche suave", line: "Ojo marcado sin tapar la mirada." },
    { title: "Fiesta", line: "El más cargado, mezclado en la piel." },
  ],
  fotos: [
    { title: "Piel", line: "La cámara ve la cara, no el maquillaje." },
    { title: "Poco", line: "Un toque de color y la ceja." },
    { title: "Piel de cámara", line: "Uniforme, con pocos productos." },
    { title: "Retrato suave", line: "Luz en el hueso, color bajo." },
    { title: "Retrato", line: "Contraste suficiente, sin máscara." },
  ],
  editorial: [
    { title: "Casi nada", line: "La cara manda. El producto, no." },
    { title: "Un labio", line: "Pocos productos, un solo acento." },
    { title: "Piel quieta", line: "Natural, con el color medido." },
    { title: "Estudio suave", line: "Hecho, pero no saturado." },
    { title: "Contraste", line: "El más gráfico, todavía real." },
  ],
};

const ZONE_ORDER: ZoneId[] = [
  "labios",
  "cejas",
  "rubor",
  "base",
  "iluminador",
  "ojos",
  "contorno",
  "fijador",
];

const CAP: Record<OptionId, number> = {
  piel: 2,
  poco: 3,
  natural: 4,
  definido: 6,
  cargado: 8,
};

export function optionsFor(situation: SituationId): LookOption[] {
  return OPTION_IDS.flatMap((id, index) => {
    if (id === "poco" || id === "cargado") return [];
    const copy = COPY[situation][index];
    const level = LEVEL[id];
    const zones = level.zones.filter(
      (zone) => zone !== "ojos" || situation === "fiesta" || situation === "editorial",
    );
    return {
      id,
      title: copy?.title ?? id,
      line: copy?.line ?? "",
      prompt: `${OCCASION[situation]} ${level.prompt}`,
      zones:
        id === "definido" &&
        (situation === "fiesta" || situation === "editorial" || situation === "cita")
          ? [...zones, "ojos"]
          : zones,
    };
  });
}

export function optionById(situation: SituationId, id: OptionId) {
  return optionsFor(situation).find((item) => item.id === id) ?? optionsFor(situation)[1];
}

export function visibleZones(option: LookOption, owned: ZoneId[]) {
  if (!owned.length) return option.zones;
  const have = new Set(owned);
  const fit = option.zones.filter((zone) => have.has(zone));
  if (fit.length) return fit;
  return ZONE_ORDER.filter((zone) => have.has(zone)).slice(0, CAP[option.id]);
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
    "The makeup is affordable and everyday, not a luxury campaign.",
    SHAPE_FIT[read.shape],
    TONE_FIT[read.undertone],
    DEPTH_FIT[read.depth],
    option.prompt,
    person ? personPrompt(person) : "",
    `Makeup is visible only here: ${zones.join(", ") || "nowhere"}. Every other area stays bare skin.`,
    "Keep the color unsaturated unless this is the fullest option, and even then do not oversaturate.",
    "Preserve pores, fine lines and natural skin texture. No clown makeup, theatrical face paint, harsh outlines, oversized lips, plastic skin or beauty filter.",
    "No text, no watermark, no extra people.",
  ]
    .filter(Boolean)
    .join(" ");
}
