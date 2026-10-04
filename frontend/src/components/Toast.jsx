import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';

const Toast = () => {
  const { toasts, removeToast } = useExpenses();

  if (!toasts || toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
    warning: 'border-amber-500/30 bg-amber-950/40 text-amber-100',
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-100',
    info: 'border-cyan-500/30 bg-slate-900/90 text-slate-100'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl
            border backdrop-blur-xl shadow-2xl shadow-black/60
            animate-slide-up transition-all duration-300
            ${borders[toast.type] || borders.info}
          `}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type] || icons.info}
            <span className="text-sm font-medium leading-tight">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
