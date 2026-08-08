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

export function getPortalClient(): Portal {
  if (!client) {
    client = new Portal({
      apiKey: process.env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY ?? "",
    });
  }
  return client;
}

/**
 * Resolver de token para <PortalProvider token={fetchPortalToken}>.
 * El SDK lo vuelve a llamar cuando el token caduca, así que no cacheamos.
 */
export async function fetchPortalToken(): Promise<string> {
  const res = await fetch("/api/portal-token", { credentials: "include" });
  if (!res.ok) throw new Error(`portal-token ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  return token;
}
