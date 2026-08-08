import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui";

import { OnboardingProgress } from "./OnboardingProgress";

export const metadata: Metadata = {
  title: { default: "Empecemos", template: "%s · QuéCompro.app" },
};

/**
 * Alta. Una columna, una decisión por pantalla y la barra de avance siempre a
 * la vista: el objetivo es que el carrito aparezca en menos de 30 segundos.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center bg-canvas px-4 py-8 sm:py-14">
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        QuéCompro<span className="text-brand-600">.app</span>
      </Link>

      <div className="mt-8 w-full max-w-md">
        <OnboardingProgress />

        <Card padding="md" className="mt-4">
          {children}
        </Card>
      </div>
    </div>
  );
}
