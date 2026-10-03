// Capa: API — comunicación a SES.Hospedajes (ADR-0018, DD-02 §3.1–§3.5): tareas del sistema.
// alEnviarFormularioViajeros (activador del Sheet del Form) programa la reserva (RH); procesarComunicacionesSES
// (cada 10 min) envía, consulta los lotes y reintenta; actualizarCatalogosSES (desde el editor) refresca los códigos.
// Las pantallas de validación y el envío del parte (PV) llegan en S28.

const CATALOGOS_SES_REMOTOS = ['SEXO', 'TIPO_DOCUMENTO', 'TIPO_PARENTESCO', 'TIPO_PAGO'];
const MINUTOS_TAREA_SES = 10;
const USUARIO_SISTEMA = 'KAF Rent (automático)';

const codigosDeReserva_ = (reserva) => [reserva.refCanal, referenciaMostrada_(reserva.id)];

const espaciosConRegistroViajeros_ = () => obtenerEspacios_({ soloActivos: false })
  .filter((e) => e.modoFecha === MODO_FECHA.RANGO_DIAS).map((e) => e.nombre);

// Reserva de Habitación no cancelada cuyo código coincide con el de la respuesta (RF-76).
const reservaDeRespuesta_ = (lectura, respuesta) => {
  const espacios = espaciosConRegistroViajeros_();
  return lectura.entradas.find(({ reserva }) => espacios.includes(reserva.espacio) && esModificable_(reserva)
    && casarRespuestasConReserva_([respuesta], codigosDeReserva_(reserva)).length > 0) || null;
};

const actualizarEstadoRegistroViajeros_ = (tabla, entrada, formsCasados) => {
  const { reserva } = entrada;
  const nuevo = estadoRegistroViajeros_(formsCasados, numero_(reserva.adultos) + numero_(reserva.menores));
  if (nuevo !== reserva.registroViajeros) guardarCampoReserva_(tabla, entrada.filaSheet, 'registroViajeros', nuevo);
};

const programarComunicacionSES_ = ({ idReserva, tipo, filasForm, usuario, ahora, anulaA = '' }) => anadirComunicacionSES_({
  id: `${idReserva}-${tipo}-${ahora.getTime()}`, idReserva, tipo, estado: ESTADO_COMUNICACION_SES.PENDIENTE, intento: 0, filasForm,
  lote: '', codigo: '', error: '', usuario, fechaEnvio: '', proximoIntento: ahora, anulaA,
});

// Activador "al enviar el formulario" del Sheet del Form: casa la respuesta, actualiza el estado del registro (RF-78)
// y, si es la primera y llega antes del día de entrada, programa la comunicación de la reserva (RH, D-31).
const alEnviarFormularioViajeros = (e) => ejecutarTareaDelSistema_('alEnviarFormularioViajeros', e, () => conBloqueo_(() => {
  const respuestas = leerRespuestasFormViajeros_();
  const fila = e && e.range ? e.range.getRow() : Math.max(...respuestas.map((r) => r.fila));
  const respuesta = respuestas.find((r) => r.fila === fila);
  const lectura = leerReservas_();
  const entrada = respuesta ? reservaDeRespuesta_(lectura, respuesta) : null;
  if (!entrada) {
    registrarLog_('SES_SIN_RESERVA', '', `Respuesta del Form en la fila ${fila} sin reserva de Habitación con ese código`);
    if (respuesta) enviarAvisoSESSinReserva_({ fila, codigo: respuesta.codigoReserva, nombre: [respuesta.nombre, respuesta.apellido1].filter(Boolean).join(' ') });
    return { success: true, reserva: null };
  }
  const casadas = casarRespuestasConReserva_(respuestas, codigosDeReserva_(entrada.reserva));
  actualizarEstadoRegistroViajeros_(lectura.tabla, entrada, casadas.length);
  const rh = debeComunicarRH_(casadas.filter((r) => r.fila !== fila), aFecha_(respuesta.marcaTemporal), entrada.reserva.inicio);
  if (rh) {
    programarComunicacionSES_({
      idReserva: entrada.reserva.id, tipo: TIPO_COMUNICACION_SES.RESERVA, filasForm: [fila], usuario: obtenerEmailSesion_() || USUARIO_SISTEMA, ahora: new Date(),
    });
  }
  return { success: true, reserva: entrada.reserva.id, rh };
}));

