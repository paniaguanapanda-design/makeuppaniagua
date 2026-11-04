import type { ZoneId } from "@/lib/makeup/types";

export const AGES = [
  { id: "menor", label: "Menos de 18", line: "Poco producto y piel ligera. Nada de look adulto." },
  { id: "joven", label: "18 a 25", line: "Rubor, ceja y un labio que puede ser mate o con color." },
  { id: "treinta", label: "26 a 35", line: "Mirada abierta, tonos tierra y un labio con luz." },
  { id: "cuarenta", label: "36 a 45", line: "Satinado, coral o rojo, pestaña y ceja." },
  { id: "madura", label: "46 a 59", line: "Crema antes que polvo. Menos brillo donde hay textura." },
  { id: "silver", label: "60 o más", line: "Piel luminosa, pestaña y un labio que devuelva vida." },
] as const;

export type AgeId = (typeof AGES)[number]["id"];

export const TASTES = [
  { id: "natural", label: "Natural" },
  { id: "poco", label: "Pocos productos" },
  { id: "color", label: "Color" },
  { id: "luminosa", label: "Piel luminosa" },
  { id: "mate", label: "Mate" },
  { id: "ceja", label: "Ceja marcada" },
  { id: "labio", label: "El labio manda" },
  { id: "ojo", label: "La mirada manda" },
] as const;

export type TasteId = (typeof TASTES)[number]["id"];

export type KitField = "base" | "ojos" | "labios" | "resto";

export type PersonBrief = {
  age: AgeId;
  tastes: TasteId[];
  note: string;
  skin: string;
  skinFromPhoto?: boolean;
  kit: Record<KitField, string>;
};

const AGE_FIT: Record<AgeId, string> = {
  menor:
    "She is under 18. Keep the makeup age-appropriate: sheer skin, soft blush, mascara and a tinted balm. No heavy contour, no dramatic smoke, no mature glamour.",
  joven:
    "She is in her early twenties. Fresh skin, a defined brow and blush are welcome. A brighter lip is fine only if she asked for color.",
  treinta:
    "She is in her thirties. Open the eye with soft brown, keep the skin fresh and the lip luminous rather than flat matte.",
  cuarenta:
    "She is in her forties. Satin textures, peach or a classic red if the look allows, defined lashes and brows. Do not cake powder into lines.",
  madura:
    "She is in her fifties. Light cream textures, lift the eye, avoid glitter on textured skin, and keep the lip creamy.",
  silver:
    "She is 60 or older. Less product, a healthy glow, mascara, a soft base and a lip that brings the face back to life. No glitter, no mask.",
};

const TASTE_FIT: Record<TasteId, string> = {
  natural: "Her taste is natural makeup.",
  poco: "She wants as few products as possible.",
  color: "She likes a clear wash of color, usually on the lip or the cheek.",
  luminosa: "She prefers luminous skin, not a flat matte.",
  mate: "She prefers a soft matte finish, without glitter.",
  ceja: "The brow matters to her. Keep it groomed and visible.",
  labio: "The lip is the point of the makeup.",
  ojo: "The eye is the point of the makeup, still appropriate for her age.",
};

export function ageById(id: AgeId) {
  return AGES.find((item) => item.id === id) ?? AGES[1];
}

export function personLine(person: PersonBrief) {
  const age = ageById(person.age);
  const tastes = TASTES.filter((item) => person.tastes.includes(item.id)).map((item) => item.label);
  return [age.label, tastes.join(", ")].filter(Boolean).join(" · ");
}

export function composeNote(kit: Record<KitField, string>) {
  return [
    kit.base.trim() && `Piel y base: ${kit.base.trim()}`,
    kit.ojos.trim() && `Ojos: ${kit.ojos.trim()}`,
    kit.labios.trim() && `Labios: ${kit.labios.trim()}`,
    kit.resto.trim() && `Cejas, rubor y lo demás: ${kit.resto.trim()}`,
  ]
    .filter(Boolean)
    .join(". ")
    .slice(0, 800);
}

export function hersForZone(person: PersonBrief, zone: ZoneId) {
  if (zone === "base" || zone === "fijador") return person.kit.base.trim();
  if (zone === "ojos") return person.kit.ojos.trim();
  if (zone === "labios") return person.kit.labios.trim();
  return person.kit.resto.trim();
}

export function skinPrompt(skin: string, fromPhoto = false) {
  const text = skin.toLowerCase();
  if (!text.trim()) return "";
  if (fromPhoto && /piel pareja/.test(text)) {
    return "The photograph shows even skin. Do not invent dark circles, acne, redness or extra coverage.";
  }
  const lines = [
    fromPhoto
      ? `The photograph shows only this, for makeup, not a diagnosis: "${skin.slice(0, 300)}". Adjust only for what is visible.`
      : `She described her skin in her own words: "${skin.slice(0, 300)}". Respect that.`,
  ];
  if (/acne|acné|grano|barrito|espinilla/.test(text)) {
    lines.push("Acne-prone skin: a very light base, no heavy layers and no thick cream on the cheeks.");
  }
  if (/seca|tirante|escama|deshidr/.test(text)) {
    lines.push("Dry skin: cream textures. No flat matte powder that clings to dry patches.");
  }
  if (/grasa|brillo|poro/.test(text)) {
    lines.push("Oily skin: a soft matte and very little highlighter.");
  }
  if (/sensible|rosacea|rosácea|alerg|eczema|eccema/.test(text)) {
    lines.push("Sensitive skin: very few products, soft color, no glitter.");
  }
  if (/mancha|melasma|paño|pano/.test(text)) {
    lines.push("Uneven pigment: only a light veil. No dark contour.");
  }
  if (/ojera/.test(text)) {
    lines.push("A small concealer only under the eye, not a full mask.");
  }
  return lines.join(" ");
}

export function personPrompt(person: PersonBrief) {
  const tastes = person.tastes.map((id) => TASTE_FIT[id]);
  const note = person.note.trim();
  return [
    AGE_FIT[person.age],
    ...tastes,
    skinPrompt(person.skin, person.skinFromPhoto),
    note
      ? `She described the makeup she already uses, in her own words: "${note.slice(0, 800)}". The result must be something she can do with that.`
      : "She did not name products. Keep the makeup simple and affordable.",
  ]
    .filter(Boolean)
    .join(" ");
}

const NOTE_ZONES: [ZoneId, string[]][] = [
  ["base", ["base", "bb", "cc", "foundation", "maquillaje"]],
  ["cejas", ["ceja"]],
  ["contorno", ["contorno", "bronce"]],
  ["rubor", ["rubor", "colorete", "blush"]],
  ["iluminador", ["iluminador"]],
  ["ojos", ["ojo", "rimel", "rímel", "sombra", "delineador", "mascara", "máscara", "pestaña"]],
  ["labios", ["labio", "labial", "gloss", "balsamo", "bálsamo"]],
  ["fijador", ["fijador", "spray"]],
];

export function noteZones(note: string): ZoneId[] {
  const text = note.toLowerCase();
  if (!text.trim()) return [];
  return NOTE_ZONES.filter(([, words]) => words.some((word) => text.includes(word))).map(([zone]) => zone);
}

export function noteMatchesProduct(note: string, brandName: string, productName: string) {
  const text = note.toLowerCase();
  if (!text.trim()) return false;
  const brand = brandName.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const plain = text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const token = brand.split(" ")[0] ?? "";
  if (token.length > 2 && plain.includes(token)) return true;
  const name = productName.toLowerCase();
  return name.length > 4 && plain.includes(name);
}
