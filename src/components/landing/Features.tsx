"use client";

import { motion, useReducedMotion } from "motion/react";

import { Container, Section, SectionHead } from "./sections/Section";
import { reveal } from "./sections/theme";

/* --------------------------------------------------------------------------
   Qué hace la IA. Cuatro tarjetas editoriales al estilo de r6: crema, serif y
   un símbolo gigante por tarjeta. La de ahorro va invertida en verde profundo
   porque es la que habla de plata, y de paso enlaza con el footer.
-------------------------------------------------------------------------- */

type Feature = {
  glyph: string;
  sub: string;
  label: string;
  title: string;
  body: string;
  invert: boolean;
};

const FEATURES: readonly Feature[] = [
  {
    glyph: "A",
    sub: "-D",
    label: "Salud",
    title: "Una nota, no un sermón",
    body: "Cada producto recibe A, B, C o D según lo procesado que sea, el azúcar y el sodio. Una letra y una razón en una línea.",
    invert: false,
  },
  {
    glyph: "S/",
    sub: "",
    label: "Ahorro",
    title: "El mismo producto, más barato",
    body: "Compara contra otras tiendas y te dice dónde cuesta menos y cuánto te ahorras. Tú decides si cambias.",
    invert: true,
  },
  {
    glyph: "2",
    sub: "+",
    label: "Presencia",
    title: "Ves quién está comprando",
    body: "El carrito es uno solo y se actualiza mientras el otro camina por el mercado.",
    invert: false,
  },
  {
    glyph: "7",
    sub: "días",
    label: "Hábitos",
    title: "Una racha que sí significa algo",
    body: "Planifica tus comidas y protege el día con dos registros balanceados y evidencia privada.",
    invert: false,
  },
];

export function Features() {
  const reduced = useReducedMotion() ?? false;

  return (
    <Section tone="cream" fadeFrom="var(--qc-green)" aria-labelledby="ia-titulo">
      <Container className="pt-24 pb-20 sm:pt-28 lg:pt-32 lg:pb-28">
        <SectionHead
          id="ia-titulo"
          eyebrow="Qué hace la IA"
          title="Compra, cocina y ahorra en un solo lugar."
          titleClassName="max-w-[16ch]"
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20">
          {FEATURES.map((feature, index) => (
            <motion.li
              key={feature.label}
              {...reveal(index, reduced)}
              className="relative flex flex-col overflow-hidden rounded-[22px] border p-7 sm:p-9"
              style={{
                backgroundColor: feature.invert ? "var(--qc-green)" : "var(--qc-card)",
                borderColor: feature.invert ? "transparent" : "var(--qc-line-soft)",
                color: feature.invert ? "var(--qc-on-green)" : "var(--qc-ink)",
                boxShadow: feature.invert ? "var(--qc-shadow)" : "none",
              }}
            >
              <p
                className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{
                  color: feature.invert ? "var(--qc-lime)" : "var(--qc-ink-soft)",
                }}
              >
                {feature.label}
              </p>

              <p
                aria-hidden="true"
                className="qc-serif mt-4 flex items-baseline gap-1 leading-none tracking-tight"
                style={{
                  fontSize: "clamp(4rem, 9vw, 6.5rem)",
                  color: feature.invert ? "var(--qc-on-green)" : "var(--qc-green)",
                }}
              >
                {feature.glyph}
                {feature.sub && (
                  <span
                    className="text-[0.34em] tracking-normal"
                    style={{ opacity: 0.55 }}
                  >
                    {feature.sub}
                  </span>
                )}
              </p>

              <h3 className="mt-8 text-[19px] leading-snug font-semibold tracking-[-0.01em]">
                {feature.title}
              </h3>
              <p
                className="mt-2.5 max-w-md text-sm leading-relaxed"
                style={{
                  color: feature.invert ? "var(--qc-on-green-soft)" : "var(--qc-ink-soft)",
                }}
              >
                {feature.body}
              </p>
            </motion.li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
