/* ---------------------------------------------------------------------------
   Escenografía del hero: paleta, productos y geometría del carrito.

   El hero es una ESCENA, no una superficie del design system: mantiene su
   fondo celeste en claro y en oscuro, así que su paleta vive aquí y no en
   `globals.css`. Todo lo demás de la landing sigue usando los tokens.

   Sistema de coordenadas
   ----------------------
   Las anclas van en % del escenario (funcionan sin JS, en el primer paint y
   en SSR). Los destinos del vuelo se calculan en píxeles a partir del tamaño
   medido y se aplican como `x`/`y` sobre el ancla: solo `transform`, nunca
   `left`/`top`.
--------------------------------------------------------------------------- */

/** Paleta de la escena. Fija: la infografía no cambia con el tema. */
export const HERO = {
  sky: "#AEDCEC",
  skyHigh: "#C6E7F3",
  skyDeep: "#8CC7DE",
  red: "#E4322B",
  cream: "#F7F1E6",
  creamEdge: "#E3D8C4",
  ink: "#14304A",
  inkSoft: "#4A6B84",
  paper: "#EFE3C6",
} as const;

export type Grade = "A" | "B" | "C";

/** Semáforo nutricional en color fijo: va impreso sobre papel crema. */
export const GRADE_COLOR: Record<Grade, string> = {
  A: "#16A34A",
  B: "#84CC16",
  C: "#E08A16",
};

/** Ancla de un recorte: centro en % del escenario y ancho en % del mismo. */
export type Anchor = { ax: number; ay: number; span: number };

export type HeroProduct = {
  id: string;
  src: string;
  /** Tamaño intrínseco del recorte optimizado: `next/image` lo necesita. */
  px: { w: number; h: number };
  name: string;
  /** Nombre corto para la sugerencia de la IA. */
  short: string;
  unit: string;
  price: number;
  grade: Grade;
  /** Colocación en el escenario ancho (≥ 768 px). */
  wide: Anchor;
  /** Colocación en el escenario angosto. Sin esto el recorte no sale en móvil. */
  narrow: Anchor | null;
  /** Inclinación en reposo, en grados. */
  tilt: number;
  /** 0 = pegado al fondo, 1 = al frente. Manda en el parallax. */
  depth: number;
  /** Variante de órbita (duración/desfase/sentido). Ver ORBITS. */
  orbit: 0 | 1 | 2 | 3;
  /** Si es el ingrediente principal, qué se cocina con él. */
  dish: { name: string; minutes: number; rank: number } | null;
};

/**
 * Precios aproximados del mercado peruano 2026. Son **datos de demostración**,
 * no precios oficiales de ninguna cadena — y la landing lo dice en pantalla.
 */
