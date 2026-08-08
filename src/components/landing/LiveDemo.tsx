"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Avatar, Badge, HealthChip, LiveDot, Money } from "@/components/ui";

/* --------------------------------------------------------------------------
   El momento que vende el producto, sin video: dos pantallas del mismo hogar.
   Marco agrega pollo en su celular y en la laptop de Sofi aparece solo, el
   total late y la IA responde en el mismo canal. En bucle.
-------------------------------------------------------------------------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
const STEP_MS = [1100, 650, 900, 1200, 1500, 2200];
const LAST_STEP = STEP_MS.length - 1;

export function LiveDemo() {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLElement | null>(null);
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
    <section
      id="en-vivo"
      ref={rootRef}
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-brand-600 text-sm font-medium">En vivo</p>
        <h2 className="text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Uno agrega. El otro lo ve. La IA contesta en el mismo canal.
        </h2>
        <p className="text-ink-muted mt-4 text-base leading-relaxed">
          No hay una pestaña de chatbot aparte: el asistente es un participante
          más del carrito, como tu roomie.
        </p>
      </div>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        {/* --- Pantalla de Marco: el celular ------------------------------ */}
        <Panel person="Marco Díaz" short="Marco" device="celular">
          <div className="rounded-card border-border-subtle bg-surface-sunken border p-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="bg-brand-100 border-brand-200 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-xl"
              >
                🍗
              </span>
              <div className="min-w-0">
                <p className="text-ink truncate text-sm font-medium">{NEW_ITEM.name}</p>
                <p className="text-ink-faint text-xs">{NEW_ITEM.store} · 1 unidad</p>
              </div>
              <Money
                value={NEW_ITEM.price}
                className="text-ink ml-auto text-base font-semibold"
              />
            </div>

            <motion.div
              animate={reduced ? undefined : { scale: pressed && !added ? 0.97 : 1 }}
              transition={{ duration: 0.16, ease: EASE }}
              className={`rounded-control mt-4 flex h-11 items-center justify-center text-sm font-medium transition-colors ${
                added
                  ? "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200"
                  : "bg-brand-600 text-white"
              }`}
            >
              {added ? "Agregado al carrito" : "Agregar al carrito"}
            </motion.div>
          </div>

          <p className="text-ink-faint mt-4 text-xs">
            Marco está en el mercado, con una mano en el celular.
          </p>
        </Panel>

        {/* --- Pantalla de Sofi: la laptop -------------------------------- */}
        <Panel person="Sofía Ramos" short="Sofi" device="laptop" live>
          <ul className="divide-border-subtle divide-y">
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
                  <div className="bg-brand-50 dark:bg-brand-900/30 flex items-center gap-3 rounded-lg px-2 py-3">
                    <span
                      aria-hidden="true"
                      className="bg-brand-600 h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    <span className="text-ink truncate text-sm font-medium">
                      {NEW_ITEM.name}
                    </span>
                    <span className="text-ink-faint hidden text-xs sm:inline">
                      lo agregó Marco
                    </span>
                    <Money
                      value={NEW_ITEM.price}
                      className="text-ink ml-auto text-sm font-semibold"
                    />
                  </div>
                </motion.li>
              )}
            </AnimatePresence>

            {BASE_ITEMS.map((item) => (
              <li key={item.name} className="flex items-center gap-3 px-2 py-3">
                <span
                  aria-hidden="true"
                  className="bg-border-strong h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span className="text-ink-muted truncate text-sm">{item.name}</span>
                <Money value={item.price} className="text-ink-muted ml-auto text-sm" />
              </li>
            ))}
          </ul>

          <div className="border-border-subtle mt-1 flex items-center justify-between border-t px-2 pt-4">
            <span className="text-ink-muted text-sm">Total del carrito</span>
            <Money
              value={added ? NEW_TOTAL : BASE_TOTAL}
              pulse={!reduced}
              className="text-ink text-2xl font-semibold"
            />
          </div>

          <div className="mt-4 space-y-2">
            <AnimatePresence initial={false}>
              {showVerdict && (
                <motion.div
                  key="veredicto"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="rounded-card border-border-subtle bg-surface-sunken flex items-start gap-3 border p-3"
                >
                  <span
                    aria-hidden="true"
                    className="bg-brand-600 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  >
                    IA
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <HealthChip grade="A" size="sm" />
                      <span className="text-ink text-sm font-medium">
                        {NEW_ITEM.name}
                      </span>
                    </div>
                    <p className="text-ink-muted mt-1 text-sm leading-relaxed">
                      Proteína limpia, sin ultraprocesar. Te alcanza para tres
                      comidas de la semana.
                    </p>
                  </div>
                </motion.div>
              )}

              {showSwap && (
                <motion.div
                  key="swap"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  className="rounded-card border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/30 flex flex-wrap items-center gap-x-3 gap-y-2 border p-3"
                >
                  <span className="text-ink text-sm">
                    Más barato en{" "}
                    <span className="font-semibold">{SWAP.store}</span>{" "}
                    <Money value={SWAP.price} className="font-semibold" />
                  </span>
                  <Badge tone="brand" size="sm">
                    ahorras S/&nbsp;{SWAP.savings.toFixed(2)}
                  </Badge>
                  <span className="border-brand-600 text-brand-700 dark:text-brand-300 rounded-control ml-auto border px-3 py-1 text-xs font-medium">
                    Cambiar
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </div>

      <p className="text-ink-faint mt-6 text-xs">
        Recreación de la app. Los precios son datos de demostración, no precios
        oficiales de ninguna cadena.
      </p>
    </section>
  );
}

function Panel({
  person,
  short,
  device,
  live = false,
  children,
}: {
  person: string;
  short: string;
  device: string;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-sheet border-border-subtle bg-surface shadow-card border p-4 sm:p-5">
      <div className="border-border-subtle mb-4 flex items-center gap-2 border-b pb-3">
        <Avatar name={person} size="xs" />
        <p className="text-ink text-sm font-medium">{short}</p>
        <span className="text-ink-faint text-xs">· {device}</span>
        {live && (
          <span className="text-ink-muted ml-auto flex items-center gap-1.5 text-xs">
            <LiveDot size="sm" label="Sofi está conectada" />
            en vivo
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
