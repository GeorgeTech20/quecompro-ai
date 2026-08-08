import Link from "next/link";

import { CtaLink } from "./CtaLink";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "#problema", label: "El problema" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#en-vivo", label: "En vivo" },
  { href: "#precio", label: "Precio" },
] as const;

export function Nav() {
  return (
    <header className="border-border-subtle bg-canvas/75 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 sm:px-8"
      >
        <Link
          href="/"
          aria-label="QueCompro.ai, inicio"
          className="rounded-control focus-visible:ring-brand-600 shrink-0 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Wordmark className="text-lg" />
        </Link>

        <ul className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-ink-muted hover:text-ink text-sm transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            href="/login"
            className="text-ink-muted hover:text-ink rounded-control hidden px-3 py-2 text-sm transition-colors sm:inline-flex"
          >
            Entrar
          </Link>
          <CtaLink href="/login">Empezar gratis</CtaLink>
        </div>
      </nav>
    </header>
  );
}
