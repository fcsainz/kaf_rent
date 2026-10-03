// Capa: API — entradas del sistema: triggers programados, menú del Sheet y utilidades de editor.
// Son públicas porque Google las invoca por su nombre, pero solo se ejecutan desde un trigger real del proyecto
// o de forma directa por quien tiene acceso al Sheet/editor, nunca desde la Web App (RNF-20).

const HORA_TAREAS_NOCTURNAS = 3;
const DIA_MES_INFORMES = 1;
const HORA_INFORMES = 7;
const HORA_AVISOS_COBRO = 9; // de día: un aviso de madrugada sonaría en el móvil a deshoras
const MINUTOS_AVISOS_CHECKLIST = 15;
const DIAS_AVISO_INGRESO_DEFECTO = 10;
const HORAS_AVISO_CHECKIN_DEFECTO = 4;

// Aísla cada tarea: si una falla se registra y las demás continúan (RF-67).
const ejecutarTarea_ = (nombre, tarea) => {
  try {
    tarea();
  } catch (error) {
    registrarError_(`tarea:${nombre}`, error, {});
  }
};

// Trigger diario 03:00 (ADR-0009, ADR-0013).
const tareasNocturnas = (e) => ejecutarTareaDelSistema_('tareasNocturnas', e, () => {
  const ahora = new Date();
  ejecutarTarea_('copiaSeguridadSheet', () => copiaSeguridadSheet_(ahora));
  ejecutarTarea_('purgarLogs', () => purgarPorAntiguedad_(HOJA_LOGS, obtenerConfigNumero_('Retencion_Logs_Dias', 90), ahora));
  ejecutarTarea_('purgarErrores', () => purgarPorAntiguedad_(HOJA_ERRORES, obtenerConfigNumero_('Retencion_Errores_Dias', 365), ahora));
  ejecutarTarea_('purgarVideos', () => purgarVideosAntiguos_(ahora));
  ejecutarTarea_('purgarContratos', () => purgarContratosAntiguos_(ahora));
  if (tocaActualizarCatalogosSES_(ahora)) ejecutarTarea_('catalogosSES', () => conBloqueo_(actualizarCatalogosSES_));
  return { success: true };
});

// DD-04: ocupación principal de cada espacio · canal en el periodo (días con reserva por horas; noches por días).
const ocupacionPorEspacioCanal_ = (reservas, cierres, periodo) => {
  const canalesDe = nombresCanalesActivosPorEspacio_();
  return new Map(obtenerEspacios_({ soloActivos: false }).flatMap((espacio) => {
    const metricas = metricasOcupacion_({ ...datosOcupacion_(espacio, reservas, cierres, canalesDe), periodo });
    return metricas.canales.map((fila) => [`${espacio.nombre}||${fila.canal}`, ocupacionPrincipal_(metricas, fila)]);
  }));
};

// Con la comparativa frente al periodo anterior y al mismo del año anterior (D-41). Las noches se reparten
// entre meses y cada fila lleva su ocupación (DD-04 §3.1, §3.3).
const generarInforme_ = (periodo) => {
  const todas = leerReservas_().entradas.map((e) => e.reserva);
  const modos = new Map(obtenerEspacios_({ soloActivos: false }).map((e) => [e.nombre, e.modoFecha]));
  const agregadosDe = (p) => agregarPorEspacioCanal_(reservasDelPeriodo_(todas, p, (espacio) => modos.get(espacio)));
  const ocupaciones = ocupacionPorEspacioCanal_(todas, leerCierres_(), periodo);
  const conOcupacion = (a) => ({ ...a, ocupacion: ocupaciones.get(claveEspacioCanal_(a)) ?? null });
  const agregados = agregadosDe(periodo).map(conOcupacion);
  if (agregados.length > 0) archivarInforme_(periodo.periodo, periodo.tipo, agregados);
  const comparados = periodosDeComparacion_(periodo);
  const comparativa = comparativaInforme_({ actual: agregados, anterior: agregadosDe(comparados.anterior), anyoAnterior: agregadosDe(comparados.anyoAnterior) });
  enviarInforme_(periodo, { ...comparativa, filas: comparativa.filas.map(conOcupacion) }, comparados);
};

