"use client";

import { useId } from "react";
import { cn } from "./cn";
import { controlBaseClass, controlToneClass, describedBy, FieldLabel, FieldMessages } from "./field";

export type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  inputSize?: InputSize;
  /** Prefijo fijo dentro del control, p. ej. "S/". */
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  /** `className` va al input; esto envuelve label + control + mensajes. */
  wrapperClassName?: string;
};

const SIZE: Record<InputSize, string> = {
  sm: "h-8 px-2.5 text-[13px]",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export function Input({
  label,
  hint,
  error,
  inputSize = "md",
  prefix,
  suffix,
  wrapperClassName,
  className,
  id,
  required,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? `qc-input-${autoId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label ? (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      ) : null}

      <div className="relative flex items-center">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 text-sm text-ink-muted">
            {prefix}
          </span>
        ) : null}
        <input
          {...rest}
          id={inputId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(hint && !error && hintId, invalid && errorId)}
          className={cn(
            controlBaseClass,
            controlToneClass(invalid),
            SIZE[inputSize],
            prefix && "pl-9",
            suffix && "pr-9",
            className,
          )}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 text-sm text-ink-muted">
            {suffix}
          </span>
        ) : null}
      </div>

      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
