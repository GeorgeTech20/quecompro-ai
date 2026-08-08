import "server-only";

/**
 * Utilidades internas de `src/lib/data`. No se exportan al resto de la app.
 *
 * `supabaseAdmin()` usa la service role key y salta RLS: **cada consulta de
 * este directorio tiene que filtrar por household a mano**. Si una función
 * recibe un `householdId`, va en el `.eq()`, siempre, incluso en los DELETE.
 */

type QueryResult = { data: unknown; error: { message: string } | null };

/** Convierte el `{ data, error }` de PostgREST en dato o excepción. */
export function unwrap<T>(result: QueryResult, context: string): T {
  if (result.error) {
    throw new Error(`[data:${context}] ${result.error.message}`);
  }
  return result.data as T;
}

/** Igual que `unwrap`, pero devuelve `[]` en vez de null. */
export function unwrapRows<T>(result: QueryResult, context: string): T[] {
  return unwrap<T[] | null>(result, context) ?? [];
}

/** Soles con dos decimales: evita que el total muestre 34.300000000000004. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Escapa los comodines de LIKE para que el usuario no los inyecte sin querer. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Quita duplicados y valores vacíos de una lista de ids. */
export function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))];
}
