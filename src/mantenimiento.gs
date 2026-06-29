// Mantenimiento programado: estadísticas, copia de seguridad y purga de Logs/Errores/vídeos. Ver ADR-0013.
// Un único trigger nocturno (03:00) orquesta todo; cada tarea es independiente y tolerante a fallo.

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const tareasNocturnas = () => {
  ejecutarTarea('recalcularEstadisticas', recalcularEstadisticas);
  ejecutarTarea('copiaSeguridadSheet', copiaSeguridadSheet);
  ejecutarTarea('purgarLogs', () => purgarHojaPorFecha(HOJA_LOGS, Number(obtenerConfig('Retencion_Logs_Dias', 90))));
  ejecutarTarea('purgarErrores', () => purgarHojaPorFecha(HOJA_ERRORES, Number(obtenerConfig('Retencion_Errores_Dias', 365))));
  ejecutarTarea('purgarVideos', purgarVideosAntiguos);
};

const ejecutarTarea = (nombre, fn) => {
  try {
    fn();
  } catch (error) {
    registrarError(`tareasNocturnas:${nombre}`, error, {});
  }
};

// Copia el Sheet a la carpeta de backups cada Backup_Cada_Dias y conserva las últimas Backup_Max_Copias.
const copiaSeguridadSheet = () => {
  const idCarpeta = obtenerConfig('Carpeta_Backups_Id');
  if (!idCarpeta) throw new Error('Falta Carpeta_Backups_Id en Config.');
  const carpeta = DriveApp.getFolderById(idCarpeta);

  if (!tocaCopia(carpeta, Number(obtenerConfig('Backup_Cada_Dias', 2)))) return;

  const nombre = `BBDD_KAF_Rent — backup ${Utilities.formatDate(new Date(), obtenerSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd')}`;
  DriveApp.getFileById(obtenerSpreadsheet().getId()).makeCopy(nombre, carpeta);
  podarCopias(carpeta, Number(obtenerConfig('Backup_Max_Copias', 15)));
};

const tocaCopia = (carpeta, cadaDias) => {
  const ficheros = carpeta.getFiles();
  let masReciente = 0;
  while (ficheros.hasNext()) {
    masReciente = Math.max(masReciente, ficheros.next().getDateCreated().getTime());
  }
  return masReciente === 0 || (new Date().getTime() - masReciente) >= cadaDias * MS_POR_DIA;
};

const podarCopias = (carpeta, maximo) => {
  const ficheros = [];
  const it = carpeta.getFiles();
  while (it.hasNext()) ficheros.push(it.next());
  ficheros.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
  ficheros.slice(maximo).forEach((f) => f.setTrashed(true));
};

// Elimina las filas cuya fecha (columna 0) supere el periodo de retención. Reescribe en bloque.
const purgarHojaPorFecha = (nombreHoja, dias) => {
  const hoja = obtenerHoja(nombreHoja);
  const filas = obtenerFilas(hoja);
  if (filas.length === 0) return;
  const limite = new Date().getTime() - dias * MS_POR_DIA;
  const conservar = filas.filter((fila) => aFecha(fila[0]).getTime() >= limite);
  if (conservar.length === filas.length) return;

  hoja.getRange(2, 1, filas.length, hoja.getLastColumn()).clearContent();
  if (conservar.length > 0) hoja.getRange(2, 1, conservar.length, conservar[0].length).setValues(conservar);
};

// Manda a la papelera los vídeos con más de Retencion_Videos_Dias días (ADR-0014).
const purgarVideosAntiguos = () => {
  const idCarpeta = obtenerConfig('Carpeta_Videos_Id');
  if (!idCarpeta) return;
  const limite = new Date().getTime() - Number(obtenerConfig('Retencion_Videos_Dias', 180)) * MS_POR_DIA;
  borrarFicherosAntiguos(DriveApp.getFolderById(idCarpeta), limite);
};

const borrarFicherosAntiguos = (carpeta, limite) => {
  const ficheros = carpeta.getFiles();
  while (ficheros.hasNext()) {
    const fichero = ficheros.next();
    if (fichero.getDateCreated().getTime() < limite) fichero.setTrashed(true);
  }
  const subcarpetas = carpeta.getFolders();
  while (subcarpetas.hasNext()) borrarFicherosAntiguos(subcarpetas.next(), limite);
};

// Instalación de los triggers programados. Ejecutar UNA vez a mano desde el editor.
const instalarTriggers = () => {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tareasNocturnas').timeBased().atHour(3).everyDays(1).create();
  ScriptApp.newTrigger('informesProgramados').timeBased().onMonthDay(1).atHour(7).create();
  return 'Triggers instalados: tareasNocturnas (03:00 diario), informesProgramados (día 1 de cada mes 07:00).';
};
