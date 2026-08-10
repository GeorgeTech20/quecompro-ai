import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  capitalize,
  formatDateLong,
  formatDateShort,
  formatDayLong,
  formatMonthLong,
  formatTime,
  isSameDay,
  monthKey,
  monthRange,
  recentMonths,
  round2,
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

import { DailySpendChart, type DaySpend } from "./DailySpendChart";
import { MonthPicker } from "./MonthPicker";

export const metadata: Metadata = { title: "Historial" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const OTHER = "otros";

/**
 * Historial: "la boleta que se perdió".
 *
 * Se lee por día, no por semana. La pregunta real de quien entra acá es "¿en
 * qué día se me fue la plata?", y una semana de siete días agregados no la
 * contesta. Arriba el mes de un vistazo — cuánto, en qué días, en qué rubros —
 * y abajo el detalle día por día.
 *
 * La categoría no vive en la transacción (el detalle se congela sin ella), así
 * que se recupera desde el catálogo por `product_id`.
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
  const days = buildDays(transactions, range.from);
  const daysWithSpend = days.filter((day) => day.total > 0);
  const detail = groupByDay(transactions);
  const months = recentMonths(6, now);

  const peak = daysWithSpend.reduce<DaySpend | null>(
    (best, day) => (best === null || day.total > best.total ? day : best),
    null,
  );
  const perDay = daysWithSpend.length > 0 ? round2(monthTotal / daysWithSpend.length) : 0;
  const axisMax = niceCeil(peak?.total ?? 0);

  // Si el mes elegido no está entre los últimos seis, se agrega para que el
  // selector no muestre otra cosa distinta de lo que se está viendo.
  if (!months.some((month) => month.key === selected)) {
    months.unshift({ key: selected, label: capitalize(formatMonthLong(range.from)) });
  }

  return (
    <PageShell>
      <PageHeader
        title="Historial"
        description="Cada compra cerrada queda registrada acá, día por día. Ya no depende de que alguien guarde la boleta."
        actions={<MonthPicker months={months} value={selected} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Total del mes"
          value={<Money value={monthTotal} />}
          hint={`${transactions.length} ${transactions.length === 1 ? "compra" : "compras"} en ${capitalize(formatMonthLong(range.from))}.`}
          lead
        />
        <Stat
          label="Promedio por día de compra"
          value={<Money value={perDay} />}
          hint={
            daysWithSpend.length > 0
              ? `Se compró en ${daysWithSpend.length} ${daysWithSpend.length === 1 ? "día" : "días"} del mes.`
              : "Todavía no hay días con compras."
          }
        />
        <Stat
          label="Día más caro"
          value={peak ? <Money value={peak.total} /> : <span className="text-ink-faint">—</span>}
          hint={peak ? capitalize(peak.label) : "Sin compras que comparar."}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle subtitle="Cuánto se gastó cada día. Las barras vacías son días sin compras.">
            Gasto por día
          </CardTitle>
        </CardHeader>
        <CardBody>
          {daysWithSpend.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              Sin compras este mes: no hay nada que graficar todavía.
            </p>
          ) : (
            <DailySpendChart days={days} max={axisMax} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle subtitle="El reparto del mes por rubro, de mayor a menor.">
            En qué se fue
          </CardTitle>
        </CardHeader>
        <CardBody>
          {byCategory.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              Sin compras este mes: no hay nada que repartir todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {byCategory.map((row) => {
                const share = monthTotal > 0 ? (row.total / monthTotal) * 100 : 0;
                return (
                  // En un celular la barra se queda sin ancho si le ponemos
                  // rótulo, porcentaje y monto al lado. El porcentaje es el que
                  // menos falta hace: la barra ya lo dice.
                  <li key={row.category} className="flex items-center gap-2 sm:gap-3">
                    <span className="w-20 shrink-0 truncate text-sm text-ink sm:w-28">
                      {categoryLabel(row.category)}
                    </span>
                    <span className="h-2.5 min-w-8 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <span
                        className="block h-full rounded-r-[4px] bg-brand-600"
                        style={{ width: `${Math.max(share, row.total > 0 ? 1.5 : 0)}%` }}
                      />
                    </span>
                    <span className="hidden w-10 shrink-0 text-right text-xs text-ink-faint tabular-nums sm:block">
                      {Math.round(share)}%
                    </span>
                    <span className="w-[4.5rem] shrink-0 text-right text-sm text-ink tabular-nums sm:w-20">
                      <Money value={row.total} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {detail.length === 0 ? (
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
        detail.map((day) => (
          <Card key={day.key}>
            <CardHeader
              actions={
                <Badge tone="neutral">
                  <Money value={day.total} />
                </Badge>
              }
            >
              <CardTitle
                subtitle={`${day.transactions.length} ${day.transactions.length === 1 ? "compra" : "compras"}`}
              >
                {day.heading}
              </CardTitle>
            </CardHeader>

            <CardBody className="p-0">
              <ul className="divide-y divide-border-subtle">
                {day.transactions.map((transaction) => (
                  <li key={transaction.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        {transaction.store ?? "Compra"}
                        <span className="ml-2 text-xs font-normal text-ink-faint">
                          {formatTime(new Date(transaction.created_at))}
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

/** Cifra suelta del encabezado. `lead` es la única grande de la pantalla. */
function Stat({
  label,
  value,
  hint,
  lead = false,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  lead?: boolean;
}) {
  return (
    <Card padding="md" className="flex flex-col gap-1">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p
        className={
          lead
            ? "text-3xl font-semibold tracking-tight text-ink"
            : "text-2xl font-semibold tracking-tight text-ink"
        }
      >
        {value}
      </p>
      <p className="text-sm text-ink-muted">{hint}</p>
    </Card>
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

/**
 * Un punto por cada día del mes, incluidos los vacíos: el gráfico tiene que
 * mostrar la forma del mes completo, no solo los días en que se compró. Sin los
 * huecos, dos compras seguidas y dos compras con diez días de por medio se
 * verían igual.
 */
function buildDays(transactions: readonly TransactionRow[], from: Date): DaySpend[] {
  const totals = new Map<number, { total: number; purchases: number }>();

  for (const transaction of transactions) {
    const day = new Date(transaction.created_at).getDate();
    const bucket = totals.get(day) ?? { total: 0, purchases: 0 };
    bucket.total += transaction.total;
    bucket.purchases += 1;
    totals.set(day, bucket);
  }

  const daysInMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(from.getFullYear(), from.getMonth(), day);
    const bucket = totals.get(day);

    return {
      key: `${from.getFullYear()}-${from.getMonth() + 1}-${day}`,
      day,
      label: formatDateLong(date),
      total: round2(bucket?.total ?? 0),
      purchases: bucket?.purchases ?? 0,
    };
  });
}

type DayDetail = {
  key: string;
  heading: string;
  total: number;
  transactions: TransactionRow[];
};

/** Solo los días con compras, del más reciente al más viejo. */
function groupByDay(transactions: readonly TransactionRow[]): DayDetail[] {
  const buckets = new Map<string, TransactionRow[]>();

  for (const transaction of transactions) {
    const date = new Date(transaction.created_at);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(transaction);
    buckets.set(key, bucket);
  }

  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  return [...buckets.entries()]
    .map(([key, rows]) => {
      const date = new Date(rows[0]!.created_at);
      const heading = isSameDay(date, now)
        ? "Hoy"
        : isSameDay(date, yesterday)
          ? "Ayer"
          : `${capitalize(formatDayLong(date))} ${formatDateShort(date)}`;

      return {
        key,
        heading,
        total: round2(rows.reduce((acc, row) => acc + row.total, 0)),
        transactions: rows.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        at: date.getTime(),
      };
    })
    .sort((a, b) => b.at - a.at)
    .map(({ at: _at, ...day }) => day);
}

/**
 * Tope del eje en una cifra redonda. Un eje que termina en "S/ 87.30" obliga a
 * leer el número para saber la escala; uno que termina en "S/ 100" se entiende
 * de reojo.
 */
function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}
