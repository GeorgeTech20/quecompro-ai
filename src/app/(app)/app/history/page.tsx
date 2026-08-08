import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  capitalize,
  formatDateLong,
  formatDateShort,
  formatMonthLong,
  monthKey,
  monthRange,
  recentMonths,
  round2,
  startOfWeek,
} from "@/components/shell/format";
import { ReceiptIcon } from "@/components/shell/icons";
import { LinkButton } from "@/components/shell/LinkButton";
import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import {
  categoryLabel,
  loadProductsByIds,
  loadTransactions,
  requireHouseholdViewer,
  safeLoad,
} from "@/components/shell/server-data";
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, Money } from "@/components/ui";
import type { ProductRow, TransactionRow } from "@/types/db";

import { MonthPicker } from "./MonthPicker";

export const metadata: Metadata = { title: "Historial" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const OTHER = "otros";

/**
 * Historial: "la boleta que se perdió".
 *
 * Todo lo cerrado queda acá, agrupado por semana y con el reparto por
 * categoría. La categoría no vive en la transacción (el detalle se congela sin
 * ella), así que se recupera desde el catálogo por `product_id`.
 */
export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const params = await searchParams;
  const raw = Array.isArray(params.month) ? params.month[0] : params.month;
  const now = new Date();
  const selected = raw && monthRange(raw) ? raw : monthKey(now);
  const range = monthRange(selected) ?? { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };

  // El data layer devuelve las últimas N compras sin rango de fechas, así que
  // el corte por mes se hace acá sobre esa ventana.
  const recent = await safeLoad<TransactionRow[]>(
    () => loadTransactions(viewer.household.id, 300),
    [],
    "historial:transacciones",
  );

  const transactions = recent.filter((transaction) => {
    const at = new Date(transaction.created_at).getTime();
    return at >= range.from.getTime() && at < range.to.getTime();
  });

  const productIds = [
    ...new Set(
      transactions.flatMap((transaction) =>
        transaction.items.map((item) => item.productId).filter((id): id is string => Boolean(id)),
      ),
    ),
  ];

  const products = await safeLoad<ProductRow[]>(
    () => loadProductsByIds(productIds),
    [],
    "historial:productos",
  );
  const categoryByProduct = new Map(products.map((product) => [product.id, product.category]));

  const monthTotal = round2(transactions.reduce((acc, transaction) => acc + transaction.total, 0));
  const byCategory = summarizeCategories(transactions, categoryByProduct);
  const weeks = groupByWeek(transactions);
  const months = recentMonths(6, now);

  // Si el mes elegido no está entre los últimos seis, se agrega para que el
  // selector no muestre otra cosa distinta de lo que se está viendo.
  if (!months.some((month) => month.key === selected)) {
    months.unshift({ key: selected, label: capitalize(formatMonthLong(range.from)) });
  }

  return (
    <PageShell>
      <PageHeader
        title="Historial"
        description="Cada compra cerrada queda registrada acá. Ya no depende de que alguien guarde la boleta."
        actions={<MonthPicker months={months} value={selected} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card padding="md" className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink-muted">Total del mes</p>
          <p className="text-3xl font-semibold tracking-tight text-ink">
            <Money value={monthTotal} />
          </p>
          <p className="text-sm text-ink-muted">
            {transactions.length} {transactions.length === 1 ? "compra" : "compras"} en{" "}
            {capitalize(formatMonthLong(range.from))}.
          </p>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <p className="mb-3 text-sm font-medium text-ink-muted">En qué se fue</p>
          {byCategory.length === 0 ? (
            <p className="text-sm text-ink-faint">
              Sin compras este mes: no hay nada que repartir todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {byCategory.map((row) => (
                <li key={row.category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-sm text-ink sm:w-28">
                    {categoryLabel(row.category)}
                  </span>
                  <span className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                    <span
                      className="block h-full rounded-full bg-brand-600"
                      style={{ width: `${monthTotal > 0 ? (row.total / monthTotal) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm text-ink tabular-nums">
                    <Money value={row.total} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {weeks.length === 0 ? (
        <Card padding="md">
          <EmptyState
            illustration={<ReceiptIcon className="size-7" />}
            title="Sin compras registradas este mes"
            description="Cuando cierres una compra desde el carrito, aparece acá con su detalle: qué se llevó, cuánto costó y quién la hizo."
            action={
              <LinkButton href="/app/cart" size="sm">
                Ir al carrito
              </LinkButton>
            }
          />
        </Card>
      ) : (
        weeks.map((week) => (
          <Card key={week.start.toISOString()}>
            <CardHeader
              actions={
                <Badge tone="neutral">
                  <Money value={week.total} />
                </Badge>
              }
            >
              <CardTitle
                subtitle={`${formatDateShort(week.start)} – ${formatDateShort(week.end)}`}
              >
                {week.label}
              </CardTitle>
            </CardHeader>

            <CardBody className="p-0">
              <ul className="divide-y divide-border-subtle">
                {week.transactions.map((transaction) => (
                  <li key={transaction.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        {transaction.store ?? "Compra"}
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {formatDateLong(new Date(transaction.created_at))}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-ink tabular-nums">
                        <Money value={transaction.total} />
                      </p>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                      {transaction.items.length > 0
                        ? transaction.items
                            .map((item) => `${item.title}${item.qty > 1 ? ` ×${item.qty}` : ""}`)
                            .join(" · ")
                        : "Sin detalle guardado"}
                    </p>

                    {transaction.note ? (
                      <p className="mt-1 text-xs text-ink-faint italic">{transaction.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))
      )}
    </PageShell>
  );
}

// --- Agregaciones ----------------------------------------------------------

function summarizeCategories(
  transactions: readonly TransactionRow[],
  categoryByProduct: Map<string, string>,
): { category: string; total: number }[] {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    for (const item of transaction.items) {
      const category =
        (item.productId ? categoryByProduct.get(item.productId) : undefined) ?? OTHER;
      totals.set(category, (totals.get(category) ?? 0) + item.price * item.qty);
    }
  }

  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
}

type Week = {
  start: Date;
  end: Date;
  label: string;
  total: number;
  transactions: TransactionRow[];
};

function groupByWeek(transactions: readonly TransactionRow[]): Week[] {
  const buckets = new Map<string, TransactionRow[]>();

  for (const transaction of transactions) {
    const start = startOfWeek(new Date(transaction.created_at));
    const key = start.toISOString();
    const bucket = buckets.get(key) ?? [];
    bucket.push(transaction);
    buckets.set(key, bucket);
  }

  const now = new Date();
  const thisWeek = startOfWeek(now).toISOString();

  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, rows]) => {
      const start = new Date(key);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return {
        start,
        end,
        label: key === thisWeek ? "Esta semana" : `Semana del ${formatDateShort(start)}`,
        total: round2(rows.reduce((acc, row) => acc + row.total, 0)),
        transactions: rows.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      };
    });
}
