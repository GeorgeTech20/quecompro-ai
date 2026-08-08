import "server-only";

import { loadPrices } from "@/lib/ai/data-contract";
import type { PriceQuote } from "@/lib/realtime/channels";

import { ALLOWED_DOMAINS, isAgentBrowserAvailable, scrapeStorePrice, type Store } from "./agent-browser";
import { readFreshQuotes, writeQuotes } from "./cache";

/**
 * Orquestador de precios: cache → scrape real → dataset.
 *
 * El dataset no es un plan B triste: es lo que mantiene la demo viva. El flujo,
 * el canal, el evento y la UI son **idénticos** en los tres caminos; lo único que
 * cambia es el campo `source`, y ese campo no se falsea nunca. Un precio del
 * dataset se presenta como dataset, aunque se vea menos impresionante.
 */

export type PriceOrigin = "cache" | "live" | "dataset";

export type PriceLookup = {
  productKey: string;
  quotes: PriceQuote[];
  origin: PriceOrigin;
  /** Por qué no se scrapeó, cuando aplica. Sirve para el badge de la UI. */
  note?: string;
};

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1";
}

async function datasetQuotes(productKey: string): Promise<PriceQuote[]> {
  try {
    const quotes = await loadPrices(productKey);
    // Se fuerza el origen: esta rama es el dataset, diga lo que diga la fila.
    return quotes.map((quote) => ({ ...quote, source: "dataset" as const }));
  } catch (error) {
    console.warn(`[prices] dataset falló para ${productKey}: ${error instanceof Error ? error.message : "?"}`);
    return [];
  }
}

async function liveQuotes(query: string): Promise<PriceQuote[]> {
  const fetchedAt = new Date().toISOString();
  // Las cuatro tiendas en paralelo: en serie no entran en los 12 s.
  const results = await Promise.all(
    ALLOWED_DOMAINS.map((store: Store) => scrapeStorePrice(store, query).catch(() => null)),
  );

  return results
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .map((result) => ({
      store: result.store,
      price: result.price,
      unit: "un",
      fetchedAt,
      source: "live" as const,
    }));
}

/**
 * Busca precios para un producto. Nunca lanza: siempre devuelve algo publicable.
 */
export async function lookupPrices(productKey: string, query?: string): Promise<PriceLookup> {
  const cached = await readFreshQuotes(productKey);
  if (cached.length > 0) return { productKey, quotes: cached, origin: "cache" };

  if (isDemoMode()) {
    return { productKey, quotes: await datasetQuotes(productKey), origin: "dataset", note: "DEMO_MODE" };
  }

  if (!(await isAgentBrowserAvailable())) {
    return {
      productKey,
      quotes: await datasetQuotes(productKey),
      origin: "dataset",
      note: "agent-browser no instalado",
    };
  }

  const scraped = await liveQuotes(query ?? productKey.replace(/-/g, " "));
  if (scraped.length > 0) {
    await writeQuotes(productKey, scraped);
    return { productKey, quotes: scraped, origin: "live" };
  }

  // Bloqueo, layout cambiado o timeout: el flujo no se detiene.
  return {
    productKey,
    quotes: await datasetQuotes(productKey),
    origin: "dataset",
    note: "las tiendas no respondieron",
  };
}

/** El más barato de la tanda, para armar la frase del asistente. */
export function cheapestQuote(quotes: PriceQuote[]): PriceQuote | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((best, quote) => (quote.price < best.price ? quote : best));
}

export { ALLOWED_DOMAINS, QUERY_TIMEOUT_MS } from "./agent-browser";
export { PRICE_TTL_MINUTES } from "./cache";
