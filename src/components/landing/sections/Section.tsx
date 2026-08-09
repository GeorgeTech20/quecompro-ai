import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/components/ui";

/* --------------------------------------------------------------------------
   Chasis de sección: fondo, tinta y la bajada de color entre vecinas.

   La landing cambia de mundo tres veces (celeste → crema → verde → crema) y
   ninguna transición puede ser un corte: cada sección puede pintar una banda
   de degradado desde el color de la sección anterior.
-------------------------------------------------------------------------- */

export type SectionTone = "cream" | "creamWarm" | "green";

const BG: Record<SectionTone, string> = {
  cream: "var(--qc-cream)",
  creamWarm: "var(--qc-cream-warm)",
  green: "var(--qc-green)",
};

const FG: Record<SectionTone, string> = {
  cream: "var(--qc-ink)",
  creamWarm: "var(--qc-ink)",
  green: "var(--qc-on-green)",
};

export function sectionBg(tone: SectionTone): string {
  return BG[tone];
}

export type SectionProps = {
  id?: string;
  tone?: SectionTone;
  /** Color de la sección anterior: pinta la banda de bajada arriba. */
  fadeFrom?: string;
  /** Alto de la banda de bajada. Más alta cuanto mayor sea el salto. */
  fadeHeight?: string;
  className?: string;
  style?: CSSProperties;
  "aria-labelledby"?: string;
  children: ReactNode;
};

export function Section({
  id,
  tone = "cream",
  fadeFrom,
  fadeHeight = "clamp(72px, 12vw, 160px)",
  className,
  style,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      {...rest}
      id={id}
      className={cn("relative isolate scroll-mt-24 overflow-x-clip", className)}
      style={{ backgroundColor: BG[tone], color: FG[tone], ...style }}
    >
      {fadeFrom ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: fadeHeight,
            background: `linear-gradient(${fadeFrom}, ${BG[tone]})`,
          }}
        />
      ) : null}
      {children}
    </section>
  );
}

/** Ancho de lectura de toda la landing. El hero usa el mismo. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[1180px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

/* --- Cabecera de sección -------------------------------------------------- */

export function Eyebrow({ children, onGreen = false }: { children: ReactNode; onGreen?: boolean }) {
  return (
    <p
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
      style={{
        borderColor: onGreen ? "var(--qc-on-green-line)" : "var(--qc-line)",
        color: onGreen ? "var(--qc-on-green-soft)" : "var(--qc-ink-soft)",
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: onGreen ? "var(--qc-lime)" : "var(--qc-green)" }}
      />
      {children}
    </p>
  );
}

export type SectionHeadProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  onGreen?: boolean;
  /** Ancho máximo del titular. Ancho de sobra: nada de titulares en seis líneas. */
  titleClassName?: string;
  className?: string;
};

export function SectionHead({
  id,
  eyebrow,
  title,
  lead,
  onGreen = false,
  titleClassName = "max-w-[19ch]",
  className,
}: SectionHeadProps) {
  return (
    <div className={cn("max-w-4xl", className)}>
      <Eyebrow onGreen={onGreen}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className={cn("qc-serif mt-5 text-balance", titleClassName)}
        style={{
          fontSize: "clamp(2.1rem, 5.4vw, 4.25rem)",
          lineHeight: 1.02,
          color: onGreen ? "var(--qc-on-green)" : "var(--qc-ink)",
        }}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className="mt-5 max-w-xl text-[15px] leading-relaxed sm:text-base"
          style={{ color: onGreen ? "var(--qc-on-green-soft)" : "var(--qc-ink-soft)" }}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
