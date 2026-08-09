import { PRODUCTS, type HeroProduct } from "../hero/scene";

/* ---------------------------------------------------------------------------
   La casa: quién está conectado y con qué.

   Pareja, roomies o familia — los tres casos caben en el mismo carrito, y por
   eso el reparto son tres dispositivos distintos de tres personas distintas.

   Geometría de la órbita: todo en % del escenario, así las pastillas quedan
   colocadas en el primer paint (sin medir nada) y el mismo dato sirve para la
   órbita grande y para la miniatura de la tarjeta.
--------------------------------------------------------------------------- */

export type DeviceKind = "phone" | "laptop" | "tablet";

export type Member = {
  id: string;
  /** Cómo se le dice en la casa. */
  label: string;
  /** Nombre corto, para la miniatura. */
  short: string;
  device: DeviceKind;
  /** Grados sobre la elipse: 0 = derecha, 90 = abajo. */
  angle: number;
  tone: string;
  product: HeroProduct;
};

type Cast = Omit<Member, "product"> & { productId: string };

const CAST: readonly Cast[] = [
  {
    id: "sofi",
    label: "el celular de Sofi",
    short: "Sofi",
    device: "phone",
    angle: 218,
    tone: "#98DEEF",
    productId: "pollo",
  },
  {
    id: "marco",
    label: "la laptop de Marco",
    short: "Marco",
    device: "laptop",
    angle: 322,
    tone: "#7FC7E8",
    productId: "verduras",
  },
  {
    id: "mama",
    label: "la tablet de mamá",
    short: "mamá",
    device: "tablet",
    angle: 90,
    tone: "#E4A33C",
    productId: "leche",
  },
];

/**
 * El reparto ya cruzado con los recortes de la escena. Si algún recorte
 * desapareciera, ese miembro simplemente no sale: la órbita no se rompe.
 */
export const MEMBERS: readonly Member[] = CAST.flatMap((entry) => {
  const product = PRODUCTS.find((item) => item.id === entry.productId);
  if (!product) return [];
  const { productId: _ignored, ...rest } = entry;
  return [{ ...rest, product }];
});

/** Lo que ya estaba en el carrito antes de que llegue nadie. */
export const CART_BASE = { name: "Arroz extra 5 kg", price: 24.5 } as const;

/** Radios de la elipse, en % del escenario. */
export const ORBIT = { rx: 34, ry: 44 } as const;

export type Point = { x: number; y: number };

/** Punto de la elipse en % del escenario. */
export function orbitPoint(angle: number, rx: number = ORBIT.rx, ry: number = ORBIT.ry): Point {
  const rad = (angle * Math.PI) / 180;
  return { x: 50 + rx * Math.cos(rad), y: 50 + ry * Math.sin(rad) };
}

/**
 * Los puntos del camino. Son `<span>` colocados en %, no un SVG: un SVG
 * estirado al ancho del escenario convertiría los puntos en rayas ovaladas.
 */
export function orbitDots(count: number, rx?: number, ry?: number): (Point & { big: boolean })[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * 360;
    return { ...orbitPoint(angle, rx, ry), big: index % 9 === 0 };
  });
}
