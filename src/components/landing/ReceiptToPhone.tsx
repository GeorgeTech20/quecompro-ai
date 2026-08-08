"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatPEN } from "@/components/ui";

import { GRADE_COLOR, HERO, type Grade } from "./hero/scene";

/* --------------------------------------------------------------------------
   "Ese papel que perdías, ahora vive acá."

   Una boleta larga sobre papel amarillo que, al hacer scroll, se estrecha y
   entra dentro de un celular — y ahí dentro ya es la app.

   Cómo funciona, para que nadie lo rompa después:

   · El escenario es SIEMPRE del tamaño de la pantalla del celular. Lo que
     cambia es su escala: arranca ampliado (se ve como una hoja grande, el
     recorte cae fuera de vista) y baja a 1 (cabe justo en el marco).
   · El paso papel → app es un cruce de opacidad entre DOS capas alineadas,
     del mismo ancho, dentro del mismo recorte. Nada de morphs imposibles.
   · Con `prefers-reduced-motion` no hay scroll: se pinta el estado final.
   · El scroll de la página nunca se secuestra; solo se lee.
-------------------------------------------------------------------------- */

const SCREEN = { w: 286, h: 588 } as const;

/** La ventana en la que el `sticky` está pegado, dentro del 0→1 de la sección. */
const START = 0.3;
const END = 0.72;
const at = (t: number): number => START + (END - START) * t;

type Line = { label: string; detail: string; amount: number; grade: Grade; done: boolean };

/** Gastos de un mes de demostración. No son datos de nadie. */
const LINES: readonly Line[] = [
  { label: "Pollo entero", detail: "Mercado de Surquillo", amount: 15.9, grade: "B", done: true },
  { label: "Arroz extra 5 kg", detail: "Metro", amount: 24.5, grade: "B", done: true },
  { label: "Verduras del mercado", detail: "Mercado de Surquillo", amount: 12.9, grade: "A", done: true },
  { label: "Leche entera x6", detail: "Tottus", amount: 21.9, grade: "B", done: true },
  { label: "Huevos pardos 15 u", detail: "Mercado de Surquillo", amount: 11.5, grade: "A", done: true },
  { label: "Aceite vegetal 1 L", detail: "Plaza Vea", amount: 8.9, grade: "C", done: false },
  { label: "Palta fuerte 1 kg", detail: "Mercado de Surquillo", amount: 9.9, grade: "A", done: false },
  { label: "Atún en agua x3", detail: "Metro", amount: 16.2, grade: "B", done: false },
  { label: "Lentejas 1 kg", detail: "Mercado de Surquillo", amount: 6.2, grade: "A", done: false },
  { label: "Pan francés", detail: "Panadería del barrio", amount: 3.5, grade: "B", done: false },
  { label: "Queso fresco 500 g", detail: "Mercado de Surquillo", amount: 14.9, grade: "B", done: false },
  { label: "Fideos x4", detail: "Plaza Vea", amount: 12.4, grade: "C", done: false },
];

const TOTAL = LINES.reduce((acc, l) => acc + l.amount, 0);
const BUDGET = 320;

