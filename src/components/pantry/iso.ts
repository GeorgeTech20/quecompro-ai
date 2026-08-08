/**
 * Geometría del mueble isométrico de la despensa.
 *
 * Módulo puro y sin imports a propósito: los mismos números los usan el
 * componente React y el arnés de verificación visual, así que lo que se mira en
 * una captura es exactamente lo que se pinta en la app.
 *
 * Proyección: un paso en +col avanza (CELL_X, CELL_Y) en pantalla y uno en +row
 * avanza (−CELL_X, CELL_Y). Es la isometría de videojuego del referente, un
 * poco aplanada (2.3:1 en vez de 2:1) por una razón práctica: en isometría la
 * tabla de un estante "baja" tanto en pantalla como mide de fondo, así que
 * cuanto más plana la proyección, menos alto hay que separar los estantes para
 * que la tabla de arriba no tape lo que hay abajo.
 */

// --- Rejilla ---------------------------------------------------------------

export const CELL_X = 88;
export const CELL_Y = 38;

/** 6 huecos por estante: 3 de ancho × 2 de fondo. */
export const COLS = 3;
export const ROWS = 2;
export const SLOTS_PER_SHELF = COLS * ROWS;

/** Cuánto sobresale la tabla más allá de los huecos, en celdas. */
const MARGIN = 0.42;

const C0 = -MARGIN;
const C1 = COLS - 1 + MARGIN;
const R0 = -MARGIN;
const R1 = ROWS - 1 + MARGIN;

// --- Escena ----------------------------------------------------------------

export const SHELF_COUNT = 4;
export const BOARD_THICKNESS = 13;
/** Zócalo extra del estante de abajo: hace que el mueble se apoye en el suelo. */
export const PLINTH = 10;

/**
 * Separación vertical entre estantes. No es un número estético: en isometría
 * una tabla "baja" en pantalla tanto como mide de fondo, así que si los
 * estantes se juntan, el de arriba tapa las cajas del de abajo. 166 es el
 * mínimo para que no se toquen nunca.
 */
export const SHELF_GAP = 166;

/** Aire sobre el estante de arriba: la carcasa asoma por encima. */
const SCENE_TOP = 84;

/** Franja izquierda donde va el nombre de cada estante. */
export const GUTTER = 88;

export const ORIGIN_X = Math.round(GUTTER + (R1 - C0) * CELL_X);
export const SCENE_W = Math.round(ORIGIN_X + (C1 - R0) * CELL_X);

export function shelfOriginY(index: number): number {
  return SCENE_TOP + index * SHELF_GAP;
}

export const SCENE_H = Math.round(
  shelfOriginY(SHELF_COUNT - 1) + (C1 + R1) * CELL_Y + BOARD_THICKNESS + PLINTH + 12,
);

// --- Proyección ------------------------------------------------------------

export type Point = { x: number; y: number };

/** Rejilla (col, row) del estante `shelf` → píxeles de la escena. */
export function project(col: number, row: number, shelf: number): Point {
  return {
    x: ORIGIN_X + (col - row) * CELL_X,
    y: shelfOriginY(shelf) + (col + row) * CELL_Y,
  };
}

function points(list: readonly Point[]): string {
  return list.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

// --- Huecos ----------------------------------------------------------------

export type Slot = { col: number; row: number };

/**
 * Los huecos en orden de pintado: de atrás hacia adelante (col+row creciente).
 * Como el orden del DOM es el orden de pintado, una caja de adelante siempre
 * tapa a la de atrás sin necesidad de `z-index`.
 */
export const SLOTS: Slot[] = Array.from({ length: SLOTS_PER_SHELF }, (_, index) => ({
  col: index % COLS,
  row: Math.floor(index / COLS),
})).sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col);

export function slotPoint(slot: Slot, shelf: number): Point {
  return project(slot.col, slot.row, shelf);
}

/** Centro de la tabla: ahí va el mensaje de estante vacío. */
export function boardCenter(shelf: number): Point {
  return project((C0 + C1) / 2, (R0 + R1) / 2, shelf);
}

/** Esquina izquierda de la tabla: a esa altura se alinea el nombre del estante. */
export function boardLeftCorner(shelf: number): Point {
  return project(C0, R1, shelf);
}

// --- Tablas ----------------------------------------------------------------

export type BoardShape = { top: string; left: string; right: string };

/**
 * Las tres caras de una tabla: el rombo de arriba y los dos cantos que se ven
 * (el que mira abajo-izquierda y el que mira abajo-derecha).
 */
