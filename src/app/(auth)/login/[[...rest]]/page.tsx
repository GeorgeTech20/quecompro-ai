import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Ruta catch-all (`[[...rest]]`) porque Clerk maneja sus propios sub-pasos
 * —verificación, factor extra, SSO callback— colgando de esta misma ruta.
 */
export default function LoginPage() {
  return (
    <main className="bg-canvas flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" className="text-ink text-2xl font-semibold tracking-tight">
        QuéCompro<span className="text-brand-600">.app</span>
      </Link>

      <p className="text-ink-muted max-w-sm text-center text-sm">
        Entra y sigue llenando el carrito de tu casa. Lo que agregues aparece al
        toque en la pantalla de los demás.
      </p>

      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#059669",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-inter)",
          },
        }}
      />
    </main>
  );
}
