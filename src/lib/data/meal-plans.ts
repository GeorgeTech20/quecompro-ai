import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type { MealPlanRow, MealType } from "@/types/db";

import { unwrapRows } from "./shared";

const COLUMNS = "id, household_id, created_by, plan_date, meal_type, title, created_at, updated_at";

export async function getMealPlans(
  householdId: string,
  from: string,
  to: string,
): Promise<MealPlanRow[]> {
  const result = await supabaseAdmin()
    .from("meal_plans")
    .select(COLUMNS)
    .eq("household_id", householdId)
    .gte("plan_date", from)
    .lte("plan_date", to)
    .order("plan_date")
    .order("meal_type");
  return unwrapRows<MealPlanRow>(result, "getMealPlans");
}

export async function saveMealPlan(input: {
  householdId: string;
  profileId: string;
  planDate: string;
  mealType: MealType;
  title: string;
}): Promise<void> {
  const clean = input.title.trim().slice(0, 100);
  if (!clean) {
    const result = await supabaseAdmin()
      .from("meal_plans")
      .delete()
      .eq("household_id", input.householdId)
      .eq("plan_date", input.planDate)
      .eq("meal_type", input.mealType);
    if (result.error) throw result.error;
    return;
  }

  const result = await supabaseAdmin().from("meal_plans").upsert(
    {
      household_id: input.householdId,
      created_by: input.profileId,
      plan_date: input.planDate,
      meal_type: input.mealType,
      title: clean,
    },
    { onConflict: "household_id,plan_date,meal_type" },
  );
  if (result.error) throw result.error;
}
