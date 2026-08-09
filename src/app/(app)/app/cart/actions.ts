"use server";

import { auth } from "@clerk/nextjs/server";

import {
  addCartItem,
  getHouseholdCart,
  getHouseholdCartItem,
  getProfileByClerkId,
  getProductById,
  isMember,
  recordMarketPrice,
  removeCartItem,
  searchProducts,
  setCartItemPrice,
  setCartItemPurchased,
  setCartItemNote,
  setCartItemQty,
} from "@/lib/data";
import type {
  CartItemRow,
  HealthGrade,
  MarketPriceRow,
  ProductRow,
  ProfileRow,
} from "@/types/db";
import type { CartItemPayload } from "@/lib/realtime/channels";
import { supabaseAdmin } from "@/lib/supabase/server";

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

export type SetNoteResult =
  | { ok: true; itemId: string; note: string }
  | ActionError;

export type SetPurchasedResult =
  | {
      ok: true;
      itemId: string;
      purchasedAt?: string;
      purchasedBy?: { id: string; name: string; avatarUrl?: string | null };
      purchasePhotoUrl?: string;
    }
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
    note: row.note ?? undefined,
    addedAt: row.created_at,
    addedBy: {
      id: profile.id,
      name: profile.full_name ?? "Alguien de la casa",
      avatarUrl: profile.avatar_url,
    },
  };
}

const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

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
    if (row.purchase_photo_path) {
      await supabaseAdmin().storage.from("purchase-evidence").remove([row.purchase_photo_path]);
    }

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

export async function setNoteAction(
  householdId: string,
  itemId: string,
  value: string,
): Promise<SetNoteResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  const note = value.trim().slice(0, 280);
  try {
    const row = await setCartItemNote(householdId, itemId, note || null);
    if (!row) return { ok: false, error: "Ese item ya no está en el carrito." };
    return { ok: true, itemId, note: row.note ?? "" };
  } catch (error) {
    return fail("note", error);
  }
}

/**
 * Confirma una compra para toda la casa. La foto es opcional y queda en un
 * bucket privado; el canal recibe una URL firmada temporal, nunca la ruta de
 * service role.
 */
