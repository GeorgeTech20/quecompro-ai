import type { Metadata } from "next";

import { pendingHouseholdName } from "../actions";
import { WelcomeForm } from "../Forms";

export const metadata: Metadata = { title: "Tu casa" };

export default async function WelcomePage() {
  const defaultName = await pendingHouseholdName();
  return <WelcomeForm defaultName={defaultName} />;
}
