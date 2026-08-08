import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PantryView } from "@/components/pantry";
import { LeafIcon } from "@/components/shell/icons";
import { LinkButton } from "@/components/shell/LinkButton";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { requireHouseholdViewer } from "@/components/shell/server-data";
import { Card, EmptyState } from "@/components/ui";

import { rebuyPantryItem } from "./actions";
import { loadPantry } from "./pantry-data";

export const metadata: Metadata = { title: "Despensa" };

/**
 * La despensa.
 *
 * Después de comprar, la comida existe en tu casa. El carrito contesta «qué voy
 * a comprar»; esta pantalla contesta lo que viene después: qué tengo y qué hago
 * con eso. Por eso el mueble y las recetas van juntos y no en dos rutas.
 */
export default async function DespensaPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const pantry = await loadPantry(viewer.household.id);

  return (
    <PageShell>
      <PageHeader
        title="Despensa"
        description="Lo que compraste este mes más lo que está en el carrito, acomodado por estante. El color de cada caja es su nota de salud: una despensa muy ámbar se ve antes de leerla."
        actions={
          <LinkButton href="/app/products" variant="secondary">
            Agregar productos
          </LinkButton>
        }
      />

      {!pantry.ok ? (
        <Card padding="md">
          <EmptyState
            illustration={<span className="text-2xl">🔌</span>}
            title="No pudimos abrir tu despensa"
            description="La base de datos no está respondiendo. Tus compras y tu carrito siguen guardados: vuelve a cargar en unos segundos."
            action={
              <LinkButton href="/app/despensa" size="sm">
                Reintentar
              </LinkButton>
            }
          />
        </Card>
      ) : pantry.snapshot.itemCount === 0 ? (
        <Card padding="md">
          <EmptyState
            illustration={<LeafIcon className="size-7" />}
            title="Tu despensa está vacía"
            description="Todavía no hay compras cerradas este mes ni nada en el carrito. Agrega un par de cosas y acá vas a ver el mueble llenarse, con las recetas que ya te alcanzan."
            action={
              <LinkButton href="/app/products" size="sm">
                Ver productos
              </LinkButton>
            }
            secondaryAction={
              <LinkButton href="/app/cart" size="sm" variant="secondary">
                Ir al carrito
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <PantryView snapshot={pantry.snapshot} onRebuy={rebuyPantryItem} />
      )}
    </PageShell>
  );
}