// Lo que necesitan todas las comunicaciones de una pasada, leído una sola vez.
const contextoSES_ = (comunicaciones) => ({
  comunicaciones,
  reservas: leerReservas_(),
  respuestas: leerRespuestasFormViajeros_(),
  tablas: { catalogo: leerCatalogoSES_(), municipios: leerMunicipiosINE_() },
  codigoEstablecimiento: texto_(obtenerConfig_('SES_Codigo_Establecimiento')),
  tipoPago: texto_(obtenerConfig_('SES_Tipo_Pago')),
  maxIntentos: obtenerConfigNumero_('SES_Max_Intentos', 3),
  minutos: obtenerConfigNumero_('SES_Reintento_Minutos', 30),
});

// Lo que muestran los emails de SES: la reserva, su titular y, en una anulación, la comunicación anulada.
const detalleAvisoSES_ = (comunicacion, contexto) => {
  const entrada = buscarReserva_(contexto.reservas, comunicacion.idReserva);
  const titular = contexto.respuestas.find((r) => comunicacion.filasForm.includes(r.fila));
  const original = contexto.comunicaciones.find((e) => e.comunicacion.id === comunicacion.anulaA);
  return {
    reserva: entrada ? entrada.reserva : null, inicio: entrada ? entrada.reserva.inicio : null, maxIntentos: contexto.maxIntentos,
    titular: titular ? [titular.nombre, titular.apellido1, titular.apellido2].filter(Boolean).join(' ') : '',
    codigoAnulado: original ? original.comunicacion.codigo : '', tipoAnulado: original ? original.comunicacion.tipo : '',
  };
};

// Quién validó en persona a los huéspedes del parte (F-28): "luis@… · 20/10/2026 16:20". Solo se lee al comunicarse un parte.
const validadoPorDelParte_ = (c) => {
  if (c.tipo !== TIPO_COMUNICACION_SES.PARTE) return '';
  const ultimas = new Map();
  leerValidacionesReserva_(c.idReserva).filter((v) => c.filasForm.includes(v.fila))
    .forEach((v) => { if (!ultimas.has(v.validadoPor) || v.fecha > ultimas.get(v.validadoPor)) ultimas.set(v.validadoPor, v.fecha); });
  return [...ultimas].map(([por, fecha]) => `${por} · ${formatearFechaHora_(fecha)}`).join(', ');
};

// Guarda la comunicación y, si hay causa, avisa por email (DD-02 §3.5). Una escritura por comunicación procesada:
// son pocas en cada pasada.
const guardarYAvisar_ = (tabla, entrada, comunicacion, contexto, causa) => {
  guardarComunicacionSES_(tabla, entrada, comunicacion);
  if (!causa) return;
  const detalle = detalleAvisoSES_(comunicacion, contexto);
  enviarAvisoSESFallo_(comunicacion, avisoSES_(comunicacion, causa, detalle), detalle);
};

// Causa del aviso tras un fallo reintentable: reintento programado o intentos agotados.
const causaTrasFallo_ = (estado) => (estado === ESTADO_COMUNICACION_SES.PENDIENTE ? CAUSA_AVISO_SES.REINTENTO : CAUSA_AVISO_SES.AGOTADO);

// Anulación (ADR-0022): espera a que la original quede comunicada; si no llegó a comunicarse, no hay nada que anular.
const solicitudAnulacion_ = (comunicacion, contexto) => {
  const original = contexto.comunicaciones.find((e) => e.comunicacion.id === comunicacion.anulaA);
  const estado = original ? original.comunicacion.estado : '';
  if (estado === ESTADO_COMUNICACION_SES.ENVIADA) return { esperar: true };
  if (estado !== ESTADO_COMUNICACION_SES.COMUNICADA || !original.comunicacion.codigo) return { descartar: true };
  return { valido: true, xml: construirXmlAnulacion_([original.comunicacion.codigo]) };
};

const solicitudDe_ = (comunicacion, contexto) => {
  if (comunicacion.tipo === TIPO_COMUNICACION_SES.ANULACION) return solicitudAnulacion_(comunicacion, contexto);
  const entrada = buscarReserva_(contexto.reservas, comunicacion.idReserva);
  if (!entrada) return invalido_('La reserva ya no existe en KAF Rent.');
  return prepararSolicitudSES_({
    tipo: comunicacion.tipo, reserva: entrada.reserva, tablas: contexto.tablas,
    respuestas: contexto.respuestas.filter((r) => comunicacion.filasForm.includes(r.fila)),
    codigoEstablecimiento: contexto.codigoEstablecimiento, tipoPago: contexto.tipoPago,
  });
};

