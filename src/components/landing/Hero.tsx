import { Avatar, LiveDot } from "@/components/ui";

import { CtaLink } from "./CtaLink";
import { HeroCanvas } from "./HeroCanvas";

const PEOPLE = ["Sofía Ramos", "Marco Díaz", "Rocío Vega"] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Luz de mercado detrás del carrito: suave, nunca protagonista. */}
      <div
        aria-hidden="true"
        className="from-brand-100/70 dark:from-brand-900/40 pointer-events-none absolute top-[-14rem] right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-radial to-transparent blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-20 lg:pb-28">
        <div className="max-w-xl">
          <p className="border-border-subtle bg-surface text-ink-muted mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <span aria-hidden="true" className="bg-lime-accent h-1.5 w-1.5 rounded-full" />
            Proyecto de hackathon · hecho en Lima
          </p>

          <h1 className="text-ink text-5xl leading-[1.03] font-semibold tracking-[-0.03em] text-balance md:text-7xl">
            La despensa <span className="text-brand-600">viva</span> de tu casa.
          </h1>

          <p className="text-ink-muted mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
            Un carrito de mercado compartido en tiempo real con tu pareja o tus
            roomies. La IA está en el mismo canal: puntúa lo que agregas, te dice
            dónde está más barato y avisa antes de que el mes se te vaya.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink href="/login" size="lg">
              Empezar gratis
            </CtaLink>
            <CtaLink href="#como-funciona" size="lg" variant="secondary">
              Ver cómo funciona
            </CtaLink>
          </div>

          {/* Prueba viva: gente mirando el carrito, no cifras inventadas. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex -space-x-2">
              {PEOPLE.map((name) => (
                <Avatar
                  key={name}
                  name={name}
                  size="sm"
                  className="ring-canvas ring-2"
                />
              ))}
            </div>
            <p className="text-ink-muted flex items-center gap-2 text-sm">
              <LiveDot label="Conectada ahora" />
              <span>
                <span className="text-ink font-medium">Sofi</span> está viendo el
                carrito
              </span>
            </p>
          </div>

          <p className="text-ink-faint mt-5 text-xs">
            Sin tarjeta. Los precios que ves son datos de demostración del
            mercado peruano.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:max-w-none">
          <div className="border-border-subtle bg-surface-sunken rounded-sheet border p-3 sm:p-5">
            <HeroCanvas />
          </div>
          <p className="text-ink-faint mt-3 text-center text-xs">
            Cada bloque es un producto. El área es lo que cuesta.
          </p>
        </div>
      </div>
    </section>
  );
}
