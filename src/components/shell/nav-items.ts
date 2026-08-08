import type { ComponentType } from "react";

import {
  BasketIcon,
  BellIcon,
  CalendarIcon,
  CartIcon,
  HomeIcon,
  ReceiptIcon,
  SettingsIcon,
  SparkIcon,
  UsersIcon,
  type ShellIconProps,
} from "./icons";

/**
 * Mapa de navegación de la app. Una sola fuente para la lateral, la barra
 * inferior y los títulos de cabecera: si mañana entra una ruta nueva, entra
 * aquí y aparece en los tres sitios sin tocarlos.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<ShellIconProps>;
  /** Texto corto para la barra inferior del móvil. */
  short: string;
  /** El badge del carrito es el único contador de la navegación. */
  badge?: "cart";
};

export type NavGroup = {
  /** Encabezado del grupo; se oculta cuando la lateral está colapsada. */
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "La compra",
    items: [
      { href: "/app", label: "Resumen", short: "Resumen", icon: HomeIcon },
      { href: "/app/cart", label: "Carrito", short: "Carrito", icon: CartIcon, badge: "cart" },
      { href: "/app/products", label: "Productos", short: "Productos", icon: BasketIcon },
    ],
  },
  {
    title: "Con la IA",
    items: [
      { href: "/app/chat", label: "Asistente", short: "Asistente", icon: SparkIcon },
      { href: "/app/plan", label: "Plan", short: "Plan", icon: CalendarIcon },
    ],
  },
  {
    title: "La casa",
    items: [
      { href: "/app/history", label: "Historial", short: "Historial", icon: ReceiptIcon },
      { href: "/app/collab", label: "Roomies", short: "Roomies", icon: UsersIcon },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/app/notifications", label: "Avisos", short: "Avisos", icon: BellIcon },
      { href: "/app/settings", label: "Ajustes", short: "Ajustes", icon: SettingsIcon },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Los cinco de la barra inferior, en el orden en que se usan de verdad. */
export const BOTTOM_NAV_HREFS = [
  "/app",
  "/app/cart",
  "/app/chat",
  "/app/history",
  "/app/collab",
] as const;

export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_HREFS.map(
  (href) => ALL_NAV_ITEMS.find((item) => item.href === href),
).filter((item): item is NavItem => item !== undefined);

/**
 * `/app` solo está activo en coincidencia exacta; el resto también con sus
 * subrutas, para que `/app/products/xyz` siga marcando "Productos".
 */
export function isActiveHref(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Título de la pantalla actual para la cabecera del móvil. */
export function labelForPath(pathname: string): string | undefined {
  return ALL_NAV_ITEMS.find((item) => isActiveHref(pathname, item.href))?.label;
}
