"use client";

import { useId, useRef, useState } from "react";
import { cn } from "./cn";

export type TabItem = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Contador o badge a la derecha del label. */
  badge?: React.ReactNode;
  disabled?: boolean;
  /** Si viene, `Tabs` también pinta el panel. Si no, lo pinta el consumidor. */
  content?: React.ReactNode;
};

export type TabsVariant = "underline" | "pill";

export type TabsProps = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  variant?: TabsVariant;
  fitted?: boolean;
  className?: string;
  tabListClassName?: string;
  panelClassName?: string;
};

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  variant = "underline",
  fitted = false,
  className,
  tabListClassName,
  panelClassName,
}: TabsProps) {
  const autoId = useId();
  const base = `qc-tabs-${autoId}`;
  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = (id: string) => `${base}-panel-${id}`;

  const firstEnabled = items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? "";
  const [internal, setInternal] = useState(defaultValue ?? firstEnabled);
  const active = value ?? internal;

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: string) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  function move(from: number, step: 1 | -1) {
    if (items.length === 0) return;
    let index = from;
    for (let hop = 0; hop < items.length; hop += 1) {
      index = (index + step + items.length) % items.length;
      const item = items[index];
      if (item && !item.disabled) {
        select(item.id);
        tabRefs.current[item.id]?.focus();
        return;
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(index, 1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        move(index, -1);
        return;
      case "Home":
        event.preventDefault();
        move(-1, 1);
        return;
      case "End":
        event.preventDefault();
        move(0, -1);
        return;
      default:
    }
  }

  const activeItem = items.find((item) => item.id === active);

  return (
    <div className={cn("flex flex-col", className)}>
      <div
        role="tablist"
        className={cn(
          "flex items-center gap-1",
          variant === "underline" && "border-b border-border-subtle",
          variant === "pill" && "rounded-control bg-surface-sunken p-1",
          fitted && "w-full",
          tabListClassName,
        )}
      >
        {items.map((item, index) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[item.id] = node;
              }}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={selected}
              aria-controls={item.content ? panelId(item.id) : undefined}
              // Roving tabindex: solo la pestaña activa entra en el orden de tabulación.
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                "disabled:cursor-not-allowed disabled:opacity-40",
                fitted && "flex-1 justify-center",
                variant === "underline" &&
                  cn(
                    "-mb-px border-b-2 px-3 py-2.5",
                    selected
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-ink-muted hover:border-border-strong hover:text-ink",
                  ),
                variant === "pill" &&
                  cn(
                    "rounded-[calc(var(--radius-control)-2px)] px-3 py-1.5",
                    selected
                      ? "bg-surface text-ink shadow-card"
                      : "text-ink-muted hover:text-ink",
                  ),
              )}
            >
              {item.icon}
              {item.label}
              {item.badge}
            </button>
          );
        })}
      </div>

      {activeItem?.content ? (
        <div
          role="tabpanel"
          id={panelId(activeItem.id)}
          aria-labelledby={tabId(activeItem.id)}
          tabIndex={0}
          className={cn(
            "pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
            panelClassName,
          )}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
