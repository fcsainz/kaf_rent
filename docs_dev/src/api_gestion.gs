// Capa: API — Gestionar Reserva: lista, ficha, edición auditada, servicios, cancelación e historial (HU-21..HU-27).

const MENSAJE_NO_ENCONTRADA = 'No se encontró la reserva.';
const MENSAJE_CANCELADA = 'Las reservas canceladas no se pueden modificar.';

// Localiza la reserva y comprueba que se puede modificar; devuelve { lectura, entrada } o { error }.
const reservaModificable_ = (id) => {
  const lectura = leerReservas_();
  const entrada = buscarReserva_(lectura, id);
  if (!entrada) return { error: MENSAJE_NO_ENCONTRADA };
  if (!esModificable_(entrada.reserva)) return { error: MENSAJE_CANCELADA };
  return { lectura, entrada };
};

const proyeccionGestion_ = (r) => ({
  id: r.id, ref: referenciaMostrada_(r.id), estado: r.estado, canal: r.canal,
  inicioTexto: formatearFechaHora_(r.inicio), finTexto: formatearFechaHora_(r.fin),
  adultos: r.adultos, menores: r.menores, checkin: r.checkin, checkout: r.checkout, nombre: r.nombre, cobro: r.cobro,
});

const fechaOpcional_ = (fecha) => (esFechaValida_(fecha) ? formatearFechaHora_(fecha) : '');

const proyeccionFicha_ = (r) => ({
  id: r.id, ref: referenciaMostrada_(r.id), espacio: r.espacio, canal: r.canal,
  inicioTexto: formatearFechaHora_(r.inicio), finTexto: formatearFechaHora_(r.fin),
  serviciosExtra: r.serviciosExtra, registroViajeros: r.registroViajeros,
  nombre: r.nombre, telefono: r.telefono, email: r.email, adultos: r.adultos, menores: r.menores,
  importeAlquiler: r.importeAlquiler, comisionPct: r.comisionPct, bruto: r.bruto, comisionImporte: r.comision,
  serviciosCoste: r.serviciosCoste, margen: r.margenServicios, neto: r.neto,
  registradoPor: r.registradoPor, fechaRegistro: fechaOpcional_(r.fechaRegistro),
  modificadoPor: r.modificadoPor, fechaModificacion: fechaOpcional_(r.fechaModificacion),
  cobro: r.cobro, contratoEstado: r.contratoEstado, contratoArchivo: r.contratoArchivo,
  incidencias: r.incidencias, incidenteComunicado: r.incidenteComunicado, compensacion: r.compensacion,
  incidenciaResuelta: r.incidenciaResuelta, estado: r.estado, checkin: r.checkin, checkout: r.checkout, notas: r.notas,
  videoInUrl: r.videoInUrl, videoOutUrl: r.videoOutUrl,
  pendientes: motivosPendientes_(r),
});

// Todas las no canceladas, con filtros opcionales por nombre y rango (RF-42, RF-43).
const listarReservasActivas = (filtro) => ejecutarEndpoint_('listarReservasActivas', {}, () => {
  const criterio = {
    nombre: texto_(filtro && filtro.nombre).toLowerCase(),
    desde: filtro && filtro.desde ? combinarFechaHora_(filtro.desde, '00:00').getTime() : null,
    hasta: filtro && filtro.hasta ? combinarFechaHora_(filtro.hasta, '23:59').getTime() : null,
  };
  const reservas = leerReservas_().entradas
    .map((e) => e.reserva)
    .filter((r) => esModificable_(r) && coincideFiltroGestion_(r, criterio))
    .map(proyeccionGestion_);
  return { success: true, data: reservas };
}, { errorUsuario: 'No se pudieron cargar las reservas.' });

const obtenerReserva = (id) => ejecutarEndpoint_('obtenerReserva', { id }, () => {
  const entrada = buscarReserva_(leerReservas_(), id);
  return entrada ? { success: true, data: proyeccionFicha_(entrada.reserva) } : { success: false, error: MENSAJE_NO_ENCONTRADA };
}, { errorUsuario: 'No se pudo cargar la reserva.' });

// Guarda la edición, recalcula importes y estado y audita campo a campo (RF-45..RF-50).
const actualizarReserva = (id, cambios) => ejecutarEndpoint_('actualizarReserva', { id }, () => {
  const validacion = validarCambiosReserva_(cambios);
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };

  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const { reserva, diffs } = aplicarCambios_(entrada.reserva, cambios, email, ahora);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(id, diffs, email, ahora);
  if (reserva.nombre !== entrada.reserva.nombre) actualizarTituloEvento_(reserva);
  return { success: true, estado: reserva.estado };
}, { bloqueo: true, errorUsuario: 'No se pudieron guardar los cambios.' });

const cargarServiciosReserva = (id) => ejecutarEndpoint_('cargarServiciosReserva', { id }, () => {
  const entrada = buscarReserva_(leerReservas_(), id);
  if (!entrada) return { success: false, error: MENSAJE_NO_ENCONTRADA };
  const actuales = leerLineasServicio_(entrada.reserva.id).map((l) => ({ nombre: l.nombre, cantidad: l.cantidad }));
  return { success: true, data: { catalogo: obtenerServiciosActivos_(entrada.reserva.espacio), actuales } };
}, { errorUsuario: 'No se pudieron cargar los servicios.' });

// Sustituye los servicios de una reserva existente; la comisión no se recalcula (RF-49).
const actualizarServiciosReserva = (id, servicios) => ejecutarEndpoint_('actualizarServiciosReserva', { id }, () => {
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  const lineas = resolverLineasServicio_(Array.isArray(servicios) ? servicios : [], obtenerServiciosActivos_(entrada.reserva.espacio));
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const { reserva, diffs } = aplicarServicios_(entrada.reserva, lineas, email, ahora);
  reemplazarLineasServicio_(reserva.id, lineas);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(id, diffs, email, ahora);
  return {
    success: true,
    data: { bruto: reserva.bruto, serviciosPrecio: reserva.serviciosPrecio, serviciosCoste: reserva.serviciosCoste, margen: reserva.margenServicios, neto: reserva.neto, resumen: reserva.serviciosExtra },
  };
}, { bloqueo: true, errorUsuario: 'No se pudieron actualizar los servicios.' });

// Única transición manual del estado: audita, borra el evento y avisa de reabrir canales (RF-52, RF-38, RF-39).
const cancelarReserva = (id) => ejecutarEndpoint_('cancelarReserva', { id }, () => {
  const lectura = leerReservas_();
  const entrada = buscarReserva_(lectura, id);
  if (!entrada) return { success: false, error: MENSAJE_NO_ENCONTRADA };
  if (!esModificable_(entrada.reserva)) return { success: false, error: 'La reserva ya está cancelada.' };
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const { reserva, diffs } = cancelar_(entrada.reserva, email, ahora);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(id, diffs, email, ahora);
  eliminarEventoReserva_(reserva.calendarEventId);
  notificarReaperturaCanales_(reserva);
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudo cancelar la reserva.' });

// Historial de más reciente a más antiguo (RF-53).
const obtenerHistorial = (id) => ejecutarEndpoint_('obtenerHistorial', { id }, () => {
  const cambios = leerHistorial_(texto_(id))
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .map((h) => ({ fecha: formatearFechaHora_(h.fecha), usuario: h.usuario, campo: h.campo, anterior: h.anterior, nuevo: h.nuevo }));
  return { success: true, data: cambios };
}, { errorUsuario: 'No se pudo cargar el historial.' });
