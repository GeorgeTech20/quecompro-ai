import "server-only";

import { unstable_rethrow } from "next/navigation";

import { SLOTS_PER_SHELF } from "@/components/pantry/iso";
import {
  SHELF_DEFS,
  type PantryItem,
  type PantryRecipe,
  type PantryShelf,
  type PantrySnapshot,
  type ShelfKey,
} from "@/components/pantry/types";
import {
  categoryLabel,
  loadCart,
  loadMonthSpend,
  loadProductsByIds,
  loadTransactions,
} from "@/components/shell/server-data";
import { getMacrosByProductIds, matchRecipes, type RecipeMatch } from "@/lib/data";
import type { HealthGrade, Macros, ProductRow } from "@/types/db";

/**
 * Puente de datos de la despensa.
 *
 * `src/components/shell/server-data.ts` es de otro agente y no expone ni los
 * macros ni el emparejado de recetas por lista de productos, así que la
 * despensa arma su propio puente en vez de parchear carpeta ajena. La regla se
 * mantiene: la pantalla no habla con Supabase, habla con este archivo.
 *
 * Qué es «la despensa»: lo comprado en el mes (`transactions`) más el carrito
 * abierto. Es la respuesta honesta a «qué tengo en casa» sin inventar un
 * inventario que nadie mantiene a mano.
 */

export type PantryLoad = { ok: true; snapshot: PantrySnapshot } | { ok: false };

