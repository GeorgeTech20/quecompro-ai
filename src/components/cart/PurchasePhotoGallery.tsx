"use client";

import { useEffect, useRef, useState } from "react";

import { cn, CloseIcon } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/shell/icons";

/**
 * Galería de fotos de la compra a pantalla completa.
 *
 * Cada foto de un producto comprado se abre aquí: imagen grande centrada,
 * navegación anterior/siguiente, soporte de teclado y swipe táctil en móvil.
 * El fondo oscuro hace que la foto sea lo único que importa.
 */

export type GalleryPhoto = {
  id: string;
  title: string;
  url: string;
  /** Quién la tomó, si se sabe. */
  by?: string | null;
};

export type PurchasePhotoGalleryProps = {
  photos: GalleryPhoto[];
  initialIndex: number;
  onClose: () => void;
};

const SWIPE_PX = 48;

export function PurchasePhotoGallery({
  photos,
  initialIndex,
  onClose,
}: PurchasePhotoGalleryProps) {
  const [index, setIndex] = useState(initialIndex);
  const touchX = useRef<number | null>(null);

  const photo = photos[Math.min(Math.max(index, 0), photos.length - 1)];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((value) => Math.min(value + 1, photos.length - 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(value - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  if (!photo) return null;

  const prev = () => setIndex((value) => Math.max(value - 1, 0));
  const next = () => setIndex((value) => Math.min(value + 1, photos.length - 1));

  const navButton =
    "grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-white " +
    "transition-colors duration-150 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${photo.title}`}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current == null) return;
        const endX = event.changedTouches[0]?.clientX ?? null;
        if (endX == null) return;
        const delta = endX - touchX.current;
        touchX.current = null;
        if (delta < -SWIPE_PX) next();
        if (delta > SWIPE_PX) prev();
      }}
    >
      {/* --- cabecera: título + contador --- */}
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{photo.title}</p>
          {photo.by ? <p className="truncate text-xs text-white/60">Foto de {photo.by}</p> : null}
        </div>
        <p className="shrink-0 text-xs font-medium text-white/70 tabular-nums">
          {index + 1} / {photos.length}
        </p>
      </header>

      {/* --- imagen centrada, con los laterales táctiles para navegar --- */}
      <main className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-24 sm:px-16">
        <img
          key={photo.url}
          src={photo.url}
          alt={`Foto de ${photo.title}`}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-raised"
        />

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={prev}
              className={cn(navButton, "absolute top-1/2 left-3 hidden -translate-y-1/2 sm:grid")}
            >
              <ArrowLeftIcon className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={next}
              className={cn(navButton, "absolute top-1/2 right-3 hidden -translate-y-1/2 sm:grid")}
            >
              <ArrowRightIcon className="size-6" />
            </button>
          </>
        ) : null}
      </main>

      {/* --- pie: hint + cerrar, siempre visibles --- */}
      <footer className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <p className="min-w-0 flex-1 truncate text-xs text-white/50">
          {photos.length > 1 ? "Desliza para ver las demás" : "Foto de la compra de hoy"}
        </p>
        <button
          type="button"
          aria-label="Cerrar galería"
          onClick={onClose}
          className={cn(
            navButton,
            "flex h-9 w-auto items-center gap-1.5 px-3 text-[13px] font-medium",
          )}
        >
          <CloseIcon className="size-4" />
          <span className="max-sm:hidden">Cerrar</span>
        </button>
      </footer>
    </div>
  );
}