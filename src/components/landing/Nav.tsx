"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { EASE } from "./sections/theme";
import { CtaLink } from "./CtaLink";
import { BrandLockup } from "./Wordmark";

/* --------------------------------------------------------------------------
   Barra de navegación.

   En reposo no es una barra: es la misma luz celeste del hero, con el
   logotipo flotando encima. Al pasar el pliegue se condensa en una píldora de
   vidrio. La altura no cambia nunca —la píldora es un fondo absoluto— así que
   la página no pega ningún salto al condensarse.
-------------------------------------------------------------------------- */

const LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#en-vivo", label: "En vivo" },
  { href: "#ia-titulo", label: "Asistente IA" },
] as const;

const SHEET_ID = "menu-movil";

export function Nav() {
  const reduced = useReducedMotion() ?? false;
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Condensado por scroll: pasivo y sin estado intermedio, para no reventar
  // el hilo principal mientras el hero anima.
  useEffect(() => {
    const sync = (): void => setCondensed(window.scrollY > 28);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // El foco vuelve al botón que abrió la hoja: quien navega con teclado no
    // se queda huérfano al final del documento.
    toggleRef.current?.focus();
  }, []);

  // Escape cierra, y mientras la hoja está abierta la página de atrás no se
  // mueve. El overflow se restaura siempre, también si el componente muere.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") close();
    };
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      <header
        className="qc-nav sticky top-0 z-50 py-2"
        data-condensed={condensed}
        style={{ isolation: "isolate" }}
      >
        <div className="qc-nav-band pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-[1180px] px-3 sm:px-5">
          <nav
            aria-label="Principal"
            className="relative flex h-14 items-center gap-5 px-3 sm:h-16 sm:px-5"
          >
            <span
              aria-hidden="true"
              className="qc-nav-pill pointer-events-none absolute inset-0 rounded-full"
            />

            <Link
              href="/"
              aria-label="QuéComproo, inicio"
              className="relative shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            >
              <BrandLockup markClassName="h-12 w-11" />
            </Link>

            <ul className="relative hidden flex-1 items-center justify-center gap-8 md:flex">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="qc-link text-[13px] font-medium opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none lg:text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="relative ml-auto flex items-center gap-2 md:ml-0">
              {/* El envoltorio es quien se esconde: si el `hidden` fuera en los
                  propios enlaces chocaría con el `display` de sus clases y en
                  360 px se colaban dentro de la barra. */}
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="qc-link text-[13px] font-medium opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none lg:text-sm"
                >
                  Entrar
                </Link>

                <CtaLink href="/login" variant="green" pill>
                  Empezar gratis
                </CtaLink>
              </div>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-controls={SHEET_ID}
                aria-label="Abrir menú"
                className="-mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:hidden"
              >
                <span aria-hidden="true" className="flex w-5 flex-col gap-[5px]">
                  <span className="h-[2px] w-full rounded-full bg-current" />
                  <span className="h-[2px] w-full rounded-full bg-current" />
                  <span className="h-[2px] w-3.5 rounded-full bg-current" />
                </span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sheet"
            id={SHEET_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-0 z-[60] flex flex-col md:hidden"
            style={{ backgroundColor: "var(--qc-green)", color: "var(--qc-on-green)" }}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            // Clic fuera de los enlaces: la hoja entera es el fondo.
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-6">
              <BrandLockup markClassName="h-12 w-11" onGreen />
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true" fill="none">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav aria-label="Menú móvil" className="flex-1 overflow-y-auto px-6 pt-6 pb-10">
              <ul className="flex flex-col">
                {LINKS.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={reduced ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: 0.04 + index * 0.05, ease: EASE }}
                    style={{ borderBottom: "1px solid var(--qc-on-green-line)" }}
                  >
                    <a
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={link.href}
                      onClick={close}
                      className="qc-serif block py-5 text-[clamp(2rem,10vw,2.75rem)] leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3">
                <CtaLink
                  href="/login"
                  variant="cream"
                  size="lg"
                  pill
                  fullWidth
                  onClick={close}
                >
                  Empezar gratis
                </CtaLink>
                <CtaLink
                  href="/login"
                  variant="outline"
                  size="lg"
                  pill
                  fullWidth
                  onClick={close}
                  style={{ borderColor: "var(--qc-on-green-line)" }}
                >
                  Entrar
                </CtaLink>
              </div>

            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
