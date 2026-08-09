import Link from "next/link";

import { cn, type ButtonSize, type ButtonVariant } from "@/components/ui";

/**
 * Un enlace con pinta de botón.
 *
 * El `Button` del design system renderiza un `<button>` y meter un `<a>` dentro
 * (o al revés) es HTML inválido y un lío para el teclado. Como el DS no es de
 * este agente, el esqueleto define su propia versión navegable reusando los
 * mismos tokens, así que se ven idénticos.
 */

export type LinkButtonProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "qc-tactile-primary bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700",
  secondary:
    "qc-tactile-secondary bg-surface text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken",
  tertiary: "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "qc-tactile-danger bg-danger text-white hover:bg-danger/90 active:bg-danger/80",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-5 text-base",
};

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      {...rest}
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-button font-medium select-none",
        "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-[var(--ease-out-soft)]",
        "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
