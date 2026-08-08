import "server-only";

import type { PriceQuote } from "@/lib/realtime/channels";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Cache de precios en `price_snapshots`.
 *
 * TTL 45 min: los supermercados no mueven precios cada minuto, y en una demo
 * donde varias personas consultan el mismo pollo, el scrape se hace una vez.
 *
 * TODO(schema): confirmar columnas con el agente de Datos. Se asume
 * `price_snapshots(product_key, store, price, unit, source, fetched_at)`.
 */

export const PRICE_TTL_MINUTES = 45;

type SnapshotRow = {
  store: string | null;
  price: number | null;
  unit: string | null;
  source: string | null;
  fetched_at: string | null;
};

function toQuote(row: SnapshotRow): PriceQuote | null {
  if (typeof row.price !== "number" || !row.store) return null;
  return {
    store: row.store,
    price: row.price,
    unit: row.unit ?? "un",
    fetchedAt: row.fetched_at ?? new Date().toISOString(),
    // El origen no se reinterpreta: si se guardó como dataset, sale como dataset.
    source: row.source === "live" ? "live" : "dataset",
  };
}

/** Precios cacheados aún frescos. Vacío si no hay o si la tabla falla. */
export async function readFreshQuotes(productKey: string): Promise<PriceQuote[]> {
  const since = new Date(Date.now() - PRICE_TTL_MINUTES * 60_000).toISOString();

  const { data, error } = await supabaseAdmin()
    .from("price_snapshots")
    .select("store, price, unit, source, fetched_at")
    .eq("product_key", productKey)
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: false });

  if (error) {
    console.warn(`[prices] cache no disponible: ${error.message}`);
    return [];
  }

  const rows = (data ?? []) as SnapshotRow[];
  const byStore = new Map<string, PriceQuote>();
  for (const row of rows) {
    const quote = toQuote(row);
    // Ya vienen ordenados por fecha desc: la primera de cada tienda es la vigente.
    if (quote && !byStore.has(quote.store)) byStore.set(quote.store, quote);
  }
  return [...byStore.values()];
}

/** Guarda precios scrapeados. Si falla, se loguea y la respuesta sigue igual. */
export async function writeQuotes(productKey: string, quotes: PriceQuote[]): Promise<void> {
  if (quotes.length === 0) return;

  const rows = quotes.map((quote) => ({
    product_key: productKey,
    store: quote.store,
    price: quote.price,
    unit: quote.unit,
    source: quote.source,
    fetched_at: quote.fetchedAt,
  }));

  const { error } = await supabaseAdmin().from("price_snapshots").insert(rows);
  if (error) console.warn(`[prices] no se pudo cachear: ${error.message}`);
}