export const PRODUCTS: readonly HeroProduct[] = [
  {
    id: "platano",
    src: "/hero/food/opt/01.png",
    px: { w: 760, h: 573 },
    name: "Plátano de seda",
    short: "plátano",
    unit: "1 kg",
    price: 4.5,
    grade: "A",
    wide: { ax: 41, ay: 11, span: 12 },
    narrow: { ax: 23, ay: 10, span: 26 },
    tilt: -7,
    depth: 0.95,
    orbit: 0,
    dish: null,
  },
  {
    id: "verduras",
    src: "/hero/food/opt/02.png",
    px: { w: 760, h: 624 },
    name: "Verduras del mercado",
    short: "verduras",
    unit: "bolsa",
    price: 12.9,
    grade: "A",
    wide: { ax: 72, ay: 21, span: 14 },
    narrow: { ax: 77, ay: 12, span: 29 },
    tilt: 5,
    depth: 0.85,
    orbit: 1,
    dish: { name: "menestra con verduras", minutes: 35, rank: 3 },
  },
  {
    id: "pollo",
    src: "/hero/food/opt/03.png",
    px: { w: 442, h: 596 },
    name: "Pollo entero",
    short: "pollo",
    unit: "1 kg",
    price: 15.9,
    grade: "B",
    wide: { ax: 10, ay: 68, span: 10.5 },
    narrow: { ax: 13, ay: 45, span: 21 },
    tilt: 6,
    depth: 0.7,
    orbit: 2,
    dish: { name: "saltado de pollo", minutes: 30, rank: 1 },
  },
  {
    id: "manzana",
    src: "/hero/food/opt/04.png",
    px: { w: 760, h: 561 },
    name: "Manzana Israel",
    short: "manzana",
    unit: "1 kg",
    price: 6.9,
    grade: "A",
    wide: { ax: 26, ay: 22, span: 12.5 },
    narrow: null,
    tilt: 8,
    depth: 0.85,
    orbit: 3,
    dish: null,
  },
  {
    id: "leche",
    src: "/hero/food/opt/06.png",
    px: { w: 385, h: 760 },
    name: "Leche entera",
    short: "leche",
    unit: "1 L",
    price: 4.8,
    grade: "B",
    wide: { ax: 25.5, ay: 80, span: 6 },
    narrow: null,
    tilt: -8,
    depth: 1,
    orbit: 1,
    dish: { name: "crema de verduras", minutes: 20, rank: 4 },
  },
  {
    id: "res",
    src: "/hero/food/opt/07.png",
    px: { w: 494, h: 599 },
    name: "Bife de res",
    short: "res",
    unit: "pack x4",
    price: 38.9,
    grade: "C",
    wide: { ax: 89, ay: 52, span: 11.2 },
    narrow: { ax: 87, ay: 46, span: 22 },
    tilt: 4,
    depth: 0.7,
    orbit: 0,
    dish: { name: "lomo saltado", minutes: 25, rank: 2 },
  },
  {
    id: "sandia",
    src: "/hero/food/opt/08.png",
    px: { w: 736, h: 760 },
    name: "Sandía",
    short: "sandía",
    unit: "1 unidad",
    price: 9.5,
    grade: "A",
    wide: { ax: 86, ay: 82, span: 12 },
    narrow: null,
    tilt: -4,
    depth: 1,
    orbit: 2,
    dish: null,
  },
  {
    id: "cebolla",
    src: "/hero/food/opt/10.png",
    px: { w: 291, h: 261 },
    name: "Cebolla en malla",
    short: "cebolla",
    unit: "1 kg",
    price: 5.2,
    grade: "A",
    wide: { ax: 57, ay: 12, span: 10 },
    narrow: { ax: 24, ay: 82, span: 20 },
    tilt: -5,
    depth: 0.9,
    orbit: 3,
    dish: null,
  },
];

/**
 * Un solo sistema de movimiento para todas las órbitas: el mismo keyframe,
 * lo único que cambia es duración, desfase y sentido. Tres easings distintos
 * en la misma escena se leen como "roto" aunque cada uno se vea bien solo.
 */
export const ORBITS = [
  { duration: 13, delay: -0, reverse: false },
  { duration: 16.5, delay: -5.5, reverse: true },
  { duration: 11.5, delay: -3, reverse: false },
  { duration: 18.5, delay: -8.5, reverse: true },
] as const;

/* --- Carrito -------------------------------------------------------------- */

/** Proporción del recorte cenital del carrito (495 × 601). */
export const CART_RATIO = 495 / 601;

/** Ancho del carrito en % del escenario, por breakpoint. */
export const CART_SPAN = { wide: 27, narrow: 50 } as const;
/** Centro del carrito en % del escenario. */
export const CART_CENTER = { wide: { x: 50, y: 55.5 }, narrow: { x: 50, y: 51 } } as const;

/**
 * Interior útil de la canasta, en coordenadas normalizadas de la foto del
 * carrito. Medido sobre `09.png`: por debajo del asiento abatible y por
 * encima de los manubrios rojos.
 */
const BASKET = { x0: 0.19, x1: 0.81, y0: 0.18, y1: 0.62 } as const;

export type Stage = { w: number; h: number; wide: boolean };

export type CartBox = { cx: number; cy: number; w: number; h: number };

