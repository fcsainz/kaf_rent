// Capa: API — checklists de check-in y check-out (F-14, DD-01): cargar, guardar, confirmar y fotos de desperfectos.

const CAMPO_REVISION_POR_MOMENTO = { 'Check-in': 'checkin', 'Check-out': 'checkout' };
const ETIQUETA_REVISION_POR_MOMENTO = { 'Check-in': 'Check-in revisado', 'Check-out': 'Check-out revisado' };
const MOMENTO_POR_VIDEO = { In: 'Check-in', Out: 'Check-out' };
const MAX_OBSERVACIONES_CHECKLIST = 2000;
const DIAS_OFFICE_REPONER_DEFECTO = 3;

const esMomentoChecklist_ = (momento) => Object.values(MOMENTO_CHECKLIST).includes(momento);

const mapaEstados_ = (registros) => Object.fromEntries(registros.map((r) => [r.idPunto, { estado: r.estado, valor: r.valor }]));

// Puntos que tocan a esta reserva en este momento y lo que ya está registrado.
const contextoChecklist_ = (reserva, reservas, momento) => {
  const estadosCheckin = Object.fromEntries(
    leerRegistroChecklist_(reserva.id, MOMENTO_CHECKLIST.CHECKIN).map((r) => [r.idPunto, r.estado]));
  const registro = leerRegistroChecklist_(reserva.id, momento);
  const puntos = puntosAplicables_({
    catalogo: leerCatalogoChecklist_(),
    espacio: reserva.espacio,
    momento,
    servicios: leerLineasServicio_(reserva.id).map((l) => l.nombre),
    estadosCheckin,
    diasHastaSiguiente: diasHastaSiguienteReserva_(reserva, reservas),
    diasOfficeReponer: obtenerConfigNumero_('Dias_Office_Reponer', DIAS_OFFICE_REPONER_DEFECTO),
  });
  const observaciones = (registro.find((r) => r.idPunto === PUNTO_OBSERVACIONES) || {}).valor || '';
  return { puntos, estados: mapaEstados_(registro), observaciones };
};

const agruparPorBloque_ = (puntos, estados) => puntos.reduce((bloques, p) => {
  const vista = { id: p.id, punto: p.punto, tipo: p.tipo, estado: (estados[p.id] || {}).estado || ESTADO_PUNTO.PENDIENTE, valor: (estados[p.id] || {}).valor || '' };
  const ultimo = bloques[bloques.length - 1];
  if (ultimo && ultimo.nombre === p.bloque) return [...bloques.slice(0, -1), { ...ultimo, puntos: [...ultimo.puntos, vista] }];
  return [...bloques, { nombre: p.bloque, puntos: [vista] }];
}, []);

// Localiza la reserva modificable y valida el momento; devuelve { lectura, entrada } o { error }.
const reservaParaChecklist_ = (id, momento) => {
  if (!esMomentoChecklist_(momento)) return { error: 'Momento de checklist no válido.' };
  return reservaModificable_(id);
};

const cargarChecklist = (id, momento) => ejecutarEndpoint_('cargarChecklist', { id, momento }, () => {
  const { lectura, entrada, error } = reservaParaChecklist_(id, momento);
  if (error) return { success: false, error };
  const reservas = lectura.entradas.map((e) => e.reserva);
  const { puntos, estados, observaciones } = contextoChecklist_(entrada.reserva, reservas, momento);
  return {
    success: true,
    data: {
      momento,
      confirmada: entrada.reserva[CAMPO_REVISION_POR_MOMENTO[momento]] === REVISION.HECHO,
      resueltos: puntos.filter((p) => puntoResuelto_(p, estados[p.id])).length,
      total: puntos.length,
      resuelta: checklistResuelta_(puntos, estados),
      observaciones,
      bloques: agruparPorBloque_(puntos, estados),
    },
  };
});

const validarEstadosChecklist_ = (entrada, puntos, observaciones) => {
  if (!Array.isArray(entrada)) return invalido_('No se recibieron los puntos de la checklist.');
  if (texto_(observaciones).length > MAX_OBSERVACIONES_CHECKLIST) return invalido_('Las observaciones son demasiado largas.');
  const porId = new Map(puntos.map((p) => [p.id, p]));
  const erroneo = entrada.find((e) => {
    const punto = porId.get(texto_(e && e.idPunto));
    return !punto || !estadoPuntoValido_(punto, texto_(e.estado), texto_(e.valor));
  });
  return erroneo ? invalido_('Hay puntos no válidos para esta checklist. Recarga la página e inténtalo de nuevo.') : valido_();
};

