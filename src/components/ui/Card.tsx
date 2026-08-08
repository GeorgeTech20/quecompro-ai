import { cn } from "./cn";

export type CardProps = React.ComponentProps<"div"> & {
  /** `flush` quita el padding interno para tablas o listas a sangre. */
  padding?: "none" | "sm" | "md";
};

export function Card({ className, padding = "none", children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-card border border-border-subtle bg-surface shadow-card",
        padding === "sm" && "p-3",
        padding === "md" && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = React.ComponentProps<"div"> & {
  /** Zona derecha del header: acciones, badges, filtros. */
  actions?: React.ReactNode;
};

export function CardHeader({ className, actions, children, ...rest }: CardHeaderProps) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type CardTitleProps = React.ComponentProps<"h3"> & {
  subtitle?: React.ReactNode;
};

export function CardTitle({ className, subtitle, children, ...rest }: CardTitleProps) {
  return (
    <div className="min-w-0">
      <h3 {...rest} className={cn("truncate text-base font-semibold text-ink", className)}>
        {children}
      </h3>
      {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div {...rest} className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border-subtle bg-surface-sunken/60 px-5 py-3",
        "rounded-b-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
