"use server";

import { revalidatePath } from "next/cache";

import {
  insertCartItem,
  loadCart,
  loadProductsByIds,
  requireHouseholdViewer,
} from "@/components/shell/server-data";
import { publishCartEvent } from "@/lib/realtime/server-publish";

/**
 * Alta desde el catálogo.
 *
 * Escribe la línea, publica `item-added` en el canal y devuelve el id para que
 * la tarjeta pueda pedirle el veredicto a `/api/ai/evaluate-item`. La reacción
 * de la IA no se hace aquí a propósito: esa ruta ya existe y es de otro agente.
 */

export type AddToCartResult =
  | { ok: true; itemId: string; title: string; total: number }
  | { ok: false; error: string };

export async function addProductToCart(productId: string): Promise<AddToCartResult> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." };

  const householdId = viewer.household.id;

  try {
    const [product] = await loadProductsByIds([productId]);
    if (!product) return { ok: false, error: "Ese producto ya no está en el catálogo." };

    const row = await insertCartItem({
      household_id: householdId,
      product_id: product.id,
      title: product.name,
      price: product.price,
      qty: 1,
      unit: product.unit,
      store: product.store,
      category: product.category,
      health_grade: product.health_grade,
      added_by: viewer.profile.id,
    });

    const cart = await loadCart(householdId);

    await publishCartEvent(householdId, {
      type: "item-added",
      item: {
        id: row.id,
        title: row.title,
        price: row.price,
        qty: row.qty,
        unit: row.unit,
        store: row.store ?? undefined,
        category: row.category ?? undefined,
        healthGrade: row.health_grade ?? undefined,
        addedBy: {
          id: viewer.profile.id,
          name: viewer.displayName,
          avatarUrl: viewer.avatarUrl,
        },
      },
      total: cart.total,
    });

    revalidatePath("/app");
    revalidatePath("/app/cart");

    return { ok: true, itemId: row.id, title: row.title, total: cart.total };
  } catch (error) {
    console.warn(
      `[products] no se pudo agregar ${productId}: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false, error: "No se pudo agregar. Revisa tu conexión e inténtalo de nuevo." };
  }
}
