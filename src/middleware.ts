import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Todo lo que no esté acá es privado. Preferimos lista blanca a lista negra:
 * si mañana alguien agrega una ruta y se olvida del middleware, queda protegida
 * por defecto en vez de quedar abierta por defecto.
 */
const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/invite/(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return NextResponse.next();
  await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Todo menos estáticos de Next y archivos con extensión, salvo que vengan
    // en query params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
