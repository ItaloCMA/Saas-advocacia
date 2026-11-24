import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ deleteConfirm, onCancel, onConfirm }) {
  useEffect(() => {
    if (!deleteConfirm) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirm, onCancel]);

  if (!deleteConfirm) return null;

  const isWarning = deleteConfirm.variant === 'warning';
  const title = deleteConfirm.heading || 'Confirmar Exclusão';
  const subtitle = deleteConfirm.subtitle || (isWarning ? 'Revise antes de continuar.' : 'Esta ação não poderá ser desfeita.');
  const confirmLabel = deleteConfirm.confirmLabel || 'Sim, Excluir';

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 duration-150 ${
          isWarning ? 'border-amber-200' : 'border-rose-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                isWarning
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              {isWarning ? <AlertTriangle className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="delete-confirm-title" className="font-bold text-slate-900 text-base">
                {title}
              </h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          {deleteConfirm.description ? (
            deleteConfirm.description
          ) : (
            <>
              Tem certeza de que deseja excluir permanentemente{' '}
              <strong className="text-slate-900 font-bold">"{deleteConfirm.title}"</strong>?
            </>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold active:scale-95 text-white shadow-sm transition-all cursor-pointer ${
              isWarning
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
