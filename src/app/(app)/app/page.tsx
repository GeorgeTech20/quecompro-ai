import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  averageHealth,
  budgetPercent,
  HEALTH_WORDS,
  relativeTime,
  round2,
} from "@/components/shell/format";
import { ArrowRightIcon, CartIcon, LeafIcon } from "@/components/shell/icons";
import { LinkButton } from "@/components/shell/LinkButton";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import {
  loadCart,
  loadMembers,
  loadMonthSpend,
  loadTransactions,
  requireHouseholdViewer,
  safeLoad,
  type MonthSpend,
} from "@/components/shell/server-data";
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  HealthChip,
  Money,
  ProgressBar,
  toneForPercent,
} from "@/components/ui";
import type { HouseholdCart } from "@/lib/data";
import type { MemberWithProfile, TransactionRow } from "@/types/db";

export const metadata: Metadata = { title: "Resumen" };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Resumen: la primera pantalla al entrar.
 *
 * Tiene un solo trabajo — contar el estado de la casa en tres segundos: cuánto
 * llevas gastado y hacia dónde vas, qué tan sano está el carrito, y qué se
 * agregó desde la última vez que miraste.
 */
export default async function DashboardPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const { household, profile } = viewer;

  const emptySpend: MonthSpend = {
    householdId: household.id,
    currency: household.currency,
    budget: household.monthly_budget,
    transactionsTotal: 0,
    cartTotal: 0,
    spent: 0,
    remaining: household.monthly_budget,
    projected: 0,
    overBudget: false,
    dayOfMonth: new Date().getDate(),
    daysInMonth: 30,
    periodStart: new Date().toISOString(),
  };

  const [cart, spend, members, transactions] = await Promise.all([
    safeLoad<HouseholdCart>(
      () => loadCart(household.id),
      { householdId: household.id, items: [], total: 0, itemCount: 0 },
      "resumen:carrito",
    ),
    safeLoad<MonthSpend>(() => loadMonthSpend(household.id), emptySpend, "resumen:gasto"),
    safeLoad<MemberWithProfile[]>(() => loadMembers(household.id), [], "resumen:miembros"),
    safeLoad<TransactionRow[]>(() => loadTransactions(household.id, 60), [], "resumen:compras"),
  ]);

  const percent = budgetPercent(spend.spent, spend.budget);
  const health = averageHealth(cart.items.map((item) => item.health_grade));

  const weekAgo = Date.now() - WEEK_MS;
  const weekSpend = round2(
    transactions
      .filter((transaction) => new Date(transaction.created_at).getTime() >= weekAgo)
      .reduce((acc, transaction) => acc + transaction.total, 0),
  );

  const namesByProfileId = new Map(
    members.map((member) => [member.user_id, member.profile?.full_name ?? "Alguien de la casa"]),
  );
  const avatarsByProfileId = new Map(
    members.map((member) => [member.user_id, member.profile?.avatar_url ?? null]),
  );

  const recent = [...cart.items]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const firstName = (profile.full_name ?? "").trim().split(/\s+/)[0];

  return (
    <PageShell>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Hola"}
        description={`Así va ${household.name} este mes.`}
        actions={
          <LinkButton href="/app/cart" size="lg" iconRight={<ArrowRightIcon className="size-4" />}>
            Ir al carrito
          </LinkButton>
        }
      />

      {/* --- Fila de indicadores --- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="md" className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-ink-muted">Presupuesto del mes</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                <Money value={spend.spent} />
                <span className="text-base font-normal text-ink-muted">
                  {" "}
                  de <Money value={spend.budget} round />
                </span>
              </p>
            </div>

            <Badge tone={spend.overBudget ? "critical" : "success"} dot>
              {spend.overBudget ? "Te vas a pasar" : "Vas bien"}
            </Badge>
          </div>

          <ProgressBar
            value={spend.spent}
            max={spend.budget}
            projected={spend.projected}
            size="lg"
            tone={toneForPercent(percent)}
            valueText={`${Math.round(percent)}% del presupuesto usado`}
          />

          <p className="text-sm leading-relaxed text-ink-muted">
            {spend.overBudget ? (
              <>
                Al ritmo de estos {spend.dayOfMonth} días terminarías el mes en{" "}
                <strong className="font-semibold text-ink">
                  <Money value={spend.projected} round />
                </strong>
                , unos <Money value={spend.projected - spend.budget} round /> por encima. Bajarle a
                los snacks y a las bebidas suele arreglar la mitad.
              </>
            ) : (
              <>
                Proyección a fin de mes:{" "}
                <strong className="font-semibold text-ink">
                  <Money value={spend.projected} round />
                </strong>
                . Te quedan <Money value={Math.max(0, spend.remaining)} round /> por gastar.
              </>
            )}
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card padding="md" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-muted">Salud del carrito</p>
            {health ? (
              <>
                <HealthChip grade={health.grade} size="md" />
                <p className="text-sm text-ink-muted">
                  Promedio de {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}:{" "}
                  {HEALTH_WORDS[health.grade]}.
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-2xl font-semibold text-ink">
                  <LeafIcon className="size-6 text-brand-600" />—
                </p>
                <p className="text-sm text-ink-muted">
                  Agrega algo al carrito y la IA le pone nota al toque.
                </p>
              </>
            )}
          </Card>

          <Card padding="md" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-muted">Gasto de la semana</p>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              <Money value={weekSpend} />
            </p>
            <p className="text-sm text-ink-muted">
              {weekSpend > 0
                ? "Compras cerradas en los últimos 7 días."
                : "Todavía no cierran compras esta semana."}
            </p>
          </Card>
        </div>
      </div>

      {/* --- Acceso grande al carrito --- */}
      <Link
        href="/app/cart"
        className="group block rounded-card focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
      >
        <Card
          padding="md"
          className="flex flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50 transition-colors duration-150 group-hover:border-brand-300 dark:border-brand-800 dark:bg-brand-900/30"
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
              <CartIcon className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink">Carrito compartido</p>
              <p className="truncate text-sm text-ink-muted">
                {cart.itemCount === 0
                  ? "Vacío. Lo que agregues aparece al toque en la pantalla de los demás."
                  : `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"} listos para el mercado.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold tracking-tight text-ink">
              <Money value={cart.total} pulse />
            </span>
            <ArrowRightIcon className="size-5 text-brand-700 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </Card>
      </Link>

      {/* --- Últimos items --- */}
      <Card>
        <CardHeader
          actions={
            <LinkButton href="/app/cart" variant="tertiary" size="sm">
              Ver todo
            </LinkButton>
          }
        >
          <CardTitle subtitle="Lo último que entró al carrito y quién lo puso.">
            Movimiento reciente
          </CardTitle>
        </CardHeader>

        <CardBody className="p-0">
          {recent.length === 0 ? (
            <EmptyState
              size="sm"
              illustration={<CartIcon className="size-6" />}
              title="Todavía no hay nada en el carrito"
              description="Empieza por lo de siempre: pollo, papa, arroz. La IA te dirá dónde está más barato y qué tan sano es."
              action={
                <LinkButton href="/app/products" size="sm">
                  Buscar productos
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {recent.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar
                    size="sm"
                    name={item.added_by ? namesByProfileId.get(item.added_by) : null}
                    src={item.added_by ? avatarsByProfileId.get(item.added_by) : null}
                    id={item.added_by}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {item.added_by
                        ? (namesByProfileId.get(item.added_by) ?? "Alguien de la casa")
                        : "Agregado desde WhatsApp"}
                      {" · "}
                      {relativeTime(item.created_at)}
                      {item.store ? ` · ${item.store}` : ""}
                    </p>
                  </div>

                  {item.health_grade ? (
                    <HealthChip grade={item.health_grade} size="sm" showLabel={false} />
                  ) : null}

                  <span className="shrink-0 text-sm font-medium text-ink tabular-nums">
                    <Money value={item.price * item.qty} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </PageShell>
  );
}
