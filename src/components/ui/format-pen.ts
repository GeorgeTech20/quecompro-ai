/**
 * Formateo de soles, sin `"use client"` a propósito.
 *
 * Vivía dentro de `Money.tsx`, que es un client component. Next marca todo lo
 * exportado desde un módulo cliente como referencia de cliente, así que un
 * server component que llamara `formatPEN()` reventaba en tiempo de ejecución
 * ("Attempted to call formatPEN() from the server"). Al vivir en un módulo
 * neutral, el mismo formateador sirve en servidor y en cliente — que es lo que
 * hace falta para que un precio se vea igual en los dos lados.
 */

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PEN_ROUND = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

/** `S/ 12.90`. Único formateador de soles de la app. */
export function formatPEN(value: number, options?: { round?: boolean }): string {
  return options?.round ? PEN_ROUND.format(value) : PEN.format(value);
}
