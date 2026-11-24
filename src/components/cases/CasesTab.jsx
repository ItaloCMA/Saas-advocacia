import React from 'react';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  Table2,
  Copy,
  Check,
  History,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import CaseCard from './CaseCard';

export default function CasesTab({
  filteredCases,
  caseSearch,
  setCaseSearch,
  caseAreaFilter,
  setCaseAreaFilter,
  caseStatusFilter,
  setCaseStatusFilter,
  casesView = 'cards',
  setCasesView,
  caseSort = 'recent',
  setCaseSort,
  copiedText,
  onCopyCNJ,
  onOpenNewCase,
  onOpenTimeline,
  onEditCase,
  onDeleteCase
}) {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">Controle de Processos</h2>
          <p className="text-sm text-slate-500">
            Acompanhamento processual CNJ, links de tribunais e linha do tempo de andamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {setCasesView && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
              <button
                type="button"
                onClick={() => setCasesView('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  casesView === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setCasesView('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  casesView === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Tabela</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenNewCase}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Cadastrar Processo</span>
          </button>
        </div>
      </div>

      {/* Filtros e Ordenação */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={caseSearch}
            onChange={(e) => setCaseSearch(e.target.value)}
            placeholder="Buscar por número CNJ, cliente, parte contrária, vara ou advogado..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setCaseSort && (
            <select
              value={caseSort}
              onChange={(e) => setCaseSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
              aria-label="Ordenar processos"
            >
              <option value="recent">Ordenar: Recentes</option>
              <option value="client">Ordenar: Cliente A–Z</option>
              <option value="area">Ordenar: Área</option>
            </select>
          )}

          <select
            value={caseAreaFilter}
            onChange={(e) => setCaseAreaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Todas">Todas as Áreas</option>
            <option value="Cível">Cível</option>
            <option value="Trabalhista">Trabalhista</option>
            <option value="Previdenciário">Previdenciário</option>
            <option value="Família">Família</option>
            <option value="Criminal">Criminal</option>
            <option value="Tributário">Tributário</option>
            <option value="Outros">Outros</option>
          </select>

          {['Todos', 'Ativo', 'Suspenso', 'Arquivado', 'Encerrado'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setCaseStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                caseStatusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Tabela */}
      {filteredCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">Nenhum processo localizado</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {caseSearch || caseAreaFilter !== 'Todas' || caseStatusFilter !== 'Todos'
              ? 'Nenhum processo coincide com a busca e filtros aplicados.'
              : 'Cadastre um novo processo clicando no botão "+ Cadastrar Processo" acima.'}
          </p>
          {(caseSearch || caseAreaFilter !== 'Todas' || caseStatusFilter !== 'Todos') && (
            <button
              type="button"
              onClick={() => {
                setCaseSearch('');
                setCaseAreaFilter('Todas');
                setCaseStatusFilter('Todos');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer active:scale-95"
            >
              Limpar Filtros e Ver Todos
            </button>
          )}
        </div>
      ) : casesView === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="px-5 py-3.5">CNJ</th>
                  <th className="px-5 py-3.5">Cliente / Parte Contrária</th>
                  <th className="px-5 py-3.5">Área & Fase</th>
                  <th className="px-5 py-3.5">Juízo / Vara</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCases.map((proc) => (
                  <tr key={proc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {proc.cnjNumber || 'Sem CNJ'}
                        </span>
                        {proc.cnjNumber && (
                          <button
                            type="button"
                            onClick={() => onCopyCNJ(proc.cnjNumber)}
                            className="text-slate-400 hover:text-amber-700 p-0.5 cursor-pointer"
                            title="Copiar CNJ"
                          >
                            {copiedText === proc.cnjNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900 truncate max-w-[200px]">{proc.clientName}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                        vs. {proc.opposingParty || 'N/I'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 mr-1.5">
                        {proc.area}
                      </span>
                      <span className="text-xs text-slate-500">{proc.phase}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[220px] truncate">
                      {proc.court || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          proc.status === 'Ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : proc.status === 'Suspenso'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {proc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenTimeline(proc)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Histórico de Andamentos"
                        >
                          <History className="w-3.5 h-3.5 text-amber-600" />
                          <span>{(proc.timeline || []).length}</span>
                        </button>
                        {proc.courtUrl && (
                          <a
                            href={proc.courtUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Abrir no Tribunal"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditCase(proc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCase(proc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((proc) => (
            <CaseCard
              key={proc.id}
              proc={proc}
              copiedText={copiedText}
              onCopyCNJ={onCopyCNJ}
              onOpenTimeline={onOpenTimeline}
              onEditCase={onEditCase}
              onDeleteCase={onDeleteCase}
            />
          ))}
        </div>
      )}
    </div>
  );
}
