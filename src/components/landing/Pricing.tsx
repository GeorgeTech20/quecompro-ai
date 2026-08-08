import { Badge, Card } from "@/components/ui";

import { Barcode } from "./Barcode";
import { CtaLink } from "./CtaLink";

const INCLUDED = [
  "Carrito compartido en tiempo real con quien viva contigo",
  "Nota de salud A–D en cada producto que agregas",
  "Comparación de precios y sugerencia del cambio más barato",
  "Alerta cuando el mes se está yendo del presupuesto",
  "Recetas con lo que ya tienes en la despensa",
  "Puente de WhatsApp en modo demostración",
] as const;

export function Pricing() {
  return (
    <section
      id="precio"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-brand-600 text-sm font-medium">Precio</p>
        <h2 className="text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Gratis, y lo decimos sin letra chica.
        </h2>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-center">
        {/* Etiqueta de góndola gigante: el mismo lenguaje del resto de la página. */}
        <Card className="rounded-sheet p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-ink-faint text-xs font-medium tracking-wide uppercase">
                Durante la hackathon
              </p>
              <p className="text-ink mt-2 text-6xl leading-none font-semibold tracking-tighter">
                S/ 0
              </p>
            </div>
            <Badge tone="brand">New!</Badge>
          </div>

          <ul className="mt-8 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="bg-brand-600 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span className="text-ink-muted text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <CtaLink href="/login" size="lg" fullWidth className="mt-8">
            Empezar gratis
          </CtaLink>

          <Barcode className="mt-8" />
        </Card>

        <div className="lg:pl-4">
          <h3 className="text-ink text-xl font-semibold tracking-tight">
            Lo honesto: todavía no hay plan pagado.
          </h3>
          <p className="text-ink-muted mt-4 text-base leading-relaxed">
            QueCompro.ai es un proyecto de hackathon hecho en Lima. No hay
            planes, ni cupos, ni descuentos por tiempo limitado. Cuando exista un
            precio, va a aparecer en esta misma página antes que en ningún otro
            lado.
          </p>
          <p className="text-ink-muted mt-4 text-base leading-relaxed">
            Los precios de productos que ves en la app son aproximados de mercado
            peruano y sirven para demostrar cómo funciona la comparación. No son
            precios oficiales de ninguna cadena.
          </p>
        </div>
      </div>
    </section>
  );
}
