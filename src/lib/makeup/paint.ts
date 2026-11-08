import {
  PAINT_ZONES,
  type Depth,
  type FaceRead,
  type FaceShape,
  type PaintZone,
  type Pt,
  type Undertone,
  type ZoneId,
  type SituationId,
} from "@/lib/makeup/types";

export type ZoneRecipe = {
  enabled: boolean;
  intensity: number;
  hex: string;
};

export type Recipe = {
  zones: Record<PaintZone, ZoneRecipe>;
};

export type MakeupSubject = {
  situation: SituationId;
  read: FaceRead | null;
  /** 0 = natural. 1 = referencia visible para comparar looks. */
  boost?: number;
  /** Nivel del look: marca cuánto se ve cada técnica. */
  level?: LookLevel;
};

export type LookLevel = "natural" | "medio" | "glam";

/** Mínimos de técnica por nivel, para que los tres looks se parezcan a lo que genera la IA. */
const LEVEL_FLOOR: Record<LookLevel, Partial<Technique>> = {
  natural: { blush: 0.4, lipCover: 0.45, brow: 0.5, smooth: 0.26, underEye: 0.35, pigment: 0.4 },
  medio: {
    blush: 0.55,
    lipCover: 0.72,
    brow: 0.62,
    contour: 0.45,
    light: 0.5,
    eyeSmoke: 0.45,
    eyeLiner: 0.45,
    eyeGloss: 0.12,
    smooth: 0.3,
    underEye: 0.4,
    pigment: 0.58,
  },
  glam: {
    blush: 0.62,
    lipCover: 0.92,
    lipGloss: 0.35,
    brow: 0.72,
    contour: 0.68,
    light: 0.62,
    eyeSmoke: 0.88,
    eyeLiner: 0.92,
    eyeGloss: 0.25,
    smooth: 0.34,
    underEye: 0.45,
    pigment: 0.78,
  },
};

/** Cuánto pueden subir los máximos de opacidad en cada nivel. */
const LEVEL_SCALE: Record<LookLevel, number> = { natural: 1.1, medio: 1.4, glam: 1.75 };

// Escala de opacidad del look que se está pintando (el pintado es síncrono).
let capScale = 1;
const cap = (limit: number) => Math.min(0.95, limit * capScale);

function withLevel(base: Technique, level: LookLevel | undefined): Technique {
  if (!level) return base;
  const floor = LEVEL_FLOOR[level];
  const next = { ...base };
  (Object.keys(floor) as (keyof Technique)[]).forEach((key) => {
    next[key] = Math.max(base[key], floor[key] ?? 0);
  });
  return next;
}

type Technique = {
  smooth: number;
  veil: number;
  contour: number;
  blush: number;
  eyeSmoke: number;
  eyeLiner: number;
  eyeGloss: number;
  lipCover: number;
  lipGloss: number;
  brow: number;
  light: number;
  underEye: number;
  pigment: number;
};

