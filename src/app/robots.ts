import type { MetadataRoute } from "next";

import { absoluteUrl, SITE_URL } from "@/lib/site";

/** Nada de esto es público: o es privado, o es una URL de un solo uso. */
const PRIVADO = ["/api/", "/app/", "/invite/", "/login", "/onboarding/", "/signup"];

/**
 * Los rastreadores que alimentan respuestas de IA (ChatGPT, Claude, Perplexity,
 * Gemini…). Se les deja pasar a propósito: hoy mucha gente pregunta "¿cómo
 * organizo las compras de la casa?" a un chat y nunca ve una lista de
 * resultados. Si estos bots no pueden leer la portada, la app no existe en esa
 * conversación.
 *
 * Van listados uno por uno en vez de confiar en el `*`: varios de ellos ignoran
 * el comodín y solo obedecen su propio user-agent.
 */
const RASTREADORES_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Bingbot",
  "DuckAssistBot",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVADO },
      ...RASTREADORES_IA.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVADO,
      })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL.origin,
  };
}
