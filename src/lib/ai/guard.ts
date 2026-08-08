import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Pertenencia a un hogar.
 *
 * El cliente manda `householdId` en el body y **nunca hay que creerle**: con
 * service role key la base no filtra nada, así que un id ajeno leería el carrito
 * de otra casa. Esta es la única barrera.
 *
 * TODO(auth): el `userId` también viene del body por ahora. Cuando el agente de
 * app monte el middleware de Clerk, hay que sacarlo de `auth()` en el servidor y
 * dejar de aceptarlo del cliente — mientras tanto esto valida pertenencia, no
 * identidad.
 * TODO(schema): confirmar nombres reales con el agente de Datos. Se asume
 * `memberships(user_id, household_id)`.
 */

export type MembershipCheck = { ok: true } | { ok: false; status: 401 | 403 | 500; message: string };

export async function assertMembership(
  userId: string | undefined | null,
  householdId: string,
): Promise<MembershipCheck> {
  if (!userId) return { ok: false, status: 401, message: "Falta el usuario." };

  const { data, error } = await supabaseAdmin()
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("household_id", householdId)
    .limit(1)
    .maybeSingle();

  if (error) {
    // No se filtra el detalle del error de la base al cliente.
    console.warn(`[guard] membership check falló: ${error.message}`);
    return { ok: false, status: 500, message: "No se pudo verificar la pertenencia al hogar." };
  }

  if (!data) return { ok: false, status: 403, message: "No perteneces a este hogar." };
  return { ok: true };
}

/** Atajo para API routes: devuelve la Response de error o `null` si todo bien. */
export async function membershipGate(
  userId: string | undefined | null,
  householdId: string,
): Promise<Response | null> {
  const check = await assertMembership(userId, householdId);
  if (check.ok) return null;
  return Response.json({ error: check.message }, { status: check.status });
}
