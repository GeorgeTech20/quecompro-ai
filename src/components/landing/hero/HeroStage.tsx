"use client";

import Image from "next/image";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { CartArt } from "./CartArt";
import { FloatingProduct } from "./FloatingProduct";
import { ShoppingList } from "./ShoppingList";
import { TotalCard } from "./TotalCard";
import {
  cartBox,
  slotsFor,
  suggestionFor,
  HERO,
  PRODUCTS,
  type Stage,
} from "./scene";

/* --------------------------------------------------------------------------
   El escenario: carrito al centro, recortes en órbita alrededor, la lista de
   papel a un lado y la boleta al otro.

   Tocar un recorte lo manda al carrito; tocarlo otra vez lo devuelve. Todo lo
   demás (la lista que se marca, el total que late, el chip de la IA) cuelga
   de un solo estado: qué hay dentro del carrito.
-------------------------------------------------------------------------- */

/** Sin animación mostramos la escena ya contada, no una pantalla a medias. */
const REDUCED_PICK = ["pollo", "cebolla", "verduras"] as const;

export type HeroStageProps = {
  /**
   * Ruta de la foto cenital del carrito, resuelta en el servidor con
   * `fs.existsSync`. Si es `null` se dibuja el carrito en SVG: la escena
   * nunca se queda sin su pieza central.
   */
  cartSrc: string | null;
};

export function HeroStage({ cartSrc }: HeroStageProps) {
  const reduced = useReducedMotion() ?? false;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [picked, setPicked] = useState<readonly string[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [wide, setWide] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const inView = useInView(rootRef, { amount: 0.05 });

  /* --- medidas ---------------------------------------------------------- */

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setBox({ w: Math.round(rect.width), h: Math.round(rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // El breakpoint se lee del viewport, no del escenario: así coincide exacto
  // con el `md:` de Tailwind que coloca las anclas.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = (): void => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Pestaña oculta = ni un frame de órbita.
  useEffect(() => {
    const sync = (): void => setTabVisible(!document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (reduced) setPicked(REDUCED_PICK);
  }, [reduced]);

  /* --- parallax --------------------------------------------------------- */

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 90, damping: 20, mass: 0.6 });
  const pointerY = useSpring(rawY, { stiffness: 90, damping: 20, mass: 0.6 });

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reduced || event.pointerType !== "mouse") return;
      const rect = event.currentTarget.getBoundingClientRect();
      rawX.set((event.clientX - rect.left) / rect.width - 0.5);
      rawY.set((event.clientY - rect.top) / rect.height - 0.5);
    },
    [reduced, rawX, rawY],
  );

  const onPointerLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  /* --- estado derivado --------------------------------------------------- */

  const stage: Stage = useMemo(() => ({ w: box.w, h: box.h, wide }), [box.w, box.h, wide]);
  const cart = useMemo(() => cartBox(stage), [stage]);

  const slotByProduct = useMemo(() => {
    const slots = slotsFor(picked.length, cart);
    return new Map(picked.map((id, i) => [id, slots[i]]));
  }, [picked, cart]);

  const pickedProducts = useMemo(
    () =>
      picked
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is (typeof PRODUCTS)[number] => p !== undefined),
    [picked],
  );

  const total = pickedProducts.reduce((acc, p) => acc + p.price, 0);
  const suggestion = suggestionFor(pickedProducts);

  const toggle = useCallback((id: string) => {
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }, []);

  const clear = useCallback(() => setPicked([]), []);

  const orbiting = inView && tabVisible && !reduced;

  return (
    <div ref={rootRef} className="relative">
      <div className="md:relative">
        <div
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative z-0 mt-4 aspect-[1/1.35] w-full md:mt-2 md:aspect-[16/9]"
        >
          {/* --- El carrito, visto en picado, como si lo empujaras tú ------ */}
          <div
            className="absolute top-[51%] left-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2 md:top-[55.5%] md:w-[27%]"
            style={{ zIndex: 10 }}
          >
            <div className="relative aspect-[495/601] w-full">
              {cartSrc ? (
                <Image
                  src={cartSrc}
                  alt="Carrito de compras visto desde arriba"
                  fill
                  priority
                  sizes="(max-width: 767px) 50vw, 30vw"
                  className="object-contain select-none"
                  style={{ filter: "drop-shadow(0 26px 34px rgba(20,48,74,0.3))" }}
                />
              ) : (
                <CartArt className="h-full w-full" />
              )}
            </div>
          </div>

          {/* --- Los recortes en órbita ------------------------------------ */}
          <ul className="contents">
            {PRODUCTS.map((product) => (
              <FloatingProduct
                key={product.id}
                product={product}
                picked={picked.includes(product.id)}
                slot={slotByProduct.get(product.id) ?? null}
                stage={stage}
                cart={cart}
                pointerX={pointerX}
                pointerY={pointerY}
                reduced={reduced}
                orbiting={orbiting}
                onToggle={toggle}
              />
            ))}
          </ul>
        </div>

        {/* --- Pista de interacción, solo con el carrito vacío -------------
            En ancho cabe al pie de la escena, bajo el carrito; en angosto
            ahí chocaría con la última etiqueta, así que va en el flujo. */}
        {picked.length === 0 && (
          <p
            className="qc-in mx-auto mt-4 w-fit rounded-full px-3 py-1 text-center text-[11px] font-medium whitespace-nowrap md:absolute md:bottom-[1%] md:left-1/2 md:mt-0 md:-translate-x-1/2 md:text-xs"
            style={{
              zIndex: 41,
              backgroundColor: HERO.cream,
              color: HERO.ink,
              boxShadow: "0 8px 20px rgba(20,48,74,0.2)",
              animationDelay: "700ms",
            }}
          >
            Toca un producto y míralo caer al carrito
          </p>
        )}

        {/* En pantalla ancha estos dos papeles flanquean la escena; en angosta
            bajan al flujo normal, debajo del carrito. */}
        <div className="mt-5 grid gap-3 md:contents">
          <ShoppingList
            items={PRODUCTS}
            picked={picked}
            reduced={reduced}
            className="md:absolute md:top-[2%] md:left-0 md:z-40 md:w-[17.5%] md:-rotate-[2.5deg]"
          />
          <TotalCard
            total={total}
            count={picked.length}
            suggestion={suggestion}
            reduced={reduced}
            onClear={clear}
            className="md:absolute md:top-[2%] md:right-0 md:z-40 md:w-[18%] md:rotate-[2deg]"
          />
        </div>
      </div>

      {/* Lo que pasa en la escena, para quien no la ve. */}
      <p aria-live="polite" className="sr-only">
        {picked.length === 0
          ? "El carrito está vacío."
          : `${picked.length} producto${picked.length === 1 ? "" : "s"} en el carrito.`}
      </p>
    </div>
  );
}
