"use client";

import type { ChannelStatus } from "@portalsdk/core";

import { AlertIcon, cn, LiveDot, SpinnerIcon } from "@/components/ui";

/**
 * El estado del socket, en español y sin dramatismo.
 *
 * `degraded-http` **no es un error**: el socket se cayó pero publicar sigue
 * funcionando por HTTP, así que agregar, borrar y cambiar cantidades funciona
 * igual — solo que lo de los demás puede tardar en verse. Se dice
 * "reconectando", no "sin conexión". El único fallo real es `blocked`.
 */

export type ConnectionBadgeProps = {
  status: ChannelStatus;
  portalConfigured?: boolean;
  className?: string;
};

type Look = {
  text: string;
  detail: string;
  icon: "live" | "spinner" | "alert";
  tone: string;
};

const LOOK: Record<ChannelStatus, Look> = {
  idle: {
    text: "Sin conectar",
    detail: "El carrito funciona igual; los cambios se guardan.",
    icon: "alert",
    tone: "text-ink-faint",
  },
  connecting: {
    text: "Conectando…",
    detail: "Buscando a los demás.",
    icon: "spinner",
    tone: "text-ink-muted",
  },
  ready: {
    text: "En vivo",
    detail: "Todos ven los cambios al instante.",
    icon: "live",
    tone: "text-grade-a",
  },
  reconnecting: {
    text: "Reconectando…",
    detail: "Puedes seguir usando el carrito.",
    icon: "spinner",
    tone: "text-ink-muted",
  },
  degraded: {
    text: "En vivo",
    detail: "Algunos extras van con retraso.",
    icon: "live",
    tone: "text-grade-a",
  },
  "degraded-http": {
    text: "Reconectando…",
    detail: "Tus cambios siguen llegando; lo de los demás puede tardar.",
    icon: "spinner",
    tone: "text-ink-muted",
  },
  blocked: {
    text: "Sin tiempo real",
    detail: "El carrito se guarda igual. Recarga para reintentar.",
    icon: "alert",
    tone: "text-warning",
  },
};

export function ConnectionBadge({
  status,
  portalConfigured = true,
  className,
}: ConnectionBadgeProps) {
  const look = LOOK[status];
  const detail =
    status === "blocked" && !portalConfigured
      ? "Falta NEXT_PUBLIC_PORTAL_PUBLISHABLE_KEY en .env.local."
      : look.detail;

  return (
    <span
      title={detail}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-chip border border-border-subtle bg-surface",
        "h-7 px-2.5 text-[12px] font-medium",
        look.tone,
        className,
      )}
    >
      {look.icon === "live" ? <LiveDot size="sm" label="Conectado en vivo" /> : null}
      {look.icon === "spinner" ? <SpinnerIcon className="size-3.5" /> : null}
      {look.icon === "alert" ? <AlertIcon className="size-3.5" /> : null}
      <span>{look.text}</span>
      <span className="sr-only">{detail}</span>
    </span>
  );
}
