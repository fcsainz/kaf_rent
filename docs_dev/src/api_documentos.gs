// Capa: API — subida de contrato y vídeos in/out a Drive desde Gestionar Reserva (HU-28, HU-30, ADR-0014).

const MOMENTOS_VIDEO = ['In', 'Out'];
const VIDEO_POR_MOMENTO = {
  In: { campo: 'videoInUrl', etiqueta: 'Vídeo check-in' },
  Out: { campo: 'videoOutUrl', etiqueta: 'Vídeo check-out' },
};

// Sube el contrato, lo enlaza y lo marca Firmado; no aplica si lo gestiona el canal (RF-54, RF-55).
const subirContrato = (id, archivo) => ejecutarEndpoint_('subirContrato', { id }, () => {
  const validacion = validarArchivo_(archivo, TIPOS_CONTRATO, tamanoMaxContratoMB_());
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  if (entrada.reserva.contratoEstado === CONTRATO.GESTIONADO_CANAL) {
    return { success: false, error: 'El contrato de esta reserva lo gestiona el canal; no hace falta subirlo.' };
  }

  const url = guardarArchivo_(carpetaDocumentosReserva_(entrada.reserva), archivo, nombreContrato_(entrada.reserva, archivo));
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const reserva = { ...entrada.reserva, contratoArchivo: url, contratoEstado: CONTRATO.FIRMADO, modificadoPor: email, fechaModificacion: ahora };
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(reserva.id, [{ campo: ETIQUETAS_EDICION.contratoEstado, anterior: entrada.reserva.contratoEstado, nuevo: CONTRATO.FIRMADO }], email, ahora);
  return { success: true, url };
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
  return { success: true, url };
}, { bloqueo: true, errorUsuario: 'No se pudo subir el vídeo. Si es muy grande, súbelo directamente a Drive.' });
