// Gestionar Reserva: listado de activas, edición con auditoría, ciclo de vida automático y cancelación. Ver ADR-0004/0005.

// Valores de dominio del ciclo de vida (ADR-0004).
const COBRO_INGRESADO          = 'Ingresado';
const INCIDENCIAS_CON          = 'Con incidentes';
const INCID_RESUELTA_SI        = 'Sí';
const ESTADO_RESERVA_COMPLETADA = 'Completada';
const CONTRATO_FIRMADO         = 'Firmado';

// Columnas de Reservas usadas en edición (las no definidas en reservas.gs).
const COL_RES_CANAL            = 2;
const COL_RES_SERVICIOS_EXTRA  = 10;
const COL_RES_TELEFONO         = 6;
const COL_RES_EMAIL            = 7;
const COL_RES_ADULTOS          = 8;
const COL_RES_MENORES          = 9;
const COL_RES_IMPORTE_ALQUILER = 11;
const COL_RES_SERV_PRECIO      = 12;
const COL_RES_SERV_COSTE       = 13;
const COL_RES_BRUTO            = 14;
const COL_RES_COMISION_PCT     = 15;
const COL_RES_COMISION_IMP     = 16;
const COL_RES_MARGEN           = 17;
const COL_RES_COBRO            = 19;
const COL_RES_CONTRATO_ESTADO  = 20;
const COL_RES_CONTRATO_ARCHIVO = 21;
const COL_RES_INCIDENCIAS      = 22;
const COL_RES_INCIDENTE_COM    = 23;
const COL_RES_COMPENSACION     = 24;
const COL_RES_INCID_RESUELTA   = 25;
const COL_RES_REGISTRO_VIAJEROS = 27;
const COL_RES_CHECKIN          = 28;
const COL_RES_CHECKOUT         = 29;
const COL_RES_REGISTRADO_POR   = 32;
const COL_RES_CALENDAR_EVENT   = 30;
const COL_RES_NOTAS            = 31;
const COL_RES_MOD_POR          = 34;
const COL_RES_FECHA_MOD        = 35;

// Estado calculado (ADR-0004): nunca toca una reserva cancelada; "Completada" exige cobro y sin incidencia abierta.
const calcularEstadoReserva = (cobro, incidencias, incidenciaResuelta, estadoActual) => {
  if (estadoActual === ESTADO_RESERVA_CANCELADA) return ESTADO_RESERVA_CANCELADA;
  const sinIncidenciaAbierta = incidencias !== INCIDENCIAS_CON || incidenciaResuelta === INCID_RESUELTA_SI;
  return (cobro === COBRO_INGRESADO && sinIncidenciaAbierta) ? ESTADO_RESERVA_COMPLETADA : ESTADO_RESERVA_ABIERTA;
};

// Endpoint: reservas Abiertas (todas) + Completadas con fin no vencido; nunca Canceladas. Filtros opcionales (US-023).
const listarReservasActivas = (filtro) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const nombre = String((filtro && filtro.nombre) || '').trim().toLowerCase();
    const desde = (filtro && filtro.desde) ? combinarFechaHora(filtro.desde, '00:00').getTime() : null;
    const hasta = (filtro && filtro.hasta) ? combinarFechaHora(filtro.hasta, '23:59').getTime() : null;

    const modificables = obtenerFilas(obtenerHoja(HOJA_RESERVAS))
      .filter((fila) => esReservaModificable(fila) && coincideFiltroGestion(fila, nombre, desde, hasta))
      .map(mapearReservaGestion);
    return { success: true, data: modificables };
  } catch (error) {
    registrarError('listarReservasActivas', error, filtro);
    return { success: false, error: 'No se pudieron cargar las reservas.' };
  }
};

// Modificable = cualquier reserva no cancelada (las canceladas no se editan). Ver ADR-0008.
const esReservaModificable = (fila) => String(fila[COL_RES_ESTADO]).trim() !== ESTADO_RESERVA_CANCELADA;

const coincideFiltroGestion = (fila, nombre, desde, hasta) => {
  if (nombre && !String(fila[COL_RES_NOMBRE]).toLowerCase().includes(nombre)) return false;
  if (desde === null && hasta === null) return true;
  const inicio = aFecha(fila[COL_RES_INICIO]).getTime();
  const fin = aFecha(fila[COL_RES_FIN]).getTime();
  if (desde !== null && fin < desde) return false;
  if (hasta !== null && inicio > hasta) return false;
  return true;
};

