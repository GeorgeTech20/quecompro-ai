import type { ChatCompletionFunctionTool } from "openai/resources/chat/completions";
import { z } from "zod";

/**
 * Herramientas del asistente (function calling).
 *
 * El esquema se escribe una sola vez en zod y de ahí salen las dos cosas que se
 * necesitan: el JSON Schema que ve el modelo y el validador que corre sobre los
 * argumentos que devuelve. El modelo alucina parámetros; el `parse` es el filtro.
 */

export const toolSchemas = {
  add_item: z.object({
    // Con tope: sin él, un título largo pedido al modelo se persiste entero y
    // después entra en el prompt de esa casa en CADA mensaje de cualquiera,
    // para siempre. El resto de rutas de escritura ya cortan a 120.
    title: z
      .string()
      .min(2)
      .max(80)
      .describe("Nombre del producto tal como lo diría la persona, ej. 'pollo entero'"),
    qty: z.number().int().min(1).max(50).default(1).describe("Cantidad de unidades"),
    productId: z.string().optional().describe("Id del catálogo si aparece en el contexto; si no, omítelo"),
  }),

  swap_item: z.object({
    itemId: z.string().describe("Id del item del carrito que se reemplaza (viene en el contexto)"),
    toProductId: z.string().describe("Id del producto de reemplazo, del catálogo del contexto"),
    reason: z.string().max(140).describe("Por qué conviene el cambio, en una frase"),
  }),

  set_budget: z.object({
    monthly: z.number().min(50).max(20000).describe("Presupuesto mensual del hogar en soles"),
  }),

  plan_week: z.object({
    people: z.number().int().min(1).max(12).default(2).describe("Cuántas personas comen"),
    budget: z.number().min(0).optional().describe("Tope para la semana en soles, si lo dieron"),
    avoid: z.array(z.string()).max(10).default([]).describe("Ingredientes o categorías a evitar"),
  }),

  get_live_prices: z.object({
    productKey: z.string().describe("Clave canónica del producto en el catálogo, ej. 'pollo-entero'"),
    itemId: z.string().optional().describe("Item del carrito al que se le comparan precios, si aplica"),
  }),

  suggest_recipe: z.object({
    maxTimeMin: z.number().int().min(5).max(180).default(45).describe("Tiempo máximo de cocina en minutos"),
    difficulty: z.enum(["facil", "media", "dificil"]).default("facil").describe("Dificultad tope"),
  }),
} as const;

export type ToolName = keyof typeof toolSchemas;

export type ToolArgs = {
  [K in ToolName]: z.infer<(typeof toolSchemas)[K]>;
};

const DESCRIPTIONS: Record<ToolName, string> = {
  add_item: "Agrega un producto al carrito compartido de la casa. Úsala siempre que te pidan comprar o anotar algo.",
  swap_item: "Reemplaza un item del carrito por una alternativa más barata o más sana del catálogo.",
  set_budget: "Fija el presupuesto mensual del hogar en soles.",
  plan_week: "Arma el plan de compras de la semana con lo que ya hay y lo que falta.",
  get_live_prices: "Consulta precios frescos de las tiendas para un producto. Úsala cuando pregunten dónde está más barato.",
  suggest_recipe: "Propone una receta que el carrito ya cubre casi entera.",
};

/**
 * zod 4 trae `z.toJSONSchema`. Se le quita `$schema` (OpenAI no lo necesita) y se
 * cierra el objeto: sin `additionalProperties: false` el modelo se inventa campos.
 */
function toFunctionParameters(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: "draft-7", io: "input" });
  const { $schema: _ignored, ...rest } = generated as Record<string, unknown> & { $schema?: unknown };
  return { ...rest, additionalProperties: false };
}

export const openAiTools: ChatCompletionFunctionTool[] = (Object.keys(toolSchemas) as ToolName[]).map(
  (name) => ({
    type: "function",
    function: {
      name,
      description: DESCRIPTIONS[name],
      parameters: toFunctionParameters(toolSchemas[name]),
    },
  }),
);

export function isToolName(value: string): value is ToolName {
  return Object.prototype.hasOwnProperty.call(toolSchemas, value);
}

export type ParsedToolCall =
  | { [K in ToolName]: { ok: true; name: K; args: ToolArgs[K] } }[ToolName]
  | { ok: false; name: string; error: string };

/** Parsea los argumentos crudos del modelo (string JSON) contra el esquema real. */
export function parseToolCall(name: string, rawArguments: string): ParsedToolCall {
  if (!isToolName(name)) return { ok: false, name, error: "herramienta desconocida" };

  let raw: unknown;
  try {
    raw = JSON.parse(rawArguments || "{}");
  } catch {
    return { ok: false, name, error: "argumentos no son JSON válido" };
  }

  const result = toolSchemas[name].safeParse(raw);
  if (!result.success) {
    return { ok: false, name, error: result.error.issues.map((issue) => issue.message).join("; ") };
  }

  // El cast estrecha el par (name, args) que TS no puede correlacionar solo al
  // indexar `toolSchemas` con una variable.
  return { ok: true, name, args: result.data } as ParsedToolCall;
}
