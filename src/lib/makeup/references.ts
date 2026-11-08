import { personPrompt, type PersonBrief } from "@/lib/makeup/profile";
import type {
  Depth,
  FaceRead,
  FaceShape,
  SituationId,
  Undertone,
  ZoneId,
} from "@/lib/makeup/types";

export const OPTION_IDS = ["natural", "medio", "glam"] as const;
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

const LEVEL: Record<OptionId, { title: string; prompt: string; zones: ZoneId[] }> = {
  natural: {
    title: "Natural",
    zones: ["base", "cejas", "rubor", "labios"],
    prompt:
      "Level 1 of 3, NATURAL: skin-first makeup. Sheer base only where needed, concealer only where the skin asks for it, groomed brows, a soft flush and a lip close to her own color. No visible eyeshadow, no contour. Fresh and believable.",
  },
  medio: {
    title: "Medio",
    zones: ["base", "cejas", "rubor", "iluminador", "ojos", "labios"],
    prompt:
      "Level 2 of 3, MEDIUM: a finished, polished look. Even skin, defined brows, soft brown or taupe eyeshadow blended in the crease, mascara, blush and a touch of highlight on the high points, a lip with clear color. Visible makeup, still elegant and wearable.",
  },
  glam: {
    title: "Glamuroso",
    zones: ["base", "cejas", "contorno", "rubor", "iluminador", "ojos", "labios"],
    prompt:
      "Level 3 of 3, GLAM: full professional makeup for an event. Perfected skin, sculpted contour, luminous highlight, a defined or softly smoked eye with liner and full lashes, and a statement lip. Rich and glamorous, but blended, refined and never a mask.",
  },
};

const LINES: Record<SituationId, Record<OptionId, string>> = {
  dia: {
    natural: "Piel fresca, como recién descansada.",
    medio: "Se nota arreglada, sin pesar.",
    glam: "El día con todo, todavía luminoso.",
  },
  oficina: {
    natural: "Pulida y en calma.",
    medio: "Nítida para reuniones.",
    glam: "Presencia de directiva.",
  },
  entrevista: {
    natural: "Descansada y segura.",
    medio: "Se lee bien en primer plano.",
    glam: "Impacto, sin perder seriedad.",
  },
  cita: {
    natural: "Como tú, en tu mejor día.",
    medio: "Pómulo cálido y labio cercano.",
    glam: "Mirada y labio para la noche.",
  },
  boda: {
    natural: "Luz limpia que aguanta horas.",
    medio: "Invitada perfecta en las fotos.",
    glam: "Look de gala que dura toda la fiesta.",
  },
  fiesta: {
    natural: "Salir sin pensarlo mucho.",
    medio: "Ojo marcado y piel luminosa.",
    glam: "Todo el brillo de la noche.",
  },
  fotos: {
    natural: "La cámara ve tu piel.",
    medio: "Estructura suave para el retrato.",
    glam: "Look de portada.",
  },
  editorial: {
    natural: "La cara manda.",
    medio: "Color medido, un punto gráfico.",
    glam: "Contraste de estudio.",
  },
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
  natural: 4,
  medio: 6,
  glam: 8,
};

export function optionsFor(situation: SituationId): LookOption[] {
  return OPTION_IDS.map((id) => {
    const level = LEVEL[id];
    return {
      id,
      title: level.title,
      line: LINES[situation][id],
      prompt: `${OCCASION[situation]} ${level.prompt}`,
      zones: level.zones,
    };
  });
}

export function optionById(situation: SituationId, id: OptionId) {
  return optionsFor(situation).find((item) => item.id === id) ?? optionsFor(situation)[0];
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
    "Edit this photograph by ONLY adding makeup. Keep the exact same person: same face, age, identity, hair, expression, pose, clothing, lighting and background.",
    "IDENTITY IS THE TOP PRIORITY: she must be instantly recognizable to her friends. Do not change the shape or size of the eyes, nose, lips, eyebrows bone, jaw, cheeks or face. No slimming, no lifting, no reshaping, no younger look.",
    "DO NOT RETOUCH OR BEAUTIFY THE SKIN: keep real skin texture, pores, freckles, moles, fine lines and natural unevenness visible. No airbrushing, no smoothing, no blur, no glow filter, no plastic skin.",
    "Foundation and concealer only even out tone slightly and must still show the skin texture underneath; blemishes can look softened, never erased.",
    "Do not replace her with another model. Do not paste makeup on top like a filter or face paint.",
    "Show a real, unretouched photograph of this person after a makeup artist finished the look, blended into her own skin.",
    "The makeup is affordable and everyday, not a luxury campaign.",
    SHAPE_FIT[read.shape],
    TONE_FIT[read.undertone],
    DEPTH_FIT[read.depth],
    option.prompt,
    person ? personPrompt(person) : "",
    `Makeup is visible only here: ${zones.join(", ") || "nowhere"}. Every other area stays bare skin.`,
    "Follow the level exactly: natural stays light, medium is clearly made up, glam is a full event look. Never oversaturate.",
    "No text, no watermark, no extra people.",
  ]
    .filter(Boolean)
    .join(" ");
}