// Trigger del día 1 de cada mes: informe mensual y, al empezar trimestre, el trimestral (RF-61).
const informesProgramados = (e) => ejecutarTareaDelSistema_('informesProgramados', e, () => {
  const ahora = new Date();
  ejecutarTarea_('informeMensual', () => generarInforme_(periodoMensual_(ahora)));
  if (esInicioDeTrimestre_(ahora)) ejecutarTarea_('informeTrimestral', () => generarInforme_(periodoTrimestral_(ahora)));
  return { success: true };
});

// Instala los triggers programados. Ejecutar una vez desde el editor (RF-71).
const instalarTriggers = (e) => ejecutarTareaDelSistema_('instalarTriggers', e, () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tareasNocturnas').timeBased().atHour(HORA_TAREAS_NOCTURNAS).everyDays(1).create();
  ScriptApp.newTrigger('informesProgramados').timeBased().onMonthDay(DIA_MES_INFORMES).atHour(HORA_INFORMES).create();
  ScriptApp.newTrigger('procesarComunicacionesSES').timeBased().everyMinutes(MINUTOS_TAREA_SES).create();
  ScriptApp.newTrigger('avisosDeCobro').timeBased().atHour(HORA_AVISOS_COBRO).everyDays(1).create();
  ScriptApp.newTrigger('avisosDeChecklist').timeBased().everyMinutes(MINUTOS_AVISOS_CHECKLIST).create();
  const sheetViajeros = texto_(obtenerConfig_('Sheet_Viajeros_Id'));
  if (sheetViajeros) ScriptApp.newTrigger('alEnviarFormularioViajeros').forSpreadsheet(sheetViajeros).onFormSubmit().create();
  return {
    success: true,
    mensaje: `Triggers instalados: tareasNocturnas (${HORA_TAREAS_NOCTURNAS}:00 diario), informesProgramados (día ${DIA_MES_INFORMES}, ${HORA_INFORMES}:00), `
      + `procesarComunicacionesSES (cada ${MINUTOS_TAREA_SES} min), avisosDeCobro (${HORA_AVISOS_COBRO}:00 diario), `
      + `avisosDeChecklist (cada ${MINUTOS_AVISOS_CHECKLIST} min)${sheetViajeros ? ', alEnviarFormularioViajeros (al enviar el Form de viajeros)' : ' — sin Sheet_Viajeros_Id: falta el activador del Form'}.`,
  };
});

// F-37 (Q-08): trigger diario. Reservas sin ingresar a los 10, 20, 30… días de la salida → email a Gestión y Admin.
const avisosDeCobro = (e) => ejecutarTareaDelSistema_('avisosDeCobro', e, () => {
  const ahora = new Date();
  const dias = obtenerConfigNumero_('Dias_Aviso_Ingreso', DIAS_AVISO_INGRESO_DEFECTO);
  const destinatarios = obtenerEmailsGestion_();
  const avisadas = leerReservas_().entradas.map((x) => x.reserva).filter((r) => tocaAvisoIngreso_(r, ahora, dias));
  avisadas.forEach((r) => enviarRecordatorioIngreso_(r, diasNaturalesEntre_(r.fin, ahora), destinatarios));
  return { success: true, avisadas: avisadas.map((r) => r.id) };
});

// F-40 (DI-07): trigger cada 15 min. Check-in sin hacer en las 4 h antes de la llegada, o check-out sin hacer en
// las 24 h tras la salida → un email a Gestión y Admin, una sola vez (se anota en la reserva). Bajo bloqueo: no se duplica.
const avisosDeChecklist = (e) => ejecutarTareaDelSistema_('avisosDeChecklist', e, () => conBloqueo_(() => {
  const ahora = new Date();
  const horas = obtenerConfigNumero_('Horas_Aviso_Checkin', HORAS_AVISO_CHECKIN_DEFECTO);
  const lectura = leerReservas_();
  const avisos = lectura.entradas.flatMap((entrada) => [
    ...(tocaAvisoCheckin_(entrada.reserva, ahora, horas) ? [{ entrada, momento: ACCION_APP.CHECKIN, campo: 'avisoCheckin' }] : []),
    ...(tocaAvisoCheckout_(entrada.reserva, ahora) ? [{ entrada, momento: ACCION_APP.CHECKOUT, campo: 'avisoCheckout' }] : []),
  ]);
  const destinatarios = obtenerEmailsGestion_();
  // Como mucho un par de avisos por pasada: se anotan de uno en uno (KISS).
  avisos.forEach(({ entrada, momento, campo }) => {
    if (enviarAvisoChecklist_(entrada.reserva, momento, destinatarios)) guardarCampoReserva_(lectura.tabla, entrada.filaSheet, campo, ahora);
  });
  return { success: true, avisos: avisos.map((a) => `${a.entrada.reserva.id} ${a.momento}`) };
}));

