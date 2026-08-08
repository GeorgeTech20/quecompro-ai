"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { cn, SearchBox } from "@/components/ui";

/**
 * Buscador y filtros del catálogo.
 *
 * El estado vive en la URL, no en el componente: así el filtro se comparte por
 * link, sobrevive al refresh y la búsqueda la resuelve el servidor con la misma
 * consulta que usa la IA. El único estado local es el texto mientras se escribe.
 */
export function CatalogFilters({
  stores,
  categories,
}: {
  stores: string[];
  categories: { key: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const queryParam = params.get("q") ?? "";
  const store = params.get("store") ?? "";
  const category = params.get("cat") ?? "";

  const [query, setQuery] = useState(queryParam);

  // Si alguien navega atrás, la URL manda sobre lo que quedó escrito.
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  function push(next: { q?: string; store?: string; cat?: string }) {
    const search = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }

    const qs = search.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  // Rebote de 300 ms: escribir "pollo" no dispara cinco consultas.
  useEffect(() => {
    if (query === queryParam) return;
    const timer = window.setTimeout(() => push({ q: query }), 300);
    return () => window.clearTimeout(timer);
    // `push` se recrea en cada render; las dependencias reales son estas dos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, queryParam]);

  return (
    <div className="flex flex-col gap-3">
      <SearchBox
        value={query}
        onChange={setQuery}
        // `SearchBox` hereda el `onSubmit` del `<input>`, así que el parámetro
        // llega como unión con el evento nativo: se estrecha antes de usarlo.
        onSubmit={(value) => {
          if (typeof value === "string") push({ q: value });
        }}
        onClear={() => push({ q: "" })}
        loading={pending}
        inputSize="lg"
        label="Buscar en el catálogo"
        placeholder="Pollo, papa amarilla, arroz…"
      />

      <FilterRow
        legend="Tienda"
        options={stores.map((name) => ({ value: name, label: name }))}
        active={store}
        onSelect={(value) => push({ store: value })}
        allLabel="Todas"
      />

      <FilterRow
        legend="Categoría"
        options={categories.map((entry) => ({ value: entry.key, label: entry.label }))}
        active={category}
        onSelect={(value) => push({ cat: value })}
        allLabel="Todo"
      />
    </div>
  );
}

function FilterRow({
  legend,
  options,
  active,
  onSelect,
  allLabel,
}: {
  legend: string;
  options: { value: string; label: string }[];
  active: string;
  onSelect: (value: string) => void;
  allLabel: string;
}) {
  if (options.length === 0) return null;

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      {/* Scroll horizontal solo en esta fila de chips: la página nunca se mueve. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip label={allLabel} active={active === ""} onClick={() => onSelect("")} />
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={active === option.value}
            onClick={() => onSelect(active === option.value ? "" : option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-[13px] font-medium",
        "transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-border-subtle bg-surface-sunken text-ink hover:border-border-strong",
      )}
    >
      {label}
    </button>
  );
}
