import "server-only";

import { randomBytes } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  HouseholdInsert,
  HouseholdRow,
  MemberWithProfile,
  MembershipRole,
  MembershipRow,
  ProfileRow,
  ProfileUpsert,
} from "@/types/db";
import { unwrap, unwrapRows, uniqueIds } from "./shared";

const HOUSEHOLD_COLUMNS =
  "id, name, monthly_budget, currency, invite_token, created_at, updated_at";

const PROFILE_COLUMNS =
  "id, clerk_id, email, full_name, avatar_url, whatsapp_phone, diet_tags, allergies, active_household_id, created_at, updated_at";

const MEMBERSHIP_COLUMNS = "id, household_id, user_id, role, joined_at";

/** Token corto y url-safe para /invite/[token]. */
export function newInviteToken(): string {
  return randomBytes(9).toString("base64url");
}

// --- perfiles --------------------------------------------------------------

export async function getProfileByClerkId(clerkId: string): Promise<ProfileRow | null> {
  const result = await supabaseAdmin()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("clerk_id", clerkId)
    .maybeSingle();

  return unwrap<ProfileRow | null>(result, "getProfileByClerkId");
}

/**
 * Crea o actualiza el perfil a partir de lo que dice Clerk. Es lo primero que
 * corre después del login: `clerk_id` es la clave natural.
 */
export async function upsertProfile(input: ProfileUpsert): Promise<ProfileRow> {
  const result = await supabaseAdmin()
    .from("profiles")
    .upsert(
      {
        clerk_id: input.clerk_id,
        email: input.email ?? null,
        full_name: input.full_name ?? null,
        avatar_url: input.avatar_url ?? null,
        ...(input.whatsapp_phone === undefined ? {} : { whatsapp_phone: input.whatsapp_phone }),
        ...(input.diet_tags === undefined ? {} : { diet_tags: input.diet_tags }),
        ...(input.allergies === undefined ? {} : { allergies: input.allergies }),
        ...(input.active_household_id === undefined
          ? {}
          : { active_household_id: input.active_household_id }),
      },
      { onConflict: "clerk_id" },
    )
    .select(PROFILE_COLUMNS)
    .single();

  return unwrap<ProfileRow>(result, "upsertProfile");
}

export type ProfilePreferences = {
  full_name?: string | null;
  avatar_url?: string | null;
  whatsapp_phone?: string | null;
  diet_tags?: string[];
  allergies?: string[];
};

