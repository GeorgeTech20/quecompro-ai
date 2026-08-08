"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "./cn";
import { Toast, type ToastOptions, type ToastRecord } from "./Toast";

export type ToastContextValue = {
  toasts: ToastRecord[];
  /** Publica un toast y devuelve su id para poder cerrarlo a mano. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export type ToastPlacement = "bottom-right" | "bottom-center" | "top-right" | "top-center";

export type ToastProviderProps = {
  children: React.ReactNode;
  /** Más de esto y el más viejo sale. Los avisos en vivo se apilan rápido. */
  max?: number;
  placement?: ToastPlacement;
  className?: string;
};

const PLACEMENT: Record<ToastPlacement, string> = {
  "bottom-right": "bottom-0 right-0 items-end flex-col-reverse",
  "bottom-center": "bottom-0 inset-x-0 items-center flex-col-reverse",
  "top-right": "top-0 right-0 items-end flex-col",
  "top-center": "top-0 inset-x-0 items-center flex-col",
};

export function ToastProvider({
  children,
  max = 4,
  placement = "bottom-right",
  className,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  const toast = useCallback(
    (options: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((current) => [...current, { ...options, id }].slice(-max));
      return id;
    },
    [max],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss, clear }),
    [toasts, toast, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // `aria-live` en el contenedor fijo: los toasts que entran se anuncian
        // sin robar el foco de lo que la persona esté haciendo.
        aria-live="polite"
        aria-atomic="false"
        className={cn(
          "pointer-events-none fixed z-[60] flex gap-2 p-4 sm:max-w-sm",
          "w-full",
          PLACEMENT[placement],
          className,
        )}
      >
        {toasts.map((item) => (
          <Toast key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast() necesita un <ToastProvider> por encima en el árbol.");
  }
  return context;
}
