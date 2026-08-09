/* ---------------------------------------------------------------------------
   El mundo de las secciones: rojo canasta + celeste pastel.

   El hero es una escena aparte y se queda celeste en claro y en oscuro. De la
   boleta hacia abajo la página baja a celeste y rojo. Esa paleta vive acá y
   NO en `globals.css`: son colores de una
   composición editorial, no tokens del design system.

   Todo se expone como variables CSS sobre `.qc-world` para que el modo oscuro
   sea una sola redefinición y ningún componente tenga que llevar dos hex.
--------------------------------------------------------------------------- */

/** Hex crudos. Solo para donde hace falta el valor y no la variable. */
export const SECTION = {
  greenDeep: "#E9342B",
  greenMid: "#C52520",
  cream: "#F4FBFD",
  creamWarm: "#E4F5FA",
  lime: "#98DEEF",
  ink: "#142A3A",
  /** El papel con el que cierra `ReceiptToPhone`: de ahí arranca la bajada. */
  paper: "#EFE3C6",
} as const;

/** Curva única de toda la landing. La misma que usa el hero. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Umbral y reglas del `whileInView`: entra una vez y se queda. */
export const VIEWPORT = { once: true, amount: 0.2 } as const;

/**
 * Props de entrada en scroll. Con `prefers-reduced-motion` no anima nada y el
 * elemento se pinta ya en su estado final: nunca una pantalla vacía.
 */
export function reveal(index = 0, reduced = false) {
  return reduced
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: VIEWPORT,
        transition: { duration: 0.5, delay: index * 0.07, ease: EASE },
      };
}

