"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useRef, type CSSProperties } from "react";

import { cn } from "@/components/ui";

/* --------------------------------------------------------------------------
   Banda de texto repetido (referencia r1 del cliente).

   Es ritmo, no contenido: va `aria-hidden` y ningún lector la anuncia. El
   movimiento es una animación CSS —no un bucle de JS— para que pausarla fuera
   del viewport sea `animation-play-state` y no un reinicio con salto. Con
   `prefers-reduced-motion` se congela y se lee como una tipografía fija.
-------------------------------------------------------------------------- */

const DEFAULT_WORDS = [
  "PRESUPUESTO",
  "SALUD",
  "PRECIO",
  "RECETAS",
  "DESPENSA",
  "ROOMIES",
] as const;

type Tone = "green" | "cream" | "lime";

const TONE: Record<Tone, { bg: string; fg: string; line: string }> = {
  green: { bg: "var(--qc-green)", fg: "var(--qc-on-green)", line: "var(--qc-on-green-line)" },
  cream: { bg: "var(--qc-cream-warm)", fg: "var(--qc-ink)", line: "var(--qc-line)" },
  lime: { bg: "var(--qc-lime)", fg: "var(--qc-ink)", line: "rgba(20,74,97,0.22)" },
};

export type MarqueeProps = {
  words?: readonly string[];
  tone?: Tone;
  /** Segundos por vuelta completa. Lento: es un fondo, no un letrero. */
  seconds?: number;
  className?: string;
};

export function Marquee({
  words = DEFAULT_WORDS,
  tone = "green",
  seconds = 52,
  className,
}: MarqueeProps) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0 });
  const colors = TONE[tone];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden select-none", className)}
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        borderBlock: `1px solid ${colors.line}`,
      }}
    >
      <div
        className="qc-marquee-x flex w-max py-3 sm:py-4"
        data-paused={!inView || reduced}
        style={{ "--qc-marquee-dur": `${seconds}s` } as CSSProperties}
      >
        {/* Dos copias idénticas: la animación recorre justo la mitad del
            track, así el corte cae donde empieza la copia gemela. */}
        {[0, 1].map((copy) => (
          <Run key={copy} words={words} />
        ))}
      </div>
    </div>
  );
}

function Run({ words }: { words: readonly string[] }) {
  return (
    <div className="flex shrink-0 items-center">
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="flex items-center">
          <span className="text-[11px] font-semibold tracking-[0.32em] uppercase sm:text-xs">
            {word}
          </span>
          <span className="px-4 text-[10px] opacity-50 sm:px-6" aria-hidden="true">
            ●
          </span>
        </span>
      ))}
    </div>
  );
}

/* --- Variante vertical: la banda del borde de r1 -------------------------- */

export type EdgeBandProps = {
  words?: readonly string[];
  seconds?: number;
  className?: string;
  color?: string;
};

/**
 * Columna de texto girado pegada al borde de una sección. Decorativa: se monta
 * solo en pantallas anchas, donde hay margen que no le quita sitio a nada.
 */
export function EdgeBand({
  words = DEFAULT_WORDS,
  seconds = 44,
  className,
  color = "var(--qc-on-green-line)",
}: EdgeBandProps) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0 });

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-y-0 overflow-hidden", className)}
      style={{ color }}
    >
      <div
        className="qc-marquee-y flex h-max flex-col items-center"
        data-paused={!inView || reduced}
        style={{ "--qc-marquee-dur": `${seconds}s` } as CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 flex-col items-center gap-7">
            {words.map((word, index) => (
              <div key={`${word}-${index}`} className="flex flex-col items-center gap-7">
                <span
                  className="text-[11px] font-semibold tracking-[0.34em] uppercase"
                  style={{ writingMode: "vertical-rl" }}
                >
                  {word}
                </span>
                <span className="text-[9px] opacity-70">●</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