// Crea los eventos de Calendar que falten en reservas no canceladas (reconciliación, RF-40). Desde el editor.
const sincronizarReservasCalendario = (e) => ejecutarTareaDelSistema_('sincronizarReservasCalendario', e, () => {
  const lectura = leerReservas_();
  const calendario = obtenerCalendario_();
  const invitados = obtenerEmailsGestion_();
  let creados = 0;
  let omitidos = 0;
  lectura.entradas.forEach(({ reserva, filaSheet }) => {
    if (!esModificable_(reserva) || existeEvento_(calendario, reserva.calendarEventId)) { omitidos += 1; return; }
    const eventoId = crearEventoReserva_(reserva, invitados);
    if (!eventoId) { omitidos += 1; return; }
    guardarCampoReserva_(lectura.tabla, filaSheet, 'calendarEventId', eventoId);
    creados += 1;
  });
  return { success: true, creados, omitidos };
});

// D-28: corrige una sola vez las reservas por días guardadas a 00:00 (B-22), su evento y su historial.
// Desde el editor; volver a ejecutarla no cambia nada. Son pocas filas: se escriben de una en una (KISS).
const corregirHorasReservas = (e) => ejecutarTareaDelSistema_('corregirHorasReservas', e, () => conBloqueo_(() => {
  const espaciosPorDias = obtenerEspacios_({ soloActivos: false })
    .filter((x) => x.modoFecha === MODO_FECHA.RANGO_DIAS).map((x) => x.nombre);
  const horas = horasPorDefecto_();
  const lectura = leerReservas_();
  const corregidas = lectura.entradas
    .filter(({ reserva }) => espaciosPorDias.includes(reserva.espacio))
    .map((entrada) => ({ entrada, fechas: corregirHorasMedianoche_(entrada.reserva, horas) }))
    .filter((c) => c.fechas);
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  corregidas.forEach(({ entrada, fechas }) => {
    const { reserva } = entrada;
    guardarReserva_(lectura.tabla, entrada, fechas);
    registrarHistorial_(reserva.id, [
      { campo: ETIQUETA_INICIO, anterior: formatearFechaHora_(reserva.inicio), nuevo: formatearFechaHora_(fechas.inicio) },
      { campo: ETIQUETA_FIN, anterior: formatearFechaHora_(reserva.fin), nuevo: formatearFechaHora_(fechas.fin) },
    ].filter((d) => d.anterior !== d.nuevo), email, ahora);
    if (esModificable_(reserva)) actualizarHorarioEvento_({ ...reserva, ...fechas });
  });
  return { success: true, corregidas: corregidas.map((c) => c.entrada.reserva.id) };
}));

// ---------- F-45: puesta al día de los datos (tarea de editor de un solo uso; repetirla no cambia nada) ----------

// Respuestas del Form de viajeros y códigos del canal que salen de ellas. Sin Form configurado o ilegible,
// no asigna nada, no toca el estado del registro y lo dice.
const formParaPuestaAlDia_ = (reservas) => {
  try {
    const respuestas = leerRespuestasFormViajeros_();
    return { respuestas, ...asignarCodigosForm_(respuestas, reservas, espaciosConRegistroViajeros_()) };
  } catch (error) {
    registrarError_('formParaPuestaAlDia_', error, {});
    return { respuestas: null, asignaciones: [], revisar: [], error: error.message };
  }
};

