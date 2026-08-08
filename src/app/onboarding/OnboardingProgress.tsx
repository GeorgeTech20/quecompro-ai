"use client";

import { usePathname } from "next/navigation";

import { cn, ProgressBar } from "@/components/ui";

export const ONBOARDING_STEPS = [
  { href: "/onboarding/welcome", label: "Tu casa" },
  { href: "/onboarding/household", label: "Crear o unirte" },
  { href: "/onboarding/budget", label: "Presupuesto" },
  { href: "/onboarding/diet", label: "Gustos" },
  { href: "/onboarding/whatsapp", label: "WhatsApp" },
  { href: "/onboarding/done", label: "Listo" },
] as const;

/** Barra de avance del alta. Saber cuánto falta es lo que hace que nadie se salga. */
export function OnboardingProgress() {
  const pathname = usePathname();
  const index = ONBOARDING_STEPS.findIndex((step) => pathname.startsWith(step.href));
  const current = index < 0 ? 0 : index;
  const step = current + 1;
  const total = ONBOARDING_STEPS.length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          Paso {step} de {total}
        </span>
        <span className={cn("text-xs text-ink-muted")}>
          {ONBOARDING_STEPS[current]?.label ?? ""}
        </span>
      </div>

      <ProgressBar
        value={step}
        max={total}
        tone="brand"
        size="sm"
        valueText={`Paso ${step} de ${total}`}
      />
    </div>
  );
}
