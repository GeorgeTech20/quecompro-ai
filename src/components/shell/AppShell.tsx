"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui";
import { PortalBoundary } from "@/components/providers/PortalBoundary";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

import { BottomBar } from "./BottomBar";
import { CartCountProvider } from "./cart-count";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

export type AppShellProps = {
  householdId: string;
  householdName: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  /** Conteo servido por el servidor; el canal lo mantiene al día después. */
  initialCartCount: number;
  children: ReactNode;
};

/**
 * Esqueleto de la zona autenticada.
 *
 * Orden de los envoltorios, que importa:
 *  1. `RealtimeProvider` — abre el cliente Portal y publica la casa activa.
 *  2. `CartCountProvider` — necesita el cliente, y la navegación necesita el
 *     contador, así que va entre medio.
 *  3. `ToastProvider` — lo usan tanto la navegación como cada pantalla.
 */
export function AppShell({
  householdId,
  householdName,
  userId,
  displayName,
  avatarUrl,
  initialCartCount,
  children,
}: AppShellProps) {
  return (
    <RealtimeProvider
      householdId={householdId}
      userId={userId}
      displayName={displayName}
      avatarUrl={avatarUrl}
    >
      <CartCountProvider householdId={householdId} initialCount={initialCartCount}>
        <ToastProvider placement="bottom-right">
          <div className="flex min-h-dvh flex-1 gap-0 bg-[#e9eaec]">
            <SideNav householdName={householdName} />

            <div className="flex min-w-0 flex-1 flex-col bg-surface">
              <TopBar householdName={householdName} userId={userId} />

              {/* El padding inferior deja sitio a la píldora del móvil. */}
              {/* PortalBoundary aquí y no más arriba: si una pantalla revienta,
                  degrada a una tarjeta suave pero la navegación sigue viva para
                  moverse a otra parte y volver. */}
              <main className="min-w-0 flex-1 overflow-hidden bg-canvas pb-24 sm:pb-6 lg:rounded-tl-[34px]">
                <PortalBoundary>{children}</PortalBoundary>
              </main>
            </div>

            <BottomBar />
          </div>
        </ToastProvider>
      </CartCountProvider>
    </RealtimeProvider>
  );
}
