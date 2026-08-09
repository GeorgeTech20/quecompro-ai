/**
 * Productos de góndola dibujados en flat vector. Sin fotos, sin assets:
 * paths y colores fijos.
 *
 * Los colores NO son tokens del design system a propósito: estos productos
 * viven dentro de una vitrina iluminada que se mantiene clara también en modo
 * oscuro. Si heredaran la superficie, en oscuro se volverían invisibles.
 */

type IconProps = { className?: string };

const INK = "#142A3A";
const LIME = "#98DEEF";
const MID = "#C52520";
const PAPER = "#FBF7EC";
const AMBER = "#E4A33C";
const SOFT = "#CFE8D2";

/** Caja de leche con techo a dos aguas: la casa que estás armando. */
export function CartonIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 72 112"
      aria-hidden="true"
      className={className}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
      stroke={INK}
    >
      <path d="M12 32 36 9l24 23v70a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z" fill={SOFT} />
      <path d="M12 32h48" />
      <path d="M36 9v23" opacity={0.32} />
      <path d="M12 46h48v14H12z" fill={MID} stroke="none" />
      <rect x={21} y={66} width={30} height={22} rx={3} fill={PAPER} strokeWidth={2.5} />
      <path d="M27 74h18M27 81h11" strokeWidth={2.5} />
      <circle cx={36} cy={20} r={5} fill={LIME} strokeWidth={2.5} />
    </svg>
  );
}

/** Lata: lo que agregas al carrito de un toque. */
export function CanIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 88 96"
      aria-hidden="true"
      className={className}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
      stroke={INK}
    >
      <path d="M14 24v50c0 6 13 11 30 11s30-5 30-11V24Z" fill={PAPER} />
      <path d="M14 40h60v22H14z" fill={LIME} stroke="none" />
      <path d="M14 40h60M14 62h60" strokeWidth={2.5} />
      <ellipse cx={44} cy={24} rx={30} ry={11} fill={SOFT} />
      <ellipse cx={44} cy={24} rx={19} ry={6} fill="none" strokeWidth={2} opacity={0.5} />
      <circle cx={44} cy={51} r={7} fill={PAPER} strokeWidth={2.5} />
    </svg>
  );
}

/** Botella con un pulso al lado: la IA que reacciona en vivo. */
export function BottleIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 80 120"
      aria-hidden="true"
      className={className}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
      stroke={INK}
    >
      <path d="M30 10h16v14c0 6 14 12 14 26v58a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V50c0-14 14-20 14-26Z" fill={SOFT} />
      <path d="M28 6h20v8H28z" fill={MID} />
      <rect x={19} y={62} width={38} height={28} rx={3} fill={PAPER} strokeWidth={2.5} />
      <path d="M25 72h26M25 80h15" strokeWidth={2.5} />
      <circle cx={67} cy={30} r={8} fill={LIME} strokeWidth={2.5} />
      <path d="M63.5 30h7M67 26.5v7" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
}

/** Bolsa de arroz: la despensa que termina en la olla. */
export function BagIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 96 104"
      aria-hidden="true"
      className={className}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
      stroke={INK}
    >
      <path d="M22 28h52l8 63a6 6 0 0 1-6 7H20a6 6 0 0 1-6-7Z" fill={PAPER} />
      <path d="M22 28 28 8h40l6 20Z" fill={AMBER} />
      <path d="M17 52h62" strokeWidth={2} opacity={0.35} />
      <rect x={28} y={58} width={40} height={26} rx={3} fill={SOFT} strokeWidth={2.5} />
      <path d="M35 68h26M35 76h15" strokeWidth={2.5} />
    </svg>
  );
}
