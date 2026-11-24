import React, { useEffect } from 'react';
import { X, Trash2, History, Send } from 'lucide-react';

export default function CaseTimelineModal({
  caseTimelineModal,
  onClose,
  newTimelineAuthor,
  setNewTimelineAuthor,
  newTimelineNote,
  setNewTimelineNote,
  onAddTimelineEntry,
  onDeleteTimelineEntry
}) {
  useEffect(() => {
    if (!caseTimelineModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [caseTimelineModal, onClose]);

  if (!caseTimelineModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-timeline-title"
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-mono font-bold text-amber-800 block">{caseTimelineModal.cnjNumber}</span>
            <h3 id="case-timeline-title" className="font-bold text-base font-serif-luxury text-gold-gradient">
              Histórico de Andamentos — {caseTimelineModal.clientName}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário para nova anotação */}
        <form onSubmit={onAddTimelineEntry} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTimelineAuthor}
              onChange={(e) => setNewTimelineAuthor(e.target.value)}
              placeholder={`Autor (Ex: ${caseTimelineModal.responsible || 'Dr. Henrique'})`}
              className="sm:w-48 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs focus:border-amber-500 focus:outline-none transition-all"
            />
            <input
              type="text"
              required
              value={newTimelineNote}
              onChange={(e) => setNewTimelineNote(e.target.value)}
              placeholder="Descreva a publicação, despacho ou diligência realizada..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 text-xs focus:border-amber-500 focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Registrar</span>
            </button>
          </div>
        </form>

        {/* Lista Cronológica com Linha Dourada */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {(!caseTimelineModal.timeline || caseTimelineModal.timeline.length === 0) ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              <History className="w-8 h-8 text-amber-500/40 mx-auto mb-2" />
              Nenhum andamento registrado neste processo ainda.
            </div>
          ) : (
            caseTimelineModal.timeline.map((entry) => (
              <div key={entry.id} className="relative pl-6 pb-4 border-l-2 border-amber-400 last:border-l-0 last:pb-0">
                <span className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 absolute -left-[7px] top-1 ring-4 ring-white shadow-xs" />
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-amber-800">{entry.author || 'Equipe'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(entry.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <button
                        onClick={() => onDeleteTimelineEntry(entry.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
                        title="Remover anotação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
