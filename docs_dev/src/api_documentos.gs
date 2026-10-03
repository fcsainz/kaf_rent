// Capa: API — subida del contrato (fotos, F-41) y de los vídeos in/out a Drive (HU-28, HU-30, ADR-0014).

const MOMENTOS_VIDEO = ['In', 'Out'];
const VIDEO_POR_MOMENTO = {
  In: { campo: 'videoInUrl', etiqueta: 'Vídeo check-in' },
  Out: { campo: 'videoOutUrl', etiqueta: 'Vídeo check-out' },
};

// F-41 (Q-10): el contrato firmado de Exterior se guarda en fotos (o PDF) en la carpeta "Contrato" de la reserva.
// La primera lo marca Firmado, con quién y cuándo; las siguientes se añaden. Se borran a los N años (tarea nocturna).
const subirContrato = (id, archivo) => ejecutarEndpoint_('subirContrato', { id }, () => {
  const validacion = validarArchivo_(archivo, TIPOS_CONTRATO, tamanoMaxContratoMB_());
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  if (esReservaInterior_(entrada.reserva)) return { success: false, error: 'En la Habitación no se firma contrato: se validan las identidades.' };

  const carpeta = carpetaContratoReserva_(entrada.reserva);
  const ahora = new Date();
  guardarArchivo_(carpeta, archivo, nombreFotoContrato_(entrada.reserva, archivo, ahora));
  if (entrada.reserva.contratoEstado === CONTRATO.FIRMADO && entrada.reserva.contratoArchivo) return { success: true, url: entrada.reserva.contratoArchivo };
  const email = obtenerEmailSesion_();
  const reserva = {
    ...entrada.reserva, contratoArchivo: carpeta.getUrl(), contratoEstado: CONTRATO.FIRMADO,
    contratoFirmadoPor: email, contratoFecha: ahora, modificadoPor: email, fechaModificacion: ahora,
  };
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(reserva.id, [{ campo: ETIQUETAS_EDICION.contratoEstado, anterior: entrada.reserva.contratoEstado, nuevo: CONTRATO.FIRMADO }], email, ahora);
  return { success: true, url: reserva.contratoArchivo };
}, { bloqueo: true, errorUsuario: 'No se pudo subir el contrato. Inténtalo de nuevo.' });

// Sube el vídeo de check-in ('In') o check-out ('Out'), guarda su enlace y lo audita (RF-57, RNF-22).
const subirVideo = (id, momento, archivo) => ejecutarEndpoint_('subirVideo', { id, momento }, () => {
  if (!MOMENTOS_VIDEO.includes(momento)) return { success: false, error: 'Momento de vídeo no válido.' };
  const validacion = validarArchivo_(archivo, TIPOS_VIDEO, tamanoMaxVideoMB_());
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };

  const url = guardarArchivo_(carpetaVideosReserva_(entrada.reserva), archivo, nombreVideo_(entrada.reserva, momento, archivo));
  const { campo, etiqueta } = VIDEO_POR_MOMENTO[momento];
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  guardarReserva_(lectura.tabla, entrada, { ...entrada.reserva, [campo]: url, modificadoPor: email, fechaModificacion: ahora });
  registrarHistorial_(entrada.reserva.id, [{ campo: etiqueta, anterior: entrada.reserva[campo], nuevo: url }], email, ahora);
  marcarVideoEnChecklist_(lectura, entrada.reserva, momento, url);
  return { success: true, url };
}, { bloqueo: true, errorUsuario: 'No se pudo subir el vídeo. Si es muy grande, súbelo directamente a Drive.' });
