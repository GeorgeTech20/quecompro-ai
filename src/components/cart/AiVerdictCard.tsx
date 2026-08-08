"use client";

import { useState } from "react";

import { Button, Card, cn, HealthChip, Money } from "@/components/ui";
import type { CartVerdict } from "@/hooks/use-live-cart";

/**
 * La reacción de la IA a lo último que entró al carrito.
 *
 * La IA es un participante del canal, no un chat aparte: por eso esto vive
 * pegado al carrito y aparece solo, sin que nadie pregunte nada.
 */

export type AiVerdictCardProps = {
  verdict: CartVerdict;
  /** Nombre del item al que apunta el veredicto, si sigue en el carrito. */
  itemTitle?: string;
  onSwap: (verdict: CartVerdict) => Promise<void>;
  className?: string;
};

export function AiVerdictCard({ verdict, itemTitle, onSwap, className }: AiVerdictCardProps) {
  const [swapping, setSwapping] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  const cheaper = verdict.cheaper;

  async function handleSwap() {
    if (!cheaper || swapping) return;
    setSwapping(true);
    try {
      await onSwap(verdict);
      // El ahorro sube y se desvanece: confirma el cambio sin robar la atención.
      setSaved(cheaper.savings);
      window.setTimeout(() => setSaved(null), 1600);
    } finally {
      setSwapping(false);
    }
  }

  return (
    <Card className={cn("animate-rise", className)}>
      <div className="flex items-start gap-3 px-5 py-4">
        <HealthChip grade={verdict.healthGrade} size="md" showLabel={false} />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-muted">
            El despensero dice
            {itemTitle ? <span className="text-ink"> · {itemTitle}</span> : null}
          </p>
          <p className="mt-1 text-sm leading-snug text-ink">{verdict.reason}</p>

          {cheaper ? (
            <div className="relative mt-3">
              <p className="text-[13px] text-ink-muted">
                <span className="font-medium text-ink">{cheaper.title}</span> en {cheaper.store}{" "}
                sale <Money value={cheaper.price} className="font-medium text-ink" />.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="mt-2"
                loading={swapping}
                onClick={() => void handleSwap()}
              >
                Cambiar y ahorrar <Money value={cheaper.savings} className="ml-1" />
              </Button>

              {saved !== null ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1 left-0 animate-savings text-sm font-semibold text-brand-600"
                >
                  <Money value={saved} signed /> ahorrados
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
