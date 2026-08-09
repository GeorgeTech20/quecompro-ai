"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  activateHousehold,
  addToHousehold,
  insertCartItem,
  loadCart,
  loadHouseholdByToken,
  loadProductsByIds,
  newHousehold,
  resolveViewer,
  saveHouseholdBudget,
  saveProfile,
} from "@/components/shell/server-data";
import { publishCartEvent } from "@/lib/realtime/server-publish";

import { DEFAULT_BUDGET, type OnboardingState } from "./state";

/**
 * Server actions del alta.
 *
 * Regla del flujo: el usuario tiene que llegar al carrito en menos de 30
 * segundos. Todo lo que no sea imprescindible se puede saltar, y lo
 * imprescindible viene con un valor por defecto razonable ya puesto.
 *
 * El nombre de la casa viaja en una cookie entre el paso 1 y el 2 porque la
 * fila no existe todavía: crearla en el primer paso dejaría casas vacías cada
 * vez que alguien se arrepiente a mitad de camino.
 */

const NAME_COOKIE = "qc_onboarding_name";
const COOKIE_MAX_AGE = 60 * 30;

function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0 && entry.length <= 40),
    ),
  ].slice(0, 20);
}

/** Nombre guardado en el paso 1, para precargar el paso 2. */
export async function pendingHouseholdName(): Promise<string> {
  const store = await cookies();
  return store.get(NAME_COOKIE)?.value ?? "";
}

// --- Paso 1: nombre --------------------------------------------------------

export async function saveHouseName(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) return { status: "error", message: "Ponle un nombre, aunque sea «Casa»." };
  if (name.length > 60) return { status: "error", message: "Muy largo: máximo 60 caracteres." };

  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const occupations = new Set(["Desarrollo", "Diseño", "Estudios", "Hogar", "Otro"]);
  const occupation = String(formData.get("occupation") ?? "").trim();
  const goals = parseList(formData.get("shopping_goals")).slice(0, 3);
  if (!occupations.has(occupation)) {
    return { status: "error", message: "Elige la opción que mejor te describe." };
  }
  if (goals.length === 0) {
    return { status: "error", message: "Elige al menos un objetivo para personalizar tu experiencia." };
  }

  try {
    await saveProfile(viewer.profile.id, { occupation, shopping_goals: goals });
  } catch (error) {
    console.warn(`[onboarding] perfil no guardado: ${error instanceof Error ? error.message : "?"}`);
    return { status: "error", message: "No pudimos guardar tus preferencias. Intenta otra vez." };
  }

  const store = await cookies();
  store.set(NAME_COOKIE, name, { maxAge: COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", path: "/" });

  redirect("/onboarding/household");
}

// --- Paso 2: crear o unirse ------------------------------------------------

export async function createHouseholdAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const fallback = await pendingHouseholdName();
  const name = (String(formData.get("name") ?? "").trim() || fallback || "Mi casa").slice(0, 60);

  try {
    // `newHousehold` ya deja al creador como owner y activa la casa.
    await newHousehold(
      { name, monthly_budget: DEFAULT_BUDGET, currency: "PEN" },
      viewer.profile.id,
    );
  } catch (error) {
    console.warn(
      `[onboarding] no se pudo crear la casa: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo crear la casa. Inténtalo de nuevo." };
  }

  redirect("/onboarding/budget");
}

export async function joinHouseholdAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const raw = String(formData.get("code") ?? "").trim();
  if (raw.length === 0) return { status: "error", message: "Pega el código o el enlace que te pasaron." };

  // Aceptamos el enlace entero: nadie copia solo el token.
  const token = raw.split("/").filter(Boolean).pop() ?? raw;

  try {
    const household = await loadHouseholdByToken(token);
    if (!household) {
      return { status: "error", message: "Ese código no existe o ya se venció." };
    }

    await addToHousehold(household.id, viewer.profile.id, "member");
    await activateHousehold(viewer.profile.id, household.id);
  } catch (error) {
    console.warn(
      `[onboarding] no se pudo unir: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo entrar a esa casa. Inténtalo de nuevo." };
  }

  redirect("/onboarding/done");
}

// --- Paso 3: presupuesto ---------------------------------------------------

export async function saveBudgetAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");
  if (!viewer.household) redirect("/onboarding/household");

  const raw = String(formData.get("monthly_budget") ?? "").replace(",", ".");
  const budget = Number(raw);
  if (!Number.isFinite(budget) || budget < 0) {
    return { status: "error", message: "El presupuesto tiene que ser un número." };
  }

  try {
    await saveHouseholdBudget(viewer.household.id, Math.round(budget));
  } catch (error) {
    console.warn(
      `[onboarding] presupuesto no guardado: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo guardar. Puedes cambiarlo después en Ajustes." };
  }

  redirect("/onboarding/diet");
}

// --- Paso 4: dieta ---------------------------------------------------------

export async function saveDietAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  try {
    await saveProfile(viewer.profile.id, {
      diet_tags: parseList(formData.get("diet_tags")),
      allergies: parseList(formData.get("allergies")),
    });
  } catch (error) {
    console.warn(`[onboarding] dieta no guardada: ${error instanceof Error ? error.message : "?"}`);
    return { status: "error", message: "No se pudo guardar. Puedes ponerlo después en Ajustes." };
  }

  redirect("/onboarding/whatsapp");
}

// --- Paso 5: WhatsApp ------------------------------------------------------

export async function saveWhatsappAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const raw = String(formData.get("whatsapp_phone") ?? "").trim();
  if (raw.length > 0 && !/^\+?[\d\s-]{6,20}$/.test(raw)) {
    return { status: "error", message: "Ese número no se ve bien. Ejemplo: +51 999 888 777." };
  }

  try {
    await saveProfile(viewer.profile.id, { whatsapp_phone: raw.length === 0 ? null : raw });
  } catch (error) {
    console.warn(
      `[onboarding] whatsapp no guardado: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo guardar. Puedes ponerlo después en Ajustes." };
  }

  redirect("/onboarding/done");
}

// --- Paso 6: primer item ---------------------------------------------------

/**
 * Agrega el producto sugerido y manda al carrito. Si algo falla igual te lleva
 * al carrito: terminar el alta nunca puede quedar bloqueado por un insert.
 */
export async function addFirstItemAction(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const productId = String(formData.get("productId") ?? "").trim();
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");
  if (!viewer.household) redirect("/onboarding/household");

  const householdId = viewer.household.id;

  if (productId.length > 0) {
    try {
      const [product] = await loadProductsByIds([productId]);
      if (product) {
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
            addedBy: { id: viewer.profile.id, name: viewer.displayName, avatarUrl: viewer.avatarUrl },
          },
          total: cart.total,
        });
      }
    } catch (error) {
      console.warn(
        `[onboarding] primer item no agregado: ${error instanceof Error ? error.message : "?"}`,
      );
    }
  }

  const store = await cookies();
  store.delete(NAME_COOKIE);

  redirect("/app/cart");
}
