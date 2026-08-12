import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

// Sistema de toasts accesibles: el viewport es una región aria-live polite
// (role="status"), así los cambios se anuncian al lector de pantalla sin
// robarle el foco. Auto-dismiss por mensaje.

export type ToastTone = "success" | "info" | "danger";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-emerald-300",
  info: "border-blue-300",
  danger: "border-red-300",
};

const ToastContext = createContext<{ toast: (message: string, tone?: ToastTone) => void } | null>(
  null,
);

/** Leer el contexto de toasts. Se usa en componentes dentro de <ToastProvider>. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++counter.current;
      setItems((list) => [...list, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-relevant="additions"
        className="fixed bottom-4 right-4 z-50 flex w-72 flex-col items-end gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-stone-700 shadow-lg ${TONE_STYLES[item.tone]}`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
