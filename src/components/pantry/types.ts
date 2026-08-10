import type { HealthGrade, Macros, RecipeDifficulty } from "@/types/db";

/**
 * Modelos de vista de la despensa. Sin nada de servidor: los arma la página y
 * viajan tal cual a los componentes de cliente.
 */

export type ShelfKey = "frescos" | "proteina" | "lacteos" | "abarrotes";

/**
 * Los cuatro estantes del mueble. `categories` mapea las claves de máquina de
 * `products.category` a la balda donde vive el producto en una casa real: la
 * limpieza y las bebidas terminan en abarrotes porque es el estante de "todo lo
 * que no se malogra", no porque sean comida.
 */
export const SHELF_DEFS: readonly {
  key: ShelfKey;
  title: string;
  categories: readonly string[];
}[] = [
  { key: "frescos", title: "Verduras y frutas", categories: ["verduras", "frutas"] },
  { key: "proteina", title: "Carnes y huevos", categories: ["carnes", "huevos"] },
  { key: "lacteos", title: "Lácteos", categories: ["lacteos"] },
  {
    key: "abarrotes",
    title: "Abarrotes",
    categories: ["abarrotes", "granos", "condimentos", "snacks", "bebidas", "limpieza"],
  },
];

export type PantryItem = {
  /** Id estable de la línea agrupada; el producto puede repetirse en el mes. */
  key: string;
  productId: string | null;
  name: string;
  grade: HealthGrade | null;
  /** Unidades acumuladas del mes (compras cerradas + carrito abierto). */
  qty: number;
  unit: string;
  /** Lo que costó todo eso. */
  spent: number;
  unitPrice: number;
  store: string | null;
  categoryLabel: string;
  /** Última vez que entró a la casa. `null` si solo está en el carrito. */
  boughtAtIso: string | null;
  /** Todavía no se compró: está en el carrito abierto. */
  inCart: boolean;
  /** Por 100 g. El data layer no expone `per_grams`; el esquema fija 100. */
  macros: Macros | null;
};

export type PantryShelf = {
  key: ShelfKey;
  title: string;
  items: PantryItem[];
  /** Los que no cupieron en los 6 huecos del estante. */
  hidden: number;
};

export type PantryRecipe = {
  slug: string;
  title: string;
  timeMin: number;
  difficulty: RecipeDifficulty;
  servings: number;
  kcalPerServing: number | null;
  /** Ingredientes que la despensa ya cubre. */
  matched: number;
  /** Ingredientes no opcionales que pide la receta. */
  required: number;
  have: string[];
  missing: string[];
  /** Productos de la despensa que usa: sirve para el filtro «cocinar con esto». */
  usesProductIds: string[];
  steps: string[];
};

export type PantrySnapshot = {
  shelves: PantryShelf[];
  recipes: PantryRecipe[];
  itemCount: number;
  /** Lo que costó lo que hay adentro ahora mismo. */
  spent: number;
  gradeCount: Record<HealthGrade, number>;
};

export const DIFFICULTY_LABEL: Record<RecipeDifficulty, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};
