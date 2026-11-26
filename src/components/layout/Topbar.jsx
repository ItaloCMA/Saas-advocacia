import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  Plus,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Briefcase,
  CalendarPlus,
  Bell,
  Cloud,
  AlertTriangle,
  Clock,
  LogOut
} from 'lucide-react';
import { getInitials } from '../../utils/formatters';

export default function Topbar({
  globalSearch,
  setGlobalSearch,
  globalSearchResults,
  setActiveTab,
  setClientSearch,
  setCaseSearch,
  criticalDeadlines = [],
  isLocalMode,
  hasNativeServer,
  authLoading,
  currentUser,
  onSignOut,
  onOpenNewClient,
  onOpenNewCase,
  onOpenNewDeadline
}) {
  const searchInputRef = useRef(null);
  const newMenuRef = useRef(null);
  const notifRef = useRef(null);

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const urgentItems = criticalDeadlines.filter(
    (d) => d.computedStatus?.isOverdue || d.computedStatus?.isToday
  );

  const userName = currentUser?.displayName || 'Silvia Mayra';
  const userEmail = currentUser?.email || 'silviamayra@advocacia.com.br';
  const userInitial = getInitials(userName).slice(0, 1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setNewMenuOpen(false);
        setNotifOpen(false);
        if (globalSearch) {
          setGlobalSearch('');
          searchInputRef.current?.blur();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) {
        setNewMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [globalSearch, setGlobalSearch]);

  return (
    <header className="h-auto sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-2.5 sm:py-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 sticky top-0 z-30">
      {/* Busca Global */}
      <div className="relative flex-1 max-w-xl">
        <label htmlFor="global-search-input" className="sr-only">
          Busca rápida
        </label>
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

        <input
          id="global-search-input"
          ref={searchInputRef}
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Buscar cliente, CPF/CNPJ ou nº CNJ..."
          className="w-full pl-10 pr-16 sm:pr-20 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-slate-200/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {globalSearch ? (
            <button
              type="button"
              onClick={() => {
                setGlobalSearch('');
                searchInputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Ctrl K
            </kbd>
          )}
        </div>

        {/* Dropdown de Resultados */}
        {globalSearchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Resultados da Busca</span>
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                Fechar (Esc)
              </button>
            </div>

            {globalSearchResults.matchedClients.length === 0 &&
            globalSearchResults.matchedCases.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 py-6 text-center">
                Nenhum cliente ou processo encontrado para "{globalSearch}".
              </p>
            ) : (
              <div className="space-y-3 mt-2">
                {globalSearchResults.matchedClients.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 px-2 mb-1 uppercase tracking-wider">
                      Clientes ({globalSearchResults.matchedClients.length})
                    </p>
                    {globalSearchResults.matchedClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setActiveTab('clients');
                          setClientSearch(c.name);
                          setGlobalSearch('');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {c.document || 'Sem documento'} • {c.phone || 'Sem telefone'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.matchedCases.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 px-2 mb-1 uppercase tracking-wider">
                      Processos ({globalSearchResults.matchedCases.length})
                    </p>
                    {globalSearchResults.matchedCases.map((proc) => (
                      <div
                        key={proc.id}
                        onClick={() => {
                          setActiveTab('cases');
                          setCaseSearch(proc.cnjNumber);
                          setGlobalSearch('');
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate">
                            {proc.cnjNumber}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {proc.clientName} vs. {proc.opposingParty || 'N/I'}
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-medium shrink-0">
                          {proc.area}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações SaaS Limpas + Usuário Logado */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 shrink-0">
        {/* Status de Conexão Online */}
        <button
          type="button"
          onClick={() => setActiveTab('deploy')}
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
          title="Ver status de sincronização online e configurações"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              authLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <Cloud className="w-3.5 h-3.5 text-slate-400" />
          <span>{!isLocalMode ? 'Nuvem Online' : hasNativeServer ? 'Híbrido Local' : 'Nuvem Online'}</span>
        </button>

        {/* Sino de Alertas de Prazos */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            title="Alertas de prazos vencidos e para hoje"
            aria-label="Notificações de prazos"
          >
            <Bell className="w-4 h-4" />
            {urgentItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Prazos Urgentes</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {urgentItems.length} alerta(s)
                </span>
              </div>

              {urgentItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-5 text-center">
                  Nenhum prazo vencido ou vencendo hoje.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-1">
                  {urgentItems.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveTab('deadlines');
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer"
                    >
                      {item.computedStatus?.isOverdue ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.clientName || 'Sem cliente'} • {item.computedStatus?.label}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  setActiveTab('deadlines');
                }}
                className="mt-2 w-full py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Abrir Agenda Completa
              </button>
            </div>
          )}
        </div>

        {/* Botão Compacto + Novo */}
        <div className="relative" ref={newMenuRef}>
          <button
            type="button"
            onClick={() => setNewMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
            <span>Novo</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {newMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setNewMenuOpen(false);
                  onOpenNewDeadline();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-amber-600" />
                <span>Agendar Prazo / Audiência</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMenuOpen(false);
                  onOpenNewCase();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-slate-600" />
                <span>Cadastrar Processo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewMenuOpen(false);
                  onOpenNewClient();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-600" />
                <span>Novo Cliente</span>
              </button>
            </div>
          )}
        </div>

        {/* Perfil do Usuário Logado + Sair */}
        <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 ring-1 ring-amber-400/20">
            {userInitial}
          </div>
          <div className="min-w-0 leading-tight max-w-[140px]">
            <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
