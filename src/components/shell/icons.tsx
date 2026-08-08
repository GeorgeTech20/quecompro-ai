import { cn } from "@/components/ui";

/**
 * Iconos del esqueleto de la app (navegación y cabecera).
 *
 * El design system (`src/components/ui/icons.tsx`) solo trae los iconos de sus
 * propios controles y no es de este agente, así que los de navegación viven
 * aquí. Mismo trazo (24×24, `currentColor`, stroke 1.75) para que no se note el
 * corte entre una familia y otra.
 */

export type ShellIconProps = {
  className?: string;
  /** Decorativos por defecto; con título pasan a tener rol de imagen. */
  title?: string;
};

function Svg({
  children,
  className,
  title,
}: ShellIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={cn("size-5 shrink-0", className)}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function HomeIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-5.5h4V21h3.5a1 1 0 0 0 1-1V9.5" />
    </Svg>
  );
}

export function CartIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 3.5h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L20 7H6" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </Svg>
  );
}

export function BasketIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8Z" />
      <path d="m8 9 2.5-5M16 9l-2.5-5" />
      <path d="M9.5 13v3M14.5 13v3" />
    </Svg>
  );
}

export function SparkIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 13.7 8l4.5 1.7-4.5 1.7L12 16l-1.7-4.6L5.8 9.7 10.3 8Z" />
      <path d="M18.5 15.5 19.3 18l2.2.9-2.2.8-.8 2.3-.8-2.3-2.2-.8 2.2-.9Z" />
    </Svg>
  );
}

export function CalendarIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <rect x="3.2" y="5" width="17.6" height="16" rx="2.2" />
      <path d="M3.2 10h17.6M8 3v4M16 3v4" />
      <path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2" />
    </Svg>
  );
}

export function ReceiptIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M5 21V4.5a1 1 0 0 1 1.5-.9L9 5l2.5-1.4a1 1 0 0 1 1 0L15 5l2.5-1.4a1 1 0 0 1 1.5.9V21l-2.5-1.4a1 1 0 0 0-1 0L13 21l-2.5-1.4a1 1 0 0 0-1 0Z" />
      <path d="M9 9.5h6M9 13.5h4" />
    </Svg>
  );
}

export function UsersIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <circle cx="9.5" cy="8" r="3.4" />
      <path d="M3.5 20a6 6 0 0 1 12 0" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.4A6 6 0 0 1 21 20" />
    </Svg>
  );
}

export function BellIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M18 9a6 6 0 1 0-12 0c0 4.2-1.5 5.6-2 6.2-.3.4 0 1 .5 1h15c.5 0 .8-.6.5-1-.5-.6-2-2-2-6.2Z" />
      <path d="M10.2 19.5a2 2 0 0 0 3.6 0" />
    </Svg>
  );
}

export function SettingsIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 13h-.3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.5v-.3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.3.9Z" />
    </Svg>
  );
}

export function CopyIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11.5" height="11.5" rx="2" />
      <path d="M5.5 15H4.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1v1" />
    </Svg>
  );
}

export function WhatsappIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8.2 19.6Z" />
      <path d="M9 9c.3 1.6 1.2 3 2.5 4s2.6 1.4 3.6 1.5c.4 0 .8-.4.9-.8l.2-.9-2-1-.9.9c-.9-.4-1.7-1.1-2.2-2l.9-.9-1-2-.9.2c-.5.1-.9.5-1.1 1Z" />
    </Svg>
  );
}

export function ArrowRightIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M19.5 12h-15M10.5 18l-6-6 6-6" />
    </Svg>
  );
}

export function PlusIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function SendIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="m4 12 16-7.5-4.5 16L12 14Z" />
      <path d="m12 14 8-9.5" />
    </Svg>
  );
}

export function ClockIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

export function FlameIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21a5.5 5.5 0 0 0 5.5-5.5c0-4-3.5-5.5-3-9.5-2 .8-3.6 2.4-4 4.5-1-.6-1.6-1.6-1.7-2.8A6.9 6.9 0 0 0 6.5 15.5 5.5 5.5 0 0 0 12 21Z" />
    </Svg>
  );
}

export function LeafIcon(props: ShellIconProps) {
  return (
    <Svg {...props}>
      <path d="M20 4c-9 0-14 3.5-14 9.5a6.5 6.5 0 0 0 2 4.7C10 14 13.5 11 18 9.5c-3.5 2.4-6.6 5.5-8 10.5" />
    </Svg>
  );
}
