import "server-only";

import {
  addCartItem,
  getCheaperAlternative,
  getHouseholdCart,
  getMacrosByProductIds,
  getMonthSpend,
  getPricesByProductKey,
  matchRecipesForCart,
  removeCartItem,
  searchProducts,
  setCartItemQty,
  toRecipeSuggestion,
  updateHouseholdBudget,
} from "@/lib/data";
import type { HealthGrade, PriceQuote, RecipeSuggestion } from "@/lib/realtime/channels";
import type { CartItemRow as DbCartItem, Macros, ProductRow as DbProduct } from "@/types/db";

/**
 * Puente único con la capa de datos.
 *
 * Todo el cerebro de IA y el agente de precios pasan por aquí en vez de
 * importar `@/lib/data` en quince sitios. La base habla en `snake_case` de
 * columnas (`name`, `product_key`, `sodium_mg`) y el cerebro razona en
 * `camelCase` de dominio (`title`, `key`, `sodium`): la traducción vive acá y
 * en ningún otro lado, así un cambio de esquema se paga una sola vez.
 */

// --- Tipos de dominio que consume la capa de IA ---------------------------

/** Macros por 100 g / 100 ml. Sodio en mg. */
export type Macros100g = {
  kcal?: number | null;
  protein?: number | null;
  carbs?: number | null;
  sugar?: number | null;
  fat?: number | null;
  satFat?: number | null;
  fiber?: number | null;
  sodium?: number | null;
};

export type ProductRow = {
  id: string;
  /** Clave canónica compartida entre tiendas ("pollo-entero"). */
  key?: string | null;
  title: string;
  brand?: string | null;
  category?: string | null;
  unit?: string | null;
  price?: number | null;
  store?: string | null;
  macros?: Macros100g | null;
};

export type CartItemRow = {
  id: string;
  title: string;
  price: number;
  qty: number;
  unit?: string | null;
  store?: string | null;
  category?: string | null;
  productId?: string | null;
  productKey?: string | null;
  healthGrade?: HealthGrade | null;
  macros?: Macros100g | null;
};

export type CartSnapshot = {
  items: CartItemRow[];
  total: number;
};

export type MonthSpend = {
  spent: number;
  budget?: number | null;
  projected?: number | null;
  remaining?: number | null;
  overBudget?: boolean;
};

export type CheaperAlternative = {
  productId: string;
  title: string;
  store: string;
  price: number;
  /** Ahorro por unidad, en soles. */
  savings: number;
  /** El mismo producto en otra tienda: cambiar no altera la compra. */
  sameProduct: boolean;
};

export type NewCartItem = {
  productId?: string;
  title: string;
  price: number;
  qty: number;
  unit?: string;
  store?: string | null;
  category?: string | null;
  addedBy?: string;
};

// --- Traductores ----------------------------------------------------------

/**
 * `nutrition` guarda los valores por `per_grams` (normalmente 100), así que se
 * reescalan antes de compararlos contra umbrales por 100 g. Si no, un producto
 * medido por porción saldría con un puntaje de salud absurdo.
 */
function toMacros(macros: Macros | null | undefined): Macros100g | null {
  if (!macros) return null;
  return {
    kcal: macros.kcal,
    protein: macros.protein_g,
    carbs: macros.carbs_g,
    fat: macros.fat_g,
    fiber: macros.fiber_g,
    sodium: macros.sodium_mg,
  };
}

function toProduct(row: DbProduct, macros?: Macros | null): ProductRow {
  return {
    id: row.id,
    key: row.product_key,
    title: row.name,
    brand: row.brand,
    category: row.category,
    unit: row.unit,
    price: row.price,
    store: row.store,
    macros: toMacros(macros),
  };
}

function toCartItem(row: DbCartItem, macros?: Macros | null): CartItemRow {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    qty: row.qty,
    unit: row.unit,
    store: row.store,
    category: row.category,
    productId: row.product_id,
    healthGrade: row.health_grade,
    macros: toMacros(macros),
  };
}

// --- Envoltorios ----------------------------------------------------------

/**
 * Carga el carrito con las macros de cada línea resueltas en un solo viaje.
 * El veredicto de salud las necesita para todos los items, así que pedirlas
 * una por una sería N+1 en la ruta más caliente de la app.
 */
export async function loadCart(householdId: string): Promise<CartSnapshot> {
  const cart = await getHouseholdCart(householdId);

  const productIds = cart.items
    .map((item) => item.product_id)
    .filter((id): id is string => id !== null);

  const macrosById = productIds.length
    ? await getMacrosByProductIds(productIds)
    : new Map<string, Macros>();

  return {
    items: cart.items.map((item) =>
      toCartItem(item, item.product_id ? macrosById.get(item.product_id) : null),
    ),
    total: cart.total,
  };
}

export async function loadMonthSpend(householdId: string): Promise<MonthSpend> {
  const spend = await getMonthSpend(householdId);
  return {
    spent: spend.spent,
    budget: spend.budget,
    projected: spend.projected,
    remaining: spend.remaining,
    overBudget: spend.overBudget,
  };
}

export async function findProducts(query: string, limit = 20): Promise<ProductRow[]> {
  const rows = await searchProducts(query, { limit });
  if (rows.length === 0) return [];

  const macrosById = await getMacrosByProductIds(rows.map((row) => row.id));
  return rows.map((row) => toProduct(row, macrosById.get(row.id)));
}

/**
 * La alternativa más barata solo se puede buscar con un id de catálogo: un
 * item escrito a mano no tiene con qué comparar macros, y proponer un swap
 * "parecido por el nombre" sería adivinar.
 */
export async function findCheaper(
  productId: string | null | undefined,
): Promise<CheaperAlternative | null> {
  if (!productId) return null;

  const alt = await getCheaperAlternative(productId);
  if (!alt) return null;

  return {
    productId: alt.product.id,
    title: alt.product.name,
    store: alt.product.store,
    price: alt.product.price,
    savings: alt.savings,
    sameProduct: alt.sameProduct,
  };
}

export async function loadPrices(productKey: string): Promise<PriceQuote[]> {
  return getPricesByProductKey(productKey);
}

/** Recetas que el carrito actual ya cubre (umbral de 2 ingredientes). */
export async function findRecipes(
  householdId: string,
  limit = 3,
): Promise<RecipeSuggestion[]> {
  const matches = await matchRecipesForCart(householdId, { limit });
  return matches.map(toRecipeSuggestion);
}

export async function insertCartItem(
  householdId: string,
  item: NewCartItem,
): Promise<CartItemRow> {
  const row = await addCartItem({
    household_id: householdId,
    product_id: item.productId ?? null,
    title: item.title,
    price: item.price,
    qty: item.qty,
    unit: item.unit,
    store: item.store,
    category: item.category,
    added_by: item.addedBy ?? null,
  });
  return toCartItem(row);
}

/**
 * `qty: 0` no existe en la base — el check es `qty > 0`. Llegar a cero es
 * borrar la línea, y se enruta como tal.
 */
export async function updateCartItemQty(
  householdId: string,
  itemId: string,
  qty: number,
): Promise<void> {
  if (qty <= 0) {
    await removeCartItem(householdId, itemId);
    return;
  }
  await setCartItemQty(householdId, itemId, qty);
}

export async function dropCartItem(householdId: string, itemId: string): Promise<void> {
  await removeCartItem(householdId, itemId);
}

/** La tool `set_budget` sí escribe: la capa de datos expone la actualización. */
export async function setBudget(householdId: string, monthly: number): Promise<boolean> {
  const row = await updateHouseholdBudget(householdId, monthly);
  return row !== null;
}
