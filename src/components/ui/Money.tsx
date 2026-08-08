"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";

const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PEN_ROUND = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

/** `S/ 12.90`. Único formateador de soles de la app. */
export function formatPEN(value: number, options?: { round?: boolean }): string {
  return options?.round ? PEN_ROUND.format(value) : PEN.format(value);
}

export type MoneyProps = Omit<React.ComponentProps<"span">, "children"> & {
  value: number;
  /** Late con `animate-total-pulse` cuando el monto sube. */
  pulse?: boolean;
  /** Oculta los céntimos: para cifras grandes de dashboard. */
  round?: boolean;
  /** Muestra `+`/`−` delante: ahorros y diferencias. */
  signed?: boolean;
};

export function Money({
  value,
  pulse = false,
  round = false,
  signed = false,
  className,
  ...rest
}: MoneyProps) {
  const previous = useRef(value);
  // La clase de animación no se reinicia sola si el total sube dos veces
  // seguidas; cambiar la `key` fuerza el remount y con él el keyframe.
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const rose = value > previous.current;
    previous.current = value;
    if (pulse && rose) setBeat((n) => n + 1);
  }, [value, pulse]);

  const sign = signed && value !== 0 ? (value > 0 ? "+" : "−") : "";
  const text = `${sign}${formatPEN(signed ? Math.abs(value) : value, { round })}`;

  return (
    <span {...rest} className={cn("tabular-nums whitespace-nowrap", className)}>
      <span key={beat} className={cn("inline-block", beat > 0 && "animate-total-pulse")}>
        {text}
      </span>
    </span>
  );
}
