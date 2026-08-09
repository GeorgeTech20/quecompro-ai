import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/landing/Wordmark";
import { OnboardingProgress } from "./OnboardingProgress";

export const metadata: Metadata = {
  title: { default: "Empecemos", template: "%s · QuéComproo" },
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-[#f2f3f4] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)] lg:p-3">
      <main className="flex min-h-dvh flex-col bg-surface px-5 py-6 sm:px-8 lg:min-h-0 lg:rounded-panel lg:px-12 lg:py-9">
        <Link
          href="/"
          aria-label="QuéComproo, inicio"
          className="w-fit rounded-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <BrandLockup className="text-xl" />
        </Link>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10 sm:py-14">
          <OnboardingProgress />
          <div className="mt-7">{children}</div>
        </div>

        <p className="text-xs leading-relaxed text-ink-faint">
          Tus preferencias se usan para ordenar recomendaciones. Puedes cambiarlas cuando quieras.
        </p>
      </main>

      <aside className="relative hidden min-h-0 overflow-hidden rounded-panel bg-[#e7eaeb] p-5 lg:flex lg:flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-card bg-white">
          <img
            src="/hero/onboarding-food.png"
            alt="Ingredientes frescos organizados sobre una mesa"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute inset-x-7 bottom-7 text-white">
            <p className="max-w-md text-3xl font-semibold tracking-[-0.04em]">
              Tu casa compra junta, incluso cuando están lejos.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/72">
              Lista viva, presupuesto compartido y hábitos saludables en una sola experiencia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs font-medium text-ink-muted">
          <span>Precios reales</span>
          <span>Notas en vivo</span>
          <span>Racha saludable</span>
        </div>
      </aside>
    </div>
  );
}
