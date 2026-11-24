// Padroniza título do evento jurídico: [AUDIÊNCIA] ou [PRAZO FATAL] + Cliente + Ação
export const buildStandardEventTitle = (item) => {
  const typeTag = (item.type || 'PRAZO').toUpperCase();
  const clientPart = item.clientName ? `${item.clientName} - ` : '';
  return `[${typeTag}] ${clientPart}${item.title || 'Compromisso Jurídico'}`;
};

// Constrói descrição detalhada do evento com Processo CNJ, Vara, Responsável, Minuta e Links
export const buildStandardEventDescription = (item, linkedCase) => {
  const lines = [
    `📌 COMPROMISSO JURÍDICO — LEXFLOW CRM`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `• Tipo: ${item.type || 'Prazo'}`,
    `• Prioridade: ${item.priorityLevel || 'Alta'}`,
    `• Estágio da Delegação: ${item.kanbanStage || 'Triagem / A Fazer'}`,
    `• Cliente: ${item.clientName || linkedCase?.clientName || 'Não vinculado'}`,
    `• Processo CNJ: ${item.caseCnj || linkedCase?.cnjNumber || 'Não vinculado'}`,
    `• Juízo / Vara: ${linkedCase?.court || item.location || 'Não informado'}`,
    `• Responsável: ${item.responsible || linkedCase?.responsible || 'Equipe'}`,
  ];
  if (item.location) lines.push(`• Local / Sala Virtual: ${item.location}`);
  if (item.minutaUrl) lines.push(`• 📄 Minuta em Elaboração (Docs/Drive): ${item.minutaUrl}`);
  if (item.protocolCode) lines.push(`• 🏛️ Comprovante de Protocolo: ${item.protocolCode}`);
  if (linkedCase?.courtUrl) lines.push(`• Link do Tribunal: ${linkedCase.courtUrl}`);
  if (linkedCase?.driveUrl) lines.push(`• Pasta de Autos (Drive): ${linkedCase.driveUrl}`);
  if (item.notes) {
    lines.push(`\n📝 OBSERVAÇÕES / INSTRUÇÕES:\n${item.notes}`);
  }
  return lines.join('\n');
};

// Gera URL Oficial do Google Agenda (1-Clique)
export const generateGoogleCalendarUrl = (item, linkedCase) => {
  const title = buildStandardEventTitle(item);
  const details = buildStandardEventDescription(item, linkedCase);
  const location = item.location || linkedCase?.court || '';

  const rawDate = (item.dueDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  let datesParam = '';

  if (item.allDay) {
    const [y, m, d] = (item.dueDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const nextDay = new Date(y, m - 1, d + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
    datesParam = `${rawDate}/${nextDayStr}`;
  } else {
    const startT = (item.dueTime || '14:00').replace(':', '') + '00';
    const endT = (item.endTime || '15:00').replace(':', '') + '00';
    datesParam = `${rawDate}T${startT}/${rawDate}T${endT}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details,
    location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Faz o download de um arquivo .ICS compatível com Google Calendar, Outlook e Apple Calendar (com alarmes 48h e 2h)
export const downloadICSFile = (item, linkedCase) => {
  const title = buildStandardEventTitle(item);
  const description = buildStandardEventDescription(item, linkedCase).replace(/\n/g, '\\n');
  const location = (item.location || linkedCase?.court || '').replace(/\n/g, ' ');
  const rawDate = (item.dueDate || new Date().toISOString().split('T')[0]).replace(/-/g, '');

  let dtStart = '';
  let dtEnd = '';

  if (item.allDay) {
    const [y, m, d] = (item.dueDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const nextDay = new Date(y, m - 1, d + 1).toISOString().split('T')[0].replace(/-/g, '');
    dtStart = `DTSTART;VALUE=DATE:${rawDate}`;
    dtEnd = `DTEND;VALUE=DATE:${nextDay}`;
  } else {
    const startT = (item.dueTime || '14:00').replace(':', '') + '00';
    const endT = (item.endTime || '15:00').replace(':', '') + '00';
    dtStart = `DTSTART:${rawDate}T${startT}`;
    dtEnd = `DTEND:${rawDate}T${endT}`;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LexFlow CRM Juridico//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:lexflow-${item.id || Date.now()}@lexflow.local`,
    `SUMMARY:${title}`,
    dtStart,
    dtEnd,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    // Alarme 1: 48 horas antes (E-mail / Display)
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete: Prazo em 48 horas para elaborar minuta',
    'TRIGGER:-P2D',
    'END:VALARM',
    // Alarme 2: 2 horas antes (Alerta Fatal de Protocolo)
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:ALERTA FATAL: Prazo encerra em 2 horas!',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (item.title || 'prazo').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 35);
  link.setAttribute('download', `${safeName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Dispara evento silenciosamente para o Webhook do Google Apps Script (modo no-cors)
export const triggerGoogleCalendarWebhook = async (deadlinePayload, linkedCase, customUrl) => {
  const targetUrl = customUrl?.trim();
  if (!targetUrl) return false;

  const title = buildStandardEventTitle(deadlinePayload);
  const description = buildStandardEventDescription(deadlinePayload, linkedCase);
  const startDate = deadlinePayload.dueDate || new Date().toISOString().split('T')[0];
  const startTime = deadlinePayload.dueTime || '14:00';
  const endTime = deadlinePayload.endTime || '15:00';

  const webhookBody = {
    title,
    description,
    location: deadlinePayload.location || linkedCase?.court || '',
    allDay: Boolean(deadlinePayload.allDay),
    startDate,
    startDateTime: `${startDate}T${startTime}:00`,
    endDateTime: `${startDate}T${endTime}:00`,
    minutaUrl: deadlinePayload.minutaUrl || '',
    protocolCode: deadlinePayload.protocolCode || '',
    kanbanStage: deadlinePayload.kanbanStage || 'Triagem / A Fazer'
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(webhookBody)
    });
    return true;
  } catch (err) {
    console.error('Erro ao acionar Webhook Google Agenda:', err);
    return false;
  }
};
