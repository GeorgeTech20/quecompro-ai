import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "warning" | "critical" | "info" | "brand";
export type BadgeSize = "sm" | "md";

export type BadgeProps = React.ComponentProps<"span"> & {
  tone?: BadgeTone;
  size?: BadgeSize;
  /** Punto de color a la izquierda, para listas densas donde el tono solo no basta. */
  dot?: boolean;
};

const TONE: Record<BadgeTone, { chip: string; dot: string }> = {
  neutral: { chip: "bg-surface-sunken text-ink-muted border-border-subtle", dot: "bg-ink-faint" },
  success: { chip: "bg-grade-a/10 text-grade-a border-grade-a/25", dot: "bg-grade-a" },
  warning: { chip: "bg-warning/10 text-warning border-warning/25", dot: "bg-warning" },
  critical: { chip: "bg-danger/10 text-danger border-danger/25", dot: "bg-danger" },
  info: { chip: "bg-info/10 text-info border-info/25", dot: "bg-info" },
  brand: { chip: "bg-lime-soft text-brand-800 border-lime-accent/50", dot: "bg-lime-accent" },
};

const SIZE: Record<BadgeSize, string> = {
  sm: "h-5 gap-1 px-1.5 text-[11px]",
  md: "h-6 gap-1.5 px-2 text-xs",
};

export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center rounded-chip border font-medium whitespace-nowrap",
        TONE[tone].chip,
        SIZE[size],
        className,
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} /> : null}
      {children}
    </span>
  );
}
