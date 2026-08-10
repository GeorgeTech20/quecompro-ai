import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Next 16 renombró `middleware.ts` a `proxy.ts`; el nombre viejo sigue
 * funcionando pero está deprecado, y la guía actual de Clerk ya asume este.
 *
 * Todo lo que no esté en la lista blanca es privado. Lista blanca y no lista
 * negra: si mañana alguien agrega una ruta y se olvida de este archivo, queda
 * protegida por defecto en vez de abierta por defecto.
 */
const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  // Sin esto, /signup queda protegida: Clerk reescribe a 404 al usuario sin
  // sesión y el botón "Crear cuenta" no lleva a ningún lado. Es justo la
  // ruta que tiene que ver quien todavía NO tiene cuenta.
  "/signup(.*)",
  "/invite/(.*)",
  "/api/webhooks/(.*)",
  // Los archivos que leen los buscadores. El `matcher` de abajo deja pasar las
  // extensiones de imagen y `.webmanifest`, pero no `.txt` ni `.xml`, así que
  // sin esta línea Googlebot pide /robots.txt y recibe un 307 al login: no
  // puede leer ni las reglas ni el mapa del sitio, y la landing no se indexa.
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/manifest.webmanifest",
]);

/**
 * Una API no se redirige al login: se le contesta.
 *
 * Mandar un 307 a `/api/*` rompe a quien llama con `fetch`, que sigue el
 * redirect solo y recibe el HTML del login con status 200. `res.ok` da `true`,
 * el guard de error no salta, y el `res.json()` de después revienta con
 * "Unexpected token '<'". El cliente nunca se entera de que lo que pasó fue
 * que la sesión caducó.
 */
const isApi = createRouteMatcher(["/api/(.*)", "/trpc/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return NextResponse.next();

  if (isApi(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.next();
  }

  // `protect()` a secas responde 404 a quien no ha iniciado sesión —
  // correcto para no filtrar qué rutas existen, pero pésimo para alguien que
  // solo quiere entrar. Se le manda al login y se vuelve a donde iba.
  await auth.protect({
    unauthenticatedUrl: new URL(
      `/login?redirect_url=${encodeURIComponent(req.url)}`,
      req.url,
    ).toString(),
  });

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Todo menos estáticos de Next y archivos con extensión, salvo que vengan
    // en query params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Ruta interna del auto-proxy de Clerk: sin ella el handshake de la
    // sesión de desarrollo no llega.
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
