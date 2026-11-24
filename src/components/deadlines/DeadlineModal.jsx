import React, { useEffect } from 'react';
import { Calendar, X, FileText } from 'lucide-react';

export default function DeadlineModal({
  isOpen,
  onClose,
  editingDeadline,
  cases,
  deadlineAllDay,
  setDeadlineAllDay,
  onSave
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStage = editingDeadline?.kanbanStage || 'Triagem / A Fazer';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="deadline-modal-title"
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 bg-white border-b border-slate-100 text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 id="deadline-modal-title" className="font-bold text-base font-serif-luxury text-gold-gradient">
              {editingDeadline ? 'Editar Prazo / Audiência' : 'Agendar Prazo ou Audiência'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form key={editingDeadline?.id || 'new-deadline'} onSubmit={onSave} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Prazo / Audiência *</label>
            <input
              name="title"
              required
              defaultValue={editingDeadline?.title || ''}
              placeholder="Ex: Minutar Contestação / Audiência de Instrução"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Compromisso</label>
              <select
                name="type"
                defaultValue={editingDeadline?.type || 'Prazo Fatal'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Prazo Fatal">Prazo Fatal</option>
                <option value="Audiência">Audiência Judicial</option>
                <option value="Prazo Comum">Prazo Comum</option>
                <option value="Diligência">Diligência</option>
                <option value="Reunião">Reunião</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
              <select
                name="priorityLevel"
                defaultValue={editingDeadline?.priorityLevel || 'Alta'}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="Urgente">Urgente / Fatal</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Normal">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estágio do Fluxo</label>
              <select
                name="kanbanStage"
                defaultValue={currentStage}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="Triagem / A Fazer">🟡 Triagem / A Fazer</option>
                <option value="Em Minuta (Estagiário)">🔵 Em Minuta (Estagiário)</option>
                <option value="Revisão do Advogado">🟠 ⭐ Revisão do Advogado</option>
                <option value="Protocolado / Concluído">🟢 ✔️ Protocolado / Concluído</option>
              </select>
            </div>
          </div>

          {/* Caixa de Integração de Minuta & Protocolo (Advogado + Estagiário) */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Fluxo de Minuta & Protocolo (Advogado + Estagiário)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Integração Google Docs / Drive</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Link da Minuta (Google Docs ou Word Online)
                </label>
                <input
                  name="minutaUrl"
                  type="url"
                  defaultValue={editingDeadline?.minutaUrl || ''}
                  placeholder="https://docs.google.com/document/d/.../edit"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Estagiário cola o link aqui para o advogado revisar em 1 clique.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Comprovante de Protocolo (Recibo ou Código)
                </label>
                <input
                  name="protocolCode"
                  defaultValue={editingDeadline?.protocolCode || ''}
                  placeholder="Ex: PJe-884920 ou link do recibo"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-emerald-900 placeholder-slate-400 text-xs font-mono focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Advogado anota o recibo após protocolar no tribunal.</p>
              </div>
            </div>
          </div>

          {/* Data, Horário e Opção Dia Inteiro */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Data e Horário (Google Agenda)</span>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={deadlineAllDay}
                  onChange={(e) => setDeadlineAllDay(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Evento de Dia Inteiro</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data do Ato / Prazo *</label>
                <input
                  type="date"
                  name="dueDate"
                  required
                  defaultValue={editingDeadline?.dueDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {!deadlineAllDay && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Horário Início</label>
                    <input
                      type="time"
                      name="dueTime"
                      defaultValue={editingDeadline?.dueTime || '14:00'}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Horário Fim</label>
                    <input
                      type="time"
                      name="endTime"
                      defaultValue={editingDeadline?.endTime || '15:00'}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Processo Vinculado</label>
              <select
                name="caseId"
                defaultValue={editingDeadline?.caseId || ''}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Sem vínculo ou selecionar abaixo --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cnjNumber} — {c.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável pela Tarefa</label>
              <input
                name="responsible"
                defaultValue={editingDeadline?.responsible || ''}
                placeholder="Ex: Dr. Henrique (Advogado) ou Lucas (Estagiário)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente (se não vinculado a processo)</label>
              <input
                name="customClientName"
                defaultValue={editingDeadline?.clientName || ''}
                placeholder="Ex: Roberto Almeida Construtora"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CNJ (se não vinculado a processo)</label>
              <input
                name="customCnj"
                defaultValue={editingDeadline?.caseCnj || ''}
                placeholder="0000000-00.0000.0.00.0000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-amber-900 placeholder-slate-400 text-sm font-mono focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Local / Fórum / Vara ou Link da Sala Virtual (Google Meet, Zoom, Teams)
            </label>
            <input
              name="location"
              defaultValue={editingDeadline?.location || ''}
              placeholder="Ex: https://meet.google.com/abc-defg-hij ou Fórum Central - 14ª Vara Cível"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instruções / Observações para a Agenda</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={editingDeadline?.notes || ''}
              placeholder="Ex: Seguir modelo 01 do Drive e anexar comprovantes de despesas..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
            >
              Salvar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
