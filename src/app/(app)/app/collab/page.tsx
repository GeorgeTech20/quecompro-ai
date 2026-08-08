import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader, PageShell } from "@/components/shell/PageHeader";
import { loadMembers, requireHouseholdViewer, safeLoad } from "@/components/shell/server-data";
import type { MemberWithProfile } from "@/types/db";

import { RoomiesList, type RoomieView } from "./RoomiesList";

export const metadata: Metadata = { title: "Roomies" };

/**
 * Roomies: quiénes viven en la casa, quién está mirando el carrito ahora mismo
 * y cómo sumar a alguien más.
 */
export default async function CollabPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  const members = await safeLoad<MemberWithProfile[]>(
    () => loadMembers(viewer.household.id),
    [],
    "roomies:miembros",
  );

  const rows: RoomieView[] = members.map((member) => ({
    id: member.profile?.id ?? member.user_id,
    clerkId: member.profile?.clerk_id ?? null,
    name: member.profile?.full_name ?? "Roomie sin nombre",
    avatarUrl: member.profile?.avatar_url ?? null,
    role: member.role,
    // El perfil que llega en `MemberWithProfile` no trae el teléfono, así que
    // solo se puede afirmar del usuario de la sesión. Ver nota del informe.
    whatsapp:
      member.profile?.clerk_id === viewer.clerkId ? viewer.profile.whatsapp_phone : null,
    joinedAt: member.joined_at,
  }));

  return (
    <PageShell>
      <PageHeader
        title="Roomies"
        description="El carrito es de la casa, no de una persona. Acá ves quién está adentro y quién está conectado."
      />

      <RoomiesList
        householdId={viewer.household.id}
        householdName={viewer.household.name}
        members={rows}
        currentClerkId={viewer.clerkId}
        displayName={viewer.displayName}
        avatarUrl={viewer.avatarUrl}
        initialToken={viewer.household.invite_token}
      />
    </PageShell>
  );
}