export function boardShape(shelf: number, thickness: number): BoardShape {
  const back = project(C0, R0, shelf);
  const right = project(C1, R0, shelf);
  const front = project(C1, R1, shelf);
  const left = project(C0, R1, shelf);

  const down = (p: Point): Point => ({ x: p.x, y: p.y + thickness });

  return {
    top: points([back, right, front, left]),
    left: points([left, front, down(front), down(left)]),
    right: points([front, right, down(right), down(front)]),
  };
}

export function boardThicknessFor(shelf: number): number {
  return shelf === SHELF_COUNT - 1 ? BOARD_THICKNESS + PLINTH : BOARD_THICKNESS;
}

// --- Carcasa ---------------------------------------------------------------

/** Cuánto asoma la carcasa por encima del estante de arriba. */
const WALL_HEAD = 46;

export type CabinetShell = {
  /** Panel del fondo-derecha (arista back→right). */
  wallA: string;
  /** Panel del fondo-izquierda (arista back→left). */
  wallB: string;
  railA: string;
  railB: string;
};

export function cabinetShell(): CabinetShell {
  const top = shelfOriginY(0) - WALL_HEAD;
  const bottom = shelfOriginY(SHELF_COUNT - 1) + boardThicknessFor(SHELF_COUNT - 1);

  // Aristas del rombo medidas desde el origen de un estante cualquiera; luego
  // se reubican a la altura de la carcasa.
  const base = shelfOriginY(0);
  const at = (p: Point, y: number): Point => ({ x: p.x, y: p.y - base + y });

  const back = project(C0, R0, 0);
  const right = project(C1, R0, 0);
  const left = project(C0, R1, 0);

  const rail = 11;

  return {
    wallA: points([at(back, top), at(right, top), at(right, bottom), at(back, bottom)]),
    wallB: points([at(back, top), at(left, top), at(left, bottom), at(back, bottom)]),
    railA: points([at(back, top), at(right, top), at(right, top + rail), at(back, top + rail)]),
    railB: points([at(back, top), at(left, top), at(left, top + rail), at(back, top + rail)]),
  };
}

// --- Cajas -----------------------------------------------------------------

export const BOX_HALF_W = 32;
export const BOX_HALF_H = 14;
export const BOX_H_MIN = 18;
export const BOX_H_MAX = 28;
/** Aire alrededor del dibujo: la sombra sobresale del rombo de la base. */
const BOX_PAD = 5;
/** Desplazamiento de la sombra respecto de la base. */
const SHADOW_DROP = 2;

export const BOX_SVG_W = 2 * (BOX_HALF_W + BOX_PAD);

/** Más unidades compradas, caja más alta. Se nota sin necesidad de leer nada. */
export function boxHeight(qty: number): number {
  const extra = Math.min(BOX_H_MAX - BOX_H_MIN, Math.max(0, (qty - 1) * 2.5));
  return Math.round(BOX_H_MIN + extra);
}

export function boxSvgHeight(height: number): number {
  return height + 2 * BOX_HALF_H + 2 * BOX_PAD + SHADOW_DROP;
}

/** Y local del centro del rombo de la base dentro del SVG de la caja. */
export function boxBaseCy(height: number): number {
  return boxSvgHeight(height) - BOX_PAD - BOX_HALF_H - SHADOW_DROP;
}

export type BoxShape = { top: string; left: string; right: string; shadow: string };

export function boxShape(height: number): BoxShape {
  const cx = BOX_SVG_W / 2;
  const cy = boxBaseCy(height);

  const rhombus = (centerY: number, halfW: number, halfH: number): Point[] => [
    { x: cx, y: centerY - halfH },
    { x: cx + halfW, y: centerY },
    { x: cx, y: centerY + halfH },
    { x: cx - halfW, y: centerY },
  ];

  const base = rhombus(cy, BOX_HALF_W, BOX_HALF_H);
  const lid = rhombus(cy - height, BOX_HALF_W, BOX_HALF_H);

  return {
    shadow: points(rhombus(cy + SHADOW_DROP, BOX_HALF_W + 4, BOX_HALF_H + 2)),
    top: points(lid),
    // Cara que mira abajo-izquierda: arista left→front del rombo.
    left: points([lid[3]!, lid[2]!, base[2]!, base[3]!]),
    // Cara que mira abajo-derecha: arista front→right.
    right: points([lid[2]!, lid[1]!, base[1]!, base[2]!]),
  };
}

/** Esquina superior izquierda del botón para que la caja caiga en su hueco. */
export function boxAnchor(slot: Slot, shelf: number, height: number): Point {
  const p = slotPoint(slot, shelf);
  return { x: p.x - BOX_SVG_W / 2, y: p.y - boxBaseCy(height) };
}
