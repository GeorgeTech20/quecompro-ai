import { cn } from "./cn";
import { CloseIcon } from "./icons";

export type ChipTone = "neutral" | "brand" | "accent";
export type ChipSize = "sm" | "md";

export type ChipProps = Omit<React.ComponentProps<"span">, "onSelect"> & {
  tone?: ChipTone;
  size?: ChipSize;
  iconLeft?: React.ReactNode;
  /** Si viene, aparece la "x". El chip no se borra solo: decide el consumidor. */
  onRemove?: () => void;
  /** Texto del botón de quitar para lectores de pantalla. */
  removeLabel?: string;
};

const TONE: Record<ChipTone, string> = {
  neutral: "border-border-subtle bg-surface-sunken text-ink",
  brand: "border-brand-200 bg-brand-50 text-brand-800",
  accent: "border-lime-accent/50 bg-lime-soft text-brand-800",
};

const SIZE: Record<ChipSize, { wrap: string; text: string; icon: string }> = {
  sm: { wrap: "h-6 gap-1 px-2", text: "text-[11px]", icon: "size-3" },
  md: { wrap: "h-8 gap-1.5 px-3", text: "text-[13px]", icon: "size-3.5" },
};

export function Chip({
  tone = "neutral",
  size = "md",
  iconLeft,
  onRemove,
  removeLabel,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex max-w-full items-center rounded-chip border font-medium",
        TONE[tone],
        SIZE[size].wrap,
        onRemove && (size === "sm" ? "pr-1" : "pr-1.5"),
        className,
      )}
    >
      {iconLeft}
      <span className={cn("truncate", SIZE[size].text)}>{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? "Quitar"}
          className={cn(
            "-mr-0.5 grid shrink-0 place-items-center rounded-full text-ink-muted",
            "transition-colors duration-150 hover:bg-border-subtle hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
            size === "sm" ? "size-4" : "size-5",
          )}
        >
          <CloseIcon className={SIZE[size].icon} />
        </button>
      ) : null}
    </span>
  );
}
