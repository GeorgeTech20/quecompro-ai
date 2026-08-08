import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveViewer } from "@/components/shell/server-data";

import { DietForm } from "../Forms";

export const metadata: Metadata = { title: "Gustos" };

export default async function DietPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return <DietForm dietTags={viewer.profile.diet_tags} allergies={viewer.profile.allergies} />;
}
