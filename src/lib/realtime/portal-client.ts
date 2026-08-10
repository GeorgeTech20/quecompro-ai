"use client";

import { Portal } from "@portalsdk/core";

/**
 * Cliente Portal del navegador. Uno solo por pestaña: el SDK maneja el socket
 * y el refcount de canales, así que crear más de uno abriría conexiones de más.
 *
 * El token lo emite el servidor en /api/portal-token (firmado, identidad Clerk).
 * Aquí solo viaja la publishable key, que es pública por diseño.
 */
let client: Portal | undefined;

/**
 * Las comillas y el BOM se cuelan al pegar el valor en el panel de Vercel, y
 * como `NEXT_PUBLIC_*` se inlinea en el bundle tal cual, la key llegaría con
 * comillas al socket y Portal respondería `invalid_api_key`.
 */
const portalPublishableKey = String(process.env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY ?? "")
  .replace(/^﻿/, "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .trim();

/** True cuando la publishable key existe y no está vacía. */
export function isPortalPublishableConfigured(): boolean {
  return portalPublishableKey.length > 0;
}

export function getPortalClient(): Portal {
  if (!client) {
    client = new Portal({
      apiKey: portalPublishableKey,
    });
  }
  return client;
}

/**
 * Resolver de token para <PortalProvider token={fetchPortalToken}>.
 * El SDK lo vuelve a llamar cuando el token caduca, así que no cacheamos.
 */
export async function fetchPortalToken(): Promise<string> {
  const res = await fetch("/api/portal-token", {
    credentials: "include",
    cache: "no-store",
    // Sin esto, `fetch` sigue solo el redirect al login y devuelve el HTML de
    // esa página con status 200: `res.ok` da `true`, el guard de abajo no
    // salta y el `res.json()` revienta con "Unexpected token '<'". Con
    // `manual`, un redirect llega como respuesta opaca (`type: "opaqueredirect"`,
    // `status: 0`) y cae por el camino de error, que es lo correcto: si la
    // sesión caducó, esto es un fallo de autenticación, no de formato.
    redirect: "manual",
  });
  if (res.type === "opaqueredirect" || res.status === 0) {
    throw new Error("portal-token: sesión caducada");
  }
  if (!res.ok) {
    // El `code` viene de Portal (`invalid_api_key`, `forbidden`…): sin él, un
    // 502 en consola no dice nada sobre qué variable está mal.
    const detail = await res
      .json()
      .then((body: { code?: string }) => (body.code ? ` (${body.code})` : ""))
      .catch(() => "");
    throw new Error(`portal-token ${res.status}${detail}`);
  }
  const { token } = (await res.json()) as { token: string };
  return token;
}
