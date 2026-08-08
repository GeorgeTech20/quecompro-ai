import "server-only";

import type { HealthGrade, PriceQuote, RecipeSuggestion } from "@/lib/realtime/channels";

/**
 * Puente único con la capa de datos (`src/lib/data`, de otro agente).
 *
 * Todo el cerebro de IA y el agente de precios pasan por aquí en vez de importar
 * `@/lib/data` en quince sitios: si las firmas reales terminan siendo otras, se
 * arregla este archivo y nada más. Los tipos de abajo son el contrato que
 * asumimos; si la implementación devuelve algo distinto, tsc lo grita aquí.
 */
import {
  addCartItem,
  getCheaperAlternative,
  getHouseholdCart,
  getMonthSpend,
  getPricesByProductKey,
  matchRecipes,
  searchProducts,
  setCartItemQty,
} from "@/lib/data";

// --- Tipos que este módulo espera de la capa de datos ---------------------

/** Macros normalizadas por 100 g / 100 ml. Sodio en mg. */
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
  /** Clave canónica de producto ("pollo-entero"): la que usan los precios. */
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
  /** Opcional: si la capa de datos no lo trae, el contexto simplemente lo omite. */
  last7Days?: number | null;
};

export type CheaperAlternative = {
  productId: string;
  title: string;
  store: string;
  price: number;
};

export type NewCartItem = {
  productId?: string;
  title: string;
  price: number;
  qty: number;
  unit?: string;
  addedBy?: string;
};

// --- Envoltorios tipados --------------------------------------------------

export async function loadCart(householdId: string): Promise<CartSnapshot> {
  const cart: CartSnapshot = await getHouseholdCart(householdId);
  return cart;
}

export async function loadMonthSpend(householdId: string): Promise<MonthSpend> {
  const spend: MonthSpend = await getMonthSpend(householdId);
  return spend;
}

export async function findProducts(query: string, limit = 20): Promise<ProductRow[]> {
  const rows: ProductRow[] = await searchProducts(query, limit);
  return rows;
}

export async function findCheaper(
  productId: string | null | undefined,
  title: string,
  price: number,
): Promise<CheaperAlternative | null> {
  const alt: CheaperAlternative | null = await getCheaperAlternative(productId ?? title, price);
  return alt;
}

export async function loadPrices(productKey: string): Promise<PriceQuote[]> {
  const quotes: PriceQuote[] = await getPricesByProductKey(productKey);
  return quotes;
}

export async function findRecipes(
  householdId: string,
  minIngredients = 2,
): Promise<RecipeSuggestion[]> {
  const recipes: RecipeSuggestion[] = await matchRecipes(householdId, minIngredients);
  return recipes;
}

export async function insertCartItem(
  householdId: string,
  item: NewCartItem,
): Promise<CartItemRow> {
  const row: CartItemRow = await addCartItem(householdId, item);
  return row;
}

export async function updateCartItemQty(itemId: string, qty: number): Promise<void> {
  await setCartItemQty(itemId, qty);
}
