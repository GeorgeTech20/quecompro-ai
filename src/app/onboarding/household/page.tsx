import type { Metadata } from "next";

import { pendingHouseholdName } from "../actions";
import { HouseholdForm } from "../Forms";

export const metadata: Metadata = { title: "Crear o unirte" };

export default async function HouseholdStepPage() {
  const defaultName = await pendingHouseholdName();
  return <HouseholdForm defaultName={defaultName} />;
}
