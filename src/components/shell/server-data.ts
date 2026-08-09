import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { unstable_rethrow } from "next/navigation";

import {
  addCartItem,
  CATEGORY_LABELS,
  createHousehold,
  getHouseholdById,
  getHouseholdByInviteToken,
  getHouseholdCart,
  getHouseholdMembers,
  getMonthSpend,
  getProductsByIds,
  getProfileByClerkId,
  getTransactions,
  isMember,
  joinHousehold,
  listCategories,
  listStores,
  matchRecipes,
  rotateInviteToken,
  searchProducts,
  setActiveHousehold,
  toRecipeSuggestion,
  updateHouseholdBudget,
  updateProfilePreferences,
  upsertProfile,
  type HouseholdCart,
  type MonthSpend,
  type RecipeMatch,
} from "@/lib/data";

import type { RecipeSuggestion } from "@/lib/realtime/channels";
import type {
  CartItemInsert,
  CartItemRow,
  HouseholdRow,
  MemberWithProfile,
  MembershipRole,
  ProductRow,
  ProfileRow,
  TransactionRow,
} from "@/types/db";

/**
 * Puente del esqueleto con `src/lib/data` (agente de Datos).
 *
 * Mismo criterio que `src/lib/ai/data-contract.ts`: todas las pantallas de
 * `/app`, el alta y la invitación llaman aquí y solo aquí. Si el data layer
 * cambia una firma, se arregla este archivo y ninguna pantalla se entera.
 */

export type { MonthSpend };

/** Etiquetas de categoría indexables por `string` (la fila trae texto libre). */
const CATEGORY_LABEL_MAP: Record<string, string> = { ...CATEGORY_LABELS };

export function categoryLabel(key: string): string {
  return CATEGORY_LABEL_MAP[key] ?? key;
}

export type ProfilePatch = {
  full_name?: string | null;
  avatar_url?: string | null;
  whatsapp_phone?: string | null;
  occupation?: string | null;
  shopping_goals?: string[];
  diet_tags?: string[];
  allergies?: string[];
};

// --- Utilidad -------------------------------------------------------------

/**
 * Ejecuta una carga y devuelve el respaldo si revienta.
 *
 * Es la traducción literal de "nada se rompe si Supabase no responde": una
 * tarjeta del resumen puede quedarse en cero, pero la pantalla se pinta igual.
 */
export async function safeLoad<T>(
  load: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    // `redirect`, `notFound` y el bail-out a render dinámico viajan como
    // excepciones: tragárselas rompería el framework en silencio.
    unstable_rethrow(error);
    console.warn(`[data:${label}] ${error instanceof Error ? error.message : "error desconocido"}`);
    return fallback;
  }
}

// --- Identidad ------------------------------------------------------------

