"use client";

import { Fragment } from "react";

import { HealthChip, Money } from "@/components/ui";

import { IsoBox, ProductArtifact } from "./IsoBox";
import {
  boardCenter,
  boardLeftCorner,
  boardShape,
  boardThicknessFor,
  cabinetShell,
  GUTTER,
  SCENE_H,
  SCENE_W,
  SLOTS,
  SLOTS_PER_SHELF,
} from "./iso";
import { boxAriaLabel } from "./labels";
import type { PantryItem, PantryShelf } from "./types";

/**
 * El mueble.
 *
 * Sobre los 640 px es un dibujo isométrico: un SVG de fondo con la carcasa y
 * las cuatro tablas, y encima una capa de botones HTML — uno por producto —
 * colocados en los huecos de la rejilla. La isometría es solo presentación: la
 * información viaja en el `aria-label` de cada botón, no en el dibujo.
 *
 * Por debajo de 640 px el mismo dato se aplana a una grilla de tarjetas por
 * estante. No hay scroll horizontal en ningún ancho.
 */

export type PantryCabinetProps = {
  shelves: PantryShelf[];
  selectedKey: string | null;
  onSelect: (item: PantryItem) => void;
};

export function PantryCabinet({ shelves, selectedKey, onSelect }: PantryCabinetProps) {
  return (
    // Sin `overflow-hidden`: la ficha flotante de una caja del borde tiene que
    // poder salirse del marco sin que la corten.
    <div className="qc-pantry rounded-card border border-border-subtle">
      <div className="hidden justify-center py-6 sm:flex">
        <IsoScene shelves={shelves} selectedKey={selectedKey} onSelect={onSelect} />
      </div>
      <FlatShelves shelves={shelves} selectedKey={selectedKey} onSelect={onSelect} />
    </div>
  );
}

// --- Isometría -------------------------------------------------------------

function IsoScene({ shelves, selectedKey, onSelect }: PantryCabinetProps) {
  const shell = cabinetShell();

  return (
    <div className="qc-scene" style={{ width: `${SCENE_W}px`, height: `${SCENE_H}px` }}>
      <svg
        className="qc-scene-svg"
        width={SCENE_W}
        height={SCENE_H}
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        aria-hidden="true"
        focusable="false"
      >
        {/* La carcasa va primero: es lo que queda detrás de todo. */}
        <polygon className="qc-wall-a" points={shell.wallA} />
        <polygon className="qc-wall-b" points={shell.wallB} />
        <polygon className="qc-rail" points={shell.railA} />
        <polygon className="qc-rail" points={shell.railB} />

        {/* Tablas de abajo hacia arriba: así la de arriba tapa a la de abajo. */}
        {shelves
          .map((shelf, index) => ({ shelf, index }))
          .reverse()
          .map(({ shelf, index }) => {
            const board = boardShape(index, boardThicknessFor(index));
            return (
              <Fragment key={shelf.key}>
                <polygon className="qc-board-left" points={board.left} />
                <polygon className="qc-board-right" points={board.right} />
                <polygon className="qc-board-top" points={board.top} />
              </Fragment>
            );
          })}
      </svg>

      <div className="qc-items">
        {shelves.map((shelf, index) => {
          const corner = boardLeftCorner(index);
          const center = boardCenter(index);
          const visible = shelf.items.slice(0, SLOTS_PER_SHELF);

          return (
            <div key={shelf.key} role="group" aria-label={shelf.title}>
              <span
                className="qc-shelf-name"
                style={{ top: `${corner.y}px`, width: `${GUTTER - 14}px`, transform: "translateY(-50%)" }}
              >
                {shelf.title}
                <span className="qc-shelf-count">
                  {shelf.items.length === 0
                    ? "vacío"
                    : `${shelf.items.length}${shelf.hidden > 0 ? ` · +${shelf.hidden}` : ""}`}
                </span>
              </span>

              {visible.length === 0 ? (
                <span className="qc-shelf-empty" style={{ left: `${center.x}px`, top: `${center.y}px` }}>
                  Todavía no hay nada en {shelf.title.toLowerCase()}
                </span>
              ) : (
                visible.map((item, order) => (
                  <IsoBox
                    key={item.key}
                    item={item}
                    slot={SLOTS[order]!}
                    shelfIndex={index}
                    order={index * 3 + order}
                    selected={selectedKey === item.key}
                    onSelect={onSelect}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Móvil -----------------------------------------------------------------

function FlatShelves({ shelves, selectedKey, onSelect }: PantryCabinetProps) {
  return (
    <div className="flex flex-col gap-5 p-4 sm:hidden">
      {shelves.map((shelf) => (
        <section key={shelf.key} aria-label={shelf.title}>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-ink-muted uppercase">
            {shelf.title}
            <span className="ml-2 font-medium tracking-normal text-ink-faint normal-case">
              {shelf.items.length === 0 ? "vacío" : `${shelf.items.length}`}
            </span>
          </h3>

          {shelf.items.length === 0 ? (
            <p className="rounded-card border border-dashed border-border-subtle px-3 py-4 text-center text-xs text-ink-faint">
              Todavía no hay nada en {shelf.title.toLowerCase()}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {shelf.items.map((item) => (
                <li key={item.key}>
                  <FlatBox item={item} selected={selectedKey === item.key} onSelect={onSelect} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function FlatBox({
  item,
  selected,
  onSelect,
}: {
  item: PantryItem;
  selected: boolean;
  onSelect: (item: PantryItem) => void;
}) {
  return (
    <button
      type="button"
      data-grade={item.grade ?? undefined}
      aria-pressed={selected}
      aria-label={boxAriaLabel(item)}
      onClick={() => onSelect(item)}
      className={[
        "flex w-full flex-col items-center gap-1 rounded-card border bg-surface px-2 pt-2 pb-2.5",
        "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
        selected ? "border-brand-600 ring-1 ring-brand-200" : "border-border-subtle",
      ].join(" ")}
    >
      <ProductArtifact item={item} className="aspect-square w-full max-w-28 bg-surface-sunken" />
      <span className="line-clamp-2 text-center text-[12px] leading-tight font-medium text-ink">
        {item.name}
      </span>
      <span className="flex items-center gap-1.5">
        {item.grade ? <HealthChip grade={item.grade} size="sm" showLabel={false} /> : null}
        <Money value={item.spent} className="text-[12px] text-ink-muted" />
      </span>
    </button>
  );
}
