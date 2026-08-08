import type { HealthGrade } from "@/lib/realtime/channels";

import type { Macros100g } from "./data-contract";

/**
 * Puntuación de salud A/B/C/D **sin LLM**.
 *
 * Se hace acá y no en el modelo por tres razones: responde en microsegundos (el
 * chip tiene que salir junto con el item), no cuesta tokens, y sobre todo es
 * consistente — el mismo pollo saca la misma nota siempre. Un LLM oscila y en
 * una demo con dos pantallas eso se nota.
 *
 * Criterio: umbrales tipo semáforo por 100 g (sodio, grasa saturada, azúcar,
 * densidad calórica) con bonus por fibra y proteína, y un ajuste por categoría
 * para lo que la tabla nutricional no captura (una verdura suelta no trae
 * etiqueta).
 */

export type HealthVerdict = { grade: HealthGrade; reason: string };

export type HealthInput = {
  title: string;
  category?: string | null;
  macros?: Macros100g | null;
};

type Signal = { points: number; reason: string };

const num = (value: number | null | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

// --- Categorías: lo que el rótulo no dice ---------------------------------

const CATEGORY_BONUS: { match: RegExp; points: number; reason: string }[] = [
  { match: /verdur|vegetal|hortaliz|ensalada/i, points: 3, reason: "verdura fresca" },
  { match: /fruta/i, points: 2, reason: "fruta fresca" },
  { match: /menestra|legumbre|frijol|lenteja|garbanz|quinua|quinoa/i, points: 3, reason: "menestra, pura fibra y proteína" },
  { match: /pescad|marisco/i, points: 2, reason: "pescado" },
  { match: /huevo/i, points: 2, reason: "huevo" },
  { match: /pollo|ave/i, points: 1, reason: "carne blanca" },
  { match: /lact|leche|yogur/i, points: 1, reason: "lácteo" },
  { match: /abarrote|cereal|arroz|fideo|pasta/i, points: 0, reason: "abarrote" },
  { match: /embutid|salchich|hot ?dog|jamonada|chorizo/i, points: -3, reason: "embutido" },
  { match: /gaseosa|bebida|refresco|jugo envasado/i, points: -3, reason: "bebida azucarada" },
  { match: /snack|galleta|golosina|chocolate|caramelo|frit/i, points: -3, reason: "snack ultraprocesado" },
  { match: /licor|cerveza|alcohol/i, points: -3, reason: "alcohol" },
];

// Cuando no hay categoría ni macros, el nombre es lo único que queda.
const TITLE_HINTS: { match: RegExp; points: number; reason: string }[] = [
  { match: /gaseosa|inca kola|coca ?cola|pepsi|sprite|fanta/i, points: -4, reason: "gaseosa" },
  { match: /salchich|hot ?dog|jamonada|nugget|chorizo|tocino/i, points: -3, reason: "embutido" },
  { match: /galleta|chizito|papas? frita|doritos|chocolate|caramelo/i, points: -3, reason: "snack" },
  { match: /cerveza|ron|pisco|vino/i, points: -3, reason: "alcohol" },
  { match: /brócoli|brocoli|espinaca|zanahoria|tomate|lechuga|zapallo|cebolla|apio|vainita/i, points: 3, reason: "verdura" },
  { match: /lenteja|frijol|garbanz|quinua|quinoa|pallar/i, points: 3, reason: "menestra" },
  { match: /manzana|plátano|platano|papaya|naranja|mandarina|palta|piña/i, points: 2, reason: "fruta" },
  { match: /pollo|pescado|bonito|jurel|huevo|atún|atun/i, points: 2, reason: "proteína magra" },
  { match: /avena|integral/i, points: 2, reason: "integral" },
  { match: /aceite|manteca|mantequilla/i, points: -1, reason: "grasa pura" },
  { match: /azúcar|azucar/i, points: -3, reason: "azúcar" },
];

// --- Señales por macro ----------------------------------------------------

function macroSignals(macros: Macros100g): Signal[] {
  const signals: Signal[] = [];

  const sodium = num(macros.sodium);
  if (sodium !== undefined) {
    if (sodium > 600) signals.push({ points: -3, reason: "sodio muy alto" });
    else if (sodium > 400) signals.push({ points: -2, reason: "sodio alto" });
    else if (sodium > 120) signals.push({ points: -1, reason: "algo salado" });
  }

  const satFat = num(macros.satFat);
  if (satFat !== undefined) {
    if (satFat > 6) signals.push({ points: -3, reason: "grasa saturada muy alta" });
    else if (satFat > 3) signals.push({ points: -2, reason: "grasa saturada alta" });
  } else {
    const fat = num(macros.fat);
    if (fat !== undefined && fat > 20) signals.push({ points: -2, reason: "mucha grasa" });
    else if (fat !== undefined && fat > 10) signals.push({ points: -1, reason: "grasa media" });
  }

  const sugar = num(macros.sugar);
  if (sugar !== undefined) {
    if (sugar > 22.5) signals.push({ points: -3, reason: "azúcar muy alta" });
    else if (sugar > 10) signals.push({ points: -2, reason: "azúcar alta" });
    else if (sugar > 5) signals.push({ points: -1, reason: "algo dulce" });
  }

  const kcal = num(macros.kcal);
  if (kcal !== undefined) {
    if (kcal > 400) signals.push({ points: -2, reason: "muy calórico" });
    else if (kcal > 275) signals.push({ points: -1, reason: "calórico" });
    else if (kcal < 80) signals.push({ points: 1, reason: "liviano" });
  }

  const fiber = num(macros.fiber);
  if (fiber !== undefined) {
    if (fiber > 6) signals.push({ points: 3, reason: "mucha fibra" });
    else if (fiber > 3) signals.push({ points: 2, reason: "buena fibra" });
  }

  const protein = num(macros.protein);
  if (protein !== undefined) {
    if (protein > 12) signals.push({ points: 2, reason: "buena proteína" });
    else if (protein > 6) signals.push({ points: 1, reason: "aporta proteína" });
  }

  return signals;
}

function hasAnyMacro(macros: Macros100g | null | undefined): macros is Macros100g {
  if (!macros) return false;
  return [macros.kcal, macros.protein, macros.carbs, macros.sugar, macros.fat, macros.satFat, macros.fiber, macros.sodium].some(
    (value) => num(value) !== undefined,
  );
}

function scoreToGrade(score: number): HealthGrade {
  if (score >= 3) return "A";
  if (score >= 0) return "B";
  if (score >= -3) return "C";
  return "D";
}

const GRADE_LEAD: Record<HealthGrade, string> = {
  A: "Buena elección",
  B: "Aceptable",
  C: "Ojo con este",
  D: "Mejor cámbialo",
};

/**
 * Nota de salud + una frase que explique de dónde sale. La frase es corta a
 * propósito: entra en un chip del chat, no en un párrafo.
 */
export function gradeItem(input: HealthInput): HealthVerdict {
  const signals: Signal[] = [];

  if (hasAnyMacro(input.macros)) {
    signals.push(...macroSignals(input.macros));
  }

  const category = input.category ?? "";
  const categoryHit = CATEGORY_BONUS.find((rule) => rule.match.test(category));
  if (categoryHit && categoryHit.points !== 0) {
    signals.push({ points: categoryHit.points, reason: categoryHit.reason });
  }

  // Los hints del nombre solo entran si no hubo tabla nutricional: si hay macros,
  // mandan los números y no la etiqueta comercial.
  if (!hasAnyMacro(input.macros)) {
    const titleHit = TITLE_HINTS.find((rule) => rule.match.test(input.title));
    if (titleHit) signals.push({ points: titleHit.points, reason: titleHit.reason });
  }

  const score = signals.reduce((total, signal) => total + signal.points, 0);
  const grade = scoreToGrade(score);

  // La razón la da la señal más fuerte en la dirección de la nota; así una "D"
  // no se justifica con "buena proteína".
  const relevant = signals
    .filter((signal) => (score >= 0 ? signal.points > 0 : signal.points < 0))
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));

  const driver = relevant[0]?.reason;
  const reason = driver
    ? `${GRADE_LEAD[grade]}: ${driver}.`
    : `${GRADE_LEAD[grade]}: sin datos nutricionales, va nota neutra.`;

  return { grade, reason };
}

/** Nota promedio del carrito, para el contexto del asistente. */
export function gradeCart(items: HealthInput[]): { grade: HealthGrade; counts: Record<HealthGrade, number> } {
  const counts: Record<HealthGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  const weights: Record<HealthGrade, number> = { A: 4, B: 3, C: 2, D: 1 };

  for (const item of items) counts[gradeItem(item).grade] += 1;

  const total = items.length;
  if (total === 0) return { grade: "B", counts };

  const average =
    (counts.A * weights.A + counts.B * weights.B + counts.C * weights.C + counts.D * weights.D) / total;

  const grade: HealthGrade = average >= 3.5 ? "A" : average >= 2.5 ? "B" : average >= 1.5 ? "C" : "D";
  return { grade, counts };
}
