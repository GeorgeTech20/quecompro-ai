/**
 * Código de barras decorativo de las etiquetas de góndola.
 * Anchos fijos (nada de Math.random) para que servidor y cliente coincidan.
 */
const BARS = [2, 1, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2] as const;
const GAP = 1.6;

export function Barcode({ className = "" }: { className?: string }) {
  let x = 0;
  const bars = BARS.map((width, i) => {
    const rect = { x, width, key: `${i}` };
    x += width + GAP;
    return rect;
  });

  return (
    <svg
      viewBox={`0 0 ${Math.max(x - GAP, 1)} 16`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`text-ink h-4 w-full ${className}`}
    >
      {bars.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x}
          y={0}
          width={bar.width}
          height={16}
          fill="currentColor"
          opacity={0.72}
        />
      ))}
    </svg>
  );
}
