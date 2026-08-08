import { cn } from "./cn";

export type SkeletonProps = React.ComponentProps<"span"> & {
  /** `text` respeta el alto de línea; `block` llena el contenedor. */
  variant?: "text" | "block" | "circle";
  /** Nº de líneas cuando `variant="text"`; la última sale más corta. */
  lines?: number;
};

/**
 * El barrido va en una hoja propia (React la deduplica por `href`) porque los
 * keyframes no viven en `globals.css` y este archivo no puede tocarlo.
 * El gradiente usa `--color-surface` sobre `--color-surface-sunken`, así el
 * brillo se invierte solo en dark mode.
 */
const SHIMMER_CSS = `
.qc-skel { position: relative; overflow: hidden; }
.qc-skel::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg, transparent, var(--color-surface), transparent);
  opacity: .65;
  animation: qc-shimmer 1.5s var(--ease-out-soft) infinite;
}
@keyframes qc-shimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .qc-skel::after { animation: none; } }
`;

export function Skeleton({
  variant = "block",
  lines = 1,
  className,
  ...rest
}: SkeletonProps) {
  const shimmer = (
    <style href="qc-skeleton" precedence="default">
      {SHIMMER_CSS}
    </style>
  );

  const shape = cn(
    "qc-skel block bg-surface-sunken",
    variant === "circle" ? "rounded-full" : "rounded-control",
    variant === "text" && "h-[1em] my-[0.25em]",
    variant === "block" && "h-full min-h-4",
  );

  if (variant === "text" && lines > 1) {
    return (
      <span
        {...rest}
        aria-hidden="true"
        className={cn("block w-full", className)}
      >
        {shimmer}
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={cn(shape, index === lines - 1 && "w-3/5")}
          />
        ))}
      </span>
    );
  }

  return (
    <span {...rest} aria-hidden="true" className={cn(shape, className)}>
      {shimmer}
    </span>
  );
}
