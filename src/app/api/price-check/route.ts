import { z } from "zod";

import { membershipGate } from "@/lib/ai/guard";
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
  // TODO(auth): obligatorio y desde Clerk cuando el middleware esté montado.
  userId: z.string().optional(),
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
    return Response.json({ error: "Datos incompletos.", issues: parsed.error.issues }, { status: 400 });
  }
  const { householdId, productKey, itemId, query, userId } = parsed.data;

  if (userId) {
    const denied = await membershipGate(userId, householdId);
    if (denied) return denied;
  }

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
