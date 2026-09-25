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
  return { success: true };
});

const generarInforme_ = (periodo) => {
  const reservas = reservasDelPeriodo_(leerReservas_().entradas.map((e) => e.reserva), periodo);
  const agregados = agregarPorEspacioCanal_(reservas);
  if (agregados.length > 0) archivarInforme_(periodo.periodo, periodo.tipo, agregados);
  enviarInforme_(periodo.tipo, periodo.periodo, agregados);
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
  return { success: true, mensaje: `Triggers instalados: tareasNocturnas (${HORA_TAREAS_NOCTURNAS}:00 diario), informesProgramados (día ${DIA_MES_INFORMES}, ${HORA_INFORMES}:00).` };
});

// Crea los eventos de Calendar que falten en reservas no canceladas (reconciliación, RF-40). Desde el editor.
const sincronizarReservasCalendario = (e) => ejecutarTareaDelSistema_('sincronizarReservasCalendario', e, () => {
  const lectura = leerReservas_();
  const calendario = obtenerCalendario_();
  let creados = 0;
  let omitidos = 0;
  lectura.entradas.forEach(({ reserva, filaSheet }) => {
    if (!esModificable_(reserva) || existeEvento_(calendario, reserva.calendarEventId)) { omitidos += 1; return; }
    const eventoId = crearEventoReserva_(reserva);
    if (!eventoId) { omitidos += 1; return; }
    guardarCampoReserva_(lectura.tabla, filaSheet, 'calendarEventId', eventoId);
    creados += 1;
  });
  return { success: true, creados, omitidos };
});

// Crea las hojas que falten, fija sus cabeceras y siembra los datos iniciales si están vacías. Idempotente (RF-72).
const inicializarBaseDeDatos = (e) => ejecutarTareaDelSistema_('inicializarBaseDeDatos', e, () => {
  const libro = obtenerSpreadsheet_();
  const resultado = { creadas: [], existentes: [] };
  ESQUEMA_HOJAS.forEach((definicion) => {
    const existente = libro.getSheetByName(definicion.nombre);
    const hoja = existente || libro.insertSheet(definicion.nombre);
    const cabeceras = Object.values(definicion.campos);
    hoja.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]).setFontWeight('bold');
    hoja.setFrozenRows(1);
    if (definicion.semilla && hoja.getLastRow() < 2) {
      hoja.getRange(2, 1, definicion.semilla.length, cabeceras.length).setValues(definicion.semilla);
    }
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
    .addToUi();
};
