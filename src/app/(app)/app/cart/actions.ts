"use server";

import { auth } from "@clerk/nextjs/server";

import {
  addCartItem,
  getHouseholdCart,
  getProfileByClerkId,
  getProductById,
  isMember,
  removeCartItem,
  searchProducts,
  setCartItemQty,
} from "@/lib/data";
import type { CartItemRow, HealthGrade, ProductRow, ProfileRow } from "@/types/db";
import type { CartItemPayload } from "@/lib/realtime/channels";

/**
 * Escrituras del carrito.
 *
 * Una server action es un endpoint POST público: el `householdId` llega del
 * navegador y no prueba nada. Por eso cada función pasa primero por
 * `requireMember`, que resuelve la identidad desde la cookie de Clerk (no del
 * body) y comprueba la membresía contra la base. El data layer corre con
 * service role key y no filtra por RLS: esta es la única barrera que hay.
 */

export type ActionError = { ok: false; error: string };

export type AddItemInput = {
  householdId: string;
  productId?: string;
  title: string;
  price: number;
  qty?: number;
  unit?: string;
  store?: string;
  category?: string;
};

export type AddItemResult =
  | { ok: true; item: CartItemPayload; productKey?: string; total: number }
  | ActionError;

export type RemoveItemResult =
  | { ok: true; itemId: string; title: string; total: number }
  | ActionError;

export type SetQtyResult =
  | { ok: true; itemId: string; qty: number; total: number }
  | ActionError;

export type SwapItemResult =
  | { ok: true; removedId: string; item: CartItemPayload; productKey?: string; total: number }
  | ActionError;

export type CatalogHit = {
  id: string;
  productKey: string;
  title: string;
  brand: string | null;
  store: string;
  price: number;
  unit: string;
  category: string;
  healthGrade: HealthGrade | null;
};

export type SearchCatalogResult = { ok: true; hits: CatalogHit[] } | ActionError;

// --- guardias --------------------------------------------------------------

type Member = { profile: ProfileRow };

async function requireMember(householdId: string): Promise<Member | ActionError> {
  if (typeof householdId !== "string" || householdId.length === 0) {
    return { ok: false, error: "Falta la casa." };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." };

  const profile = await getProfileByClerkId(userId);
  if (!profile) return { ok: false, error: "Todavía no terminas de crear tu perfil." };

  if (!(await isMember(householdId, profile.id))) {
    return { ok: false, error: "No perteneces a esta casa." };
  }
  return { profile };
}

function isActionError(value: Member | ActionError): value is ActionError {
  return "ok" in value;
}

/** Errores de la base no salen al cliente tal cual: se registran y se resumen. */
function fail(context: string, error: unknown): ActionError {
  console.warn(`[cart:${context}] ${error instanceof Error ? error.message : "error"}`);
  return { ok: false, error: "No pudimos guardar el cambio. Intenta otra vez." };
}

// --- mapeo fila → evento ---------------------------------------------------

function toPayload(row: CartItemRow, profile: ProfileRow): CartItemPayload {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    qty: row.qty,
    unit: row.unit,
    store: row.store ?? undefined,
    category: row.category ?? undefined,
    healthGrade: row.health_grade ?? undefined,
    addedBy: {
      id: profile.id,
      name: profile.full_name ?? "Alguien de la casa",
      avatarUrl: profile.avatar_url,
    },
  };
}

function toHit(product: ProductRow): CatalogHit {
  return {
    id: product.id,
    productKey: product.product_key,
    title: product.name,
    brand: product.brand,
    store: product.store,
    price: product.price,
    unit: product.unit,
    category: product.category,
    healthGrade: product.health_grade,
  };
}

// --- acciones --------------------------------------------------------------

export async function searchCatalogAction(
  householdId: string,
  query: string,
): Promise<SearchCatalogResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  try {
    const products = await searchProducts(query, { limit: 8 });
    return { ok: true, hits: products.map(toHit) };
  } catch (error) {
    return fail("search", error);
  }
}

