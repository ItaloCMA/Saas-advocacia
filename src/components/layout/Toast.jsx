import React from 'react';
import { AlertTriangle, CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const type = toast.type || 'success';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    warning: 'border-amber-500/30',
    info: 'border-sky-500/30'
  };

  return (
    <div 
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border ${borders[type] || 'border-slate-800'} flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 transition-all`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icons[type] || icons.success}
        <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 leading-snug">
          {toast.message}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
