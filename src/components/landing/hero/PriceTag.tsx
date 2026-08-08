import { formatPEN } from "@/components/ui";

import { GRADE_COLOR, HERO, type Grade } from "./scene";

/* --------------------------------------------------------------------------
   Etiqueta de góndola: papel crema, nombre chico arriba, precio grande y
   código de barras abajo. Colores fijos (es papel impreso dentro de la
   escena, no una superficie del design system).
-------------------------------------------------------------------------- */

/** Anchos fijos: nada de Math.random, servidor y cliente tienen que coincidir. */
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 2, 1] as const;
const GAP = 1.5;

function TagBarcode() {
  let x = 0;
  const bars = BARS.map((width, i) => {
    const bar = { x, width, key: i };
    x += width + GAP;
    return bar;
  });

  return (
    <svg
      viewBox={`0 0 ${Math.max(x - GAP, 1)} 10`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-2.5 w-full"
    >
      {bars.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x}
          y={0}
          width={bar.width}
          height={10}
          fill={HERO.ink}
          opacity={0.62}
        />
      ))}
    </svg>
  );
}

export type PriceTagProps = {
  name: string;
  price: number;
  unit: string;
  grade: Grade;
  /** Grados: la etiqueta cuelga torcida, como en la góndola. */
  tilt: number;
};

export function PriceTag({ name, price, unit, grade, tilt }: PriceTagProps) {
  return (
    <div
      className="w-[86px] rounded-[3px] px-1.5 pt-1 pb-1.5 sm:w-[104px] sm:px-2"
      style={{
        transform: `rotate(${tilt}deg)`,
        backgroundColor: HERO.cream,
        boxShadow: `0 1px 0 ${HERO.creamEdge}, 0 6px 14px rgba(20,48,74,0.18)`,
      }}
    >
      <div className="flex items-start gap-1">
        <p
          className="min-w-0 flex-1 truncate text-[7px] leading-[1.5] font-semibold tracking-[0.08em] uppercase sm:text-[8px]"
          style={{ color: HERO.inkSoft }}
        >
          {name}
        </p>
        <span
          aria-hidden="true"
          className="mt-px flex h-[11px] w-[11px] shrink-0 items-center justify-center rounded-[2px] text-[7px] leading-none font-bold text-white"
          style={{ backgroundColor: GRADE_COLOR[grade] }}
        >
          {grade}
        </span>
      </div>

      <p
        className="text-[15px] leading-none font-bold tracking-[-0.02em] tabular-nums sm:text-[17px]"
        style={{ color: HERO.ink }}
      >
        {formatPEN(price)}
      </p>

      <div className="mt-1 flex items-end gap-1">
        <TagBarcode />
        <span
          className="shrink-0 text-[6px] leading-none tracking-wide uppercase sm:text-[7px]"
          style={{ color: HERO.inkSoft }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
}
