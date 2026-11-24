import React from 'react';
import { Users, Briefcase, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function StatCards({ stats, clientsTotal, onNavigate }) {
  const cards = [
    {
      tab: 'clients',
      label: 'Clientes Ativos',
      value: stats.activeClients,
      subtext: `de ${clientsTotal} cadastrados`,
      icon: Users,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-slate-50 border-slate-200 group-hover:border-amber-300 group-hover:bg-amber-50/70',
      isUrgent: false
    },
    {
      tab: 'cases',
      label: 'Processos Ativos',
      value: stats.activeCases,
      subtext: 'autos monitorados',
      icon: Briefcase,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-slate-50 border-slate-200 group-hover:border-amber-300 group-hover:bg-amber-50/70',
      isUrgent: false
    },
    {
      tab: 'deadlines',
      label: 'Próximos 7 Dias',
      value: stats.next7Days,
      subtext: 'compromissos na semana',
      icon: Clock,
      iconColor: 'text-amber-600',
      badgeBg: 'bg-slate-50 border-slate-200 group-hover:border-amber-300 group-hover:bg-amber-50/70',
      isUrgent: false
    },
    {
      tab: 'deadlines',
      label: 'Vencidos / Vence Hoje',
      value: stats.overdueOrToday,
      subtext: stats.overdueOrToday > 0 ? 'atenção imediata' : 'agenda em dia',
      icon: AlertTriangle,
      iconColor: stats.overdueOrToday > 0 ? 'text-rose-600' : 'text-emerald-600',
      badgeBg: stats.overdueOrToday > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200',
      isUrgent: stats.overdueOrToday > 0
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;

        return (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onNavigate(card.tab)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigate(card.tab);
            }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer group select-none ${
              card.isUrgent
                ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-2xs'
                : 'bg-white border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  card.isUrgent ? 'text-rose-700' : 'text-slate-500 group-hover:text-slate-800'
                }`}
              >
                {card.label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${card.badgeBg}`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-extrabold tracking-tight ${
                    card.isUrgent ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {card.value}
                </span>
                <span
                  className={`text-xs ${
                    card.isUrgent ? 'text-rose-700 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {card.subtext}
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
