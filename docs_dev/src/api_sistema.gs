// Capa: API — entradas del sistema: triggers programados, menú del Sheet y utilidades de editor.
// Son públicas porque Google las invoca por su nombre, pero solo se ejecutan desde un trigger real del proyecto
// o de forma directa por quien tiene acceso al Sheet/editor, nunca desde la Web App (RNF-20).

const HORA_TAREAS_NOCTURNAS = 3;
const DIA_MES_INFORMES = 1;
const HORA_INFORMES = 7;

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
  ejecutarTarea_('recalcularEstadisticas', () => recalcularEstadisticas_(ahora));
  ejecutarTarea_('copiaSeguridadSheet', () => copiaSeguridadSheet_(ahora));
  ejecutarTarea_('purgarLogs', () => purgarPorAntiguedad_(HOJA_LOGS, obtenerConfigNumero_('Retencion_Logs_Dias', 90), ahora));
  ejecutarTarea_('purgarErrores', () => purgarPorAntiguedad_(HOJA_ERRORES, obtenerConfigNumero_('Retencion_Errores_Dias', 365), ahora));
  ejecutarTarea_('purgarVideos', () => purgarVideosAntiguos_(ahora));
  if (tocaActualizarCatalogosSES_(ahora)) ejecutarTarea_('catalogosSES', () => conBloqueo_(actualizarCatalogosSES_));
  return { success: true };
});

// Con la comparativa frente al periodo anterior y al mismo del año anterior (D-41).
const generarInforme_ = (periodo) => {
  const todas = leerReservas_().entradas.map((e) => e.reserva);
  const agregadosDe = (p) => agregarPorEspacioCanal_(reservasDelPeriodo_(todas, p));
  const agregados = agregadosDe(periodo);
  if (agregados.length > 0) archivarInforme_(periodo.periodo, periodo.tipo, agregados);
  const comparados = periodosDeComparacion_(periodo);
  const comparativa = comparativaInforme_({ actual: agregados, anterior: agregadosDe(comparados.anterior), anyoAnterior: agregadosDe(comparados.anyoAnterior) });
  enviarInforme_(periodo, comparativa, comparados);
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
  const sheetViajeros = texto_(obtenerConfig_('Sheet_Viajeros_Id'));
  if (sheetViajeros) ScriptApp.newTrigger('alEnviarFormularioViajeros').forSpreadsheet(sheetViajeros).onFormSubmit().create();
  return {
    success: true,
    mensaje: `Triggers instalados: tareasNocturnas (${HORA_TAREAS_NOCTURNAS}:00 diario), informesProgramados (día ${DIA_MES_INFORMES}, ${HORA_INFORMES}:00), `
      + `procesarComunicacionesSES (cada ${MINUTOS_TAREA_SES} min)${sheetViajeros ? ', alEnviarFormularioViajeros (al enviar el Form de viajeros)' : ' — sin Sheet_Viajeros_Id: falta el activador del Form'}.`,
  };
});

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
