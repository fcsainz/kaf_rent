// Capa: INFRAESTRUCTURA — adaptador de Google Calendar: un evento de ocupación por reserva (ADR-0010).
// Ningún fallo de Calendar bloquea la operación sobre la reserva: se registra y se sigue (RNF-16).

const obtenerCalendario_ = () => {
  const id = texto_(obtenerConfig_('Calendar_Id', ''));
  if (!id) return CalendarApp.getDefaultCalendar();
  return CalendarApp.getCalendarById(id) ?? suscribirCalendarioOculto_(id);
};

// B-14 (D-26): getCalendarById devuelve null si el calendario compartido no está en la lista del usuario.
// Se le suscribe oculto y sin marcar para no ensuciar su vista de Calendar.
const suscribirCalendarioOculto_ = (id) => {
  try {
    return CalendarApp.subscribeToCalendar(id, { hidden: true, selected: false });
  } catch (error) {
    throw new Error(`Calendar_Id '${id}' sin acceso: ${error.message}. Compártelo con el usuario o corrígelo en Config.`);
  }
};

// Color por posición del espacio en el catálogo (sin nombres de espacio en el código, B-10).
const colorDelEspacio_ = (espacio) => {
  const paleta = [CalendarApp.EventColor.PALE_GREEN, CalendarApp.EventColor.MAUVE, CalendarApp.EventColor.PALE_BLUE,
    CalendarApp.EventColor.YELLOW, CalendarApp.EventColor.ORANGE, CalendarApp.EventColor.CYAN];
  const posicion = nombresEspacios_({ soloActivos: false }).indexOf(espacio);
  return posicion >= 0 ? paleta[posicion % paleta.length] : null;
};

// Devuelve el ID del evento creado, o '' si no se pudo. Los invitados reciben la invitación de Calendar (F-13).
const crearEventoReserva_ = (reserva, invitados = []) => {
  try {
    const evento = obtenerCalendario_().createEvent(tituloEventoReserva_(reserva), reserva.inicio, reserva.fin, {
      description: `Canal: ${reserva.canal}\nReserva ${referenciaMostrada_(reserva.id)}`,
      guests: invitados.join(','),
      sendInvites: invitados.length > 0,
    });
    const color = colorDelEspacio_(reserva.espacio);
    if (color) evento.setColor(color);
    return evento.getId();
  } catch (error) {
    registrarError_('crearEventoReserva_', error, { id: reserva.id });
    return '';
  }
};

// B-09: al cambiar el huésped, el título del evento lo refleja.
const actualizarTituloEvento_ = (reserva) => {
  if (!reserva.calendarEventId) return;
  try {
    const evento = obtenerCalendario_().getEventById(reserva.calendarEventId);
    if (evento) evento.setTitle(tituloEventoReserva_(reserva));
  } catch (error) {
    registrarError_('actualizarTituloEvento_', error, { id: reserva.id });
  }
};

// D-28: lleva el evento a las fechas corregidas de la reserva.
const actualizarHorarioEvento_ = (reserva) => {
  if (!reserva.calendarEventId) return;
  try {
    const evento = obtenerCalendario_().getEventById(reserva.calendarEventId);
    if (evento) evento.setTime(reserva.inicio, reserva.fin);
  } catch (error) {
    registrarError_('actualizarHorarioEvento_', error, { id: reserva.id });
  }
};

// DD-04 (F-48): un cierre es un evento gris de día completo; Calendar no incluye el día de fin, de ahí el siguiente.
const crearEventoCierre_ = (cierre, nombreCorto) => {
  try {
    const titulo = `Cerrado · ${nombreCorto} · ${cierre.motivo}`;
    const evento = obtenerCalendario_().createAllDayEvent(titulo, cierre.desde, diaSiguiente_(cierre.hasta));
    evento.setColor(CalendarApp.EventColor.GRAY);
    return evento.getId();
  } catch (error) {
    registrarError_('crearEventoCierre_', error, { id: cierre.id });
    return '';
  }
};

// Sirve para el evento de una reserva y para el de un cierre (DD-04).
const eliminarEventoReserva_ = (eventoId) => {
  if (!eventoId) return;
  try {
    const evento = obtenerCalendario_().getEventById(eventoId);
    if (evento) evento.deleteEvent();
  } catch (error) {
    registrarError_('eliminarEventoReserva_', error, { eventoId });
  }
};

const existeEvento_ = (calendario, eventoId) => {
  if (!eventoId) return false;
  try {
    return Boolean(calendario.getEventById(eventoId));
  } catch (error) {
    return false;
  }
};
