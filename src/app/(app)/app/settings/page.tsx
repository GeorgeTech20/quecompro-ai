import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { requireHouseholdViewer } from "@/components/shell/server-data";

import { HouseholdSettingsForm, NoticeSettings, PreferencesForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const { household, profile } = viewer;

  return (
    <PageShell>
      <PageHeader
        title="Ajustes"
        description="Lo de la casa lo ven todos; lo tuyo, solo tú."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <HouseholdSettingsForm
            name={household.name}
            monthlyBudget={household.monthly_budget}
            currency={household.currency}
          />
          <NoticeSettings />
        </div>

        <PreferencesForm
          dietTags={profile.diet_tags}
          allergies={profile.allergies}
          whatsapp={profile.whatsapp_phone}
        />
      </div>
    </PageShell>
  );
}
