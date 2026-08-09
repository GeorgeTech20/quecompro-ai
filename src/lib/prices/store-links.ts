/**
 * Enlaces de búsqueda oficiales por tienda. Son una salida segura cuando el
 * scraper obtiene un precio pero la tienda no expone de forma estable la URL
 * del PDP. Nunca se construyen URLs a partir de un dominio enviado por el
 * usuario: la lista está cerrada aquí.
 */

export const STORE_DOMAINS = [
  "tottus.com.pe",
  "plazavea.com.pe",
  "metro.pe",
  "wong.pe",
] as const;

export type StoreDomain = (typeof STORE_DOMAINS)[number];

const STORE_ALIASES: Record<string, StoreDomain> = {
  tottus: "tottus.com.pe",
  "tottus.com.pe": "tottus.com.pe",
  plazavea: "plazavea.com.pe",
  "plaza vea": "plazavea.com.pe",
  "plazavea.com.pe": "plazavea.com.pe",
  metro: "metro.pe",
  "metro.pe": "metro.pe",
  wong: "wong.pe",
  "wong.pe": "wong.pe",
};

export function normalizeStoreDomain(store: string): StoreDomain | null {
  return STORE_ALIASES[store.trim().toLocaleLowerCase("es-PE")] ?? null;
}

export function storeSearchUrl(store: string, rawQuery: string): string | undefined {
  const domain = normalizeStoreDomain(store);
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!domain || !query) return undefined;

  const encoded = encodeURIComponent(query);
  switch (domain) {
    case "tottus.com.pe":
      return `https://www.tottus.com.pe/search?Ntt=${encoded}`;
    case "plazavea.com.pe":
      return `https://www.plazavea.com.pe/search/?_query=${encoded}`;
    case "metro.pe":
      return `https://www.metro.pe/${encoded}?_q=${encoded}&map=ft`;
    case "wong.pe":
      return `https://www.wong.pe/${encoded}?_q=${encoded}&map=ft`;
  }
}
