import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  mintPortalToken,
  PortalMintError,
  cleanEnvValue,
  tokenEnvironmentId,
} from "@/lib/realtime/portal-mint";

export const runtime = "nodejs";
/** La identidad sale de la cookie de sesión: nunca se puede cachear. */
export const dynamic = "force-dynamic";

/**
 * Emite el token de sesión de Portal.
 *
 * La identidad la pone el servidor a partir de Clerk — el cliente no manda
 * quién dice ser. Ese es el punto: si el `userId` viniera del navegador,
 * cualquiera podría publicar en el canal haciéndose pasar por otro.
 *
 * El token lo **acuña Portal**, no nosotros. Un JWT firmado aquí con
 * `PORTAL_SECRET_KEY` se ve bien pero el edge lo rechaza con
 * `invalid_token / signature verification failed`: la clave de firma del
 * environment no es la secret key, y solo Portal la tiene.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const name =
    user.firstName ??
    user.username ??
    user.emailAddresses[0]?.emailAddress.split("@")[0] ??
    "Invitado";

  try {
    // El SDK vuelve a pedir el token cuando expira, así que basta 1 h.
    const { token, expiresAt } = await mintPortalToken({
      userId: user.id,
      claims: { name, avatarUrl: user.imageUrl },
      ttl: "1h",
    });

    // Guarda contra una secret key de otro proyecto pegada en Vercel: si el
    // environment del token no es el esperado, el realtime conectaría contra
    // canales que no son los nuestros.
    const expectedEnvId = cleanEnvValue(process.env.PORTAL_ENV_ID);
    const actualEnvId = tokenEnvironmentId(token);
    if (expectedEnvId && actualEnvId && expectedEnvId !== actualEnvId) {
      console.error(
        `[portal-token] environment mismatch: PORTAL_ENV_ID=${expectedEnvId} pero el token es de ${actualEnvId}`,
      );
      return NextResponse.json(
        { error: "Portal environment mismatch" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { token, expiresAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof PortalMintError) {
      // El `reason` de Portal ya viene sin secretos y es lo único que ayuda a
      // diagnosticar desde los logs de Vercel.
      console.error(`[portal-token] ${error.message}`);
      const status = error.code === "missing_secret_key" ? 500 : 502;
      return NextResponse.json(
        { error: "No se pudo emitir el token de Portal", code: error.code },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[portal-token] error inesperado", error);
    return NextResponse.json(
      { error: "No se pudo emitir el token de Portal" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
