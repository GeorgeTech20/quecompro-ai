import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconCalendar,
  IconClock,
  IconCopy,
  IconFlame,
  IconHome,
  IconLeaf,
  IconPlus,
  IconReceipt,
  IconSend,
  IconSettings,
  IconShoppingCart,
  IconSparkles,
  IconUsers,
  IconBrandWhatsapp,
  IconBasket,
} from "@tabler/icons-react";

import { cn } from "@/components/ui";

/**
 * Iconos del esqueleto de la app (navegación y cabecera) sobre Tabler Icons.
 * El design system (`src/components/ui/icons.tsx`) usa la misma familia, así
 * no se nota el corte entre navegación y controles.
 */

export type ShellIconProps = {
  className?: string;
  /** Decorativos por defecto; con título pasan a tener rol de imagen. */
  title?: string;
};

export function HomeIcon(props: ShellIconProps) {
  return <IconHome className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function CartIcon(props: ShellIconProps) {
  return <IconShoppingCart className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function BasketIcon(props: ShellIconProps) {
  return <IconBasket className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function SparkIcon(props: ShellIconProps) {
  return <IconSparkles className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function CalendarIcon(props: ShellIconProps) {
  return <IconCalendar className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function ReceiptIcon(props: ShellIconProps) {
  return <IconReceipt className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function UsersIcon(props: ShellIconProps) {
  return <IconUsers className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function BellIcon(props: ShellIconProps) {
  return <IconBell className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function SettingsIcon(props: ShellIconProps) {
  return <IconSettings className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function CopyIcon(props: ShellIconProps) {
  return <IconCopy className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function WhatsappIcon(props: ShellIconProps) {
  return <IconBrandWhatsapp className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function ArrowRightIcon(props: ShellIconProps) {
  return <IconArrowRight className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function ArrowLeftIcon(props: ShellIconProps) {
  return <IconArrowLeft className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function PlusIcon(props: ShellIconProps) {
  return <IconPlus className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function SendIcon(props: ShellIconProps) {
  return <IconSend className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function ClockIcon(props: ShellIconProps) {
  return <IconClock className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function FlameIcon(props: ShellIconProps) {
  return <IconFlame className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}

export function LeafIcon(props: ShellIconProps) {
  return <IconLeaf className={cn("size-5 shrink-0", props.className)} aria-hidden={props.title ? undefined : true} />;
}