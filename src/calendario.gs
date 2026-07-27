// Sincronización con Google Calendar: un evento de ocupación por reserva. Ver ADR-0010.
// Calendario único de la cuenta operativa (Config 'Calendar_Id'; vacío = calendario por defecto), color por espacio.

const COLOR_POR_ESPACIO = {
  'Piscina / Jardín': CalendarApp.EventColor.PALE_GREEN,
  'Habitación Interior': CalendarApp.EventColor.MAUVE,
};

const obtenerCalendario = () => {
  const id = String(obtenerConfig('Calendar_Id', '')).trim();
  const cal = id ? CalendarApp.getCalendarById(id) : CalendarApp.getDefaultCalendar();
  if (!cal) throw new Error(`Calendar_Id '${id}' no encontrado o sin acceso. Corrígelo en Config.`);
  return cal;
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

// Endpoint: crea en el calendario los eventos que falten en reservas no canceladas.
// Útil para sincronizar reservas históricas o registradas antes de que el Calendar_Event_Id funcionara.
// Devuelve { success, creados, omitidos } — no toca reservas canceladas ni las que ya tienen evento válido.
const sincronizarReservasCalendario = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };

    const hoja = obtenerHoja(HOJA_RESERVAS);
    const filas = hoja.getDataRange().getValues().slice(1); // omitir cabecera
    const cal = obtenerCalendario();

    let creados = 0;
    let omitidos = 0;

    filas.forEach((fila, indice) => {
      if (String(fila[COL_RES_ESTADO]).trim() === ESTADO_RESERVA_CANCELADA) { omitidos++; return; }

      const eventoIdExistente = String(fila[COL_RES_CALENDAR_EVENT] || '').trim();
      if (eventoIdExistente) {
        try {
          if (cal.getEventById(eventoIdExistente)) { omitidos++; return; }
        } catch (_) {}
      }

      const id = String(fila[COL_RES_ID]).trim();
      if (!id) { omitidos++; return; }

      const reservaMini = {
        espacio: String(fila[COL_RES_ESPACIO]).trim(),
        canal: String(fila[COL_RES_CANAL]).trim(),
        inicio: aFecha(fila[COL_RES_INICIO]),
        fin: aFecha(fila[COL_RES_FIN]),
        nombre: String(fila[COL_RES_NOMBRE]).trim(),
      };

      const nuevoId = crearEventoReserva(reservaMini, id);
      if (nuevoId) {
        hoja.getRange(indice + 2, COL_RES_CALENDAR_EVENT + 1).setValue(nuevoId);
        creados++;
      } else {
        omitidos++;
      }
    });

    return { success: true, creados, omitidos };
  } catch (error) {
    registrarError('sincronizarReservasCalendario', error, {});
    return { success: false, error: 'Error al sincronizar el calendario.' };
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
