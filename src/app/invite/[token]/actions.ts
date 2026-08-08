"use server";

import { redirect } from "next/navigation";

import {
  activateHousehold,
  addToHousehold,
  belongsToHousehold,
  loadHouseholdByToken,
  resolveViewer,
} from "@/components/shell/server-data";

import type { JoinState } from "./state";

/**
 * Aceptar una invitación.
 *
 * El token llega del formulario, pero eso no es un problema de seguridad: el
 * token *es* la credencial de la invitación, y la identidad de quien se une
 * sigue saliendo de la sesión de Clerk, nunca del body.
 */
export async function joinByTokenAction(
  _previous: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "").trim();
  if (token.length === 0) return { status: "error", message: "Invitación inválida." };

  const viewer = await resolveViewer();
  if (!viewer) redirect(`/login?redirect_url=${encodeURIComponent(`/invite/${token}`)}`);

  try {
    const household = await loadHouseholdByToken(token);
    if (!household) {
      return { status: "error", message: "Esta invitación ya no vale. Pídele otra a quien te invitó." };
    }

    // Volver a entrar a una casa en la que ya estás no puede fallar: solo
    // cambia cuál estás mirando.
    if (!(await belongsToHousehold(household.id, viewer.profile.id))) {
      await addToHousehold(household.id, viewer.profile.id, "member");
    }
    await activateHousehold(viewer.profile.id, household.id);
  } catch (error) {
    console.warn(`[invite] no se pudo unir: ${error instanceof Error ? error.message : "?"}`);
    return { status: "error", message: "No se pudo entrar a la casa. Inténtalo de nuevo." };
  }

  redirect("/app/cart");
}
