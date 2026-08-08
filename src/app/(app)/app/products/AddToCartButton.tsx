"use client";

import { useState, useTransition } from "react";

import { PlusIcon } from "@/components/shell/icons";
import { Button, CheckIcon, useToast } from "@/components/ui";

import { addProductToCart } from "./actions";

/**
 * Botón "Agregar" de la tarjeta del catálogo.
 *
 * Hace dos cosas seguidas y en ese orden: la alta (server action, que además
 * publica en el canal) y luego el pedido de veredicto a la IA. El veredicto es
 * best-effort: si falla, el item ya está en el carrito de todos igual.
 */
export function AddToCartButton({
  productId,
  householdId,
  title,
  price,
}: {
  productId: string;
  householdId: string;
  title: string;
  price: number;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const { toast } = useToast();

  function handleClick() {
    startTransition(async () => {
      const result = await addProductToCart(productId);

      if (!result.ok) {
        toast({ title: "No se pudo agregar", description: result.error, tone: "critical" });
        return;
      }

      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);

      toast({
        title: `${result.title} al carrito`,
        description: "Ya le apareció a los demás en su pantalla.",
        tone: "success",
      });

      // La IA opina aparte: nota de salud, alternativa más barata y alerta de
      // presupuesto viajan por el canal, no por esta respuesta.
      try {
        await fetch("/api/ai/evaluate-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            householdId,
            itemId: result.itemId,
            productId,
            title,
            price,
            qty: 1,
          }),
        });
      } catch {
        // Sin veredicto no pasa nada: el carrito ya está actualizado.
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={added ? "secondary" : "primary"}
      loading={pending}
      onClick={handleClick}
      iconLeft={added ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
      aria-label={`Agregar ${title} al carrito`}
    >
      {added ? "Agregado" : "Agregar"}
    </Button>
  );
}
