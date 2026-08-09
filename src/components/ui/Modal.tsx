"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  /** Va al panel, no al contenedor. */
  className?: string;
};

const SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  full: "max-w-4xl",
};

/**
 * Modal por portal a `document.body`: sin `<dialog>` nativo, sin depender del
 * top-layer del navegador. Bloquea scroll, cierra por Escape/backdrop y
 * mantiene el foco dentro del panel.
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
  const autoId = useId();
  const titleId = `qc-modal-${autoId}-title`;
  const descriptionId = `qc-modal-${autoId}-description`;

  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  // Mientras no hay cliente, no hay modal: evita el mismatch de hidratación.
  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 backdrop-blur-[2px]",
        "animate-rise",
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-label={title ? undefined : aria["aria-label"]}
        className={cn(
          "mx-auto flex min-h-full w-full max-w-full items-center",
        )}
      >
        <div
          className={cn(
            "w-full flex-col overflow-hidden rounded-sheet border border-border-subtle",
            "bg-surface shadow-overlay",
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
                    "-mr-1 grid size-8 shrink-0 place-items-center rounded-button text-ink-muted",
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
      </div>
    </div>,
    document.body,
  );
}