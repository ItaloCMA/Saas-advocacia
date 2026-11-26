import React from 'react';
import { Sparkles, Briefcase, History, ExternalLink } from 'lucide-react';
import StatCards from './StatCards';
import CriticalDeadlines from './CriticalDeadlines';

export default function DashboardTab({
  stats,
  clients,
  cases,
  criticalDeadlines,
  seeding,
  onLoadSampleData,
  onNavigate,
  onOpenTimeline,
  onConcludeDeadline,
  onEditDeadline
}) {
  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas se base estiver vazia */}
      {clients.length === 0 && cases.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-2xs border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-amber-700 text-[11px] font-bold uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Ambiente Jurídico Pronto</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif-luxury">BEM-VINDO</h3>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Comece cadastrando seus clientes e processos reais ou carregue um conjunto de dados fictícios para explorar o fluxo completo de prazos, documentos e agenda.
            </p>
          </div>
          <button
            type="button"
            onClick={onLoadSampleData}
            disabled={seeding}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shrink-0 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{seeding ? 'Carregando...' : 'Carregar Dados de Demonstração'}</span>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">Painel Executivo</h2>
          <p className="text-sm text-slate-500">
            Visão consolidada da carteira de clientes, processos ativos e prazos judiciais.
          </p>
        </div>
        {clients.length > 0 && (
          <button
            type="button"
            onClick={onLoadSampleData}
            disabled={seeding}
            className="self-start sm:self-auto text-xs text-slate-600 hover:text-amber-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 transition-all font-medium cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Adicionar Dados de Teste</span>
          </button>
        )}
      </div>

      {/* 4 Cards KPI */}
      <StatCards stats={stats} clientsTotal={clients.length} onNavigate={onNavigate} />

      {/* Grid Principal: Prazos Críticos + Processos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CriticalDeadlines
          criticalDeadlines={criticalDeadlines}
          cases={cases}
          onNavigateDeadlines={() => onNavigate('deadlines')}
          onConcludeDeadline={onConcludeDeadline}
          onEditDeadline={onEditDeadline}
        />

        {/* Coluna: Processos Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Processos Recentes</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cases')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {cases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhum processo cadastrado ainda.
              </div>
            ) : (
              cases.slice(0, 5).map((proc) => (
                <div key={proc.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      {proc.cnjNumber}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                      {proc.area}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">{proc.clientName}</p>
                  <p className="text-xs text-slate-500 truncate">{proc.court || 'Juízo não informado'}</p>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => onOpenTimeline(proc)}
                      className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Andamentos ({(proc.timeline || []).length})</span>
                    </button>
                    {proc.courtUrl && (
                      <a
                        href={proc.courtUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                      >
                        <span>PJe/Tribunal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
