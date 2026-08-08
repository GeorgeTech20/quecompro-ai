"use client";

import { formatPEN } from "@/components/ui";

import {
  BOX_SVG_W,
  boxAnchor,
  boxHeight,
  boxShape,
  boxSvgHeight,
  type Slot,
} from "./iso";
import { boxAriaLabel, qtyLabel, whenLabel } from "./labels";
import type { PantryItem } from "./types";

/**
 * La cajita del producto.
 *
 * Tres caras (tapa, lado derecho, lado izquierdo) del mismo color en tres
 * tonos: eso es todo el volumen que hace falta. El color sale de la nota de
 * salud, así que el estante entero se lee de un vistazo.
 */
export function BoxArt({ height, className }: { height: number; className?: string }) {
  const shape = boxShape(height);
  const svgHeight = boxSvgHeight(height);

  return (
    <svg
      className={className}
      width={BOX_SVG_W}
      height={svgHeight}
      viewBox={`0 0 ${BOX_SVG_W} ${svgHeight}`}
      aria-hidden="true"
      focusable="false"
    >
      <polygon className="qc-box-shadow" points={shape.shadow} />
      <g className="qc-box-body">
        <polygon className="qc-face-left" points={shape.left} />
        <polygon className="qc-face-right" points={shape.right} />
        <polygon className="qc-face-top" points={shape.top} />
      </g>
    </svg>
  );
}

/** Fila de la ficha. Todo en `<span>`: el contenido de un `<button>` es texto. */
function PopRow({ label, value }: { label: string; value?: string }) {
  return (
    <span className="qc-pop-row">
      <span>{label}</span>
      {value ? <span className="qc-pop-value">{value}</span> : null}
    </span>
  );
}

/** Ficha flotante: aparece al pasar el mouse y al enfocar con teclado. */
function BoxPopover({ item }: { item: PantryItem }) {
  const macros = item.macros;

  return (
    <span className="qc-pop" aria-hidden="true">
      <span className="qc-pop-title">{item.name}</span>
      <span className="qc-pop-sep" />
      <PopRow label="Precio" value={formatPEN(item.spent)} />
      <PopRow label="Cantidad" value={qtyLabel(item)} />
      <PopRow label="Tienda" value={item.store ?? "sin registrar"} />
      {macros ? (
        <>
          <PopRow label="Por 100 g" value={`${Math.round(macros.kcal)} kcal`} />
          <PopRow
            label="P / C / G"
            value={`${Math.round(macros.protein_g)} · ${Math.round(macros.carbs_g)} · ${Math.round(macros.fat_g)} g`}
          />
        </>
      ) : (
        <PopRow label="Sin tabla nutricional cargada" />
      )}
      <span className="qc-pop-sep" />
      <PopRow label={whenLabel(item)} />
    </span>
  );
}

export type IsoBoxProps = {
  item: PantryItem;
  slot: Slot;
  shelfIndex: number;
  /** Orden de aparición: escalona la entrada sin volverla una coreografía. */
  order: number;
  selected: boolean;
  onSelect: (item: PantryItem) => void;
};

export function IsoBox({ item, slot, shelfIndex, order, selected, onSelect }: IsoBoxProps) {
  const height = boxHeight(item.qty);
  const anchor = boxAnchor(slot, shelfIndex, height);

  return (
    <button
      type="button"
      className="qc-box"
      data-grade={item.grade ?? undefined}
      data-selected={selected || undefined}
      aria-pressed={selected}
      aria-label={boxAriaLabel(item)}
      onClick={() => onSelect(item)}
      style={{
        left: `${anchor.x}px`,
        top: `${anchor.y}px`,
        width: `${BOX_SVG_W}px`,
        animationDelay: `${Math.min(order, 18) * 22}ms`,
      }}
    >
      <BoxArt height={height} />
      <span className="qc-box-label">{item.name}</span>
      <BoxPopover item={item} />
    </button>
  );
}
