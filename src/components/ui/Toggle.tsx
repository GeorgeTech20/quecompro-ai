"use client";

import { useId } from "react";
import { cn } from "./cn";

export type ToggleSize = "sm" | "md";

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: ToggleSize;
  disabled?: boolean;
  id?: string;
  /** Etiqueta para lectores de pantalla cuando no hay `label` visible. */
  "aria-label"?: string;
  className?: string;
  wrapperClassName?: string;
};

const SIZE: Record<ToggleSize, { track: string; knob: string; travel: string }> = {
  sm: { track: "h-5 w-9", knob: "size-4", travel: "translate-x-4" },
  md: { track: "h-6 w-11", knob: "size-5", travel: "translate-x-5" },
};

export function Toggle({
  checked,
  onChange,
  label,
  description,
  size = "md",
  disabled = false,
  id,
  className,
  wrapperClassName,
  ...aria
}: ToggleProps) {
  const autoId = useId();
  const switchId = id ?? `qc-toggle-${autoId}`;
  const labelId = `${switchId}-label`;
  const descriptionId = `${switchId}-description`;

  const control = (
    <button
      {...aria}
      type="button"
      id={switchId}
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent",
        "transition-colors duration-150 ease-[var(--ease-out-soft)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-border-strong",
        SIZE[size].track,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none ml-0.5 rounded-full bg-white shadow-card",
          "transition-transform duration-150 ease-[var(--ease-out-soft)]",
          SIZE[size].knob,
          checked ? SIZE[size].travel : "translate-x-0",
        )}
      />
    </button>
  );

  if (!label && !description) return control;

  return (
    <div className={cn("flex items-start gap-3", wrapperClassName)}>
      {control}
      <div className="min-w-0">
        {label ? (
          <label
            id={labelId}
            htmlFor={switchId}
            className={cn(
              "block text-sm font-medium text-ink",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            )}
          >
            {label}
          </label>
        ) : null}
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-xs text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
