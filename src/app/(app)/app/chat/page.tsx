import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireHouseholdViewer } from "@/components/shell/server-data";

import { ChatRoom } from "./ChatRoom";

export const metadata: Metadata = { title: "Asistente" };

/**
 * Asistente. La pantalla es casi todo el hilo, así que no usa `PageShell`: se
 * come el alto disponible y deja el compositor pegado abajo.
 */
export default async function ChatPage() {
  const viewer = await requireHouseholdViewer();
  if (!viewer) notFound();

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem-5rem)] w-full max-w-4xl flex-col gap-3 px-4 py-4 sm:h-[calc(100dvh-3.5rem)] sm:px-6 sm:py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Asistente</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Un solo hilo para toda la casa: lo que preguntes lo leen tus roomies, y lo que responda
          también.
        </p>
      </div>

      <ChatRoom
        householdId={viewer.household.id}
        userId={viewer.clerkId}
        displayName={viewer.displayName}
        avatarUrl={viewer.avatarUrl}
      />
    </div>
  );
}
