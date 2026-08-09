import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";

import { AppShell } from "@/components/shell/AppShell";
import { loadCart, resolveViewer, type Viewer } from "@/components/shell/server-data";
import { Card, EmptyState } from "@/components/ui";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Puerta de entrada a la zona autenticada.
 *
 * Resuelve la sesión de Clerk y la casa activa antes de pintar nada:
 *  * sin sesión → `/login` (el middleware ya lo hace, pero esto no depende de él),
 *  * sin casa → `/onboarding/welcome`, que es lo que hace que nadie vea una app
 *    vacía sin saber qué le falta.
 *
 * Si la base no contesta no se lanza la excepción: se pinta una pantalla que
 * explica qué pasó. Una demo con un stack trace es una demo perdida.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let viewer: Viewer | null;

  try {
    viewer = await resolveViewer();
  } catch (error) {
    // El bail-out a render dinámico (y `redirect`) llegan como excepción: si se
    // tragan, Next intenta prerenderizar esto y sale la pantalla de error.
    unstable_rethrow(error);
    console.warn(
      `[app-layout] no se pudo resolver la sesión: ${error instanceof Error ? error.message : "?"}`,
    );
    return <DataUnavailable />;
  }

  // `redirect` lanza una excepción de control de flujo: va fuera del try.
  if (!viewer) redirect("/login");
  if (!viewer.household) redirect("/onboarding/welcome");

  const household = viewer.household;

  // El conteo inicial del badge es un adorno: si falla, arranca en cero y el
  // canal lo corrige en cuanto alguien toque el carrito.
  let initialCartCount = 0;
  try {
    initialCartCount = (await loadCart(household.id)).itemCount;
  } catch (error) {
    console.warn(
      `[app-layout] carrito no disponible: ${error instanceof Error ? error.message : "?"}`,
    );
  }

  return (
    <AppShell
      householdId={household.id}
      householdName={household.name}
      userId={viewer.clerkId}
      displayName={viewer.displayName}
      avatarUrl={viewer.avatarUrl}
      initialCartCount={initialCartCount}
    >
      {children}
    </AppShell>
  );
}

function DataUnavailable() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12">
      <Card className="w-full max-w-md" padding="md">
        <EmptyState
          illustration={<span className="text-2xl">🔌</span>}
          title="No pudimos cargar tu casa"
          description="La base de datos no está respondiendo. Suele durar poco: vuelve a intentar en unos segundos."
          action={
            <a
              href="/app"
              className="inline-flex h-10 items-center justify-center rounded-control border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
            >
              Reintentar
            </a>
          }
        />
      </Card>
    </main>
  );
}