const mapearReservaGestion = (fila) => ({
  id: String(fila[COL_RES_ID]).trim(),
  ref: referenciaMostrada(String(fila[COL_RES_ID])),
  estado: String(fila[COL_RES_ESTADO]),
  canal: String(fila[COL_RES_CANAL]),
  inicioTexto: formatearFechaHora(aFecha(fila[COL_RES_INICIO])),
  finTexto: formatearFechaHora(aFecha(fila[COL_RES_FIN])),
  checkin: String(fila[COL_RES_CHECKIN]),
  checkout: String(fila[COL_RES_CHECKOUT]),
  nombre: String(fila[COL_RES_NOMBRE]),
  cobro: String(fila[COL_RES_COBRO]),
});

// Endpoint: una reserva completa para el formulario de edición.
const obtenerReserva = (id) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const loc = localizarReserva(obtenerHoja(HOJA_RESERVAS), id);
    if (!loc) return { success: false, error: 'No se encontró la reserva.' };
    const v = loc.valores;
    return {
      success: true,
      data: {
        id, ref: referenciaMostrada(id), espacio: String(v[COL_RES_ESPACIO]), canal: String(v[COL_RES_CANAL]),
        inicioTexto: formatearFechaHora(aFecha(v[COL_RES_INICIO])), finTexto: formatearFechaHora(aFecha(v[COL_RES_FIN])),
        serviciosExtra: String(v[COL_RES_SERVICIOS_EXTRA]), registroViajeros: String(v[COL_RES_REGISTRO_VIAJEROS]),
        nombre: String(v[COL_RES_NOMBRE]), telefono: String(v[COL_RES_TELEFONO]), email: String(v[COL_RES_EMAIL]),
        adultos: v[COL_RES_ADULTOS], menores: v[COL_RES_MENORES],
        importeAlquiler: v[COL_RES_IMPORTE_ALQUILER], comisionPct: v[COL_RES_COMISION_PCT],
        bruto: v[COL_RES_BRUTO], comisionImporte: v[COL_RES_COMISION_IMP], serviciosCoste: v[COL_RES_SERV_COSTE], margen: v[COL_RES_MARGEN], neto: v[COL_RES_NETO],
        registradoPor: String(v[COL_RES_REGISTRADO_POR]),
        fechaRegistro: v[COL_RES_FECHA_REGISTRO] ? formatearFechaHora(aFecha(v[COL_RES_FECHA_REGISTRO])) : '',
        modificadoPor: String(v[COL_RES_MOD_POR]),
        fechaModificacion: v[COL_RES_FECHA_MOD] ? formatearFechaHora(aFecha(v[COL_RES_FECHA_MOD])) : '',
        cobro: String(v[COL_RES_COBRO]), contratoEstado: String(v[COL_RES_CONTRATO_ESTADO]), contratoArchivo: String(v[COL_RES_CONTRATO_ARCHIVO]),
        incidencias: String(v[COL_RES_INCIDENCIAS]), incidenteComunicado: String(v[COL_RES_INCIDENTE_COM]),
        compensacion: String(v[COL_RES_COMPENSACION]), incidenciaResuelta: String(v[COL_RES_INCID_RESUELTA]),
        estado: String(v[COL_RES_ESTADO]), checkin: String(v[COL_RES_CHECKIN]), checkout: String(v[COL_RES_CHECKOUT]),
        notas: String(v[COL_RES_NOTAS]),
        videoInUrl: String(v[COL_RES_VIDEO_IN]), videoOutUrl: String(v[COL_RES_VIDEO_OUT]),
      },
    };
  } catch (error) {
    registrarError('obtenerReserva', error, { id });
    return { success: false, error: 'No se pudo cargar la reserva.' };
  }
};

