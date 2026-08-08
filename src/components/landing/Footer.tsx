import Link from "next/link";

import { Wordmark } from "./Wordmark";

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
    <footer className="border-border-subtle bg-surface-sunken mt-8 border-t">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Wordmark className="text-lg" />
            <p className="text-ink-muted mt-3 text-sm leading-relaxed">
              La despensa viva de tu casa: un carrito compartido en tiempo real
              con una IA que cuida la salud y el bolsillo.
            </p>
            <p className="text-ink-faint mt-4 flex items-center gap-2 text-sm">
              <span aria-hidden="true">🇵🇪</span> Hecho en Lima.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="text-ink text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-ink-muted hover:text-ink text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-ink-muted hover:text-ink text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border-subtle mt-12 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-faint text-xs">
            © {year} QueCompro.ai · Proyecto de hackathon.
          </p>
          <p className="text-ink-faint max-w-lg text-xs sm:text-right">
            Los precios que aparecen en el sitio y en la app son datos de
            demostración, aproximados del mercado peruano. No son precios
            oficiales de ninguna cadena ni tienen valor comercial.
          </p>
        </div>
      </div>
    </footer>
  );
}
