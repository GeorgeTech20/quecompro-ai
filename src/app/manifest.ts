import type { MetadataRoute } from "next";

import { SITE_NAME } from "@/lib/site";

/**
 * Manifiesto de la app instalable.
 *
 * La lista se usa en el pasillo del supermercado, con una mano y a veces sin
 * señal buena: que se pueda anclar a la pantalla de inicio y abrir sin la
 * barra del navegador no es un adorno.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — lista de compras compartida`,
    short_name: SITE_NAME,
    description:
      "Lista de compras compartida en vivo con tu casa, precios de supermercados peruanos y una IA que ayuda a decidir qué comprar y cocinar.",
    start_url: "/app/cart",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-PE",
    dir: "ltr",
    categories: ["shopping", "food", "productivity", "lifestyle"],
    background_color: "#ffffff",
    theme_color: "#e9342b",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
    ],
  };
}
