"use client";

import { useEffect } from "react";

import { PageShell } from "@/components/shell/PageHeader";
import { Button, Card, EmptyState } from "@/components/ui";

/**
 * Red de seguridad de `/app/*`. Cualquier pantalla que reviente cae aquí en vez
 * de dejar la app en blanco, y el usuario conserva la navegación.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn(`[app] pantalla caída: ${error.message}`);
  }, [error]);

  return (
    <PageShell>
      <Card padding="md">
        <EmptyState
          illustration={<span className="text-2xl">🧯</span>}
          title="Esta pantalla se cayó"
          description="Fue un problema nuestro, no tuyo. Tu carrito y tu historial siguen intactos: vuelve a cargar y sigue donde estabas."
          action={<Button onClick={reset}>Volver a intentar</Button>}
          secondaryAction={
            <Button variant="secondary" onClick={() => window.location.assign("/app")}>
              Ir al resumen
            </Button>
          }
        />
      </Card>
    </PageShell>
  );
}
