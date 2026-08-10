import { z } from "zod";

import { membershipGate } from "@/lib/ai/guard";
import { checkRateLimit, rateLimitResponse } from "@/lib/ai/rate-limit";
import { cheapestQuote, lookupPrices } from "@/lib/prices";
import { publishCartEvent } from "@/lib/realtime/server-publish";

/**
 * Verificación de precios en tiendas.
 *
 * Publica dos veces a propósito: `price-request` al empezar (para que las dos
 * pantallas vean el spinner) y `price-snapshot` al terminar. Ese ida y vuelta en
 * el canal es lo que hace que la consulta se sienta compartida y no privada de
 * quien la pidió.
 */

export const runtime = "nodejs";

const BodySchema = z.object({
  householdId: z.string().min(1),
  productKey: z.string().min(1).max(80),
  /** Item del carrito al que se le pegan los precios; sin él se usa el productKey. */
  itemId: z.string().optional(),
  /** Texto de búsqueda para el scraper si el productKey no es buen término. */
  query: z.string().max(80).optional(),
});

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    // El detalle del esquema se queda en el servidor: publicarlo dibuja el
    // contrato interno (nombres de campos, tipos, topes) para quien esté
    // mapeando la API.
    console.warn(`[api] cuerpo inválido: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
    return Response.json({ error: "Datos incompletos." }, { status: 400 });
  }
  const { householdId, productKey, itemId, query } = parsed.data;

  // Siempre: esta route dispara un proceso externo, así que no puede quedar
  // abierta a cualquiera que adivine un householdId.
  const { denied, identity } = await membershipGate(householdId);
  if (denied) return denied;
  const userId = identity.profileId;

  // El límite va después de comprobar la pertenencia: primero se sabe quién
  // eres, y recién entonces tiene sentido contarte las peticiones.
  const rate = await checkRateLimit("price-check", {
    profileId: identity.profileId,
    householdId,
  });
  if (!rate.ok) return rateLimitResponse(rate);

  const anchor = itemId ?? productKey;

  await publishCartEvent(
    householdId,
    { type: "price-request", itemId: anchor, productKey, by: userId ?? "assistant" },
    { ephemeral: true },
  );

  const lookup = await lookupPrices(productKey, query);

  const published = await publishCartEvent(householdId, {
    type: "price-snapshot",
    itemId: anchor,
    productKey,
    quotes: lookup.quotes,
  });

  return Response.json({
    ok: true,
    productKey,
    itemId: anchor,
    quotes: lookup.quotes,
    cheapest: cheapestQuote(lookup.quotes),
    // `origin` y `source` no se maquillan: si vino del dataset, se dice.
    origin: lookup.origin,
    note: lookup.note ?? null,
    publishedToChannel: published.ok,
  });
}
