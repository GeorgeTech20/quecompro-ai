"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui";

import { useCartCount } from "./cart-count";
import { BOTTOM_NAV_ITEMS, isActiveHref } from "./nav-items";

/**
 * Barra inferior del móvil: píldora flotante, sin la raya divisoria de
 * antes. Cinco destinos, el pulgar los alcanza todos.
 *
 * Bajo 640 px la lateral desaparece y esta toma su lugar. El carrito lleva el
 * número de items porque es el único dato que cambia mientras no lo estás
 * mirando.
 */
export function BottomBar() {
  const pathname = usePathname();
  const { count } = useCartCount();

  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 rounded-card border border-border-subtle bg-surface/95 backdrop-blur shadow-raised",
        "pb-[env(safe-area-inset-bottom)] sm:hidden",
      )}
    >
      <ul className="grid grid-cols-5 px-1.5 py-1.5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActiveHref(pathname, item.href);
          const Icon = item.icon;
          const showBadge = item.badge === "cart" && count > 0;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-0.5 rounded-full",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset",
                  active ? "bg-brand-600 text-white shadow-raised" : "text-ink-muted",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {showBadge ? (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-brand-600 px-1",
                        "text-center text-[10px] leading-4 font-semibold text-white tabular-nums",
                        "ring-2 ring-surface",
                        active && "bg-brand-800",
                      )}
                    >
                      {count > 9 ? "9+" : count}
                      <span className="sr-only"> items en el carrito</span>
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] font-medium">{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}