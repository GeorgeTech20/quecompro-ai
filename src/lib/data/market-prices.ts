import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { MarketPriceInsert, MarketPriceRow } from "@/types/db";
import { unwrapRows } from "./shared";

/**
 * Registro manual de precios de mercado.
 *
 * A diferencia de `price_snapshots` (caché fresca con TTL para el agente de
 * precios), esto es historial persistente de lo que de verdad se pagó: la
 * papa que se compró en la plaza, el puesto de abajo, la nota que se dejó.
 * Sin TTL: la comparación "antes y ahora" necesita los registros viejos.
 */

const MARKET_PRICE_COLUMNS =
  "id, household_id, cart_item_id, product_key, title, unit, price, market, stall, note, recorded_by, recorded_at, updated_at";

export async function recordMarketPrice(input: MarketPriceInsert): Promise<MarketPriceRow> {
  const result = await supabaseAdmin()
    .from("market_prices")
    .insert({
      household_id: input.household_id,
      cart_item_id: input.cart_item_id ?? null,
      product_key: input.product_key,
      title: input.title,
      unit: input.unit ?? "und",
      price: input.price,
      market: input.market ?? null,
      stall: input.stall ?? null,
      note: input.note ?? null,
      recorded_by: input.recorded_by ?? null,
    })
    .select(MARKET_PRICE_COLUMNS)
    .single();

  if (result.error) {
    throw new Error(`[data:recordMarketPrice] ${result.error.message}`);
  }
  return result.data as MarketPriceRow;
}

/**
 * Historial de precios pagados para una clave canónica (producto o slug de
 * texto libre). Más nuevo primero; `limit` recorta la ventana.
 */
export async function getMarketPriceHistory(
  householdId: string,
  productKey: string,
  limit = 12,
): Promise<MarketPriceRow[]> {
  const result = await supabaseAdmin()
    .from("market_prices")
    .select(MARKET_PRICE_COLUMNS)
    .eq("household_id", householdId)
    .eq("product_key", productKey)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  return unwrapRows<MarketPriceRow>(result, "getMarketPriceHistory");
}

/** El último registro del historial, si existe. */
export async function getLatestMarketPrice(
  householdId: string,
  productKey: string,
): Promise<MarketPriceRow | null> {
  const history = await getMarketPriceHistory(householdId, productKey, 1);
  return history[0] ?? null;
}
