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

const BASE_CART_COLUMNS =
  "id, household_id, product_id, title, price, qty, unit, store, category, health_grade, added_by, created_at, updated_at";
const PURCHASE_COLUMNS = "purchased_at, purchased_by, purchase_photo_path";

let noteColumnAvailable: boolean | undefined;
let purchaseColumnsAvailable: boolean | undefined;

async function cartColumns(): Promise<string> {
  if (noteColumnAvailable === undefined || purchaseColumnsAvailable === undefined) {
    const [noteProbe, purchaseProbe] = await Promise.all([
      supabaseAdmin().from("cart_items").select("note").limit(0),
      supabaseAdmin().from("cart_items").select(PURCHASE_COLUMNS).limit(0),
    ]);
    noteColumnAvailable = !noteProbe.error;
    purchaseColumnsAvailable = !purchaseProbe.error;
    if (!noteColumnAvailable) {
      console.warn("[data:cart] migración 0004 pendiente; cargando carrito sin notas.");
    }
    if (!purchaseColumnsAvailable) {
      console.warn("[data:cart] migración 0006 pendiente; compra colaborativa en modo legado.");
    }
  }

  return [
    BASE_CART_COLUMNS,
    noteColumnAvailable ? "note" : "",
    purchaseColumnsAvailable ? PURCHASE_COLUMNS : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeCartRow(row: CartItemRow | null): CartItemRow | null {
  if (!row) return null;
  return {
    ...row,
    note: row.note ?? null,
    purchased_at: row.purchased_at ?? null,
    purchased_by: row.purchased_by ?? null,
    purchase_photo_path: row.purchase_photo_path ?? null,
  };
}

function normalizeCartRows(rows: CartItemRow[]): CartItemRow[] {
  return rows.map((row) => normalizeCartRow(row) as CartItemRow);
}

/** Total del carrito a partir de las líneas ya cargadas. */
export function cartTotal(
  items: readonly Pick<CartItemRow, "price" | "qty">[],
): number {
  return round2(items.reduce((acc, item) => acc + item.price * item.qty, 0));
}

export async function getHouseholdCart(householdId: string): Promise<HouseholdCart> {
  const columns = await cartColumns();
  const result = await supabaseAdmin()
    .from("cart_items")
    .select(columns)
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  const items = normalizeCartRows(unwrapRows<CartItemRow>(result, "getHouseholdCart"));
  return {
    householdId,
    items,
    total: cartTotal(items),
    itemCount: items.length,
  };
}

/** Una línea del carrito de la casa, o null si no existe ahí. */
export async function getHouseholdCartItem(
  householdId: string,
  itemId: string,
): Promise<CartItemRow | null> {
  const columns = await cartColumns();
  const result = await supabaseAdmin()
    .from("cart_items")
    .select(columns)
    .eq("id", itemId)
    .eq("household_id", householdId)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "getHouseholdCartItem"));
}

export async function addCartItem(input: CartItemInsert): Promise<CartItemRow> {
  const columns = await cartColumns();
  const supportsNotes = Boolean(noteColumnAvailable);
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
      ...(supportsNotes ? { note: input.note ?? null } : {}),
      added_by: input.added_by ?? null,
    })
    .select(columns)
    .single();

  return normalizeCartRow(unwrap<CartItemRow>(result, "addCartItem")) as CartItemRow;
}

/**
 * Borra una línea. Devuelve la fila borrada (la UI necesita el `title` para el
 * evento `item-removed`) o null si no existía en esa casa.
 */
export async function removeCartItem(
  householdId: string,
  itemId: string,
): Promise<CartItemRow | null> {
  const columns = await cartColumns();
  const result = await supabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(columns)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "removeCartItem"));
}

/** Cambia la cantidad. `qty` tiene que ser > 0: la base lo obliga con un CHECK
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

  const columns = await cartColumns();
  const result = await supabaseAdmin()
    .from("cart_items")
    .update({ qty })
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(columns)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "setCartItemQty"));
}

/**
 * Pisa el precio del item con lo que de verdad se pagó en el mercado. El
 * precio de catálogo es una referencia; el del puesto, el dato real.
 */
export async function setCartItemPrice(
  householdId: string,
  itemId: string,
  price: number,
): Promise<CartItemRow | null> {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`[data:setCartItemPrice] price debe ser >= 0 (recibido ${price}).`);
  }

  const columns = await cartColumns();
  const result = await supabaseAdmin()
    .from("cart_items")
    .update({ price })
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(columns)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "setCartItemPrice"));
}

/** Guarda una nota corta que todos los miembros ven junto al producto. */
export async function setCartItemNote(
  householdId: string,
  itemId: string,
  note: string | null,
): Promise<CartItemRow | null> {
  const columns = await cartColumns();
  if (!noteColumnAvailable) {
    throw new Error("Las notas requieren aplicar la migración 0004 en Supabase.");
  }
  const result = await supabaseAdmin()
    .from("cart_items")
    .update({ note })
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(columns)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "setCartItemNote"));
}

/** Marca o desmarca un producto como comprado para toda la casa. */
export async function setCartItemPurchased(
  householdId: string,
  itemId: string,
  input: {
    purchasedAt: string | null;
    purchasedBy: string | null;
    photoPath: string | null;
  },
): Promise<CartItemRow | null> {
  const columns = await cartColumns();
  if (!purchaseColumnsAvailable) {
    throw new Error("La compra compartida requiere aplicar la migración 0006 en Supabase.");
  }

  const result = await supabaseAdmin()
    .from("cart_items")
    .update({
      purchased_at: input.purchasedAt,
      purchased_by: input.purchasedBy,
      purchase_photo_path: input.photoPath,
    })
    .eq("id", itemId)
    .eq("household_id", householdId)
    .select(columns)
    .maybeSingle();

  return normalizeCartRow(unwrap<CartItemRow | null>(result, "setCartItemPurchased"));
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
