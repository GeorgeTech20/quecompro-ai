"use client";

import { useMemo } from "react";

import { useHousehold } from "@/components/providers/realtime-provider";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { Card, CardHeader, CardTitle, EmptyState, SearchIcon } from "@/components/ui";
import { useCartPresence } from "@/hooks/use-cart-presence";
import { useLiveCart, type CartVerdict, type LiveCartSeedItem } from "@/hooks/use-live-cart";

import { AddItemBar } from "./AddItemBar";
import { AiVerdictCard } from "./AiVerdictCard";
import { BudgetAlert } from "./BudgetAlert";
import { CartItemRow } from "./CartItemRow";
import { CartTotal, projectMonthEnd, type BudgetSnapshot } from "./CartTotal";
import { ConnectionBadge } from "./ConnectionBadge";
import { PresenceBar } from "./PresenceBar";

/**
 * La pantalla del carrito compartido.
 *
 * El snapshot llega por props desde el server component y a partir de ahí todo
 * lo mueve el canal. Si Portal no conecta, `useLiveCart` sigue escribiendo en
 * Supabase y la pantalla funciona igual: lo único que se pierde es ver lo del
 * otro al instante.
 */

export type CartViewProps = {
  householdName: string;
  seedItems: LiveCartSeedItem[];
  budget: BudgetSnapshot;
};

export function CartView({ householdName, seedItems, budget }: CartViewProps) {
  // `RealtimeProvider` y `ToastProvider` los monta `AppShell`; aquí solo se
  // consumen. El "Deshacer" del borrado sale por el toast de la app.
  const household = useHousehold();

  const cart = useLiveCart(household.householdId, seedItems);
  const presence = useCartPresence(household.householdId, {
    name: household.displayName,
    avatarUrl: household.avatarUrl,
  });

  const latestVerdict: CartVerdict | null = cart.latestVerdictItemId
    ? (cart.verdicts[cart.latestVerdictItemId] ?? null)
    : null;

  const verdictItemTitle = useMemo(() => {
    if (!latestVerdict) return undefined;
    return cart.items.find((item) => item.id === latestVerdict.itemId)?.title;
  }, [latestVerdict, cart.items]);

  const spent = Math.round((budget.transactionsTotal + cart.total) * 100) / 100;
  const projected = projectMonthEnd(spent, budget.dayOfMonth, budget.daysInMonth);

  async function handleSwap(verdict: CartVerdict) {
    if (!verdict.cheaper) return;
    await cart.swapItem(verdict.itemId, verdict.cheaper);
  }

  return (
    <PageShell>
      <PageHeader
        title="Carrito"
        description={`Lo que compran en ${householdName}. Todo lo que agreguen aparece en las dos pantallas al instante.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PresenceBar
              others={presence.others}
              count={presence.count}
              aggregate={presence.aggregate}
              typing={presence.typing}
            />
            <ConnectionBadge status={cart.status} />
          </div>
        }
      />

      <AddItemBar
        householdId={household.householdId}
        onAdd={cart.addItem}
        onTyping={presence.sendTyping}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Card className="overflow-hidden">
          <CardHeader
            actions={
              <span className="text-[13px] text-ink-muted">
                {cart.itemCount === 1 ? "1 línea" : `${cart.itemCount} líneas`}
              </span>
            }
          >
            <CardTitle subtitle="Todo lo que agreguen aparece aquí al instante.">
              Lista de la casa
            </CardTitle>
          </CardHeader>

          {cart.items.length === 0 ? (
            <EmptyState
              illustration={<SearchIcon className="size-6" />}
              title="El carrito está vacío"
              description="Escribe arriba lo que necesitan esta semana. Tu roomie lo verá aparecer sin recargar."
            />
          ) : (
            <ul>
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  verdict={cart.verdicts[item.id]}
                  quotes={cart.quotes[item.id]}
                  pricePending={cart.pricePending[item.id]}
                  onQty={cart.setQty}
                  onRemove={cart.removeItem}
                  onRequestPrices={cart.requestPrices}
                />
              ))}
            </ul>
          )}
        </Card>

        <aside className="flex flex-col gap-4">
          <CartTotal
            total={cart.total}
            itemCount={cart.itemCount}
            budget={budget}
            outOfSync={cart.outOfSync}
          />

          <BudgetAlert spent={spent} budget={budget.budget} projected={projected} />

          {latestVerdict ? (
            <AiVerdictCard
              verdict={latestVerdict}
              itemTitle={verdictItemTitle}
              onSwap={handleSwap}
            />
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
