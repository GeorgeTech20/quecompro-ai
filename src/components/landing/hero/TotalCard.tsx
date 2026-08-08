"use client";

import { AnimatePresence, motion } from "motion/react";

import { Money } from "@/components/ui";

import { GRADE_COLOR, HERO, type Suggestion } from "./scene";

/* --------------------------------------------------------------------------
   La boleta chica del hero: total que late al crecer, cuántos productos van y,
   a partir del tercero, el chip de la IA. Papel crema, tinta fija.
-------------------------------------------------------------------------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type TotalCardProps = {
  total: number;
  count: number;
  suggestion: Suggestion | null;
  reduced: boolean;
  onClear: () => void;
  className?: string;
};

export function TotalCard({
  total,
  count,
  suggestion,
  reduced,
  onClear,
  className = "",
}: TotalCardProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        className="qc-paper rounded-[3px] px-3 py-3 sm:px-4"
        style={{
          backgroundColor: HERO.cream,
          boxShadow: `0 2px 0 ${HERO.creamEdge}, 0 18px 34px rgba(20,48,74,0.22)`,
        }}
      >
        <p
          className="text-[9px] font-bold tracking-[0.16em] uppercase"
          style={{ color: HERO.inkSoft }}
        >
          Total del carrito
        </p>

        <Money
          value={total}
          pulse={!reduced}
          className="mt-1 block text-[26px] leading-none font-bold tracking-[-0.03em] sm:text-[30px]"
          style={{ color: HERO.red }}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px]" style={{ color: HERO.inkSoft }}>
            {count === 0
              ? "carrito vacío"
              : `${count} producto${count === 1 ? "" : "s"} adentro`}
          </p>

          {count > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase underline underline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ color: HERO.inkSoft, outlineColor: HERO.ink }}
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      {/* El gancho del producto dentro del propio hero. */}
      <AnimatePresence initial={false}>
        {suggestion && (
          <motion.div
            key="ia"
            initial={reduced ? false : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={reduced ? { duration: 0 } : { duration: 0.34, ease: EASE }}
            className="rounded-[3px] px-3 py-2"
            style={{
              backgroundColor: HERO.ink,
              boxShadow: "0 12px 26px rgba(20,48,74,0.28)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-[15px] items-center rounded-[2px] px-1 text-[8px] font-bold tracking-wide text-white"
                style={{ backgroundColor: HERO.red }}
              >
                IA
              </span>
              <span
                aria-hidden="true"
                className="flex h-[15px] w-[15px] items-center justify-center rounded-[2px] text-[9px] font-bold text-white"
                style={{ backgroundColor: GRADE_COLOR[suggestion.grade] }}
              >
                {suggestion.grade}
              </span>
              <span className="text-[9px] tracking-[0.14em] text-white/55 uppercase">
                Salud {suggestion.grade}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-white">{suggestion.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
