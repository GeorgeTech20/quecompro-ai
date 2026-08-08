/**
 * Productos de góndola dibujados en flat vector. Sin fotos, sin assets:
 * paths y tokens de color, igual que el hero.
 */

type IconProps = { className?: string };

// Los productos son superficie propia (papel de góndola): mismos verdes en
// claro y en oscuro, así que el contorno tiene que quedarse oscuro siempre.
const STROKE = "text-brand-900";

/** Caja de leche con techo a dos aguas: la casa que estás armando. */
export function CartonIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 72 108"
      aria-hidden="true"
      className={`${STROKE} ${className}`}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
    >
      <path
        d="M12 30 36 8l24 22v66a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z"
        className="fill-brand-200"
        stroke="currentColor"
      />
      <path d="M12 30h48" stroke="currentColor" />
      <path d="M36 8v22" stroke="currentColor" opacity={0.35} />
      <rect
        x={22}
        y={46}
        width={28}
        height={20}
        rx={3}
        className="fill-white"
        stroke="currentColor"
        strokeWidth={2.5}
      />
      <path d="M28 56h16" stroke="currentColor" strokeWidth={2.5} />
    </svg>
  );
}

/** Lata: lo que agregas al carrito de un toque. */
export function CanIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 88 92"
      aria-hidden="true"
      className={`${STROKE} ${className}`}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
    >
      <path
        d="M14 24v50c0 5 13 10 30 10s30-5 30-10V24Z"
        className="fill-lime-soft"
        stroke="currentColor"
      />
      <ellipse
        cx={44}
        cy={24}
        rx={30}
        ry={11}
        className="fill-brand-100"
        stroke="currentColor"
      />
      <path
        d="M14 44h60"
        className="stroke-brand-600"
        strokeWidth={9}
        strokeLinecap="butt"
        opacity={0.9}
      />
      <path d="M14 38h60M14 62h60" stroke="currentColor" strokeWidth={2} opacity={0.35} />
    </svg>
  );
}

/** Botella con un pulso al lado: la IA que reacciona en vivo. */
export function BottleIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 76 116"
      aria-hidden="true"
      className={`${STROKE} ${className}`}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
    >
      <path
        d="M30 8h16v16c0 6 14 12 14 26v54a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V50c0-14 14-20 14-26Z"
        className="fill-brand-300"
        stroke="currentColor"
      />
      <rect
        x={20}
        y={58}
        width="36"
        height={26}
        rx={3}
        className="fill-white"
        stroke="currentColor"
        strokeWidth={2.5}
      />
      <path d="M26 68h24M26 76h14" stroke="currentColor" strokeWidth={2.5} />
      <circle cx={64} cy={26} r={7} className="fill-lime-accent" stroke="currentColor" strokeWidth={2.5} />
    </svg>
  );
}

/** Bolsa de arroz: la despensa que termina en la olla. */
export function BagIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 92 100"
      aria-hidden="true"
      className={`${STROKE} ${className}`}
      fill="none"
      strokeWidth={3}
      strokeLinejoin="round"
    >
      <path
        d="M20 26h52l8 62a6 6 0 0 1-6 7H18a6 6 0 0 1-6-7Z"
        className="fill-brand-100"
        stroke="currentColor"
      />
      <path d="M20 26 26 8h40l6 18Z" className="fill-brand-400" stroke="currentColor" />
      <rect
        x={26}
        y={48}
        width={40}
        height={24}
        rx={3}
        className="fill-white"
        stroke="currentColor"
        strokeWidth={2.5}
      />
      <path d="M34 58h24M34 66h16" stroke="currentColor" strokeWidth={2.5} />
    </svg>
  );
}
