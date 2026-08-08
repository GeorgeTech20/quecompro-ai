import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { CartItemInsert, CartItemRow } from "@/types/db";
import { round2, unwrap, unwrapRows } from "./shared";

export type HouseholdCart = {
  householdId: string;
  items: CartItemRow[];
  /** Suma de price × qty, en soles. */
  total: number;
  /** Número de líneas, no de unidades. */
  itemCount: number;
};

const CART_COLUMNS =
  "id, household_id, product_id, title, price, qty, unit, store, category, health_grade, added_by, created_at, updated_at";

/** Total del carrito a partir de las líneas ya cargadas. */
export function cartTotal(
  items: readonly Pick<CartItemRow, "price" | "qty">[],
): number {
  return round2(items.reduce((acc, item) => acc + item.price * item.qty, 0));
}

export async function getHouseholdCart(householdId: string): Promise<HouseholdCart> {
  const result = await supabaseAdmin()
    .from("cart_items")
    .select(CART_COLUMNS)
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  const items = unwrapRows<CartItemRow>(result, "getHouseholdCart");
  return {
    householdId,
    items,
    total: cartTotal(items),
    itemCount: items.length,
  };
}

export async function addCartItem(input: CartItemInsert): Promise<CartItemRow> {
  const result = await supabaseAdmin()
    .from("cart_items")
    .insert({
      household_id: input.household_id,
      product_id: input.product_id ?? null,
      title: input.title,
      price: input.price,
      qty: input.qty ?? 1,
      unit: input.unit ?? "und",
      store: input.store ?? null,
      category: input.category ?? null,
      health_grade: input.health_grade ?? null,
      added_by: input.added_by ?? null,
    })
    .select(CART_COLUMNS)
    .single();

  return unwrap<CartItemRow>(result, "addCartItem");
}

/**
 * Borra una línea. Devuelve la fila borrada (la UI necesita el `title` para el
 * evento `item-removed`) o null si no existía en esa casa.
 */
export async function removeCartItem(
  householdId: string,
  itemId: string,
): Promise<CartItemRow | null> {
  const result = await supabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(CART_COLUMNS)
    .maybeSingle();

  return unwrap<CartItemRow | null>(result, "removeCartItem");
}

/**
 * Cambia la cantidad. `qty` tiene que ser > 0: la base lo obliga con un CHECK
 * y bajar a cero es un borrado, no una actualización — usa `removeCartItem`.
 */
export async function setCartItemQty(
  householdId: string,
  itemId: string,
  qty: number,
): Promise<CartItemRow | null> {
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error(
      `[data:setCartItemQty] qty debe ser > 0 (recibido ${qty}). Para llegar a 0 usa removeCartItem.`,
    );
  }

  const result = await supabaseAdmin()
    .from("cart_items")
    .update({ qty })
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(CART_COLUMNS)
    .maybeSingle();

  return unwrap<CartItemRow | null>(result, "setCartItemQty");
}

/** Vacía el carrito de la casa. Devuelve cuántas líneas se fueron. */
export async function clearCart(householdId: string): Promise<number> {
  const result = await supabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("household_id", householdId)
    .select("id");

  return unwrapRows<{ id: string }>(result, "clearCart").length;
}
