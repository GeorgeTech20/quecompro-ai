import Image from "next/image";

import { cn } from "@/components/ui";

export type WordmarkProps = {
  className?: string;
  /** Se conserva por compatibilidad con las pantallas existentes. */
  accent?: string;
  /** El isotipo ya funciona sobre fondos claros y oscuros. */
  onGreen?: boolean;
};

/** Isotipo oficial. El SVG recibido ya recorta el texto de la imagen fuente. */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <Image
      src="/brand/quecomproo.svg"
      width={816}
      height={886}
      alt=""
      aria-hidden="true"
      className={cn("block object-contain", className)}
    />
  );
}

export type BrandLockupProps = WordmarkProps & {
  markClassName?: string;
};

/** Logo sin texto visible para navegación, acceso y onboarding. */
export function BrandLockup({ className, markClassName }: BrandLockupProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", className)}>
      <Wordmark className={markClassName ?? "h-12 w-11"} />
      <span className="sr-only">QuéComproo</span>
    </span>
  );
}
