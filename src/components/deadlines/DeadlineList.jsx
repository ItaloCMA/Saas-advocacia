import React from 'react';
import { CalendarPlus, Download, Edit3, Trash2, FileText, ExternalLink, CheckCircle2 } from 'lucide-react';
import { generateGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar';

export default function DeadlineList({
  filteredDeadlines,
  cases,
  onEditDeadline,
  onDeleteDeadline,
  onMoveStage,
  showToast
}) {
  const normalizeStage = (stage) => {
    if (!stage || stage === 'A Fazer') return 'Triagem / A Fazer';
    if (stage === 'Em Andamento') return 'Em Minuta (Estagiário)';
    if (stage === 'Concluído') return 'Protocolado / Concluído';
    return stage;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="divide-y divide-slate-100">
        {filteredDeadlines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Nenhum prazo ou compromisso encontrado.
          </div>
        ) : (
          filteredDeadlines.map((item) => {
            const linkedCase = cases.find((c) => c.id === item.caseId);
            const gcalUrl = generateGoogleCalendarUrl(item, linkedCase);
            const stage = normalizeStage(item.kanbanStage);
            const isDone = stage === 'Protocolado / Concluído';

            return (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${
                        item.computedStatus.isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.computedStatus.isToday
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.computedStatus.label}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${
                        stage === 'Revisão do Advogado'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : stage === 'Em Minuta (Estagiário)'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : stage === 'Protocolado / Concluído'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {stage}
                    </span>

                    <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                      {item.type}
                    </span>

                    <span className="text-xs text-slate-500 font-mono">
                      {item.dueDate ? item.dueDate.split('-').reverse().join('/') : 'N/I'}{' '}
                      {item.allDay ? '(Dia Inteiro)' : `• ${item.dueTime || '14:00'}–${item.endTime || '15:00'}`}
                    </span>
                  </div>

                  <h4
                    className={`font-bold text-base ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {item.clientName && (
                      <span>
                        Cliente: <strong className="text-slate-800">{item.clientName}</strong> •{' '}
                      </span>
                    )}
                    {item.caseCnj && <span className="font-mono">Processo: {item.caseCnj} • </span>}
                    {item.location && <span>Local: {item.location} • </span>}
                    <span>
                      Responsável: <strong className="text-slate-800">{item.responsible || 'Equipe'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {item.minutaUrl && (
                      <a
                        href={item.minutaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Abrir Minuta</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {item.protocolCode && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Protocolo: {item.protocolCode}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Google Agenda</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      downloadICSFile(item, linkedCase);
                      showToast('Arquivo .ICS baixado!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>.ICS</span>
                  </button>

                  <select
                    value={stage}
                    onChange={(e) => onMoveStage(item, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Triagem / A Fazer">Triagem / A Fazer</option>
                    <option value="Em Minuta (Estagiário)">Em Minuta (Estagiário)</option>
                    <option value="Revisão do Advogado">Revisão do Advogado</option>
                    <option value="Protocolado / Concluído">Protocolado / Concluído</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditDeadline(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar Prazo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDeadline(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Excluir Prazo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
