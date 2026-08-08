/**
 * Treemap "squarified" mínimo (Bruls, Huizing & van Wijk, 2000).
 *
 * Lo usa el canvas del hero: los productos que caen en la canasta se acomodan
 * como bloques cuya área es proporcional a lo que cuestan. Es el único cálculo
 * de layout que necesita el hero, así que vive aquí y no depende de nada.
 */

export type Rect = { x: number; y: number; w: number; h: number };

/** Peor relación de aspecto de una fila candidata. Menor = más cuadrado. */
function worstRatio(maxArea: number, minArea: number, sum: number, side: number): number {
  const s2 = sum * sum;
  const side2 = side * side;
  return Math.max((side2 * maxArea) / s2, s2 / (side2 * minArea));
}

/**
 * Reparte `rect` entre `values` (mismo orden de entrada, mismo largo de salida).
 * Conviene pasar los valores ordenados de mayor a menor: el algoritmo asume esa
 * monotonía para tomar el máximo y el mínimo de cada fila en O(1).
 */
export function squarify(values: readonly number[], rect: Rect): Rect[] {
  const out: Rect[] = values.map(() => ({ x: rect.x, y: rect.y, w: 0, h: 0 }));
  const total = values.reduce((acc, v) => acc + Math.max(v, 0), 0);
  if (total <= 0 || rect.w <= 0 || rect.h <= 0) return out;

  // Normalizamos los valores a unidades de área del rectángulo disponible.
  const scale = (rect.w * rect.h) / total;
  const areas = values.map((v) => Math.max(v, 0) * scale);

  const free: Rect = { ...rect };
  let i = 0;

  while (i < areas.length) {
    const side = Math.min(free.w, free.h);
    if (side <= 0) break;

    // 1. Crecemos la fila mientras mejore (baje) la peor relación de aspecto.
    let sum = 0;
    let count = 0;
    let best = Number.POSITIVE_INFINITY;
    while (i + count < areas.length) {
      const nextSum = sum + areas[i + count];
      if (nextSum <= 0) {
        count++;
        continue;
      }
      const ratio = worstRatio(areas[i], areas[i + count], nextSum, side);
      if (count > 0 && ratio > best) break;
      best = ratio;
      sum = nextSum;
      count++;
    }
    if (count === 0) break;

    // 2. Colocamos la fila contra el lado corto y recortamos el espacio libre.
    const along = free.w >= free.h; // franja vertical a la izquierda
    const thickness = sum / side;
    let cursor = along ? free.y : free.x;

    for (let k = 0; k < count; k++) {
      const area = areas[i + k];
      const length = sum > 0 ? (area / sum) * side : 0;
      out[i + k] = along
        ? { x: free.x, y: cursor, w: thickness, h: length }
        : { x: cursor, y: free.y, w: length, h: thickness };
      cursor += length;
    }

    if (along) {
      free.x += thickness;
      free.w -= thickness;
    } else {
      free.y += thickness;
      free.h -= thickness;
    }
    i += count;
  }

  return out;
}
