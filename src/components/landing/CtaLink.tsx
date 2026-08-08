import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/components/ui";

/**
 * Los CTA de la landing navegan, así que son enlaces, no `<button>`.
 * `Button` del design system renderiza un `<button>` de verdad y no acepta
 * `asChild`, por eso aquí se replican sus clases en vez de anidar elementos
 * interactivos (un `<a>` con un `<button>` dentro no es HTML válido).
 */
export type CtaLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  fullWidth?: boolean;
};

const VARIANT = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-surface text-ink border border-border-strong hover:bg-surface-sunken active:bg-surface-sunken",
} as const;

const SIZE = {
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-5 text-base",
} as const;

export function CtaLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...rest
}: CtaLinkProps) {
  return (
    <Link
      {...rest}
      className={cn(
        "rounded-control inline-flex items-center justify-center font-medium select-none",
        "transition-colors duration-150 ease-[var(--ease-out-soft)]",
        "focus-visible:ring-brand-600 focus-visible:ring-offset-canvas focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className,
      )}
    />
  );
}