const guardarChecklist = (id, momento, estados, observaciones) => ejecutarEndpoint_('guardarChecklist', { id, momento }, () => {
  const { lectura, entrada, error } = reservaParaChecklist_(id, momento);
  if (error) return { success: false, error };
  const { puntos } = contextoChecklist_(entrada.reserva, lectura.entradas.map((e) => e.reserva), momento);
  const validacion = validarEstadosChecklist_(estados, puntos, observaciones);
  if (!validacion.valido) return { success: false, error: validacion.error };
  const registros = [
    ...estados.map((e) => ({ idPunto: texto_(e.idPunto), estado: texto_(e.estado), valor: texto_(e.valor) })),
    { idPunto: PUNTO_OBSERVACIONES, estado: '', valor: texto_(observaciones) },
  ];
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  guardarRegistroChecklist_(entrada.reserva.id, momento, registros, email, ahora);
  const reabierta = reabrirSiQuedanPendientes_(lectura.tabla, entrada, momento, puntos, mapaEstados_(registros), email, ahora);
  return { success: true, reabierta };
}, { bloqueo: true, errorUsuario: 'No se pudo guardar la checklist. Inténtalo de nuevo.' });

// B-18: una checklist terminada que vuelve a tener puntos pendientes deja de estar terminada (y la reserva se recalcula).
const reabrirSiQuedanPendientes_ = (tabla, entrada, momento, puntos, estados, email, ahora) => {
  const campo = CAMPO_REVISION_POR_MOMENTO[momento];
  if (entrada.reserva[campo] !== REVISION.HECHO || checklistResuelta_(puntos, estados)) return false;
  const { reserva, diffs } = aplicarCambios_(entrada.reserva, { ...entrada.reserva, [campo]: REVISION.PENDIENTE }, email, ahora);
  guardarReserva_(tabla, entrada, reserva);
  registrarHistorial_(reserva.id, diffs, email, ahora);
  return true;
};

// Da la lista por terminada (tras la confirmación del usuario): marca Hecho, recalcula el estado y lo audita.
const confirmarChecklist = (id, momento) => ejecutarEndpoint_('confirmarChecklist', { id, momento }, () => {
  const { lectura, entrada, error } = reservaParaChecklist_(id, momento);
  if (error) return { success: false, error };
  const { puntos, estados } = contextoChecklist_(entrada.reserva, lectura.entradas.map((e) => e.reserva), momento);
  const pendientes = puntos.filter((p) => !puntoResuelto_(p, estados[p.id])).length;
  if (pendientes > 0) return { success: false, error: `Faltan ${pendientes} puntos por resolver (marcar o "No aplica").` };
  const email = obtenerEmailSesion_();
  const ahora = new Date();
  const campo = CAMPO_REVISION_POR_MOMENTO[momento];
  const { reserva, diffs } = aplicarCambios_(entrada.reserva, { ...entrada.reserva, [campo]: REVISION.HECHO }, email, ahora);
  guardarReserva_(lectura.tabla, entrada, reserva);
  registrarHistorial_(reserva.id, diffs, email, ahora);
  return { success: true, estado: reserva.estado };
}, { bloqueo: true, errorUsuario: 'No se pudo terminar la checklist. Inténtalo de nuevo.' });

// Marca solo el punto de vídeo o foto de la checklist; un fallo aquí no invalida la subida ya hecha.
const marcarPuntoArchivo_ = (lectura, reserva, momento, tipo, url) => {
  try {
    const { puntos, estados } = contextoChecklist_(reserva, lectura.entradas.map((e) => e.reserva), momento);
    const punto = puntos.find((p) => p.tipo === tipo);
    if (!punto) return;
    const previo = (estados[punto.id] || {}).valor || '';
    const valor = tipo === TIPO_PUNTO.FOTO && previo ? `${previo} | ${url}` : url;
    guardarRegistroChecklist_(reserva.id, momento, [{ idPunto: punto.id, estado: ESTADO_PUNTO.HECHO, valor }], obtenerEmailSesion_(), new Date());
  } catch (error) {
    registrarError_('marcarPuntoArchivo_', error, { id: reserva.id, momento });
  }
};

const marcarVideoEnChecklist_ = (lectura, reserva, momentoVideo, url) =>
  marcarPuntoArchivo_(lectura, reserva, MOMENTO_POR_VIDEO[momentoVideo], TIPO_PUNTO.VIDEO, url);

