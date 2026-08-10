import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Límite de uso de las rutas que cuestan plata.
 *
 * El problema que resuelve: `/api/assistant` gasta hasta tres completions con
 * el catálogo entero de contexto, y la única barrera era pertenecer a una casa.
 * Cualquiera se registra gratis, el onboarding le crea su casa, y con un bucle
 * de curl vacía el saldo del proveedor en una tarde.
 *
 * Se cuenta por **perfil y por casa**, y hace falta que pasen los dos: por
 * perfil para que una persona no abuse, y por casa para que no baste con
 * registrar cinco cuentas y meterlas todas en el mismo hogar.
 *
 * El contador vive en Postgres (`bump_rate_limit`, migración 0007). En memoria
 * no sirve: en Vercel cada lambda tendría el suyo y el límite se multiplicaría
 * por el número de instancias vivas.
 */

export type RateBucket = "assistant" | "price-check" | "evaluate-item";

type Policy = { perHour: number; perDay: number };

/**
 * Cuánto cuesta cada ruta, y de ahí el límite.
 *
 * `assistant` es la cara: varias completions por mensaje. `price-check` puede
 * lanzar scrapes. `evaluate-item` es la más barata y se dispara sola al agregar
 * productos, así que va más suelta o estorbaría el uso normal.
 */
const POLICIES: Record<RateBucket, { profile: Policy; household: Policy }> = {
  assistant: {
    profile: { perHour: 30, perDay: 200 },
    household: { perHour: 80, perDay: 500 },
  },
  "price-check": {
    profile: { perHour: 40, perDay: 250 },
    household: { perHour: 100, perDay: 600 },
  },
  "evaluate-item": {
    profile: { perHour: 120, perDay: 800 },
    household: { perHour: 300, perDay: 2000 },
  },
};

export type RateVerdict =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; scope: "perfil" | "casa"; window: "hora" | "día" };

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const floorTo = (ms: number, size: number): Date => new Date(Math.floor(ms / size) * size);

/**
 * Suma uno al contador y devuelve el total de la ventana.
 * `null` si la base falla — el llamante decide qué hacer con eso.
 */
async function bump(
  subject: string,
  bucket: string,
  window: Date,
  limit: number,
): Promise<number | null> {
  const { data, error } = await supabaseAdmin().rpc("bump_rate_limit", {
    p_subject: subject,
    p_bucket: bucket,
    p_window: window.toISOString(),
    // El tope viaja al SQL para que la petición rechazada no siga sumando: si
    // contara, reintentar empujaría la ventana y el bloqueo no vencería nunca.
    p_limit: limit,
  });

  if (error) {
    console.warn(`[rate-limit] no se pudo contar ${bucket}: ${error.message}`);
    return null;
  }
  return typeof data === "number" ? data : null;
}

/** Segundos que faltan para que la ventana se renueve. */
function secondsLeft(now: number, windowStart: Date, size: number): number {
  return Math.max(1, Math.ceil((windowStart.getTime() + size - now) / 1000));
}

/**
 * Comprueba las cuatro cuentas (perfil/casa × hora/día) y cuenta esta petición.
 *
 * **Si la base falla, deja pasar.** Es una decisión, no un descuido: este
 * límite protege el saldo del proveedor, no datos de nadie. Un fallo del
 * contador tumbando el asistente para todo el mundo hace más daño que las
 * peticiones que se escapen mientras dure la avería. La autorización, que sí
 * protege datos, va por otro lado y ahí se falla cerrado.
 */
export async function checkRateLimit(
  bucket: RateBucket,
  identity: { profileId: string; householdId: string },
): Promise<RateVerdict> {
  const policy = POLICIES[bucket];
  const now = Date.now();
  const hourWindow = floorTo(now, HOUR_MS);
  const dayWindow = floorTo(now, DAY_MS);

  const counters = await Promise.all([
    bump(`profile:${identity.profileId}`, `${bucket}:h`, hourWindow, policy.profile.perHour),
    bump(`profile:${identity.profileId}`, `${bucket}:d`, dayWindow, policy.profile.perDay),
    bump(`household:${identity.householdId}`, `${bucket}:h`, hourWindow, policy.household.perHour),
    bump(`household:${identity.householdId}`, `${bucket}:d`, dayWindow, policy.household.perDay),
  ]);

  const [profileHour, profileDay, householdHour, householdDay] = counters;

  const checks: {
    hits: number | null;
    limit: number;
    scope: "perfil" | "casa";
    window: "hora" | "día";
    start: Date;
    size: number;
  }[] = [
    { hits: profileHour, limit: policy.profile.perHour, scope: "perfil", window: "hora", start: hourWindow, size: HOUR_MS },
    { hits: profileDay, limit: policy.profile.perDay, scope: "perfil", window: "día", start: dayWindow, size: DAY_MS },
    { hits: householdHour, limit: policy.household.perHour, scope: "casa", window: "hora", start: hourWindow, size: HOUR_MS },
    { hits: householdDay, limit: policy.household.perDay, scope: "casa", window: "día", start: dayWindow, size: DAY_MS },
  ];

  for (const check of checks) {
    if (check.hits !== null && check.hits >= check.limit) {
      return {
        ok: false,
        retryAfterSeconds: secondsLeft(now, check.start, check.size),
        scope: check.scope,
        window: check.window,
      };
    }
  }

  // Barrido oportunista: 1 de cada 50 peticiones borra lo de hace más de dos
  // días. Evita montar un cron para una tabla que se limpia sola.
  if (Math.random() < 0.02) {
    void supabaseAdmin()
      .rpc("delete_expired_rate_limits", {
        p_before: new Date(now - 2 * DAY_MS).toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn(`[rate-limit] limpieza falló: ${error.message}`);
      });
  }

  return { ok: true };
}

/** La respuesta 429, con `Retry-After` para que el cliente sepa cuándo volver. */
export function rateLimitResponse(verdict: Extract<RateVerdict, { ok: false }>): Response {
  const minutes = Math.ceil(verdict.retryAfterSeconds / 60);
  return Response.json(
    {
      error:
        verdict.window === "hora"
          ? `Demasiadas consultas seguidas. Vuelve a intentar en ${minutes} min.`
          : "Se alcanzó el límite del día para esta casa. Mañana se reinicia.",
      scope: verdict.scope,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(verdict.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}
