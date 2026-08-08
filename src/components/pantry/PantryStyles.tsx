import { PANTRY_CSS } from "./pantry-css";

/**
 * Hoja de la despensa.
 *
 * Mismo truco que el `Skeleton` del design system: React 19 iza el `<style>`
 * al `<head>` y lo deduplica por `href`, así que la despensa trae su CSS sin
 * tocar `globals.css` (que es de otro agente).
 */
export function PantryStyles() {
  return (
    <style href="qc-pantry" precedence="default">
      {PANTRY_CSS}
    </style>
  );
}
