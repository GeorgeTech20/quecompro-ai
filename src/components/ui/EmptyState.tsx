import { cn } from "./cn";

export type EmptyStateProps = React.ComponentProps<"div"> & {
  /** Slot de ilustración: SVG propio, canvas o un emoji grande. */
  illustration?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  size?: "sm" | "md";
};

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  children,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      {...rest}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" ? "gap-3 px-4 py-8" : "gap-4 px-6 py-14",
        className,
      )}
    >
      {illustration ? (
        <div
          aria-hidden="true"
          className={cn(
            "grid place-items-center rounded-full bg-surface-sunken text-ink-faint",
            size === "sm" ? "size-12" : "size-16",
          )}
        >
          {illustration}
        </div>
      ) : null}

      <div className="max-w-sm space-y-1.5">
        <p className={cn("font-semibold text-ink", size === "sm" ? "text-sm" : "text-base")}>
          {title}
        </p>
        {description ? (
          <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>

      {children}

      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
