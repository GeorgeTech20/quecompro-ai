/**
 * Estado de los formularios de ajustes.
 *
 * Fuera de `actions.ts` porque un archivo `"use server"` solo puede exportar
 * funciones asíncronas.
 */

export type SettingsState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export const IDLE_STATE: SettingsState = { status: "idle" };
