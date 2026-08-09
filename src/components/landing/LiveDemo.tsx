"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LiveDot, Money } from "@/components/ui";

import { GRADE_COLOR } from "./hero/scene";
import { EdgeBand } from "./Marquee";
import { Container, Section, SectionHead } from "./sections/Section";
import { EASE } from "./sections/theme";

/* --------------------------------------------------------------------------
   El momento que vende el producto, sin video: dos pantallas del mismo hogar
   sobre el verde profundo, como en la referencia r6.

   Marco agrega pollo en su celular y en la laptop de Sofi aparece solo, el
   total late y la IA contesta en el mismo canal. En bucle.

   Las dos pantallas son objetos iluminados: llevan colores fijos y no siguen
   el tema, igual que una captura. Lo que cambia con el tema es el fondo.
-------------------------------------------------------------------------- */

/** Paleta de las pantallas. Fija: es una recreación de la app, no una superficie. */
const UI = {
  screen: "#F7F4EC",
  paper: "#FFFFFF",
  chrome: "#E9E2D2",
  ink: "#142A3A",
  inkSoft: "#526777",
  line: "rgba(20,42,58,0.14)",
  green: "#E9342B",
  greenSoft: "#FDE9E7",
  lime: "#98DEEF",
  bezel: "#102431",
} as const;

const BASE_ITEMS = [
  { name: "Arroz extra 5 kg", price: 24.5 },
  { name: "Leche evaporada x6", price: 21.9 },
  { name: "Huevos pardos 15 u", price: 11.5 },
  { name: "Aceite vegetal 1 L", price: 8.9 },
  { name: "Palta fuerte 1 kg", price: 9.9 },
] as const;

const NEW_ITEM = { name: "Pollo entero", price: 12.9, store: "Metro" };
const SWAP = { store: "Tottus", price: 11.5, savings: 1.4 };

const BASE_TOTAL = BASE_ITEMS.reduce((acc, item) => acc + item.price, 0);
const NEW_TOTAL = BASE_TOTAL + NEW_ITEM.price;

/** Duración de cada paso del bucle, en ms. El último es el respiro final. */
const STEP_MS = [1100, 650, 900, 1200, 1500, 2400];
const LAST_STEP = STEP_MS.length - 1;

export function LiveDemo() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Fuera de pantalla el bucle se detiene: nadie lo está mirando.
  const inView = useInView(rootRef, { amount: 0.15 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sin animación: se muestra el desenlace, que es lo que hay que entender.
    if (reduced) {
      setStep(LAST_STEP);
      return;
    }
    if (!inView) return;
    const id = window.setTimeout(
      () => setStep((current) => (current + 1) % STEP_MS.length),
      STEP_MS[step],
    );
    return () => window.clearTimeout(id);
  }, [step, reduced, inView]);

  const pressed = step >= 1;
  const added = step >= 2;
  const showVerdict = step >= 3;
  const showSwap = step >= 4;

  return (
    <Section id="en-vivo" tone="green" fadeFrom="var(--qc-cream-warm)" aria-labelledby="vivo-titulo">
      <EdgeBand
        words={["EN VIVO", "AL TOQUE", "MISMO CANAL"]}
        className="left-1 hidden w-10 xl:flex"
      />

      <Container className="pt-20 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
        <SectionHead
          id="vivo-titulo"
          onGreen
          eyebrow="En vivo"
          title="Uno agrega. El otro lo ve. La IA contesta en el mismo canal."
          titleClassName="max-w-[20ch]"
          lead="No hay una pestaña de chatbot aparte: el asistente es un participante más del carrito, como tu roomie."
        />

        <div
          ref={rootRef}
          className="mt-12 grid items-center gap-8 lg:mt-16 lg:grid-cols-[minmax(0,286px)_72px_minmax(0,1fr)] lg:gap-0"
        >
          {/* --- Celular de Marco ------------------------------------------ */}
          <Phone pressed={pressed} added={added} reduced={reduced} />

          {/* --- El salto entre pantallas ---------------------------------- */}
          <div aria-hidden="true" className="relative hidden h-px lg:block">
            <div
              className="absolute inset-x-2 top-1/2 h-px"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--qc-on-green-line) 0 6px, transparent 6px 12px)",
              }}
            />
            <motion.span
              className="absolute top-1/2 left-2 h-2 w-2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: UI.lime }}
              animate={
                reduced
                  ? { x: 26, opacity: 1 }
                  : added
                    ? { x: [0, 52], opacity: [0, 1, 1, 0] }
                    : { x: 0, opacity: 0 }
              }
              transition={{ duration: 0.9, ease: EASE }}
            />
          </div>

          {/* --- Laptop de Sofi -------------------------------------------- */}
          <Browser
            added={added}
            showVerdict={showVerdict}
            showSwap={showSwap}
            reduced={reduced}
          />
        </div>

        <p
          className="mt-8 max-w-xl text-xs leading-relaxed"
          style={{ color: "var(--qc-on-green-soft)" }}
        >
          Recreación de la app. Los precios son datos de demostración del mercado
          peruano, no precios oficiales de ninguna cadena.
        </p>
      </Container>
    </Section>
  );
}

