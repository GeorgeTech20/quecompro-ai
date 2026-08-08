import type { HealthGrade } from "@/lib/realtime/channels";

/**
 * Cálculos y formateo compartidos por las pantallas de la app.
 *
 * Puro y sin `server-only` a propósito: el resumen los usa en el servidor y el
 * catálogo en el navegador, y las dos partes tienen que dar el mismo número.
 */

// --- Presupuesto -----------------------------------------------------------

/**
 * Porcentaje del presupuesto usado, **sin recortar a 100**: si te pasaste, la
 * cifra tiene que decirlo. La proyección a fin de mes la calcula el data layer
 * (`getMonthSpend`), que además sabe que el mes es el de Lima y no el de UTC.
 */
export function budgetPercent(spent: number, budget: number): number {
  return budget > 0 ? (spent / budget) * 100 : 0;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// --- Salud -----------------------------------------------------------------

const GRADE_POINTS: Record<HealthGrade, number> = { A: 4, B: 3, C: 2, D: 1 };
const POINT_GRADES: HealthGrade[] = ["D", "D", "C", "B", "A"];

/** Promedio de salud del carrito. `null` si nadie tiene nota todavía. */
export function averageHealth(
  grades: readonly (HealthGrade | null | undefined)[],
): { grade: HealthGrade; score: number } | null {
  const scored = grades.filter((grade): grade is HealthGrade => grade != null);
  if (scored.length === 0) return null;

  const total = scored.reduce((acc, grade) => acc + GRADE_POINTS[grade], 0);
  const average = total / scored.length;
  const index = Math.min(4, Math.max(1, Math.round(average)));

  return { grade: POINT_GRADES[index] ?? "C", score: round2(average) };
}

export const HEALTH_WORDS: Record<HealthGrade, string> = {
  A: "muy buena",
  B: "buena",
  C: "regular",
  D: "mejor evitar",
};

// --- Precio por 100 g ------------------------------------------------------

/**
 * Comparador honesto: solo se puede calcular cuando el producto se vende por
 * kilo. Con "und" o "paq" no sabemos cuánto pesa, y un número inventado en la
 * tarjeta es peor que no ponerlo.
 */
export function pricePer100g(price: number, unit: string): number | null {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "kg") return round2(price / 10);
  if (normalized === "l" || normalized === "lt") return round2(price / 10);
  if (normalized === "g" || normalized === "ml") return round2(price * 100);
  return null;
}

export function unitLabel(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "kg") return "kilo";
  if (normalized === "paq") return "paquete";
  if (normalized === "und") return "unidad";
  return unit;
}

// --- Fechas ----------------------------------------------------------------

const DAY_LONG = new Intl.DateTimeFormat("es-PE", { weekday: "long" });
const DATE_SHORT = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" });
const DATE_LONG = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long" });
const MONTH_LONG = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" });
const TIME_SHORT = new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit" });

export const formatDayLong = (date: Date): string => DAY_LONG.format(date);
export const formatDateShort = (date: Date): string => DATE_SHORT.format(date);
export const formatDateLong = (date: Date): string => DATE_LONG.format(date);
export const formatMonthLong = (date: Date): string => MONTH_LONG.format(date);
export const formatTime = (date: Date): string => TIME_SHORT.format(date);

export function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/** "hace 5 min", "ayer", "12 mar". Lo justo para una lista, sin librería. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "recién";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 172_800) return "ayer";
  if (seconds < 604_800) return `hace ${Math.floor(seconds / 86_400)} días`;
  return formatDateShort(date);
}

/** Lunes de la semana de esa fecha, a las 00:00 locales. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (start.getDay() + 6) % 7; // lunes = 0
  start.setDate(start.getDate() - weekday);
  return start;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `2026-08` → rango [inicio, fin) del mes. Vale para el filtro del historial. */
export function monthRange(monthKey: string): { from: Date; to: Date } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { from: new Date(year, month - 1, 1), to: new Date(year, month, 1) };
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Los últimos N meses, del más reciente al más viejo, para el selector. */
export function recentMonths(count: number, now: Date = new Date()): { key: string; label: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return { key: monthKey(date), label: capitalize(formatMonthLong(date)) };
  });
}
