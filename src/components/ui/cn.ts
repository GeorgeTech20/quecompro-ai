/**
 * Concatenador de clases mínimo. Reemplaza a `clsx` para no sumar dependencias:
 * el design system solo necesita filtrar falsy y unir con espacio.
 */

export type ClassValue = string | number | bigint | boolean | null | undefined;

export function cn(...values: ClassValue[]): string {
  let out = "";
  for (const value of values) {
    // Descarta falsy y también `true`, que sale de expresiones tipo `a && b`.
    if (!value || value === true) continue;
    out = out ? `${out} ${value}` : String(value);
  }
  return out;
}
