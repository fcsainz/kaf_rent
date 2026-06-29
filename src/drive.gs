// Subida de archivos a Drive: contratos y vídeos in/out, organizados por Espacio/reserva. Ver ADR-0014.

const TIPOS_CONTRATO = ['pdf', 'jpg', 'jpeg', 'png'];
const TIPOS_VIDEO    = ['mp4', 'mov', 'm4v'];

// Endpoint: sube el contrato firmado, lo enlaza en la reserva y marca el contrato como Firmado (US-017).
const subirContrato = (id, archivo) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const validacion = validarArchivo(archivo, TIPOS_CONTRATO, Number(obtenerConfig('Tamano_Max_Contrato_MB', 5)));
    if (!validacion.valido) return { success: false, error: validacion.error };

    const hoja = obtenerHoja(HOJA_RESERVAS);
    const loc = localizarReserva(hoja, id);
    if (!loc) return { success: false, error: 'No se encontró la reserva.' };
    const fila = loc.valores;

    const corta = fechaCorta(aFecha(fila[COL_RES_INICIO]));
    const carpeta = carpetaDeReserva(obtenerConfig('Carpeta_Documentos_Id'), String(fila[COL_RES_ESPACIO]), referenciaDrive(id), corta, 'Documentos');
    const url = guardarArchivo(carpeta, archivo, `${referenciaDrive(id)} - contrato - ${corta}.${extensionDe(archivo.nombre)}`);

    const anterior = fila[COL_RES_CONTRATO_ESTADO];
    fila[COL_RES_CONTRATO_ARCHIVO] = url;
    fila[COL_RES_CONTRATO_ESTADO] = CONTRATO_FIRMADO;
    fila[COL_RES_MOD_POR] = obtenerEmailSesion();
    fila[COL_RES_FECHA_MOD] = new Date();
    hoja.getRange(loc.filaSheet, 1, 1, fila.length).setValues([fila]);
    registrarHistorial(id, [{ campo: 'Estado del contrato', anterior, nuevo: CONTRATO_FIRMADO }], obtenerEmailSesion());

    return { success: true, url };
  } catch (error) {
    registrarError('subirContrato', error, { id });
    return { success: false, error: 'No se pudo subir el contrato. Inténtalo de nuevo.' };
  }
};

// Endpoint: sube el vídeo de check-in o check-out a la carpeta de la reserva (US-030). 'momento' = 'In' | 'Out'.
const subirVideo = (id, momento, archivo) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    if (momento !== 'In' && momento !== 'Out') return { success: false, error: 'Momento de vídeo no válido.' };
    const validacion = validarArchivo(archivo, TIPOS_VIDEO, 0);
    if (!validacion.valido) return { success: false, error: validacion.error };

    const hoja = obtenerHoja(HOJA_RESERVAS);
    const loc = localizarReserva(hoja, id);
    if (!loc) return { success: false, error: 'No se encontró la reserva.' };
    const fila = loc.valores;

    const corta = fechaCorta(aFecha(fila[COL_RES_INICIO]));
    const ref = referenciaDrive(id);
    const carpeta = carpetaVideosReserva(obtenerConfig('Carpeta_Videos_Id'), String(fila[COL_RES_ESPACIO]), ref, corta);
    const nombre = `Video ${momento} ${ref} ${String(fila[COL_RES_NOMBRE])} ${corta}.${extensionDe(archivo.nombre)}`;
    const url = guardarArchivo(carpeta, archivo, nombre);
    hoja.getRange(loc.filaSheet, (momento === 'In' ? COL_RES_VIDEO_IN : COL_RES_VIDEO_OUT) + 1).setValue(url);

    return { success: true, url };
  } catch (error) {
    registrarError('subirVideo', error, { id, momento });
    return { success: false, error: 'No se pudo subir el vídeo. Si es muy grande, súbelo directamente a Drive.' };
  }
};

const validarArchivo = (archivo, tiposPermitidos, maxMB) => {
  if (!archivo || !archivo.datosBase64) return { valido: false, error: 'No se recibió ningún archivo.' };
  if (tiposPermitidos.indexOf(extensionDe(archivo.nombre)) === -1) {
    return { valido: false, error: `Formato no permitido. Usa: ${tiposPermitidos.join(', ')}.` };
  }
  if (maxMB && (archivo.datosBase64.length * 3 / 4) > maxMB * 1024 * 1024) {
    return { valido: false, error: `El archivo supera el máximo de ${maxMB} MB.` };
  }
  return { valido: true };
};

const extensionDe = (nombre) => String(nombre || '').split('.').pop().toLowerCase();

const referenciaDrive = (id) => referenciaMostrada(id).replace('/', '-');

const fechaCorta = (fecha) => Utilities.formatDate(fecha, obtenerSpreadsheet().getSpreadsheetTimeZone(), 'ddMMyy');

// Busca-o-crea Documentos|Videos / {Espacio} / {carpeta de la reserva}. Ver ADR-0014.
const carpetaDeReserva = (idPadre, espacio, refDrive, corta, etiqueta) => {
  if (!idPadre) throw new Error(`Falta el ID de la carpeta de ${etiqueta} en Config.`);
  const porEspacio = buscarOcrearSubcarpeta(DriveApp.getFolderById(idPadre), espacio);
  return buscarOcrearSubcarpeta(porEspacio, `KAF. ${etiqueta} ${refDrive} - ${corta}`);
};

const buscarOcrearSubcarpeta = (carpetaPadre, nombre) => {
  const existentes = carpetaPadre.getFoldersByName(nombre);
  return existentes.hasNext() ? existentes.next() : carpetaPadre.createFolder(nombre);
};

const guardarArchivo = (carpeta, archivo, nombre) => {
  const blob = Utilities.newBlob(Utilities.base64Decode(archivo.datosBase64), archivo.tipoMime, nombre);
  return carpeta.createFile(blob).getUrl();
};

// Palabra clave del espacio para localizar su subcarpeta (tolerante: "KAF. VIdeos in-out - Piscina|Habitacion").
const palabraEspacio = (espacio) => (String(espacio).indexOf('Habita') !== -1 ? 'Habitaci' : 'Piscina');

const buscarSubcarpetaPorTexto = (padre, texto) => {
  const t = String(texto).toLowerCase();
  const carpetas = padre.getFolders();
  while (carpetas.hasNext()) {
    const carpeta = carpetas.next();
    if (carpeta.getName().toLowerCase().indexOf(t) !== -1) return carpeta;
  }
  return null;
};

// Localiza-o-crea la carpeta de vídeos de la reserva, respetando la estructura manual existente.
const carpetaVideosReserva = (idPadre, espacio, ref, corta) => {
  if (!idPadre) throw new Error('Falta Carpeta_Videos_Id en Config.');
  const padre = DriveApp.getFolderById(idPadre);
  const espacioFolder = buscarSubcarpetaPorTexto(padre, palabraEspacio(espacio)) || padre.createFolder(`KAF. VIdeos in-out - ${palabraEspacio(espacio)}`);
  return buscarSubcarpetaPorTexto(espacioFolder, ref) || espacioFolder.createFolder(`KAF. Videos ${ref} - ${corta}`);
};
