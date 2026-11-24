import React from 'react';
import { Calendar, ChevronRight, CheckCircle2, UserCheck, CalendarPlus, Check, Edit3 } from 'lucide-react';
import { generateGoogleCalendarUrl } from '../../utils/calendar';

export default function CriticalDeadlines({
  criticalDeadlines,
  cases,
  onNavigateDeadlines,
  onConcludeDeadline,
  onEditDeadline
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Prazos Críticos & Próximas Audiências</h3>
        </div>
        <button
          type="button"
          onClick={onNavigateDeadlines}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Ver Agenda Completa</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 flex-1">
        {criticalDeadlines.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Nenhum prazo pendente no momento</p>
            <p className="text-xs mt-1 text-slate-500">
              Todos os prazos e audiências foram concluídos ou não há agendamentos.
            </p>
          </div>
        ) : (
          criticalDeadlines.slice(0, 6).map((item) => {
            const linkedCase = cases.find((c) => c.id === item.caseId);
            const gcalUrl = generateGoogleCalendarUrl(item, linkedCase);

            return (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        item.computedStatus.isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.computedStatus.isToday
                          ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.computedStatus.label}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.type}
                    </span>
                    {item.priorityLevel && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          item.priorityLevel === 'Urgente'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.priorityLevel === 'Alta'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priorityLevel}
                      </span>
                    )}
                    {item.responsible && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" /> {item.responsible}
                      </span>
                    )}
                  </div>

                  <p className="font-semibold text-slate-900 text-sm truncate">{item.title}</p>

                  {(item.caseCnj || item.clientName || item.location) && (
                    <p className="text-xs text-slate-500 truncate">
                      {item.clientName && <span className="font-medium text-slate-700">{item.clientName}</span>}
                      {item.caseCnj && <span className="font-mono ml-2 text-slate-500">• {item.caseCnj}</span>}
                      {item.location && <span className="ml-2 text-slate-500">• {item.location}</span>}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Adicionar à Google Agenda"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center gap-1 transition-all"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Agenda</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onConcludeDeadline(item)}
                    title="Marcar como Concluído"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditDeadline(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Editar Prazo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
