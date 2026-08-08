/* ---------------------------------------------------------------------------
   CSS propio del hero.

   Las órbitas son animaciones CSS y no `motion` a propósito: correr en el
   compositor sale gratis y, sobre todo, `animation-play-state` deja pausarlas
   de verdad cuando el hero sale del viewport o la pestaña se oculta — con un
   bucle de JS habría que reiniciarlo y el recorte pegaría un salto.

   El vuelo al carrito sí es `motion` (springs): ahí queremos física, no un
   easing fijo.

   Vive en un `<style>` dentro del componente porque son reglas de una escena,
   no tokens del design system: `globals.css` no se toca.
--------------------------------------------------------------------------- */

export const HERO_CSS = `
/* Órbita: una elipse lenta. Un solo keyframe para toda la escena; lo que
   cambia por recorte es duración, desfase y sentido. Tres easings distintos
   en la misma escena se leen como "roto" aunque cada uno se vea bien solo. */
@keyframes qc-orbit {
  0%   { transform: translate3d(0, -11px, 0) rotate(-1.6deg); }
  25%  { transform: translate3d(11px, 0, 0) rotate(0.9deg); }
  50%  { transform: translate3d(0, 11px, 0) rotate(1.6deg); }
  75%  { transform: translate3d(-11px, 0, 0) rotate(-0.9deg); }
  100% { transform: translate3d(0, -11px, 0) rotate(-1.6deg); }
}

.qc-orbit {
  animation-name: qc-orbit;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  will-change: transform;
}

/* Sombra de contacto del recorte. Va en CSS y no en línea para poder crecer
   con :hover / :focus-visible — y con :active, que es lo único que tiene el
   táctil — sin pelearse con el atributo style del elemento. */
.qc-cut {
  filter: drop-shadow(0 12px 16px rgba(20, 48, 74, 0.3));
  transition: filter 200ms cubic-bezier(0.22, 1, 0.36, 1);
}
.qc-pick:hover .qc-cut,
.qc-pick:focus-visible .qc-cut {
  filter: drop-shadow(0 20px 24px rgba(20, 48, 74, 0.4));
}
.qc-pick:active .qc-cut {
  filter: drop-shadow(0 8px 10px rgba(20, 48, 74, 0.34));
}

/* El titular respira una vez al entrar y se queda quieto. */
@keyframes qc-hero-in {
  from { opacity: 0; transform: translate3d(0, 14px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
.qc-in {
  animation: qc-hero-in 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* Los CTA del hero llevan color propio en línea (la escena no usa los tokens
   de superficie), así que el hover no puede venir de una clase de Tailwind. */
.qc-cta {
  transition: filter 180ms cubic-bezier(0.22, 1, 0.36, 1), transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.qc-cta:hover { filter: brightness(1.14); }
.qc-cta:active { transform: translateY(1px); }

/* Papel: fibra muy tenue para que la lista no parezca un div blanco. */
.qc-paper {
  background-image:
    repeating-linear-gradient(0deg, rgba(20,48,74,0.035) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg, rgba(20,48,74,0.025) 0 1px, transparent 1px 4px);
}

@media (prefers-reduced-motion: reduce) {
  .qc-orbit { animation: none !important; }
  .qc-in { animation: none !important; }
}
`;
