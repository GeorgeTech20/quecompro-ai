"use client";

import { useChannel } from "@portalsdk/react";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";

import { channels, type CartEvent } from "@/lib/realtime/channels";

/**
 * Contador de items del carrito para la navegación.
 *
 * El esqueleto no puede leer el estado del carrito (esa pantalla es de otro
 * agente), así que se engancha al mismo canal y va sumando deltas sobre el
 * conteo que trajo el servidor. Así el badge late aunque el roomie agregue el
 * pollo desde su celular y tú estés en Historial.
 *
 * Dos cuidados:
 *  * `history: 50` es el mismo valor que usa la pantalla del carrito. El SDK
 *    devuelve el handle ya creado e ignora opciones distintas, así que pedir
 *    otra cosa desde aquí le cambiaría el backfill a la otra pantalla.
 *  * Por eso mismo llegan mensajes viejos del backfill: se descartan por
 *    timestamp anterior al montaje, o el contador se dispararía al entrar.
 */

type CartCountValue = {
  count: number;
  /** El socket está sano. `false` en "degraded-http": se publica pero no llega. */
  live: boolean;
};

const Ctx = createContext<CartCountValue>({ count: 0, live: false });

export function CartCountProvider({
  householdId,
  initialCount,
  children,
}: {
  householdId: string;
  initialCount: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const mountedAt = useRef(Date.now());

  const { status } = useChannel<CartEvent>({
    channelId: channels.cartUpdate(householdId),
    history: 50,
    readOn: "manual",
    onMessage: (message) => {
      if (message.timestamp < mountedAt.current) return;
      const event = message.content;
      switch (event.type) {
        case "item-added":
          setCount((current) => current + 1);
          return;
        case "item-removed":
          setCount((current) => Math.max(0, current - 1));
          return;
        case "cart-cleared":
          setCount(0);
          return;
        case "whatsapp-sync":
          setCount((current) => current + event.items.length);
          return;
        default:
      }
    },
  });

  return (
    <Ctx.Provider value={{ count, live: status === "ready" }}>{children}</Ctx.Provider>
  );
}

export function useCartCount(): CartCountValue {
  return useContext(Ctx);
}
