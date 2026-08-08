import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveViewer } from "@/components/shell/server-data";

import { BudgetForm } from "../Forms";
import { DEFAULT_BUDGET } from "../state";

export const metadata: Metadata = { title: "Presupuesto" };

export default async function BudgetPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");
  // Sin casa creada todavía no hay nada a lo que ponerle presupuesto.
  if (!viewer.household) redirect("/onboarding/household");

  return <BudgetForm initial={viewer.household.monthly_budget || DEFAULT_BUDGET} />;
}