export function cartBox(stage: Stage): CartBox {
  const span = stage.wide ? CART_SPAN.wide : CART_SPAN.narrow;
  const center = stage.wide ? CART_CENTER.wide : CART_CENTER.narrow;
  const w = (stage.w * span) / 100;
  return {
    cx: (stage.w * center.x) / 100,
    cy: (stage.h * center.y) / 100,
    w,
    h: w / CART_RATIO,
  };
}

/**
 * Sitio de un producto ya recogido.
 *
 * `x`/`y` van en píxeles del escenario; `span`/`spanH` son el hueco disponible
 * como fracción del ancho y del alto del carrito. Hacen falta los dos: una
 * caja de leche y una sandía tienen proporciones opuestas, y encajarlas solo
 * por el ancho deja la leche asomando por encima de la canasta.
 */
export type Slot = {
  x: number;
  y: number;
  span: number;
  spanH: number;
  rotate: number;
  depth: number;
};

/** Entrar al carrito siempre encoge: nada crece al caer dentro. */
export const MAX_CART_SCALE = 0.92;

/** Ruido determinista: mismo resultado en servidor y cliente, sin Math.random. */
function jitter(seed: number, spread: number): number {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return (n - Math.floor(n) - 0.5) * spread;
}

/**
 * Reparte `count` productos dentro de la canasta.
 *
 * El layout depende del total, no del índice: por eso al entrar el quinto
 * todos se reacomodan y encogen para hacerle sitio en vez de amontonarse.
 * Las filas se llenan de lejos hacia cerca, y el z-index sube con el índice,
 * así lo último que cae queda al frente.
 */
export function slotsFor(count: number, cart: CartBox): Slot[] {
  if (count <= 0) return [];
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const span = [0.5, 0.39, 0.29][cols - 1];
  // Un pelo más alto que la fila: las cosas apiladas se solapan un poco, que
  // es justo como se ven en una canasta de verdad.
  const spanH = ((BASKET.y1 - BASKET.y0) / rows) * 1.1;

  const out: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const col = i - row * cols;
    // La última fila puede ir incompleta: se centra sola.
    const u = (col + 0.5) / inRow;
    const v = (row + 0.5) / rows;

    const nx = BASKET.x0 + u * (BASKET.x1 - BASKET.x0);
    const ny = BASKET.y0 + v * (BASKET.y1 - BASKET.y0);

    out.push({
      x: cart.cx + cart.w * (nx - 0.5) + jitter(i + 1, cart.w * 0.03),
      y: cart.cy + cart.h * (ny - 0.5) + jitter(i + 7, cart.h * 0.02),
      span,
      spanH,
      rotate: jitter(i + 13, 16),
      depth: i,
    });
  }
  return out;
}

/* --- Sugerencia de la IA -------------------------------------------------- */

const GRADE_VALUE: Record<Grade, number> = { A: 1, B: 2, C: 3 };
const GRADE_LETTER: readonly Grade[] = ["A", "B", "C"];

export type Suggestion = { grade: Grade; text: string };

/**
 * El gancho del producto dentro del propio hero: con tres cosas en el carrito
 * la IA ya tiene con qué opinar. Es una sugerencia de demostración, calculada
 * de lo que el visitante recogió — no un texto fijo.
 */
export function suggestionFor(picked: readonly HeroProduct[]): Suggestion | null {
  if (picked.length < 3) return null;
  const last = picked.slice(-3);

  const avg = last.reduce((acc, p) => acc + GRADE_VALUE[p.grade], 0) / last.length;
  const grade = GRADE_LETTER[Math.min(2, Math.round(avg) - 1)] ?? "B";

  const main = [...picked]
    .filter((p) => p.dish !== null)
    .sort((a, b) => (a.dish?.rank ?? 99) - (b.dish?.rank ?? 99))[0];
  const dish = main?.dish ?? { name: "ensalada fresca", minutes: 10, rank: 9 };

  const names = last.map((p) => p.short).join(" + ");
  return { grade, text: `${names} = ${dish.name} en ${dish.minutes} min` };
}
