"use server";

import { revalidatePath } from "next/cache";

import { inviteToken, requireHouseholdViewer } from "@/components/shell/server-data";
import {
  getHouseholdMembers,
  getHouseholdsForUser,
  getProfileById,
  leaveHousehold,
  rotateInviteToken,
  setActiveHousehold,
} from "@/lib/data";

export type InviteLinkResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export type MembershipResult = { ok: true } | { ok: false; error: string };

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

/**
 * Saca a alguien de la casa.
 *
 * Los permisos se revalidan acá y no en el cliente: el botón puede no estar en
 * pantalla y la acción se puede llamar igual. Las reglas son tres —
 * solo quien es dueño saca a alguien, a un dueño no lo saca nadie, y para
 * salirte tú está `leaveCurrentHousehold`, que además reubica tu casa activa.
 *
 * Lo comprado no se borra: el historial de la casa es de la casa, no de quien
 * lo cargó. Solo se corta el acceso.
 */
export async function removeRoomie(profileId: string): Promise<MembershipResult> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." };

  if (profileId === viewer.profile.id) {
    return { ok: false, error: "Para salir tú de la casa usa «Salir de la casa»." };
  }

  try {
    const members = await getHouseholdMembers(viewer.household.id);
    const me = members.find((member) => member.user_id === viewer.profile.id);
    const target = members.find((member) => member.user_id === profileId);

    if (me?.role !== "owner") {
      return { ok: false, error: "Solo quien creó la casa puede sacar a alguien." };
    }
    if (!target) {
      return { ok: false, error: "Esa persona ya no está en la casa." };
    }
    if (target.role === "owner") {
      return { ok: false, error: "No puedes sacar a quien creó la casa." };
    }

    // Se lee antes de borrar: después de la baja ya no hay forma de saber si
    // esta era su casa activa.
    const targetProfile = await getProfileById(profileId);

    await leaveHousehold(viewer.household.id, profileId);

    // Borrar la membresía no alcanza: el enlace de invitación que esa persona
    // ya tiene en su chat sigue funcionando, y `joinByTokenAction` la vuelve a
    // meter en la casa sin preguntar nada. Una expulsión que se deshace sola
    // no es una expulsión. El precio es que el enlace viejo deja de servir
    // para todos y hay que repartir uno nuevo — correcto: un enlace eterno que
    // sobrevive a las expulsiones no es una invitación, es una llave maestra.
    await rotateInviteToken(viewer.household.id);

    // Si esa era su casa activa queda apuntando a una casa que ya no puede
    // leer, así que se la movemos a otra suya — o a ninguna, y el layout la
    // manda al alta. Si su casa activa era otra, no se toca.
    if (targetProfile?.active_household_id === viewer.household.id) {
      const rest = await getHouseholdsForUser(profileId);
      await setActiveHousehold(profileId, rest[0]?.id ?? null);
    }

    revalidatePath("/app/collab");
    return { ok: true };
  } catch (error) {
    console.warn(
      `[collab] no se pudo sacar al roomie: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false, error: "No se pudo sacar a esa persona. Inténtalo de nuevo." };
  }
}

/**
 * Salirse de la casa propia.
 *
 * Quien la creó no puede irse mientras quede gente adentro: la casa se
 * quedaría sin dueño y nadie podría volver a administrarla. Primero saca a los
 * demás, y recién ahí puede salir.
 */
export async function leaveCurrentHousehold(): Promise<MembershipResult> {
  const viewer = await requireHouseholdViewer();
  if (!viewer) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." };

  try {
    const members = await getHouseholdMembers(viewer.household.id);
    const me = members.find((member) => member.user_id === viewer.profile.id);

    if (me?.role === "owner" && members.length > 1) {
      return {
        ok: false,
        error: "Eres quien creó la casa. Saca primero a los demás y después puedes salir.",
      };
    }

    await leaveHousehold(viewer.household.id, viewer.profile.id);

    const rest = await getHouseholdsForUser(viewer.profile.id);
    await setActiveHousehold(viewer.profile.id, rest[0]?.id ?? null);

    revalidatePath("/app/collab");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    console.warn(
      `[collab] no se pudo salir de la casa: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false, error: "No se pudo salir de la casa. Inténtalo de nuevo." };
  }
}