export async function setPurchasedAction(
  householdId: string,
  itemId: string,
  purchased: boolean,
  formData?: FormData,
): Promise<SetPurchasedResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  try {
    const current = await getHouseholdCartItem(householdId, itemId);
    if (!current) return { ok: false, error: "Ese producto ya no está en la lista." };

    const photo = formData?.get("photo");
    let uploadedPath: string | null = null;
    if (photo instanceof File && photo.size > 0) {
      const extension = PHOTO_EXTENSIONS[photo.type];
      if (!extension) return { ok: false, error: "Usa una foto JPG, PNG, WebP o HEIC." };
      if (photo.size > MAX_PHOTO_BYTES) {
        return { ok: false, error: "La foto pesa más de 8 MB." };
      }
      uploadedPath = `${householdId}/${itemId}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabaseAdmin()
        .storage.from("purchase-evidence")
        .upload(uploadedPath, await photo.arrayBuffer(), {
          contentType: photo.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (upload.error) throw upload.error;
    }

    const photoPath = purchased
      ? (uploadedPath ?? current.purchase_photo_path)
      : null;
    const purchasedAt = purchased
      ? (current.purchased_at ?? new Date().toISOString())
      : null;
    const purchasedBy = purchased
      ? (current.purchased_by ?? member.profile.id)
      : null;

    let updated: CartItemRow | null;
    try {
      updated = await setCartItemPurchased(householdId, itemId, {
        purchasedAt,
        purchasedBy,
        photoPath,
      });
    } catch (error) {
      if (uploadedPath) {
        await supabaseAdmin().storage.from("purchase-evidence").remove([uploadedPath]);
      }
      throw error;
    }
    if (!updated) return { ok: false, error: "Ese producto ya no está en la lista." };

    const oldPath = current.purchase_photo_path;
    if (oldPath && oldPath !== photoPath) {
      await supabaseAdmin().storage.from("purchase-evidence").remove([oldPath]);
    }

    let purchasePhotoUrl: string | undefined;
    if (photoPath) {
      const signed = await supabaseAdmin()
        .storage.from("purchase-evidence")
        .createSignedUrl(photoPath, 60 * 60);
      purchasePhotoUrl = signed.data?.signedUrl;
    }

    return {
      ok: true,
      itemId,
      purchasedAt: updated.purchased_at ?? undefined,
      purchasedBy: updated.purchased_at && updated.purchased_by === member.profile.id
        ? {
            id: member.profile.id,
            name: member.profile.full_name ?? "Alguien de la casa",
            avatarUrl: member.profile.avatar_url,
          }
        : undefined,
      purchasePhotoUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "error";
    console.warn(`[cart:purchased] ${message}`);
    if (message.includes("0006") || message.includes("purchase-evidence")) {
      return { ok: false, error: "Aplica la migración 0006 para activar la compra en equipo." };
    }
    return { ok: false, error: "No pudimos actualizar la compra. Intenta otra vez." };
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

// --- precios de mercado (lo pagado de verdad) ------------------------------

export type RecordMarketPriceInput = {
  householdId: string;
  itemId: string;
  price: number;
  unit?: string;
  /** El mercado/plaza/puesto donde se compró, p. ej. "Mercado Central". */
  market?: string;
  /** El puesto dentro del mercado, p. ej. "Puesto 12". */
  stall?: string;
  /** La notita del usuario: "kilo de papa, bien roja". */
  note?: string;
};

export type RecordMarketPriceResult =
  | { ok: true; item: CartItemPayload; productKey: string; total: number }
  | ActionError;

export type PriceHistoryResult = { ok: true; history: MarketPriceRow[] } | ActionError;

/**
 * Registra el precio real pagado en el mercado y lo escribe sobre el item del
 * carrito. El historial queda en `market_prices` para comparar "antes y ahora"
 * y "este puesto vs el otro".
 */
export async function recordMarketPriceAction(
  input: RecordMarketPriceInput,
): Promise<RecordMarketPriceResult> {
  const member = await requireMember(input.householdId);
  if (isActionError(member)) return member;

  if (!Number.isFinite(input.price) || input.price < 0) {
    return { ok: false, error: "Ese precio no es válido." };
  }

  try {
    // El item se relee de la base: el título de la fila es lo que se guarda
    // como historia, no lo que manda el navegador.
    const row = await getHouseholdCartItem(input.householdId, input.itemId);
    if (!row) return { ok: false, error: "Ese item ya no está en el carrito." };

    const product = row.product_id ? await getProductById(row.product_id) : null;
    const productKey = product?.product_key ?? slugifyKey(row.title);

    const updated = await setCartItemPrice(input.householdId, input.itemId, input.price);
    if (!updated) return { ok: false, error: "Ese item ya no está en el carrito." };

    await recordMarketPrice({
      household_id: input.householdId,
      cart_item_id: updated.id,
      product_key: productKey,
      title: updated.title,
      unit: input.unit ?? updated.unit,
      price: input.price,
      market: input.market ?? null,
      stall: input.stall ?? null,
      note: input.note ?? null,
      recorded_by: member.profile.id,
    });

    const cart = await getHouseholdCart(input.householdId);
    return {
      ok: true,
      item: toPayload(updated, member.profile),
      productKey,
      total: cart.total,
    };
  } catch (error) {
    return fail("record-market-price", error);
  }
}

/** Historial de precios pagados para un producto o título libre. */
export async function priceHistoryAction(
  householdId: string,
  productKey: string,
): Promise<PriceHistoryResult> {
  const member = await requireMember(householdId);
  if (isActionError(member)) return member;

  try {
    const { getMarketPriceHistory } = await import("@/lib/data/market-prices");
    const history = await getMarketPriceHistory(householdId, productKey);
    return { ok: true, history };
  } catch (error) {
    return fail("price-history", error);
  }
}

/** "Pollo entero" → "pollo-entero". Misma canónica que el cliente del carrito. */
function slugifyKey(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
