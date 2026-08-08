import { currentUser } from "@clerk/nextjs/server";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** La identidad sale de la cookie de sesión: nunca se puede cachear. */
export const dynamic = "force-dynamic";

/**
 * Emite el token de sesión de Portal.
 *
 * La identidad la pone el servidor a partir de Clerk — el cliente no manda
 * quién dice ser. Ese es el punto: si el `sub` viniera del navegador,
 * cualquiera podría publicar en el canal haciéndose pasar por otro.
 */
export async function GET() {
  const secret = process.env.PORTAL_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PORTAL_TOKEN_SECRET no está configurado" },
      { status: 500 },
    );
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const name =
    user.firstName ??
    user.username ??
    user.emailAddresses[0]?.emailAddress.split("@")[0] ??
    "Invitado";

  const token = jwt.sign(
    {
      sub: user.id,
      name,
      avatarUrl: user.imageUrl,
    },
    secret,
    { algorithm: "HS256", expiresIn: "1h" },
  );

  // El SDK vuelve a pedir el token cuando expira, así que basta 1 h.
  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
