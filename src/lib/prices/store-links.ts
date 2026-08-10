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

/**
 * Deja pasar solo enlaces `https://` a una de las cuatro tiendas.
 *
 * Las cotizaciones llegan por el canal de realtime, y ahí puede publicar
 * cualquier miembro de la casa desde la consola del navegador. Sin este filtro,
 * un chip que dice "Fuentes verificadas" podía apuntar al dominio del atacante:
 * phishing con el sello de confianza de la app. `javascript:` ya lo neutraliza
 * React, pero un `https://` hostil pasa sin problema.
 *
 * Se comprueba el host, no el prefijo del texto: `https://tottus.com.pe.mal.io`
 * empieza igual y no es Tottus.
 */
export function safeStoreUrl(raw: string | undefined | null): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;

  const host = url.hostname.toLowerCase();
  const allowed = STORE_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
  return allowed ? url.toString() : undefined;
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
