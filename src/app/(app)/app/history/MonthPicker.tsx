"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/components/ui";

/**
 * Filtro de mes del historial. Nativo a propósito: en el celular un `<select>`
 * abre la rueda del sistema, que es más rápida que cualquier menú que hagamos.
 */
export function MonthPicker({
  months,
  value,
}: {
  months: { key: string; label: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm font-medium text-ink">Mes</span>
      <select
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(() => {
            router.replace(`${pathname}?month=${next}`, { scroll: false });
          });
        }}
        className={cn(
          "h-10 rounded-control border border-border-strong bg-surface px-3 text-sm text-ink",
          "transition-colors duration-150 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/35 focus:outline-none",
          "disabled:opacity-60",
        )}
      >
        {months.map((month) => (
          <option key={month.key} value={month.key}>
            {month.label}
          </option>
        ))}
      </select>
    </label>
  );
}