// RF-78: el estado del registro, por los formularios recibidos (solo las reservas que lo llevan, es decir, la Habitación).
const registroViajerosAlDia_ = (reserva, respuestas) => {
  if (!respuestas || !texto_(reserva.registroViajeros) || !esModificable_(reserva)) return reserva.registroViajeros;
  return estadoRegistroViajeros_(casarRespuestasConReserva_(respuestas, codigosDeReserva_(reserva)).length, totalPersonas_(reserva));
};

const ETIQUETA_REGISTRO_VIAJEROS = 'Registro de viajeros';

// Cambios de una reserva: código del canal, revisiones pasadas dadas por hechas, registro de viajeros y estado recalculado.
// `estadoGuardado`: el texto de la celda, por si aún dice "Completada" (Q-07: pasa a "Cerrada").
const reservaPuestaAlDia_ = (reserva, estadoGuardado, codigo, respuestas, ahora) => {
  const revisiones = revisionesPorPonerAlDia_(reserva, ahora);
  const conRevisiones = revisiones.reduce((r, campo) => ({ ...r, [campo]: REVISION.HECHO }), { ...reserva, refCanal: codigo || reserva.refCanal });
  const registroViajeros = registroViajerosAlDia_(conRevisiones, respuestas);
  const { reserva: editada, diffs } = aplicarCambios_(reserva, conRevisiones, USUARIO_PUESTA_AL_DIA, ahora);
  const nueva = { ...editada, registroViajeros };
  const extra = [
    texto_(estadoGuardado) !== nueva.estado && !diffs.some((d) => d.campo === ETIQUETA_ESTADO)
      ? { campo: ETIQUETA_ESTADO, anterior: texto_(estadoGuardado), nuevo: nueva.estado } : null,
    registroViajeros !== reserva.registroViajeros
      ? { campo: ETIQUETA_REGISTRO_VIAJEROS, anterior: reserva.registroViajeros, nuevo: registroViajeros } : null,
  ].filter(Boolean);
  return { nueva, diffs: [...diffs, ...extra], revisiones };
};

const MOMENTO_POR_REVISION = { checkin: 'Check-in', checkout: 'Check-out' };

const ponerAlDiaReservas = (e) => ejecutarTareaDelSistema_('ponerAlDiaReservas', e, () => conBloqueo_(() => {
  const ahora = new Date();
  const lectura = leerReservas_();
  const codigos = formParaPuestaAlDia_(lectura.entradas.map((x) => x.reserva));
  const codigoDe = new Map(codigos.asignaciones.map((a) => [a.id, a.codigo]));
  const estadoGuardado = (entrada) => entrada.valores[lectura.tabla.columnas.estado];
  const cambios = lectura.entradas
    .map((entrada) => ({ entrada, ...reservaPuestaAlDia_(entrada.reserva, estadoGuardado(entrada), codigoDe.get(entrada.reserva.id), codigos.respuestas, ahora) }))
    .filter((c) => c.diffs.length > 0);
  // Tarea de una sola vez sobre pocas filas: cada reserva se escribe en su fila (KISS, como corregirHorasReservas).
  cambios.forEach((c) => guardarReserva_(lectura.tabla, c.entrada, c.nueva));
  anadirChecklistsPuestaAlDia_(cambios.flatMap((c) => c.revisiones.map((campo) => ({
    idReserva: c.nueva.id, momento: MOMENTO_POR_REVISION[campo], usuario: USUARIO_PUESTA_AL_DIA, fecha: campo === 'checkin' ? c.nueva.inicio : c.nueva.fin,
  }))));
  registrarHistorialVarios_(cambios.map((c) => ({ idReserva: c.nueva.id, diffs: c.diffs })), USUARIO_PUESTA_AL_DIA, ahora);
  return {
    success: true, reservasCambiadas: cambios.map((c) => c.nueva.id), codigosAsignados: codigos.asignaciones,
    filasFormParaRevisar: codigos.revisar, avisoForm: codigos.error || '',
  };
}));

