import "server-only";

import type { RecipeSuggestion } from "@/lib/realtime/channels";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { RecipeDifficulty, RecipeIngredientRow, RecipeRow } from "@/types/db";
import { unwrap, unwrapRows, uniqueIds } from "./shared";

const RECIPE_COLUMNS =
  "id, slug, title, steps, time_min, servings, difficulty, tags, kcal_per_serving, image_url, created_at, updated_at";

const INGREDIENT_COLUMNS = "id, recipe_id, product_id, name, qty, unit, is_optional";

/**
 * La regla de oro: con **2 ingredientes** del carrito ya vale la pena sugerir
 * la receta. Menos que eso es ruido ("tienes sal, cocina esto").
 */
export const MIN_INGREDIENT_MATCHES = 2;

/** `facil` primero: quien no sabe cocinar es justo quien necesita la sugerencia. */
const DIFFICULTY_ORDER: Record<RecipeDifficulty, number> = {
  facil: 0,
  media: 1,
  dificil: 2,
};

export type MatchedIngredient = RecipeIngredientRow & { inCart: boolean };

export type RecipeMatch = {
  recipe: RecipeRow;
  ingredients: MatchedIngredient[];
  /** Ingredientes de la receta que el carrito ya cubre. */
  matched: number;
  /** Ingredientes no opcionales que pide la receta. */
  required: number;
  /** matched / required, acotado a 1. */
  coverage: number;
};

export async function listRecipes(limit = 24): Promise<RecipeRow[]> {
  const result = await supabaseAdmin()
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .order("time_min", { ascending: true })
    .limit(limit);

  return unwrapRows<RecipeRow>(result, "listRecipes");
}

export async function getRecipeBySlug(
  slug: string,
): Promise<{ recipe: RecipeRow; ingredients: RecipeIngredientRow[] } | null> {
  const recipeResult = await supabaseAdmin()
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  const recipe = unwrap<RecipeRow | null>(recipeResult, "getRecipeBySlug");
  if (!recipe) return null;

  const ingredientsResult = await supabaseAdmin()
    .from("recipe_ingredients")
    .select(INGREDIENT_COLUMNS)
    .eq("recipe_id", recipe.id);

  return {
    recipe,
    ingredients: unwrapRows<RecipeIngredientRow>(ingredientsResult, "getRecipeBySlug:ingredients"),
  };
}

/**
 * Recetas que el carrito ya alcanza a cubrir.
 *
 * Devuelve solo las que comparten `MIN_INGREDIENT_MATCHES` o más productos con
 * el carrito, ordenadas por cuántos cubre, luego por qué proporción de la
 * receta es eso, y luego por dificultad (`facil` primero) y tiempo.
 *
 * Un ingrediente repetido en la misma receta cuenta una sola vez.
 */
export async function matchRecipes(
  productIds: readonly string[],
  options: { limit?: number } = {},
): Promise<RecipeMatch[]> {
  const ids = uniqueIds(productIds);
  if (ids.length === 0) return [];

  const hitsResult = await supabaseAdmin()
    .from("recipe_ingredients")
    .select("recipe_id, product_id")
    .in("product_id", ids);

  const hits = unwrapRows<{ recipe_id: string; product_id: string | null }>(
    hitsResult,
    "matchRecipes:hits",
  );
  if (hits.length === 0) return [];

  const matchedProductsByRecipe = new Map<string, Set<string>>();
  for (const hit of hits) {
    if (!hit.product_id) continue;
    const set = matchedProductsByRecipe.get(hit.recipe_id) ?? new Set<string>();
    set.add(hit.product_id);
    matchedProductsByRecipe.set(hit.recipe_id, set);
  }

  const recipeIds = [...matchedProductsByRecipe.entries()]
    .filter(([, products]) => products.size >= MIN_INGREDIENT_MATCHES)
    .map(([recipeId]) => recipeId);

  if (recipeIds.length === 0) return [];

  const [recipesResult, ingredientsResult] = await Promise.all([
    supabaseAdmin().from("recipes").select(RECIPE_COLUMNS).in("id", recipeIds),
    supabaseAdmin().from("recipe_ingredients").select(INGREDIENT_COLUMNS).in("recipe_id", recipeIds),
  ]);

  const recipes = unwrapRows<RecipeRow>(recipesResult, "matchRecipes:recipes");
  const ingredients = unwrapRows<RecipeIngredientRow>(
    ingredientsResult,
    "matchRecipes:ingredients",
  );

  const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();
  for (const ingredient of ingredients) {
    const list = ingredientsByRecipe.get(ingredient.recipe_id) ?? [];
    list.push(ingredient);
    ingredientsByRecipe.set(ingredient.recipe_id, list);
  }

  const inCart = new Set(ids);

  const matches = recipes.map((recipe): RecipeMatch => {
    const list = ingredientsByRecipe.get(recipe.id) ?? [];
    const marked = list.map((ingredient) => ({
      ...ingredient,
      inCart: ingredient.product_id !== null && inCart.has(ingredient.product_id),
    }));

    const matched = matchedProductsByRecipe.get(recipe.id)?.size ?? 0;
    const required = marked.filter((ingredient) => !ingredient.is_optional).length;

    return {
      recipe,
      ingredients: marked,
      matched,
      required,
      coverage: required === 0 ? 0 : Math.min(1, matched / required),
    };
  });

  return matches
    .sort(
      (a, b) =>
        b.matched - a.matched ||
        b.coverage - a.coverage ||
        DIFFICULTY_ORDER[a.recipe.difficulty] - DIFFICULTY_ORDER[b.recipe.difficulty] ||
        a.recipe.time_min - b.recipe.time_min,
    )
    .slice(0, Math.max(options.limit ?? 5, 1));
}

/**
 * Lo mismo que `matchRecipes`, pero partiendo del carrito de la casa. Es la
 * llamada que hace el asistente: no tiene por qué saber armar la lista de
 * product_id.
 */
export async function matchRecipesForCart(
  householdId: string,
  options: { limit?: number } = {},
): Promise<RecipeMatch[]> {
  const result = await supabaseAdmin()
    .from("cart_items")
    .select("product_id")
    .eq("household_id", householdId)
    .not("product_id", "is", null);

  const rows = unwrapRows<{ product_id: string | null }>(result, "matchRecipesForCart");
  const productIds = rows
    .map((row) => row.product_id)
    .filter((id): id is string => id !== null);

  return matchRecipes(productIds, options);
}

/** Pasa un match al shape que viaja por el canal de chat (tope 2 KB). */
export function toRecipeSuggestion(match: RecipeMatch): RecipeSuggestion {
  return {
    slug: match.recipe.slug,
    title: match.recipe.title,
    timeMin: match.recipe.time_min,
    difficulty: match.recipe.difficulty,
    kcalPerServing: match.recipe.kcal_per_serving ?? 0,
    servings: match.recipe.servings,
    ingredients: match.ingredients.map((ingredient) => ({
      name: ingredient.name,
      qty: ingredient.qty,
      unit: ingredient.unit,
      inCart: ingredient.inCart,
    })),
    steps: match.recipe.steps,
  };
}
