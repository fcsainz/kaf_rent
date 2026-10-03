// Capa: API — Gestionar Reservas (DD-03): listado filtrado y paginado, ficha, edición auditada, cobro,
// cancelación y funciones de la barra de Reservas (HU-21..HU-27, F-34..F-43).

const MENSAJE_NO_ENCONTRADA = 'No se encontró la reserva.';
const MENSAJE_CANCELADA = 'Las reservas canceladas no se pueden modificar.';
const RESERVAS_POR_PAGINA = 5;
const NUM_OPCIONES_FUNCION = 5;

// Localiza la reserva y comprueba que se puede modificar; devuelve { lectura, entrada } o { error }.
const reservaModificable_ = (id) => {
  const lectura = leerReservas_();
  const entrada = buscarReserva_(lectura, id);
  if (!entrada) return { error: MENSAJE_NO_ENCONTRADA };
  if (!esModificable_(entrada.reserva)) return { error: MENSAJE_CANCELADA };
  return { lectura, entrada };
};

const nombresCortosEspacios_ = () => new Map(obtenerEspacios_({ soloActivos: false }).map((e) => [e.nombre, e.nombreCorto]));

// Tarjeta del listado (F-36): sin scroll lateral, solo lo que se ve de un vistazo.
const proyeccionTarjeta_ = (nombresCortos) => (r) => ({
  id: r.id, ref: referenciaMostrada_(r.id), nombre: r.nombre, espacio: nombresCortos.get(r.espacio) || r.espacio,
  estado: r.estado, cobro: r.cobro, inicioTexto: formatearFechaHoraCorta_(r.inicio), finTexto: formatearFechaHoraCorta_(r.fin),
});

const fechaOpcional_ = (fecha) => (esFechaValida_(fecha) ? formatearFechaHora_(fecha) : '');

const proyeccionFicha_ = (r) => ({
  id: r.id, ref: referenciaMostrada_(r.id), espacio: r.espacio, canal: r.canal, refCanal: r.refCanal,
  inicioTexto: formatearFechaHora_(r.inicio), finTexto: formatearFechaHora_(r.fin),
  serviciosExtra: r.serviciosExtra, registroViajeros: r.registroViajeros,
  nombre: r.nombre, telefono: r.telefono, email: r.email, adultos: r.adultos, menores: r.menores, totalPersonas: totalPersonas_(r),
  importeAlquiler: r.importeAlquiler, comisionPct: r.comisionPct, bruto: r.bruto, comisionImporte: r.comision,
  serviciosCoste: r.serviciosCoste, margen: r.margenServicios, neto: r.neto,
  registradoPor: r.registradoPor, fechaRegistro: fechaOpcional_(r.fechaRegistro),
  modificadoPor: r.modificadoPor, fechaModificacion: fechaOpcional_(r.fechaModificacion),
  cobro: r.cobro, contratoEstado: r.contratoEstado, contratoArchivo: r.contratoArchivo,
  contratoFirmadoPor: r.contratoFirmadoPor, contratoFecha: fechaOpcional_(r.contratoFecha),
  incidencias: r.incidencias, incidenteComunicado: r.incidenteComunicado, compensacion: r.compensacion,
  incidenciaResuelta: r.incidenciaResuelta, estado: r.estado, checkin: r.checkin, checkout: r.checkout, notas: r.notas,
  videoInUrl: r.videoInUrl, videoOutUrl: r.videoOutUrl,
  pendientes: motivosPendientes_(r),
});

// Filtro recibido del cliente, revalidado: valores fuera de su lista se rechazan (CLAUDE.md §4.8).
const criterioGestion_ = (filtro, ahora) => {
  const f = filtro || {};
  const estado = texto_(f.estado);
  const cobro = texto_(f.cobro);
  const espacio = texto_(f.espacio);
  if (estado && !Object.values(ESTADO_RESERVA).includes(estado)) return invalido_('Estado de reserva no válido.');
  if (cobro && !Object.values(COBRO).includes(cobro)) return invalido_('Estado de cobro no válido.');
  if (espacio && !nombresEspacios_({ soloActivos: false }).includes(espacio)) return invalido_('Espacio no válido.');
  return { valido: true, criterio: { nombre: texto_(f.nombre).toLowerCase(), espacio, estado, cobro, ...rangoRapido_(texto_(f.rango), ahora) } };
};

