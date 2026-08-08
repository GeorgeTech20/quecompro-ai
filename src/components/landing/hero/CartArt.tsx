import { HERO } from "./scene";

/* --------------------------------------------------------------------------
   Carrito cenital dibujado, para cuando no hay foto en `public/hero/`.

   No es decoración de relleno: ocupa exactamente el mismo hueco que la foto
   (mismo viewBox que `09.png`, 495 × 601), así los sitios de la canasta que
   calcula `slotsFor` siguen cayendo donde deben. La escena nunca se queda
   sin carrito.
-------------------------------------------------------------------------- */

export function CartArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 495 601"
      aria-hidden="true"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Sombra de contacto en el piso. */}
      <ellipse cx={247} cy={470} rx={215} ry={44} fill="rgba(20,48,74,0.16)" />

      {/* Canasta: trapecio que se abre hacia el manubrio. */}
      <path
        d="M92 14h311l50 400H42Z"
        fill="rgba(255,255,255,0.55)"
        stroke={HERO.ink}
        strokeWidth={9}
      />

      {/* Malla de rejilla, en perspectiva: las verticales convergen al fondo. */}
      <g stroke={HERO.ink} strokeWidth={4} opacity={0.55}>
        {[0.14, 0.28, 0.42, 0.56, 0.7, 0.84].map((t) => (
          <line
            key={`v${t}`}
            x1={92 + 311 * t}
            y1={14}
            x2={42 + 411 * t}
            y2={414}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {[0.16, 0.32, 0.48, 0.64, 0.8, 0.94].map((t) => (
          <line
            key={`h${t}`}
            x1={92 - 50 * t}
            y1={14 + 400 * t}
            x2={403 + 50 * t}
            y2={14 + 400 * t}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {/* Asiento abatible del niño: la pieza que delata que es un carrito. */}
      <rect
        x={158}
        y={72}
        width={179}
        height={112}
        rx={12}
        fill="rgba(255,255,255,0.7)"
        stroke={HERO.ink}
        strokeWidth={7}
      />
      <path d="M198 184v-40h34v40M263 184v-40h34v40" stroke={HERO.ink} strokeWidth={6} />

      {/* Manubrio rojo y sus dos brazos. */}
      <rect x={30} y={414} width={38} height={96} rx={19} fill={HERO.red} />
      <rect x={427} y={414} width={38} height={96} rx={19} fill={HERO.red} />
      <rect x={30} y={414} width={435} height={30} rx={15} fill={HERO.red} />

      {/* Ruedas asomando bajo la canasta. */}
      <g fill={HERO.ink}>
        <rect x={96} y={400} width={26} height={54} rx={13} />
        <rect x={373} y={400} width={26} height={54} rx={13} />
        <rect x={122} y={2} width={22} height={46} rx={11} opacity={0.85} />
        <rect x={351} y={2} width={22} height={46} rx={11} opacity={0.85} />
      </g>
    </svg>
  );
}
