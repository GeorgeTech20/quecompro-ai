import { cn } from "./cn";
import { SpinnerIcon } from "./icons";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-surface text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken",
  tertiary: "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-control font-medium",
        "transition-colors duration-150 ease-[var(--ease-out-soft)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? <SpinnerIcon className={size === "lg" ? "size-5" : "size-4"} /> : iconLeft}
      {children}
      {loading ? null : iconRight}
    </button>
  );
}
