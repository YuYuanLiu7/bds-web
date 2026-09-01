'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastApi {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let seq = 0;

/**
 * 全站 Toast 通知（取代瀏覽器原生 alert）。掛在 root layout，
 * 任何 client 元件以 useToast() 取用：toast.success(...) / toast.error(...)。
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++seq;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const api: ToastApi = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
    info: (m) => show(m, 'info'),
  };

  const styles: Record<ToastType, { ring: string; icon: React.ReactNode }> = {
    success: { ring: 'border-emerald-200', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
    error: { ring: 'border-rose-200', icon: <AlertCircle className="w-5 h-5 text-rose-500" /> },
    info: { ring: 'border-slate-200', icon: <Info className="w-5 h-5 text-primary" /> },
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[3000] flex flex-col gap-2 max-w-[90vw] w-80 pointer-events-none" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 bg-white border ${styles[t.type].ring} shadow-lg rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 animate-in fade-in duration-200`}
          >
            <span className="shrink-0 mt-0.5">{styles[t.type].icon}</span>
            <p className="flex-1 leading-relaxed break-words">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              aria-label="關閉通知"
              className="shrink-0 text-slate-300 hover:text-slate-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// 取用 Toast；若不在 Provider 內（理論上不會），退回原生 alert 以免崩潰
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const fallback = (m: string) => { if (typeof window !== 'undefined') window.alert(m); };
  return { show: fallback, success: fallback, error: fallback, info: fallback };
}
