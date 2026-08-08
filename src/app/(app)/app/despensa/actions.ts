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
 * «Volver a comprar» desde la despensa.
 *
 * Solo viaja el id del producto: el precio, el título y la nota de salud se
 * releen del catálogo en el servidor. Lo que manda el navegador nunca entra al
 * carrito tal cual, aunque la despensa ya lo tenga en pantalla.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RebuyResult =
  | { ok: true; title: string; total: number }
  | { ok: false; error: string };

export async function rebuyPantryItem(productId: string): Promise<RebuyResult> {
  if (!UUID.test(productId)) {
    return { ok: false, error: "Ese producto no se puede volver a pedir desde la despensa." };
  }

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

    // El carrito es compartido: el roomie tiene que verlo aparecer sin recargar.
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
    revalidatePath("/app/despensa");

    return { ok: true, title: row.title, total: cart.total };
  } catch (error) {
    console.warn(
      `[despensa] no se pudo volver a comprar ${productId}: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false, error: "No se pudo agregar. Revisa tu conexión e inténtalo de nuevo." };
  }
}
