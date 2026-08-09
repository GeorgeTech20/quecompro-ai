/**
 * Hoja de estilos de la despensa.
 *
 * Va como string en un módulo puro por dos razones: `globals.css` es de otro
 * agente y no se toca, y así el arnés de verificación visual usa exactamente el
 * mismo CSS que la app.
 *
 * Los tonos salen de `color-mix` sobre los tokens del design system, no de
 * hexadecimales sueltos: así el mueble se oscurece solo en modo oscuro y las
 * cajas siguen al semáforo `--color-grade-*` sin duplicar la paleta.
 */
export const PANTRY_CSS = `
.qc-pantry {
  /* Cielo del referente: celeste suave arriba, casi blanco abajo. */
  --qc-sky-top: color-mix(in oklab, var(--color-info) 17%, var(--color-surface));
  --qc-sky-bottom: color-mix(in oklab, var(--color-info) 4%, var(--color-surface));

  /* Madera del mueble: un solo tono base, que sí es del tema (en oscuro nace
     oscuro), y toda la rampa derivada con blanco y negro absolutos. Mezclar la
     sombra con la tinta sería el error: en modo oscuro la tinta es casi blanca
     y la rampa se invertiría. Luz siempre de arriba-izquierda. */
  --qc-wood: color-mix(in oklab, var(--color-warning) 48%, var(--color-surface));
  --qc-wood-top: color-mix(in oklab, var(--qc-wood) 78%, white);
  --qc-wood-right: var(--qc-wood);
  --qc-wood-left: color-mix(in oklab, var(--qc-wood) 84%, black);

  /* El interior del mueble está en sombra: es lo que lo separa del fondo y
     hace que las tablas se lean como tablas y no como bandas de color. */
  --qc-wall-a: color-mix(in oklab, var(--qc-wood) 64%, black);
  --qc-wall-b: color-mix(in oklab, var(--qc-wood) 74%, black);
  --qc-rail: color-mix(in oklab, var(--qc-wood) 92%, white);

  --qc-face: var(--color-ink-faint);
  background-image: linear-gradient(180deg, var(--qc-sky-top), var(--qc-sky-bottom));
}

/* Semáforo: una sola cara base por nota, las otras dos se derivan. Una despensa
   muy ámbar se lee de un vistazo sin leer una sola etiqueta. */
.qc-pantry [data-grade="A"] { --qc-face: var(--color-grade-a); }
.qc-pantry [data-grade="B"] { --qc-face: var(--color-grade-b); }
.qc-pantry [data-grade="C"] { --qc-face: var(--color-grade-c); }
.qc-pantry [data-grade="D"] { --qc-face: var(--color-grade-d); }

.qc-scene { position: relative; margin-inline: auto; }
.qc-scene-svg { position: absolute; inset: 0; display: block; overflow: visible; }
.qc-items { position: absolute; inset: 0; }

/* --- Mueble --- */
.qc-board-top { fill: var(--qc-wood-top); }
.qc-board-right { fill: var(--qc-wood-right); }
.qc-board-left { fill: var(--qc-wood-left); }
.qc-wall-a { fill: var(--qc-wall-a); }
.qc-wall-b { fill: var(--qc-wall-b); }
.qc-rail { fill: var(--qc-rail); }

.qc-shelf-name {
  position: absolute;
  left: 0;
  text-align: right;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}
.qc-shelf-count { display: block; font-weight: 500; text-transform: none; letter-spacing: 0; color: var(--color-ink-faint); }

.qc-shelf-empty {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 190px;
  text-align: center;
  font-size: 12px;
  line-height: 1.35;
  /* Va escrito sobre la tabla, no sobre el fondo: el tono se saca de la madera
     y no de la tinta, o en modo oscuro desaparecería. */
  color: color-mix(in oklab, var(--qc-wood) 34%, black);
  pointer-events: none;
}

/* --- Caja --- */
.qc-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  /* El botón es un rectángulo más grande que el dibujo: si capturara el ratón,
     robaría el hover de la caja de al lado. Solo pintan las caras y la etiqueta. */
  pointer-events: none;
}
.qc-box > svg { display: block; overflow: visible; }
.qc-box polygon, .qc-box .qc-box-label { pointer-events: auto; }
.qc-product-artifact {
  position: absolute;
  left: 50%;
  top: 22px;
  width: 42px;
  height: 42px;
  transform: translateX(-50%);
  color: color-mix(in oklab, var(--qc-face) 72%, black);
  pointer-events: auto;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.12);
}
.qc-box:hover, .qc-box:focus-within { z-index: 40; }

.qc-box-shadow { fill: var(--color-ink); opacity: 0.16; }
.qc-face-top { fill: color-mix(in oklab, var(--qc-face) 78%, white); }
.qc-face-right { fill: var(--qc-face); }
.qc-face-left { fill: color-mix(in oklab, var(--qc-face) 76%, black); }

.qc-box-body { transition: transform 180ms var(--ease-out-soft); }
.qc-box:hover .qc-box-body,
.qc-box:focus-visible .qc-box-body,
.qc-box[data-selected="true"] .qc-box-body { transform: translateY(-7px); }

.qc-box:focus-visible .qc-face-top,
.qc-box:focus-visible .qc-face-left,
.qc-box:focus-visible .qc-face-right,
.qc-box[data-selected="true"] .qc-face-top,
.qc-box[data-selected="true"] .qc-face-left,
.qc-box[data-selected="true"] .qc-face-right {
  stroke: var(--color-ink);
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.qc-box-label {
  max-width: 84px;
  margin-top: 3px;
  padding: 1px 6px;
  border-radius: 999px;
  /* Etiqueta de precio de góndola: papel claro con tinta oscura. Va sobre la
     tabla, así que se tinta con la madera y no con los tokens de tinta — en
     modo oscuro esos se invertirían y la etiqueta desaparecería. */
  background-color: color-mix(in oklab, var(--qc-wood) 10%, white);
  font-size: 11px;
  line-height: 1.35;
  font-weight: 500;
  color: color-mix(in oklab, var(--qc-wood) 26%, black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qc-box:focus-visible .qc-box-label {
  outline: 2px solid var(--color-brand-600);
  outline-offset: 2px;
}

/* --- Ficha al pasar el mouse o enfocar --- */
.qc-pop {
  position: absolute;
  left: 50%;
  bottom: 100%;
  z-index: 5;
  width: 196px;
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-card);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-raised);
  text-align: left;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50%) translateY(4px);
  transition: opacity 150ms var(--ease-out-soft), transform 150ms var(--ease-out-soft);
  pointer-events: none;
}
.qc-box:hover .qc-pop,
.qc-box:focus-visible .qc-pop {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.qc-pop-title { display: block; font-size: 12px; font-weight: 600; color: var(--color-ink); }
.qc-pop-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; line-height: 1.5; color: var(--color-ink-muted); }
.qc-pop-value { color: var(--color-ink); font-variant-numeric: tabular-nums; text-align: right; }
.qc-pop-sep { display: block; height: 1px; margin: 6px 0 5px; background-color: var(--color-border-subtle); }

/* --- Entrada --- */
@keyframes qc-box-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.qc-box { animation: qc-box-in 260ms var(--ease-out-soft) both; }

@media (prefers-reduced-motion: reduce) {
  .qc-box { animation: none; }
  .qc-box-body, .qc-pop { transition: none; }
}
`;