const enviarPendiente_ = (tabla, entrada, contexto, ahora) => {
  const c = entrada.comunicacion;
  const guardar = (cambios, causa) => guardarYAvisar_(tabla, entrada, { ...c, ...cambios }, contexto, causa);
  const solicitud = solicitudDe_(c, contexto);
  if (solicitud.esperar) return undefined; // se vuelve a mirar en la siguiente pasada
  if (solicitud.descartar) return guardar({ estado: ESTADO_COMUNICACION_SES.DESCARTADA, error: 'La comunicación original no llegó a comunicarse: no hay nada que anular.' });
  const intento = c.intento + 1;
  if (!solicitud.valido) return guardar({ estado: ESTADO_COMUNICACION_SES.RECHAZADA, intento, error: solicitud.error }, CAUSA_AVISO_SES.DATOS);
  const respuesta = enviarComunicacionSES_(c.tipo, solicitud.xml);
  const resultado = clasificarErrorSES_(respuesta);
  if (resultado === RESULTADO_SES.OK) {
    return guardar({ estado: ESTADO_COMUNICACION_SES.ENVIADA, intento, lote: respuesta.lote, fechaEnvio: ahora, error: '', proximoIntento: null });
  }
  if (resultado === RESULTADO_SES.RECHAZO) {
    return guardar({ estado: ESTADO_COMUNICACION_SES.RECHAZADA, proximoIntento: null, intento, error: describirFalloSES_(respuesta) }, CAUSA_AVISO_SES.RECHAZO);
  }
  const tras = trasFalloReintentable_(c.tipo, intento, contexto.maxIntentos, ahora, contexto.minutos);
  return guardar({ ...tras, intento, error: describirFalloSES_(respuesta) }, causaTrasFallo_(tras.estado));
};

// Comunicada: se anota en el Form; si era una anulación, la comunicación original pasa a Anulada.
const alComunicarse_ = (tabla, entrada, contexto, ahora, codigo) => {
  const c = entrada.comunicacion;
  const comunicada = { ...c, estado: ESTADO_COMUNICACION_SES.COMUNICADA, codigo: codigo || c.codigo, error: '' };
  guardarComunicacionSES_(tabla, entrada, comunicada);
  const original = contexto.comunicaciones.find((e) => e.comunicacion.id === c.anulaA);
  if (original) guardarComunicacionSES_(tabla, original, { ...original.comunicacion, estado: ESTADO_COMUNICACION_SES.ANULADA });
  anotarComunicacionEnForm_(c.filasForm, c.tipo, { usuario: c.usuario, fecha: ahora, codigo, lote: c.lote });
  const detalle = { ...detalleAvisoSES_(comunicada, contexto), validadoPor: validadoPorDelParte_(comunicada) };
  enviarAvisoSESExito_(comunicada, avisoSESExito_(comunicada, detalle), detalle);
};

// Si SES no responde, se vuelve a consultar en la siguiente pasada; el resultado se anota en el Form al comunicarse.
const consultarEnviada_ = (tabla, entrada, contexto, ahora) => {
  const c = entrada.comunicacion;
  const respuesta = consultarLoteSES_(c.lote);
  if (clasificarErrorSES_(respuesta) !== RESULTADO_SES.OK) throw new Error(`Consulta del lote ${c.lote}: ${describirFalloSES_(respuesta)}`);
  const lote = (respuesta.lotes || []).find((l) => l.lote === c.lote);
  const lectura = interpretarLote_(lote, { exigeCodigo: c.tipo !== TIPO_COMUNICACION_SES.ANULACION });
  const guardar = (cambios, causa) => guardarYAvisar_(tabla, entrada, { ...c, ...cambios }, contexto, causa);
  if (lectura.resultado === RESULTADO_LOTE.ESPERAR) return;
  if (lectura.resultado === RESULTADO_LOTE.COMUNICADA) {
    alComunicarse_(tabla, entrada, contexto, ahora, lectura.codigoComunicacion);
    return;
  }
  if (lectura.resultado === RESULTADO_LOTE.REINTENTAR) {
    const tras = trasFalloReintentable_(c.tipo, c.intento, contexto.maxIntentos, ahora, contexto.minutos);
    guardar({ ...tras, error: lectura.error }, causaTrasFallo_(tras.estado));
    return;
  }
  guardar({ estado: ESTADO_COMUNICACION_SES.RECHAZADA, error: lectura.error }, CAUSA_AVISO_SES.RECHAZO);
};

