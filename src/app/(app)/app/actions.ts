"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  getMealStreak,
  getMealPlans,
  getProfileByClerkId,
  isMember,
  removeMealLog,
  saveMealPlan,
  todayInLima,
  upsertMealLog,
  type MealStreakSnapshot,
} from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase/server";
import { assertRealImage } from "@/lib/images/sniff";
import type { MealComponent, MealType } from "@/types/db";

export type MealActionResult =
  | { ok: true; snapshot: MealStreakSnapshot }
  | { ok: false; error: string };

const MEAL_TYPES = new Set<MealType>(["breakfast", "lunch", "dinner"]);
const COMPONENTS = new Set<MealComponent>(["produce", "protein", "carbs"]);
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function shiftDate(date: string, amount: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export async function saveMealPlanAction(
  householdId: string,
  input: { planDate: string; mealType: MealType; title: string },
) {
  const profile = await authorizedProfile(householdId);
  if (!profile) return { ok: false as const, error: "Tu sesión venció o no perteneces a esta casa." };
  const today = todayInLima();
  const allowedDates = new Set([today, shiftDate(today, 1)]);
  if (!allowedDates.has(input.planDate) || !MEAL_TYPES.has(input.mealType)) {
    return { ok: false as const, error: "Solo puedes planear hoy o mañana." };
  }
  try {
    await saveMealPlan({
      householdId,
      profileId: profile.id,
      planDate: input.planDate,
      mealType: input.mealType,
      title: input.title,
    });
    const plans = await getMealPlans(householdId, today, shiftDate(today, 1));
    revalidatePath("/app");
    return { ok: true as const, plans };
  } catch (error) {
    console.warn(`[home:meal-plan] ${error instanceof Error ? error.message : "error"}`);
    return { ok: false as const, error: "No pudimos guardar el plan. Aplica la migración 0005 e intenta otra vez." };
  }
}
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

async function authorizedProfile(householdId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  const profile = await getProfileByClerkId(userId);
  if (!profile || !(await isMember(householdId, profile.id))) return null;
  return profile;
}

export async function recordHealthyMealAction(
  householdId: string,
  formData: FormData,
): Promise<MealActionResult> {
  const profile = await authorizedProfile(householdId);
  if (!profile) return { ok: false, error: "Tu sesión venció o no perteneces a esta casa." };

  const rawMealType = formData.get("mealType");
  const mealType = typeof rawMealType === "string" ? (rawMealType as MealType) : null;
  if (!mealType || !MEAL_TYPES.has(mealType)) {
    return { ok: false, error: "Ese tipo de comida no existe." };
  }

  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  if (title.length < 3) {
    return { ok: false, error: "Cuéntanos qué comiste." };
  }

  const components = [...new Set(formData.getAll("components").map(String))].filter(
    (value): value is MealComponent => COMPONENTS.has(value as MealComponent),
  );
  if (components.length < 2) {
    return { ok: false, error: "Elige al menos 2 grupos para considerar la comida balanceada." };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: "Agrega una foto de la comida para guardar la racha." };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "La foto pesa más de 8 MB. Elige una más liviana." };
  }
  // Firma real, no el `Content-Type` que declara el navegador. Ver `sniff.ts`.
  const sniffed = await assertRealImage(photo);
  if (!sniffed.ok) return { ok: false, error: sniffed.error };
  const extension = PHOTO_EXTENSIONS[sniffed.type];

  const evidencePath = `${householdId}/${profile.id}/${todayInLima()}-${mealType}-${crypto.randomUUID()}.${extension}`;

  try {
    const upload = await supabaseAdmin()
      .storage.from("meal-evidence")
      .upload(evidencePath, await photo.arrayBuffer(), {
        contentType: sniffed.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (upload.error) throw upload.error;

    try {
      await upsertMealLog({
        householdId,
        profileId: profile.id,
        mealType,
        healthGrade: components.length === 3 ? "A" : "B",
        title,
        components,
        evidenceType: "photo",
        evidencePath,
      });
    } catch (error) {
      await supabaseAdmin().storage.from("meal-evidence").remove([evidencePath]);
      throw error;
    }

    const snapshot = await getMealStreak(householdId, profile.id);
    revalidatePath("/app");
    return { ok: true, snapshot };
  } catch (error) {
    const message = error instanceof Error ? error.message : "error";
    console.warn(`[home:meal-record] ${message}`);
    if (message.includes("meal-evidence") || message.includes("meal_logs")) {
      return { ok: false, error: "El registro de rachas aún necesita la migración de Supabase." };
    }
    return { ok: false, error: "No pudimos guardar la comida. Intenta otra vez." };
  }
}

export async function removeHealthyMealAction(
  householdId: string,
  mealType: MealType,
): Promise<MealActionResult> {
  if (!MEAL_TYPES.has(mealType)) return { ok: false, error: "Ese tipo de comida no existe." };

  const profile = await authorizedProfile(householdId);
  if (!profile) return { ok: false, error: "Tu sesión venció o no perteneces a esta casa." };

  try {
    await removeMealLog(householdId, profile.id, mealType);
    const snapshot = await getMealStreak(householdId, profile.id);
    revalidatePath("/app");
    return { ok: true, snapshot };
  } catch (error) {
    console.warn(`[home:meal-remove] ${error instanceof Error ? error.message : "error"}`);
    return { ok: false, error: "No pudimos eliminar el registro. Intenta otra vez." };
  }
}
