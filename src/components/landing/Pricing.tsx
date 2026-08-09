import { Barcode } from "./Barcode";
import { CtaLink } from "./CtaLink";
import { Marquee } from "./Marquee";
import { Container, Section, SectionHead } from "./sections/Section";

/* --------------------------------------------------------------------------
   Precio. La etiqueta de góndola, ahora tamaño cartel: papel blanco, badge,
   el precio enorme y el código de barras. Al lado, lo honesto en texto.

   Cierra con la banda de texto repetido, que ya es el borde superior del
   footer verde: la página baja al cierre sin un corte.
-------------------------------------------------------------------------- */

const INCLUDED = [
  "Carrito compartido en tiempo real con quien viva contigo",
  "Nota de salud A–D en cada producto que agregas",
  "El mismo producto más barato en otra tienda",
  "Aviso cuando el mes se está yendo del presupuesto",
  "Qué cocinar hoy con lo que ya está en la despensa",
  "Puente de WhatsApp en modo demostración",
] as const;

export function Pricing() {
  return (
    <>
      <Section id="precio" tone="cream" aria-labelledby="precio-titulo">
        <Container className="pt-20 pb-24 sm:pt-24 lg:pt-28 lg:pb-32">
          <SectionHead
            id="precio-titulo"
            eyebrow="Precio"
            title="Gratis, y lo decimos sin letra chica."
            titleClassName="max-w-[18ch]"
          />

          <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
            {/* --- La etiqueta ------------------------------------------- */}
            <div
              className="rounded-[20px] p-7 sm:p-9"
              style={{
                backgroundColor: "var(--qc-card)",
                border: "1px solid var(--qc-line-soft)",
                boxShadow: "var(--qc-shadow)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: "var(--qc-ink-soft)" }}
                  >
                    Durante la hackathon
                  </p>
                  <p
                    className="qc-serif mt-3 leading-none tracking-tight"
                    style={{ fontSize: "clamp(3.5rem, 11vw, 5.5rem)", color: "var(--qc-green)" }}
                  >
                    S/ 0
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--qc-ink-soft)" }}>
                    para toda la casa, sin tarjeta
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide"
                  style={{ backgroundColor: "var(--qc-lime)", color: "var(--qc-ink)" }}
                >
                  New!
                </span>
              </div>

              <ul className="mt-8 space-y-3">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--qc-green)" }}
                    />
                    <span
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--qc-ink-soft)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <CtaLink
                href="/login"
                variant="green"
                size="xl"
                pill
                fullWidth
                className="mt-8"
              >
                Empezar gratis
              </CtaLink>

              <div
                className="mt-8 border-t pt-4"
                style={{ borderColor: "var(--qc-line-soft)" }}
              >
                <Barcode color="var(--qc-ink)" opacity={0.55} />
                <p
                  className="mt-2 text-[9px] tracking-[0.24em] uppercase"
                  style={{ color: "var(--qc-ink-soft)" }}
                >
                  QC-0000 · Lima, Perú
                </p>
              </div>
            </div>

            {/* --- Lo honesto -------------------------------------------- */}
            <div className="lg:pt-6">
              <h3
                className="qc-serif text-[clamp(1.6rem,3.2vw,2.25rem)] leading-tight"
                style={{ color: "var(--qc-ink)" }}
              >
                Todavía no hay plan pagado.
              </h3>
              <p
                className="mt-5 text-base leading-relaxed"
                style={{ color: "var(--qc-ink-soft)" }}
              >
                QuéComproo es un proyecto de hackathon hecho en Lima. No hay
                planes, ni cupos, ni descuentos por tiempo limitado. Cuando exista
                un precio, va a aparecer en esta misma página antes que en ningún
                otro lado.
              </p>
              <p
                className="mt-4 text-base leading-relaxed"
                style={{ color: "var(--qc-ink-soft)" }}
              >
                Los precios de productos que ves en la app son aproximados del
                mercado peruano y sirven para demostrar cómo funciona la
                comparación. No son precios oficiales de ninguna cadena.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Marquee
        words={["QUÉ COMPRO", "QUÉ COCINO", "CUÁNTO LLEVO", "QUIÉN COMPRA"]}
        tone="green"
        seconds={58}
      />
    </>
  );
}
