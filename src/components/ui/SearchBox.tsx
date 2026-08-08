"use client";

import { useId, useRef } from "react";
import { cn } from "./cn";
import { controlBaseClass, controlToneClass } from "./field";
import { CloseIcon, SearchIcon, SpinnerIcon } from "./icons";

export type SearchBoxSize = "sm" | "md" | "lg";

export type SearchBoxProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "type" | "size"
> & {
  value: string;
  onChange: (value: string) => void;
  /** Enter en el campo. */
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  inputSize?: SearchBoxSize;
  /** Etiqueta accesible; no se pinta salvo que `showLabel` sea true. */
  label?: string;
  showLabel?: boolean;
  wrapperClassName?: string;
};

const SIZE: Record<SearchBoxSize, { field: string; icon: string; pad: string }> = {
  sm: { field: "h-8 text-[13px]", icon: "size-4 left-2.5", pad: "pl-8 pr-8" },
  md: { field: "h-10 text-sm", icon: "size-4 left-3", pad: "pl-9 pr-9" },
  lg: { field: "h-12 text-base", icon: "size-5 left-3.5", pad: "pl-11 pr-11" },
};

export function SearchBox({
  value,
  onChange,
  onSubmit,
  onClear,
  loading = false,
  inputSize = "md",
  label = "Buscar",
  showLabel = false,
  wrapperClassName,
  className,
  id,
  placeholder = "Buscar productos...",
  ...rest
}: SearchBoxProps) {
  const autoId = useId();
  const inputId = id ?? `qc-search-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);

  function clear() {
    onChange("");
    onClear?.();
    // Tras limpiar, el foco vuelve al campo: nadie quiere volver a hacer clic.
    inputRef.current?.focus();
  }

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn(showLabel ? "text-sm font-medium text-ink" : "sr-only")}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <SearchIcon
          className={cn("pointer-events-none absolute text-ink-faint", SIZE[inputSize].icon)}
        />

        <input
          {...rest}
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && onSubmit) {
              event.preventDefault();
              onSubmit(value);
            }
            if (event.key === "Escape" && value) {
              event.preventDefault();
              clear();
            }
            rest.onKeyDown?.(event);
          }}
          className={cn(
            controlBaseClass,
            controlToneClass(false),
            SIZE[inputSize].field,
            SIZE[inputSize].pad,
            // El botón nativo de limpiar de Safari/Chrome duplica el nuestro.
            "[&::-webkit-search-cancel-button]:appearance-none",
            className,
          )}
        />

        <div className="absolute right-2 flex items-center">
          {loading ? (
            <SpinnerIcon className="size-4 text-ink-faint" title="Buscando" />
          ) : value ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Limpiar búsqueda"
              className={cn(
                "grid size-6 place-items-center rounded-full text-ink-faint",
                "transition-colors duration-150 hover:bg-surface-sunken hover:text-ink",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
              )}
            >
              <CloseIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
