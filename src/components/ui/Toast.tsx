"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "./icons";

export type ToastTone = "neutral" | "success" | "warning" | "critical" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms hasta el auto-cierre. `null` lo deja fijo hasta que lo cierren. */
  duration?: number | null;
  /** El "deshacer": al pulsarlo se ejecuta y el toast se va. */
  action?: ToastAction;
};

export type ToastRecord = ToastOptions & { id: string };

export type ToastProps = {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
  className?: string;
};

const TONE: Record<ToastTone, { accent: string; icon: React.ReactNode }> = {
  neutral: { accent: "text-ink-muted", icon: <InfoIcon className="size-4.5" /> },
  success: { accent: "text-brand-600", icon: <CheckIcon className="size-4.5" /> },
  warning: { accent: "text-warning", icon: <AlertIcon className="size-4.5" /> },
  critical: { accent: "text-danger", icon: <AlertIcon className="size-4.5" /> },
  info: { accent: "text-info", icon: <InfoIcon className="size-4.5" /> },
};

/** Toasts con acción duran más: hay que darle tiempo al "deshacer". */
export const DEFAULT_TOAST_DURATION = 4000;
export const ACTION_TOAST_DURATION = 5000;

export function Toast({ toast, onDismiss, className }: ToastProps) {
  const tone = TONE[toast.tone ?? "neutral"];
  const total =
    toast.duration === null
      ? null
      : (toast.duration ?? (toast.action ? ACTION_TOAST_DURATION : DEFAULT_TOAST_DURATION));

  const [paused, setPaused] = useState(false);
  const remaining = useRef(total ?? 0);
  const startedAt = useRef(Date.now());

  const dismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  // El contador se congela con el puntero encima o con el foco dentro: si no,
  // el "deshacer" desaparece justo cuando lo vas a pulsar.
  useEffect(() => {
    if (total === null || paused || remaining.current <= 0) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(dismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [total, paused, dismiss]);

  return (
    <div
      role={toast.tone === "critical" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-card border border-border-subtle",
        "bg-surface px-4 py-3 shadow-raised animate-rise",
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", tone.accent)}>{tone.icon}</span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm leading-snug text-ink-muted">{toast.description}</p>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              dismiss();
            }}
            className={cn(
              "mt-2 rounded-control text-sm font-semibold text-brand-700 underline-offset-2",
              "transition-colors duration-150 hover:text-brand-800 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
            )}
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className={cn(
          "-mr-1 -mt-0.5 grid size-7 shrink-0 place-items-center rounded-control text-ink-faint",
          "transition-colors duration-150 hover:bg-surface-sunken hover:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        )}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
