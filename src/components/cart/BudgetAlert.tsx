"use client";

import { AlertIcon, cn, Money } from "@/components/ui";

/**
 * Aviso de presupuesto.
 *
 * Tono: firme, no alarmista. Nada de rojo a pantalla completa por pasarse S/ 3
 * — se dice el número, se dice qué falta y se sigue comprando. La alerta que
 * asusta se ignora a la segunda vez.
 */

export type BudgetAlertProps = {
  spent: number;
  budget: number;
  projected: number;
  className?: string;
};

export function BudgetAlert({ spent, budget, projected, className }: BudgetAlertProps) {
  if (budget <= 0 || projected <= budget) return null;

  const over = Math.round((projected - budget) * 100) / 100;
  const alreadyOver = spent > budget;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-card border px-4 py-3 animate-rise",
        alreadyOver
          ? "border-danger/30 bg-danger/8"
          : "border-warning/35 bg-warning/8",
        className,
      )}
    >
      <AlertIcon
        className={cn("mt-0.5 size-4.5 shrink-0", alreadyOver ? "text-danger" : "text-warning")}
      />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-ink">
          {alreadyOver ? "Ya pasaste el presupuesto del mes" : "Vas camino a pasarte del mes"}
        </p>
        <p className="mt-0.5 leading-snug text-ink-muted">
          A este ritmo cierras en <Money value={projected} className="font-medium text-ink" />,{" "}
          <Money value={over} className="font-medium text-ink" /> sobre los{" "}
          <Money value={budget} round /> que pusiste. Llevas{" "}
          <Money value={spent} className="font-medium text-ink" /> gastados.
        </p>
      </div>
    </div>
  );
}
