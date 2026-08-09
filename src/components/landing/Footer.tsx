import Link from "next/link";

import { CtaLink } from "./CtaLink";
import { Container } from "./sections/Section";

/* --------------------------------------------------------------------------
   El cierre. Verde profundo a sangre, la frase enorme y el logotipo grande
   abajo, como una firma.

   Sin iconos de redes: QuéComproo no tiene cuentas y no vamos a dibujar
   unas que no existen.
-------------------------------------------------------------------------- */

const COLUMNS = [
  {
    title: "Producto",
    links: [
      { href: "#problema", label: "El problema" },
      { href: "#como-funciona", label: "Cómo funciona" },
      { href: "#en-vivo", label: "En vivo" },
      { href: "#precio", label: "Precio" },
    ],
  },
  {
    title: "Empezar",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/login", label: "Crear mi casa" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative isolate overflow-x-clip"
      style={{ backgroundColor: "var(--qc-green)", color: "var(--qc-on-green)" }}
    >
      <Container className="pt-20 pb-10 sm:pt-24">
        {/* --- La frase de cierre ---------------------------------------- */}
        <div className="max-w-4xl">
          <h2
            className="qc-serif text-balance"
            style={{ fontSize: "clamp(2.6rem, 8vw, 6rem)", lineHeight: 0.98 }}
          >
            La próxima compra{" "}
            <span style={{ color: "var(--qc-lime)" }}>ya empezó.</span>
          </h2>
          <p
            className="mt-6 max-w-lg text-base leading-relaxed sm:text-lg"
            style={{ color: "var(--qc-on-green-soft)" }}
          >
            Alguien de tu casa está pensando qué falta ahora mismo. Que lo piense
            contigo.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink href="/login" variant="cream" size="xl" pill>
              Empezar gratis
            </CtaLink>
            <CtaLink
              href="#como-funciona"
              variant="outline"
              size="xl"
              pill
              style={{ borderColor: "var(--qc-on-green-line)" }}
            >
              Ver cómo funciona
            </CtaLink>
          </div>
        </div>

        {/* --- Columnas ---------------------------------------------------- */}
        <div
          className="mt-20 grid gap-10 border-t pt-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]"
          style={{ borderColor: "var(--qc-on-green-line)" }}
        >
          <div className="max-w-sm">
            <p className="text-sm leading-relaxed" style={{ color: "var(--qc-on-green-soft)" }}>
              La despensa viva de tu casa: el carrito que llenas con tu pareja o
              tus roomies, y una IA que responde en el mismo canal.
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm font-medium">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--qc-lime)" }}
              />
              Hecho en Lima
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3
                className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                style={{ color: "var(--qc-on-green-soft)" }}
              >
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {link.href.startsWith("#") ? (
                      <a href={link.href} className="qc-link text-sm focus-visible:outline-none">
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="qc-link text-sm focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* --- Avisos ------------------------------------------------------ */}
        <div
          className="mt-14 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-start sm:justify-between"
          style={{ borderColor: "var(--qc-on-green-line)" }}
        >
          <p className="text-xs" style={{ color: "var(--qc-on-green-soft)" }}>
            © {year} QuéComproo.
          </p>
          <p
            className="max-w-lg text-xs leading-relaxed sm:text-right"
            style={{ color: "var(--qc-on-green-soft)" }}
          >
            Los precios que aparecen en el sitio y en la app son{" "}
            <strong className="font-semibold" style={{ color: "var(--qc-on-green)" }}>
              datos de demostración
            </strong>{" "}
            aproximados del mercado peruano. No son precios oficiales de ninguna
            cadena ni tienen valor comercial.
          </p>
        </div>
      </Container>

      {/* --- La firma ------------------------------------------------------ */}
      <div className="mt-8 px-5 pb-6 sm:px-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <Signature />
        </div>
      </div>
    </footer>
  );
}

/**
 * El logotipo tamaño firma, al pie.
 *
 * Va en SVG con `textLength`: así ocupa exactamente el ancho del contenedor en
 * cualquier pantalla, sin `clamp` adivinado y sin riesgo de desbordar a lo
 * ancho. El texto sigue vivo en el DOM para quien lea con lupa; para lectores
 * de pantalla es decoración (la marca ya se anunció arriba).
 */
function Signature() {
  return (
    <svg
      viewBox="0 0 1000 136"
      className="block w-full"
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="0"
        y="104"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="var(--font-sans)"
        fontSize="140"
        fontWeight="600"
        fill="var(--qc-on-green)"
      >
        QuéComproo
      </text>
    </svg>
  );
}
