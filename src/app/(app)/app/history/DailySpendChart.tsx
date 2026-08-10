"use client";

import { useState } from "react";

import { cn, formatPEN } from "@/components/ui";

/**
 * Gasto por día del mes.
 *
 * Una sola serie, un solo tono: la altura ya dice cuánto, así que pintar cada
 * día de un color distinto solo agregaría ruido. Sin leyenda por lo mismo —
 * el título dice qué se está mirando.
 *
 * El día más caro no se rotula sobre la barra: con 31 columnas en un celular
 * el texto no entra y quedaría pisando a los vecinos. Va arriba, en su propia
 * cifra, donde se lee sin pelear con nada.
 *
 * La lista de días que va debajo es la versión en texto de este gráfico, así
 * que el dato nunca depende de poder ver la barra ni de pasar el mouse.
 */

export type DaySpend = {
  /** `2026-08-09`, clave estable para el key de React. */
  key: string;
  /** Día del mes, 1–31. */
  day: number;
  /** Etiqueta larga para el tooltip: "9 de agosto". */
  label: string;
  total: number;
  purchases: number;
};

export type DailySpendChartProps = {
  days: readonly DaySpend[];
  /** Se rotula como tope del eje; redondeado hacia arriba para que sea legible. */
  max: number;
};

/** Alto del área de dibujo. Fijo: el gráfico no compite con la lista de abajo. */
const PLOT_HEIGHT = 132;

/** Una compra chiquita tiene que verse. Menos de esto no se distingue del cero. */
const MIN_BAR_PX = 3;

export function DailySpendChart({ days, max }: DailySpendChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = days.find((day) => day.key === hovered) ?? null;

  const spent = days.filter((day) => day.total > 0);
  const peak = spent.reduce<DaySpend | null>(
    (best, day) => (best === null || day.total > best.total ? day : best),
    null,
  );

  const summary =
    peak === null
      ? "Sin compras registradas este mes."
      : `Gasto por día. El día más caro fue el ${peak.label}, con ${formatPEN(peak.total)}. ` +
        `${spent.length} ${spent.length === 1 ? "día" : "días"} con compras.`;

  return (
    <figure className="m-0 flex flex-col gap-3" aria-describedby="grafico-dia-resumen">
      {/* El texto del eje siempre en tinta, nunca en el color de la serie. */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-ink-faint tabular-nums">{formatPEN(max, { round: true })}</span>
        <span
          className={cn(
            "text-xs tabular-nums transition-opacity duration-150",
            active ? "text-ink opacity-100" : "text-ink-faint opacity-0",
          )}
          aria-hidden="true"
        >
          {active
            ? `${active.label} · ${formatPEN(active.total)}${
                active.purchases > 0
                  ? ` · ${active.purchases} ${active.purchases === 1 ? "compra" : "compras"}`
                  : ""
              }`
            : "—"}
        </span>
      </div>

      <div
        role="img"
        aria-label={summary}
        className="relative"
        style={{ height: `${PLOT_HEIGHT}px` }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Rejilla: dos hairlines y nada más. Se ven si las buscas. */}
        <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-border-subtle" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-border-subtle" />

        <div className="absolute inset-0 flex items-end gap-[2px]">
          {days.map((day) => {
            const ratio = max > 0 ? day.total / max : 0;
            const height = day.total > 0 ? Math.max(MIN_BAR_PX, ratio * PLOT_HEIGHT) : 0;
            const isActive = day.key === hovered;

            return (
              <div
                key={day.key}
                className="group flex h-full min-w-0 flex-1 items-end justify-center"
                onMouseEnter={() => setHovered(day.key)}
              >
                {/* El slot completo es el área sensible; la barra va más fina. */}
                <span className="flex h-full w-full max-w-[24px] items-end">
                  <span
                    className={cn(
                      "w-full rounded-t-[4px] transition-colors duration-150",
                      day.total > 0
                        ? isActive
                          ? "bg-brand-700"
                          : "bg-brand-600"
                        : "bg-transparent",
                      // El día sin compras deja ver que existe cuando lo apuntas.
                      day.total === 0 && isActive && "h-[2px] bg-border-strong",
                    )}
                    style={day.total > 0 ? { height: `${height}px` } : undefined}
                  />
                </span>
              </div>
            );
          })}
        </div>

        <span className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-border-strong" />
      </div>

      {/* Eje X cada cinco días: 31 números seguidos no se leen, se amontonan. */}
      <div className="flex gap-[2px]">
        {days.map((day) => (
          <span
            key={day.key}
            className="min-w-0 flex-1 text-center text-[10px] text-ink-faint tabular-nums"
          >
            {day.day === 1 || day.day % 5 === 0 ? day.day : " "}
          </span>
        ))}
      </div>

      <figcaption id="grafico-dia-resumen" className="sr-only">
        {summary} El detalle de cada día está en la lista que sigue.
      </figcaption>
    </figure>
  );
}
