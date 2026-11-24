// Cálculo de urgência e proximidade de prazos jurídicos
export const getDeadlineStatus = (dateStr, timeStr, status) => {
  const isFinished = status === 'Concluído' || status === 'Protocolado' || status === 'Protocolado / Concluído';

  if (isFinished) {
    return { 
      label: 'Protocolado', 
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
      priority: 4, 
      isOverdue: false, 
      isToday: false, 
      isNext7Days: false 
    };
  }
  if (!dateStr) return { 
    label: 'Sem data', 
    color: 'bg-slate-100 text-slate-500 border-slate-200', 
    priority: 3 
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  const diffTime = targetDate.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { 
      label: `Vencido há ${Math.abs(diffDays)} dia(s)`, 
      color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold', 
      dot: 'bg-rose-500',
      priority: 0, 
      isOverdue: true, 
      isToday: false, 
      isNext7Days: false 
    };
  }
  if (diffDays === 0) {
    return { 
      label: `Vence HOJE ${timeStr ? `às ${timeStr}` : ''}`, 
      color: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-2xs', 
      dot: 'bg-amber-500',
      priority: 1, 
      isOverdue: false, 
      isToday: true, 
      isNext7Days: true 
    };
  }
  if (diffDays <= 3) {
    return { 
      label: `Urgente (${diffDays}d)`, 
      color: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold', 
      dot: 'bg-amber-500',
      priority: 2, 
      isOverdue: false, 
      isToday: false, 
      isNext7Days: true 
    };
  }
  if (diffDays <= 7) {
    return { 
      label: `Em ${diffDays} dias`, 
      color: 'bg-slate-100 text-slate-700 border-slate-200', 
      dot: 'bg-slate-400',
      priority: 3, 
      isOverdue: false, 
      isToday: false, 
      isNext7Days: true 
    };
  }
  return { 
    label: new Date(year, month - 1, day).toLocaleDateString('pt-BR'), 
    color: 'bg-slate-50 text-slate-600 border-slate-200', 
    dot: 'bg-slate-400',
    priority: 3, 
    isOverdue: false, 
    isToday: false, 
    isNext7Days: false 
  };
};

export const formatTimeDisplay = (timeStr, allDay) => {
  if (allDay) return 'Dia Inteiro';
  if (!timeStr) return '';
  return timeStr;
};
