import { z } from "zod";

import { loadCart, loadMonthSpend, findCheaper, findRecipes, type CartItemRow } from "@/lib/ai/data-contract";
import { projectMonthEnd } from "@/lib/ai/context";
import { membershipGate } from "@/lib/ai/guard";
import { checkRateLimit, rateLimitResponse } from "@/lib/ai/rate-limit";
import { gradeItem } from "@/lib/ai/health";
import type { CartEvent } from "@/lib/realtime/channels";
import { publishCartEvent, publishChatEvent } from "@/lib/realtime/server-publish";

/**
 * Reacción instantánea al agregar algo al carrito.
 *
 * Todo acá es determinista: nota de salud por tabla, alternativa por catálogo,
 * proyección por ritmo de gasto. Cero LLM — el chip A/B/C tiene que aparecer
 * junto con el item, no dos segundos después. Lo que se publica en el canal es
 * exactamente lo que devuelve el JSON, así el cliente puede republicarlo si
 * Portal estuviera caído.
 */

export const runtime = "nodejs";

const BodySchema = z.object({
  householdId: z.string().min(1),
  itemId: z.string().min(1),
  productId: z.string().optional(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  qty: z.number().int().min(1),
});

/**
 * Debounce por item en memoria del proceso: la UI optimista puede disparar dos
 * veces (alta + ajuste de cantidad) y no queremos dos veredictos del mismo item.
 */
const DEBOUNCE_MS = 300;
const lastSeen = new Map<string, number>();

function shouldSkip(itemId: string): boolean {
  const now = Date.now();
  const previous = lastSeen.get(itemId);
  if (previous !== undefined && now - previous < DEBOUNCE_MS) return true;
  lastSeen.set(itemId, now);
  // Poda barata: el Map no puede crecer para siempre en un proceso largo.
  if (lastSeen.size > 500) {
    for (const [key, at] of lastSeen) {
      if (now - at > 60_000) lastSeen.delete(key);
    }
  }
  return false;
}

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
  const { householdId, itemId, productId, title, price, qty } = parsed.data;

  // Sin excepciones: la identidad viene de la sesión y la pertenencia se
  // comprueba siempre. Un veredicto también revela qué hay en el carrito.
  const { denied, identity } = await membershipGate(householdId);
  if (denied) return denied;

  const rate = await checkRateLimit("evaluate-item", {
    profileId: identity.profileId,
    householdId,
  });
  if (!rate.ok) return rateLimitResponse(rate);

  if (shouldSkip(itemId)) {
    return Response.json({ ok: true, deduped: true });
  }

  const [cart, spend] = await Promise.all([loadCart(householdId), loadMonthSpend(householdId)]);
  const cartItem: CartItemRow | undefined = cart.items.find((item) => item.id === itemId);

  // 1) Salud — determinista, con los macros del catálogo si los hay.
  const verdict = gradeItem({
    title,
    category: cartItem?.category,
    macros: cartItem?.macros,
  });

  // 2) Alternativa más barata.
  let cheaper: NonNullable<Extract<CartEvent, { type: "ai-verdict" }>["cheaper"]> | undefined;
  try {
    const alternative = await findCheaper(productId ?? cartItem?.productId);
    if (alternative && alternative.price < price) {
      cheaper = {
        // Con el id, aceptar el swap es una escritura directa: sin él habría
        // que buscar por nombre + tienda, que falla justo cuando el catálogo
        // tiene el mismo producto en varias cadenas.
        productId: alternative.productId,
        title: alternative.title,
        store: alternative.store,
        price: alternative.price,
        savings: Math.round((price - alternative.price) * qty * 100) / 100,
      };
    }
  } catch (error) {
    console.warn(`[evaluate-item] alternativa falló: ${error instanceof Error ? error.message : "?"}`);
  }

  // 3) Presupuesto: la alerta sale solo si la proyección se pasa con holgura del 5 %.
  const projected = projectMonthEnd(spend.spent);
  const budget = spend.budget ?? 0;
  const budgetAlert =
    budget > 0 && projected > budget * 1.05
      ? { spent: spend.spent, budget, projected }
      : undefined;

  const payload: CartEvent = {
    type: "ai-verdict",
    itemId,
    healthGrade: verdict.grade,
    reason: verdict.reason,
    ...(cheaper ? { cheaper } : {}),
    ...(budgetAlert ? { budgetAlert } : {}),
  };

  const published = await publishCartEvent(householdId, payload);

  // 4) Receta que el carrito ya cubre. Va en cart:chat porque es conversación,
  //    no un cambio del carrito.
  let recipePublished = false;
  try {
    const recipes = await findRecipes(householdId, 2);
    const easy = recipes.find((recipe) => recipe.difficulty === "facil");
    if (easy) {
      await publishChatEvent(householdId, { type: "recipe-suggestion", recipe: easy });
      recipePublished = true;
    }
  } catch (error) {
    console.warn(`[evaluate-item] recetas fallaron: ${error instanceof Error ? error.message : "?"}`);
  }

  return Response.json({
    ok: true,
    verdict: payload,
    recipePublished,
    // El cliente republica si el servidor no pudo llegar al canal.
    publishedToChannel: published.ok,
  });
}
