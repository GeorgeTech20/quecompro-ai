"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./cn";
import { controlBaseClass, controlToneClass, describedBy, FieldLabel, FieldMessages } from "./field";
import { SpinnerIcon } from "./icons";

export type ComboboxOption = {
  id: string;
  label: string;
  /** Segunda línea: tienda, marca, presentación. */
  sublabel?: string;
  /** Alineado a la derecha: precio, distancia, stock. */
  meta?: React.ReactNode;
  disabled?: boolean;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  onSelect: (option: ComboboxOption) => void;
  /** Controlado si viene; si no, el componente guarda el texto. */
  value?: string;
  onInputChange?: (value: string) => void;
  loading?: boolean;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  emptyMessage?: string;
  /** Deja el texto escrito tras elegir (por defecto pone el label elegido). */
  keepQueryOnSelect?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  wrapperClassName?: string;
};

export function Combobox({
  options,
  onSelect,
  value,
  onInputChange,
  loading = false,
  label,
  hint,
  error,
  placeholder = "Escribe para buscar...",
  emptyMessage = "Sin resultados",
  keepQueryOnSelect = false,
  disabled = false,
  required = false,
  id,
  name,
  className,
  wrapperClassName,
}: ComboboxProps) {
  const autoId = useId();
  const inputId = id ?? `qc-combobox-${autoId}`;
  const listId = `${inputId}-listbox`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const optionId = (index: number) => `${inputId}-option-${index}`;

  const [internalQuery, setInternalQuery] = useState("");
  const query = value ?? internalQuery;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef<HTMLUListElement>(null);

  const invalid = Boolean(error);
  const hasOptions = options.length > 0;
  const expanded = open && (hasOptions || loading || query.length > 0);

  // Las opciones llegan async: el índice activo de la tanda anterior ya no vale.
  useEffect(() => {
    setActiveIndex(-1);
  }, [options]);

  useEffect(() => {
    if (!expanded || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex];
    if (node instanceof HTMLElement) node.scrollIntoView({ block: "nearest" });
  }, [activeIndex, expanded]);

  function setQuery(next: string) {
    if (value === undefined) setInternalQuery(next);
    onInputChange?.(next);
  }

  function nextEnabled(from: number, step: 1 | -1): number {
    if (!hasOptions) return -1;
    let index = from;
    for (let hop = 0; hop < options.length; hop += 1) {
      index = (index + step + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return -1;
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onSelect(option);
    if (!keepQueryOnSelect) setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(nextEnabled(-1, 1));
          return;
        }
        setActiveIndex(nextEnabled(activeIndex, 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(nextEnabled(0, -1));
          return;
        }
        setActiveIndex(nextEnabled(activeIndex, -1));
        return;
      case "Home":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(nextEnabled(-1, 1));
        return;
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(nextEnabled(0, -1));
        return;
      case "Enter":
        if (open && activeIndex >= 0) {
          event.preventDefault();
          choose(activeIndex);
        }
        return;
      case "Escape":
        // Primer Escape cierra la lista; el segundo limpia el campo.
        event.preventDefault();
        if (open) {
          setOpen(false);
          setActiveIndex(-1);
        } else if (query) {
          setQuery("");
        }
        return;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        return;
      default:
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-1.5", wrapperClassName)}
      onBlur={(event) => {
        // Solo cerramos si el foco se fue del combobox entero, no del input a la lista.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      {label ? (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      ) : null}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={query}
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-activedescendant={expanded && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-invalid={invalid || undefined}
          aria-busy={loading || undefined}
          aria-describedby={describedBy(hint && !error && hintId, invalid && errorId)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            controlBaseClass,
            controlToneClass(invalid),
            "h-10 pl-3 pr-9 text-sm",
            className,
          )}
        />

        {loading ? (
          <SpinnerIcon
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
            title="Buscando"
          />
        ) : null}

        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={typeof label === "string" ? label : "Sugerencias"}
          hidden={!expanded}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-72 overflow-y-auto",
            "rounded-card border border-border-subtle bg-surface py-1 shadow-raised",
            "animate-rise",
          )}
        >
          {hasOptions ? (
            options.map((option, index) => {
              const active = index === activeIndex;
              return (
                <li
                  key={option.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={active}
                  aria-disabled={option.disabled || undefined}
                  // mousedown antes que el blur del input: si no, la lista se cierra
                  // y el click nunca llega.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2",
                    option.disabled && "cursor-not-allowed opacity-50",
                    active && !option.disabled && "bg-brand-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{option.label}</span>
                    {option.sublabel ? (
                      <span className="block truncate text-xs text-ink-muted">
                        {option.sublabel}
                      </span>
                    ) : null}
                  </span>
                  {option.meta ? (
                    <span className="shrink-0 text-sm font-medium tabular-nums text-ink">
                      {option.meta}
                    </span>
                  ) : null}
                </li>
              );
            })
          ) : (
            <li role="presentation" className="px-3 py-6 text-center text-sm text-ink-muted">
              {loading ? "Buscando..." : emptyMessage}
            </li>
          )}
        </ul>
      </div>

      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
