"use server";

import { revalidatePath } from "next/cache";

import { inviteToken, requireHouseholdViewer } from "@/components/shell/server-data";

export type InviteLinkResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Devuelve el token de invitación de la casa y lo crea si todavía no había.
 *
 * La casa puede tener la invitación cerrada (`invite_token` nulo): abrirla es
 * un acto explícito de alguien que ya vive ahí, no un efecto secundario de
 * entrar a la pantalla.
 */
export async function ensureInviteLink(): Promise<InviteLinkResult> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." };

  try {
    const token = await inviteToken(viewer.household.id);
    revalidatePath("/app/collab");
    return { ok: true, token };
  } catch (error) {
    console.warn(
      `[collab] no se pudo crear la invitación: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false, error: "No se pudo crear el enlace. Inténtalo de nuevo." };
  }
}