const TECHNIQUE: Record<SituationId, Technique> = {
  dia: {
    smooth: 0.22,
    veil: 0.16,
    contour: 0.32,
    blush: 0.42,
    eyeSmoke: 0.1,
    eyeLiner: 0.12,
    eyeGloss: 0.04,
    lipCover: 0.38,
    lipGloss: 0.22,
    brow: 0.32,
    light: 0.32,
    underEye: 0.22,
    pigment: 0.34,
  },
  oficina: {
    smooth: 0.18,
    veil: 0.12,
    contour: 0.22,
    blush: 0.22,
    eyeSmoke: 0.06,
    eyeLiner: 0.2,
    eyeGloss: 0,
    lipCover: 0.52,
    lipGloss: 0.08,
    brow: 0.72,
    light: 0.14,
    underEye: 0.28,
    pigment: 0.4,
  },
  entrevista: {
    smooth: 0.2,
    veil: 0.1,
    contour: 0.24,
    blush: 0.2,
    eyeSmoke: 0.05,
    eyeLiner: 0.16,
    eyeGloss: 0.02,
    lipCover: 0.6,
    lipGloss: 0.14,
    brow: 0.78,
    light: 0.26,
    underEye: 0.55,
    pigment: 0.36,
  },
  cita: {
    smooth: 0.26,
    veil: 0.2,
    contour: 0.5,
    blush: 0.48,
    eyeSmoke: 0.32,
    eyeLiner: 0.38,
    eyeGloss: 0.22,
    lipCover: 0.58,
    lipGloss: 0.48,
    brow: 0.42,
    light: 0.4,
    underEye: 0.32,
    pigment: 0.46,
  },
  boda: {
    smooth: 0.3,
    veil: 0.22,
    contour: 0.4,
    blush: 0.46,
    eyeSmoke: 0.3,
    eyeLiner: 0.36,
    eyeGloss: 0.3,
    lipCover: 0.6,
    lipGloss: 0.42,
    brow: 0.48,
    light: 0.74,
    underEye: 0.4,
    pigment: 0.5,
  },
  fiesta: {
    smooth: 0.28,
    veil: 0.24,
    contour: 0.58,
    blush: 0.36,
    eyeSmoke: 0.88,
    eyeLiner: 0.92,
    eyeGloss: 0.34,
    lipCover: 0.84,
    lipGloss: 0.3,
    brow: 0.58,
    light: 0.18,
    underEye: 0.16,
    pigment: 0.72,
  },
  fotos: {
    smooth: 0.34,
    veil: 0.18,
    contour: 0.48,
    blush: 0.34,
    eyeSmoke: 0.26,
    eyeLiner: 0.34,
    eyeGloss: 0.12,
    lipCover: 0.56,
    lipGloss: 0.18,
    brow: 0.5,
    light: 0.7,
    underEye: 0.58,
    pigment: 0.44,
  },
  editorial: {
    smooth: 0.14,
    veil: 0.1,
    contour: 0.68,
    blush: 0.28,
    eyeSmoke: 0.82,
    eyeLiner: 0.96,
    eyeGloss: 0.08,
    lipCover: 0.92,
    lipGloss: 0.12,
    brow: 0.8,
    light: 0.12,
    underEye: 0.1,
    pigment: 0.8,
  },
};

type Place = {
  blushOut: number;
  blushUp: number;
  hollow: number;
  jaw: number;
  noseLight: number;
};

function placeOf(shape: FaceShape): Place {
  switch (shape) {
    case "redondo":
      return { blushOut: 0.46, blushUp: 0.22, hollow: 1.2, jaw: 0.65, noseLight: 0.55 };
    case "alargado":
      return { blushOut: 0.18, blushUp: -0.06, hollow: 0.62, jaw: 0.3, noseLight: 0.4 };
    case "corazon":
      return { blushOut: 0.12, blushUp: -0.12, hollow: 0.8, jaw: 1.15, noseLight: 0.45 };
    case "cuadrado":
      return { blushOut: 0.26, blushUp: 0.02, hollow: 0.9, jaw: 1.3, noseLight: 0.7 };
    default:
      return { blushOut: 0.28, blushUp: 0.08, hollow: 1, jaw: 0.72, noseLight: 0.8 };
  }
}

function boosted(base: Technique, boost: number): Technique {
  if (boost <= 0) return base;
  const up = (v: number) => Math.min(1, v * (1 + boost * 0.7) + boost * 0.08);
  return {
    ...base,
    contour: up(base.contour),
    blush: up(base.blush),
    eyeSmoke: up(base.eyeSmoke),
    eyeLiner: up(base.eyeLiner),
    lipCover: base.lipCover,
    brow: up(base.brow),
    light: up(base.light),
    pigment: Math.min(0.9, base.pigment + boost * 0.3),
  };
}

function depthGain(depth: Depth) {
  if (depth === "clara") return 0.78;
  if (depth === "profunda") return 1.16;
  return 1;
}

function wear(product: RGB, skin: RGB, pigment: number, undertone: Undertone): RGB {
  let color = mix(skin, product, Math.min(0.9, Math.max(0.2, pigment)));
  if (undertone === "calido") {
    color = mix(
      color,
      { r: Math.min(255, color.r + 18), g: color.g, b: Math.max(0, color.b - 14) },
      0.45,
    );
  }
  if (undertone === "frio") {
    color = mix(
      color,
      { r: Math.max(0, color.r - 12), g: color.g, b: Math.min(255, color.b + 18) },
      0.45,
    );
  }
  return color;
}

function shrink(points: Pt[], k: number) {
  const c = centroid(points);
  return points.map((point) => ({
    x: c.x + (point.x - c.x) * k,
    y: c.y + (point.y - c.y) * k,
  }));
}

