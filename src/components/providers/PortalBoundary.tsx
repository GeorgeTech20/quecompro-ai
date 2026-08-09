"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button, Card, EmptyState } from "@/components/ui";

/**
 * Red de seguridad de la capa Portal.
 *
 * La degradación *esperada* (socket caído) no lanza: el SDK la reporta por
 * `status` y el carrito sigue escribiendo en Supabase. Esto es para lo *otro*:
 * un throw de render que React no perdona — un mensaje con shape raro, un hook
 * del SDK que revienta, un bug puntual. Sin un boundary, ese throw desmonta todo
 * el árbol y deja la pantalla en blanco; en una demo, eso es la demo perdida.
 *
 * Aquí no: se pinta una tarjeta suave y un botón que reintenta. Reintentar sube
 * el `resetKey`, lo que remonta a los hijos y vuelve a suscribir el canal desde
 * cero. La navegación y el resto de la app siguen vivos porque el boundary
 * envuelve solo la superficie que falló, no el shell entero.
 */

export type PortalBoundaryProps = {
  children: ReactNode;
  /** Título de la tarjeta suave. Por defecto, tono de carrito/chat. */
  title?: string;
  description?: string;
};

type PortalBoundaryState = {
  error: Error | null;
  resetKey: number;
};

export class PortalBoundary extends Component<PortalBoundaryProps, PortalBoundaryState> {
  state: PortalBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<PortalBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Nada de secretos ni payloads: solo el mensaje y el componente. Sirve para
    // saber qué reventó sin filtrar contenido del canal.
    console.warn(
      `[portal-boundary] render caído: ${error.message}`,
      info.componentStack ?? "",
    );
  }

  private handleRetry = (): void => {
    this.setState((prev) => ({ error: null, resetKey: prev.resetKey + 1 }));
  };

  render(): ReactNode {
    if (this.state.error === null) {
      // El `key` es lo que fuerza el remonte limpio al reintentar.
      return <div key={this.state.resetKey}>{this.props.children}</div>;
    }

    const title = this.props.title ?? "El tiempo real se tropezó";
    const description =
      this.props.description ??
      "Algo en la conexión en vivo falló. Tus datos están guardados; vuelve a intentar y seguimos.";

    return (
      <div className="p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-md" padding="md">
          <EmptyState
            illustration={<span className="text-2xl">🔌</span>}
            title={title}
            description={description}
            action={
              <Button variant="secondary" onClick={this.handleRetry}>
                Reintentar
              </Button>
            }
          />
        </Card>
      </div>
    );
  }
}
