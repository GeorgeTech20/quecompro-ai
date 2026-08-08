/**
 * Estado compartido del alta.
 *
 * Vive fuera de `actions.ts` porque un archivo `"use server"` solo puede
 * exportar funciones asíncronas: una constante ahí rompe el build de Next.
 */

export type OnboardingState = { status: "idle" | "error"; message?: string };

export const IDLE: OnboardingState = { status: "idle" };

/** Sugerencia por defecto: la compra mensual típica de dos personas en Lima. */
export const DEFAULT_BUDGET = 1200;
