import React from 'react';
import {
  Scale,
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Cloud,
  FolderOpen,
  FileText,
  BookOpen
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  clientsCount,
  casesCount,
  templatesCount = 0,
  overdueOrTodayCount,
  isLocalMode,
  hasNativeServer
}) {
  const navItems = [
    { id: 'dashboard', label: 'Visão Executiva', mobileLabel: 'Painel', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', mobileLabel: 'Clientes', icon: Users, count: clientsCount },
    { id: 'cases', label: 'Processos', mobileLabel: 'Processos', icon: Briefcase, count: casesCount },
    { id: 'deadlines', label: 'Prazos & Agenda', mobileLabel: 'Prazos', icon: Calendar, urgentCount: overdueOrTodayCount }
  ];

  const acervoItems = [
    { id: 'acervo-clientes', label: 'Dados & Docs Clientes', icon: FileText },
    { id: 'acervo-modelos', label: 'Modelos de Peças', icon: BookOpen, count: templatesCount },
    { id: 'acervo-pastas', label: 'Pastas (Nuvem & PC)', icon: FolderOpen }
  ];

  const statusText = !isLocalMode
    ? 'Nuvem Ativa • Tempo Real'
    : hasNativeServer
    ? 'Servidor Híbrido Ativo'
    : 'Nuvem Ativa • Tempo Real';

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer active:scale-[0.99] ${
          isActive
            ? 'bg-amber-50/90 text-slate-950 font-semibold border border-amber-200/80 shadow-2xs'
            : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-50 border border-transparent'
        }`}
      >
        {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-600" />}

        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
          <span className="truncate">{item.label}</span>
        </div>

        {item.count !== undefined && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
              isActive ? 'bg-white text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {item.count}
          </span>
        )}

        {item.urgentCount > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold shadow-2xs shrink-0">
            {item.urgentCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* TOP HEADER COMPACTO PARA MOBILE */}
      <div className="md:hidden bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 ring-1 ring-amber-400/30 flex items-center justify-center shadow-xs">
            <Scale className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-luxury font-bold text-sm leading-none tracking-wide text-slate-900 truncate">
              SILVIA MAYRA
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Advocacia</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('acervo-modelos')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
            activeTab.startsWith('acervo-')
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'text-slate-700 bg-slate-50 hover:bg-amber-50 border-slate-200'
          }`}
          title="Abrir Acervo e Modelos de Peças"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>Acervo</span>
        </button>
      </div>

      {/* SIDEBAR LUXURY CLARA + SAAS LIMPO (DESKTOP/TABLET) */}
      <aside className="hidden md:flex w-64 bg-white text-slate-700 flex-col shrink-0 border-r border-slate-200/80 sticky top-0 h-screen">
        {/* Identidade */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 ring-1 ring-amber-400/30 flex items-center justify-center shadow-sm shrink-0">
            <Scale className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif-luxury font-bold text-base leading-none tracking-wider text-slate-900 truncate">
              SILVIA MAYRA
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-1 truncate">
              Advocacia
            </p>
          </div>
        </div>

        {/* Navegação */}
        <nav className="p-3.5 space-y-1 overflow-y-auto flex-1">
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Escritório
          </p>

          {navItems.map(renderNavButton)}

          <div className="my-3 border-t border-slate-100" />

          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Acervo
          </p>

          {acervoItems.map(renderNavButton)}
        </nav>

        {/* Card Inferior: Cloud, Agenda & Backup */}
        <div className="p-3.5 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border group cursor-pointer active:scale-[0.99] ${
              activeTab === 'deploy'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50/80 hover:bg-white border-slate-200/80 hover:border-amber-300 text-slate-700'
            }`}
            title="Configurações de Nuvem, Google Agenda e Backups"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeTab === 'deploy'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                  : 'bg-white text-amber-600 border border-slate-200'
              }`}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs font-bold truncate leading-tight ${
                  activeTab === 'deploy' ? 'text-white' : 'text-slate-800'
                }`}
              >
                Cloud, Agenda & Backup
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    !isLocalMode ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span
                  className={`text-[10px] truncate font-medium ${
                    activeTab === 'deploy' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {statusText}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* BOTTOM BAR MOBILE */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-xl"
      >
        {[...navItems, { id: 'deploy', mobileLabel: 'Config', icon: Cloud }].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] transition-all relative cursor-pointer active:scale-95 ${
                isActive ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-lg transition-all ${
                    isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] min-w-4 h-4 px-1 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center border border-white">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}

                {item.urgentCount > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center border border-white">
                    {item.urgentCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 tracking-tight">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
