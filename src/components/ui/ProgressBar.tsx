import { cn } from "./cn";

export type ProgressTone = "auto" | "brand" | "warning" | "critical";
export type ProgressSize = "sm" | "md" | "lg";

export type ProgressBarProps = Omit<React.ComponentProps<"div">, "children"> & {
  value: number;
  max: number;
  tone?: ProgressTone;
  /** Gasto proyectado a fin de mes: se dibuja como marca sobre la barra. */
  projected?: number;
  size?: ProgressSize;
  label?: React.ReactNode;
  /** Texto a la derecha del label (normalmente `<Money>` gastado / total). */
  caption?: React.ReactNode;
  /** Descripción para lectores de pantalla; por defecto "X% de Y". */
  valueText?: string;
};

const FILL: Record<Exclude<ProgressTone, "auto">, string> = {
  brand: "bg-brand-600",
  warning: "bg-warning",
  critical: "bg-danger",
};

const TRACK_SIZE: Record<ProgressSize, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-3.5",
};

const clampPercent = (n: number) => Math.min(100, Math.max(0, n));

/** Umbrales del presupuesto: tranquilo, ojo, y ya te pasaste. */
export function toneForPercent(percent: number): Exclude<ProgressTone, "auto"> {
  if (percent >= 100) return "critical";
  if (percent >= 80) return "warning";
  return "brand";
}

export function ProgressBar({
  value,
  max,
  tone = "auto",
  projected,
  size = "md",
  label,
  caption,
  valueText,
  className,
  ...rest
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const rawPercent = (value / safeMax) * 100;
  const percent = clampPercent(rawPercent);
  const resolvedTone = tone === "auto" ? toneForPercent(rawPercent) : tone;

  const projectedPercent =
    projected === undefined ? undefined : clampPercent((projected / safeMax) * 100);
  const projectedOver = projected !== undefined && projected > max;

  return (
    <div {...rest} className={cn("flex flex-col gap-1.5", className)}>
      {label || caption ? (
        <div className="flex items-baseline justify-between gap-3">
          {label ? <span className="text-sm font-medium text-ink">{label}</span> : <span />}
          {caption ? (
            <span className="text-sm tabular-nums text-ink-muted">{caption}</span>
          ) : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuetext={valueText ?? `${Math.round(rawPercent)}% de ${max}`}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-surface-sunken",
          TRACK_SIZE[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-200 ease-[var(--ease-out-soft)]",
            FILL[resolvedTone],
          )}
          style={{ width: `${percent}%` }}
        />

        {projectedPercent !== undefined ? (
          <span
            aria-hidden="true"
            title={`Proyección de fin de mes: ${Math.round(projectedPercent)}%`}
            style={{ left: `${projectedPercent}%` }}
            className={cn(
              "absolute top-0 h-full w-0.5 -translate-x-1/2 rounded-full",
              projectedOver ? "bg-danger" : "bg-ink/45",
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
