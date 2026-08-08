"use client";

import { Badge, Card, HealthChip, Money } from "@/components/ui";

import { qtyLabel, whenLabel } from "./labels";
import type { PantryItem, PantryShelf } from "./types";

/**
 * La despensa como tabla.
 *
 * La isometría es linda, pero no puede ser la única forma de leer los datos:
 * acá está todo lo del mueble, incluido lo que no cupo en los seis huecos de un
 * estante, ordenable de un vistazo y copiable.
 */
export function PantryList({
  shelves,
  selectedKey,
  onSelect,
}: {
  shelves: PantryShelf[];
  selectedKey: string | null;
  onSelect: (item: PantryItem) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {shelves.map((shelf) => (
        <Card key={shelf.key}>
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">{shelf.title}</h3>
            <Badge tone={shelf.items.length === 0 ? "neutral" : "success"} size="sm">
              {shelf.items.length === 0
                ? "vacío"
                : `${shelf.items.length} ${shelf.items.length === 1 ? "producto" : "productos"}`}
            </Badge>
          </div>

          {shelf.items.length === 0 ? (
            <p className="px-4 py-5 text-sm text-ink-faint">
              Todavía no hay nada en {shelf.title.toLowerCase()}.
            </p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {shelf.items.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-pressed={selectedKey === item.key}
                    onClick={() => onSelect(item)}
                    className={[
                      "flex w-full items-center gap-3 px-4 py-3 text-left",
                      "transition-colors duration-150 hover:bg-surface-sunken",
                      "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
                      selectedKey === item.key ? "bg-surface-sunken" : "",
                    ].join(" ")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">
                        {qtyLabel(item)} · {item.store ?? "sin tienda"} · {whenLabel(item)}
                      </span>
                    </span>

                    {item.inCart ? (
                      <Badge tone="brand" size="sm">
                        en el carrito
                      </Badge>
                    ) : null}

                    {item.grade ? (
                      <HealthChip grade={item.grade} size="sm" showLabel={false} />
                    ) : null}

                    <Money value={item.spent} className="w-20 text-right text-sm font-semibold text-ink" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
