import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgStyle =
    toast.type === 'success'
      ? 'bg-[var(--carte-bg)] border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
      : toast.type === 'error'
      ? 'bg-[var(--carte-bg)] border-rose-500/40 text-rose-600 dark:text-rose-300'
      : 'bg-[var(--carte-bg)] border-amber-500/40 text-amber-600 dark:text-amber-300';

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info;

  return (
    <div
      className={`pointer-events-auto border rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 ${bgStyle}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 text-[var(--text)] font-medium leading-relaxed font-sans">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[var(--text-muted)] hover:text-[var(--text)] p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
