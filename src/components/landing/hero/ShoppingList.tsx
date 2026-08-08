"use client";

import { motion } from "motion/react";

import { formatPEN } from "@/components/ui";

import { HERO, type HeroProduct } from "./scene";

/* --------------------------------------------------------------------------
   La lista de compras en papel (referencia: `public/hero/ref-cart.jpg`).
   Es el enlace visual con el producto: lo que el visitante echa al carrito se
   marca acá, línea por línea.
-------------------------------------------------------------------------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type ShoppingListProps = {
  items: readonly HeroProduct[];
  picked: readonly string[];
  reduced: boolean;
  className?: string;
};

export function ShoppingList({ items, picked, reduced, className = "" }: ShoppingListProps) {
  return (
    <div
      className={`qc-paper rounded-[3px] px-3 py-3 sm:px-4 ${className}`}
      style={{
        backgroundColor: HERO.cream,
        boxShadow: `0 2px 0 ${HERO.creamEdge}, 0 18px 34px rgba(20,48,74,0.22)`,
      }}
    >
      <p
        className="text-[13px] font-bold tracking-[0.14em] uppercase"
        style={{ color: HERO.ink }}
      >
        Lista:
      </p>
      <div className="mt-1 h-px w-full" style={{ backgroundColor: HERO.creamEdge }} />

      <ul className="mt-2 space-y-[3px]">
        {items.map((item) => {
          const checked = picked.includes(item.id);
          return (
            <li key={item.id} className="flex items-center gap-2 py-[3px]">
              <span
                aria-hidden="true"
                className="relative flex h-[13px] w-[13px] shrink-0 items-center justify-center rounded-[2px] border-[1.5px]"
                style={{ borderColor: HERO.inkSoft }}
              >
                <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]">
                  <motion.path
                    d="M3 8.4 6.3 11.6 13 4.4"
                    fill="none"
                    stroke={HERO.red}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                    transition={
                      reduced ? { duration: 0 } : { duration: 0.3, ease: EASE, delay: 0.16 }
                    }
                  />
                </svg>
              </span>

              <span
                className="min-w-0 flex-1 truncate text-[12px] leading-tight transition-opacity"
                style={{
                  color: HERO.ink,
                  opacity: checked ? 0.45 : 1,
                  textDecoration: checked ? "line-through" : "none",
                }}
              >
                {item.name}
              </span>

              <span
                className="shrink-0 text-[11px] tabular-nums"
                style={{ color: HERO.inkSoft, opacity: checked ? 0.5 : 0.85 }}
              >
                {formatPEN(item.price)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Anotación a mano, como en la referencia. */}
      <p
        className="mt-2 text-[10px] italic"
        style={{ color: HERO.inkSoft, fontFamily: "ui-serif, Georgia, serif" }}
      >
        ↳ lo que falta en casa
      </p>
    </div>
  );
}
