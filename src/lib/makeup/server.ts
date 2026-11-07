import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { OPTION_IDS, optionById } from "@/lib/makeup/references";
import { getSql } from "@/lib/db";
import { noteMatchesProduct, type AgeId, type TasteId } from "@/lib/makeup/profile";
import {
  PAINT_ZONES,
  type Depth,
  type Directory,
  type FaceShape,
  type Intensities,
  type LookPlan,
  type Product,
  type SituationId,
  type Step,
  type Undertone,
  type ZoneId,
  ZONES,
  ZONE_LABEL,
} from "@/lib/makeup/types";

const situationSchema = z.enum([
  "dia",
  "oficina",
  "entrevista",
  "cita",
  "boda",
  "fiesta",
  "fotos",
  "editorial",
]);

const recommendSchema = z.object({
  situation: situationSchema,
  optionId: z.enum(OPTION_IDS).optional(),
  undertone: z.enum(["calido", "frio", "neutro"]),
  depth: z.enum(["clara", "media", "profunda"]),
  shape: z.enum(["ovalado", "redondo", "cuadrado", "corazon", "alargado"]),
  owned: z.array(z.string().max(40)).max(60),
  age: z.enum(["menor", "joven", "treinta", "cuarenta", "madura", "silver"]),
  tastes: z
    .array(z.enum(["natural", "poco", "color", "luminosa", "mate", "ceja", "labio", "ojo"]))
    .max(8),
  note: z.string().max(800),
  skin: z.string().max(300),
});

type ProductRow = {
  id: string;
  brand_id: string;
  brand_name: string;
  name: string;
  category: string;
  finish: string;
  shade: string;
  hex: string;
  undertone: string;
  depth: string;
  price_eur: string | number;
};

type LookRow = {
  id: string;
  situation: SituationId;
  title: string;
  promise: string;
  mood: string;
  base_brand: string;
  intensities: string;
  stylist_id: string;
  stylist_name: string;
  city: string;
  focus: string;
  signature: string;
  years: number;
};

type StepRow = {
  step_order: number;
  zone: string;
  title: string;
  instruction: string;
  product_id: string;
};

function mapProduct(row: ProductRow): Product {
  const category = ZONES.find((zone) => zone === row.category);
  if (!category) {
    throw new Error(`Categoría desconocida en el catálogo: ${row.category}`);
  }
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    name: row.name,
    category,
    finish: row.finish,
    shade: row.shade,
    hex: row.hex,
    undertone: row.undertone,
    depth: row.depth,
    priceEur: Number(row.price_eur),
  };
}

function parseIntensities(raw: string): Intensities {
  const intensities: Intensities = {
    base: 0.45,
    contorno: 0.4,
    rubor: 0.6,
    ojos: 0.5,
    labios: 0.65,
    iluminador: 0.45,
    cejas: 0.55,
  };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const zone of PAINT_ZONES) {
      const value = Number(parsed[zone]);
      if (Number.isFinite(value)) {
        intensities[zone] = Math.max(0, Math.min(1, value));
      }
    }
  } catch {
    return intensities;
  }
  return intensities;
}

function tuneIntensities(intensities: Intensities, shape: FaceShape, depth: Depth): Intensities {
  const next = { ...intensities };
  if (shape === "redondo") next.contorno = Math.min(1, next.contorno + 0.12);
  if (shape === "cuadrado") next.contorno = Math.min(1, next.contorno + 0.1);
  if (shape === "corazon") {
    next.iluminador = Math.max(0, next.iluminador - 0.08);
    next.contorno = Math.min(1, next.contorno + 0.05);
  }
  if (shape === "alargado") {
    next.contorno = Math.max(0, next.contorno - 0.08);
    next.rubor = Math.max(0, next.rubor - 0.06);
  }
  if (depth === "profunda") next.base = Math.min(1, next.base + 0.08);
  if (depth === "clara") next.base = Math.max(0, next.base - 0.05);
  return next;
}

