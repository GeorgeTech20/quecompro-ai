import { cn } from "./cn";

/**
 * Piezas compartidas por los controles de formulario (Input, Textarea,
 * SearchBox, Combobox) para que label, hint y error se vean y se anuncien
 * igual en todos. No se exporta como componente público.
 */

export const controlBaseClass = cn(
  "w-full rounded-control border bg-surface text-ink placeholder:text-ink-faint",
  "transition-colors duration-150",
  "focus:outline-none focus:ring-2 focus:ring-brand-600/35",
  "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-ink-muted",
);

export function controlToneClass(invalid: boolean): string {
  return invalid
    ? "border-danger focus:border-danger focus:ring-danger/30"
    : "border-border-strong focus:border-brand-600";
}

export type FieldLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
};

export function FieldLabel({ htmlFor, children, required, className }: FieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={cn("text-sm font-medium text-ink", className)}>
      {children}
      {required ? (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export type FieldMessagesProps = {
  hint?: React.ReactNode;
  error?: React.ReactNode;
  hintId: string;
  errorId: string;
};

export function FieldMessages({ hint, error, hintId, errorId }: FieldMessagesProps) {
  return (
    <>
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} aria-live="polite" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

/**
 * Une los ids que existen de verdad; `undefined` si no hay ninguno.
 * Acepta `unknown` porque las llamadas son del tipo `hint && hintId`, y `hint`
 * es un ReactNode: sus ramas falsy no son solo `false | undefined`.
 */
export function describedBy(...ids: unknown[]): string | undefined {
  const present = ids.filter((id): id is string => typeof id === "string" && id.length > 0);
  return present.length > 0 ? present.join(" ") : undefined;
}
