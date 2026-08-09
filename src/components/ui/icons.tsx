import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconInfoCircle,
  IconLoader2,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { cn } from "./cn";

/**
 * Iconos propios del design system sobre Tabler Icons (misma familia que el
 * esqueleto de la app). Heredan el color del texto con `currentColor` y el
 * tamaño se controla con utilidades (`size-4`, `size-5`...).
 */

export type IconProps = {
  className?: string;
  /** Los iconos son decorativos por defecto; pásale un título si carga sentido. */
  title?: string;
};

export function SearchIcon(props: IconProps) {
  return (
    <IconSearch
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconX
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconCheck
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconChevronDown
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconAlertTriangle
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <IconInfoCircle
      className={props.className}
      aria-hidden={props.title ? undefined : true}
      title={props.title}
    />
  );
}

/** Spinner: el único icono que anima, para estados `loading`. */
export function SpinnerIcon({ className, title }: IconProps) {
  return (
    <IconLoader2
      className={cn("size-4 shrink-0 animate-spin", className)}
      aria-hidden={title ? undefined : true}
      title={title}
    />
  );
}