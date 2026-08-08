"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui";

import { useCartCount } from "./cart-count";
import { isActiveHref, NAV_GROUPS, type NavItem } from "./nav-items";

/**
 * Navegación lateral, estilo Polaris: agrupada, densa, sin adornos.
 *
 * Tres formas según el ancho:
 *  * < 640 px: no existe (manda `BottomBar`).
 *  * 640–1024 px: rail de iconos, el texto viaja en `title` y en `sr-only`.
 *  * ≥ 1024 px: iconos + etiquetas + encabezados de grupo.
 */
export function SideNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de la app"
      className={cn(
        "hidden shrink-0 flex-col gap-6 border-r border-border-subtle bg-surface",
        // Se queda fija mientras el contenido de la derecha hace scroll.
        "sticky top-0 h-dvh overflow-y-auto",
        "px-2 py-5 sm:flex sm:w-16 lg:w-60 lg:px-3",
        className,
      )}
    >
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase lg:block">
            {group.title}
          </p>
          {/* En el rail el encabezado se convierte en una línea divisoria. */}
          <span aria-hidden="true" className="mx-2 mb-1 h-px bg-border-subtle lg:hidden" />

          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <SideNavLink item={item} active={isActiveHref(pathname, item.href)} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SideNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { count } = useCartCount();
  const Icon = item.icon;
  const showBadge = item.badge === "cart" && count > 0;

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-control text-sm font-medium",
        "transition-colors duration-150 ease-[var(--ease-out-soft)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        "h-10 justify-center gap-3 px-0 lg:justify-start lg:px-3",
        active
          ? "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
          : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
      )}
    >
      {/* Marca de página activa: pegada al borde izquierdo del panel. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 h-5 w-0.5 rounded-r-full transition-colors duration-150",
          active ? "bg-brand-600" : "bg-transparent",
        )}
      />

      <span className="relative">
        <Icon className={cn("size-5", active && "text-brand-700 dark:text-brand-200")} />
        {/* En el rail no cabe el número: solo un punto que avisa que hay algo. */}
        {showBadge ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-2 rounded-full bg-brand-600 ring-2 ring-surface lg:hidden"
          />
        ) : null}
      </span>

      <span className="hidden flex-1 truncate lg:block">{item.label}</span>
      <span className="sr-only lg:hidden">{item.label}</span>

      {showBadge ? (
        <span className="hidden min-w-5 rounded-full bg-brand-600 px-1.5 text-center text-[11px] leading-5 font-semibold text-white tabular-nums lg:block">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
