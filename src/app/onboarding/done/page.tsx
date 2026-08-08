import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { pricePer100g, unitLabel } from "@/components/shell/format";
import { findProducts, resolveViewer, safeLoad } from "@/components/shell/server-data";
import { Badge, Card, formatPEN, HealthChip, Money } from "@/components/ui";
import type { ProductRow } from "@/types/db";

import { FirstItemForm } from "../Forms";

export const metadata: Metadata = { title: "Listo" };

/**
 * Último paso: el resumen y un primer item ya elegido.
 *
 * El pollo entero no es casual — es el producto con el que la IA se luce:
 * tiene precio en tres tiendas y nota de salud A.
 */
export default async function DonePage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");
  if (!viewer.household) redirect("/onboarding/household");

  const suggestions = await safeLoad<ProductRow[]>(
    () => findProducts("pollo entero", { limit: 1 }),
    [],
    "onboarding:sugerencia",
  );
  const suggested = suggestions[0] ?? null;
  const per100 = suggested ? pricePer100g(suggested.price, suggested.unit) : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Listo, {viewer.household.name} ya existe
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          Presupuesto de <Money value={viewer.household.monthly_budget} round /> al mes. Lo que
          agregues al carrito aparece al toque en la pantalla de los demás.
        </p>
      </div>

      {suggested ? (
        <Card padding="md" className="flex items-center gap-3 bg-surface-sunken">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              {suggested.name}
              {suggested.health_grade ? (
                <HealthChip grade={suggested.health_grade} size="sm" showLabel={false} />
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              <Money value={suggested.price} /> por {unitLabel(suggested.unit)}
              {per100 !== null ? ` · ${formatPEN(per100)} por 100 g` : ""}
            </p>
          </div>
          <Badge tone="neutral">{suggested.store}</Badge>
        </Card>
      ) : null}

      <FirstItemForm
        productId={suggested?.id ?? null}
        productName={suggested?.name ?? null}
      />
    </div>
  );
}
