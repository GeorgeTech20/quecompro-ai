import fs from "node:fs";
import path from "node:path";

import { CtaLink } from "./CtaLink";
import { HERO_CSS } from "./hero/heroCss";
import { HeroStage } from "./hero/HeroStage";
import { HERO } from "./hero/scene";

/* --------------------------------------------------------------------------
   Hero: infografía de mercado a sangre, celeste de lado a lado.

   El titular manda («¿Qué compro?»), debajo va la escena: el carrito visto en
   picado, la lista de papel, la boleta y los recortes de comida flotando.
   Todo lo interactivo vive en `HeroStage` (cliente); acá solo se resuelve en
   servidor qué carrito hay disponible.
-------------------------------------------------------------------------- */

/**
 * Candidatos al carrito, en orden de preferencia. Se resuelve en build/render
 * con `fs.existsSync` — nunca adivinando en el cliente, que no puede mirar el
 * disco y solo sabría del fallo cuando ya se vio el hueco.
 *
 * `09.png` es un recorte cenital real de carrito con las dos manos en el
 * manubrio: es exactamente la toma que pide la composición.
 */
const CART_CANDIDATES = ["hero/cart.png", "hero/food/opt/09.png", "hero/food/09.png"] as const;

function resolveCart(): string | null {
  const publicDir = path.join(process.cwd(), "public");
  for (const candidate of CART_CANDIDATES) {
    if (fs.existsSync(path.join(publicDir, candidate))) return `/${candidate}`;
  }
  return null;
}

export function Hero() {
  const cartSrc = resolveCart();

  return (
    <section
      className="relative isolate overflow-x-clip"
      style={{ backgroundColor: HERO.sky, color: HERO.ink }}
    >
      {/* Reglas de la escena, no del design system: `globals.css` no se toca. */}
      <style>{HERO_CSS}</style>

      {/* Luz de góndola: el celeste se abre arriba y se hunde abajo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(130% 78% at 50% 4%, ${HERO.skyHigh} 0%, ${HERO.sky} 46%, ${HERO.skyDeep} 100%)`,
        }}
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pt-6 pb-6 sm:px-6 lg:pt-8">
        <div className="qc-in text-center">
          <p
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide sm:text-xs"
            style={{ backgroundColor: HERO.cream, color: HERO.ink }}
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: HERO.red }}
            />
            Proyecto de hackathon · hecho en Lima
          </p>

          {/* Una sola línea, ancho completo: el titular tiene que leerse de un
              golpe y dominar la pantalla. El mínimo del clamp está calculado
              para que quepa a 320 px sin desbordar. */}
          <h1
            className="mt-3 font-black whitespace-nowrap"
            style={{
              color: HERO.red,
              fontSize: "clamp(2.35rem, 8.6vw, 9.5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.05em",
            }}
          >
            ¿Qué compro?
          </h1>

          <p
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-balance sm:text-lg"
            style={{ color: HERO.ink }}
          >
            <span className="font-semibold">La despensa viva de tu casa.</span> El
            carrito compartido con tu pareja o tus roomies, y una IA en el mismo
            canal.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaLink
              href="/login"
              size="lg"
              className="qc-cta"
              style={{ backgroundColor: HERO.ink, color: "#fff" }}
            >
              Empezar gratis
            </CtaLink>
            <CtaLink
              href="#como-funciona"
              size="lg"
              variant="secondary"
              className="qc-cta"
              style={{
                backgroundColor: HERO.cream,
                color: HERO.ink,
                borderColor: HERO.creamEdge,
              }}
            >
              Ver cómo funciona
            </CtaLink>
          </div>
        </div>

        <HeroStage cartSrc={cartSrc} />

        <p
          className="mx-auto mt-6 max-w-xl text-center text-[11px] leading-relaxed"
          style={{ color: HERO.inkSoft }}
        >
          Sin tarjeta. Los precios y la sugerencia de la IA que ves acá son{" "}
          <strong className="font-semibold">datos de demostración</strong> del mercado
          peruano, no precios oficiales de ninguna cadena.
        </p>
      </div>

      {/* Bajada de color hacia la boleta: el celeste no debe cortarse en seco.
          Va `relative` para pintar por encima del degradado de fondo, que es
          absoluto y si no se lo comería. */}
      <div
        aria-hidden="true"
        className="relative h-14 w-full sm:h-20"
        style={{ background: `linear-gradient(${HERO.skyDeep}, ${HERO.paper})` }}
      />
    </section>
  );
}
