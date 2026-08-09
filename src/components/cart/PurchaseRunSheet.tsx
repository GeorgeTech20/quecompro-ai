"use client";

import { IconCamera, IconCheck, IconPhoto } from "@tabler/icons-react";
import { useRef, useState } from "react";

import { Avatar, Button, cn, CloseIcon, LiveDot, Money } from "@/components/ui";
import type { CartWatcher } from "@/hooks/use-cart-presence";
import type { PurchaseFeedEntry } from "@/hooks/use-live-cart";
import { prepareImageUpload } from "@/lib/images/prepare-upload";
import type { CartItemPayload } from "@/lib/realtime/channels";

/**
 * La hoja de pedidos a pantalla completa: la que se ve en el supermercado.
 *
 * Cada check es una compra compartida: viaja por Portal y el otro lado lo ve
 * al instante (tachado + feed de actividad). La foto es evidencia opcional:
 * queda en un bucket privado y el canal solo recibe una URL firmada temporal.
 */

export type PurchaseRunSheetProps = {
  householdName: string;
  items: CartItemPayload[];
  purchasePending: Record<string, boolean>;
  purchaseFeed: PurchaseFeedEntry[];
  others: CartWatcher[];
  presenceCount: number;
  presenceAggregate: boolean;
  onClose: () => void;
  onSetPurchased: (itemId: string, purchased: boolean, photo?: File) => Promise<void>;
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "recién";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "hace 1 min" : `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

export function PurchaseRunSheet({
  householdName,
  items,
  purchasePending,
  purchaseFeed,
  others,
  presenceCount,
  presenceAggregate,
  onClose,
  onSetPurchased,
}: PurchaseRunSheetProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoItemId, setPhotoItemId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  const purchasedCount = items.filter((item) => item.purchasedAt).length;

  function openPhoto(itemId: string) {
    setPhotoItemId(itemId);
    photoInputRef.current?.click();
  }

  async function handlePhotoFile(file: File | undefined) {
    if (!file || !photoItemId) return;
    const itemId = photoItemId;
    setPhotoItemId(null);
    setPreparing(true);
    try {
      const prepared = await prepareImageUpload(file).catch(() => file);
      await onSetPurchased(itemId, true, prepared);
    } finally {
      setPreparing(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-label="Hoja de compra a pantalla completa">
      {/* --- cabecera fija --- */}
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-canvas/95 px-4 pt-4 pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
              Compra de hoy
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
              {householdName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-chip border border-border-subtle bg-surface px-3 py-1.5 text-sm text-ink-muted">
              <LiveDot size="sm" label={presenceCount > 1 ? "Conexión en vivo" : "Solo tú"} />
              {presenceCount > 1
                ? `${presenceCount} en la compra`
                : "Habla con tu equipo"}
            </span>
            <Button variant="tertiary" size="sm" iconLeft={<CloseIcon className="size-4" />} onClick={onClose}>
              <span className="max-sm:hidden">Cerrar</span>
            </Button>
          </div>
        </div>

        {/* --- progreso del canasto --- */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              {purchasedCount === items.length
                ? "¡Canasto lleno!"
                : `${purchasedCount} de ${items.length} en el canasto`}
            </span>
            <span className="tabular-nums text-ink-muted">
              {Math.round((purchasedCount / Math.max(items.length, 1)) * 100)}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-[var(--ease-out-soft)]"
              style={{ width: `${(purchasedCount / Math.max(items.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* --- checklist a pantalla completa --- */}
      <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pt-4 pb-40">
        {items.length === 0 ? (
          <p className="mx-auto max-w-sm py-16 text-center text-sm leading-relaxed text-ink-muted">
            La lista está vacía. Vuelve a la hoja y agrega lo que necesiten esta semana.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {items.map((item) => {
              const bought = item.purchasedAt != null;
              const pending = purchasePending[item.id] === true;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 rounded-panel border border-border-subtle bg-surface p-3.5 shadow-card",
                    bought && "border-brand-200",
                  )}
                >
                  <button
                    type="button"
                    aria-label={bought ? `Quitar ${item.title} del canasto` : `Compré ${item.title}`}
                    disabled={pending}
                    onClick={() => onSetPurchased(item.id, !bought)}
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-full border-2 transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                      bought
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-border-strong bg-surface hover:border-brand-400",
                      pending && "animate-pulse border-brand-400",
                    )}
                  >
                    {pending ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    ) : (
                      <IconCheck className={cn("size-6", !bought && "opacity-0")} strokeWidth={3} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-[15px] font-medium",
                        bought ? "text-ink-muted line-through decoration-border-strong" : "text-ink",
                      )}
                    >
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                      {item.qty > 0 ? (
                        <span className="tabular-nums">
                          {item.qty} {item.unit ?? "und"}
                        </span>
                      ) : null}
                      {item.price > 0 ? <Money value={item.price} className="font-medium text-ink" /> : null}
                      {bought && item.purchasedBy ? (
                        <span className="inline-flex items-center gap-1 text-brand-700">
                          <IconCheck className="size-3" strokeWidth={3} /> {item.purchasedBy.name}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {bought ? (
                    item.purchasePhotoUrl ? (
                      <img
                        src={item.purchasePhotoUrl}
                        alt={`Foto de ${item.title} comprado`}
                        className="size-12 shrink-0 rounded-card border border-border-subtle object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-dashed border-border-subtle text-ink-faint">
                        <IconCheck className="size-5" strokeWidth={3} />
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      aria-label={`Comprar ${item.title} con foto`}
                      disabled={pending}
                      onClick={() => openPhoto(item.id)}
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-2xl border border-border-subtle text-ink-muted",
                        "transition-colors duration-150 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                      )}
                    >
                      <IconCamera className="size-5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* --- el chat de equipo de las compras --- */}
        <section className="mt-8" aria-label="Actividad de la compra">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                Lo que va en el canasto
              </h3>
              <LiveDot size="sm" label="En vivo para toda la casa" />
            </div>
            <p className="text-xs text-ink-muted">
              Cada check y cada foto aparecen acá al instante, en todas las pantallas.
            </p>
          </div>

          <div className="mt-3 flex flex-col divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-card">
            {purchaseFeed.length === 0 ? (
              <p className="px-4 py-5 text-sm leading-relaxed text-ink-muted">
                Aún nada en el canasto. Toca el círculo de un producto cuando lo agarres.
              </p>
            ) : (
              purchaseFeed.map((entry) => (
                <FeedRow key={entry.itemId} entry={entry} />
              ))
            )}
          </div>
        </section>
      </main>

      {/* --- pie fijo: resumen + botón foto directa --- */}
      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-border-subtle bg-canvas/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-muted">Lo que está en el canasto</p>
            <p className="text-xl font-semibold tracking-tight text-ink tabular-nums">
              <Money value={items.filter((item) => item.purchasedAt).reduce((acc, item) => acc + item.price * item.qty, 0)} />
            </p>
          </div>
          <span className="text-[13px] text-ink-muted">
            {purchasedCount}/{items.length} listo{items.length === 1 ? "" : "s"}
          </span>
        </div>
      </footer>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="sr-only"
        disabled={preparing}
        onChange={(event) => void handlePhotoFile(event.target.files?.[0])}
      />
    </div>
  );
}

function FeedRow({ entry }: { entry: PurchaseFeedEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar
        size="sm"
        name={entry.by?.name ?? "Alguien de la casa"}
        src={entry.by?.avatarUrl ?? null}
        id={entry.by?.id ?? "unknown"}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-ink">
          <span className="font-semibold">{entry.by?.name ?? "Alguien de la casa"}</span>{" "}
          compró <span className="font-medium">{entry.title}</span>
        </p>
        <p className="text-xs text-ink-muted">{timeAgo(entry.at)}</p>
      </div>
      {entry.photoUrl ? (
        <>
          <button
            type="button"
            aria-label={`Ver foto de ${entry.title}`}
            onClick={() => setOpen(true)}
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <img
              src={entry.photoUrl}
              alt={`Foto de ${entry.title}`}
              className="size-11 rounded-lg border border-border-subtle object-cover"
            />
          </button>
          {open ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={`Foto de ${entry.title}`}
              onClick={() => setOpen(false)}
            >
              <img
                src={entry.photoUrl}
                alt={`Foto de ${entry.title}`}
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-raised"
              />
              <button
                type="button"
                aria-label="Cerrar foto"
                className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => setOpen(false)}
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <IconPhoto className="size-4 shrink-0 text-ink-faint" aria-hidden="true" />
      )}
    </div>
  );
}