/* --- Celular -------------------------------------------------------------- */

function Phone({
  pressed,
  added,
  reduced,
}: {
  pressed: boolean;
  added: boolean;
  reduced: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[286px]">
      <div
        className="rounded-[38px] p-[7px]"
        style={{
          backgroundColor: UI.bezel,
          boxShadow: "0 26px 60px rgba(3,20,15,0.45), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[31px]"
          style={{ backgroundColor: UI.screen, color: UI.ink }}
        >
          {/* Barra de estado */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[10px] font-semibold tabular-nums">9:41</span>
            <span
              aria-hidden="true"
              className="absolute left-1/2 h-[18px] w-[74px] -translate-x-1/2 rounded-full"
              style={{ backgroundColor: UI.bezel, top: 6 }}
            />
            <span className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="h-2 w-4 rounded-[2px]"
                style={{ backgroundColor: UI.ink, opacity: 0.65 }}
              />
            </span>
          </div>

          <div className="px-4 pt-5 pb-6">
            <p
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: UI.inkSoft }}
            >
              Buscar producto
            </p>

            <div
              className="mt-3 rounded-[14px] p-3"
              style={{ backgroundColor: UI.paper, boxShadow: "0 1px 3px rgba(20,42,58,0.10)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-lg"
                  style={{ backgroundColor: UI.greenSoft }}
                >
                  🍗
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{NEW_ITEM.name}</p>
                  <p className="text-[11px]" style={{ color: UI.inkSoft }}>
                    {NEW_ITEM.store} · 1 unidad
                  </p>
                </div>
                <Money
                  value={NEW_ITEM.price}
                  className="ml-auto text-[15px] font-bold"
                />
              </div>

              <motion.div
                animate={reduced ? undefined : { scale: pressed && !added ? 0.97 : 1 }}
                transition={{ duration: 0.16, ease: EASE }}
                className="mt-4 flex h-11 items-center justify-center rounded-full text-[13px] font-semibold"
                style={{
                  backgroundColor: added ? UI.greenSoft : UI.green,
                  color: added ? UI.green : "#FFFFFF",
                }}
              >
                {added ? "Agregado al carrito" : "Agregar al carrito"}
              </motion.div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed" style={{ color: UI.inkSoft }}>
              Marco está en el mercado, con una mano en el celular.
            </p>
          </div>
        </div>
      </div>

      <p
        className="mt-4 text-center text-xs font-medium lg:text-left"
        style={{ color: "var(--qc-on-green-soft)" }}
      >
        Marco · celular
      </p>
    </div>
  );
}

/* --- Laptop --------------------------------------------------------------- */

function Browser({
  added,
  showVerdict,
  showSwap,
  reduced,
}: {
  added: boolean;
  showVerdict: boolean;
  showSwap: boolean;
  reduced: boolean;
}) {
  return (
    <div className="w-full">
      <div
        className="overflow-hidden rounded-[18px]"
        style={{
          backgroundColor: UI.paper,
          color: UI.ink,
          boxShadow: "0 26px 60px rgba(3,20,15,0.45)",
        }}
      >
        {/* Cromo del navegador */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ backgroundColor: UI.chrome, borderBottom: `1px solid ${UI.line}` }}
        >
          <span aria-hidden="true" className="flex shrink-0 gap-1.5">
            {["#E4756B", "#E4B45C", "#8DC08A"].map((color) => (
              <span
                key={color}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span
            className="flex h-6 min-w-0 flex-1 items-center rounded-full px-3 text-[11px]"
            style={{ backgroundColor: UI.paper, color: UI.inkSoft }}
          >
            <span className="truncate">app.quecompro.app/carrito</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Dot name="S" color={UI.green} />
            <Dot name="M" color="#C4622F" />
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold">Carrito de la casa</p>
            <span
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: UI.inkSoft }}
            >
              <LiveDot size="sm" label="Sofi y Marco están conectados" />2 conectados
            </span>
          </div>

          <ul className="mt-3">
            <AnimatePresence initial={false}>
              {added && (
                <motion.li
                  key="nuevo"
                  initial={reduced ? false : { opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.34, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2.5"
                    style={{ backgroundColor: UI.greenSoft }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: UI.green }}
                    />
                    <span className="truncate text-[13px] font-semibold">{NEW_ITEM.name}</span>
                    <span
                      className="hidden text-[11px] sm:inline"
                      style={{ color: UI.inkSoft }}
                    >
                      lo agregó Marco
                    </span>
                    <Money value={NEW_ITEM.price} className="ml-auto text-[13px] font-bold" />
                  </div>
                </motion.li>
              )}
            </AnimatePresence>

            {BASE_ITEMS.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-3 px-2.5 py-2.5"
                style={{ borderTop: `1px solid ${UI.line}` }}
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: UI.line }}
                />
                <span className="truncate text-[13px]" style={{ color: UI.inkSoft }}>
                  {item.name}
                </span>
                <Money
                  value={item.price}
                  className="ml-auto text-[13px]"
                  style={{ color: UI.inkSoft }}
                />
              </li>
            ))}
          </ul>

          <div
            className="mt-1 flex items-center justify-between px-2.5 pt-4"
            style={{ borderTop: `1px solid ${UI.line}` }}
          >
            <span className="text-[13px]" style={{ color: UI.inkSoft }}>
              Total del carrito
            </span>
            <Money
              value={added ? NEW_TOTAL : BASE_TOTAL}
              pulse={!reduced}
              className="text-2xl font-bold tracking-tight"
            />
          </div>

          {/* El chat del carrito: la IA es un participante más. */}
          <div className="mt-5 space-y-2">
            <p
              className="text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{ color: UI.inkSoft }}
            >
              Chat del carrito
            </p>

            <AnimatePresence initial={false}>
              {showVerdict && (
                <Bubble key="veredicto" reduced={reduced}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: GRADE_COLOR.A }}
                      aria-label="Salud: A, muy buena"
                    >
                      A
                    </span>
                    <span className="text-[13px] font-semibold">{NEW_ITEM.name}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: UI.inkSoft }}>
                    Proteína limpia, sin ultraprocesar. Te alcanza para tres comidas
                    de la semana.
                  </p>
                </Bubble>
              )}

              {showSwap && (
                <Bubble key="swap" reduced={reduced}>
                  <p className="text-[12.5px] leading-relaxed">
                    Más barato en <strong className="font-semibold">{SWAP.store}</strong>:{" "}
                    <Money value={SWAP.price} className="font-semibold" />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: UI.lime, color: UI.green }}
                    >
                      ahorras S/&nbsp;{SWAP.savings.toFixed(2)}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ borderColor: UI.green, color: UI.green }}
                    >
                      Cambiar
                    </span>
                  </div>
                </Bubble>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p
        className="mt-4 text-center text-xs font-medium lg:text-left"
        style={{ color: "var(--qc-on-green-soft)" }}
      >
        Sofi · laptop
      </p>
    </div>
  );
}

function Bubble({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="flex items-start gap-2.5"
    >
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ backgroundColor: UI.green, color: "#FFFFFF" }}
      >
        IA
      </span>
      <div
        className="min-w-0 flex-1 rounded-[14px] rounded-tl-sm p-3"
        style={{ backgroundColor: UI.screen, border: `1px solid ${UI.line}` }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Dot({ name, color }: { name: string; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name}
    </span>
  );
}