// Un fallo en una comunicación no impide procesar las demás (RF-67).
const procesarSeguro_ = (accion, entrada, procesar) => {
  try {
    procesar();
  } catch (error) {
    registrarError_(`procesarComunicacionesSES:${accion}`, error, { id: entrada.comunicacion.id });
  }
};

const debeEnviarse_ = (c, ahora) => c.estado === ESTADO_COMUNICACION_SES.PENDIENTE && (!c.proximoIntento || c.proximoIntento <= ahora);

// Una pasada: envía lo pendiente que toca y consulta lo enviado. `incluir` la limita (p. ej. a una reserva).
// Quien la llama ya tiene el bloqueo.
const procesarPasadaSES_ = (incluir = () => true) => {
  const ahora = new Date();
  const { tabla, entradas } = leerComunicacionesSES_();
  const propias = entradas.filter(({ comunicacion }) => incluir(comunicacion));
  const pendientes = propias.filter(({ comunicacion }) => debeEnviarse_(comunicacion, ahora));
  const enviadas = propias.filter(({ comunicacion }) => comunicacion.estado === ESTADO_COMUNICACION_SES.ENVIADA);
  if (pendientes.length + enviadas.length === 0) return { enviadas: 0, consultadas: 0 };
  const contexto = contextoSES_(entradas);
  pendientes.forEach((entrada) => procesarSeguro_('enviar', entrada, () => enviarPendiente_(tabla, entrada, contexto, ahora)));
  enviadas.forEach((entrada) => procesarSeguro_('consultar', entrada, () => consultarEnviada_(tabla, entrada, contexto, ahora)));
  return { enviadas: pendientes.length, consultadas: enviadas.length };
};

// Activador cada 10 minutos (DD-02 §3.1 paso 6).
const procesarComunicacionesSES = (e) => ejecutarTareaDelSistema_('procesarComunicacionesSES', e,
  () => conBloqueo_(() => ({ success: true, ...procesarPasadaSES_() })));

// Refresca los catálogos de SES en Catálogo_SES (no toca PAIS ni PROVINCIA). Una vez al mes desde las tareas
// nocturnas y, cuando haga falta, desde el editor (usuario, 2026-10-02).
const actualizarCatalogosSES_ = () => {
  const catalogos = CATALOGOS_SES_REMOTOS.map((catalogo) => {
    const respuesta = consultarCatalogoSES_(catalogo);
    const tuplas = respuesta.tuplas || [];
    if (clasificarErrorSES_(respuesta) !== RESULTADO_SES.OK || tuplas.length === 0) {
      return { catalogo, actualizado: false, error: describirFalloSES_(respuesta) };
    }
    reemplazarCatalogoSES_(catalogo, tuplas);
    return { catalogo, actualizado: true, filas: tuplas.length };
  });
  catalogos.filter((c) => !c.actualizado).forEach((c) => registrarError_('actualizarCatalogosSES_', new Error(c.error), { catalogo: c.catalogo }));
  return { success: catalogos.every((c) => c.actualizado), catalogos };
};

// Comprueba usuario, contraseña y dirección de SES con una consulta de solo lectura: no envía datos ni escribe en el Sheet (F-30).
const CATALOGO_PRUEBA_CONEXION_SES = 'TIPO_DOCUMENTO';

const comprobarConexionSES_ = () => {
  const hayCredenciales = hayCredencialesSES_();
  const url = texto_(obtenerConfig_('SES_Url'));
  const respuesta = hayCredenciales && url ? consultarCatalogoSES_(CATALOGO_PRUEBA_CONEXION_SES) : {};
  const diagnostico = diagnosticoConexionSES_({ hayCredenciales, url, respuesta });
  registrarLog_('SES_CONEXION', obtenerEmailSesion_(), diagnostico.mensaje);
  return diagnostico;
};

