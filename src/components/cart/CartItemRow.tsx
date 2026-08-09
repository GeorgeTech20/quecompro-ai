"use client";

import { IconBasket, IconCheck, IconNote, IconPencil } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Avatar, Button, cn, CloseIcon, HealthChip, Money } from "@/components/ui";
import type { CartVerdict } from "@/hooks/use-live-cart";
import type { CartItemPayload, PriceQuote } from "@/lib/realtime/channels";

import { MarketPriceModal } from "./MarketPriceModal";
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
  householdId: string;
  /** Lista de compra: el check tacha la línea, como el papel. */
  checked?: boolean;
  onToggleCheck?: (itemId: string) => void;
  onQty: (itemId: string, qty: number) => void;
  onNote: (itemId: string, note: string) => Promise<void>;
  onRemove: (itemId: string) => void;
  onRequestPrices: (itemId: string) => Promise<void>;
  onRecordPrice: (input: {
    itemId: string;
    price: number;
    market?: string;
    stall?: string;
    note?: string;
  }) => Promise<void>;
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
        "grid size-7 place-items-center rounded-button text-ink-muted",
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
  householdId,
  checked = false,
  onToggleCheck,
  onQty,
  onNote,
  onRemove,
  onRequestPrices,
  onRecordPrice,
}: CartItemRowProps) {
  // El veredicto de la IA pisa la nota del catálogo: es más nuevo y mira el
  // item real, no la ficha genérica del producto.
  const grade = verdict?.healthGrade ?? item.healthGrade;
  const subtotal = item.price * item.qty;
  // Fila optimista: todavía no tiene id real, así que ninguna acción del
  // servidor la encontraría. Dura lo que tarda el insert.
  const pendingWrite = item.id.startsWith("temp-");
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.note ?? "");
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => setNoteDraft(item.note ?? ""), [item.note]);

  async function saveNote() {
    await onNote(item.id, noteDraft);
    setNoteOpen(false);
  }

  return (
    <li
      className={cn(
        "group/row grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-5 py-4 animate-rise sm:px-7",
        "lg:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] lg:items-center lg:gap-y-0",
        "border-b border-sky-200/70 last:border-b-0",
        "transition-colors duration-150 hover:bg-sky-50/60",
        pendingWrite && "opacity-70",
      )}
    >
      <button
        type="button"
        aria-label={checked ? `Desmarcar ${item.title}` : `Marca ${item.title} como comprado`}
        onClick={() => onToggleCheck?.(item.id)}
        className={cn(
          "col-start-1 row-start-1 mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] border-2 transition-all duration-200 lg:mt-0",
          checked
            ? "border-brand-600 bg-brand-600 text-white scale-100"
            : "border-border-strong bg-surface text-transparent hover:border-brand-500 hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        )}
      >
        <IconCheck className="size-3.5 animate-rise" strokeWidth={3} />
      </button>

      <div className="col-start-2 row-start-1 min-w-0 lg:col-start-2 lg:row-start-1">
        <div className="flex min-w-0 items-start gap-2">
          <p
            className={cn(
              "min-w-0 break-words text-[15px] font-semibold leading-5 transition-all duration-200",
              checked ? "text-ink-faint line-through decoration-border-strong" : "text-ink",
            )}
          >
            {item.title}
          </p>
          {grade ? <HealthChip grade={grade} size="sm" showLabel={false} /> : null}
        </div>

        <div
          className={cn(
            "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] transition-opacity duration-200",
            checked ? "text-ink-faint/70" : "text-ink-muted",
          )}
        >
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
          {checked && item.purchasedBy ? (
            <span className="inline-flex items-center gap-1 font-medium text-brand-700">
              <IconCheck className="size-3.5" strokeWidth={3} />
              <span className="truncate">compró {item.purchasedBy.name}</span>
            </span>
          ) : null}
        </div>

        {checked && item.purchasePhotoUrl ? (
          <button
            type="button"
            aria-label={`Ver foto de ${item.title} comprado`}
            onClick={() => setPhotoOpen(true)}
            className="mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <img
              src={item.purchasePhotoUrl}
              alt={`Foto de ${item.title} comprado`}
              className="h-16 w-16 rounded-lg border border-border-subtle object-cover"
            />
          </button>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-2">
          <PriceCheckButton
            itemId={item.id}
            quotes={quotes}
            pending={pricePending}
            onRequest={onRequestPrices}
          />
          <Button
            size="sm"
            variant="tertiary"
            iconLeft={<IconBasket className="size-3.5" />}
            disabled={pendingWrite}
            onClick={() => setPriceModalOpen(true)}
          >
            Puesto
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            iconLeft={item.note ? <IconPencil className="size-3.5" /> : <IconNote className="size-3.5" />}
            disabled={pendingWrite}
            onClick={() => setNoteOpen((value) => !value)}
          >
            {item.note ? "Editar nota" : "Añadir nota"}
          </Button>
        </div>

        {item.note && !noteOpen ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Nota:</span> {item.note}
          </p>
        ) : null}

        {noteOpen ? (
          <div className="mt-2 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1 text-xs font-medium text-ink-muted">
              Nota para la compra
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value.slice(0, 280))}
                placeholder="Ej. maduros, sin golpes, marca Gloria"
                rows={2}
                className="mt-1 w-full resize-none rounded-button border border-border-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <Button size="sm" onClick={() => void saveNote()}>
              Guardar
            </Button>
          </div>
        ) : null}
      </div>

      <div className="col-start-2 row-start-2 flex w-fit shrink-0 items-center gap-1 rounded-button border border-sky-200 bg-white px-1 lg:col-start-3 lg:row-start-1">
        <StepButton
          label={`Quitar uno de ${item.title}`}
          disabled={pendingWrite || checked}
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
        className={cn(
          "col-start-3 row-start-2 self-center whitespace-nowrap text-right text-sm font-semibold transition-colors duration-200 lg:col-start-4 lg:row-start-1 lg:w-20",
          checked ? "text-ink-faint" : "text-ink",
        )}
      />

      <button
        type="button"
        aria-label={`Eliminar ${item.title}`}
        disabled={pendingWrite}
        onClick={() => onRemove(item.id)}
        className={cn(
          "col-start-3 row-start-1 grid size-8 shrink-0 place-items-center rounded-button text-ink-faint lg:col-start-5 lg:row-start-1",
          "transition-colors duration-150 hover:bg-surface-sunken hover:text-danger",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        )}
      >
        <CloseIcon className="size-4" />
      </button>

      <MarketPriceModal
        open={priceModalOpen}
        item={item}
        householdId={householdId}
        onClose={() => setPriceModalOpen(false)}
        onRecord={onRecordPrice}
      />

      {photoOpen && item.purchasePhotoUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${item.title}`}
          onClick={() => setPhotoOpen(false)}
        >
          <img
            src={item.purchasePhotoUrl}
            alt={`Foto de ${item.title} comprado`}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-raised"
          />
          <button
            type="button"
            aria-label="Cerrar foto"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setPhotoOpen(false)}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
      ) : null}
    </li>
  );
}
