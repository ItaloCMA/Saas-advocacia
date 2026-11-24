import React from 'react';
import {
  Plus,
  Search,
  Kanban,
  ListFilter,
  Webhook,
  Sparkles,
  AlertTriangle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import DeadlineKanban from './DeadlineKanban';
import DeadlineList from './DeadlineList';

export default function DeadlinesTab({
  deadlineView,
  setDeadlineView,
  deadlineFilterType,
  setDeadlineFilterType,
  deadlineStageQuickFilter,
  setDeadlineStageQuickFilter,
  deadlineResponsibleFilter,
  setDeadlineResponsibleFilter,
  filteredDeadlines,
  cases,
  webhookUrl,
  autoSyncCalendar,
  onOpenDeployTab,
  onOpenNewDeadline,
  onEditDeadline,
  onDeleteDeadline,
  onMoveStage,
  showToast
}) {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">
            Agenda de Prazos & Delegação
          </h2>
          <p className="text-sm text-slate-500">
            Triagem, elaboração de minutas, revisão jurídica e protocolo final.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenDeployTab}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              webhookUrl.trim() && autoSyncCalendar
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Configurar sincronização automática com Google Agenda"
          >
            <Webhook className="w-3.5 h-3.5 text-amber-600" />
            <span>{webhookUrl.trim() && autoSyncCalendar ? 'Sync Google Ativo' : 'Auto-Sync Google'}</span>
          </button>

          <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
            <button
              type="button"
              onClick={() => setDeadlineView('kanban')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                deadlineView === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-amber-600" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setDeadlineView('list')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                deadlineView === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-amber-600" />
              <span>Lista</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewDeadline}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Agendar Prazo</span>
          </button>
        </div>
      </div>

      {/* Filtros Rápidos Estratégicos */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDeadlineStageQuickFilter('Todos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            deadlineStageQuickFilter === 'Todos'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
        >
          Todos os Prazos
        </button>

        <button
          type="button"
          onClick={() => setDeadlineStageQuickFilter('Revisao')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
            deadlineStageQuickFilter === 'Revisao'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Aguardando Revisão</span>
        </button>

        <button
          type="button"
          onClick={() => setDeadlineStageQuickFilter('Minuta')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
            deadlineStageQuickFilter === 'Minuta'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border-blue-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Em Minuta</span>
        </button>

        <button
          type="button"
          onClick={() => setDeadlineStageQuickFilter('Hoje')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
            deadlineStageQuickFilter === 'Hoje'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border-rose-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vencem Hoje / Atrasados</span>
        </button>

        <button
          type="button"
          onClick={() => setDeadlineStageQuickFilter('Protocolado')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
            deadlineStageQuickFilter === 'Protocolado'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Protocolados</span>
        </button>
      </div>

      {/* Barra de Busca e Tipo */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={deadlineResponsibleFilter}
            onChange={(e) => setDeadlineResponsibleFilter(e.target.value)}
            placeholder="Filtrar por título, responsável, local ou cliente..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['Todos', 'Prazo Fatal', 'Prazo Comum', 'Audiência', 'Reunião', 'Diligência'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDeadlineFilterType(t)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                deadlineFilterType === t
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {deadlineView === 'kanban' ? (
        <DeadlineKanban
          filteredDeadlines={filteredDeadlines}
          cases={cases}
          onEditDeadline={onEditDeadline}
          onDeleteDeadline={onDeleteDeadline}
          onMoveStage={onMoveStage}
          showToast={showToast}
        />
      ) : (
        <DeadlineList
          filteredDeadlines={filteredDeadlines}
          cases={cases}
          onEditDeadline={onEditDeadline}
          onDeleteDeadline={onDeleteDeadline}
          onMoveStage={onMoveStage}
          showToast={showToast}
        />
      )}
    </div>
  );
}
