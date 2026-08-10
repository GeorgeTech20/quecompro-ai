import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  Macros,
  NutritionRow,
  ProductCategory,
  ProductRow,
  ProductWithMacros,
} from "@/types/db";
import { escapeLike, round2, unwrap, unwrapRows, uniqueIds } from "./shared";

// Sin `image_url`: el catálogo se lee por nombre, precio y tienda. Las fotos de
// producto nunca cuadraron con el dato real (marca distinta, envase distinto), y
// una foto equivocada al lado de un precio hace dudar del precio.
const PRODUCT_COLUMNS =
  "id, product_key, name, brand, store, price, unit, category, health_grade, created_at, updated_at";

const MACRO_COLUMNS =
  "product_id, per_grams, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, created_at, updated_at";

/** Etiquetas para la UI: `category` en la base es clave de máquina, sin tildes. */
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  carnes: "Carnes",
  verduras: "Verduras",
  frutas: "Frutas",
  granos: "Granos",
  lacteos: "Lácteos",
  abarrotes: "Abarrotes",
  bebidas: "Bebidas",
  limpieza: "Limpieza",
  snacks: "Snacks",
  condimentos: "Condimentos",
};

export type SearchProductsOptions = {
  store?: string;
  category?: string;
  limit?: number;
};

export type CheaperAlternative = {
  product: ProductRow;
  macros: Macros | null;
  /** Cuánto se ahorra por unidad, en soles. */
  savings: number;
  /** El mismo producto en otra tienda: el cambio no altera la compra. */
  sameProduct: boolean;
  /** 0..1 — 1 significa macros prácticamente iguales. */
  similarity: number;
};

export async function getProductById(productId: string): Promise<ProductRow | null> {
  const result = await supabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", productId)
    .maybeSingle();

  return unwrap<ProductRow | null>(result, "getProductById");
}

export async function getProductsByIds(productIds: readonly string[]): Promise<ProductRow[]> {
  const ids = uniqueIds(productIds);
  if (ids.length === 0) return [];

  const result = await supabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids);

  return unwrapRows<ProductRow>(result, "getProductsByIds");
}

/** Macros de varios productos, indexados por product_id. */
export async function getMacrosByProductIds(
  productIds: readonly string[],
): Promise<Map<string, Macros>> {
  const ids = uniqueIds(productIds);
  const macros = new Map<string, Macros>();
  if (ids.length === 0) return macros;

  const result = await supabaseAdmin()
    .from("nutrition")
    .select(MACRO_COLUMNS)
    .in("product_id", ids);

  for (const row of unwrapRows<NutritionRow>(result, "getMacrosByProductIds")) {
    macros.set(row.product_id, {
      kcal: row.kcal,
      protein_g: row.protein_g,
      carbs_g: row.carbs_g,
      fat_g: row.fat_g,
      fiber_g: row.fiber_g,
      sodium_mg: row.sodium_mg,
    });
  }
  return macros;
}

export async function getProductWithMacros(
  productId: string,
): Promise<ProductWithMacros | null> {
  const product = await getProductById(productId);
  if (!product) return null;

  const macros = await getMacrosByProductIds([product.id]);
  return { ...product, macros: macros.get(product.id) ?? null };
}

/**
 * Busca en el catálogo. Sin extensiones de texto completo: `ilike` sobre el
 * nombre y el reordenamiento fino se hace en memoria, que con un catálogo de
 * este tamaño sale más barato que montar tsvector.
 */
export async function searchProducts(
  query: string,
  options: SearchProductsOptions = {},
): Promise<ProductRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);
  const term = query.trim();

  let builder = supabaseAdmin().from("products").select(PRODUCT_COLUMNS);

  if (term.length > 0) {
    builder = builder.ilike("name", `%${escapeLike(term)}%`);
  }
  if (options.store) builder = builder.eq("store", options.store);
  if (options.category) builder = builder.eq("category", options.category);

  // Se pide de más para poder reordenar por relevancia antes de recortar.
  const result = await builder.order("price", { ascending: true }).limit(limit * 3);
  const rows = unwrapRows<ProductRow>(result, "searchProducts");

  if (term.length === 0) return rows.slice(0, limit);

  const needle = term.toLowerCase();
  const rank = (product: ProductRow): number => {
    const name = product.name.toLowerCase();
    if (name === needle) return 0;
    if (name.startsWith(needle)) return 1;
    if (name.includes(` ${needle}`)) return 2;
    return 3;
  };

  return rows
    .slice()
    .sort((a, b) => rank(a) - rank(b) || a.price - b.price)
    .slice(0, limit);
}

