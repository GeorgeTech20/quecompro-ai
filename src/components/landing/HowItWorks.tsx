"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentType } from "react";

import { Barcode } from "./Barcode";
import { Marquee } from "./Marquee";
import { Container, Section, SectionHead } from "./sections/Section";
import { EASE, VIEWPORT, reveal } from "./sections/theme";
import { BagIcon, BottleIcon, CanIcon, CartonIcon } from "./ShelfProducts";

/* --------------------------------------------------------------------------
   Cómo funciona, como recorrer un pasillo.

   Una góndola de verdad: vitrina iluminada, repisa con canto, productos de pie
   con su sombra de contacto y, colgando del canto, la etiqueta blanca de
   supermercado con badge, código de barras y el paso escrito.

   La vitrina mantiene su luz clara también en modo oscuro: es un objeto de la
   escena, no una superficie del design system.
-------------------------------------------------------------------------- */

const CASE = {
  light: "#FCF9F0",
  deep: "#EFE4CC",
  edge: "#DFD2B4",
  plankTop: "#E7D8B6",
  plankFace: "#C9B48C",
  ink: "#142A3A",
  inkSoft: "#526777",
  paper: "#FFFFFF",
} as const;

type Step = {
  n: number;
  badge: string;
  badgeStyle: { backgroundColor: string; color: string };
  title: string;
  body: string;
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
  code: string;
};

const STEPS: readonly Step[] = [
  {
    n: 1,
    badge: "Top 1",
    badgeStyle: { backgroundColor: "#E9342B", color: "#FFFFFF" },
    title: "Arma tu casa",
    body: "Invitas a tu pareja o a tus roomies con un link. Ponen el presupuesto del mes y qué come cada uno.",
    Icon: CartonIcon,
    iconClass: "h-28 sm:h-32",
    code: "QC-0001",
  },
  {
    n: 2,
    badge: "New!",
    badgeStyle: { backgroundColor: "#98DEEF", color: "#142A3A" },
    title: "Agrega al carrito",
    body: "Buscas el producto y lo sueltas. Aparece al toque en la pantalla del otro, sin recargar.",
    Icon: CanIcon,
    iconClass: "h-24 sm:h-28",
    code: "QC-0002",
  },
  {
    n: 3,
    badge: "Hot!",
    badgeStyle: { backgroundColor: "#E4A33C", color: "#3A2708" },
    title: "La IA reacciona en vivo",
    body: "En el mismo chat te pone la nota de salud, el precio más barato que encontró y cómo va el mes.",
    Icon: BottleIcon,
    iconClass: "h-32 sm:h-36",
    code: "QC-0003",
  },
  {
    n: 4,
    badge: "Best!",
    badgeStyle: { backgroundColor: "#C52520", color: "#FFFFFF" },
    title: "Cocinas y ahorras",
    body: "Con lo que ya tienes en la despensa te propone qué cocinar hoy. Nada se queda pudriendo en la refri.",
    Icon: BagIcon,
    iconClass: "h-24 sm:h-28",
    code: "QC-0004",
  },
];

export function HowItWorks() {
  const reduced = useReducedMotion() ?? false;

  return (
    <>
      {/* Cambio de aire entre el problema y la solución. La banda tiene borde
          propio: es un elemento con canto, no un choque de fondos. */}
      <Marquee
        words={["PRESUPUESTO", "SALUD", "PRECIO", "RECETAS", "DESPENSA", "ROOMIES"]}
        tone="green"
        seconds={54}
      />

      <Section id="como-funciona" tone="creamWarm" aria-labelledby="pasos-titulo">
        <Container className="pt-20 pb-20 sm:pt-24 lg:pt-28 lg:pb-28">
          <SectionHead
            id="pasos-titulo"
            eyebrow="Cómo funciona"
            title="Cuatro pasos, como recorrer un pasillo."
            titleClassName="max-w-[18ch]"
          />

          {/* --- Vitrina ---------------------------------------------------- */}
          <motion.div
            {...reveal(0, reduced)}
            className="relative mt-12 overflow-hidden rounded-[24px] border lg:mt-16"
            style={{
              background: `linear-gradient(180deg, ${CASE.light} 0%, ${CASE.deep} 100%)`,
              borderColor: CASE.edge,
              boxShadow: "var(--qc-shadow)",
            }}
          >
            {/* Luz de góndola: un halo suave desde arriba. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-40"
              style={{
                background:
                  "radial-gradient(70% 100% at 50% 0%, rgba(255,255,255,0.9), rgba(255,255,255,0))",
              }}
            />

            <ol className="relative grid grid-cols-1 pt-10 pb-8 sm:grid-cols-2 sm:pt-14 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.n} className="qc-bay flex flex-col">
                  {/* Producto de pie sobre la repisa. */}
                  <div className="relative flex h-40 items-end justify-center px-4 sm:h-48">
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[3px] h-2 w-24 rounded-[50%]"
                      style={{ backgroundColor: "rgba(20,42,58,0.22)", filter: "blur(4px)" }}
                    />
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.55, delay: index * 0.09, ease: EASE }}
                      className="relative"
                    >
                      <step.Icon className={`w-auto ${step.iconClass}`} />
                    </motion.div>
                  </div>

                  {/* Canto de la repisa. Sin gap entre celdas, así la tabla se
                      lee como una sola tabla corrida de lado a lado. */}
                  <div
                    aria-hidden="true"
                    className="relative h-3.5 w-full"
                    style={{
                      background: `linear-gradient(180deg, ${CASE.plankTop} 0 45%, ${CASE.plankFace} 45% 100%)`,
                      boxShadow: "0 8px 14px rgba(20,42,58,0.16)",
                    }}
                  />

                  {/* Etiqueta de precio colgando del canto. */}
                  <div className="px-3 pt-7 pb-2 sm:px-4">
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: -14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VIEWPORT}
                      transition={{ duration: 0.5, delay: 0.16 + index * 0.09, ease: EASE }}
                    >
                      <div
                        className="qc-tag rounded-[10px] p-4"
                        data-tilt={index % 4}
                        style={{
                          backgroundColor: CASE.paper,
                          boxShadow: "0 1px 0 rgba(20,42,58,0.12), 0 10px 22px rgba(20,42,58,0.14)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[11px] font-semibold tracking-[0.14em] uppercase tabular-nums"
                            style={{ color: CASE.inkSoft }}
                          >
                            Paso {step.n}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={step.badgeStyle}
                          >
                            {step.badge}
                          </span>
                        </div>

                        <h3
                          className="mt-2.5 text-[17px] leading-tight font-semibold tracking-[-0.01em]"
                          style={{ color: CASE.ink }}
                        >
                          {step.title}
                        </h3>
                        <p
                          className="mt-2 text-[13px] leading-relaxed"
                          style={{ color: CASE.inkSoft }}
                        >
                          {step.body}
                        </p>

                        <div
                          className="mt-5 border-t pt-3"
                          style={{ borderColor: "rgba(20,42,58,0.12)" }}
                        >
                          <Barcode color={CASE.ink} opacity={0.7} />
                          <p
                            className="mt-1.5 text-[9px] tracking-[0.22em] uppercase"
                            style={{ color: CASE.inkSoft }}
                          >
                            {step.code}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
