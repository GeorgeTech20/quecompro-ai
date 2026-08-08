import "server-only";

/**
 * Punto único de entrada del data layer. Todo lo que sale de aquí corre en
 * servidor con la service role key: ninguna función asume RLS, así que quien
 * llame tiene que haber validado la membresía (`isMember`) antes de pasar un
 * `householdId`.
 */

export * from "./cart";
export * from "./households";
export * from "./prices";
export * from "./products";
export * from "./recipes";
export * from "./spend";
