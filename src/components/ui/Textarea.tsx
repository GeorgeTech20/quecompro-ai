"use client";

import { useId } from "react";
import { cn } from "./cn";
import { controlBaseClass, controlToneClass, describedBy, FieldLabel, FieldMessages } from "./field";

export type TextareaProps = React.ComponentProps<"textarea"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Muestra `usados/maxLength` bajo el control. Necesita `maxLength`. */
  showCount?: boolean;
  wrapperClassName?: string;
};

export function Textarea({
  label,
  hint,
  error,
  showCount = false,
  wrapperClassName,
  className,
  id,
  required,
  rows = 4,
  maxLength,
  value,
  defaultValue,
  ...rest
}: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? `qc-textarea-${autoId}`;
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const invalid = Boolean(error);

  const current = typeof value === "string" ? value.length : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label ? (
        <FieldLabel htmlFor={textareaId} required={required}>
          {label}
        </FieldLabel>
      ) : null}

      <textarea
        {...rest}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        required={required}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(hint && !error && hintId, invalid && errorId)}
        className={cn(
          controlBaseClass,
          controlToneClass(invalid),
          "min-h-20 resize-y px-3 py-2 text-sm leading-relaxed",
          className,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
        </div>
        {showCount && maxLength ? (
          <span className="shrink-0 text-xs tabular-nums text-ink-faint">
            {current ?? 0}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}
