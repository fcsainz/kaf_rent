// Capa: INFRAESTRUCTURA — tareas de mantenimiento: copia del Sheet, purga de Logs/Errores, poda de vídeos y de contratos
// (ADR-0013, ADR-0014, ADR-0016, ADR-0023).

const NIVEL_CARPETA_RESERVA = 2; // Vídeos (0) / espacio (1) / reserva (2)
const FORMATO_DIA = 'yyyy-MM-dd';

const listarFicheros_ = (carpeta) => {
  const ficheros = [];
  const it = carpeta.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed()) ficheros.push(f);
  }
  return ficheros;
};

const listarSubcarpetas_ = (carpeta) => {
  const carpetas = [];
  const it = carpeta.getFolders();
  while (it.hasNext()) {
    const c = it.next();
    if (!c.isTrashed()) carpetas.push(c);
  }
  return carpetas;
};

const diaDe_ = (fecha) => Utilities.formatDate(fecha, zonaHoraria_(), FORMATO_DIA);

const copiasDeMasRecienteAMasAntigua_ = (carpeta) =>
  listarFicheros_(carpeta).sort((a, b) => b.getDateCreated() - a.getDateCreated());

// Mínimo 1 por nivel: una clave vacía o a 0 en Config nunca debe mandar todas las copias a la papelera.
const politicaCopias_ = () => ({
  diarias: Math.max(1, obtenerConfigNumero_('Backup_Diarias', 7)),
  semanales: Math.max(1, obtenerConfigNumero_('Backup_Semanales', 4)),
  mensuales: Math.max(1, obtenerConfigNumero_('Backup_Mensuales', 12)),
});

const SEPARADOR_COPIA = ' — backup ';

// Cada origen rota por separado según el prefijo de su nombre; el resto de ficheros de la carpeta no se toca (D-49).
const copiasDe_ = (carpeta, prefijo) =>
  copiasDeMasRecienteAMasAntigua_(carpeta).filter((f) => f.getName().startsWith(prefijo));

const podarCopias_ = (carpeta, prefijo) => {
  const copias = copiasDe_(carpeta, prefijo);
  const conservar = copiasAConservar_(copias.map((f) => diaDe_(f.getDateCreated())), politicaCopias_());
  copias.forEach((f, i) => { if (!conservar.includes(i)) f.setTrashed(true); });
};

const copiarSiToca_ = (carpeta, idOrigen, hoy, guardarCopia) => {
  const prefijo = `${DriveApp.getFileById(idOrigen).getName()}${SEPARADOR_COPIA}`;
  const ultima = copiasDe_(carpeta, prefijo)[0];
  if (tocaCopia_(ultima ? diaDe_(ultima.getDateCreated()) : null, hoy)) {
    const copia = guardarCopia(`${prefijo}${hoy}`);
    registrarLog_('COPIA', USUARIO_SISTEMA, `Copia de seguridad: ${copia.getName()}`);
  }
  podarCopias_(carpeta, prefijo);
};

// D-50 (ADR-0024): el Sheet del Form se guarda como .xlsx; con makeCopy Google podría duplicar también el Form.
const exportarXlsx_ = (idOrigen, nombre) => UrlFetchApp.fetch(
  `https://docs.google.com/spreadsheets/d/${idOrigen}/export?format=xlsx`,
  { headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` } },
).getBlob().setName(nombre);

const copiaSeguridadSheet_ = (ahora) => {
  const carpeta = carpetaPorId_('Carpeta_Backups_Id');
  const hoy = diaDe_(ahora);
  const idSheet = obtenerSpreadsheet_().getId();
  copiarSiToca_(carpeta, idSheet, hoy, (nombre) => DriveApp.getFileById(idSheet).makeCopy(nombre, carpeta));
  const idViajeros = texto_(obtenerConfig_('Sheet_Viajeros_Id', ''));
  if (idViajeros) copiarSiToca_(carpeta, idViajeros, hoy, (nombre) => carpeta.createFile(exportarXlsx_(idViajeros, `${nombre}.xlsx`)));
};

// Elimina las filas cuya fecha supera el periodo de retención, reescribiendo sin dejar la hoja vacía.
const purgarPorAntiguedad_ = (nombreHoja, dias, ahora) => {
  const tabla = leerTabla_(nombreHoja);
  const limite = ahora.getTime() - dias * MS_POR_DIA;
  const conservar = tabla.entradas.filter((e) => aFecha_(e.registro.fecha).getTime() >= limite);
  if (conservar.length === tabla.entradas.length) return;
  reescribirFilas_(tabla, conservar.map((e) => e.valores));
};

// Manda a la papelera los vídeos antiguos y las carpetas de reserva que queden vacías por ello (B-07).
const podarCarpeta_ = (carpeta, limite, nivel) => {
  let borrados = 0;
  listarFicheros_(carpeta)
    .filter((f) => f.getDateCreated().getTime() < limite)
    .forEach((f) => { f.setTrashed(true); borrados += 1; });
  listarSubcarpetas_(carpeta).forEach((sub) => podarCarpeta_(sub, limite, nivel + 1));
  const vacia = listarFicheros_(carpeta).length === 0 && listarSubcarpetas_(carpeta).length === 0;
  if (nivel === NIVEL_CARPETA_RESERVA && borrados > 0 && vacia) carpeta.setTrashed(true);
};

const purgarVideosAntiguos_ = (ahora) => {
  if (!obtenerConfig_('Carpeta_Videos_Id')) return;
  const limite = ahora.getTime() - obtenerConfigNumero_('Retencion_Videos_Dias', 180) * MS_POR_DIA;
  podarCarpeta_(carpetaPorId_('Carpeta_Videos_Id'), limite, 0);
};

const ETIQUETA_FOTOS_CONTRATO = 'Fotos del contrato';
const ANIOS_RETENCION_CONTRATO_DEFECTO = 5;

// F-41 (ADR-0023): manda a la papelera las fotos del contrato caducadas, vacía el enlace y lo deja en el historial.
// Caducan muy pocas cada noche: se escriben de una en una (KISS), y un fallo de Drive no frena las demás.
const purgarContratosAntiguos_ = (ahora) => {
  const anios = obtenerConfigNumero_('Anios_Retencion_Contrato', ANIOS_RETENCION_CONTRATO_DEFECTO);
  const lectura = leerReservas_();
  lectura.entradas.filter(({ reserva }) => contratoCaducado_(reserva, ahora, anios)).forEach((entrada) => {
    const { reserva } = entrada;
    try {
      enviarContratoAPapelera_(reserva.contratoArchivo);
    } catch (error) {
      registrarError_('purgarContratosAntiguos_', error, { id: reserva.id });
      return;
    }
    guardarCampoReserva_(lectura.tabla, entrada.filaSheet, 'contratoArchivo', '');
    registrarHistorial_(reserva.id, [{ campo: ETIQUETA_FOTOS_CONTRATO, anterior: reserva.contratoArchivo, nuevo: `Borradas: más de ${anios} años` }], USUARIO_SISTEMA, ahora);
  });
};
