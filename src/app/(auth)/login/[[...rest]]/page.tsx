import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/landing/Wordmark";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Ruta catch-all (`[[...rest]]`) porque Clerk maneja sus propios sub-pasos
 * —verificación, factor extra, SSO callback— colgando de esta misma ruta.
 */
export default function LoginPage() {
  return (
    <main className="bg-canvas flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" aria-label="QuéComproo, inicio" className="rounded-button">
        <BrandLockup className="text-2xl" markClassName="size-11 text-base" />
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
