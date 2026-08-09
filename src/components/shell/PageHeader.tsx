import { cn } from "@/components/ui";

/**
 * Cabecera de pantalla. Todas las rutas de `/app` la usan para que el título,
 * la bajada y las acciones estén siempre en el mismo sitio.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Contenedor de página: ancho máximo y respiración iguales en toda la app. */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8", className)}>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