// F-34/F-36: filtra, ordena (Q-16) y devuelve la página pedida, de 5 en 5.
const listarReservasGestion = (filtro) => ejecutarEndpoint_('listarReservasGestion', {}, () => {
  const ahora = new Date();
  const lectura = criterioGestion_(filtro, ahora);
  if (!lectura.valido) return { success: false, error: lectura.error };
  const coinciden = leerReservas_().entradas.map((e) => e.reserva).filter((r) => coincideFiltroGestion_(r, lectura.criterio));
  const pagina = paginar_(ordenarParaGestion_(coinciden, ahora), filtro && filtro.pagina, RESERVAS_POR_PAGINA);
  return { success: true, data: { ...pagina, elementos: pagina.elementos.map(proyeccionTarjeta_(nombresCortosEspacios_())) } };
}, { errorUsuario: 'No se pudieron cargar las reservas.' });

// RF-88: el catálogo dice si el canal exige el código; la regla vive en el dominio.
const refCanalObligatoria_ = (reserva) => {
  const canal = obtenerCanalesActivos_(reserva.espacio).find((c) => c.nombre === reserva.canal);
  return refCanalObligatoriaAlEditar_(canal && canal.requiereRef, reserva.refCanal);
};

const validarRefCanalEditada_ = (reserva, refCanal) => {
  if (refCanal === undefined) return { valido: true };
  return validarRefCanal_(refCanal, reserva.canal, refCanalObligatoria_(reserva));
};

const esReservaInterior_ = (reserva) => espaciosConRegistroViajeros_().includes(reserva.espacio);

// Checklist de la ficha (F-42): hecho o pendiente, con quién guardó la lista y cuándo.
const checklistsDeFicha_ = (reserva) => {
  const autoria = leerAutoriaChecklists_(reserva.id);
  const de = (momento, campo) => {
    const a = autoria[momento];
    return { estado: reserva[campo], usuario: a ? a.usuario : '', fecha: a && esFechaValida_(a.fecha) ? formatearFechaHora_(a.fecha) : '' };
  };
  return { checkin: de(MOMENTO_CHECKLIST.CHECKIN, 'checkin'), checkout: de(MOMENTO_CHECKLIST.CHECKOUT, 'checkout') };
};

// D-45: respuestas del Form de la reserva; null si el Form no se puede leer (la ficha lo dice, sin fallar).
const respuestasFormDeReserva_ = (reserva) => {
  try {
    return casarRespuestasConReserva_(leerRespuestasFormViajeros_(), codigosDeReserva_(reserva));
  } catch (error) {
    registrarError_('respuestasFormDeReserva_', error, { id: reserva.id });
    return null;
  }
};

// Documentación de Interior (F-42): identidades validadas en persona y parte comunicado a SES, por la app o a mano
// (D-45: lo manual solo consta en el Form).
const identidadesDeFicha_ = (reserva) => {
  const validados = leerValidacionesReserva_(reserva.id).length;
  const { parte } = estadoSESDeReserva_(comunicacionesDeReserva_(reserva.id).entradas.map((e) => e.comunicacion));
  const porApp = Boolean(parte && parte.estado === ESTADO_COMUNICACION_SES.COMUNICADA);
  const respuestas = respuestasFormDeReserva_(reserva);
  const manual = respuestas ? parteComunicadoEnForm_(respuestas) : { comunicado: false, codigo: '' };
  return {
    validados, personas: totalPersonas_(reserva), completa: validados >= totalPersonas_(reserva),
    sesComunicado: porApp || manual.comunicado, sesManual: !porApp && manual.comunicado,
    sesCodigo: porApp ? parte.codigo : manual.codigo, sesEstado: parte ? parte.estado : '', formNoDisponible: respuestas === null,
  };
};

const historialDe_ = (id) => leerHistorial_(texto_(id))
  .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  .map((h) => ({ fecha: formatearFechaHora_(h.fecha), usuario: h.usuario, campo: h.campo, anterior: h.anterior, nuevo: h.nuevo }));

// F-42: todo lo que muestra la ficha, en una sola llamada (menos esperas en el móvil).
const obtenerFichaReserva = (id) => ejecutarEndpoint_('obtenerFichaReserva', { id }, () => {
  const entrada = buscarReserva_(leerReservas_(), id);
  if (!entrada) return { success: false, error: MENSAJE_NO_ENCONTRADA };
  const r = entrada.reserva;
  const interior = esReservaInterior_(r);
  return {
    success: true,
    data: {
      ...proyeccionFicha_(r), esInterior: interior, modificable: esModificable_(r),
      // B-21: el cliente valida el código en el momento; el servidor lo revalida al guardar. ADR-0022: aviso de SES al cancelar.
      refCanalObligatoria: refCanalObligatoria_(r), avisoCancelacionSES: avisoCancelacionSESDe_(r.id),
      servicios: { catalogo: obtenerServiciosActivos_(r.espacio), lineas: leerLineasServicio_(r.id) },
      checklists: checklistsDeFicha_(r),
      identidades: interior ? identidadesDeFicha_(r) : null,
      historial: historialDe_(r.id),
    },
  };
}, { errorUsuario: 'No se pudo cargar la reserva.' });

