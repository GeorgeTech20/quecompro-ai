"use client";

import { useCallback, useEffect, useState } from "react";

import { priceHistoryAction } from "@/app/(app)/app/cart/actions";
import { Button, Chip, Input, Modal, Money, SpinnerIcon, Textarea, cn } from "@/components/ui";
import { slugifyKey } from "@/hooks/use-live-cart";
import type { CartItemPayload } from "@/lib/realtime/channels";
import type { MarketPriceRow } from "@/types/db";

/**
 * "Lo pagué en el puesto" — el precio de verdad, no el del catálogo.
 *
 * Se abre desde la fila del carrito y guarda el registro en `market_prices`
 * con mercado, puesto y una nota. El modal muestra el historial del producto
 * para contestar la pregunta de la demo: ¿cuánto estaba antes y ahora? ¿y el
 * puesto de abajo vs este?
 */

export type MarketPriceModalProps = {
  open: boolean;
  item: CartItemPayload;
  householdId: string;
  onClose: () => void;
  onRecord: (input: {
    itemId: string;
    price: number;
    market?: string;
    stall?: string;
    note?: string;
  }) => Promise<void>;
};

function relativeDate(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function MarketPriceModal({
  open,
  item,
  householdId,
  onClose,
  onRecord,
}: MarketPriceModalProps) {
  const [price, setPrice] = useState("");
  const [market, setMarket] = useState("");
  const [stall, setStall] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<MarketPriceRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productKey = item.productKey ?? slugifyKey(item.title);

  // Cada vez que se abre se resetea y se trae el historial fresco.
  useEffect(() => {
    if (!open) return;
    setPrice("");
    setMarket("");
    setStall("");
    setNote("");
    setError(null);
    setHistory([]);
    setLoadingHistory(true);

    let cancelled = false;
    void priceHistoryAction(householdId, productKey)
      .then((result) => {
        if (!cancelled && result.ok) setHistory(result.history);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, householdId, productKey]);

  const save = useCallback(async () => {
    const amount = Number.parseFloat(price.replace(",", "."));
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Escribe cuánto pagaste por este item.");
      return;
    }

    setSaving(true);
    setError(null);
    await onRecord({
      itemId: item.id,
      price: amount,
      market: market.trim() || undefined,
      stall: stall.trim() || undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    onClose();
  }, [price, market, stall, note, item.id, onRecord, onClose]);

  const previous = history[1] ?? null;
  const delta: number | null = history.length > 1 && previous ? history[0].price - previous.price : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={"Precio que pagué"}
      description={`${item.title} · registra lo que costó de verdad, con puesto y nota.`}
      size="sm"
      footer={
        <>
          <Button variant="tertiary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <SpinnerIcon className="size-4" /> : null}
            Guardar precio
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {loadingHistory ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <SpinnerIcon className="size-3.5" /> buscando cómo estaba el precio…
          </p>
        ) : null}
        {!loadingHistory && history.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Es la primera vez que registran este producto. Queda guardado para comparar la
            próxima compra.
          </p>
        ) : null}

        {history.length > 0 ? (
          <section className="flex flex-col gap-1.5">
            <div
              className={cn(
                "flex items-center gap-2 rounded-button border border-border-subtle bg-surface-sunken/60 px-3 py-2.5 text-sm",
                delta && "text-ink",
              )}
            >
              {delta !== null ? (
                <>
                  <Chip size="sm" tone={delta < 0 ? "accent" : "brand"}>
                    {delta < 0 ? "bajó" : "subió"}
                  </Chip>
                  <span className="min-w-0 truncate">
                    <Money value={previous.price} className="text-ink-muted" /> →{" "}
                    <Money value={history[0].price} className="font-semibold" />
                  </span>
                  <span className="ml-auto shrink-0 text-ink-faint">
                    {relativeDate(history[0].recorded_at)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-ink-muted">La última vez:</span>
                  <Money value={history[0].price} className="font-semibold" />
                  <span className="ml-auto shrink-0 text-ink-faint">
                    {relativeDate(history[0].recorded_at)}
                    {history[0].stall ? ` · ${history[0].stall}` : ""}
                  </span>
                </>
              )}
            </div>

            {history.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-control px-2 py-1 text-[13px] text-ink-muted"
              >
                <Money value={entry.price} className="font-medium text-ink" />
                {entry.stall || entry.market ? (
                  <span className="min-w-0 truncate">
                    {[entry.market, entry.stall].filter(Boolean).join(" · ")}
                  </span>
                ) : (
                  <span className="text-ink-faint">sin ubicación</span>
                )}
                {entry.note ? (
                  <span className="min-w-0 truncate italic">«{entry.note}»</span>
                ) : null}
                <span className="ml-auto shrink-0">{relativeDate(entry.recorded_at)}</span>
              </div>
            ))}
          </section>
        ) : null}

        <div className="flex flex-col gap-2">
          <Input
            label="Cuánto pagaste"
            inputSize="md"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            placeholder="ej. 3.50"
            autoFocus
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            error={error ?? undefined}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Mercado / plaza"
              placeholder="Mercado Central"
              value={market}
              onChange={(event) => setMarket(event.target.value)}
            />
            <Input
              label="Puesto"
              placeholder="Puesto 12"
              value={stall}
              onChange={(event) => setStall(event.target.value)}
            />
          </div>
          <Textarea
            label="Nota (opcional)"
            placeholder="kilo de papa, bien roja…"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}