export async function addItemAction(input: AddItemInput): Promise<AddItemResult> {
  const member = await requireMember(input.householdId);
  if (isActionError(member)) return member;

  const qty = Math.max(1, Math.trunc(input.qty ?? 1));
  const title = input.title.trim().slice(0, 120);
  if (title.length === 0) return { ok: false, error: "El producto necesita un nombre." };
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Ese precio no es válido." };
  }

  try {
    // El precio y la ficha se releen del catálogo: lo que manda el cliente es
    // "cuál", nunca "cuánto cuesta".
    const product = input.productId ? await getProductById(input.productId) : null;

    const row = await addCartItem({
      household_id: input.householdId,
      product_id: product?.id ?? null,
      title: product?.name ?? title,
      price: product?.price ?? input.price,
      qty,
      unit: product?.unit ?? input.unit ?? "und",
      store: product?.store ?? input.store ?? null,
      category: product?.category ?? input.category ?? null,
      health_grade: product?.health_grade ?? null,
      added_by: member.profile.id,
    });

    const cart = await getHouseholdCart(input.householdId);
    return {
      ok: true,
      item: toPayload(row, member.profile),
      productKey: product?.product_key,
      total: cart.total,
    };
  } catch (error) {
    return fail("add", error);
  }
}

export async function removeItemAction(
  householdId: string,
  itemId: string,
): Promise<RemoveItemResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  try {
    const row = await removeCartItem(householdId, itemId);
    if (!row) return { ok: false, error: "Ese item ya no estaba en el carrito." };

    const cart = await getHouseholdCart(householdId);
    return { ok: true, itemId, title: row.title, total: cart.total };
  } catch (error) {
    return fail("remove", error);
  }
}

export async function setQtyAction(
  householdId: string,
  itemId: string,
  qty: number,
): Promise<SetQtyResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  const safeQty = Math.trunc(qty);
  if (!Number.isFinite(safeQty) || safeQty < 1) {
    return { ok: false, error: "La cantidad mínima es 1." };
  }

  try {
    const row = await setCartItemQty(householdId, itemId, safeQty);
    if (!row) return { ok: false, error: "Ese item ya no está en el carrito." };

    const cart = await getHouseholdCart(householdId);
    return { ok: true, itemId, qty: row.qty, total: cart.total };
  } catch (error) {
    return fail("qty", error);
  }
}

export type SwapItemInput = {
  title: string;
  price: number;
  store: string;
  qty: number;
};

/**
 * Cambia un item por la alternativa barata que propuso la IA.
 *
 * El veredicto viaja sin `productId` (así está tipado el canal), así que la
 * alternativa se busca en el catálogo por nombre y tienda. Si aparece, se copia
 * su ficha completa; si no, se agrega con lo que dijo la IA y sin `product_id`.
 */
export async function swapItemAction(
  householdId: string,
  itemId: string,
  replacement: SwapItemInput,
): Promise<SwapItemResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  const title = replacement.title.trim().slice(0, 120);
  if (title.length === 0) return { ok: false, error: "La alternativa no tiene nombre." };

  try {
    const candidates = await searchProducts(title, { limit: 8 });
    const needle = title.toLowerCase();
    const match =
      candidates.find(
        (product) =>
          product.name.toLowerCase() === needle && product.store === replacement.store,
      ) ?? candidates.find((product) => product.name.toLowerCase() === needle);

    const removed = await removeCartItem(householdId, itemId);
    if (!removed) return { ok: false, error: "Ese item ya no está en el carrito." };

    const qty = Math.max(1, Math.trunc(replacement.qty));
    const row = await addCartItem({
      household_id: householdId,
      product_id: match?.id ?? null,
      title: match?.name ?? title,
      price: match?.price ?? replacement.price,
      qty,
      unit: match?.unit ?? removed.unit,
      store: match?.store ?? replacement.store,
      category: match?.category ?? removed.category,
      health_grade: match?.health_grade ?? null,
      added_by: member.profile.id,
    });

    const cart = await getHouseholdCart(householdId);
    return {
      ok: true,
      removedId: itemId,
      item: toPayload(row, member.profile),
      productKey: match?.product_key,
      total: cart.total,
    };
  } catch (error) {
    return fail("swap", error);
  }
}
