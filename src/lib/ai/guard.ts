import "server-only";

import { auth } from "@clerk/nextjs/server";

import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Quién eres y a qué casa puedes tocar.
 *
 * Dos capas distintas, y conviene no confundirlas:
 *
 * 1. **Identidad** la pone Clerk desde la cookie de sesión, en el servidor.
 *    Nunca sale del body: un `userId` que manda el cliente es una afirmación,
 *    no una prueba, y aceptarla equivale a no tener autenticación.
 * 2. **Autorización** es la fila de `memberships`. Como el servidor usa la
 *    service role key, la base no filtra nada por sí sola; si no comprobamos
 *    pertenencia, un `householdId` ajeno lee el carrito de otra casa.
 *
 * `profiles.clerk_id` es el puente entre ambos mundos: Clerk da un id de texto
 * (`user_2ab...`) y `memberships.user_id` apunta al uuid de `profiles`.
 */

export type MembershipCheck =
  | { ok: true; userId: string; profileId: string }
  | { ok: false; status: 401 | 403 | 500; message: string };

/** Id de Clerk del usuario de la sesión, o `null` si no hay sesión. */
export async function currentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId ?? null;
}

/**
 * Resuelve la sesión y comprueba que pertenezca a la casa.
 * No recibe `userId`: lo saca de la sesión a propósito.
 */
export async function assertMembership(
  householdId: string,
): Promise<MembershipCheck> {
  const clerkId = await currentUserId();
  if (!clerkId) return { ok: false, status: 401, message: "No has iniciado sesión." };

  const db = supabaseAdmin();

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id")
    .eq("clerk_id", clerkId)
    .limit(1)
    .maybeSingle();

  if (profileError) {
    // El detalle del error de la base no viaja al cliente.
    console.warn(`[guard] no se pudo resolver el perfil: ${profileError.message}`);
    return { ok: false, status: 500, message: "No se pudo verificar tu cuenta." };
  }
  if (!profile) return { ok: false, status: 403, message: "Tu cuenta aún no tiene perfil." };

  const { data, error } = await db
    .from("memberships")
    .select("household_id")
    .eq("user_id", profile.id)
    .eq("household_id", householdId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(`[guard] membership check falló: ${error.message}`);
    return { ok: false, status: 500, message: "No se pudo verificar la pertenencia al hogar." };
  }
  if (!data) return { ok: false, status: 403, message: "No perteneces a este hogar." };

  return { ok: true, userId: clerkId, profileId: profile.id };
}

/**
 * Atajo para API routes. Devuelve la identidad ya verificada, o la Response de
 * error lista para retornar. Obliga a mirar el resultado: no hay forma de
 * seguir adelante sin haber pasado por acá.
 */
export async function membershipGate(
  householdId: string,
): Promise<
  { denied: Response; identity?: undefined } | { denied: null; identity: { userId: string; profileId: string } }
> {
  const check = await assertMembership(householdId);
  if (check.ok) {
    return { denied: null, identity: { userId: check.userId, profileId: check.profileId } };
  }
  return { denied: Response.json({ error: check.message }, { status: check.status }) };
}
