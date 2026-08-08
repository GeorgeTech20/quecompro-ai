import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { z } from "zod";

import { degradedReply, isModelAvailable, openaiClient, openaiModel } from "@/lib/ai/client";
import { buildAssistantContext, type AssistantContext } from "@/lib/ai/context";
import {
  dropCartItem,
  findRecipes,
  insertCartItem,
  setBudget,
  type ProductRow,
} from "@/lib/ai/data-contract";
import { membershipGate } from "@/lib/ai/guard";
import { gradeItem } from "@/lib/ai/health";
import { buildSystemMessage } from "@/lib/ai/system-prompt";
import { openAiTools, parseToolCall, type ToolArgs } from "@/lib/ai/tools";
import { cheapestQuote, lookupPrices } from "@/lib/prices";
import type { AssistantAction } from "@/lib/realtime/channels";
import { publishActivity, publishCartEvent, publishChatEvent } from "@/lib/realtime/server-publish";

/**
 * Chat del asistente.
 *
 * Lo importante no es la respuesta HTTP: es que el asistente **publique en el
 * canal**. Las dos pantallas ven el "pensando…" y después el mensaje, aunque
 * solo una haya escrito. Por eso el `assistant-thinking` sale antes de llamar al
 * modelo y no después.
 */

export const runtime = "nodejs";

const BodySchema = z.object({
  householdId: z.string().min(1),
  message: z.string().min(1).max(1000),
});

/** Dos rondas: llamar tools → contestar. Más que eso encarece y no mejora. */
const MAX_TOOL_ROUNDS = 2;

type ToolOutcome = { result: unknown; actions: AssistantAction[] };

function findProductById(catalog: ProductRow[], id: string): ProductRow | undefined {
  return catalog.find((product) => product.id === id);
}