export const SECTIONS_CSS = `
.qc-world {
  --qc-cream: #F4FBFD;
  --qc-cream-warm: #E4F5FA;
  --qc-green: #E9342B;
  --qc-green-mid: #C52520;
  --qc-lime: #98DEEF;
  --qc-ink: #142A3A;
  --qc-ink-soft: #58707F;
  --qc-line: rgba(20, 74, 97, 0.18);
  --qc-line-soft: rgba(20, 74, 97, 0.10);
  --qc-card: #FFFFFF;
  --qc-on-green: #FFFFFF;
  --qc-on-green-soft: rgba(255, 255, 255, 0.78);
  --qc-on-green-line: rgba(255, 255, 255, 0.24);
  --qc-glass: rgba(255, 255, 255, 0.84);
  --qc-shadow: 0 10px 30px rgba(20, 42, 58, 0.10);
  --qc-shadow-lift: 0 18px 44px rgba(20, 42, 58, 0.16);
  --qc-ease: cubic-bezier(0.22, 1, 0.36, 1);
  background-color: var(--qc-cream);
}

/* Oscuro: el mundo no cambia de identidad, se apaga. El verde se hunde y la
   crema pasa a un verde casi negro; los papeles (etiquetas de góndola,
   pantallas de la demo) se quedan claros porque son objetos, no superficies. */
.dark .qc-world {
  --qc-cream: #0E171D;
  --qc-cream-warm: #13232C;
  --qc-green: #B92520;
  --qc-green-mid: #8E1D1A;
  --qc-lime: #8ED8EA;
  --qc-ink: #EDF8FB;
  --qc-ink-soft: #A3BAC5;
  --qc-line: rgba(237, 248, 251, 0.16);
  --qc-line-soft: rgba(237, 248, 251, 0.08);
  --qc-card: #172630;
  --qc-on-green: #FFFFFF;
  --qc-on-green-soft: rgba(255, 255, 255, 0.74);
  --qc-on-green-line: rgba(255, 255, 255, 0.18);
  --qc-glass: rgba(14, 23, 29, 0.84);
  --qc-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  --qc-shadow-lift: 0 18px 44px rgba(0, 0, 0, 0.5);
}

/* --- Tipografía editorial ------------------------------------------------- */

/* El serif solo para titulares. El cuerpo sigue en Inter, como el resto de la
   app: mezclar dos voces en el cuerpo hace la página ilegible. */
.qc-serif {
  font-family: var(--font-qc-serif), Georgia, "Times New Roman", serif;
  font-optical-sizing: auto;
  font-weight: 500;
  letter-spacing: -0.015em;
}

/* --- Enlaces: el subrayado crece desde la izquierda ----------------------- */
.qc-link {
  position: relative;
  display: inline-block;
}
.qc-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 220ms var(--qc-ease);
}
.qc-link:hover::after,
.qc-link:focus-visible::after {
  transform: scaleX(1);
}

/* --- Píldoras de acción --------------------------------------------------- */
.qc-pill {
  transition: transform 180ms var(--qc-ease), box-shadow 180ms var(--qc-ease), filter 180ms var(--qc-ease);
}
.qc-pill:hover { filter: brightness(1.03); }

/* --- Barra de navegación -------------------------------------------------- */

/* La banda de reposo repite el celeste del hero en su fila superior, para que
   no haya costura entre la barra y la escena. El perfil horizontal del
   degradado radial del hero a y=0 es este, medido, no a ojo. */
.qc-nav-band {
  background: linear-gradient(90deg, #AEDCEC 0%, #BCE0EE 25%, #C6E7F3 50%, #BCE0EE 75%, #AEDCEC 100%);
  opacity: 1;
  transition: opacity 200ms var(--qc-ease);
}
.qc-nav[data-condensed="true"] .qc-nav-band { opacity: 0; }

.qc-nav-pill {
  opacity: 0;
  transform: scale(0.985);
  background-color: var(--qc-glass);
  border: 1px solid var(--qc-line);
  box-shadow: var(--qc-shadow);
  transition: opacity 200ms var(--qc-ease), transform 200ms var(--qc-ease);
}
.qc-nav[data-condensed="true"] .qc-nav-pill {
  opacity: 1;
  transform: scale(1);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
}

/* En reposo la barra vive sobre el celeste del hero, así que su tinta es la
   del hero; condensada pasa a la tinta del mundo verde. Depende del estado,
   no del tema. */
.qc-nav { color: #14304A; transition: color 200ms var(--qc-ease); }
.qc-nav[data-condensed="true"] { color: var(--qc-ink); }

/* --- Banda de texto repetido (r1) ---------------------------------------- */
@keyframes qc-marquee-x {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
@keyframes qc-marquee-y {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(0, -50%, 0); }
}
.qc-marquee-x,
.qc-marquee-y {
  animation-duration: var(--qc-marquee-dur, 48s);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.qc-marquee-x { animation-name: qc-marquee-x; }
.qc-marquee-y { animation-name: qc-marquee-y; }
/* Fuera del viewport no se anima: nadie la está mirando. */
.qc-marquee-x[data-paused="true"],
.qc-marquee-y[data-paused="true"] { animation-play-state: paused; }

/* --- Góndola -------------------------------------------------------------- */

/* La etiqueta cuelga torcida y se endereza cuando la miras. La inclinación va
   en CSS y no en el atributo style: en línea le ganaría a la regla de :hover. */
.qc-tag {
  transition: transform 260ms var(--qc-ease), box-shadow 260ms var(--qc-ease);
}
.qc-tag[data-tilt="0"] { transform: rotate(-1.4deg); }
.qc-tag[data-tilt="1"] { transform: rotate(1deg); }
.qc-tag[data-tilt="2"] { transform: rotate(-0.7deg); }
.qc-tag[data-tilt="3"] { transform: rotate(1.5deg); }
.qc-bay:hover .qc-tag,
.qc-bay:focus-within .qc-tag {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: var(--qc-shadow-lift);
}

/* --- Cierre --------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .qc-marquee-x,
  .qc-marquee-y { animation: none !important; }
  .qc-tag { transition: none; }
}
`;
