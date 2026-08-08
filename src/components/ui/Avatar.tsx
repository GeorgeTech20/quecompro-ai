import { cn } from "./cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export type AvatarProps = Omit<React.ComponentProps<"span">, "id"> & {
  name?: string | null;
  src?: string | null;
  /** Semilla del color de fallback. Sin ella se usa el nombre. */
  id?: string | null;
  size?: AvatarSize;
  /** Anillo de presencia: esta persona está mirando el carrito ahora. */
  live?: boolean;
};

const SIZE: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: "size-6", text: "text-[10px]" },
  sm: { box: "size-8", text: "text-xs" },
  md: { box: "size-10", text: "text-sm" },
  lg: { box: "size-12", text: "text-base" },
};

/** Paleta de fallback, toda con tokens: nada de hex sueltos. */
const PALETTE = [
  "bg-brand-600 text-white",
  "bg-brand-800 text-white",
  "bg-info text-white",
  "bg-grade-a text-white",
  "bg-grade-c text-ink",
  "bg-lime-accent text-ink",
] as const;

function hash(seed: string): number {
  let value = 5381;
  for (let index = 0; index < seed.length; index += 1) {
    value = ((value << 5) + value + seed.charCodeAt(index)) >>> 0;
  }
  return value;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function Avatar({
  name,
  src,
  id,
  size = "md",
  live = false,
  className,
  ...rest
}: AvatarProps) {
  const seed = id ?? name ?? "";
  const palette = PALETTE[hash(seed) % PALETTE.length] ?? PALETTE[0];
  const alt = name ?? "Miembro del hogar";

  return (
    <span
      {...rest}
      title={name ?? undefined}
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        "font-semibold select-none",
        SIZE[size].box,
        SIZE[size].text,
        src ? "bg-surface-sunken" : palette,
        live && "ring-2 ring-brand-500 ring-offset-2 ring-offset-canvas",
        className,
      )}
    >
      {src ? (
        // Avatares externos (Clerk, Google): `next/image` obligaría a listar
        // cada host remoto en la config, que no es de este agente.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <>
          <span aria-hidden="true">{initials(name)}</span>
          <span className="sr-only">{alt}</span>
        </>
      )}
    </span>
  );
}
