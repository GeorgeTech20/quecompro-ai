/**
 * Estado del formulario de invitación.
 *
 * Fuera de `actions.ts` porque un archivo `"use server"` solo puede exportar
 * funciones asíncronas.
 */

export type JoinState = { status: "idle" | "error"; message?: string };

export const JOIN_IDLE: JoinState = { status: "idle" };
