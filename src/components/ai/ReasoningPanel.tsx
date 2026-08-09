"use client";

import { IconChevronDown, IconListSearch } from "@tabler/icons-react";

export function ReasoningPanel({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  return (
    <details className="group min-w-0 max-w-[92%] rounded-card border border-border-subtle bg-surface shadow-sm" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-ink marker:hidden">
        <span aria-hidden="true" className="flex gap-1">
          {[0, 160, 320].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
              className="animate-live-dot size-1.5 rounded-full bg-brand-600"
            />
          ))}
        </span>
        Pensando
        <IconChevronDown className="ml-auto size-4 text-ink-faint transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <div className="border-t border-border-subtle px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <IconListSearch className="size-4 text-brand-600" aria-hidden="true" />
          {label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{hint}</p>
        <p className="mt-2 text-[11px] text-ink-faint">Mostramos el avance, no el razonamiento privado del modelo.</p>
      </div>
    </details>
  );
}
