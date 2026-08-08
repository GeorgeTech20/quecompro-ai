"use server";

import { revalidatePath } from "next/cache";

import {
  requireHouseholdViewer,
  saveHouseholdBudget,
  saveProfile,
} from "@/components/shell/server-data";

import type { SettingsState } from "./state";

/**
 * Guardado de ajustes.
 *
 * Las dos acciones vuelven a resolver la sesión por su cuenta: una server
 * action es un POST accesible desde fuera de la UI, así que el `householdId`
 * nunca viaja en el formulario — se saca de la sesión, como en las API routes.
 */

/** Lista separada por comas → array limpio, sin vacíos ni repetidos. */
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

export async function saveHouseholdSettings(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { status: "error", message: "Tu sesión venció. Vuelve a entrar." };

  const name = String(formData.get("name") ?? "").trim();
  const budgetRaw = String(formData.get("monthly_budget") ?? "").replace(",", ".");
  const currency = String(formData.get("currency") ?? "PEN").trim().toUpperCase();

  if (name.length === 0) {
    return { status: "error", message: "Ponle un nombre a la casa." };
  }

  const budget = Number(budgetRaw);
  if (!Number.isFinite(budget) || budget < 0) {
    return { status: "error", message: "El presupuesto tiene que ser un número positivo." };
  }
  if (currency.length !== 3) {
    return { status: "error", message: "La moneda va en tres letras (PEN, USD…)." };
  }

  try {
    await saveHouseholdBudget(viewer.household.id, Math.round(budget * 100) / 100);
  } catch (error) {
    console.warn(
      `[settings] casa no guardada: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/app", "layout");

  // El data layer todavía no expone un update general de la casa (solo el
  // presupuesto). Antes que fingir que se guardó, se dice.
  const pendingName = name !== viewer.household.name;
  const pendingCurrency = currency !== viewer.household.currency;
  if (pendingName || pendingCurrency) {
    return {
      status: "ok",
      message:
        "Presupuesto guardado. El nombre y la moneda todavía no se pueden cambiar desde aquí.",
    };
  }

  return { status: "ok", message: "Listo, guardado." };
}

export async function savePreferences(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { status: "error", message: "Tu sesión venció. Vuelve a entrar." };

  const whatsappRaw = String(formData.get("whatsapp_phone") ?? "").trim();
  const whatsapp = whatsappRaw.length === 0 ? null : whatsappRaw;

  if (whatsapp && !/^\+?[\d\s-]{6,20}$/.test(whatsapp)) {
    return { status: "error", message: "Ese número no se ve bien. Ejemplo: +51 999 888 777." };
  }

  try {
    await saveProfile(viewer.profile.id, {
      diet_tags: parseList(formData.get("diet_tags")),
      allergies: parseList(formData.get("allergies")),
      whatsapp_phone: whatsapp,
    });
  } catch (error) {
    console.warn(
      `[settings] preferencias no guardadas: ${error instanceof Error ? error.message : "?"}`,
    );
    return { status: "error", message: "No se pudo guardar. Inténtalo de nuevo." };
  }

  revalidatePath("/app/settings");
  return { status: "ok", message: "Listo, guardado." };
}