function scoreProduct(
  product: Product,
  undertone: Undertone,
  depth: Depth,
  owned: Set<string>,
  age: AgeId,
  tastes: readonly TasteId[],
  note: string,
  skin: string,
  preferBrand?: string,
) {
  let score = 0;
  if (owned.has(product.id)) score += 50;
  if (noteMatchesProduct(note, product.brandName, product.name)) score += 30;
  if (preferBrand && product.brandId === preferBrand) score += 5;
  if (product.priceEur <= 12) score += 2;
  if (product.priceEur > 20) score -= 8;
  if (age === "menor" && product.priceEur > 14) score -= 3;
  if ((age === "madura" || age === "silver") && product.finish.includes("metal")) score -= 6;
  if (
    (age === "cuarenta" || age === "madura" || age === "silver") &&
    /satinado|crema|luminoso|hidratante|brillo/.test(product.finish)
  ) {
    score += 2;
  }
  if (tastes.includes("mate") && product.finish.includes("mate")) score += 3;
  if (tastes.includes("luminosa") && /luminoso|satinado|crema|brillo/.test(product.finish))
    score += 3;
  if (
    /seca|tirante|escama/.test(skin.toLowerCase()) &&
    /crema|satinado|hidratante|luminoso|brillo/.test(product.finish)
  ) {
    score += 2;
  }
  if (/grasa|poro|acne|acné|grano/.test(skin.toLowerCase()) && product.finish.includes("mate"))
    score += 2;
  if (
    /acne|acné|grano|sensible|rosacea|rosácea/.test(skin.toLowerCase()) &&
    product.finish.includes("cubriente")
  ) {
    score -= 3;
  }
  if (product.undertone === undertone) score += 4;
  else if (
    product.undertone === "universal" ||
    product.undertone === "neutro" ||
    undertone === "neutro"
  ) {
    score += 2;
  }
  if (product.depth === depth) score += 6;
  else if (product.depth === "universal") score += 1;
  else if (product.depth === "media" || depth === "media") score += 1;
  else score -= 3;
  return score;
}

function hasTension(product: Product, undertone: Undertone) {
  if (
    product.category === "base" ||
    product.category === "contorno" ||
    product.category === "fijador"
  ) {
    return false;
  }
  if (
    product.undertone === "universal" ||
    product.undertone === "neutro" ||
    undertone === "neutro"
  ) {
    return false;
  }
  return product.undertone !== undertone;
}

const REMAP_BRAND: Partial<Record<ZoneId, "look" | string>> = {
  base: "look",
  contorno: "catrice",
  iluminador: "essence",
};

export const getDirectory = createServerFn({ method: "GET" }).handler(
  async (): Promise<Directory> => {
    const sql = await getSql();
    const brands = await sql<{
      id: string;
      name: string;
      origin: string;
      note: string;
      tier: string;
      product_count: number;
    }>`
    select b.id, b.name, b.origin, b.note, b.tier,
           (select count(*) from products p where p.brand_id = b.id) as product_count
    from brands b
    order by b.name
  `;
    const stylists = await sql<{
      id: string;
      name: string;
      city: string;
      focus: string;
      signature: string;
      years: number;
    }>`
    select id, name, city, focus, signature, years
    from stylists
    order by name
  `;
    const counts = await sql<{
      brands: number;
      stylists: number;
      products: number;
      looks: number;
    }>`
    select
      (select count(*) from brands) as brands,
      (select count(*) from stylists) as stylists,
      (select count(*) from products) as products,
      (select count(*) from looks) as looks
  `;
    const tally = counts[0] ?? { brands: 0, stylists: 0, products: 0, looks: 0 };
    const productRows = await sql<ProductRow>`
    select p.id, p.brand_id, b.name as brand_name, p.name, p.category, p.finish,
           p.shade, p.hex, p.undertone, p.depth, p.price_eur
    from products p
    join brands b on b.id = p.brand_id
    order by p.category, b.name, p.shade
  `;
    return {
      brands: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        origin: brand.origin,
        note: brand.note,
        tier: brand.tier,
        productCount: Number(brand.product_count),
      })),
      stylists: stylists.map((stylist) => ({
        ...stylist,
        years: Number(stylist.years),
      })),
      counts: {
        brands: Number(tally.brands),
        stylists: Number(tally.stylists),
        products: Number(tally.products),
        looks: Number(tally.looks),
      },
      products: productRows.map(mapProduct),
    };
  },
);