// Añade al final las columnas del esquema que falten; nunca renombra, mueve ni borra las existentes (B-16).
const anadirColumnasQueFaltan_ = (hoja, cabecerasEsquema) => {
  const actuales = cabecerasDe_(hoja);
  const faltan = columnasQueFaltan_(actuales, cabecerasEsquema);
  if (faltan.length > 0) hoja.getRange(1, actuales.length + 1, 1, faltan.length).setValues([faltan]).setFontWeight('bold');
  return faltan;
};

// La semilla está en el orden del esquema; se coloca por cabecera por si la hoja tiene otro orden.
const sembrarSiVacia_ = (hoja, definicion) => {
  if (!definicion.semilla || hoja.getLastRow() >= 2) return;
  const columnas = mapaColumnas_(definicion.campos, cabecerasDe_(hoja), definicion.nombre);
  const numColumnas = hoja.getLastColumn();
  const campos = Object.keys(definicion.campos);
  const filas = definicion.semilla.map((valores) => filaDesdeRegistro_(
    campos.reduce((registro, campo, i) => ({ ...registro, [campo]: valores[i] }), {}), columnas, numColumnas));
  hoja.getRange(2, 1, filas.length, numColumnas).setValues(filas);
};

// Config: añade al final las claves de la semilla que falten, sin tocar las existentes ni sus valores
// (las claves nuevas de cada versión llegan a producción con "Reparar hojas").
const anadirClavesConfigQueFaltan_ = (hoja, definicion) => {
  if (definicion.nombre !== HOJA_CONFIG || hoja.getLastRow() < 2) return [];
  const tabla = leerTabla_(HOJA_CONFIG);
  const existentes = new Set(tabla.entradas.map((e) => texto_(e.registro.clave)));
  const nuevas = definicion.semilla.filter(([clave]) => !existentes.has(clave));
  anadirRegistros_(tabla, nuevas.map(([clave, valor, descripcion]) => ({ clave, valor, descripcion })));
  return nuevas.map(([clave]) => clave);
};

// Crea las hojas que falten, añade las columnas que falten y siembra las vacías. Idempotente y sin tocar datos (RF-72).
const inicializarBaseDeDatos = (e) => ejecutarTareaDelSistema_('inicializarBaseDeDatos', e, () => {
  const libro = obtenerSpreadsheet_();
  const resultado = { creadas: [], existentes: [], columnasAnadidas: {} };
  ESQUEMA_HOJAS.forEach((definicion) => {
    const existente = libro.getSheetByName(definicion.nombre);
    const hoja = existente || libro.insertSheet(definicion.nombre);
    const faltan = anadirColumnasQueFaltan_(hoja, Object.values(definicion.campos));
    if (existente && faltan.length > 0) resultado.columnasAnadidas[definicion.nombre] = faltan;
    hoja.setFrozenRows(1);
    sembrarSiVacia_(hoja, definicion);
    const clavesNuevas = anadirClavesConfigQueFaltan_(hoja, definicion);
    if (clavesNuevas.length > 0) resultado.clavesConfigAnadidas = clavesNuevas;
    resultado[existente ? 'existentes' : 'creadas'].push(definicion.nombre);
  });
  eliminarHojaPorDefecto_(libro);
  return resultado;
});

// Elimina la hoja vacía que crea Google al nacer el documento ("Hoja 1"/"Sheet1").
const eliminarHojaPorDefecto_ = (libro) => {
  const residuales = ['Hoja 1', 'Hoja1', 'Sheet1'];
  libro.getSheets()
    .filter((hoja) => residuales.includes(hoja.getName()) && hoja.getLastRow() === 0)
    .forEach((hoja) => { if (libro.getSheets().length > 1) libro.deleteSheet(hoja); });
};

// Trigger simple: menú del Sheet para inicializar sin abrir el editor.
const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('KAF Rent')
    .addItem('Inicializar / reparar hojas', 'inicializarBaseDeDatos')
    .addItem('Comprobar la conexión con SES', 'comprobarConexionSES')
    .addToUi();
};

// Ventana con el resultado si se lanzó desde el menú del Sheet; desde el editor no hay interfaz y va al registro.
const mostrarEnSheet_ = (mensaje) => {
  try {
    SpreadsheetApp.getUi().alert(mensaje);
  } catch (error) {
    console.log(mensaje);
  }
};