// Desde el menú del Sheet o el editor (cuenta operativa). En el menú lo muestra en una ventana; en el editor, en el registro.
const comprobarConexionSES = (e) => ejecutarTareaDelSistema_('comprobarConexionSES', e, () => {
  const diagnostico = comprobarConexionSES_();
  mostrarEnSheet_(diagnostico.mensaje);
  return { success: diagnostico.ok, mensaje: diagnostico.mensaje };
});

// Botón de la app, solo Admin (F-30).
const probarConexionSES = () => ejecutarEndpoint_('probarConexionSES', {}, () => {
  if (!sesionEsAdmin_()) return { success: false, error: 'Solo un administrador puede comprobar la conexión con SES.' };
  return { success: true, data: comprobarConexionSES_() };
});

const actualizarCatalogosSES = (e) => ejecutarTareaDelSistema_('actualizarCatalogosSES', e, () => conBloqueo_(actualizarCatalogosSES_));

// El día 1 de cada mes y solo si ya hay credenciales (antes no tiene sentido llamar a SES).
const DIA_MES_CATALOGOS_SES = 1;
const tocaActualizarCatalogosSES_ = (ahora) => ahora.getDate() === DIA_MES_CATALOGOS_SES && hayCredencialesSES_();

// ---------- Cancelación de reservas ya comunicadas (ADR-0022) ----------

const comunicacionesDeReserva_ = (idReserva) => {
  const { tabla, entradas } = leerComunicacionesSES_();
  return { tabla, entradas: entradas.filter((e) => e.comunicacion.idReserva === idReserva) };
};

// Texto para la confirmación de cancelar; '' si no hay nada comunicado. Sin hoja de SES (antes de "Reparar hojas"), ''.
const avisoCancelacionSESDe_ = (idReserva) => {
  try {
    return avisoCancelacionSES_(comunicacionesDeReserva_(idReserva).entradas.map((e) => e.comunicacion));
  } catch (error) {
    registrarError_('avisoCancelacionSESDe_', error, { id: idReserva });
    return '';
  }
};

// Al cancelar: lo pendiente se descarta y lo enviado o comunicado se programa para anular.
const programarAnulacionesSES_ = (idReserva, usuario, ahora) => {
  const { tabla, entradas } = comunicacionesDeReserva_(idReserva);
  planAnulacionAlCancelar_(entradas.map((e) => e.comunicacion)).forEach(({ accion, id }) => {
    const entrada = entradas.find((e) => e.comunicacion.id === id);
    if (accion === 'descartar') {
      guardarComunicacionSES_(tabla, entrada, { ...entrada.comunicacion, estado: ESTADO_COMUNICACION_SES.DESCARTADA, error: 'Reserva cancelada antes de enviarse.' });
      return;
    }
    programarComunicacionSES_({ idReserva, tipo: TIPO_COMUNICACION_SES.ANULACION, filasForm: entrada.comunicacion.filasForm, usuario, ahora, anulaA: id });
  });
};

// ---------- Mensaje para el huésped (F-27, S28) ----------

// Texto y, si hay teléfono, enlace de WhatsApp con el mensaje del Form de viajeros de una reserva de Habitación.
const mensajeHuesped = (id) => ejecutarEndpoint_('mensajeHuesped', { id }, () => {
  const entrada = buscarReserva_(leerReservas_(), id);
  if (!entrada || !esModificable_(entrada.reserva)) return { success: false, error: 'No se encontró la reserva o está cancelada.' };
  if (!espaciosConRegistroViajeros_().includes(entrada.reserva.espacio)) return { success: false, error: 'El formulario de viajeros solo se pide en la Habitación.' };
  const plantillaEnlace = texto_(obtenerConfig_('Form_Viajeros_Enlace'));
  if (!plantillaEnlace.includes(MARCA_CODIGO_ENLACE)) {
    return { success: false, error: 'Falta el enlace del formulario de viajeros en Config (Form_Viajeros_Enlace). Avisa al administrador.' };
  }
  const texto = mensajeHuesped_({ reserva: entrada.reserva, plantillaEnlace });
  return { success: true, data: { texto, whatsapp: enlaceWhatsApp_(entrada.reserva.telefono, texto) } };
}, { errorUsuario: 'No se pudo preparar el mensaje para el huésped.' });

