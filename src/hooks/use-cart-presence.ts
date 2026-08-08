"use client";

import type { ChannelStatus } from "@portalsdk/core";
import { useChannel } from "@portalsdk/react";
import { useCallback, useMemo } from "react";

import { channels, type CartEvent } from "@/lib/realtime/channels";

/**
 * Quién está mirando el carrito ahora mismo.
 *
 * Canal aparte del de updates a propósito: la presencia cambia mucho más que el
 * carrito y mezclarlas obligaría a re-renderizar la lista cada vez que alguien
 * abre o cierra la pestaña.
 */

export type CartWatcher = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type UseCartPresenceResult = {
  /** Los demás; nunca incluye a quien está mirando esta pantalla. */
  others: CartWatcher[];
  /**
   * Total de personas en el canal, yo incluido. Con presencia agregada es lo
   * único que hay: `others` viene vacío y esto sigue siendo cierto.
   */
  count: number;
  /** El servidor solo manda el conteo: no hay lista de participantes. */
  aggregate: boolean;
  typing: readonly string[];
  sendTyping: () => void;
  status: ChannelStatus;
};

/** La metadata de presencia es texto libre del cliente: se lee con cuidado. */
function readWatcher(
  id: string,
  username: string | undefined,
  metadata: Record<string, unknown> | undefined,
): CartWatcher {
  const rawName = metadata?.name;
  const rawAvatar = metadata?.avatarUrl;
  return {
    id,
    name: typeof rawName === "string" && rawName.length > 0 ? rawName : (username ?? "Alguien"),
    avatarUrl: typeof rawAvatar === "string" ? rawAvatar : null,
  };
}

export function useCartPresence(
  householdId: string,
  self: { name: string; avatarUrl?: string | null },
): UseCartPresenceResult {
  const { presence, typing, sendTyping, me, status } = useChannel<CartEvent>({
    channelId: channels.cartPresence(householdId),
    history: "none",
    metadata: { name: self.name, avatarUrl: self.avatarUrl ?? null },
  });

  const others = useMemo<CartWatcher[]>(() => {
    // `presence` es una unión: sin discriminar por `kind`, `participants` no
    // existe en la rama agregada y leerlo sería un error de tipos, no un bug
    // en runtime.
    if (!presence || presence.kind !== "detailed") return [];

    const selfId = me?.id;
    return presence.participants
      .filter((participant) => participant.id !== selfId)
      .map((participant) =>
        readWatcher(participant.id, participant.username, participant.metadata),
      );
  }, [presence, me?.id]);

  const throttledTyping = useCallback(() => {
    // El SDK ya limita la frecuencia; aquí solo se evita llamar sin canal.
    sendTyping();
  }, [sendTyping]);

  return {
    others,
    count: presence?.count ?? 0,
    aggregate: presence?.kind === "aggregate",
    typing,
    sendTyping: throttledTyping,
    status,
  };
}
