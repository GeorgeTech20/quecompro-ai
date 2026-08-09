import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui";

/**
 * Los CTA de la landing navegan, así que son enlaces, no `<button>`.
 * `Button` del design system renderiza un `<button>` de verdad y no acepta
 * `asChild`, por eso aquí se replican sus clases en vez de anidar elementos
 * interactivos (un `<a>` con un `<button>` dentro no es HTML válido).
 *
 * `primary`/`secondary` usan los tokens del design system (los sigue usando el
 * hero, que además los pisa con `style` en línea). `green`/`cream` son la
 * píldora del mundo de secciones: verde profundo sobre claro, crema sobre
 * verde — como en la referencia r6.
 */
export type CtaVariant = "primary" | "secondary" | "green" | "cream" | "outline";

export type CtaLinkProps = ComponentProps<typeof Link> & {
  variant?: CtaVariant;
  size?: CtaSize;
  fullWidth?: boolean;
  /** Píldora completa en vez del radio de control. */
  pill?: boolean;
};

const VARIANT: Record<CtaVariant, string> = {
  primary: "qc-tactile-primary bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700",
  secondary:
    "qc-tactile-secondary bg-surface text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken",
  green: "qc-pill qc-tactile-primary",
  cream: "qc-pill qc-tactile-secondary",
  outline: "qc-pill qc-tactile-secondary border",
};

/** Los mundos propios no pueden ir en clases: los colores son variables CSS. */
const VARIANT_STYLE: Record<CtaVariant, React.CSSProperties | undefined> = {
  primary: undefined,
  secondary: undefined,
  green: { backgroundColor: "var(--qc-green)", color: "var(--qc-on-green)" },
  cream: { backgroundColor: "var(--qc-on-green)", color: "var(--qc-green)" },
  outline: { borderColor: "currentColor", color: "inherit" },
};

export type CtaSize = "md" | "lg" | "xl";

const SIZE: Record<CtaSize, string> = {
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-5 text-base",
  // Píldora de sección: la de r6 es ancha y con aire.
  xl: "h-14 gap-3 px-8 text-base",
};

export function CtaLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  pill = false,
  className,
  style,
  ...rest
}: CtaLinkProps) {
  const usesTokens = variant === "primary" || variant === "secondary";

  return (
    <Link
      {...rest}
      style={{ ...VARIANT_STYLE[variant], ...style }}
      className={cn(
        "inline-flex items-center justify-center font-medium select-none",
        pill ? "rounded-full" : "rounded-button",
        "transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-[var(--ease-out-soft)]",
        usesTokens
          ? "focus-visible:ring-brand-600 focus-visible:ring-offset-canvas focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          : "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    />
  );
}