// ---------- Validar identidades y comunicar el parte (F-28, S28) ----------

const MENSAJE_SOLO_GESTION = 'Solo los usuarios con rol Gestión o Admin pueden validar huéspedes y comunicar a SES.';

// Todo lo que necesita la pantalla de una reserva de Habitación, leído una vez. { error } si no aplica.
const contextoRegistroViajeros_ = (id) => {
  const lectura = leerReservas_();
  const entrada = buscarReserva_(lectura, id);
  if (!entrada || !esModificable_(entrada.reserva)) return { error: 'No se encontró la reserva o está cancelada.' };
  if (!espaciosConRegistroViajeros_().includes(entrada.reserva.espacio)) return { error: 'El registro de viajeros solo se hace en la Habitación.' };
  return {
    entrada, tabla: lectura.tabla,
    casadas: casarRespuestasConReserva_(leerRespuestasFormViajeros_(), codigosDeReserva_(entrada.reserva)),
    validaciones: leerValidacionesReserva_(entrada.reserva.id),
    comunicaciones: comunicacionesDeReserva_(entrada.reserva.id).entradas.map((e) => e.comunicacion),
    tablas: { catalogo: leerCatalogoSES_(), municipios: leerMunicipiosINE_() },
  };
};

// Viajero de cada respuesta casada, con el contacto del adulto en los menores (D-38), como se enviará a SES.
const viajeroCompleto_ = (respuestas, tablas, fila) => {
  const viajeros = completarContactoMenores_(respuestas.map((r) => viajeroDesdeRespuesta_(r, tablas)));
  return viajeros.find((v) => v.fila === fila);
};

const fichaParaPantalla_ = (contexto, ahora) => (respuesta) => {
  const validacion = contexto.validaciones.find((v) => v.fila === respuesta.fila) || null;
  const ficha = fichaHuesped_(respuesta, viajeroCompleto_(contexto.casadas, contexto.tablas, respuesta.fila), validacion, ahora);
  return {
    ...ficha,
    municipiosProvincia: ficha.faltaMunicipio ? municipiosDeProvincia_(contexto.tablas.municipios, ficha.provincia) : [],
    validado: ficha.validado && { por: ficha.validado.por, fecha: formatearFechaHora_(ficha.validado.fecha) },
  };
};

const estadoSESConManual_ = (contexto) => {
  const estado = estadoSESDeReserva_(contexto.comunicaciones);
  return { ...estado, parte: parteConManual_(estado.parte, parteComunicadoEnForm_(contexto.casadas)) };
};

const vistaRegistroViajeros_ = (contexto, ahora) => {
  const { reserva } = contexto.entrada;
  const estadoSES = estadoSESConManual_(contexto);
  const resumen = resumenRegistro_({
    personas: numero_(reserva.adultos) + numero_(reserva.menores), parte: estadoSES.parte,
    filasCasadas: contexto.casadas.map((r) => r.fila), filasValidadas: contexto.validaciones.map((v) => v.fila),
  });
  return { ...resumen, estadoSES, plazo: formatearFechaHora_(plazoParte_(reserva.inicio)), huespedes: contexto.casadas.map(fichaParaPantalla_(contexto, ahora)) };
};

// Ejecuta `accion(contexto)` con el permiso y la reserva comprobados y devuelve la vista actualizada.
const conRegistroViajeros_ = (id, accion) => {
  if (!sesionTieneGestion_()) return { success: false, error: MENSAJE_SOLO_GESTION };
  const contexto = contextoRegistroViajeros_(texto_(id));
  if (contexto.error) return { success: false, error: contexto.error };
  const fallo = accion(contexto);
  if (fallo) return { success: false, error: fallo };
  return { success: true, data: vistaRegistroViajeros_(contextoRegistroViajeros_(texto_(id)), new Date()) };
};

// "Actualizar formularios" pone también al día el estado del registro de la reserva (RF-78), por si el Form llegó sin activador.
const cargarViajeros = (id) => ejecutarEndpoint_('cargarViajeros', { id }, () => conRegistroViajeros_(id, (contexto) => {
  actualizarEstadoRegistroViajeros_(contexto.tabla, contexto.entrada, contexto.casadas.length);
  return null;
}), { bloqueo: true, errorUsuario: 'No se pudieron cargar los datos de los huéspedes.' });

