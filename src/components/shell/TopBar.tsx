"use client";

import { UserButton } from "@clerk/nextjs";
import { useInbox } from "@portalsdk/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn, LiveDot } from "@/components/ui";
import { channels, type InboxEvent } from "@/lib/realtime/channels";

import { useCartCount } from "./cart-count";
import { BellIcon } from "./icons";
import { labelForPath } from "./nav-items";

/**
 * Cabecera de la zona autenticada: dónde estás, si el canal está vivo, los
 * avisos sin leer y tu cuenta.
 *
 * El nombre de la casa manda porque es lo que distingue una pestaña de la otra
 * en la demo con dos pantallas.
 */
export function TopBar({
  householdName,
  userId,
}: {
  householdName: string;
  userId: string;
}) {
  const pathname = usePathname();
  const { live } = useCartCount();
  const screen = labelForPath(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface/95 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Link
            href="/app"
            className={cn(
              "truncate text-[15px] font-semibold text-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            )}
          >
            {householdName}
          </Link>

          <LiveDot
            active={live}
            label={live ? "Carrito en vivo" : "Reconectando con el carrito"}
          />

          {screen ? (
            <span className="truncate text-sm text-ink-muted sm:hidden">· {screen}</span>
          ) : null}
        </div>

        <InboxBell userId={userId} />

        <UserButton userProfileMode="modal" />
      </div>
    </header>
  );
}

function InboxBell({ userId }: { userId: string }) {
  // Vista acotada a la bandeja personal: `unseen` cuenta solo lo de este canal,
  // no todo lo que el usuario tenga abierto en la app.
  const { unseen, status } = useInbox<InboxEvent>({
    channelId: channels.userInbox(userId),
  });

  const pending = status === "ready" ? unseen : 0;

  return (
    <Link
      href="/app/notifications"
      aria-label={pending > 0 ? `Avisos: ${pending} sin leer` : "Avisos"}
      className={cn(
        "relative grid size-9 place-items-center rounded-control text-ink-muted",
        "transition-colors duration-150 hover:bg-surface-sunken hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
      )}
    >
      <BellIcon className="size-5" />
      {pending > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 right-1 min-w-4 rounded-full bg-danger px-1",
            "text-center text-[10px] leading-4 font-semibold text-white tabular-nums",
            "ring-2 ring-surface",
          )}
        >
          {pending > 9 ? "9+" : pending}
        </span>
      ) : null}
    </Link>
  );
}
