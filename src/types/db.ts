/**
 * Tipos de fila de la base (espejo de `supabase/migrations/0001_schema.sql`).
 *
 * Son los tipos "tal como vienen de Postgres": `numeric` llega como number
 * porque supabase-js lo parsea, y `timestamptz` como string ISO.
 *
 * `HealthGrade` y `RecipeDifficulty` no se redefinen aquí: el contrato de
 * dominio vive en `src/lib/realtime/channels.ts` y la base se adapta a él, no
 * al revés.
 */

import type { HealthGrade, RecipeSuggestion } from "@/lib/realtime/channels";

export type { HealthGrade };

export type RecipeDifficulty = RecipeSuggestion["difficulty"];

export type MembershipRole = "owner" | "member";

/** Claves de máquina; la UI las traduce ("lacteos" → "Lácteos"). */
export type ProductCategory =
  | "carnes"
  | "verduras"
  | "frutas"
  | "granos"
  | "lacteos"
  | "abarrotes"
  | "bebidas"
  | "limpieza"
  | "snacks"
  | "condimentos";

export type PriceSource = "live" | "dataset";
export type MealType = "breakfast" | "lunch" | "dinner";
export type MealComponent = "produce" | "protein" | "carbs";
export type MealEvidenceType = "photo";

// --- households ------------------------------------------------------------

export type HouseholdRow = {
  id: string;
  name: string;
  monthly_budget: number;
  currency: string;
  invite_token: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdInsert = {
  name: string;
  monthly_budget?: number;
  currency?: string;
  invite_token?: string | null;
};

// --- profiles --------------------------------------------------------------

export type ProfileRow = {
  id: string;
  clerk_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  whatsapp_phone: string | null;
  occupation: string | null;
  shopping_goals: string[];
  diet_tags: string[];
  allergies: string[];
  active_household_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileUpsert = {
  clerk_id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  whatsapp_phone?: string | null;
  occupation?: string | null;
  shopping_goals?: string[];
  diet_tags?: string[];
  allergies?: string[];
  active_household_id?: string | null;
};

// --- memberships -----------------------------------------------------------

export type MembershipRow = {
  id: string;
  household_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: string;
};

/** Miembro + su perfil, que es como lo pide la pantalla de colaboradores. */
export type MemberWithProfile = MembershipRow & {
  profile: Pick<ProfileRow, "id" | "full_name" | "avatar_url" | "clerk_id"> | null;
};

// --- products / nutrition --------------------------------------------------

export type ProductRow = {
  id: string;
  /** Identidad canónica del producto, compartida entre tiendas. */
  product_key: string;
  name: string;
  brand: string | null;
  store: string;
  price: number;
  unit: string;
  category: string;
  health_grade: HealthGrade | null;
  created_at: string;
  updated_at: string;
};

export type NutritionRow = {
  product_id: string;
  per_grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  created_at: string;
  updated_at: string;
};

/** Macros sin los metadatos de fila; lo que consume la IA y las tarjetas. */
export type Macros = Pick<
  NutritionRow,
  "kcal" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g" | "sodium_mg"
>;

export type ProductWithMacros = ProductRow & { macros: Macros | null };

// --- cart_items ------------------------------------------------------------

export type CartItemRow = {
  id: string;
  household_id: string;
  product_id: string | null;
  title: string;
  price: number;
  qty: number;
  unit: string;
  store: string | null;
  category: string | null;
  health_grade: HealthGrade | null;
  note: string | null;
  added_by: string | null;
  purchased_at: string | null;
  purchased_by: string | null;
  purchase_photo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CartItemInsert = {
  household_id: string;
  product_id?: string | null;
  title: string;
  price: number;
  qty?: number;
  unit?: string;
  store?: string | null;
  category?: string | null;
  health_grade?: HealthGrade | null;
  note?: string | null;
  added_by?: string | null;
};

// --- meal_logs / healthy streak -------------------------------------------

export type MealLogRow = {
  id: string;
  household_id: string;
  profile_id: string;
  meal_date: string;
  meal_type: MealType;
  health_grade: HealthGrade;
  title: string;
  components: MealComponent[];
  evidence_type: MealEvidenceType;
  evidence_path: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
};

export type MealLogInsert = {
  household_id: string;
  profile_id: string;
  meal_date?: string;
  meal_type: MealType;
  health_grade?: HealthGrade;
  title: string;
  components: MealComponent[];
  evidence_type: MealEvidenceType;
  evidence_path: string;
  verified_at?: string;
};

// --- meal_plans / today and tomorrow --------------------------------------

export type MealPlanRow = {
  id: string;
  household_id: string;
  created_by: string | null;
  plan_date: string;
  meal_type: MealType;
  title: string;
  created_at: string;
  updated_at: string;
};

// --- transactions ----------------------------------------------------------

/** Detalle congelado dentro de `transactions.items` (jsonb). */
export type TransactionItem = {
  title: string;
  price: number;
  qty: number;
  unit: string;
  productId?: string | null;
};

export type TransactionRow = {
  id: string;
  household_id: string;
  created_by: string | null;
  total: number;
  store: string | null;
  items: TransactionItem[];
  note: string | null;
  created_at: string;
};

export type TransactionInsert = {
  household_id: string;
  created_by?: string | null;
  total: number;
  store?: string | null;
  items?: TransactionItem[];
  note?: string | null;
};

// --- recipes ---------------------------------------------------------------

export type RecipeRow = {
  id: string;
  slug: string;
  title: string;
  steps: string[];
  time_min: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  kcal_per_serving: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  product_id: string | null;
  name: string;
  qty: number;
  unit: string;
  is_optional: boolean;
};

// --- price_snapshots -------------------------------------------------------

export type PriceSnapshotRow = {
  id: string;
  product_key: string;
  store: string;
  price: number;
  unit: string;
  source: PriceSource;
  fetched_at: string;
};

export type PriceSnapshotInsert = {
  product_key: string;
  store: string;
  price: number;
  unit?: string;
  source?: PriceSource;
  fetched_at?: string;
};

// --- market_prices ----------------------------------------------------------

export type MarketPriceRow = {
  id: string;
  household_id: string;
  cart_item_id: string | null;
  product_key: string;
  title: string;
  unit: string;
  price: number;
  market: string | null;
  stall: string | null;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
  updated_at: string;
};

export type MarketPriceInsert = {
  household_id: string;
  cart_item_id?: string | null;
  product_key: string;
  title: string;
  unit?: string;
  price: number;
  market?: string | null;
  stall?: string | null;
  note?: string | null;
  recorded_by?: string | null;
};