// Valida en persona a un huésped. Si su municipio no estaba en el INE, se elige y se corrige también en el Form.
const validarViajero = (id, fila, codigoMunicipio) => ejecutarEndpoint_('validarViajero', { id, fila }, () => conRegistroViajeros_(id, (contexto) => {
  const respuesta = contexto.casadas.find((r) => r.fila === numero_(fila));
  if (!respuesta) return 'Ese huésped no pertenece a esta reserva. Pulsa "Actualizar formularios".';
  if (contexto.validaciones.some((v) => v.fila === respuesta.fila)) return null;
  const municipio = texto_(codigoMunicipio) ? contexto.tablas.municipios.find((m) => m.codigo === texto_(codigoMunicipio)) : null;
  if (texto_(codigoMunicipio) && !municipio) return 'El municipio elegido no es válido.';
  const corregida = municipio ? { ...respuesta, municipio: municipio.municipio, provincia: municipio.provincia } : respuesta;
  const respuestas = contexto.casadas.map((r) => (r.fila === respuesta.fila ? corregida : r));
  const faltan = camposQueFaltanPV_(viajeroCompleto_(respuestas, contexto.tablas, respuesta.fila));
  if (faltan.length > 0) return `No se puede validar: falta ${faltan.join(', ')}. Corrígelo en el Sheet del Form y pulsa "Actualizar formularios".`;
  if (municipio) corregirMunicipioEnForm_(respuesta.fila, respuesta.esAdulto, { municipio: municipio.municipio, provincia: municipio.provincia });
  anadirValidacionViajero_({
    idReserva: contexto.entrada.reserva.id, filaForm: respuesta.fila, marcaTemporal: respuesta.marcaTemporal,
    validadoPor: obtenerEmailSesion_(), fecha: new Date(), codigoMunicipio: municipio ? municipio.codigo : '',
  });
  return null;
}), { bloqueo: true, errorUsuario: 'No se pudo validar al huésped. Inténtalo de nuevo.' });

const deshacerValidacionViajero = (id, fila) => ejecutarEndpoint_('deshacerValidacionViajero', { id, fila }, () => conRegistroViajeros_(id, (contexto) => {
  const { parte } = estadoSESConManual_(contexto);
  if (parte && ESTADOS_PARTE_EN_CURSO.includes(parte.estado)) return 'El parte ya se ha enviado a SES: no se puede deshacer la validación.';
  quitarValidacionViajero_(contexto.entrada.reserva.id, numero_(fila));
  return null;
}), { bloqueo: true, errorUsuario: 'No se pudo deshacer la validación.' });

// Con todos los formularios validados, programa el parte y lo envía en el momento (RF-91).
const comunicarParte = (id) => ejecutarEndpoint_('comunicarParte', { id }, () => conRegistroViajeros_(id, (contexto) => {
  const vista = vistaRegistroViajeros_(contexto, new Date());
  if (!vista.puedeComunicar) {
    const { parte } = vista.estadoSES;
    if (parte && ESTADOS_PARTE_EN_CURSO.includes(parte.estado)) return 'El parte ya está enviado o comunicado.';
    if (vista.faltanFormularios > 0) return `Falta el formulario de ${vista.faltanFormularios} huésped(es).`;
    return 'Faltan huéspedes por validar en persona.';
  }
  const idReserva = contexto.entrada.reserva.id;
  programarComunicacionSES_({
    idReserva, tipo: TIPO_COMUNICACION_SES.PARTE, filasForm: contexto.casadas.map((r) => r.fila), usuario: obtenerEmailSesion_(), ahora: new Date(),
  });
  procesarPasadaSES_((c) => c.idReserva === idReserva);
  return null;
}), { bloqueo: true, errorUsuario: 'No se pudo comunicar el parte. Inténtalo de nuevo.' });

// "Comprobar ahora": la misma pasada que la tarea de cada 10 minutos, solo para esta reserva.
const comprobarSES = (id) => ejecutarEndpoint_('comprobarSES', { id }, () => conRegistroViajeros_(id, (contexto) => {
  const idReserva = contexto.entrada.reserva.id;
  procesarPasadaSES_((c) => c.idReserva === idReserva);
  return null;
}), { bloqueo: true, errorUsuario: 'No se pudo comprobar el estado en SES. Inténtalo de nuevo.' });
