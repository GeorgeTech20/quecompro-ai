import "server-only";

import OpenAI from "openai";

/**
 * Cliente OpenAI + **modo degradado**.
 *
 * Sin `OPENAI_API_KEY` la app no se cae: `isModelAvailable()` da false y el
 * asistente responde con heurísticas. La demo tiene que correr en la laptop de
 * cualquiera, con o sin key.
 */

let client: OpenAI | undefined;

export function isModelAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openaiModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

/** `undefined` cuando no hay key: el llamador decide el fallback. */
export function openaiClient(): OpenAI | undefined {
  if (!isModelAvailable()) return undefined;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // Una API route no puede quedarse esperando al modelo: la respuesta del
      // canal se siente en vivo o no se siente.
      timeout: 20_000,
      maxRetries: 1,
    });
  }
  return client;
}

// --- Modo degradado -------------------------------------------------------

export type DegradedReply = { text: string; intent: DegradedIntent };

export type DegradedIntent = "budget" | "cheaper" | "recipe" | "health" | "add" | "smalltalk";

const INTENT_RULES: { match: RegExp; intent: DegradedIntent }[] = [
  { match: /presupuest|gast|plata|cuánto llev|cuanto llev|alcanza/i, intent: "budget" },
  { match: /barat|ahorr|precio|cuesta|caro/i, intent: "cheaper" },
  { match: /receta|cocin|almuerzo|cena|qué hago|que hago/i, intent: "recipe" },
  { match: /sano|salud|nutri|calor|engord/i, intent: "health" },
  { match: /agrega|añade|anade|pon|mete|compra/i, intent: "add" },
];

export function classifyDegraded(message: string): DegradedIntent {
  return INTENT_RULES.find((rule) => rule.match.test(message))?.intent ?? "smalltalk";
}

/**
 * Respuesta sin modelo. No inventa nada: solo repite datos que ya vienen del
 * contexto, así el flujo (publicar en el canal, pintar el mensaje) es idéntico.
 */
export function degradedReply(
  message: string,
  facts: { total: number; itemCount: number; spent: number; budget?: number | null; topSaving?: { title: string; savings: number } | null },
): DegradedReply {
  const intent = classifyDegraded(message);
  const money = (value: number) => `S/ ${value.toFixed(2)}`;

  switch (intent) {
    case "budget": {
      if (facts.budget && facts.budget > 0) {
        const left = facts.budget - facts.spent;
        return {
          intent,
          text:
            left >= 0
              ? `Vas ${money(facts.spent)} del mes. Te queda ${money(left)} de los ${money(facts.budget)}.`
              : `Ya te pasaste: llevas ${money(facts.spent)} contra un presupuesto de ${money(facts.budget)}.`,
        };
      }
      return { intent, text: `Llevas ${money(facts.spent)} gastados este mes. No tienes presupuesto puesto todavía.` };
    }
    case "cheaper": {
      if (facts.topSaving) {
        return {
          intent,
          text: `Cambiando ${facts.topSaving.title} te ahorras ${money(facts.topSaving.savings)}. Es el cambio que más rinde ahorita.`,
        };
      }
      return { intent, text: "No veo un cambio más barato en el carrito por ahora." };
    }
    case "recipe":
      return { intent, text: "Con lo que hay en el carrito puedo armar algo, pero necesito el asistente completo para la receta." };
    case "health":
      return { intent, text: "Cada item ya trae su nota A/B/C/D en el carrito. Mira los que salen C o D: por ahí se arregla la compra." };
    case "add":
      return { intent, text: "Agrégalo desde el buscador de productos y te lo evalúo apenas entre." };
    default:
      return {
        intent,
        text: `Carrito: ${facts.itemCount} items, ${money(facts.total)}. Pregúntame por precios, presupuesto o qué cocinar.`,
      };
  }
}