export const recommendLook = createServerFn({ method: "POST" })
  .validator(recommendSchema)
  .handler(async ({ data }): Promise<LookPlan> => {
    const option = optionById(data.situation, data.optionId ?? "natural");
    const sql = await getSql();
    const looks = await sql<LookRow>`
      select l.id, l.situation, l.title, l.promise, l.mood, l.base_brand, l.intensities,
             s.id as stylist_id, s.name as stylist_name, s.city, s.focus, s.signature, s.years
      from looks l
      join stylists s on s.id = l.stylist_id
      where l.situation = ${data.situation}
      limit 1
    `;
    const look = looks[0];
    if (!look) {
      throw new Error("No hay un look para esa ocasión en el catálogo.");
    }

    const productRows = await sql<ProductRow>`
      select p.id, p.brand_id, b.name as brand_name, p.name, p.category, p.finish,
             p.shade, p.hex, p.undertone, p.depth, p.price_eur
      from products p
      join brands b on b.id = p.brand_id
    `;
    const products = productRows.map(mapProduct);
    const byId = new Map(products.map((product) => [product.id, product]));

    const stepRows = await sql<StepRow>`
      select step_order, zone, title, instruction, product_id
      from look_steps
      where look_id = ${look.id}
      order by step_order
    `;

    const undertone = data.undertone as Undertone;
    const depth = data.depth as Depth;
    const shape = data.shape as FaceShape;

    const owned = new Set(data.owned);
    const age = data.age as AgeId;
    const tastes = data.tastes as TasteId[];
    const note = data.note;
    const skin = data.skin;
    const recipeScore = (product: Product, preferBrand?: string) => {
      const hint = option.productHints?.[product.category];
      const matchesRecipe =
        hint && new RegExp(hint, "i").test(`${product.shade} ${product.finish}`);
      return (
        scoreProduct(product, undertone, depth, owned, age, tastes, note, skin, preferBrand) +
        (matchesRecipe ? 12 : 0)
      );
    };
    const steps: Step[] = stepRows
      .filter((row) => option.zones.includes(row.zone as ZoneId))
      .map((row) => {
        const zone = ZONES.find((item) => item === row.zone);
        if (!zone) throw new Error(`Zona desconocida: ${row.zone}`);
        const authored = byId.get(row.product_id);
        if (!authored) throw new Error(`Falta el producto ${row.product_id}`);

        let product = authored;
        const prefer = REMAP_BRAND[zone];
        if (prefer || option.productHints?.[zone]) {
          const brandId = prefer === "look" ? look.base_brand : prefer;
          const pool = products.filter((item) => item.category === zone);
          const ranked = [...pool].sort(
            (a, b) => recipeScore(b, brandId) - recipeScore(a, brandId),
          );
          if (ranked[0]) product = ranked[0];
        }

        return {
          order: Number(row.step_order),
          zone,
          title: ZONE_LABEL[zone],
          instruction: option.instructions?.[zone] ?? row.instruction,
          product,
          tension: hasTension(product, undertone),
        };
      });

    const alternates = {} as Record<ZoneId, Product[]>;
    for (const zone of ZONES) {
      const chosen = steps.find((step) => step.zone === zone)?.product;
      const ranked = products
        .filter((product) => product.category === zone)
        .sort((a, b) => recipeScore(b) - recipeScore(a));
      const unique = chosen
        ? [chosen, ...ranked.filter((product) => product.id !== chosen.id)]
        : ranked;
      alternates[zone] = unique.slice(0, 6);
    }

    return {
      id: look.id,
      situation: look.situation,
      title: option.title,
      promise: option.line,
      mood: look.mood,
      stylist: {
        id: look.stylist_id,
        name: look.stylist_name,
        city: look.city,
        focus: look.focus,
        signature: look.signature,
        years: Number(look.years),
      },
      intensities: tuneIntensities(parseIntensities(look.intensities), shape, depth),
      steps,
      alternates,
    };
  });
