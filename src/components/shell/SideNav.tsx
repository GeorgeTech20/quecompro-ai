"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/landing/Wordmark";
import { cn } from "@/components/ui";

import { useCartCount } from "./cart-count";
import { NAV_GROUPS, type NavItem } from "./nav-items";

/**
 * Navegación lateral a toda la altura, inspirada en el rail de Shopify:
 * superficie plana, grupos separados y una barra ámbar para la sección activa.
 *
 * Tres formas según el ancho:
 *  * < 640 px: no existe (manda `BottomBar`).
 *  * 640–1024 px: rail de iconos, el texto viaja en `title` y en `sr-only`.
 *  * ≥ 1024 px: iconos + etiquetas + encabezados de grupo.
 */
export function SideNav({ className, householdName }: { className?: string; householdName?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de la app"
      className={cn(
        "hidden shrink-0 flex-col gap-1.5 bg-surface",
        // Se queda fija mientras el contenido de la derecha hace scroll.
        "sticky top-0 h-dvh overflow-y-auto shadow-none",
        "p-2.5 sm:flex sm:w-[4.5rem] lg:w-64 lg:p-4",
        className,
      )}
    >
      <Link href="/app" className="mb-2 hidden items-center gap-3 rounded-card bg-surface-sunken/70 px-3 py-3 lg:flex">
        <span className="min-w-0">
          <BrandLockup className="text-sm" />
          <span className="block truncate text-xs text-ink-muted">{householdName ?? "Tu casa"}</span>
        </span>
        <span className="ml-auto text-xs text-ink-faint">⌄</span>
      </Link>
      {NAV_GROUPS.map((group, groupIndex) => (
        <div key={group.title} className="flex flex-col gap-1">
          {groupIndex > 0 ? <div className="h-2" aria-hidden="true" /> : null}
          <p className="hidden px-3 pb-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase lg:block">
            {group.title}
          </p>
          <ul className="flex flex-col gap-1">
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

function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === href || pathname === "/app/";
  return pathname === href || pathname.startsWith(`${href}/`);
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
        "group relative flex items-center gap-3 rounded-button text-sm font-medium",
        "transition-all duration-200 ease-[var(--ease-out-soft)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        "h-10 justify-center px-0 lg:justify-start lg:px-3.5",
        active
          ? "bg-brand-600 text-white shadow-raised before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-brand-600 lg:bg-surface-sunken lg:text-ink lg:shadow-none dark:lg:bg-brand-900/40 dark:lg:text-brand-100"
          : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
      )}
    >
      <span className="relative">
        <Icon className={cn("size-5", active && "lg:text-brand-700 dark:lg:text-brand-200")} />
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