// Con `servicios`, sustituye también las líneas; la comisión no se recalcula por ellos (RF-49).
const aplicarServiciosEditados_ = (editada, servicios, email, ahora) => {
  if (!Array.isArray(servicios)) return { ...editada, lineas: null };
  const previas = leerLineasServicio_(editada.reserva.id);
  const lineas = resolverLineasServicio_(servicios, obtenerServiciosActivos_(editada.reserva.espacio), previas);
  const conServicios = aplicarServicios_(editada.reserva, lineas, email, ahora, previas);
  return { reserva: conServicios.reserva, diffs: [...editada.diffs, ...conServicios.diffs], lineas };
};

// F-44: un único "Guardar cambios" para datos y servicios. Recalcula importes y estado y audita (RF-45..RF-50).
const actualizarReserva = (id, cambios) => ejecutarEndpoint_('actualizarReserva', { id }, () => {
  const validacion = validarCambiosReserva_(cambios);
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  const refValida = validarRefCanalEditada_(entrada.reserva, cambios.refCanal);
  if (!refValida.valido) return { success: false, error: refValida.error };

  const email = obtenerEmailSesion_();
  const ahora = new Date();
  // RF-56: check-in y check-out solo cambian al confirmar su checklist; DI-18: el contrato, solo subiendo su foto.
  const sinRevisiones = { ...cambios, checkin: entrada.reserva.checkin, checkout: entrada.reserva.checkout, contratoEstado: entrada.reserva.contratoEstado };
  const { reserva, diffs, lineas } = aplicarServiciosEditados_(aplicarCambios_(entrada.reserva, sinRevisiones, email, ahora), cambios.servicios, email, ahora);
  if (lineas) reemplazarLineasServicio_(reserva.id, lineas);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(id, diffs, email, ahora);
  if (reserva.nombre !== entrada.reserva.nombre) actualizarTituloEvento_(reserva);
  return { success: true, estado: reserva.estado };
}, { bloqueo: true, errorUsuario: 'No se pudieron guardar los cambios.' });

// F-37: "Sí, se ha ingresado" desde el email (tras confirmar en la app). Repetirlo no cambia nada.
const marcarIngresado = (id) => ejecutarEndpoint_('marcarIngresado', { id }, () => {
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  if (entrada.reserva.cobro === COBRO.INGRESADO) return { success: true, estado: entrada.reserva.estado, yaEstaba: true };
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const { reserva, diffs } = aplicarCambios_(entrada.reserva, { ...entrada.reserva, cobro: COBRO.INGRESADO }, email, ahora);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(reserva.id, diffs, email, ahora);
  return { success: true, estado: reserva.estado };
}, { bloqueo: true, errorUsuario: 'No se pudo marcar como ingresada. Inténtalo de nuevo.' });

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
  anularEnSESAlCancelar_(reserva.id, email, ahora);
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudo cancelar la reserva.' });

// ADR-0022: un fallo al programar la anulación no deshace la cancelación; queda en Errores y se avisa.
const anularEnSESAlCancelar_ = (idReserva, email, ahora) => {
  try {
    programarAnulacionesSES_(idReserva, email, ahora);
  } catch (error) {
    registrarError_('anularEnSESAlCancelar_', error, { id: idReserva });
  }
};

// ---------- Funciones de la barra de Reservas (DD-03 §3.5) ----------

// Reservas con el parte comunicado: por la app (Comunicaciones_SES) o a mano (casilla del Form, D-45).
const partesComunicadosEnForm_ = (reservas) => {
  try {
    const respuestas = leerRespuestasFormViajeros_();
    return reservas.filter((r) => parteComunicadoEnForm_(casarRespuestasConReserva_(respuestas, codigosDeReserva_(r))).comunicado).map((r) => r.id);
  } catch (error) {
    registrarError_('partesComunicadosEnForm_', error, {});
    return [];
  }
};

const partesComunicados_ = (reservas) => new Set([
  ...leerComunicacionesSES_().entradas.map((e) => e.comunicacion)
    .filter((c) => c.tipo === TIPO_COMUNICACION_SES.PARTE && c.estado === ESTADO_COMUNICACION_SES.COMUNICADA)
    .map((c) => c.idReserva),
  ...partesComunicadosEnForm_(reservas.filter(esReservaInterior_)),
]);

