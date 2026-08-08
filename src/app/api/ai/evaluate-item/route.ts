import { z } from "zod";

import { loadCart, loadMonthSpend, findCheaper, findRecipes, type CartItemRow } from "@/lib/ai/data-contract";
import { projectMonthEnd } from "@/lib/ai/context";
import { membershipGate } from "@/lib/ai/guard";
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
  // TODO(auth): pasa a ser obligatorio y a salir de Clerk en el servidor.
  userId: z.string().optional(),
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
    return Response.json({ error: "Datos incompletos.", issues: parsed.error.issues }, { status: 400 });
  }
  const { householdId, itemId, productId, title, price, qty, userId } = parsed.data;

  if (userId) {
    const denied = await membershipGate(userId, householdId);
    if (denied) return denied;
  }

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
  let cheaper: { title: string; store: string; price: number; savings: number } | undefined;
  try {
    const alternative = await findCheaper(productId ?? cartItem?.productId, title, price);
    if (alternative && alternative.price < price) {
      cheaper = {
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
