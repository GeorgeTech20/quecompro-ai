"use client";

import { IconArrowUp, IconPaperclip, IconWorldSearch } from "@tabler/icons-react";
import { useRef } from "react";

import { cn } from "@/components/ui";

export function AgentComposer({
  value,
  onChange,
  onSubmit,
  onTyping,
  pending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTyping?: () => void;
  pending?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  return (
    <form
      className="rounded-[20px] border border-border-strong bg-surface p-2 shadow-[0_5px_0_rgba(20,42,58,0.10)] focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        rows={1}
        maxLength={1000}
        placeholder="Pregunta qué comprar, compara precios o arma una comida"
        aria-label="Mensaje para el asistente"
        className="max-h-32 min-h-12 w-full resize-none bg-transparent px-2.5 py-2 text-sm leading-6 text-ink outline-none placeholder:text-ink-faint"
        onChange={(event) => {
          onChange(event.target.value);
          onTyping?.();
          event.currentTarget.style.height = "auto";
          event.currentTarget.style.height = `${Math.min(128, event.currentTarget.scrollHeight)}px`;
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="flex items-center gap-2 px-1 pb-1">
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="grid size-9 place-items-center rounded-full text-ink-muted transition hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          aria-label="Adjuntar contexto"
        >
          <IconPaperclip className="size-4.5" aria-hidden="true" />
        </button>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-sky-100 px-2.5 text-xs font-semibold text-sky-900">
          <IconWorldSearch className="size-3.5" aria-hidden="true" />
          Web y tiendas
        </span>
        <span className="ml-auto hidden text-[11px] text-ink-faint sm:block">Enter para enviar</span>
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          aria-label="Enviar mensaje"
          className={cn(
            "qc-tactile-primary grid size-10 place-items-center rounded-full text-white",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <IconArrowUp className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