type Draft = {
  key: string;
  productId: string | null;
  name: string;
  imageUrl: string | null;
  grade: HealthGrade | null;
  qty: number;
  unit: string;
  spent: number;
  unitPrice: number;
  store: string | null;
  categoryKey: string;
  boughtAtMs: number | null;
  inCart: boolean;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Cada categoría de la base cae en uno de los cuatro estantes del mueble. */
const SHELF_BY_CATEGORY = new Map<string, ShelfKey>(
  SHELF_DEFS.flatMap((shelf) => shelf.categories.map((category) => [category, shelf.key] as const)),
);

function shelfFor(categoryKey: string): ShelfKey {
  return SHELF_BY_CATEGORY.get(categoryKey) ?? "abarrotes";
}

function merge(drafts: Map<string, Draft>, draft: Draft): void {
  const current = drafts.get(draft.key);
  if (!current) {
    drafts.set(draft.key, draft);
    return;
  }

  // El mismo producto comprado dos veces en el mes es una sola caja más alta.
  current.qty = round2(current.qty + draft.qty);
  current.spent = round2(current.spent + draft.spent);
  current.inCart = current.inCart || draft.inCart;
  current.grade = current.grade ?? draft.grade;
  current.store = current.store ?? draft.store;
  current.imageUrl = current.imageUrl ?? draft.imageUrl;

  const newer =
    draft.boughtAtMs !== null && (current.boughtAtMs === null || draft.boughtAtMs > current.boughtAtMs);
  if (newer) {
    current.boughtAtMs = draft.boughtAtMs;
    current.unitPrice = draft.unitPrice;
  }
}

function toItem(draft: Draft, macros: Map<string, Macros>): PantryItem {
  return {
    key: draft.key,
    productId: draft.productId,
    name: draft.name,
    imageUrl: draft.imageUrl,
    grade: draft.grade,
    qty: draft.qty,
    unit: draft.unit,
    spent: draft.spent,
    unitPrice: draft.unitPrice,
    store: draft.store,
    categoryLabel: categoryLabel(draft.categoryKey),
    boughtAtIso: draft.boughtAtMs === null ? null : new Date(draft.boughtAtMs).toISOString(),
    inCart: draft.inCart,
    macros: draft.productId ? (macros.get(draft.productId) ?? null) : null,
  };
}

function toRecipe(match: RecipeMatch): PantryRecipe {
  const required = match.required > 0 ? match.required : match.ingredients.length;

  return {
    slug: match.recipe.slug,
    title: match.recipe.title,
    timeMin: match.recipe.time_min,
    difficulty: match.recipe.difficulty,
    servings: match.recipe.servings,
    kcalPerServing: match.recipe.kcal_per_serving,
    matched: match.matched,
    required,
    have: match.ingredients.filter((ingredient) => ingredient.inCart).map((i) => i.name),
    missing: match.ingredients
      .filter((ingredient) => !ingredient.inCart && !ingredient.is_optional)
      .map((ingredient) => ingredient.name),
    usesProductIds: match.ingredients
      .filter((ingredient) => ingredient.inCart)
      .map((ingredient) => ingredient.product_id)
      .filter((id): id is string => id !== null),
    steps: match.recipe.steps,
  };
}

export async function loadPantry(householdId: string): Promise<PantryLoad> {
  try {
    const [spend, transactions, cart] = await Promise.all([
      loadMonthSpend(householdId),
      loadTransactions(householdId, 200),
      loadCart(householdId),
    ]);

    // `loadTransactions` solo acepta un tope, no un rango: el recorte al mes de
    // Lima se hace acá con el `periodStart` que ya calculó el data layer.
    const periodStart = new Date(spend.periodStart).getTime();
    const lines = transactions
      .filter((transaction) => new Date(transaction.created_at).getTime() >= periodStart)
      .flatMap((transaction) => transaction.items.map((item) => ({ item, transaction })));

    const productIds = [
      ...cart.items.map((item) => item.product_id),
      ...lines.map(({ item }) => item.productId ?? null),
    ].filter((id): id is string => typeof id === "string" && id.length > 0);

    const [products, macros] = await Promise.all([
      loadProductsByIds(productIds),
      getMacrosByProductIds(productIds),
    ]);
    const byId = new Map<string, ProductRow>(products.map((product) => [product.id, product]));

    const drafts = new Map<string, Draft>();

    for (const { item, transaction } of lines) {
      const productId = item.productId ?? null;
      const product = productId ? byId.get(productId) : undefined;

      merge(drafts, {
        key: productId ?? `t:${item.title.trim().toLowerCase()}`,
        productId,
        name: item.title,
        imageUrl: product?.image_url ?? null,
        grade: product?.health_grade ?? null,
        qty: item.qty,
        unit: item.unit,
        spent: round2(item.price * item.qty),
        unitPrice: item.price,
        store: transaction.store ?? product?.store ?? null,
        categoryKey: product?.category ?? "abarrotes",
        boughtAtMs: new Date(transaction.created_at).getTime(),
        inCart: false,
      });
    }

    for (const row of cart.items) {
      const product = row.product_id ? byId.get(row.product_id) : undefined;

      merge(drafts, {
        key: row.product_id ?? `t:${row.title.trim().toLowerCase()}`,
        productId: row.product_id,
        name: row.title,
        imageUrl: product?.image_url ?? null,
        grade: row.health_grade ?? product?.health_grade ?? null,
        qty: row.qty,
        unit: row.unit,
        spent: round2(row.price * row.qty),
        unitPrice: row.price,
        store: row.store ?? product?.store ?? null,
        categoryKey: row.category ?? product?.category ?? "abarrotes",
        boughtAtMs: null,
        inCart: true,
      });
    }

    const items = [...drafts.values()].map((draft) => toItem(draft, macros));

    const shelves: PantryShelf[] = SHELF_DEFS.map((definition) => {
      const own = [...drafts.values()]
        .filter((draft) => shelfFor(draft.categoryKey) === definition.key)
        // Las cajas altas van al fondo del estante: así ninguna tapa a la de
        // adelante, que es la que además lleva la etiqueta con el nombre.
        .sort((a, b) => b.qty - a.qty || b.spent - a.spent)
        .map((draft) => toItem(draft, macros));

      return {
        key: definition.key,
        title: definition.title,
        items: own,
        hidden: Math.max(0, own.length - SLOTS_PER_SHELF),
      };
    });

    const gradeCount: Record<HealthGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const item of items) {
      if (item.grade) gradeCount[item.grade] += 1;
    }

    const recipes =
      productIds.length > 0
        ? (await matchRecipes(productIds, { limit: 6 })).map(toRecipe)
        : [];

    return {
      ok: true,
      snapshot: {
        shelves,
        recipes,
        itemCount: items.length,
        spent: round2(items.reduce((acc, item) => acc + item.spent, 0)),
        gradeCount,
      },
    };
  } catch (error) {
    // `redirect`, `notFound` y el bail-out a render dinámico viajan como
    // excepción: tragárselos rompería el framework en silencio.
    unstable_rethrow(error);
    console.warn(
      `[despensa] no se pudo leer la despensa: ${error instanceof Error ? error.message : "?"}`,
    );
    return { ok: false };
  }
}