const conExtrasPendientes_ = () => new Set([...leerLineasPorReserva_().entries()]
  .filter(([, lineas]) => tieneCobroPendiente_(lineas)).map(([id]) => id));

// Solo se lee lo que necesita cada función (SES y servicios son hojas aparte).
const contextoFuncion_ = (funcion, reservas) => ({
  espaciosInterior: espaciosConRegistroViajeros_(),
  partesComunicados: funcion === FUNCION_RESERVA.IDENTIDADES ? partesComunicados_(reservas) : new Set(),
  conExtrasPendientes: funcion === FUNCION_RESERVA.EXTRAS ? conExtrasPendientes_() : new Set(),
});

// F-38/F-39/F-41/F-43: la reserva propuesta (la más cercana a hoy con trabajo pendiente) y hasta 5 opciones
// filtradas por espacio y nombre, en el orden de Gestionar.
const buscarReservasPara = (funcion, filtro) => ejecutarEndpoint_('buscarReservasPara', { funcion }, () => {
  if (!esFuncionReserva_(funcion)) return { success: false, error: 'Función no válida.' };
  const ahora = new Date();
  const reservas = leerReservas_().entradas.map((e) => e.reserva);
  const contexto = contextoFuncion_(funcion, reservas);
  const candidatas = reservasDeFuncion_(funcion, reservas, contexto);
  const criterio = { nombre: texto_(filtro && filtro.nombre).toLowerCase(), espacio: texto_(filtro && filtro.espacio), estado: '', cobro: '', desde: null, hasta: null };
  const opciones = ordenarParaGestion_(candidatas.filter((r) => coincideFiltroGestion_(r, criterio)), ahora).slice(0, NUM_OPCIONES_FUNCION);
  const propuesta = propuestaDeFuncion_(funcion, candidatas, contexto, ahora);
  const tarjeta = proyeccionTarjeta_(nombresCortosEspacios_());
  return { success: true, data: { propuesta: propuesta ? tarjeta(propuesta) : null, opciones: opciones.map(tarjeta) } };
}, { errorUsuario: 'No se pudieron buscar las reservas.' });

// F-43: servicios de una reserva con su cobro, y el catálogo de su espacio para añadir más.
const cargarServiciosCobro = (id) => ejecutarEndpoint_('cargarServiciosCobro', { id }, () => {
  const entrada = buscarReserva_(leerReservas_(), id);
  if (!entrada) return { success: false, error: MENSAJE_NO_ENCONTRADA };
  const lineas = leerLineasServicio_(entrada.reserva.id).map((l) => ({
    nombre: l.nombre, cantidad: l.cantidad, importe: l.cantidad * l.precio,
    estado: l.cobroEstado || COBRO_SERVICIO.COBRADO, forma: l.cobroForma,
  }));
  return { success: true, data: { lineas, catalogo: obtenerServiciosActivos_(entrada.reserva.espacio) } };
}, { errorUsuario: 'No se pudieron cargar los servicios.' });

// Sustituye las líneas de una reserva, recalcula importes sin tocar la comisión (RF-49) y lo audita.
const guardarLineasCobro_ = (lectura, entrada, previas, lineas) => {
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const { reserva, diffs } = aplicarServicios_(entrada.reserva, lineas, email, ahora, previas);
  reemplazarLineasServicio_(reserva.id, lineas);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(reserva.id, diffs, email, ahora);
};

// F-43: marca un servicio como cobrado (vía plataforma o presencial) o lo quita si el cliente lo rechazó.
const registrarCobroServicio = (id, nombre, accion, forma) => ejecutarEndpoint_('registrarCobroServicio', { id, accion }, () => {
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  const previas = leerLineasServicio_(entrada.reserva.id);
  const resultado = aplicarCobroServicio_(previas, texto_(nombre), texto_(accion), texto_(forma));
  if (!resultado.valido) return { success: false, error: resultado.error };
  guardarLineasCobro_(lectura, entrada, previas, resultado.lineas);
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudo registrar el cobro. Inténtalo de nuevo.' });

// F-43: añade un servicio del catálogo del espacio (queda Pendiente de cobro).
const anadirServicioReserva = (id, nombre, cantidad) => ejecutarEndpoint_('anadirServicioReserva', { id }, () => {
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  const previas = leerLineasServicio_(entrada.reserva.id);
  const servicio = obtenerServiciosActivos_(entrada.reserva.espacio).find((x) => x.nombre === texto_(nombre));
  const resultado = anadirLineaServicio_(previas, servicio, cantidad);
  if (!resultado.valido) return { success: false, error: resultado.error };
  guardarLineasCobro_(lectura, entrada, previas, resultado.lineas);
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudo añadir el servicio. Inténtalo de nuevo.' });
