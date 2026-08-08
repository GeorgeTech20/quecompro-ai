"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Chip, cn, Money, SpinnerIcon } from "@/components/ui";
import type { PriceQuote } from "@/lib/realtime/channels";

/**
 * "Ver precios" y las cotizaciones que van cayendo.
 *
 * El canal manda las cuatro tiendas en un solo `price-snapshot` (un evento por
 * consulta, no cuatro), así que el goteo se hace al pintar: entran de a una
 * cada 140 ms. Es presentación, no dato inventado — todas ya llegaron.
 */

export type PriceCheckButtonProps = {
  itemId: string;
  quotes?: PriceQuote[];
  /** Alguien —en esta pantalla o en otra— pidió verificar este item. */
  pending?: boolean;
  onRequest: (itemId: string) => Promise<void>;
  className?: string;
};

const REVEAL_STEP_MS = 140;

function useStaggered<T>(items: readonly T[]): T[] {
  const [count, setCount] = useState(items.length);
  const previous = useRef(items);

  useEffect(() => {
    if (previous.current === items) return;
    previous.current = items;
    setCount(0);
  }, [items]);

  useEffect(() => {
    if (count >= items.length) return;
    const timer = window.setTimeout(() => setCount((n) => n + 1), REVEAL_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [count, items.length]);

  return items.slice(0, count);
}

export function PriceCheckButton({
  itemId,
  quotes,
  pending = false,
  onRequest,
  className,
}: PriceCheckButtonProps) {
  const list = quotes ?? [];
  const visible = useStaggered(list);

  const cheapest = list.length > 0 ? list.reduce((a, b) => (b.price < a.price ? b : a)) : null;

  if (pending) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[13px] text-ink-muted", className)}
        aria-live="polite"
      >
        <SpinnerIcon className="size-3.5" />
        verificando tiendas…
      </span>
    );
  }

  if (visible.length > 0) {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
        {visible.map((quote) => {
          const best = cheapest !== null && quote.store === cheapest.store;
          return (
            <Chip
              key={`${quote.store}-${quote.price}`}
              size="sm"
              tone={best ? "accent" : "neutral"}
              className="animate-rise"
              title={
                quote.source === "live"
                  ? `Precio consultado en ${quote.store}`
                  : `Precio del dataset de referencia (${quote.store})`
              }
            >
              {quote.store} <Money value={quote.price} className="ml-1 font-semibold" />
              {best ? " · mejor precio hoy" : ""}
            </Chip>
          );
        })}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="tertiary"
      className={className}
      onClick={() => void onRequest(itemId)}
    >
      Ver precios
    </Button>
  );
}