async function runTool(
  householdId: string,
  userId: string,
  context: AssistantContext,
  call: { name: keyof ToolArgs; args: ToolArgs[keyof ToolArgs] },
): Promise<ToolOutcome> {
  switch (call.name) {
    case "add_item": {
      const args = call.args as ToolArgs["add_item"];
      const product = args.productId ? findProductById(context.catalog, args.productId) : undefined;
      const price = product?.price ?? 0;

      const row = await insertCartItem(householdId, {
        productId: args.productId,
        title: product?.title ?? args.title,
        price,
        qty: args.qty,
        unit: product?.unit ?? undefined,
        addedBy: userId,
      });

      const grade = gradeItem({
        title: row.title,
        category: product?.category ?? row.category,
        macros: product?.macros ?? row.macros,
      });

      const total = context.cart.total + price * args.qty;
      await publishCartEvent(householdId, {
        type: "item-added",
        item: {
          id: row.id,
          title: row.title,
          price: row.price,
          qty: row.qty,
          unit: row.unit ?? undefined,
          store: row.store ?? undefined,
          category: row.category ?? undefined,
          healthGrade: grade.grade,
        },
        total,
      });

      return {
        result: { added: row.title, qty: row.qty, price: row.price, health: grade.grade },
        actions: [{ kind: "add-item", title: row.title, price: row.price, qty: row.qty, productId: args.productId }],
      };
    }

    case "swap_item": {
      const args = call.args as ToolArgs["swap_item"];
      const current = context.cart.items.find((item) => item.id === args.itemId);
      const target = findProductById(context.catalog, args.toProductId);
      if (!current || !target) {
        return { result: { error: "No encuentro ese item o ese reemplazo en el contexto." }, actions: [] };
      }

      const newPrice = target.price ?? current.price;
      const savings = Math.round((current.price - newPrice) * current.qty * 100) / 100;

      // El swap borra la línea vieja: `qty: 0` no existe (check `qty > 0`).
      await dropCartItem(householdId, current.id);
      const row = await insertCartItem(householdId, {
        productId: target.id,
        title: target.title,
        price: newPrice,
        qty: current.qty,
        unit: target.unit ?? undefined,
        addedBy: userId,
      });

      const total = context.cart.total - current.price * current.qty + newPrice * current.qty;
      await publishCartEvent(householdId, {
        type: "item-removed",
        itemId: current.id,
        title: current.title,
        total: context.cart.total - current.price * current.qty,
      });
      await publishCartEvent(householdId, {
        type: "item-added",
        item: {
          id: row.id,
          title: row.title,
          price: row.price,
          qty: row.qty,
          unit: row.unit ?? undefined,
          healthGrade: gradeItem({ title: target.title, category: target.category, macros: target.macros }).grade,
        },
        total,
      });

      return {
        result: { swapped: current.title, to: target.title, savings },
        actions: [
          { kind: "swap-item", itemId: current.id, toProductId: target.id, toTitle: target.title, savings },
        ],
      };
    }

    case "set_budget": {
      const args = call.args as ToolArgs["set_budget"];
      const applied = await setBudget(householdId, args.monthly);
      return {
        result: { monthly: args.monthly, applied },
        actions: [{ kind: "set-budget", monthly: args.monthly }],
      };
    }

    case "plan_week": {
      const args = call.args as ToolArgs["plan_week"];
      return {
        result: {
          people: args.people,
          weekBudget: args.budget ?? null,
          avoid: args.avoid,
          cart: context.cart.items.map((item) => ({ title: item.title, qty: item.qty, price: item.price })),
          spentThisMonth: context.spend.spent,
          monthlyBudget: context.spend.budget ?? null,
        },
        actions: [],
      };
    }

    case "get_live_prices": {
      const args = call.args as ToolArgs["get_live_prices"];
      const anchor = args.itemId ?? args.productKey;

      await publishCartEvent(
        householdId,
        { type: "price-request", itemId: anchor, productKey: args.productKey, by: "assistant" },
        { ephemeral: true },
      );

      const lookup = await lookupPrices(args.productKey);
      await publishCartEvent(householdId, {
        type: "price-snapshot",
        itemId: anchor,
        productKey: args.productKey,
        quotes: lookup.quotes,
      });

      const best = cheapestQuote(lookup.quotes);
      return {
        result: { quotes: lookup.quotes, cheapest: best, origin: lookup.origin, note: lookup.note ?? null },
        actions: [],
      };
    }

    case "suggest_recipe": {
      const args = call.args as ToolArgs["suggest_recipe"];
      const order = { facil: 1, media: 2, dificil: 3 } as const;
      const recipes = await findRecipes(householdId, 2);
      const match = recipes.find(
        (recipe) => recipe.timeMin <= args.maxTimeMin && order[recipe.difficulty] <= order[args.difficulty],
      );

      if (!match) return { result: { error: "Nada calza con lo que hay en el carrito." }, actions: [] };

      await publishChatEvent(householdId, { type: "recipe-suggestion", recipe: match });
      return {
        result: { recipe: match.title, timeMin: match.timeMin, kcal: match.kcalPerServing },
        actions: [{ kind: "accept-recipe", recipeSlug: match.slug }],
      };
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Datos incompletos.", issues: parsed.error.issues }, { status: 400 });
  }
  const { householdId, message } = parsed.data;

  // La identidad sale de la sesión de Clerk, no del body.
  const { denied, identity } = await membershipGate(householdId);
  if (denied) return denied;
  const userId = identity.profileId;

  // El efecto "vivo": las dos pantallas ven que la IA arrancó antes de que el
  // modelo devuelva nada. Ephemeral porque no debe quedar en el historial.
  publishActivity(householdId, "thinking");
  await publishChatEvent(
    householdId,
    { type: "assistant-thinking", hint: "Revisando el carrito y los precios…" },
    { ephemeral: true },
  );

  const context = await buildAssistantContext(householdId, message);
  const actions: AssistantAction[] = [];
  let text: string;

  const client = openaiClient();
  if (!client || !isModelAvailable()) {
    // Sin key la demo no se cae: contesta con lo que ya sabe del contexto.
    text = degradedReply(message, {
      total: context.cart.total,
      itemCount: context.cart.items.length,
      spent: context.spend.spent,
      budget: context.spend.budget,
      topSaving: null,
    }).text;
  } else {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemMessage(context.text) },
      { role: "user", content: message },
    ];

    let reply = "";
    try {
      for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
        const completion = await client.chat.completions.create({
          model: openaiModel(),
          messages,
          tools: openAiTools,
          temperature: 0.4,
          max_tokens: 400,
        });

        const choice = completion.choices[0]?.message;
        if (!choice) break;

        const toolCalls: ChatCompletionMessageToolCall[] = choice.tool_calls ?? [];
        if (toolCalls.length === 0 || round === MAX_TOOL_ROUNDS) {
          reply = choice.content ?? "";
          break;
        }

        messages.push({
          role: "assistant",
          content: choice.content,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          if (toolCall.type !== "function") continue;
          const parsedCall = parseToolCall(toolCall.function.name, toolCall.function.arguments);

          if (!parsedCall.ok) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: parsedCall.error }),
            });
            continue;
          }

          try {
            const outcome = await runTool(householdId, userId, context, parsedCall);
            actions.push(...outcome.actions);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(outcome.result).slice(0, 4000),
            });
          } catch (error) {
            console.warn(`[assistant] tool ${parsedCall.name} falló: ${error instanceof Error ? error.message : "?"}`);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "no se pudo ejecutar" }),
            });
          }
        }
      }
    } catch (error) {
      // Nunca se filtra el detalle del error del proveedor al cliente.
      console.warn(`[assistant] el modelo falló: ${error instanceof Error ? error.message : "?"}`);
      reply = "";
    }

    text =
      reply.trim() ||
      degradedReply(message, {
        total: context.cart.total,
        itemCount: context.cart.items.length,
        spent: context.spend.spent,
        budget: context.spend.budget,
        topSaving: null,
      }).text;
  }

  const published = await publishChatEvent(householdId, {
    type: "assistant-message",
    text,
    ...(actions.length > 0 ? { actions } : {}),
  });

  return Response.json({
    ok: true,
    message: { type: "assistant-message" as const, text, actions },
    publishedToChannel: published.ok,
  });
}