export function ReceiptToPhone() {
  const reduced = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scales, setScales] = useState({ start: 1.55, end: 1 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Ni la hoja grande desborda a lo ancho ni el celular se sale por abajo:
  // las dos escalas salen del viewport en vez de fijarse a ojo.
  useEffect(() => {
    const sync = (): void => {
      const end = Math.max(0.6, Math.min(1, (window.innerHeight - 230) / SCREEN.h));
      const start = Math.max(
        end * 1.06,
        Math.min(end * 1.7, (window.innerWidth * 0.9) / SCREEN.w),
      );
      setScales({ start, end });
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.5,
    restDelta: 0.0005,
  });

  const stageScale = useTransform(progress, [at(0), at(1)], [scales.start, scales.end]);
  const frameOpacity = useTransform(progress, [at(0.4), at(0.78)], [0, 1]);
  // El cruce va casi encadenado, no solapado: dos capas densas de texto al 50%
  // se leen como una doble exposición, no como una transición.
  const paperOpacity = useTransform(progress, [at(0.44), at(0.56)], [1, 0]);
  const appOpacity = useTransform(progress, [at(0.54), at(0.66)], [0, 1]);
  const paperY = useTransform(progress, [at(0), at(1)], [30, -170]);
  const appY = useTransform(progress, [at(0.5), at(1)], [40, -60]);
  const glowOpacity = useTransform(progress, [at(0.4), at(0.8)], [0, 1]);
  // La nota al pie entra al final: mientras el escenario está ampliado le
  // caería encima a la boleta.
  const noteOpacity = useTransform(progress, [at(0.88), at(1)], [0, 1]);

  // Sin animación se muestra el desenlace: la boleta ya vive dentro del celular.
  //
  // El cambio se aplica DESPUÉS de montar, nunca en el primer render: el
  // servidor no sabe si el visitante pidió menos movimiento, y si el markup
  // difiere React abandona la hidratación y el estado final se queda a medias.
  const still = mounted && reduced;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="boleta-titulo"
      className="relative overflow-x-clip"
      style={{ backgroundColor: HERO.paper, height: still ? undefined : "250vh" }}
    >
      <div
        className={
          still
            ? "flex w-full flex-col items-center px-4 py-16"
            : "sticky top-0 h-screen w-full overflow-hidden"
        }
      >
        <div
          className={`max-w-xl px-4 text-center ${
            still ? "mb-8" : "absolute top-[5vh] left-1/2 z-20 w-full -translate-x-1/2"
          }`}
        >
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: HERO.red }}>
            Cómo gasta tu casa
          </p>
          <h2
            id="boleta-titulo"
            className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-4xl"
            style={{ color: HERO.ink }}
          >
            Ese papel que perdías, ahora vive acá.
          </h2>
        </div>

        {/* --- El escenario: siempre del tamaño de la pantalla del celular.
            Lo que cambia es su escala; crece hacia abajo y el `sticky` lo
            recorta, que es justo lo que hace una boleta larga. ------------ */}
        <motion.div
          className={`relative shrink-0 ${
            still ? "" : "absolute left-1/2 z-10 -translate-x-1/2"
          }`}
          style={{
            width: SCREEN.w,
            height: SCREEN.h,
            top: still ? undefined : "calc(5vh + 132px)",
            scale: still ? scales.end : stageScale,
            transformOrigin: "center top",
          }}
        >
          {/* Halo del celular, aparece cuando el marco toma forma. */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[3rem]"
            style={{
              opacity: still ? 1 : glowOpacity,
              background: "radial-gradient(60% 50% at 50% 45%, rgba(20,48,74,0.22), transparent 70%)",
            }}
          />

          {/* Marco del celular. */}
          <motion.div
            aria-hidden="true"
            className="absolute -inset-[10px] rounded-[2.5rem] border-[10px]"
            style={{
              opacity: still ? 1 : frameOpacity,
              borderColor: HERO.ink,
              boxShadow: "0 30px 60px rgba(20,48,74,0.35)",
            }}
          >
            <span
              className="absolute top-[6px] left-1/2 h-[18px] w-[86px] -translate-x-1/2 rounded-full"
              style={{ backgroundColor: HERO.ink }}
            />
            <span
              className="absolute top-[74px] -right-[14px] h-[54px] w-[4px] rounded-r"
              style={{ backgroundColor: HERO.ink }}
            />
          </motion.div>

          {/* La pantalla: recorta las dos capas, que comparten ancho y sitio. */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[1.9rem]"
            style={{ backgroundColor: HERO.cream }}
          >
            <motion.div
              className="absolute inset-x-0 top-0"
              style={{ opacity: still ? 0 : paperOpacity, y: still ? 0 : paperY }}
            >
              <PaperReceipt />
            </motion.div>

            <motion.div
              className="absolute inset-x-0 top-0"
              style={{ opacity: still ? 1 : appOpacity, y: still ? 0 : appY }}
            >
              <AppScreen />
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          className={`max-w-md rounded-full px-4 py-1.5 text-center text-[11px] leading-relaxed ${
            still ? "mt-6" : "absolute bottom-[2.5vh] left-1/2 z-20 -translate-x-1/2"
          }`}
          style={{
            color: HERO.ink,
            opacity: still ? 1 : noteOpacity,
            backgroundColor: still ? "transparent" : "rgba(239,227,198,0.9)",
          }}
        >
          Gastos de un mes de demostración. La app guarda lo que compraron los dos,
          lo puntúa y avisa antes de que el presupuesto se pase.
        </motion.p>
      </div>

      {/* Bajada del papel al lienzo del resto de la landing. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ backgroundImage: `linear-gradient(${HERO.paper}, var(--color-canvas))` }}
      />
    </section>
  );
}

/* --- Capa 1: la boleta de papel ------------------------------------------ */

function PaperReceipt() {
  return (
    <div className="qc-paper px-5 pt-7 pb-10 font-mono" style={{ backgroundColor: HERO.cream }}>
      <p
        className="text-center text-[13px] font-bold tracking-[0.3em]"
        style={{ color: HERO.ink }}
      >
        QUECOMPRO
      </p>
      <p className="mt-1 text-center text-[9px] tracking-[0.14em]" style={{ color: HERO.inkSoft }}>
        CASA RAMOS-DÍAZ · JULIO
      </p>

      <div className="my-3 border-t border-dashed" style={{ borderColor: HERO.inkSoft }} />

      <ul className="space-y-[7px]">
        {LINES.map((line) => (
          <li key={line.label} className="text-[10px] leading-tight" style={{ color: HERO.ink }}>
            <div className="flex items-baseline gap-2">
              <span className="min-w-0 flex-1 truncate uppercase">{line.label}</span>
              <span
                aria-hidden="true"
                className="min-w-3 flex-1 translate-y-[-2px] border-b border-dotted"
                style={{ borderColor: HERO.inkSoft }}
              />
              <span className="shrink-0 tabular-nums">{formatPEN(line.amount)}</span>
            </div>
            <p className="text-[8px] tracking-wide" style={{ color: HERO.inkSoft }}>
              {line.detail}
            </p>
          </li>
        ))}
      </ul>

      <div className="my-3 border-t border-dashed" style={{ borderColor: HERO.inkSoft }} />

      <div
        className="flex items-baseline justify-between text-[13px] font-bold"
        style={{ color: HERO.ink }}
      >
        <span className="tracking-[0.16em]">TOTAL</span>
        <span className="tabular-nums">{formatPEN(TOTAL)}</span>
      </div>
      <p className="mt-1 text-[9px]" style={{ color: HERO.inkSoft }}>
        PRESUPUESTO {formatPEN(BUDGET)} · QUEDA {formatPEN(BUDGET - TOTAL)}
      </p>

      <p className="mt-5 text-center text-[8px] tracking-[0.2em]" style={{ color: HERO.inkSoft }}>
        ***** GRACIAS POR SU COMPRA *****
      </p>
    </div>
  );
}

/* --- Capa 2: la misma información, ya en la app --------------------------- */

function AppScreen() {
  const spent = Math.min(1, TOTAL / BUDGET);

  return (
    <div className="flex flex-col" style={{ minHeight: SCREEN.h }}>
      <header
        className="flex items-center gap-2 px-4 pt-7 pb-3"
        style={{ backgroundColor: HERO.cream }}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
          style={{ backgroundColor: HERO.red }}
        >
          QC
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold" style={{ color: HERO.ink }}>
            Casa Ramos-Díaz
          </p>
          <p className="flex items-center gap-1 text-[9px]" style={{ color: HERO.inkSoft }}>
            <span className="animate-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Sofi está viendo el carrito
          </p>
        </div>
      </header>

      <ul className="flex-1 px-3 pb-3">
        {LINES.map((line) => (
          <li
            key={line.label}
            className="flex items-center gap-2 rounded-lg px-2 py-[7px]"
            style={{ backgroundColor: line.done ? "rgba(20,48,74,0.045)" : "transparent" }}
          >
            <span
              aria-hidden="true"
              className="flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]"
              style={{
                borderColor: line.done ? HERO.red : HERO.inkSoft,
                backgroundColor: line.done ? HERO.red : "transparent",
              }}
            >
              {line.done && (
                <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]">
                  <path
                    d="M3 8.4 6.3 11.6 13 4.4"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>

            <span
              className="min-w-0 flex-1 truncate text-[11px]"
              style={{
                color: HERO.ink,
                opacity: line.done ? 0.5 : 1,
                textDecoration: line.done ? "line-through" : "none",
              }}
            >
              {line.label}
            </span>

            <span
              aria-hidden="true"
              className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] text-[8px] font-bold text-white"
              style={{ backgroundColor: GRADE_COLOR[line.grade] }}
            >
              {line.grade}
            </span>

            <span
              className="shrink-0 text-[11px] font-medium tabular-nums"
              style={{ color: HERO.ink }}
            >
              {formatPEN(line.amount)}
            </span>
          </li>
        ))}
      </ul>

      <footer
        className="border-t px-4 pt-3 pb-6"
        style={{ borderColor: "rgba(20,48,74,0.14)", backgroundColor: HERO.cream }}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] tracking-wide uppercase" style={{ color: HERO.inkSoft }}>
            Total del mes
          </span>
          <span
            className="text-[22px] leading-none font-bold tabular-nums"
            style={{ color: HERO.red }}
          >
            {formatPEN(TOTAL)}
          </span>
        </div>
        <div
          className="mt-2 h-[6px] w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "rgba(20,48,74,0.12)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${spent * 100}%`, backgroundColor: HERO.red }}
          />
        </div>
        <p className="mt-1.5 text-[9px]" style={{ color: HERO.inkSoft }}>
          {Math.round(spent * 100)}% del presupuesto de {formatPEN(BUDGET)} · quedan{" "}
          {formatPEN(BUDGET - TOTAL)}
        </p>
      </footer>
    </div>
  );
}
