import React from 'react';
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  Table2,
  FileText,
  Briefcase,
  MessageCircle,
  Edit3,
  Trash2,
  FolderOpen
} from 'lucide-react';
import ClientCard from './ClientCard';
import { getWhatsAppLink, getInitials } from '../../utils/formatters';

export default function ClientsTab({
  clients,
  filteredClients,
  clientSearch,
  setClientSearch,
  clientStatusFilter,
  setClientStatusFilter,
  clientsView = 'cards',
  setClientsView,
  clientSort = 'name',
  setClientSort,
  caseCountByClient,
  docsCountByClient = {},
  onOpenDocuments,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onFilterCases
}) {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif-luxury text-gold-gradient">Clientes & CRM Jurídico</h2>
          <p className="text-sm text-slate-500">
            Carteira de clientes, documentos digitais, processos vinculados e contato rápido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Alternador Cards / Tabela */}
          {setClientsView && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 flex items-center">
              <button
                type="button"
                onClick={() => setClientsView('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  clientsView === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setClientsView('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  clientsView === 'table'
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
            onClick={onOpenNewClient}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca, Ordenação e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            placeholder="Filtrar por nome, CPF/CNPJ, telefone ou e-mail..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:border-amber-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {setClientSort && (
            <select
              value={clientSort}
              onChange={(e) => setClientSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
              aria-label="Ordenar clientes"
            >
              <option value="name">Ordenar: A–Z</option>
              <option value="recent">Ordenar: Mais Recentes</option>
              <option value="cases">Ordenar: Mais Processos</option>
            </select>
          )}

          {['Todos', 'Ativo', 'Prospecção', 'Inativo'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setClientStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                clientStatusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Estado Vazio */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-slate-800">Nenhum cliente encontrado</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {clientSearch || clientStatusFilter !== 'Todos'
              ? 'Não encontramos resultados para os termos ou status selecionados.'
              : 'Cadastre um novo cliente clicando no botão "+ Novo Cliente" acima.'}
          </p>
          {(clientSearch || clientStatusFilter !== 'Todos') && (
            <button
              type="button"
              onClick={() => {
                setClientSearch('');
                setClientStatusFilter('Todos');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer active:scale-95"
            >
              Limpar Filtros e Ver Todos
            </button>
          )}
        </div>
      ) : clientsView === 'table' ? (
        /* VISUALIZAÇÃO EM TABELA SAAS LIMPA */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">CPF / CNPJ</th>
                  <th className="px-5 py-3.5">Contato</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Vínculos</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClients.map((client) => {
                  const waLink = getWhatsAppLink(client.phone, client.name);
                  const linkedCount = caseCountByClient[client.id] || 0;
                  const docsCount = docsCountByClient[client.id] || 0;

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[220px]">{client.name}</p>
                            {client.email && (
                              <p className="text-xs text-slate-400 truncate max-w-[220px]">{client.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                        {client.document || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{client.phone || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            client.status === 'Ativo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : client.status === 'Prospecção'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {client.status || 'Ativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onFilterCases(client.name)}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer"
                            title="Ver processos deste cliente"
                          >
                            <Briefcase className="w-3 h-3 text-amber-600" />
                            <span>{linkedCount}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenDocuments && onOpenDocuments(client)}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center gap-1 cursor-pointer"
                            title="Abrir documentos"
                          >
                            <FileText className="w-3 h-3 text-amber-600" />
                            <span>{docsCount}</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {client.driveUrl && (
                            <a
                              href={client.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Pasta na Nuvem"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </a>
                          )}
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditClient(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClient(client)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUALIZAÇÃO EM CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              linkedCount={caseCountByClient[client.id] || 0}
              docsCount={docsCountByClient[client.id] || 0}
              onOpenDocuments={onOpenDocuments}
              onEdit={onEditClient}
              onDelete={onDeleteClient}
              onFilterCases={onFilterCases}
            />
          ))}
        </div>
      )}
    </div>
  );
}
