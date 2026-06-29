// Estadísticas por zona, precalculadas a diario y leídas de Estadisticas_Cache. Ver ADR-0009.

const ZONAS_ESTADISTICAS = ['Todos', 'Piscina / Jardín', 'Habitación Interior'];

// Recalcula los agregados del año natural en curso y sobrescribe el cache. Lo invoca el trigger nocturno.
const recalcularEstadisticas = () => {
  const anyo = new Date().getFullYear();
  const reservas = obtenerFilas(obtenerHoja(HOJA_RESERVAS)).filter((fila) =>
    String(fila[COL_RES_ESTADO]).trim() !== ESTADO_RESERVA_CANCELADA &&
    aFecha(fila[COL_RES_INICIO]).getFullYear() === anyo);

  const ahora = new Date();
  const datos = ZONAS_ESTADISTICAS.map((zona) => {
    const subset = zona === 'Todos' ? reservas : reservas.filter((f) => String(f[COL_RES_ESPACIO]).trim() === zona);
    const netos = subset.reduce((suma, f) => suma + (Number(f[COL_RES_NETO]) || 0), 0);
    return [zona, subset.length, netos, ahora];
  });

  const hoja = obtenerHoja(HOJA_ESTADISTICAS_CACHE);
  if (hoja.getLastRow() > 1) hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).clearContent();
  hoja.getRange(2, 1, datos.length, 4).setValues(datos);
};

// Endpoint: lee el cache para la pantalla de Estadísticas (US-024).
const cargarEstadisticas = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const tz = obtenerSpreadsheet().getSpreadsheetTimeZone();
    const data = obtenerFilas(obtenerHoja(HOJA_ESTADISTICAS_CACHE)).map((fila) => ({
      zona: String(fila[0]),
      totalReservas: Number(fila[1]) || 0,
      ingresosNetos: Number(fila[2]) || 0,
      actualizado: fila[3] ? Utilities.formatDate(aFecha(fila[3]), tz, 'dd/MM/yyyy HH:mm') : '—',
    }));
    return { success: true, data };
  } catch (error) {
    registrarError('cargarEstadisticas', error, {});
    return { success: false, error: 'No se pudieron cargar las estadísticas.' };
  }
};
