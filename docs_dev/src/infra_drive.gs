// Capa: INFRAESTRUCTURA — adaptador de Google Drive: carpetas por espacio/reserva y guardado de archivos (ADR-0014).

const TIPOS_CONTRATO = ['pdf', 'jpg', 'jpeg', 'png', 'heic'];
const NOMBRE_CARPETA_CONTRATO = 'Contrato';
const TIPOS_VIDEO = ['mp4', 'mov', 'm4v'];
const BYTES_POR_MB = 1024 * 1024;

const extensionDe_ = (nombre) => String(nombre || '').split('.').pop().toLowerCase();

// Validación del archivo recibido del cliente (formato y tamaño) antes de tocar Drive.
const validarArchivo_ = (archivo, tiposPermitidos, maxMB) => {
  if (!archivo || !archivo.datosBase64) return invalido_('No se recibió ningún archivo.');
  if (!tiposPermitidos.includes(extensionDe_(archivo.nombre))) return invalido_(`Formato no permitido. Usa: ${tiposPermitidos.join(', ')}.`);
  if (maxMB && (archivo.datosBase64.length * 3) / 4 > maxMB * BYTES_POR_MB) return invalido_(`El archivo supera el máximo de ${maxMB} MB.`);
  return valido_();
};

const buscarOcrearSubcarpeta_ = (carpetaPadre, nombre) => {
  const existentes = carpetaPadre.getFoldersByName(nombre);
  return existentes.hasNext() ? existentes.next() : carpetaPadre.createFolder(nombre);
};

const carpetaPorId_ = (claveConfig) => {
  const id = obtenerConfig_(claveConfig);
  if (!id) throw new Error(`Falta ${claveConfig} en Config.`);
  return DriveApp.getFolderById(id);
};

// Documentos / {Espacio} / "KAF. Documentos {NN-AA} - {DDMMAA}".
const carpetaDocumentosReserva_ = (reserva) => {
  const porEspacio = buscarOcrearSubcarpeta_(carpetaPorId_('Carpeta_Documentos_Id'), reserva.espacio);
  return buscarOcrearSubcarpeta_(porEspacio, `KAF. Documentos ${referenciaDrive_(reserva.id)} - ${fechaCorta_(reserva.inicio)}`);
};

// Texto con el que se reconoce la carpeta del espacio en la estructura manual existente:
// la primera palabra del nombre del espacio, truncada a 8 letras ("Piscina", "Habitaci"). Sin nombres en el código (B-10).
const palabraEspacio_ = (espacio) => texto_(espacio).split(/[\s/]/)[0].slice(0, 8);

const buscarSubcarpetaPorTexto_ = (padre, textoBuscado) => {
  const objetivo = String(textoBuscado).toLowerCase();
  const carpetas = padre.getFolders();
  while (carpetas.hasNext()) {
    const carpeta = carpetas.next();
    if (carpeta.getName().toLowerCase().includes(objetivo)) return carpeta;
  }
  return null;
};

// Vídeos / {carpeta del espacio} / "KAF. Videos {NN-AA} - {DDMMAA}", respetando lo que ya exista.
const carpetaVideosReserva_ = (reserva) => {
  const raiz = carpetaPorId_('Carpeta_Videos_Id');
  const palabra = palabraEspacio_(reserva.espacio);
  const porEspacio = buscarSubcarpetaPorTexto_(raiz, palabra) || raiz.createFolder(`KAF. VIdeos in-out - ${palabra}`);
  const ref = referenciaDrive_(reserva.id);
  return buscarSubcarpetaPorTexto_(porEspacio, ref) || porEspacio.createFolder(`KAF. Videos ${ref} - ${fechaCorta_(reserva.inicio)}`);
};

const carpetaJustificantesGasto_ = (ejercicio) =>
  buscarOcrearSubcarpeta_(buscarOcrearSubcarpeta_(carpetaPorId_('Carpeta_Documentos_Id'), 'Gastos'), String(ejercicio));

const guardarArchivo_ = (carpeta, archivo, nombre) => {
  const blob = Utilities.newBlob(Utilities.base64Decode(archivo.datosBase64), archivo.tipoMime, nombre);
  return carpeta.createFile(blob).getUrl();
};

// F-41: Documentos / {Espacio} / "KAF. Documentos {NN-AA} - {DDMMAA}" / Contrato.
const carpetaContratoReserva_ = (reserva) => buscarOcrearSubcarpeta_(carpetaDocumentosReserva_(reserva), NOMBRE_CARPETA_CONTRATO);

const nombreFotoContrato_ = (reserva, archivo, ahora) =>
  `${referenciaDrive_(reserva.id)} - contrato - ${Utilities.formatDate(ahora, zonaHoraria_(), 'ddMMyy-HHmmss')}.${extensionDe_(archivo.nombre)}`;

// ID de Drive de un enlace de carpeta (/folders/ID) o de archivo (/d/ID); null si no lo es.
const idDriveDeUrl_ = (url) => {
  const coincidencia = texto_(url).match(/\/folders\/([\w-]+)|\/d\/([\w-]+)/);
  if (!coincidencia) return null;
  return coincidencia[1] ? { tipo: 'carpeta', id: coincidencia[1] } : { tipo: 'archivo', id: coincidencia[2] };
};

// A la papelera de Drive (recuperable 30 días) la carpeta de fotos o el archivo del contrato.
const enviarContratoAPapelera_ = (url) => {
  const destino = idDriveDeUrl_(url);
  if (!destino) return false;
  (destino.tipo === 'carpeta' ? DriveApp.getFolderById(destino.id) : DriveApp.getFileById(destino.id)).setTrashed(true);
  return true;
};

const nombreVideo_ = (reserva, momento, archivo) =>
  `Video ${momento} ${referenciaDrive_(reserva.id)} ${reserva.nombre} ${fechaCorta_(reserva.inicio)}.${extensionDe_(archivo.nombre)}`;

const TIPOS_FOTO = ['jpg', 'jpeg', 'png', 'heic'];
const TAMANO_MAX_FOTO_MB = 15;

const nombreFotoDesperfecto_ = (reserva, archivo, ahora) =>
  `${referenciaDrive_(reserva.id)} - desperfecto - ${Utilities.formatDate(ahora, zonaHoraria_(), 'ddMMyy-HHmmss')}.${extensionDe_(archivo.nombre)}`;
