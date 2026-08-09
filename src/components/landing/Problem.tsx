"use client";

import { motion, useReducedMotion } from "motion/react";

import { Container, Section, SectionHead } from "./sections/Section";
import { SECTION, reveal } from "./sections/theme";

/* --------------------------------------------------------------------------
   El problema. Primera sección del mundo crema: acá aterriza la bajada de
   color desde el papel de la boleta.

   Cuatro tarjetas con el número gigante al fondo. La tercera —la del mes que
   se va— va invertida en verde profundo: es la que duele y además adelanta el
   color al que baja la página.
-------------------------------------------------------------------------- */

type Item = {
  n: string;
  title: string;
  body: string;
  invert: boolean;
};

const PROBLEMS: readonly Item[] = [
  {
    n: "01",
    title: "Se pierde la boleta.",
    body: "Compraste, pagaste, y a los tres días nadie sabe cuánto fue. El mes se arma solo, sin que nadie lo mire.",
    invert: false,
  },
  {
    n: "02",
    title: "Compran dos veces lo mismo.",
    body: "Tú traes el arroz, tu roomie trae el arroz. Ahora hay diez kilos de arroz y falta el aceite.",
    invert: false,
  },
  {
    n: "03",
    title: "El mes se va sin saber en qué.",
    body: "No fue un gasto grande: fueron treinta chiquitos. Para cuando te das cuenta, ya no queda nada.",
    invert: true,
  },
  {
    n: "04",
    title: "Nadie coordina.",
    body: "La lista está en un chat, en un papel de la refri y en la cabeza de alguien. Nunca en el mismo sitio.",
    invert: false,
  },
];

export function Problem() {
  const reduced = useReducedMotion() ?? false;

  return (
    <Section
      id="problema"
      tone="cream"
      fadeFrom={SECTION.paper}
      fadeHeight="clamp(96px, 16vw, 220px)"
      aria-labelledby="problema-titulo"
    >
      <Container className="pt-24 pb-20 sm:pt-32 lg:pt-40 lg:pb-28">
        <SectionHead
          id="problema-titulo"
          eyebrow="El problema"
          title={
            <>
              Vivir con alguien no complica la comida.{" "}
              <span style={{ color: "var(--qc-green)" }}>Complica la plata.</span>
            </>
          }
          titleClassName="max-w-[24ch]"
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {PROBLEMS.map((item, index) => (
            <motion.li
              key={item.n}
              {...reveal(index, reduced)}
              className="relative flex min-h-[15rem] flex-col justify-end overflow-hidden rounded-[20px] border p-6 sm:min-h-[17rem] lg:p-7"
              style={{
                backgroundColor: item.invert ? "var(--qc-green)" : "var(--qc-card)",
                borderColor: item.invert ? "transparent" : "var(--qc-line-soft)",
                color: item.invert ? "var(--qc-on-green)" : "var(--qc-ink)",
                boxShadow: item.invert ? "var(--qc-shadow)" : "none",
              }}
            >
              <span
                aria-hidden="true"
                className="qc-serif pointer-events-none absolute -top-6 -right-1 text-[8.5rem] leading-none tracking-tighter select-none"
                style={{
                  color: item.invert ? "var(--qc-lime)" : "var(--qc-green)",
                  opacity: item.invert ? 0.22 : 0.11,
                }}
              >
                {item.n}
              </span>

              <h3 className="relative text-[17px] leading-snug font-semibold tracking-[-0.01em]">
                {item.title}
              </h3>
              <p
                className="relative mt-2.5 text-sm leading-relaxed"
                style={{
                  color: item.invert ? "var(--qc-on-green-soft)" : "var(--qc-ink-soft)",
                }}
              >
                {item.body}
              </p>
            </motion.li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
