import { IconExternalLink } from "@tabler/icons-react";

export type Citation = { label: string; href: string; detail?: string };

export function InlineCitations({ sources }: { sources: Citation[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Fuentes verificadas">
      <span className="mr-1 text-[11px] font-semibold text-ink-muted">Fuentes</span>
      {sources.map((source, index) => (
        <a
          key={`${source.href}-${index}`}
          href={source.href}
          target="_blank"
          rel="noreferrer"
          title={source.detail}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 motion-reduce:transform-none"
        >
          <span className="grid size-4 place-items-center rounded-full bg-brand-100 text-[10px] text-brand-800">
            {index + 1}
          </span>
          {source.label}
          <IconExternalLink className="size-3 text-ink-faint" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
