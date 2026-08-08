"use client";

import { Avatar, cn, CloseIcon, HealthChip, Money } from "@/components/ui";
import type { CartVerdict } from "@/hooks/use-live-cart";
import type { CartItemPayload, PriceQuote } from "@/lib/realtime/channels";

import { PriceCheckButton } from "./PriceCheckButton";

/**
 * Una línea del carrito. Todo lo que cambia en vivo entra por aquí: la nota de
 * salud que publica la IA, el chip de mejor precio y la cantidad que mueve el
 * otro. La fila nunca pide confirmación: eliminar se deshace con el toast.
 */

export type CartItemRowProps = {
  item: CartItemPayload;
  verdict?: CartVerdict;
  quotes?: PriceQuote[];
  pricePending?: boolean;
  onQty: (itemId: string, qty: number) => void;
  onRemove: (itemId: string) => void;
  onRequestPrices: (itemId: string) => Promise<void>;
};

const MAX_QTY = 99;

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-control text-ink-muted",
        "transition-colors duration-150 hover:bg-surface-sunken hover:text-ink",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
      )}
    >
      {children}
    </button>
  );
}

export function CartItemRow({
  item,
  verdict,
  quotes,
  pricePending,
  onQty,
  onRemove,
  onRequestPrices,
}: CartItemRowProps) {
  // El veredicto de la IA pisa la nota del catálogo: es más nuevo y mira el
  // item real, no la ficha genérica del producto.
  const grade = verdict?.healthGrade ?? item.healthGrade;
  const subtotal = item.price * item.qty;
  // Fila optimista: todavía no tiene id real, así que ninguna acción del
  // servidor la encontraría. Dura lo que tarda el insert.
  const pendingWrite = item.id.startsWith("temp-");

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 animate-rise",
        "border-b border-border-subtle last:border-b-0",
        pendingWrite && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{item.title}</p>
          {grade ? <HealthChip grade={grade} size="sm" showLabel={false} /> : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
          <Money value={item.price} />
          <span aria-hidden="true">·</span>
          <span>{item.unit ?? "und"}</span>
          {item.store ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.store}</span>
            </>
          ) : null}
          {item.addedBy ? (
            <span className="inline-flex items-center gap-1">
              <Avatar
                size="xs"
                name={item.addedBy.name}
                src={item.addedBy.avatarUrl}
                id={item.addedBy.id}
              />
              <span className="truncate">{item.addedBy.name}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-1.5">
          <PriceCheckButton
            itemId={item.id}
            quotes={quotes}
            pending={pricePending}
            onRequest={onRequestPrices}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 rounded-control border border-border-subtle bg-surface px-1">
        <StepButton
          label={`Quitar uno de ${item.title}`}
          disabled={pendingWrite}
          onClick={() => onQty(item.id, item.qty - 1)}
        >
          <span aria-hidden="true" className="text-base leading-none">
            −
          </span>
        </StepButton>
        <span className="w-6 text-center text-sm font-medium tabular-nums text-ink">
          {item.qty}
        </span>
        <StepButton
          label={`Agregar uno de ${item.title}`}
          disabled={pendingWrite || item.qty >= MAX_QTY}
          onClick={() => onQty(item.id, item.qty + 1)}
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
        </StepButton>
      </div>

      <Money
        value={subtotal}
        className="w-20 shrink-0 text-right text-sm font-semibold text-ink"
      />

      <button
        type="button"
        aria-label={`Eliminar ${item.title}`}
        disabled={pendingWrite}
        onClick={() => onRemove(item.id)}
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-control text-ink-faint",
          "transition-colors duration-150 hover:bg-surface-sunken hover:text-danger",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        )}
      >
        <CloseIcon className="size-4" />
      </button>
    </li>
  );
}
