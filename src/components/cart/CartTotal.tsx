"use client";

import { Card, cn, Money, ProgressBar, toneForPercent } from "@/components/ui";

/**
 * El total que late. Es el latido de la demo: cuando el otro agrega algo, este
 * número crece solo y se nota sin que nadie explique nada.
 */

export type BudgetSnapshot = {
  /** Presupuesto mensual de la casa. 0 = no configurado. */
  budget: number;
  /** Compras ya cerradas este mes (no incluye el carrito abierto). */
  transactionsTotal: number;
  dayOfMonth: number;
  daysInMonth: number;
  currency: string;
};

export type CartTotalProps = {
  total: number;
  itemCount: number;
  budget: BudgetSnapshot;
  /** El canal anunció otro total: falta algo por llegar. */
  outOfSync?: boolean;
  className?: string;
};

/** Gasto a fin de mes al ritmo actual. Igual que el servidor, para no mentir. */
export function projectMonthEnd(spent: number, dayOfMonth: number, daysInMonth: number): number {
  if (dayOfMonth <= 0) return spent;
  return Math.round((spent / dayOfMonth) * daysInMonth * 100) / 100;
}

export function CartTotal({ total, itemCount, budget, outOfSync, className }: CartTotalProps) {
  const spent = Math.round((budget.transactionsTotal + total) * 100) / 100;
  const projected = projectMonthEnd(spent, budget.dayOfMonth, budget.daysInMonth);
  const hasBudget = budget.budget > 0;
  const percent = hasBudget ? (spent / budget.budget) * 100 : 0;

  const units = itemCount === 1 ? "1 producto" : `${itemCount} productos`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="px-5 py-4">
        <p className="text-sm text-ink-muted">Total del carrito</p>
        <p className="mt-1 flex items-baseline gap-2">
          <Money
            value={total}
            pulse
            className="text-[34px] font-semibold leading-none text-ink"
          />
        </p>
        <p className="mt-1.5 text-sm text-ink-muted">
          {units}
          {outOfSync ? (
            <span className="ml-2 text-ink-faint" title="Faltan eventos por llegar del canal">
              · sincronizando…
            </span>
          ) : null}
        </p>
      </div>

      {hasBudget ? (
        <div className="border-t border-border-subtle px-5 py-4">
          <ProgressBar
            value={spent}
            max={budget.budget}
            projected={projected}
            label="Presupuesto del mes"
            caption={
              <>
                <Money value={spent} /> <span className="text-ink-faint">de</span>{" "}
                <Money value={budget.budget} round />
              </>
            }
            valueText={`${Math.round(percent)}% del presupuesto usado`}
          />
          <p className="mt-2 text-[13px] text-ink-muted">
            A este ritmo cierras el mes en{" "}
            <Money
              value={projected}
              className={cn(
                "font-medium",
                toneForPercent((projected / budget.budget) * 100) === "critical"
                  ? "text-danger"
                  : "text-ink",
              )}
            />
            .
          </p>
        </div>
      ) : (
        <div className="border-t border-border-subtle px-5 py-3">
          <p className="text-[13px] text-ink-muted">
            Sin presupuesto configurado. Ponle uno y te avisamos antes de pasarte.
          </p>
        </div>
      )}
    </Card>
  );
}
