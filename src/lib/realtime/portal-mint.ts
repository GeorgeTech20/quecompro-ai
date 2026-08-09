import "server-only";

/**
 * Acuñación de tokens de usuario de Portal.
 *
 * Portal **no acepta JWT firmados por nosotros**: el edge de realtime verifica
 * la firma contra la clave del environment, que vive solo del lado de Portal.
 * El único token válido es el que devuelve `POST /v1/tokens` en el control
 * plane, autenticado con la secret key. Firmar a mano con `PORTAL_SECRET_KEY`
 * da `401 invalid_token / signature verification failed` — que era exactamente
 * lo que rompía el realtime en producción.
 *
 * La secret key nunca sale del servidor: este módulo es `server-only`.
 */

const DEFAULT_API_URL = "https://api.useportal.co";

/** Un `Origin` en la petición hace que Portal rechace la secret key con 403. */
const MINT_HEADERS_NOTE = "sin Origin: Portal rechaza secret keys con cabecera Origin";

export type MintedToken = {
  token: string;
  /** ISO 8601 devuelto por Portal. */
  expiresAt: string;
};

export type MintInput = {
  /** Id de tu usuario. Portal lo pone como `sub` del JWT. */
  userId: string;
  /** Metadatos opacos que viajan con el token (nombre, avatar, rol…). */
  claims?: Record<string, unknown>;
  /** `1h`, `30m`, `45s`, `2d` o segundos. Portal usa 1 h por defecto. */
  ttl?: string;
};

export class PortalMintError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly reason?: string,
  ) {
    super(`portal mint ${status} ${code}${reason ? `: ${reason}` : ""}`);
    this.name = "PortalMintError";
  }
}

/** Limpia comillas, BOM y espacios que se cuelan al pegar valores en Vercel. */
export function cleanEnvValue(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const value = raw
    .replace(/^﻿/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
  return value.length > 0 ? value : undefined;
}

export function portalSecretKey(): string | undefined {
  return cleanEnvValue(process.env.PORTAL_SECRET_KEY);
}

export function portalPublishableKey(): string | undefined {
  return cleanEnvValue(process.env.NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY);
}

export function portalApiUrl(): string {
  return cleanEnvValue(process.env.PORTAL_API_URL) ?? DEFAULT_API_URL;
}

/**
 * Pide a Portal un token de usuario. Lanza `PortalMintError` con el `code` que
 * manda Portal (`invalid_api_key`, `forbidden`, `validation_failed`…), que es
 * más útil que el status a secas.
 */
export async function mintPortalToken(input: MintInput): Promise<MintedToken> {
  const secret = portalSecretKey();
  if (!secret) {
    throw new PortalMintError(500, "missing_secret_key", "PORTAL_SECRET_KEY no está configurado");
  }

  const response = await fetch(`${portalApiUrl()}/v1/tokens`, {
    method: "POST",
    // `MINT_HEADERS_NOTE`: fetch del servidor no manda Origin, y así debe quedar.
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      userId: input.userId,
      ...(input.claims ? { claims: input.claims } : {}),
      ttl: input.ttl ?? "1h",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const code = response.headers.get("x-portal-error") ?? `http_${response.status}`;
    let reason: string | undefined;
    try {
      const body = (await response.json()) as { code?: string; reason?: string };
      reason = body.reason;
    } catch {
      // Portal siempre manda JSON, pero un 502 del borde puede no hacerlo.
    }
    throw new PortalMintError(response.status, code, reason);
  }

  const body = (await response.json()) as MintedToken;
  return body;
}

/**
 * Comprueba que el token acuñado pertenece al environment que esperamos.
 * Solo mira el header del JWT: no valida firma (eso es cosa de Portal).
 * Sirve para detectar una secret key de otro proyecto pegada en Vercel.
 */
export function tokenEnvironmentId(token: string): string | undefined {
  const [rawHeader] = token.split(".");
  if (!rawHeader) return undefined;
  try {
    const header = JSON.parse(Buffer.from(rawHeader, "base64url").toString("utf8")) as {
      kid?: string;
    };
    return header.kid;
  } catch {
    return undefined;
  }
}

export { MINT_HEADERS_NOTE };
