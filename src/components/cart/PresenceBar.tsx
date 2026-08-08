"use client";

import { Avatar, cn, LiveDot } from "@/components/ui";
import type { CartWatcher } from "@/hooks/use-cart-presence";

/**
 * Quién más está mirando. Es la mitad de la promesa del producto: si nadie
 * dice que tu roomie está ahí, el carrito compartido parece un carrito normal.
 */

export type PresenceBarProps = {
  others: CartWatcher[];
  /** Total en el canal, incluido quien mira esta pantalla. */
  count: number;
  /** El servidor solo manda el conteo: no hay nombres que enseñar. */
  aggregate: boolean;
  /** Ids de quienes están escribiendo en el chat. */
  typing?: readonly string[];
  className?: string;
};

/** "Sofi", "Sofi y Luis", "Sofi, Luis y 2 más". */
function nameList(watchers: CartWatcher[]): string {
  const names = watchers.map((watcher) => watcher.name);
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}

function sentence(others: CartWatcher[], count: number, aggregate: boolean): string {
  if (aggregate) {
    const otherCount = Math.max(count - 1, 0);
    if (otherCount === 0) return "Solo tú por aquí";
    if (otherCount === 1) return "1 persona más viendo el carrito";
    return `${otherCount} personas viendo el carrito`;
  }

  if (others.length === 0) return "Solo tú por aquí";
  if (others.length === 1) return `${others[0]?.name} está viendo el carrito`;
  if (others.length === 2) return `${nameList(others)} están viendo el carrito`;
  return `${others.length} personas viendo el carrito`;
}

const STACK_LIMIT = 4;

export function PresenceBar({
  others,
  count,
  aggregate,
  typing = [],
  className,
}: PresenceBarProps) {
  const visible = others.slice(0, STACK_LIMIT);
  const overflow = others.length - visible.length;
  const alone = aggregate ? count <= 1 : others.length === 0;

  const typingNames = others
    .filter((watcher) => typing.includes(watcher.id))
    .map((watcher) => watcher.name);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {visible.length > 0 ? (
        <div className="flex -space-x-2" aria-hidden="true">
          {visible.map((watcher) => (
            <Avatar
              key={watcher.id}
              size="sm"
              name={watcher.name}
              src={watcher.avatarUrl}
              id={watcher.id}
              live
              className="ring-offset-canvas"
            />
          ))}
          {overflow > 0 ? (
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full border border-border-subtle",
                "bg-surface-sunken text-xs font-semibold text-ink-muted",
              )}
            >
              +{overflow}
            </span>
          ) : null}
        </div>
      ) : null}

      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
        {!alone ? <LiveDot size="sm" label="Hay gente conectada" /> : null}
        <span aria-live="polite">
          {typingNames.length > 0
            ? `${nameList(others.filter((w) => typing.includes(w.id)))} está escribiendo…`
            : sentence(others, count, aggregate)}
        </span>
      </span>
    </div>
  );
}
