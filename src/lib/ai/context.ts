import "server-only";

import {
  findProducts,
  loadCart,
  loadMonthSpend,
  type CartSnapshot,
  type MonthSpend,
  type ProductRow,
} from "./data-contract";
import { gradeCart, gradeItem } from "./health";

/**
 * Contexto del modelo: el estado real de la casa, en texto compacto.
 *
 * La regla acá es de tokens, no de completitud. Meter el catálogo entero encarece
 * cada mensaje y encima empeora la respuesta (el modelo se pierde). Se manda el
 * carrito completo — es corto — y solo los productos que tengan que ver con lo
 * que se está hablando, con tope duro.
 */

const CATALOG_LIMIT = 30;
const CART_LIMIT = 40;

export type AssistantContext = {
  text: string;
  cart: CartSnapshot;
  spend: MonthSpend;
  projected: number;
  catalog: ProductRow[];
};

const money = (value: number): string => `S/ ${value.toFixed(2)}`;

/**
 * Proyección de fin de mes por ritmo de gasto. Simple a propósito: la alerta
 * tiene que ser explicable en una frase ("vas a este ritmo, terminas en X").
 */
export function projectMonthEnd(spent: number, now = new Date()): number {
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (daysElapsed <= 0) return spent;
  return Math.round((spent / daysElapsed) * daysInMonth * 100) / 100;
}

const STOPWORDS = new Set([
  "para","como","cuanto","cuánto","donde","dónde","porque","por","que","qué","con","los","las","del","una","uno",
  "esta","este","esto","tengo","quiero","puedo","hacer","dime","cual","cuál","mas","más","menos","hay","son","están",
  "estan","favor","plata","casa","semana","comprar","compra","carrito","precio","precios","barato","barata",
]);

/** Palabras con las que vale la pena buscar en el catálogo. */
export function keywordsFrom(message: string): string[] {
  const words = message
    .toLowerCase()
    // NFD + rango de diacríticos combinantes: "plátano" y "platano" buscan igual.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));

  return [...new Set(words)].slice(0, 4);
}

async function relevantCatalog(message: string, cart: CartSnapshot): Promise<ProductRow[]> {
  const terms = keywordsFrom(message);
  // Sin pistas en el mensaje, el carrito es la mejor pista que hay.
  if (terms.length === 0) {
    const fromCart = cart.items.slice(0, 3).map((item) => item.title.split(" ")[0] ?? "");
    terms.push(...fromCart.filter(Boolean));
  }

  const byId = new Map<string, ProductRow>();
  for (const term of terms) {
    if (byId.size >= CATALOG_LIMIT) break;
    const rows = await findProducts(term, 10);
    for (const row of rows) {
      if (byId.size >= CATALOG_LIMIT) break;
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

function renderCart(cart: CartSnapshot): string {
  if (cart.items.length === 0) return "Carrito: vacío.";

  const lines = cart.items.slice(0, CART_LIMIT).map((item) => {
    const grade = item.healthGrade ?? gradeItem({ title: item.title, category: item.category, macros: item.macros }).grade;
    const subtotal = money(item.price * item.qty);
    return `- [${item.id}] ${item.title} x${item.qty} · ${subtotal} · salud ${grade}`;
  });

  const overflow = cart.items.length - lines.length;
  if (overflow > 0) lines.push(`- (+${overflow} items más)`);

  const summary = gradeCart(
    cart.items.map((item) => ({ title: item.title, category: item.category, macros: item.macros })),
  );

  return [
    `Carrito (${cart.items.length} items, total ${money(cart.total)}, salud promedio ${summary.grade}):`,
    ...lines,
  ].join("\n");
}

function renderSpend(spend: MonthSpend, projected: number): string {
  const lines = [`Gasto del mes: ${money(spend.spent)}. Proyección a fin de mes: ${money(projected)}.`];

  if (spend.budget && spend.budget > 0) {
    const left = spend.budget - spend.spent;
    lines.push(`Presupuesto mensual: ${money(spend.budget)} (queda ${money(left)}).`);
    if (projected > spend.budget * 1.05) {
      lines.push(`AVISO: a este ritmo se pasan del presupuesto por ${money(projected - spend.budget)}.`);
    }
  } else {
    lines.push("Presupuesto mensual: no configurado.");
  }

  if (typeof spend.remaining === "number") {
    lines.push(
      spend.remaining >= 0
        ? `Le queda ${money(spend.remaining)} del mes.`
        : `Ya se pasó ${money(Math.abs(spend.remaining))} del presupuesto.`,
    );
  }

  return lines.join("\n");
}

function renderCatalog(products: ProductRow[]): string {
  if (products.length === 0) return "Catálogo relevante: nada que calce con lo que se está hablando.";

  const lines = products.map((product) => {
    const price = typeof product.price === "number" ? money(product.price) : "sin precio";
    const store = product.store ? ` @${product.store}` : "";
    const unit = product.unit ? `/${product.unit}` : "";
    return `- [${product.id}] ${product.title} · ${price}${unit}${store}`;
  });

  return [`Catálogo relevante (${products.length}, precios del dataset):`, ...lines].join("\n");
}

/** Arma el contexto completo. Devuelve también los datos crudos para el modo degradado. */
export async function buildAssistantContext(
  householdId: string,
  message: string,
): Promise<AssistantContext> {
  const [cart, spend] = await Promise.all([loadCart(householdId), loadMonthSpend(householdId)]);
  const catalog = await relevantCatalog(message, cart);
  const projected = projectMonthEnd(spend.spent);

  const text = [
    `Fecha: ${new Date().toISOString().slice(0, 10)}.`,
    renderCart(cart),
    renderSpend(spend, projected),
    renderCatalog(catalog),
    "Si un precio no está arriba, no lo tienes. Dilo o usa get_live_prices.",
  ].join("\n\n");

  return { text, cart, spend, projected, catalog };
}