export type Viewer = {
  profile: ProfileRow;
  /** `null` cuando el usuario todavía no pasó por el alta. */
  household: HouseholdRow | null;
  /** Id de Clerk: es el `sub` del token de Portal, no el uuid del perfil. */
  clerkId: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Resuelve al usuario de la sesión y su casa activa.
 *
 * Crea el perfil si es la primera vez: no hay webhook de Clerk en el proyecto,
 * así que la fila nace en el primer request autenticado en vez de dejar al
 * usuario en un limbo sin perfil.
 *
 * Devuelve `null` si no hay sesión — el middleware ya protege `/app`, pero
 * `/invite/[token]` es pública y llama a esto igual.
 */
export async function resolveViewer(): Promise<Viewer | null> {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses[0]?.emailAddress ?? null;
  const fallbackName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    email?.split("@")[0] ||
    "Invitado";

  const existing = await getProfileByClerkId(user.id);
  const profile: ProfileRow =
    existing ??
    (await upsertProfile({
      clerk_id: user.id,
      email,
      full_name: fallbackName,
      avatar_url: user.imageUrl,
    }));

  const household = profile.active_household_id
    ? await getHouseholdById(profile.active_household_id)
    : null;

  return {
    profile,
    household,
    clerkId: user.id,
    displayName: profile.full_name ?? fallbackName,
    avatarUrl: profile.avatar_url ?? user.imageUrl ?? null,
  };
}

/**
 * Igual que `resolveViewer`, pero exige casa activa. Lo usan las pantallas de
 * `/app`: el layout ya redirige al alta si no hay, así que llegar aquí sin casa
 * es un bug, no un estado válido.
 */
export async function requireHouseholdViewer(): Promise<
  (Viewer & { household: HouseholdRow }) | null
> {
  const viewer = await resolveViewer();
  if (!viewer || !viewer.household) return null;
  return { ...viewer, household: viewer.household };
}

// --- Casas y miembros -----------------------------------------------------

export async function loadHousehold(householdId: string): Promise<HouseholdRow | null> {
  return getHouseholdById(householdId);
}

export async function loadHouseholdByToken(token: string): Promise<HouseholdRow | null> {
  return getHouseholdByInviteToken(token);
}

export async function loadMembers(householdId: string): Promise<MemberWithProfile[]> {
  return getHouseholdMembers(householdId);
}

export async function belongsToHousehold(
  householdId: string,
  profileId: string,
): Promise<boolean> {
  return isMember(householdId, profileId);
}

/** Crea la casa; el data layer ya deja al creador como `owner` y la activa. */
export async function newHousehold(
  input: { name: string; monthly_budget?: number; currency?: string },
  ownerProfileId: string,
): Promise<HouseholdRow> {
  return createHousehold(input, ownerProfileId);
}

export async function addToHousehold(
  householdId: string,
  profileId: string,
  role: MembershipRole = "member",
): Promise<void> {
  await joinHousehold(householdId, profileId, role);
}

export async function activateHousehold(
  profileId: string,
  householdId: string,
): Promise<void> {
  await setActiveHousehold(profileId, householdId);
}

/**
 * Guarda el presupuesto de la casa.
 *
 * Solo el presupuesto: el data layer expone `updateHouseholdBudget` y todavía
 * no un update general, así que el nombre y la moneda no se pueden cambiar
 * desde aquí. Va reportado, no parcheado en carpeta ajena.
 */
export async function saveHouseholdBudget(
  householdId: string,
  monthlyBudget: number,
): Promise<HouseholdRow | null> {
  return updateHouseholdBudget(householdId, monthlyBudget);
}

export async function saveProfile(
  profileId: string,
  patch: ProfilePatch,
): Promise<ProfileRow | null> {
  return updateProfilePreferences(profileId, patch);
}

/**
 * Token de invitación de la casa. Si estaba cerrada (columna nula), se abre
 * generando uno nuevo — es lo que espera quien pulsa "Invitar".
 */
export async function inviteToken(householdId: string): Promise<string> {
  const household = await getHouseholdById(householdId);
  if (household?.invite_token) return household.invite_token;

  const token = await rotateInviteToken(householdId);
  if (!token) throw new Error(`[invite] la casa ${householdId} no existe`);
  return token;
}

// --- Dinero ---------------------------------------------------------------

export async function loadMonthSpend(householdId: string): Promise<MonthSpend> {
  return getMonthSpend(householdId);
}

/**
 * Últimas transacciones de la casa.
 *
 * El data layer solo acepta un tope, no un rango de fechas: el filtro por mes
 * del historial se hace en memoria sobre esta ventana.
 */
export async function loadTransactions(
  householdId: string,
  limit = 200,
): Promise<TransactionRow[]> {
  return getTransactions(householdId, limit);
}

// --- Carrito y catálogo ---------------------------------------------------

export async function loadCart(householdId: string): Promise<HouseholdCart> {
  return getHouseholdCart(householdId);
}

export async function insertCartItem(input: CartItemInsert): Promise<CartItemRow> {
  return addCartItem(input);
}

export async function loadProductsByIds(ids: readonly string[]): Promise<ProductRow[]> {
  return getProductsByIds(ids);
}

export async function findProducts(
  query: string,
  options: { store?: string; category?: string; limit?: number } = {},
): Promise<ProductRow[]> {
  return searchProducts(query, options);
}

export async function loadStores(): Promise<string[]> {
  return listStores();
}

export async function loadCategories(): Promise<string[]> {
  return listCategories();
}

/**
 * Recetas que el carrito ya alcanza a cubrir, en el shape que viaja por el
 * canal de chat. El plan semanal las usa como propuesta.
 */
export async function suggestRecipesForCart(
  householdId: string,
  limit = 7,
): Promise<RecipeSuggestion[]> {
  const cart = await getHouseholdCart(householdId);
  const productIds = cart.items
    .map((item) => item.product_id)
    .filter((id): id is string => id !== null);

  if (productIds.length === 0) return [];

  const matches: RecipeMatch[] = await matchRecipes(productIds, { limit });
  return matches.map(toRecipeSuggestion);
}