export async function listCategories(): Promise<string[]> {
  const result = await supabaseAdmin().from("products").select("category");
  const rows = unwrapRows<{ category: string }>(result, "listCategories");
  return [...new Set(rows.map((row) => row.category))].sort();
}

export async function listStores(): Promise<string[]> {
  const result = await supabaseAdmin().from("products").select("store");
  const rows = unwrapRows<{ store: string }>(result, "listStores");
  return [...new Set(rows.map((row) => row.store))].sort();
}

// --- alternativa más barata ------------------------------------------------

/**
 * Escalas típicas por 100 g. Sirven para que 20 kcal de diferencia no pesen lo
 * mismo que 20 g de grasa: cada macro se compara contra su propio rango.
 */
const MACRO_SCALE = {
  kcal: 400,
  protein_g: 25,
  carbs_g: 60,
  fat_g: 30,
} as const;

type ScaledMacro = keyof typeof MACRO_SCALE;

/** 1 = macros idénticos, 0 = nada que ver. Sin macros, se asume 0.5. */
function macroSimilarity(a: Macros | null, b: Macros | null): number {
  if (!a || !b) return 0.5;

  const fields = Object.keys(MACRO_SCALE) as ScaledMacro[];
  const distance =
    fields.reduce((acc, field) => {
      const diff = Math.abs(a[field] - b[field]) / MACRO_SCALE[field];
      return acc + Math.min(1, diff);
    }, 0) / fields.length;

  return round2(1 - distance);
}

/** Debajo de esto ya no es "lo mismo pero más barato", es otro producto. */
const MIN_SIMILARITY = 0.6;

/**
 * Candidatos más baratos que el producto dado, dentro de la misma categoría y
 * con macros parecidos.
 *
 * El mismo `product_key` en otra tienda gana siempre: es literalmente el mismo
 * producto, así que el cambio es gratis para quien cocina.
 */
export async function getCheaperAlternatives(
  productId: string,
  limit = 3,
): Promise<CheaperAlternative[]> {
  const base = await getProductById(productId);
  if (!base) return [];

  const result = await supabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category", base.category)
    .lt("price", base.price)
    .neq("id", base.id)
    .order("price", { ascending: true })
    .limit(60);

  const candidates = unwrapRows<ProductRow>(result, "getCheaperAlternatives");
  if (candidates.length === 0) return [];

  const macros = await getMacrosByProductIds([base.id, ...candidates.map((c) => c.id)]);
  const baseMacros = macros.get(base.id) ?? null;

  return candidates
    .map((product): CheaperAlternative => {
      const sameProduct = product.product_key === base.product_key;
      return {
        product,
        macros: macros.get(product.id) ?? null,
        savings: round2(base.price - product.price),
        sameProduct,
        similarity: sameProduct ? 1 : macroSimilarity(baseMacros, macros.get(product.id) ?? null),
      };
    })
    .filter((c) => c.savings > 0 && (c.sameProduct || c.similarity >= MIN_SIMILARITY))
    .sort(
      (a, b) =>
        Number(b.sameProduct) - Number(a.sameProduct) ||
        b.similarity - a.similarity ||
        b.savings - a.savings,
    )
    .slice(0, Math.max(limit, 1));
}

/** La mejor alternativa más barata, o null si no hay ninguna que valga la pena. */
export async function getCheaperAlternative(
  productId: string,
): Promise<CheaperAlternative | null> {
  const [best] = await getCheaperAlternatives(productId, 1);
  return best ?? null;
}
