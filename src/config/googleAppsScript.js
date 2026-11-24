/**
 * Código otimizado para o Google Apps Script (script.google.com)
 * Cria eventos com alertas automáticos de 48h (e-mail) e 2h (pop-up) antes do prazo fatal.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var cal = CalendarApp.getDefaultCalendar();
  var opts = { description: data.description, location: data.location };
  var event;
  
  if (data.allDay) {
    event = cal.createAllDayEvent(data.title, new Date(data.startDate + "T12:00:00"), opts);
  } else {
    event = cal.createEvent(data.title, new Date(data.startDateTime), new Date(data.endDateTime), opts);
  }
  
  // Alertas inteligentes: E-mail 48 horas antes (para minutar) e Alerta 2 horas antes (para protocolar)
  try {
    event.addEmailReminder(2880);
    event.addPopupReminder(120);
  } catch (err) {}
  
  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
