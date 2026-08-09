import { cn } from "./cn";

export type HealthGrade = "A" | "B" | "C" | "D";
export type HealthChipSize = "sm" | "md";

export type HealthChipProps = Omit<React.ComponentProps<"span">, "title"> & {
  grade: HealthGrade;
  size?: HealthChipSize;
  /** Compacto: solo el disco con la letra. El significado viaja en aria-label. */
  showLabel?: boolean;
};

/**
 * El disco lleva texto blanco o tinta según cuán claro sea el color del grado:
 * lima y ámbar no dan contraste suficiente con blanco encima.
 */
const GRADE: Record<HealthGrade, { label: string; wrap: string; disc: string }> = {
  A: { label: "muy buena", wrap: "bg-grade-a/12 border-grade-a/30", disc: "bg-grade-a text-white" },
  B: { label: "buena", wrap: "bg-grade-b/16 border-grade-b/40", disc: "bg-grade-b text-ink" },
  C: { label: "regular", wrap: "bg-grade-c/14 border-grade-c/40", disc: "bg-grade-c text-ink" },
  D: {
    label: "mejor evitar",
    wrap: "bg-grade-d/12 border-grade-d/30",
    disc: "bg-grade-d text-white",
  },
};

const SIZE: Record<HealthChipSize, { wrap: string; disc: string; text: string }> = {
  sm: { wrap: "h-6 gap-1.5 pl-0.5 pr-2", disc: "size-5 text-[11px]", text: "text-[11px]" },
  md: { wrap: "h-8 gap-2 pl-1 pr-2.5", disc: "size-6 text-xs", text: "text-[13px]" },
};

export function HealthChip({
  grade,
  size = "md",
  showLabel = true,
  className,
  ...rest
}: HealthChipProps) {
  const { label, wrap, disc } = GRADE[grade];
  const description = `Salud: ${grade} — ${label}`;

  return (
    <span
      {...rest}
      title={description}
      aria-label={showLabel ? undefined : description}
      className={cn(
        "inline-flex items-center rounded-chip border font-medium text-ink",
        wrap,
        showLabel ? SIZE[size].wrap : "p-0.5",
        className,
      )}
    >
      <span
        aria-hidden={showLabel ? true : undefined}
        className={cn(
          "grid place-items-center rounded-full font-bold tabular-nums",
          disc,
          SIZE[size].disc,
        )}
      >
        {grade}
      </span>
      {showLabel ? (
        <span className={cn("whitespace-nowrap", SIZE[size].text)}>
          Salud {grade}
          <span className="text-ink-muted"> · {label}</span>
        </span>
      ) : null}
    </span>
  );
}