export async function updateProfilePreferences(
  profileId: string,
  patch: ProfilePreferences,
): Promise<ProfileRow | null> {
  const result = await supabaseAdmin()
    .from("profiles")
    .update(patch)
    .eq("id", profileId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  return unwrap<ProfileRow | null>(result, "updateProfilePreferences");
}

export async function setActiveHousehold(
  profileId: string,
  householdId: string | null,
): Promise<ProfileRow | null> {
  const result = await supabaseAdmin()
    .from("profiles")
    .update({ active_household_id: householdId })
    .eq("id", profileId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  return unwrap<ProfileRow | null>(result, "setActiveHousehold");
}

// --- casas -----------------------------------------------------------------

export async function getHouseholdById(householdId: string): Promise<HouseholdRow | null> {
  const result = await supabaseAdmin()
    .from("households")
    .select(HOUSEHOLD_COLUMNS)
    .eq("id", householdId)
    .maybeSingle();

  return unwrap<HouseholdRow | null>(result, "getHouseholdById");
}

export async function getHouseholdByInviteToken(token: string): Promise<HouseholdRow | null> {
  const result = await supabaseAdmin()
    .from("households")
    .select(HOUSEHOLD_COLUMNS)
    .eq("invite_token", token)
    .maybeSingle();

  return unwrap<HouseholdRow | null>(result, "getHouseholdByInviteToken");
}

/** Crea la casa y deja al creador como `owner` en el mismo paso. */
export async function createHousehold(
  input: HouseholdInsert,
  ownerProfileId: string,
): Promise<HouseholdRow> {
  const result = await supabaseAdmin()
    .from("households")
    .insert({
      name: input.name,
      monthly_budget: input.monthly_budget ?? 1200,
      currency: input.currency ?? "PEN",
      invite_token: input.invite_token ?? newInviteToken(),
    })
    .select(HOUSEHOLD_COLUMNS)
    .single();

  const household = unwrap<HouseholdRow>(result, "createHousehold");
  await joinHousehold(household.id, ownerProfileId, "owner");
  await setActiveHousehold(ownerProfileId, household.id);
  return household;
}

export async function updateHouseholdBudget(
  householdId: string,
  monthlyBudget: number,
): Promise<HouseholdRow | null> {
  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
    throw new Error(`[data:updateHouseholdBudget] presupuesto inválido: ${monthlyBudget}`);
  }

  const result = await supabaseAdmin()
    .from("households")
    .update({ monthly_budget: monthlyBudget })
    .eq("id", householdId)
    .select(HOUSEHOLD_COLUMNS)
    .maybeSingle();

  return unwrap<HouseholdRow | null>(result, "updateHouseholdBudget");
}

/** Invalida el link viejo de invitación y devuelve el nuevo. */
export async function rotateInviteToken(householdId: string): Promise<string | null> {
  const token = newInviteToken();
  const result = await supabaseAdmin()
    .from("households")
    .update({ invite_token: token })
    .eq("id", householdId)
    .select("invite_token")
    .maybeSingle();

  return unwrap<{ invite_token: string | null } | null>(result, "rotateInviteToken")?.invite_token ?? null;
}

// --- membresías ------------------------------------------------------------

export async function joinHousehold(
  householdId: string,
  profileId: string,
  role: MembershipRole = "member",
): Promise<MembershipRow> {
  const result = await supabaseAdmin()
    .from("memberships")
    .upsert(
      { household_id: householdId, user_id: profileId, role },
      { onConflict: "household_id,user_id" },
    )
    .select(MEMBERSHIP_COLUMNS)
    .single();

  return unwrap<MembershipRow>(result, "joinHousehold");
}

export async function leaveHousehold(householdId: string, profileId: string): Promise<void> {
  const result = await supabaseAdmin()
    .from("memberships")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", profileId)
    .select("id");

  unwrapRows<{ id: string }>(result, "leaveHousehold");
}

/**
 * Portero de todo el resto del data layer: antes de leer o escribir cualquier
 * cosa de una casa, la API route pregunta aquí.
 */
export async function isMember(householdId: string, profileId: string): Promise<boolean> {
  const result = await supabaseAdmin()
    .from("memberships")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", profileId)
    .limit(1);

  return unwrapRows<{ id: string }>(result, "isMember").length > 0;
}

export async function getHouseholdsForUser(profileId: string): Promise<HouseholdRow[]> {
  const membershipsResult = await supabaseAdmin()
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("user_id", profileId);

  const memberships = unwrapRows<MembershipRow>(membershipsResult, "getHouseholdsForUser");
  const householdIds = uniqueIds(memberships.map((m) => m.household_id));
  if (householdIds.length === 0) return [];

  const result = await supabaseAdmin()
    .from("households")
    .select(HOUSEHOLD_COLUMNS)
    .in("id", householdIds)
    .order("created_at", { ascending: true });

  return unwrapRows<HouseholdRow>(result, "getHouseholdsForUser:households");
}

/**
 * Miembros de la casa con su perfil. Dos consultas en vez de un embed de
 * PostgREST: la forma del embed depende de cómo detecte la FK, y aquí prefiero
 * algo que no cambie solo.
 */
export async function getHouseholdMembers(householdId: string): Promise<MemberWithProfile[]> {
  const membershipsResult = await supabaseAdmin()
    .from("memberships")
    .select(MEMBERSHIP_COLUMNS)
    .eq("household_id", householdId)
    .order("joined_at", { ascending: true });

  const memberships = unwrapRows<MembershipRow>(membershipsResult, "getHouseholdMembers");
  const profileIds = uniqueIds(memberships.map((m) => m.user_id));
  if (profileIds.length === 0) return [];

  const profilesResult = await supabaseAdmin()
    .from("profiles")
    .select("id, full_name, avatar_url, clerk_id")
    .in("id", profileIds);

  const profiles = unwrapRows<Pick<ProfileRow, "id" | "full_name" | "avatar_url" | "clerk_id">>(
    profilesResult,
    "getHouseholdMembers:profiles",
  );
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));

  return memberships.map((membership) => ({
    ...membership,
    profile: byId.get(membership.user_id) ?? null,
  }));
}
