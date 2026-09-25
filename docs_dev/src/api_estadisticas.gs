// Capa: API — Estadísticas por zona leídas del cache diario (HU-31, ADR-0009), enlace al calendario (HU-07)
// y cálculo de las estadísticas (lo usan el trigger nocturno y el botón "Recalcular ahora").

const recalcularEstadisticas_ = (ahora) => {
  const reservas = leerReservas_().entradas.map((e) => e.reserva);
  guardarEstadisticas_(agregadosEstadisticas_(reservas, nombresEspacios_(), ahora.getFullYear(), ahora));
};

const cargarEstadisticas = () => ejecutarEndpoint_('cargarEstadisticas', {}, () => ({
  success: true,
  data: leerEstadisticas_().map((z) => ({ ...z, actualizado: z.actualizado ? formatearFechaHora_(z.actualizado) : '—' })),
}), { errorUsuario: 'No se pudieron cargar las estadísticas.' });

// Botón "Recalcular ahora" de la sección Estadísticas.
const recalcularEstadisticas = () => ejecutarEndpoint_('recalcularEstadisticas', {}, () => {
  recalcularEstadisticas_(new Date());
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudieron recalcular las estadísticas.' });

// Enlace al calendario de ocupación para el Inicio (ADR-0010: enlazar, no embeber).
const obtenerEnlaceCalendario = () => ejecutarEndpoint_('obtenerEnlaceCalendario', {},
  () => ({ success: true, url: String(obtenerConfig_('Calendar_Url', '')) }),
  { errorUsuario: 'No se pudo obtener el enlace del calendario.' });
