import { cn } from "./cn";

export type LiveDotSize = "sm" | "md" | "lg";

export type LiveDotProps = React.ComponentProps<"span"> & {
  size?: LiveDotSize;
  /** `false` deja el punto quieto: alguien conectado pero inactivo. */
  active?: boolean;
  /** Texto solo para lectores de pantalla. */
  label?: string;
};

const SIZE: Record<LiveDotSize, string> = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
};

export function LiveDot({
  size = "md",
  active = true,
  label = "En línea",
  className,
  ...rest
}: LiveDotProps) {
  return (
    <span {...rest} className={cn("inline-flex items-center", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full",
          active ? "bg-brand-500 animate-live-dot" : "bg-ink-faint",
          SIZE[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
