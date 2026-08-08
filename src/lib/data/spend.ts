import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { TransactionInsert, TransactionRow } from "@/types/db";
import { cartTotal, getHouseholdCart } from "./cart";
import { getHouseholdById } from "./households";
import { round2, unwrap, unwrapRows } from "./shared";

const TRANSACTION_COLUMNS =
  "id, household_id, created_by, total, store, items, note, created_at";

/**
 * Perú no usa horario de verano: siempre UTC-5. Con eso el "mes" del
 * presupuesto empieza a medianoche de Lima y no a las 19:00 del día anterior,
 * que es lo que pasaría calculando en UTC.
 */
const LIMA_OFFSET_MINUTES = -5 * 60;

export type MonthSpend = {
  householdId: string;
  currency: string;
  budget: number;
  /** Compras ya cerradas este mes. */
  transactionsTotal: number;
  /** El carrito abierto ahora mismo, que todavía no es una compra. */
  cartTotal: number;
  /** transactionsTotal + cartTotal. */
  spent: number;
  /** budget − spent. Negativo = ya se pasaron. */
  remaining: number;
  /** Gasto estimado a fin de mes al ritmo actual. */
  projected: number;
  /** La proyección se pasa del presupuesto. Esto dispara la alerta. */
  overBudget: boolean;
  dayOfMonth: number;
  daysInMonth: number;
  /** Inicio del mes en hora de Lima, en ISO UTC. */
  periodStart: string;
};

type LimaMonth = {
  startIso: string;
  dayOfMonth: number;
  daysInMonth: number;
};

function currentLimaMonth(now: Date = new Date()): LimaMonth {
  // Corriendo el reloj al offset de Lima, los getters UTC dan la fecha local.
  const lima = new Date(now.getTime() + LIMA_OFFSET_MINUTES * 60_000);
  const year = lima.getUTCFullYear();
  const month = lima.getUTCMonth();

  const startUtcMs = Date.UTC(year, month, 1) - LIMA_OFFSET_MINUTES * 60_000;

  return {
    startIso: new Date(startUtcMs).toISOString(),
    dayOfMonth: lima.getUTCDate(),
    daysInMonth: new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
  };
}

/**
 * Gasto del mes de la casa: lo cerrado en `transactions` más el carrito que
 * está abierto, y la proyección a fin de mes al ritmo actual.
 */
export async function getMonthSpend(householdId: string): Promise<MonthSpend> {
  const period = currentLimaMonth();

  const [household, transactionsResult, cart] = await Promise.all([
    getHouseholdById(householdId),
    supabaseAdmin()
      .from("transactions")
      .select("total")
      .eq("household_id", householdId)
      .gte("created_at", period.startIso),
    getHouseholdCart(householdId),
  ]);

  const transactions = unwrapRows<{ total: number }>(transactionsResult, "getMonthSpend");
  const transactionsTotal = round2(
    transactions.reduce((acc, transaction) => acc + transaction.total, 0),
  );

  const spent = round2(transactionsTotal + cart.total);
  const budget = household?.monthly_budget ?? 0;

  // Regla de tres simple sobre los días transcurridos: si en 10 días van 400,
  // el mes cierra en ~1200. Suficiente para avisar a tiempo.
  const projected =
    period.dayOfMonth > 0
      ? round2((spent / period.dayOfMonth) * period.daysInMonth)
      : spent;

  return {
    householdId,
    currency: household?.currency ?? "PEN",
    budget,
    transactionsTotal,
    cartTotal: cart.total,
    spent,
    remaining: round2(budget - spent),
    projected,
    overBudget: budget > 0 && projected > budget,
    dayOfMonth: period.dayOfMonth,
    daysInMonth: period.daysInMonth,
    periodStart: period.startIso,
  };
}

export async function getTransactions(
  householdId: string,
  limit = 30,
): Promise<TransactionRow[]> {
  const result = await supabaseAdmin()
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return unwrapRows<TransactionRow>(result, "getTransactions");
}

export async function createTransaction(input: TransactionInsert): Promise<TransactionRow> {
  const result = await supabaseAdmin()
    .from("transactions")
    .insert({
      household_id: input.household_id,
      created_by: input.created_by ?? null,
      total: round2(input.total),
      store: input.store ?? null,
      items: input.items ?? [],
      note: input.note ?? null,
    })
    .select(TRANSACTION_COLUMNS)
    .single();

  return unwrap<TransactionRow>(result, "createTransaction");
}

/**
 * Cierra el carrito: lo convierte en una compra del historial y lo vacía.
 * El detalle queda congelado en `items`, así el historial no se reescribe
 * cuando el catálogo cambie de precio.
 */
export async function checkoutCart(
  householdId: string,
  options: { createdBy?: string | null; store?: string | null; note?: string | null } = {},
): Promise<TransactionRow | null> {
  const cart = await getHouseholdCart(householdId);
  if (cart.items.length === 0) return null;

  const transaction = await createTransaction({
    household_id: householdId,
    created_by: options.createdBy ?? null,
    store: options.store ?? null,
    note: options.note ?? null,
    total: cartTotal(cart.items),
    items: cart.items.map((item) => ({
      title: item.title,
      price: item.price,
      qty: item.qty,
      unit: item.unit,
      productId: item.product_id,
    })),
  });

  const cleanup = await supabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("household_id", householdId)
    .select("id");
  unwrapRows<{ id: string }>(cleanup, "checkoutCart:clear");

  return transaction;
}
