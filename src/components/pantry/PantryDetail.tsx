"use client";

import { pricePer100g, unitLabel } from "@/components/shell/format";
import { Badge, Button, formatPEN, HealthChip, Money } from "@/components/ui";

import { qtyLabel, whenLabel } from "./labels";
import type { PantryItem } from "./types";

/**
 * Detalle de un producto de la despensa. El mismo contenido se usa en el panel
 * lateral del escritorio y dentro del `Modal` del móvil.
 */

export type PantryDetailProps = {
  item: PantryItem;
  /** Cuántas recetas de la fila de arriba usan este producto. */
  recipeCount: number;
  rebuying: boolean;
  onCook: (item: PantryItem) => void;
  onRebuy: (item: PantryItem) => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="text-right text-sm text-ink tabular-nums">{value}</dd>
    </div>
  );
}

export function PantryDetail({ item, recipeCount, rebuying, onCook, onRebuy }: PantryDetailProps) {
  const per100 = pricePer100g(item.unitPrice, item.unit);
  const macros = item.macros;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base leading-snug font-semibold text-ink">{item.name}</p>
          {item.grade ? <HealthChip grade={item.grade} size="sm" showLabel={false} /> : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral" size="sm">
            {item.categoryLabel}
          </Badge>
          {item.inCart ? (
            <Badge tone="brand" size="sm">
              en el carrito
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-ink-faint">{whenLabel(item)}</p>
      </div>

      <dl className="divide-y divide-border-subtle border-y border-border-subtle">
        <Row label="Lo que costó" value={<Money value={item.spent} className="font-semibold" />} />
        <Row label="Precio" value={`${formatPEN(item.unitPrice)} / ${unitLabel(item.unit)}`} />
        <Row label="Cantidad" value={qtyLabel(item)} />
        <Row label="Tienda" value={item.store ?? "sin registrar"} />
        {per100 !== null ? <Row label="Por 100 g" value={formatPEN(per100)} /> : null}
      </dl>

      <div>
        <p className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          Macros por 100 g
        </p>
        {macros ? (
          <dl className="grid grid-cols-2 gap-x-4">
            <Row label="Calorías" value={`${Math.round(macros.kcal)} kcal`} />
            <Row label="Proteína" value={`${Math.round(macros.protein_g)} g`} />
            <Row label="Carbohidratos" value={`${Math.round(macros.carbs_g)} g`} />
            <Row label="Grasa" value={`${Math.round(macros.fat_g)} g`} />
            <Row label="Fibra" value={`${Math.round(macros.fiber_g)} g`} />
            <Row label="Sodio" value={`${Math.round(macros.sodium_mg)} mg`} />
          </dl>
        ) : (
          <p className="text-sm text-ink-faint">
            Este producto no tiene tabla nutricional cargada todavía.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          disabled={recipeCount === 0}
          onClick={() => onCook(item)}
        >
          {recipeCount === 0
            ? "Ninguna receta lo usa todavía"
            : `Cocinar con esto (${recipeCount})`}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          loading={rebuying}
          disabled={item.productId === null}
          onClick={() => onRebuy(item)}
        >
          Volver a comprar
        </Button>
        {item.productId === null ? (
          <p className="text-xs text-ink-faint">
            Esta línea se anotó a mano y no está en el catálogo, así que no se puede volver a pedir
            desde acá.
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Lo que se ve en el panel lateral mientras no hay nada elegido. */
export function PantryDetailPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span aria-hidden="true" className="text-2xl">
        🫙
      </span>
      <p className="text-sm font-semibold text-ink">Toca algo de la despensa</p>
      <p className="text-sm leading-relaxed text-ink-muted">
        Cada caja guarda su precio, su tienda, sus macros y cuándo entró a la casa.
      </p>
    </div>
  );
}
