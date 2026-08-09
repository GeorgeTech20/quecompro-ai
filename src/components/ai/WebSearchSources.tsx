import { IconCheck, IconWorldSearch } from "@tabler/icons-react";

import type { Citation } from "./InlineCitations";

export function WebSearchSources({ sources }: { sources: Citation[] }) {
  if (sources.length === 0) return null;
  return (
    <details className="group mb-3 rounded-control border border-border-subtle bg-surface-sunken/70" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-ink marker:hidden">
        <IconWorldSearch className="size-4 text-brand-600" aria-hidden="true" />
        Búsqueda web completada
        <span className="ml-auto text-ink-muted">{sources.length} fuentes</span>
      </summary>
      <ul className="grid gap-1 border-t border-border-subtle px-3 py-2">
        {sources.map((source) => (
          <li key={source.href} className="flex min-w-0 items-center gap-2 text-xs text-ink-muted">
            <IconCheck className="size-3.5 shrink-0 text-grade-a" aria-hidden="true" />
            <span className="truncate">{source.label}</span>
            {source.detail ? <span className="ml-auto shrink-0 tabular-nums">{source.detail}</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}
