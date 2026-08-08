"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "./cn";
import { CloseIcon } from "./icons";

export type ModalSize = "sm" | "md" | "lg" | "full";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  /** Etiqueta accesible cuando no hay `title` visible. */
  "aria-label"?: string;
  /** Va al panel, no al `<dialog>` contenedor. */
  className?: string;
};

const SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  full: "max-w-4xl",
};

/**
 * Usa `<dialog>` nativo con `showModal()`: el navegador ya nos da top-layer,
 * inertización del resto de la página y trampa de foco real. Solo añadimos
 * cierre por backdrop, bloqueo de scroll y el puente de eventos a React.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  ...aria
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openRef = useRef(open);

  const autoId = useId();
  const titleId = `qc-modal-${autoId}-title`;
  const descriptionId = `qc-modal-${autoId}-description`;

  useEffect(() => {
    openRef.current = open;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-label={title ? undefined : aria["aria-label"]}
      onCancel={(event) => {
        if (!closeOnEscape) {
          event.preventDefault();
          return;
        }
        // El evento `close` hará el aviso; aquí solo dejamos pasar el Escape.
      }}
      onClose={() => {
        // `close` también salta en cierres programáticos: ahí `open` ya es false.
        if (openRef.current) onClose();
      }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 m-0 grid h-full max-h-none w-full max-w-none place-items-center",
        "bg-transparent p-4 text-ink",
        "backdrop:bg-ink/50 backdrop:backdrop-blur-[1px]",
      )}
    >
      {open ? (
        <div
          className={cn(
            "flex max-h-[85vh] w-full flex-col overflow-hidden rounded-sheet border border-border-subtle",
            "bg-surface shadow-overlay animate-rise",
            SIZE[size],
            className,
          )}
        >
          {title || showCloseButton ? (
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
              <div className="min-w-0">
                {title ? (
                  <h2 id={titleId} className="text-lg font-semibold text-ink">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className={cn(
                    "-mr-1 grid size-8 shrink-0 place-items-center rounded-control text-ink-muted",
                    "transition-colors duration-150 hover:bg-surface-sunken hover:text-ink",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                  )}
                >
                  <CloseIcon className="size-4.5" />
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-border-subtle bg-surface-sunken/60 px-5 py-3">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
