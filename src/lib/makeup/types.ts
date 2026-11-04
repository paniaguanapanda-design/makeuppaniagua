export const SITUATIONS = [
  {
    id: "dia",
    label: "Día a día",
    line: "Piel descansada y color mínimo.",
  },
  {
    id: "oficina",
    label: "Oficina",
    line: "Nítida en reunión, sin cara de set.",
  },
  {
    id: "entrevista",
    label: "Entrevista",
    line: "Cejas y labio. El resto, en calma.",
  },
  {
    id: "cita",
    label: "Cita",
    line: "Calor en el pómulo, labio cercano.",
  },
  {
    id: "boda",
    label: "Boda",
    line: "Luz que aguanta fotos y horas.",
  },
  {
    id: "fiesta",
    label: "Fiesta",
    line: "Ojo profundo y labio que se ve de lejos.",
  },
  {
    id: "fotos",
    label: "Sesión de fotos",
    line: "Piel uniforme bajo flash y ventana.",
  },
  {
    id: "editorial",
    label: "Editorial",
    line: "Contraste de estudio, un punto gráfico.",
  },
] as const;

export type SituationId = (typeof SITUATIONS)[number]["id"];

export const ZONES = [
  "base",
  "cejas",
  "contorno",
  "rubor",
  "iluminador",
  "ojos",
  "labios",
  "fijador",
] as const;

export type ZoneId = (typeof ZONES)[number];

export const PAINT_ZONES = [
  "base",
  "contorno",
  "rubor",
  "ojos",
  "labios",
  "iluminador",
  "cejas",
] as const;

export type PaintZone = (typeof PAINT_ZONES)[number];

export type Undertone = "calido" | "frio" | "neutro";
export type Depth = "clara" | "media" | "profunda";
export type FaceShape = "ovalado" | "redondo" | "cuadrado" | "corazon" | "alargado";

export type Pt = { x: number; y: number };

export type FaceRead = {
  shape: FaceShape;
  undertone: Undertone;
  depth: Depth;
  skinHex: string;
};

export type Product = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  category: ZoneId;
  finish: string;
  shade: string;
  hex: string;
  undertone: string;
  depth: string;
  priceEur: number;
};

export type Step = {
  order: number;
  zone: ZoneId;
  title: string;
  instruction: string;
  product: Product;
  tension: boolean;
};

export type Stylist = {
  id: string;
  name: string;
  city: string;
  focus: string;
  signature: string;
  years: number;
};

export type Intensities = Record<PaintZone, number>;

export type LookPlan = {
  id: string;
  situation: SituationId;
  title: string;
  promise: string;
  mood: string;
  stylist: Stylist;
  intensities: Intensities;
  steps: Step[];
  alternates: Record<ZoneId, Product[]>;
};

export type BrandRow = {
  id: string;
  name: string;
  origin: string;
  note: string;
  tier: string;
  productCount: number;
};

export type Directory = {
  brands: BrandRow[];
  stylists: Stylist[];
  products: Product[];
  counts: {
    brands: number;
    stylists: number;
    products: number;
    looks: number;
  };
};

export type CaptureSource = "camera" | "studio";

export type Capture = {
  photo: HTMLCanvasElement;
  landmarks: Pt[] | null;
  read: FaceRead | null;
  source: CaptureSource;
};

export const SHAPE_LABEL: Record<FaceShape, string> = {
  ovalado: "Ovalado",
  redondo: "Redondo",
  cuadrado: "Cuadrado",
  corazon: "Corazón",
  alargado: "Alargado",
};

export const TONE_LABEL: Record<Undertone, string> = {
  calido: "Cálido",
  frio: "Frío",
  neutro: "Neutro",
};

export const DEPTH_LABEL: Record<Depth, string> = {
  clara: "Clara",
  media: "Media",
  profunda: "Profunda",
};

export const ZONE_LABEL: Record<ZoneId, string> = {
  base: "Base",
  cejas: "Cejas",
  contorno: "Contorno",
  rubor: "Rubor",
  iluminador: "Luz",
  ojos: "Ojos",
  labios: "Labios",
  fijador: "Fijador",
};

export const SHAPE_NOTE: Record<FaceShape, string> = {
  ovalado: "El óvalo admite el color un poco más arriba, hacia la sien.",
  redondo: "El rubor va en diagonal hacia la oreja, no en círculo sobre la manzana.",
  cuadrado: "Suaviza el ángulo de la mandíbula y sube la luz al pómulo.",
  corazon: "Poco producto en la sien. Un punto de color más bajo equilibra la frente.",
  alargado: "Lleva el rubor en horizontal. Subirlo alarga todavía más la cara.",
};

export function situationById(id: SituationId) {
  return SITUATIONS.find((item) => item.id === id) ?? SITUATIONS[0];
}