// Endpoint: guarda los cambios de una reserva, recalcula importes/estado y audita campo a campo (US-015/016).
const actualizarReserva = (id, cambios) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const validacion = validarCambiosReserva(cambios);
    if (!validacion.valido) return { success: false, error: validacion.error };

    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(20000);
    try {
      const hoja = obtenerHoja(HOJA_RESERVAS);
      const loc = localizarReserva(hoja, id);
      if (!loc) return { success: false, error: 'No se encontró la reserva.' };

      const resultado = aplicarCambios(loc.valores, cambios, obtenerEmailSesion());
      hoja.getRange(loc.filaSheet, 1, 1, resultado.fila.length).setValues([resultado.fila]);
      registrarHistorial(id, resultado.diffs, obtenerEmailSesion());
      return { success: true, estado: resultado.fila[COL_RES_ESTADO] };
    } finally {
      bloqueo.releaseLock();
    }
  } catch (error) {
    registrarError('actualizarReserva', error, { id });
    return { success: false, error: 'No se pudieron guardar los cambios.' };
  }
};

const validarCambiosReserva = (c) => {
  if (!c) return { valido: false, error: 'No hay cambios que guardar.' };
  if (!String(c.nombre || '').trim()) return { valido: false, error: 'El nombre del huésped es obligatorio.' };
  if (!(parseInt(c.adultos, 10) >= 1)) return { valido: false, error: 'Debe haber al menos 1 adulto.' };
  if (!(Number(c.importeAlquiler) >= 0)) return { valido: false, error: 'El importe del alquiler no es válido.' };
  const comision = Number(c.comisionPct) || 0;
  if (comision < 0 || comision > 100) return { valido: false, error: 'La comisión debe estar entre 0 y 100.' };
  const tel = String(c.telefono || '').trim();
  if (tel && !/^\d{9}$/.test(tel)) return { valido: false, error: 'El teléfono debe tener 9 cifras.' };
  const email = String(c.email || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { valido: false, error: 'El email no tiene un formato válido.' };
  return { valido: true };
};

// Aplica los cambios sobre una copia de la fila, recalcula derivados y devuelve { fila, diffs }.
const aplicarCambios = (valores, c, email) => {
  const fila = valores.slice();
  const diffs = [];
  const set = (col, etiqueta, nuevo) => {
    if (String(fila[col]) !== String(nuevo)) diffs.push({ campo: etiqueta, anterior: fila[col], nuevo });
    fila[col] = nuevo;
  };

  set(COL_RES_NOMBRE, 'Nombre del huésped', String(c.nombre).trim());
  set(COL_RES_TELEFONO, 'Teléfono', String(c.telefono || '').trim());
  set(COL_RES_EMAIL, 'Email', String(c.email || '').trim());
  set(COL_RES_ADULTOS, 'Adultos', parseInt(c.adultos, 10));
  set(COL_RES_MENORES, 'Menores', parseInt(c.menores, 10) || 0);
  set(COL_RES_IMPORTE_ALQUILER, 'Importe del alquiler', Number(c.importeAlquiler));
  set(COL_RES_COMISION_PCT, '% Comisión', Number(c.comisionPct) || 0);
  set(COL_RES_COBRO, 'Estado de cobro', String(c.cobro));
  set(COL_RES_CONTRATO_ESTADO, 'Estado del contrato', String(c.contratoEstado));
  set(COL_RES_INCIDENCIAS, 'Incidencias', String(c.incidencias));
  set(COL_RES_INCIDENTE_COM, 'Incidente comunicado', String(c.incidenteComunicado || ''));
  set(COL_RES_COMPENSACION, 'Compensación de daños', String(c.compensacion || ''));
  set(COL_RES_INCID_RESUELTA, 'Incidencia resuelta', String(c.incidenciaResuelta || ''));
  set(COL_RES_CHECKIN, 'Check-in revisado', String(c.checkin));
  set(COL_RES_CHECKOUT, 'Check-out revisado', String(c.checkout));
  set(COL_RES_NOTAS, 'Notas', String(c.notas || ''));

  recalcularDerivados(fila);

  const nuevoEstado = calcularEstadoReserva(fila[COL_RES_COBRO], fila[COL_RES_INCIDENCIAS], fila[COL_RES_INCID_RESUELTA], fila[COL_RES_ESTADO]);
  if (nuevoEstado !== fila[COL_RES_ESTADO]) {
    diffs.push({ campo: 'Estado de la reserva', anterior: fila[COL_RES_ESTADO], nuevo: nuevoEstado });
    fila[COL_RES_ESTADO] = nuevoEstado;
  }

  fila[COL_RES_MOD_POR] = email;
  fila[COL_RES_FECHA_MOD] = new Date();
  return { fila, diffs };
};

// Recalcula bruto/comisión/margen/neto a partir del alquiler, la comisión y los totales de servicios ya guardados.
const recalcularDerivados = (fila) => {
  const serviciosPrecio = Number(fila[COL_RES_SERV_PRECIO]) || 0;
  const serviciosCoste = Number(fila[COL_RES_SERV_COSTE]) || 0;
  const bruto = (Number(fila[COL_RES_IMPORTE_ALQUILER]) || 0) + serviciosPrecio;
  const comision = bruto * ((Number(fila[COL_RES_COMISION_PCT]) || 0) / 100);
  fila[COL_RES_BRUTO] = bruto;
  fila[COL_RES_COMISION_IMP] = comision;
  fila[COL_RES_MARGEN] = serviciosPrecio - serviciosCoste;
  fila[COL_RES_NETO] = bruto - comision - serviciosCoste;
};

// Endpoint: cancela una reserva (transición manual única), audita y avisa de reapertura de canales (US-018/020).
const cancelarReserva = (id) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(20000);
    try {
      const hoja = obtenerHoja(HOJA_RESERVAS);
      const loc = localizarReserva(hoja, id);
      if (!loc) return { success: false, error: 'No se encontró la reserva.' };
      const v = loc.valores;
      if (String(v[COL_RES_ESTADO]).trim() === ESTADO_RESERVA_CANCELADA) {
        return { success: false, error: 'La reserva ya está cancelada.' };
      }

      const anterior = v[COL_RES_ESTADO];
      v[COL_RES_ESTADO] = ESTADO_RESERVA_CANCELADA;
      v[COL_RES_MOD_POR] = obtenerEmailSesion();
      v[COL_RES_FECHA_MOD] = new Date();
      hoja.getRange(loc.filaSheet, 1, 1, v.length).setValues([v]);

      registrarHistorial(id, [{ campo: 'Estado de la reserva', anterior, nuevo: ESTADO_RESERVA_CANCELADA }], obtenerEmailSesion());
      eliminarEventoReserva(String(v[COL_RES_CALENDAR_EVENT]));
      notificarReaperturaCanales({
        ref: referenciaMostrada(id), espacio: String(v[COL_RES_ESPACIO]), canal: String(v[COL_RES_CANAL]),
        inicio: aFecha(v[COL_RES_INICIO]), fin: aFecha(v[COL_RES_FIN]),
      });
      return { success: true };
    } finally {
      bloqueo.releaseLock();
    }
  } catch (error) {
    registrarError('cancelarReserva', error, { id });
    return { success: false, error: 'No se pudo cancelar la reserva.' };
  }
};

