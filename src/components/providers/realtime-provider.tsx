"use client";

import { PortalProvider } from "@portalsdk/react";
import { createContext, useContext, type ReactNode } from "react";

import { fetchPortalToken, getPortalClient } from "@/lib/realtime/portal-client";

type HouseholdContext = {
  householdId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
};

const Ctx = createContext<HouseholdContext | null>(null);

/**
 * Envuelve la zona autenticada: monta el cliente Portal con el token del
 * servidor y deja a mano la casa activa, que es lo que arma cada channelId.
 *
 * Va aquí y no en el layout raíz a propósito: la landing es pública y no tiene
 * por qué abrir un socket ni pedir un token que no puede obtener.
 */
export function RealtimeProvider({
  children,
  ...household
}: HouseholdContext & { children: ReactNode }) {
  return (
    <PortalProvider client={getPortalClient()} token={fetchPortalToken}>
      <Ctx.Provider value={household}>{children}</Ctx.Provider>
    </PortalProvider>
  );
}

export function useHousehold(): HouseholdContext {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error("useHousehold debe usarse dentro de <RealtimeProvider>");
  }
  return value;
}