// Foto de un desperfecto en el check-out: a la carpeta de documentos de la reserva (no se poda) y anotada en la lista.
const subirFotoDesperfecto = (id, archivo) => ejecutarEndpoint_('subirFotoDesperfecto', { id }, () => {
  const validacion = validarArchivo_(archivo, TIPOS_FOTO, TAMANO_MAX_FOTO_MB);
  if (!validacion.valido) return { success: false, error: validacion.error };
  const { lectura, entrada, error } = reservaModificable_(id);
  if (error) return { success: false, error };
  const url = guardarArchivo_(carpetaDocumentosReserva_(entrada.reserva), archivo, nombreFotoDesperfecto_(entrada.reserva, archivo, new Date()));
  marcarPuntoArchivo_(lectura, entrada.reserva, MOMENTO_CHECKLIST.CHECKOUT, TIPO_PUNTO.FOTO, url);
  return { success: true, url };
}, { bloqueo: true, errorUsuario: 'No se pudo subir la foto. Inténtalo de nuevo.' });

// ---------- Editor del catálogo (solo Admin, DD-01 §3.3) ----------

const MENSAJE_SOLO_ADMIN = 'Solo un administrador puede editar las checklists.';
const PREFIJO_PUNTO_NUEVO = 'CHK';

const vistaPuntoCatalogo_ = (p) => ({
  id: texto_(p.id), bloque: texto_(p.bloque), punto: texto_(p.punto), tipo: texto_(p.tipo), servicios: texto_(p.servicios),
  condicion: texto_(p.condicion), pareja: texto_(p.pareja), orden: numero_(p.orden), activo: esVerdadero_(p.activo) ? 'Sí' : 'No',
});

const cargarCatalogoChecklist = (espacio, momento) => ejecutarEndpoint_('cargarCatalogoChecklist', { espacio, momento }, () => {
  if (!sesionEsAdmin_()) return { success: false, error: MENSAJE_SOLO_ADMIN };
  const data = leerCatalogoChecklist_()
    .filter((p) => p.espacio === espacio && p.momento === momento)
    .sort((a, b) => numero_(a.orden) - numero_(b.orden))
    .map(vistaPuntoCatalogo_);
  return { success: true, data };
});

// Con id: edita (incluido activar/desactivar). Sin id: añade un punto al final de su bloque o de un bloque nuevo.
// Nunca borra: un punto usado en reservas se desactiva.
const guardarPuntoChecklist = (datos) => ejecutarEndpoint_('guardarPuntoChecklist', { id: datos && datos.id }, () => {
  if (!sesionEsAdmin_()) return { success: false, error: MENSAJE_SOLO_ADMIN };
  if (!datos) return { success: false, error: 'Faltan los datos del punto.' };
  const tabla = leerTabla_(HOJA_CAT_CHECKLIST);
  const espacios = nombresEspacios_({ soloActivos: false });
  if (texto_(datos.id)) {
    const entrada = tabla.entradas.find((e) => texto_(e.registro.id) === texto_(datos.id));
    if (!entrada) return { success: false, error: 'No se encontró el punto.' };
    const editado = editarPunto_({ ...entrada.registro, activo: esVerdadero_(entrada.registro.activo) ? 'Sí' : 'No' }, datos);
    const validacion = validarPuntoChecklist_(editado, espacios);
    if (!validacion.valido) return { success: false, error: validacion.error };
    actualizarRegistro_(tabla, entrada, editado);
    return { success: true, id: editado.id };
  }
  const grupo = tabla.entradas.map((e) => e.registro).filter((p) => p.espacio === datos.espacio && p.momento === datos.momento);
  const nuevo = editarPunto_({
    id: nuevoIdPunto_(grupo, PREFIJO_PUNTO_NUEVO), espacio: texto_(datos.espacio), momento: texto_(datos.momento),
    tipo: TIPO_PUNTO.CASILLA, servicios: '', condicion: '', pareja: '', orden: siguienteOrden_(grupo), activo: 'Sí',
  }, datos);
  const validacion = validarPuntoChecklist_(nuevo, espacios);
  if (!validacion.valido) return { success: false, error: validacion.error };
  anadirRegistro_(tabla, nuevo);
  return { success: true, id: nuevo.id };
}, { bloqueo: true, errorUsuario: 'No se pudo guardar el punto. Inténtalo de nuevo.' });
