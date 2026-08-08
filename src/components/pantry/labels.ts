import { formatDateLong, HEALTH_WORDS, unitLabel } from "@/components/shell/format";
import { formatPEN } from "@/components/ui";

import type { PantryItem } from "./types";

/** Textos compartidos por la isometría, la lista y el panel de detalle. */

/** "comprado el 5 de agosto" / "en el carrito, todavía sin comprar". */
export function whenLabel(item: PantryItem): string {
  if (item.inCart && !item.boughtAtIso) return "en el carrito, todavía sin comprar";
  if (!item.boughtAtIso) return "sin fecha de compra";
  return `comprado el ${formatDateLong(new Date(item.boughtAtIso))}`;
}

export function qtyLabel(item: PantryItem): string {
  const qty = Number.isInteger(item.qty) ? item.qty : Math.round(item.qty * 100) / 100;
  const unit = unitLabel(item.unit);
  // `unitLabel` solo traduce las unidades que conoce ("kg" → "kilo"); las que
  // devuelve tal cual son símbolos ("g", "ml") y esos no llevan plural.
  const plural = qty === 1 || unit.length <= 3 ? unit : `${unit}s`;
  return `${qty} ${plural}`;
}

export function gradeLabel(item: PantryItem): string {
  return item.grade ? `salud ${item.grade} — ${HEALTH_WORDS[item.grade]}` : "sin nota de salud";
}

/**
 * La etiqueta que oye quien navega con lector de pantalla. La isometría es
 * presentación: toda la información vive acá.
 */
export function boxAriaLabel(item: PantryItem): string {
  return [
    item.name,
    gradeLabel(item),
    formatPEN(item.spent),
    qtyLabel(item),
    whenLabel(item),
  ].join(", ");
}
