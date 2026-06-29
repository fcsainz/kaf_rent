// Sincronización con Google Calendar: un evento de ocupación por reserva. Ver ADR-0010.
// Calendario único de la cuenta operativa (Config 'Calendar_Id'; vacío = calendario por defecto), color por espacio.

const COLOR_POR_ESPACIO = {
  'Piscina / Jardín': CalendarApp.EventColor.PALE_GREEN,
  'Habitación Interior': CalendarApp.EventColor.MAUVE,
};

const obtenerCalendario = () => {
  const id = String(obtenerConfig('Calendar_Id', '')).trim();
  return id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
};

// Crea el evento de ocupación y devuelve su ID; '' si no se pudo crear (ADR-0010: la reserva no se bloquea por esto).
const crearEventoReserva = (reserva, id) => {
  try {
    const titulo = `${referenciaMostrada(id)} · ${reserva.espacio} — ${reserva.nombre}`;
    const evento = obtenerCalendario().createEvent(titulo, reserva.inicio, reserva.fin, {
      description: `Canal: ${reserva.canal}\nReserva ${referenciaMostrada(id)}`,
    });
    const color = COLOR_POR_ESPACIO[reserva.espacio];
    if (color) evento.setColor(color);
    return evento.getId();
  } catch (error) {
    registrarError('crearEventoReserva', error, { id });
    return '';
  }
};

const eliminarEventoReserva = (eventoId) => {
  if (!eventoId) return;
  try {
    const evento = obtenerCalendario().getEventById(eventoId);
    if (evento) evento.deleteEvent();
  } catch (error) {
    registrarError('eliminarEventoReserva', error, { eventoId });
  }
};

// Endpoint: enlace al calendario de ocupación para el Inicio (ADR-0010: enlazar, no embeber).
const obtenerEnlaceCalendario = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    return { success: true, url: String(obtenerConfig('Calendar_Url', '')) };
  } catch (error) {
    registrarError('obtenerEnlaceCalendario', error, {});
    return { success: false, error: 'No se pudo obtener el enlace del calendario.' };
  }
};
