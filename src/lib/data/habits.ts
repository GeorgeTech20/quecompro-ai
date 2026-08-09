import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  HealthGrade,
  MealComponent,
  MealEvidenceType,
  MealLogRow,
  MealType,
} from "@/types/db";

import { unwrap, unwrapRows } from "./shared";

const MEAL_COLUMNS =
  "id, household_id, profile_id, meal_date, meal_type, health_grade, title, components, evidence_type, evidence_path, verified_at, created_at, updated_at";

export const HEALTHY_MEALS_TARGET = 2;

export type MealStreakSnapshot = {
  currentStreak: number;
  today: string;
  todayHealthyCount: number;
  target: number;
  meals: Partial<Record<MealType, MealLogRow>>;
  protectedToday: boolean;
  history: Array<{
    date: string;
    healthyCount: number;
    protected: boolean;
  }>;
};

export function todayInLima(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shiftDate(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function isHealthy(grade: HealthGrade): boolean {
  return grade === "A" || grade === "B";
}

function isVerifiedHealthy(row: MealLogRow): boolean {
  return Boolean(row.verified_at && row.evidence_path) && isHealthy(row.health_grade);
}

export async function getMealStreak(
  householdId: string,
  profileId: string,
): Promise<MealStreakSnapshot> {
  const today = todayInLima();
  const since = shiftDate(today, -370);
  const result = await supabaseAdmin()
    .from("meal_logs")
    .select(MEAL_COLUMNS)
    .eq("household_id", householdId)
    .eq("profile_id", profileId)
    .gte("meal_date", since)
    .lte("meal_date", today)
    .order("meal_date", { ascending: false });

  const rows = unwrapRows<MealLogRow>(result, "getMealStreak");
  const byDate = new Map<string, MealLogRow[]>();
  for (const row of rows) byDate.set(row.meal_date, [...(byDate.get(row.meal_date) ?? []), row]);

  const todayRows = byDate.get(today) ?? [];
  const todayHealthyCount = todayRows.filter(isVerifiedHealthy).length;
  const protectedToday = todayHealthyCount >= HEALTHY_MEALS_TARGET;

  let currentStreak = 0;
  let cursor = protectedToday ? today : shiftDate(today, -1);
  while (true) {
    const healthyCount = (byDate.get(cursor) ?? []).filter(isVerifiedHealthy).length;
    if (healthyCount < HEALTHY_MEALS_TARGET) break;
    currentStreak += 1;
    cursor = shiftDate(cursor, -1);
  }

  const meals: Partial<Record<MealType, MealLogRow>> = {};
  for (const row of todayRows) meals[row.meal_type] = row;

  const history = [...byDate.entries()]
    .map(([date, dateRows]) => {
      const healthyCount = dateRows.filter(isVerifiedHealthy).length;
      return {
        date,
        healthyCount,
        protected: healthyCount >= HEALTHY_MEALS_TARGET,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    currentStreak,
    today,
    todayHealthyCount,
    target: HEALTHY_MEALS_TARGET,
    meals,
    protectedToday,
    history,
  };
}

export async function upsertMealLog(input: {
  householdId: string;
  profileId: string;
  mealType: MealType;
  healthGrade: HealthGrade;
  title: string;
  components: MealComponent[];
  evidenceType: MealEvidenceType;
  evidencePath: string;
  verifiedAt?: string;
}): Promise<MealLogRow> {
  const previous = await supabaseAdmin()
    .from("meal_logs")
    .select("evidence_path")
    .eq("household_id", input.householdId)
    .eq("profile_id", input.profileId)
    .eq("meal_date", todayInLima())
    .eq("meal_type", input.mealType)
    .maybeSingle();

  if (previous.error) throw previous.error;

  const result = await supabaseAdmin()
    .from("meal_logs")
    .upsert(
      {
        household_id: input.householdId,
        profile_id: input.profileId,
        meal_date: todayInLima(),
        meal_type: input.mealType,
        health_grade: input.healthGrade,
        title: input.title.trim().slice(0, 100),
        components: input.components,
        evidence_type: input.evidenceType,
        evidence_path: input.evidencePath,
        verified_at: input.verifiedAt ?? new Date().toISOString(),
      },
      { onConflict: "profile_id,meal_date,meal_type" },
    )
    .select(MEAL_COLUMNS)
    .single();

  const row = unwrap<MealLogRow>(result, "upsertMealLog");
  const oldPath = previous.data?.evidence_path as string | undefined;
  if (oldPath && oldPath !== input.evidencePath) {
    await supabaseAdmin().storage.from("meal-evidence").remove([oldPath]);
  }
  return row;
}

export async function removeMealLog(
  householdId: string,
  profileId: string,
  mealType: MealType,
): Promise<void> {
  const existing = await supabaseAdmin()
    .from("meal_logs")
    .select("evidence_path")
    .eq("household_id", householdId)
    .eq("profile_id", profileId)
    .eq("meal_date", todayInLima())
    .eq("meal_type", mealType)
    .maybeSingle();

  if (existing.error) throw existing.error;

  const result = await supabaseAdmin()
    .from("meal_logs")
    .delete()
    .eq("household_id", householdId)
    .eq("profile_id", profileId)
    .eq("meal_date", todayInLima())
    .eq("meal_type", mealType);

  if (result.error) throw result.error;
  const evidencePath = existing.data?.evidence_path as string | undefined;
  if (evidencePath) {
    await supabaseAdmin().storage.from("meal-evidence").remove([evidencePath]);
  }
}
