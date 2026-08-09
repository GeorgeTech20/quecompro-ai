"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue, type Transition } from "motion/react";
import type { CSSProperties } from "react";

import { formatPEN } from "@/components/ui";

import { BLUR } from "./blurs";
import { PriceTag } from "./PriceTag";
import {
  HERO,
  MAX_CART_SCALE,
  ORBITS,
  type CartBox,
  type HeroProduct,
  type Slot,
  type Stage,
} from "./scene";

/* --------------------------------------------------------------------------
   Un recorte de comida flotando alrededor del carrito.

   Cuatro capas, cada una con un único trabajo — así ninguna pelea con otra
   por el mismo `transform`:

     ancla      posición en % del escenario (funciona en SSR, sin JS)
      └ parallax   desplazamiento suave con el mouse (MotionValue compartido)
         └ transporte  el vuelo al carrito (springs) + encogido + rotación
            └ órbita     la deriva lenta (animación CSS, pausable de verdad)

   El vuelo usa springs DISTINTOS en X y en Y: la X llega antes que la Y, así
   que el recorte describe una curva en vez de una recta, sale con impulso y
   frena al entrar. Es el mismo truco que en Remotion, portado a motion/react.
-------------------------------------------------------------------------- */

/** Un solo sistema de movimiento para toda la escena. */
const FLIGHT: Transition = {
  x: { type: "spring", stiffness: 150, damping: 21, mass: 1 },
  y: { type: "spring", stiffness: 94, damping: 13.5, mass: 1.15 },
  scale: { type: "spring", stiffness: 210, damping: 24, mass: 0.9 },
  rotate: { type: "spring", stiffness: 120, damping: 16, mass: 1 },
};

const INSTANT: Transition = { duration: 0 };

/** Variables CSS tipadas: sin `any` y sin castear el objeto de estilo. */
type StageVars = CSSProperties & Record<`--${string}`, string>;

export type FloatingProductProps = {
  product: HeroProduct;
  picked: boolean;
  /** Sitio asignado dentro de la canasta, o `null` si sigue en órbita. */
  slot: Slot | null;
  stage: Stage;
  cart: CartBox;
  /** Parallax normalizado del escenario, −1 … 1. */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  reduced: boolean;
  /** Las órbitas se congelan fuera del viewport y con la pestaña oculta. */
  orbiting: boolean;
  onToggle: (id: string) => void;
};

export function FloatingProduct({
  product,
  picked,
  slot,
  stage,
  cart,
  pointerX,
  pointerY,
  reduced,
  orbiting,
  onToggle,
}: FloatingProductProps) {
  const orbit = ORBITS[product.orbit];
  const anchor = stage.wide ? product.wide : (product.narrow ?? product.wide);

  // El parallax es un desplazamiento chico y proporcional a la profundidad:
  // lo de adelante se mueve más que lo del fondo.
  const parallaxX = useTransform(pointerX, (v) => v * 26 * product.depth);
  const parallaxY = useTransform(pointerY, (v) => v * 16 * product.depth);

  // Ancla y destino, ambos en píxeles del escenario. El destino se aplica como
  // delta sobre el ancla: solo `transform`, nunca `left`/`top`.
  const anchorX = (stage.w * anchor.ax) / 100;
  const anchorY = (stage.h * anchor.ay) / 100;
  const freeWidth = (stage.w * anchor.span) / 100;

  const landed = picked && slot !== null && freeWidth > 0;
  // El hueco de la canasta se respeta en los dos ejes: encajar solo por el
  // ancho deja la caja de leche asomando media canasta por encima.
  const freeHeight = (freeWidth * product.px.h) / product.px.w;
  const flight = landed
    ? {
        x: slot.x - anchorX,
        y: slot.y - anchorY,
        scale: Math.min(
          (cart.w * slot.span) / freeWidth,
          (cart.h * slot.spanH) / freeHeight,
          MAX_CART_SCALE,
        ),
        rotate: slot.rotate,
      }
    : { x: 0, y: 0, scale: 1, rotate: 0 };

  // Lo último que cae queda al frente; en órbita manda la profundidad.
  const zIndex = picked && slot ? 30 + slot.depth : 20 + Math.round(product.depth * 6);

  const style: StageVars = {
    "--ax": `${product.wide.ax}%`,
    "--ay": `${product.wide.ay}%`,
    "--span": `${product.wide.span}%`,
    "--ax-n": `${product.narrow?.ax ?? product.wide.ax}%`,
    "--ay-n": `${product.narrow?.ay ?? product.wide.ay}%`,
    "--span-n": `${product.narrow?.span ?? product.wide.span}%`,
    zIndex,
    transform: "translate(-50%, -50%)",
  };

  const label = picked
    ? `Quitar ${product.name} del carrito`
    : `Agregar ${product.name}, ${formatPEN(product.price)}`;

  return (
    <li
      style={style}
      className={`absolute top-[var(--ay-n)] left-[var(--ax-n)] w-[var(--span-n)] md:top-[var(--ay)] md:left-[var(--ax)] md:w-[var(--span)] ${
        product.narrow === null ? "hidden md:block" : ""
      }`}
    >
      <motion.div style={{ x: parallaxX, y: parallaxY }}>
        <motion.div
          animate={flight}
          transition={
            reduced ? INSTANT : { ...FLIGHT, delay: landed ? (slot?.depth ?? 0) * 0.035 : 0 }
          }
        >
          <div
            className="qc-orbit relative"
            style={{
              animationDuration: `${orbit.duration}s`,
              animationDelay: `${orbit.delay}s`,
              animationDirection: orbit.reverse ? "reverse" : "normal",
              // Congelar en sitio (no cortar) evita el salto al recoger.
              animationPlayState: orbiting && !picked ? "running" : "paused",
            }}
          >
            <button
              type="button"
              aria-pressed={picked}
              aria-label={label}
              onClick={() => onToggle(product.id)}
              className="qc-pick block w-full cursor-pointer rounded-xl transition-transform duration-200 ease-out hover:scale-[1.06] focus-visible:outline-[3px] focus-visible:outline-offset-4 active:scale-[0.97]"
              style={{ outlineColor: HERO.ink }}
            >
              <span className="qc-cut block" style={{ transform: `rotate(${product.tilt}deg)` }}>
                <Image
                  src={product.src}
                  alt=""
                  width={product.px.w}
                  height={product.px.h}
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR[product.src as keyof typeof BLUR] ?? undefined}
                  draggable={false}
                  sizes="(max-width: 767px) 30vw, 16vw"
                  className="h-auto w-full select-none"
                />
              </span>
            </button>

            {/* Etiqueta de góndola: se va cuando el producto entra al carrito. */}
            <motion.div
              aria-hidden="true"
              animate={{ opacity: picked ? 0 : 1, y: picked ? 8 : 0 }}
              transition={reduced ? INSTANT : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute top-full left-1/2 -mt-1 -translate-x-1/2"
            >
              <PriceTag
                name={product.name}
                price={product.price}
                unit={product.unit}
                grade={product.grade}
                tilt={-product.tilt * 0.45}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </li>
  );
}
