import {
  createContext, useCallback, useContext, useState, type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType; desc?: string };

const ToastCtx = createContext<{ toast: (m: string, t?: ToastType, d?: string) => void }>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "success", desc?: string) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { id, message, type, desc }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const icon = (t: ToastType) =>
    t === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
    : t === "error" ? <AlertCircle className="h-5 w-5 text-red-400" />
    : <Info className="h-5 w-5 text-cyber-400" />;

  const ring = (t: ToastType) =>
    t === "success" ? "ring-emerald-500/20" : t === "error" ? "ring-red-500/20" : "ring-cyber-500/20";

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-4 ring-1 ${ring(t.type)}`}
            >
              <span className="mt-0.5 shrink-0">{icon(t.type)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.message}</p>
                {t.desc && <p className="mt-0.5 text-xs text-slate-400">{t.desc}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="shrink-0 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
