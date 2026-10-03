// Capa: API — endpoints de catálogos para el formulario Crear Reserva (HU-08, HU-09, ADR-0003).

const cargarEspaciosFormulario = () => ejecutarEndpoint_('cargarEspaciosFormulario', {},
  () => ({ success: true, data: obtenerEspacios_().map(conHorasPorDefecto_) }),
  { errorUsuario: 'No se pudieron cargar los espacios.' });

// F-23: los espacios por días llegan con las horas de Config para prerrellenar el formulario.
const conHorasPorDefecto_ = (espacio) =>
  ({ ...espacio, horasPorDefecto: espacio.modoFecha === MODO_FECHA.RANGO_DIAS ? horasPorDefecto_() : null });

const cargarOpcionesEspacio = (espacio) => ejecutarEndpoint_('cargarOpcionesEspacio', { espacio }, () => {
  if (!espacio) return { success: false, error: 'Espacio requerido.' };
  return { success: true, data: { canales: obtenerCanalesActivos_(espacio), servicios: obtenerServiciosActivos_(espacio) } };
}, { errorUsuario: 'No se pudieron cargar las opciones del espacio.' });
