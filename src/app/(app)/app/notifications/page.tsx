import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { requireHouseholdViewer } from "@/components/shell/server-data";

import { NotificationsInbox } from "./NotificationsInbox";

export const metadata: Metadata = { title: "Avisos" };

export default async function NotificationsPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  return (
    <PageShell>
      <PageHeader
        title="Avisos"
        description="Tu bandeja personal: alertas de presupuesto, movimientos de la casa y lo que note la IA."
      />

      <NotificationsInbox userId={viewer.clerkId} />
    </PageShell>
  );
}
