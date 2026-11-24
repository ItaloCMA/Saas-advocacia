import React from 'react';
import {
  Edit3,
  Trash2,
  MapPin,
  CalendarPlus,
  Download,
  UserCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { generateGoogleCalendarUrl, downloadICSFile } from '../../utils/calendar';

export const KANBAN_STAGES = [
  {
    id: 'Triagem / A Fazer',
    title: 'Triagem / A Fazer',
    dot: 'bg-slate-400',
    accentBorder: 'border-t-slate-400',
    badge: 'bg-white text-slate-700 border-slate-200'
  },
  {
    id: 'Em Minuta (Estagiário)',
    title: 'Em Minuta (Estagiário)',
    dot: 'bg-blue-500',
    accentBorder: 'border-t-blue-500',
    badge: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    id: 'Revisão do Advogado',
    title: 'Revisão do Advogado',
    dot: 'bg-amber-600',
    accentBorder: 'border-t-amber-600',
    badge: 'bg-amber-50 text-amber-900 border-amber-300'
  },
  {
    id: 'Protocolado / Concluído',
    title: 'Protocolado',
    dot: 'bg-emerald-500',
    accentBorder: 'border-t-emerald-500',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
];

export default function DeadlineKanban({
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {KANBAN_STAGES.map((col) => {
        const columnItems = filteredDeadlines.filter((d) => normalizeStage(d.kanbanStage) === col.id);
        const isReviewCol = col.id === 'Revisão do Advogado';
        const isDoneCol = col.id === 'Protocolado / Concluído';

        return (
          <div
            key={col.id}
            className={`rounded-2xl border border-slate-200/80 border-t-[3px] ${col.accentBorder} bg-slate-100/60 p-4 flex flex-col min-h-[480px]`}
          >
            {/* Cabeçalho da Coluna */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  {isReviewCol && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{col.title}</span>
                </h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${col.badge}`}>
                {columnItems.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3 flex-1">
              {columnItems.length === 0 ? (
                <div className="h-44 rounded-xl border border-dashed border-slate-300/80 flex items-center justify-center text-xs text-slate-400">
                  Nenhum item nesta etapa
                </div>
              ) : (
                columnItems.map((item) => {
                  const linkedCase = cases.find((c) => c.id === item.caseId);
                  const gcalUrl = generateGoogleCalendarUrl(item, linkedCase);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-4 shadow-2xs border transition-all space-y-3 hover:shadow-md ${
                        item.computedStatus.isOverdue && !isDoneCol
                          ? 'border-rose-300'
                          : item.computedStatus.isToday && !isDoneCol
                          ? 'border-amber-300'
                          : 'border-slate-200/80 hover:border-amber-300'
                      }`}
                    >
                      {/* Status + Ações */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${item.computedStatus.color}`}
                          >
                            {item.computedStatus.label}
                          </span>
                          {item.priorityLevel && (
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                item.priorityLevel === 'Urgente'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.priorityLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditDeadline(item)}
                            className="p-1 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Editar Prazo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDeadline(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir Prazo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Título */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
                          <span>{item.type}</span>
                          <span className="font-mono text-slate-500">
                            {item.allDay ? 'Dia Inteiro' : `${item.dueTime || '14:00'} - ${item.endTime || '15:00'}`}
                          </span>
                        </div>
                        <h4
                          className={`font-bold text-sm leading-snug ${
                            isDoneCol ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {(item.clientName || item.caseCnj || item.location) && (
                        <div className="text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 space-y-1">
                          {item.clientName && <p className="font-semibold text-slate-900 truncate">{item.clientName}</p>}
                          {item.caseCnj && <p className="font-mono text-[11px] text-slate-500">CNJ: {item.caseCnj}</p>}
                          {item.location && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {item.minutaUrl && (
                        <a
                          href={item.minutaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Abrir Minuta</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      )}

                      {item.protocolCode && (
                        <div className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg flex items-center justify-between">
                          <span className="font-medium">Protocolo:</span>
                          <span className="font-mono font-bold truncate max-w-[150px]">{item.protocolCode}</span>
                        </div>
                      )}

                      {item.notes && <p className="text-xs text-slate-500 line-clamp-2 italic">"{item.notes}"</p>}

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all"
                          title="Adicionar à Google Agenda"
                        >
                          <CalendarPlus className="w-3 h-3 text-amber-600" />
                          <span>Google Agenda</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            downloadICSFile(item, linkedCase);
                            showToast('Arquivo .ICS baixado!');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                          title="Baixar arquivo .ICS"
                        >
                          <Download className="w-3 h-3 text-amber-600" />
                          <span>.ICS</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate max-w-[115px]">
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.responsible || 'Equipe'}</span>
                        </span>

                        {col.id === 'Triagem / A Fazer' && (
                          <button
                            type="button"
                            onClick={() => onMoveStage(item, 'Em Minuta (Estagiário)')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Iniciar Minuta</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {col.id === 'Em Minuta (Estagiário)' && (
                          <button
                            type="button"
                            onClick={() => onMoveStage(item, 'Revisão do Advogado')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Enviar p/ Revisão</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {col.id === 'Revisão do Advogado' && (
                          <button
                            type="button"
                            onClick={() => onMoveStage(item, 'Protocolado / Concluído')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Protocolar</span>
                          </button>
                        )}

                        {col.id === 'Protocolado / Concluído' && (
                          <button
                            type="button"
                            onClick={() => onMoveStage(item, 'Triagem / A Fazer')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reabrir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
