"use client";

import { IconPrinter, IconShare2 } from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { CopyIcon, WhatsappIcon } from "@/components/shell/icons";
import { Button, CloseIcon, cn, formatPEN, useToast } from "@/components/ui";
import type { CartItemPayload } from "@/lib/realtime/channels";

/**
 * La nota de la compra de hoy, a pantalla completa y en papel.
 *
 * No es otra vista del carrito: es la lista lista para *salir de la app* — se
 * lee de lejos con el celular en la mano, se manda por WhatsApp o se imprime y
 * se lleva doblada al mercado. Por eso es de solo lectura: acá nadie edita, y
 * si algo cambia se cambia en la hoja de atrás.
 *
 * El texto que se comparte se arma del mismo estado que se está viendo, así
 * que lo que llega al chat es exactamente lo que está en pantalla.
 */

export type TodayNoteSheetProps = {
  householdName: string;
  items: CartItemPayload[];
  total: number;
  onClose: () => void;
};

const DATE_LONG = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function line(item: CartItemPayload): string {
  const qty = item.qty > 1 ? ` ×${item.qty}` : "";
  const subtotal = formatPEN(item.price * item.qty);
  const note = item.note ? ` (${item.note})` : "";
  return `• ${item.title}${qty}${note} — ${subtotal}`;
}

export function TodayNoteSheet({ householdName, items, total, onClose }: TodayNoteSheetProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

  const pending = items.filter((item) => item.purchasedAt == null);
  const done = items.filter((item) => item.purchasedAt != null);
  const today = DATE_LONG.format(new Date());

  const text = useMemo(() => {
    const parts = [`🛒 Compra de hoy — ${householdName}`, today, ""];

    if (pending.length > 0) {
      parts.push("Por comprar", ...pending.map(line), "");
    }
    if (done.length > 0) {
      parts.push("Ya en el canasto", ...done.map(line), "");
    }
    if (items.length === 0) {
      parts.push("La lista está vacía.", "");
    }

    parts.push(`Total: ${formatPEN(total)}`);
    return parts.join("\n");
  }, [householdName, today, pending, done, items.length, total]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Nota copiada", tone: "success" });
    } catch {
      toast({
        title: "No pudimos copiar",
        description: "Selecciona la nota y cópiala a mano.",
        tone: "warning",
      });
    }
  }

  /**
   * `navigator.share` abre el menú del sistema — en Android eso incluye
   * WhatsApp, Notas y todo lo demás. En escritorio casi nunca existe, así que
   * el botón solo aparece cuando de verdad se puede compartir.
   */
  async function shareNative() {
    if (typeof navigator === "undefined" || !navigator.share) return;
    setSharing(true);
    try {
      await navigator.share({ title: `Compra de hoy — ${householdName}`, text });
    } catch {
      // Cancelar el diálogo del sistema no es un error que valga contar.
    } finally {
      setSharing(false);
    }
  }

  const canShareNative = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-canvas"
      role="dialog"
      aria-modal="true"
      aria-label="Nota de la compra de hoy"
    >
      <header className="qc-note-hide-print sticky top-0 z-10 border-b border-border-subtle bg-canvas/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] text-brand-700 uppercase">
              Nota de hoy
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
              {householdName}
            </h2>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            iconLeft={<CloseIcon className="size-4" />}
            onClick={onClose}
          >
            <span className="max-sm:hidden">Cerrar</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 pb-32 sm:py-8">
        <article
          className={cn(
            "qc-shopping-paper qc-note-sheet mx-auto w-full max-w-2xl overflow-hidden",
            "rounded-panel border border-border-subtle shadow-card",
            "px-5 py-6 sm:px-10 sm:py-9",
          )}
        >
          <header className="mb-5 border-b border-dashed border-[color:var(--qc-paper-edge)] pb-4">
            <h3 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Compra de hoy
            </h3>
            <p className="mt-1 text-sm text-ink-muted first-letter:uppercase">
              {today} · {householdName}
            </p>
          </header>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              La lista está vacía. Agrega algo en la hoja de atrás y vuelve.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {pending.length > 0 ? (
                <NoteSection title="Por comprar" items={pending} />
              ) : null}
              {done.length > 0 ? (
                <NoteSection title="Ya en el canasto" items={done} muted />
              ) : null}
            </div>
          )}

          <footer className="mt-6 flex items-baseline justify-between border-t border-dashed border-[color:var(--qc-paper-edge)] pt-4">
            <span className="text-sm font-medium text-ink-muted">Total</span>
            <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
              {formatPEN(total)}
            </span>
          </footer>
        </article>
      </main>

      {/* Las acciones van fijas abajo: en el mercado el pulgar llega ahí. */}
      <div className="qc-note-hide-print fixed inset-x-0 bottom-0 border-t border-border-subtle bg-canvas/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => void copy()}
            iconLeft={<CopyIcon className="size-4" />}
            className="max-sm:flex-1"
          >
            Copiar
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            iconLeft={<IconPrinter className="size-4" />}
            className="max-sm:hidden"
          >
            Imprimir
          </Button>
          {canShareNative ? (
            <Button
              variant="secondary"
              onClick={() => void shareNative()}
              disabled={sharing}
              iconLeft={<IconShare2 className="size-4" />}
              className="max-sm:flex-1"
            >
              Compartir
            </Button>
          ) : null}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-control bg-brand-600 px-4",
              "text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-700",
              "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none",
              "max-sm:flex-1",
            )}
          >
            <WhatsappIcon className="size-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function NoteSection({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: CartItemPayload[];
  muted?: boolean;
}) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
        {title} · {items.length}
      </h4>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-4 border-b border-[color:var(--qc-paper-edge)] py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[15px] leading-snug text-ink",
                  muted && "text-ink-muted line-through decoration-ink-faint/60",
                )}
              >
                {item.title}
                {item.qty > 1 ? (
                  <span className="ml-1.5 text-sm text-ink-muted tabular-nums">×{item.qty}</span>
                ) : null}
              </p>
              {item.note ? (
                <p className="mt-0.5 text-xs text-ink-muted italic">{item.note}</p>
              ) : null}
            </div>
            <span
              className={cn(
                "shrink-0 text-sm text-ink tabular-nums",
                muted && "text-ink-muted",
              )}
            >
              {formatPEN(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