// Endpoint: historial de cambios de una reserva, de más reciente a más antiguo (US-019).
const obtenerHistorial = (id) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const tz = obtenerSpreadsheet().getSpreadsheetTimeZone();
    const cambios = obtenerFilas(obtenerHoja(HOJA_HISTORIAL_CAMBIOS))
      .filter((fila) => String(fila[2]).trim() === id)
      .map((fila) => ({
        fecha: Utilities.formatDate(aFecha(fila[0]), tz, 'dd/MM/yyyy HH:mm'),
        orden: aFecha(fila[0]).getTime(),
        usuario: String(fila[1]), campo: String(fila[3]),
        anterior: String(fila[4]), nuevo: String(fila[5]),
      }))
      .sort((a, b) => b.orden - a.orden);
    return { success: true, data: cambios };
  } catch (error) {
    registrarError('obtenerHistorial', error, { id });
    return { success: false, error: 'No se pudo cargar el historial.' };
  }
};

const localizarReserva = (hoja, id) => {
  const datos = hoja.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][COL_RES_ID]).trim() === id) return { filaSheet: i + 1, valores: datos[i] };
  }
  return null;
};

const registrarHistorial = (id, diffs, email) => {
  if (diffs.length === 0) return;
  const hoja = obtenerHoja(HOJA_HISTORIAL_CAMBIOS);
  const ahora = new Date();
  const filas = diffs.map((d) => [ahora, email, id, d.campo, d.anterior, d.nuevo]);
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 6).setValues(filas);
};
