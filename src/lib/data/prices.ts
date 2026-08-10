import "server-only";

import type { PriceQuote } from "@/lib/realtime/channels";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { PriceSnapshotInsert, PriceSnapshotRow, ProductRow } from "@/types/db";
import { unwrapRows } from "./shared";

/**
 * Cuánto vale un precio capturado antes de considerarlo viejo. Con 45 minutos
 * la demo no vuelve a scrapear entre pantalla y pantalla, y a la vez el
 * fallback al catálogo se ejercita solo en la siguiente sesión.
 */
export const PRICE_TTL_MINUTES = 45;

const SNAPSHOT_COLUMNS = "id, product_key, store, price, unit, source, fetched_at";
const PRODUCT_COLUMNS =
  "id, product_key, name, brand, store, price, unit, category, health_grade, created_at, updated_at";

function ttlCutoffIso(now: Date = new Date()): string {
  return new Date(now.getTime() - PRICE_TTL_MINUTES * 60_000).toISOString();
}

/**
 * Precios por tienda de un producto.
 *
 * Primero mira la caché de `price_snapshots` dentro del TTL; si no hay nada
 * fresco, cae al precio del catálogo. Nunca devuelve un snapshot viejo: un
 * precio de ayer presentado como "en vivo" es peor que no tener precio.
 */
export async function getPricesByProductKey(productKey: string): Promise<PriceQuote[]> {
  const snapshots = await supabaseAdmin()
    .from("price_snapshots")
    .select(SNAPSHOT_COLUMNS)
    .eq("product_key", productKey)
    .gte("fetched_at", ttlCutoffIso())
    .order("fetched_at", { ascending: false });

  const rows = unwrapRows<PriceSnapshotRow>(snapshots, "getPricesByProductKey");

  // Vienen ordenados de más nuevo a más viejo: el primero de cada tienda gana.
  const byStore = new Map<string, PriceQuote>();
  for (const row of rows) {
    if (byStore.has(row.store)) continue;
    byStore.set(row.store, {
      store: row.store,
      price: row.price,
      unit: row.unit,
      fetchedAt: row.fetched_at,
      source: row.source,
    });
  }

  if (byStore.size > 0) {
    return [...byStore.values()].sort((a, b) => a.price - b.price);
  }

  const catalog = await supabaseAdmin()
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("product_key", productKey)
    .order("price", { ascending: true });

  return unwrapRows<ProductRow>(catalog, "getPricesByProductKey:fallback").map((product) => ({
    store: product.store,
    price: product.price,
    unit: product.unit,
    fetchedAt: product.updated_at,
    source: "dataset" as const,
  }));
}

/** Guarda lo que trajo el agente de precios. Devuelve las filas insertadas. */
export async function recordPriceSnapshots(
  snapshots: readonly PriceSnapshotInsert[],
): Promise<PriceSnapshotRow[]> {
  if (snapshots.length === 0) return [];

  const result = await supabaseAdmin()
    .from("price_snapshots")
    .insert(
      snapshots.map((snapshot) => ({
        product_key: snapshot.product_key,
        store: snapshot.store,
        price: snapshot.price,
        unit: snapshot.unit ?? "und",
        source: snapshot.source ?? "dataset",
        fetched_at: snapshot.fetched_at ?? new Date().toISOString(),
      })),
    )
    .select(SNAPSHOT_COLUMNS);

  return unwrapRows<PriceSnapshotRow>(result, "recordPriceSnapshots");
}

/** ¿Ya hay precios frescos para este producto? Evita re-scrapear al pedo. */
export async function hasFreshPrices(productKey: string): Promise<boolean> {
  const result = await supabaseAdmin()
    .from("price_snapshots")
    .select("id")
    .eq("product_key", productKey)
    .gte("fetched_at", ttlCutoffIso())
    .limit(1);

  return unwrapRows<{ id: string }>(result, "hasFreshPrices").length > 0;
}

/** La tienda más barata de la lista, o null si viene vacía. */
export function cheapestQuote(quotes: readonly PriceQuote[]): PriceQuote | null {
  return quotes.reduce<PriceQuote | null>(
    (best, quote) => (best === null || quote.price < best.price ? quote : best),
    null,
  );
}
