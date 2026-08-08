"use client";

import { useState } from "react";

import { Chip, cn, Input } from "@/components/ui";

/**
 * Campo de etiquetas: sugerencias de un toque + escribir la tuya.
 *
 * El valor viaja al server action en un `input` oculto separado por comas, así
 * el formulario sigue siendo un `<form action={...}>` normal y no hace falta
 * serializar estado a mano.
 */
export function ChipListField({
  name,
  label,
  hint,
  suggestions,
  initial,
  placeholder = "Escribe y pulsa Enter",
}: {
  name: string;
  label: string;
  hint?: string;
  suggestions: readonly string[];
  initial: readonly string[];
  placeholder?: string;
}) {
  const [values, setValues] = useState<string[]>([...initial]);
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const value = raw.trim();
    if (value.length === 0 || value.length > 40) return;
    setValues((current) =>
      current.some((entry) => entry.toLowerCase() === value.toLowerCase())
        ? current
        : [...current, value],
    );
    setDraft("");
  }

  function remove(value: string) {
    setValues((current) => current.filter((entry) => entry !== value));
  }

  const available = suggestions.filter(
    (suggestion) => !values.some((value) => value.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2.5">
      <input type="hidden" name={name} value={values.join(",")} />

      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
      </div>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li key={value}>
              <Chip tone="brand" onRemove={() => remove(value)} removeLabel={`Quitar ${value}`}>
                {value}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}

      {available.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {available.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => add(suggestion)}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border border-dashed border-border-strong",
                  "bg-transparent px-3 text-[13px] text-ink-muted",
                  "transition-colors duration-150 hover:border-brand-600 hover:text-brand-700",
                  "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
                )}
              >
                + {suggestion}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            // Enter dentro de un formulario lo enviaría: aquí solo agrega.
            event.preventDefault();
            add(draft);
          }
          if (event.key === "Backspace" && draft.length === 0 && values.length > 0) {
            remove(values[values.length - 1]);
          }
        }}
        onBlur={() => add(draft)}
        placeholder={placeholder}
        aria-label={label}
        inputSize="sm"
      />
    </div>
  );
}