function smoothClose(ctx: CanvasRenderingContext2D, points: Pt[]) {
  const n = points.length;
  if (n < 3) return;
  ctx.beginPath();
  const first = points[0];
  const second = points[1];
  ctx.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
  for (let i = 1; i < n; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % n];
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }
  ctx.closePath();
}

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
const LIP_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185,
];
const RIGHT_UPPER = [33, 246, 161, 160, 159, 158, 157, 173, 133];
const LEFT_UPPER = [263, 466, 388, 387, 386, 385, 384, 398, 362];
const RIGHT_LOWER = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const LEFT_LOWER = [263, 249, 390, 373, 374, 380, 381, 382, 362];
const RIGHT_BROW_TOP = [70, 63, 105, 66, 107];
const RIGHT_BROW_BOT = [46, 53, 52, 65, 55];
const LEFT_BROW_TOP = [300, 293, 334, 296, 336];
const LEFT_BROW_BOT = [276, 283, 282, 295, 285];

type RGB = { r: number; g: number; b: number };

function rgbOf(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: Number.parseInt(h.slice(0, 2), 16) || 0,
    g: Number.parseInt(h.slice(2, 4), 16) || 0,
    b: Number.parseInt(h.slice(4, 6), 16) || 0,
  };
}

function hexOf(color: RGB) {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function rgba(color: RGB, alpha: number) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

function px(lm: Pt[], index: number, w: number, h: number): Pt {
  const point = lm[index] ?? { x: 0.5, y: 0.5 };
  return { x: point.x * w, y: point.y * h };
}

function pathOf(lm: Pt[], indices: number[], w: number, h: number) {
  return indices.map((index) => px(lm, index, w, h));
}

function trace(ctx: CanvasRenderingContext2D, points: Pt[], close = true) {
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  if (close) ctx.closePath();
}

function centroid(points: Pt[]): Pt {
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  const n = Math.max(1, points.length);
  return { x: x / n, y: y / n };
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function blob(
  ctx: CanvasRenderingContext2D,
  center: Pt,
  rx: number,
  ry: number,
  rotation: number,
  color: RGB,
  alpha: number,
  operation: GlobalCompositeOperation,
) {
  if (alpha <= 0.01 || rx < 1 || ry < 1) return;
  ctx.save();
  ctx.globalCompositeOperation = operation;
  const gradient = ctx.createRadialGradient(
    center.x,
    center.y,
    Math.min(rx, ry) * 0.08,
    center.x,
    center.y,
    Math.max(rx, ry),
  );
  gradient.addColorStop(0, rgba(color, alpha));
  gradient.addColorStop(0.62, rgba(color, alpha * 0.45));
  gradient.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sampleSkin(photo: HTMLCanvasElement, lm: Pt[]): RGB {
  const ctx = photo.getContext("2d");
  if (!ctx) return { r: 210, g: 170, b: 145 };
  const { width, height } = photo;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const index of [50, 187, 280, 411]) {
    const point = lm[index];
    if (!point) continue;
    const cx = Math.round(point.x * width);
    const cy = Math.round(point.y * height);
    const data = ctx.getImageData(Math.max(0, cx - 3), Math.max(0, cy - 3), 7, 7).data;
    for (let i = 0; i < data.length; i += 4) {
      const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (y > 246) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  if (!n) return { r: 210, g: 170, b: 145 };
  return { r: r / n, g: g / n, b: b / n };
}

function pixelDist(lm: Pt[], a: number, b: number, w: number, h: number) {
  const pa = lm[a];
  const pb = lm[b];
  if (!pa || !pb) return 1;
  return Math.hypot((pa.x - pb.x) * w, (pa.y - pb.y) * h);
}

export function readFace(photo: HTMLCanvasElement, lm: Pt[]): FaceRead {
  const skin = sampleSkin(photo, lm);
  const y = 0.2126 * skin.r + 0.7152 * skin.g + 0.0722 * skin.b;
  const depth: Depth = y > 178 ? "clara" : y > 118 ? "media" : "profunda";
  const warmth = skin.r - skin.b;
  const undertone: Undertone = warmth > 26 ? "calido" : warmth < 14 ? "frio" : "neutro";

  const w = photo.width;
  const h = photo.height;
  const cheek = pixelDist(lm, 234, 454, w, h);
  const jaw = pixelDist(lm, 172, 397, w, h);
  const temple = pixelDist(lm, 127, 356, w, h);
  const height = pixelDist(lm, 10, 152, w, h);
  const ratio = height / Math.max(cheek, 1);
  const jawR = jaw / Math.max(cheek, 1);
  const jawToTemple = jaw / Math.max(temple, 1);
  let shape: FaceShape = "ovalado";
  if (ratio >= 1.55) shape = "alargado";
  else if (jawToTemple < 0.72 && ratio < 1.55) shape = "corazon";
  else if (jawR > 0.9 && ratio < 1.42) shape = "cuadrado";
  else if (ratio < 1.32 && jawR > 0.86) shape = "redondo";

  return { shape, undertone, depth, skinHex: hexOf(skin) };
}

function paintBase(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  oval: Pt[],
  skin: RGB,
  hex: string,
  amount: number,
  tech: Technique,
  undertone: Undertone,
  gain: number,
  w: number,
  h: number,
) {
  if (amount <= 0.02) return;
  const eye = Math.max(18, dist(px(lm, 33, w, h), px(lm, 263, w, h)));
  const veil = document.createElement("canvas");
  veil.width = w;
  veil.height = h;
  const blurred = veil.getContext("2d");
  if (blurred) {
    blurred.filter = `blur(${Math.max(1.4, eye * 0.01).toFixed(1)}px)`;
    blurred.drawImage(ctx.canvas, 0, 0);
    ctx.save();
    trace(ctx, oval);
    ctx.clip();
    ctx.globalAlpha = tech.smooth * (0.3 + amount * 0.4) * (gain > 1 ? 0.85 : 1);
    ctx.drawImage(veil, 0, 0);
    ctx.globalCompositeOperation = "soft-light";
    ctx.globalAlpha = tech.veil * (0.3 + amount * 0.45);
    ctx.fillStyle = rgba(mix(skin, rgbOf(hex), 0.22), 1);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const peach =
    undertone === "frio"
      ? mix(skin, { r: 232, g: 210, b: 206 }, 0.3)
      : mix(skin, { r: 226, g: 170, b: 138 }, 0.26);
  const under = tech.underEye * amount * gain;
  for (const index of [111, 340]) {
    blob(
      ctx,
      px(lm, index, w, h),
      eye * 0.16,
      eye * 0.07,
      0,
      peach,
      Math.min(0.16, under * 0.12),
      "soft-light",
    );
  }
}

function paintContour(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  hex: string,
  amount: number,
  tech: Technique,
  place: Place,
  skin: RGB,
  undertone: Undertone,
  gain: number,
) {
  const vis = amount * tech.contour * gain * place.hollow;
  if (vis <= 0.02) return;
  const color = mix(
    wear(rgbOf(hex), skin, tech.pigment * 0.7, undertone),
    { r: 96, g: 62, b: 44 },
    0.5,
  );
  const eye = Math.max(18, dist(px(lm, 33, w, h), px(lm, 263, w, h)));
  const nose = px(lm, 1, w, h);
  const hollows: [number, number][] = [
    [123, 172],
    [352, 397],
  ];
  for (const [cheekIndex, jawIndex] of hollows) {
    const cheek = px(lm, cheekIndex, w, h);
    const jaw = px(lm, jawIndex, w, h);
    const center = {
      x: cheek.x * 0.58 + jaw.x * 0.42 + (cheek.x - nose.x) * 0.12,
      y: cheek.y * 0.42 + jaw.y * 0.58,
    };
    const angle = Math.atan2(jaw.y - cheek.y, jaw.x - cheek.x);
    blob(
      ctx,
      center,
      eye * 0.26,
      eye * 0.08,
      angle,
      color,
      Math.min(cap(0.34), (0.1 + vis * 0.22) * capScale),
      "multiply",
    );
  }
  blob(
    ctx,
    { x: nose.x - eye * 0.08, y: nose.y },
    eye * 0.045,
    eye * 0.16,
    0,
    color,
    Math.min(cap(0.22), vis * 0.16 * capScale),
    "multiply",
  );
  blob(
    ctx,
    { x: nose.x + eye * 0.08, y: nose.y },
    eye * 0.045,
    eye * 0.16,
    0,
    color,
    Math.min(cap(0.22), vis * 0.16 * capScale),
    "multiply",
  );
  const jawAlpha = Math.min(cap(0.2), vis * 0.12 * place.jaw * capScale);
  blob(ctx, px(lm, 172, w, h), eye * 0.16, eye * 0.08, 0.5, color, jawAlpha, "multiply");
  blob(ctx, px(lm, 397, w, h), eye * 0.16, eye * 0.08, -0.5, color, jawAlpha, "multiply");
}

function paintBlush(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  hex: string,
  amount: number,
  tech: Technique,
  place: Place,
  skin: RGB,
  undertone: Undertone,
  gain: number,
) {
  const vis = amount * tech.blush * gain;
  if (vis <= 0.02) return;
  const color = wear(rgbOf(hex), skin, tech.pigment * 0.8, undertone);
  const eye = Math.max(18, dist(px(lm, 33, w, h), px(lm, 263, w, h)));
  const nose = px(lm, 1, w, h);
  for (const [cheekIndex, eyeIndex] of [
    [50, 33],
    [280, 263],
  ] as const) {
    const cheek = px(lm, cheekIndex, w, h);
    const outer = px(lm, eyeIndex, w, h);
    const center = {
      x: cheek.x + (cheek.x - nose.x) * place.blushOut,
      y: cheek.y + (outer.y - cheek.y) * place.blushUp,
    };
    const angle = Math.atan2(cheek.y - nose.y, cheek.x - nose.x);
    const rx = eye * (0.15 + tech.blush * 0.12);
    const ry = eye * (0.08 + tech.blush * 0.06);
    blob(
      ctx,
      center,
      rx,
      ry,
      angle,
      color,
      Math.min(cap(0.38), (0.12 + vis * 0.26) * capScale),
      "soft-light",
    );
    blob(
      ctx,
      center,
      rx * 0.7,
      ry * 0.7,
      angle,
      color,
      Math.min(cap(0.18), vis * 0.14 * capScale),
      "multiply",
    );
  }
}

function paintEye(
  ctx: CanvasRenderingContext2D,
  upper: Pt[],
  lower: Pt[],
  color: RGB,
  amount: number,
  tech: Technique,
  gain: number,
) {
  const strength = amount * gain * capScale;
  if (upper.length < 4 || strength <= 0.02) return;
  const outer = upper[0];
  const inner = upper[upper.length - 1];
  const span = Math.max(8, dist(outer, inner));
  const mid = centroid(upper);
  const low = lower.length > 2 ? centroid(lower) : { x: mid.x, y: mid.y + span * 0.25 };
  const ulen = Math.hypot(mid.x - low.x, mid.y - low.y) || 1;
  const ux = (mid.x - low.x) / ulen;
  const uy = (mid.y - low.y) / ulen;
  const vx = (outer.x - inner.x) / span;
  const vy = (outer.y - inner.y) / span;
  const deep = mix(color, { r: 36, g: 18, b: 16 }, 0.3 + tech.eyeSmoke * 0.45);
  ctx.save();
  if (tech.eyeSmoke > 0.08) {
    const crease = upper.map((point, index) => {
      const t = index / (upper.length - 1);
      const lift = span * tech.eyeSmoke * (0.16 + Math.sin(Math.PI * t) * 0.34);
      return { x: point.x + ux * lift, y: point.y + uy * lift };
    });
    ctx.beginPath();
    upper.forEach((point, index) =>
      index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
    );
    for (let i = crease.length - 1; i >= 0; i -= 1) ctx.lineTo(crease[i].x, crease[i].y);
    ctx.closePath();
    // Sombra difuminada y multiplicada: se funde con el párpado en vez de quedar como una caja.
    ctx.filter = `blur(${Math.max(1.5, span * 0.07).toFixed(1)}px)`;
    ctx.globalCompositeOperation = "multiply";
    const shade = ctx.createLinearGradient(inner.x, inner.y, outer.x, outer.y);
    shade.addColorStop(0, rgba(color, 0.04 * strength));
    shade.addColorStop(0.5, rgba(color, 0.2 * tech.eyeSmoke * strength));
    shade.addColorStop(1, rgba(deep, 0.5 * tech.eyeSmoke * strength));
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
  }
  // No se pinta entre los párpados: ahí está el blanco del ojo y lo volvía lechoso.
  if (tech.eyeLiner > 0.05) {
    // Solo la mitad exterior del párpado, de dentro hacia fuera, y el rabillo sale desde la esquina
    // exterior (antes volvía en línea recta desde el lagrimal y cruzaba el ojo).
    const lash = upper.slice(0, Math.max(3, Math.ceil(upper.length * 0.62))).reverse();
    ctx.beginPath();
    lash.forEach((point, index) =>
      index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
    );
    if (tech.eyeLiner > 0.55) {
      ctx.lineTo(
        outer.x + vx * span * 0.13 + ux * span * 0.06,
        outer.y + vy * span * 0.13 + uy * span * 0.06,
      );
    }
    ctx.filter = "blur(0.6px)";
    ctx.strokeStyle = rgba(
      deep,
      Math.min(0.85, (0.2 + tech.eyeLiner * 0.55) * Math.min(1.1, strength + 0.2)),
    );
    ctx.lineWidth = Math.max(0.9, span * (0.014 + tech.eyeLiner * 0.022));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.filter = "none";
  }
  if (tech.eyeGloss > 0.08) {
    blob(
      ctx,
      mid,
      span * 0.16,
      span * 0.07,
      0,
      { r: 255, g: 248, b: 240 },
      0.28 * tech.eyeGloss * strength,
      "screen",
    );
  }
  ctx.restore();
}

function paintBrows(
  ctx: CanvasRenderingContext2D,
  top: Pt[],
  bot: Pt[],
  color: RGB,
  amount: number,
  tech: Technique,
  gain: number,
) {
  const vis = amount * tech.brow * gain;
  if (top.length < 3 || bot.length < 3 || vis <= 0.02) return;
  const deep = mix(color, { r: 42, g: 26, b: 18 }, 0.45);
  ctx.save();
  ctx.beginPath();
  top.forEach((point, index) =>
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
  );
  for (let i = bot.length - 1; i >= 0; i -= 1) ctx.lineTo(bot[i].x, bot[i].y);
  ctx.closePath();
  ctx.filter = `blur(${Math.max(1, dist(top[0], top[top.length - 1]) * 0.012).toFixed(1)}px)`;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = rgba(deep, Math.min(cap(0.32), (0.06 + vis * 0.24) * capScale));
  ctx.fill();
  ctx.filter = "none";
  ctx.strokeStyle = rgba(deep, Math.min(cap(0.28), (0.06 + vis * 0.18) * capScale));
  ctx.lineWidth = Math.max(0.7, dist(top[0], top[top.length - 1]) * (0.02 + tech.brow * 0.02));
  ctx.lineCap = "round";
  ctx.beginPath();
  top.forEach((point, index) =>
    index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y),
  );
  ctx.stroke();
  ctx.restore();
}

function paintHighlight(
  ctx: CanvasRenderingContext2D,
  lm: Pt[],
  w: number,
  h: number,
  hex: string,
  amount: number,
  tech: Technique,
  place: Place,
  gain: number,
) {
  const vis = amount * tech.light * gain;
  if (vis <= 0.02) return;
  const color = mix(rgbOf(hex), { r: 255, g: 250, b: 242 }, 0.55);
  const eye = Math.max(18, dist(px(lm, 33, w, h), px(lm, 263, w, h)));
  const nose = px(lm, 6, w, h);
  blob(
    ctx,
    nose,
    eye * 0.05,
    eye * 0.2,
    0,
    color,
    Math.min(cap(0.28), vis * 0.34 * capScale) * place.noseLight,
    "soft-light",
  );
  blob(
    ctx,
    px(lm, 133, w, h),
    eye * 0.06,
    eye * 0.05,
    0,
    color,
    Math.min(cap(0.22), vis * 0.25 * capScale),
    "screen",
  );
  blob(
    ctx,
    px(lm, 362, w, h),
    eye * 0.06,
    eye * 0.05,
    0,
    color,
    Math.min(cap(0.22), vis * 0.25 * capScale),
    "screen",
  );
  for (const index of [116, 345]) {
    const bone = px(lm, index, w, h);
    blob(
      ctx,
      { x: bone.x, y: bone.y - eye * 0.04 },
      eye * 0.12,
      eye * 0.06,
      0,
      color,
      Math.min(cap(0.24), vis * 0.28 * capScale),
      "soft-light",
    );
  }
  blob(
    ctx,
    px(lm, 0, w, h),
    eye * 0.05,
    eye * 0.035,
    0,
    color,
    Math.min(cap(0.18), vis * 0.2 * capScale),
    "screen",
  );
}

function paintLips(
  ctx: CanvasRenderingContext2D,
  outer: Pt[],
  hex: string,
  amount: number,
  tech: Technique,
  skin: RGB,
  undertone: Undertone,
  gain: number,
) {
  const vis = amount * tech.lipCover * gain;
  if (outer.length < 4 || vis <= 0.02) return;
  const shaped = shrink(outer, 0.94);
  const color = wear(rgbOf(hex), skin, tech.pigment, undertone);
  const edge = mix(color, { r: 72, g: 32, b: 40 }, 0.35);
  const layer = document.createElement("canvas");
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const g = layer.getContext("2d");
  if (!g) return;
  g.filter = `blur(${Math.max(1, dist(shaped[0], shaped[Math.floor(shaped.length / 2)]) * 0.02).toFixed(1)}px)`;
  smoothClose(g, shaped);
  g.fillStyle = rgba(color, 1);
  g.fill();
  g.filter = "none";
  const center = centroid(shaped);
  const lower = shaped.reduce((best, point) => (point.y > best.y ? point : best), shaped[0]);
  const shineAt = { x: (center.x + lower.x) / 2, y: center.y * 0.4 + lower.y * 0.6 };
  const radius = Math.max(8, dist(shaped[0], shaped[Math.floor(shaped.length / 2)]) * 0.45);
  g.globalCompositeOperation = "source-atop";
  const gloss = g.createRadialGradient(shineAt.x, shineAt.y, 1, shineAt.x, shineAt.y, radius);
  gloss.addColorStop(0, `rgba(255,236,230,${0.15 + tech.lipGloss * 0.55})`);
  gloss.addColorStop(1, "rgba(255,236,230,0)");
  g.fillStyle = gloss;
  g.fillRect(0, 0, layer.width, layer.height);
  g.globalCompositeOperation = "source-over";
  g.filter = "blur(0.8px)";
  smoothClose(g, shaped);
  g.strokeStyle = rgba(edge, 0.35);
  g.lineWidth = Math.max(0.8, radius * 0.05);
  g.stroke();
  g.filter = "none";
  const alpha = Math.min(0.94, (0.28 + vis * 0.7) * Math.min(1.25, capScale));
  ctx.save();
  // Multiplicar conserva las líneas y el brillo reales del labio; soft-light le da cuerpo al color.
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alpha * 0.85;
  ctx.drawImage(layer, 0, 0);
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = alpha * 0.6;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}

function featherMask(oval: Pt[], w: number, h: number) {
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const ctx = mask.getContext("2d");
  if (!ctx) return mask;
  ctx.filter = "blur(8px)";
  trace(ctx, oval);
  ctx.fillStyle = "#fff";
  ctx.fill();
  return mask;
}

function drawCosmetics(
  ctx: CanvasRenderingContext2D,
  photo: HTMLCanvasElement,
  lm: Pt[],
  w: number,
  h: number,
  recipe: Recipe,
  subject: MakeupSubject,
) {
  const skin = sampleSkin(photo, lm);
  const oval = pathOf(lm, FACE_OVAL, w, h);
  const read = subject.read;
  const shape = read?.shape ?? "ovalado";
  const undertone = read?.undertone ?? "neutro";
  const depth = read?.depth ?? "media";
  const tech = withLevel(boosted(TECHNIQUE[subject.situation], subject.boost ?? 0), subject.level);
  capScale = subject.level ? LEVEL_SCALE[subject.level] : 1;
  const place = placeOf(shape);
  const gain = depthGain(depth);
  const zone = (name: PaintZone) => recipe.zones[name];

  const base = zone("base");
  if (base?.enabled)
    paintBase(ctx, lm, oval, skin, base.hex, base.intensity, tech, undertone, gain, w, h);
  const contour = zone("contorno");
  if (contour?.enabled) {
    paintContour(ctx, lm, w, h, contour.hex, contour.intensity, tech, place, skin, undertone, gain);
  }
  const blush = zone("rubor");
  if (blush?.enabled)
    paintBlush(ctx, lm, w, h, blush.hex, blush.intensity, tech, place, skin, undertone, gain);
  const eyes = zone("ojos");
  if (eyes?.enabled) {
    const color = mix(
      wear(rgbOf(eyes.hex), skin, tech.pigment, undertone),
      { r: 48, g: 26, b: 22 },
      tech.eyeSmoke * 0.4,
    );
    paintEye(
      ctx,
      pathOf(lm, RIGHT_UPPER, w, h),
      pathOf(lm, RIGHT_LOWER, w, h),
      color,
      eyes.intensity,
      tech,
      gain,
    );
    paintEye(
      ctx,
      pathOf(lm, LEFT_UPPER, w, h),
      pathOf(lm, LEFT_LOWER, w, h),
      color,
      eyes.intensity,
      tech,
      gain,
    );
  }
  const brows = zone("cejas");
  if (brows?.enabled) {
    const color = wear(rgbOf(brows.hex), skin, Math.max(0.45, tech.pigment), undertone);
    paintBrows(
      ctx,
      pathOf(lm, RIGHT_BROW_TOP, w, h),
      pathOf(lm, RIGHT_BROW_BOT, w, h),
      color,
      brows.intensity,
      tech,
      gain,
    );
    paintBrows(
      ctx,
      pathOf(lm, LEFT_BROW_TOP, w, h),
      pathOf(lm, LEFT_BROW_BOT, w, h),
      color,
      brows.intensity,
      tech,
      gain,
    );
  }
  const light = zone("iluminador");
  if (light?.enabled) paintHighlight(ctx, lm, w, h, light.hex, light.intensity, tech, place, gain);
  const lips = zone("labios");
  if (lips?.enabled)
    paintLips(
      ctx,
      pathOf(lm, LIP_OUTER, w, h),
      lips.hex,
      lips.intensity,
      tech,
      skin,
      undertone,
      gain,
    );

  const mask = featherMask(oval, w, h);
  ctx.save();
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}

export function paintPortrait(
  target: HTMLCanvasElement,
  photo: HTMLCanvasElement,
  landmarks: Pt[] | null,
  recipe: Recipe | null,
  wipe: number,
  subject: MakeupSubject = { situation: "dia", read: null },
) {
  const w = photo.width;
  const h = photo.height;
  if (target.width !== w) target.width = w;
  if (target.height !== h) target.height = h;
  const ctx = target.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(photo, 0, 0, w, h);
  if (!landmarks || !recipe) return;

  const made = document.createElement("canvas");
  made.width = w;
  made.height = h;
  const g = made.getContext("2d");
  if (!g) return;
  g.drawImage(photo, 0, 0, w, h);
  drawCosmetics(g, photo, landmarks, w, h, recipe, subject);

  const cut = Math.max(0, Math.min(1, wipe)) * w;
  if (cut >= w - 0.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(cut, 0, w - cut, h);
  ctx.clip();
  ctx.drawImage(made, 0, 0);
  ctx.restore();
  if (cut > 2 && cut < w - 2) {
    ctx.fillStyle = "rgba(255, 250, 246, 0.92)";
    ctx.fillRect(cut - 1, 0, 2, h);
  }
}

export function zoneAnchor(landmarks: Pt[] | null, zone: ZoneId): Pt | null {
  if (!landmarks) return null;
  const avg = (indices: number[]): Pt => {
    let x = 0;
    let y = 0;
    let n = 0;
    for (const index of indices) {
      const point = landmarks[index];
      if (!point) continue;
      x += point.x;
      y += point.y;
      n += 1;
    }
    if (!n) return { x: 0.5, y: 0.45 };
    return { x: x / n, y: y / n };
  };
  switch (zone) {
    case "base":
      return landmarks[10] ?? null;
    case "contorno":
      return avg([172, 397]);
    case "rubor":
      return avg([50, 280]);
    case "ojos":
      return avg([159, 386]);
    case "labios":
      return avg([13, 14]);
    case "iluminador":
      return landmarks[6] ?? null;
    case "cejas":
      return avg([105, 334]);
    default:
      return null;
  }
}

export function emptyRecipe(): Recipe {
  const zones = {} as Record<PaintZone, ZoneRecipe>;
  for (const zone of PAINT_ZONES) {
    zones[zone] = { enabled: true, intensity: 0.5, hex: "#c4a090" };
  }
  return { zones };
}
