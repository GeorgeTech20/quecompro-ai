"use client";

import { IconBasket, IconNote } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useHousehold } from "@/components/providers/realtime-provider";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { Button, Card, CardHeader, CardTitle, EmptyState, SearchIcon } from "@/components/ui";
import { useCartPresence } from "@/hooks/use-cart-presence";
import { useLiveCart, type CartVerdict, type LiveCartSeedItem } from "@/hooks/use-live-cart";
import { isPortalPublishableConfigured } from "@/lib/realtime/portal-client";

import { AddItemBar } from "./AddItemBar";
import { AiVerdictCard } from "./AiVerdictCard";
import { BudgetAlert } from "./BudgetAlert";
import { CartItemRow } from "./CartItemRow";
import { CartTotal, projectMonthEnd, type BudgetSnapshot } from "./CartTotal";
import { ConnectionBadge } from "./ConnectionBadge";
import { PresenceBar } from "./PresenceBar";
import { PurchaseRunSheet } from "./PurchaseRunSheet";
import { TodayNoteSheet } from "./TodayNoteSheet";

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

  const portalConfigured = isPortalPublishableConfigured();
  const cart = useLiveCart(household.householdId, seedItems);
  const presence = useCartPresence(household.householdId, {
    name: household.displayName,
    avatarUrl: household.avatarUrl,
  });

  // "Modo compra": hoja a pantalla completa para el supermercado. El check ahí
  // es compra compartida con evidencia opcional.
  const [runOpen, setRunOpen] = useState(false);
  // "Nota de hoy": la misma lista pero de solo lectura, para mandarla o
  // imprimirla. Sale de la app; por eso no comparte pantalla con la otra.
  const [noteOpen, setNoteOpen] = useState(false);

  const checkedCount = cart.items.filter((item) => item.purchasedAt).length;

  async function toggleCheck(itemId: string) {
    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) return;
    await cart.setPurchased(itemId, item.purchasedAt == null);
  }

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
        title="Compra de hoy"
        description={`La lista compartida de ${householdName}. Marca lo que ya está en el canasto y agrega una nota cuando importe elegir bien.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PresenceBar
              others={presence.others}
              count={presence.count}
              aggregate={presence.aggregate}
              typing={presence.typing}
            />
            <ConnectionBadge status={cart.status} portalConfigured={portalConfigured} />
          </div>
        }
      />

      <div className="sticky top-[4.25rem] z-20 rounded-[18px] border border-sky-200 bg-white/95 p-2 shadow-[0_5px_0_rgba(20,42,58,0.08)] backdrop-blur sm:static sm:p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <AddItemBar
              householdId={household.householdId}
              onAdd={cart.addItem}
              onTyping={presence.sendTyping}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            className="shrink-0 max-sm:px-3"
            iconLeft={<IconNote className="size-4" />}
            onClick={() => setNoteOpen(true)}
            aria-label="Ver la nota de hoy a pantalla completa"
          >
            <span className="max-sm:hidden">Nota de hoy</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            className="shrink-0 max-sm:px-3"
            iconLeft={<IconBasket className="size-4" />}
            onClick={() => setRunOpen(true)}
          >
            <span className="max-sm:hidden">Modo compra</span>
            <span className="sm:hidden">Comprar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="qc-shopping-paper overflow-hidden rounded-panel max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0 max-sm:shadow-none">
          <CardHeader
            className="px-4 sm:px-5"
            actions={
              <span className="text-[13px] text-ink-muted">
                {cart.itemCount === 1 ? "1 producto" : `${cart.itemCount} productos`}
                {checkedCount > 0 ? ` · ${checkedCount} en el canasto` : ""}
              </span>
            }
          >
            <CardTitle subtitle="Una sola lista para todos en casa.">
              Lista compartida
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
                  householdId={household.householdId}
                  verdict={cart.verdicts[item.id]}
                  quotes={cart.quotes[item.id]}
                  pricePending={cart.pricePending[item.id]}
                  checked={item.purchasedAt != null}
                  onToggleCheck={toggleCheck}
                  onQty={cart.setQty}
                  onNote={cart.setNote}
                  onRemove={cart.removeItem}
                  onRequestPrices={cart.requestPrices}
                  onRecordPrice={cart.recordMarketPrice}
                />
              ))}
            </ul>
          )}
        </Card>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <CartTotal
            total={cart.total}
            itemCount={cart.itemCount}
            budget={budget}
            outOfSync={cart.outOfSync}
            className="rounded-panel"
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

      {noteOpen ? (
        <TodayNoteSheet
          householdName={householdName}
          items={cart.items}
          total={cart.total}
          onClose={() => setNoteOpen(false)}
        />
      ) : null}

      {runOpen ? (
        <PurchaseRunSheet
          householdName={householdName}
          items={cart.items}
          purchasePending={cart.purchasePending}
          purchaseFeed={cart.purchaseFeed}
          others={presence.others}
          presenceCount={presence.count}
          presenceAggregate={presence.aggregate}
          onClose={() => setRunOpen(false)}
          onSetPurchased={cart.setPurchased}
        />
      ) : null}
    </PageShell>
  );
}
