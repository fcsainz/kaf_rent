// Capa: API — crear reservas (HU-08..HU-19) y lecturas del Inicio: últimas reservas y buscador (HU-04, HU-06).

const NUM_ULTIMAS_RESERVAS = 5;
// B-14: el fallo de Calendar no bloquea la reserva (RNF-16), pero no puede quedar oculto al usuario.
const AVISO_SIN_EVENTO_CALENDARIO = 'La reserva se ha guardado, pero no se pudo crear su evento en el calendario. Avisa al administrador para que lo revise.';

// Contexto de error sin datos personales del huésped (RNF-34).
const contextoReserva_ = (d) => (d ? { espacio: d.espacio, canal: d.canal, fechaUnica: d.fechaUnica, fechaEntrada: d.fechaEntrada } : {});

const crearReserva = (datos) => ejecutarEndpoint_('crearReserva', contextoReserva_(datos), () => {
  const preparada = prepararReserva_(datos, new Date());
  if (!preparada.valido) return { success: false, error: preparada.error };
  return conBloqueo_(() => guardarReservaNueva_(preparada.entrada, obtenerEmailSesion_(), new Date()));
}, { errorUsuario: 'No se pudo guardar la reserva. Inténtalo de nuevo.' });

// Valida contra los catálogos y el dominio y calcula importes, sin escribir nada (RF-14..RF-28).
const prepararReserva_ = (datos, ahora) => {
  if (!datos) return invalido_('Faltan los datos de la reserva.');
  const espacio = obtenerEspacios_().find((e) => e.nombre === datos.espacio);
  if (!espacio) return invalido_('El espacio seleccionado no es válido.');
  const canal = obtenerCanalesActivos_(datos.espacio).find((c) => c.nombre === datos.canal);
  if (!canal) return invalido_('El canal seleccionado no es válido para este espacio.');
  const ref = validarRefCanal_(datos.refCanal, canal.nombre, canal.requiereRef);
  if (!ref.valido) return ref;

  const horas = { checkIn: obtenerConfig_('Hora_CheckIn_Default', '16:00'), checkOut: obtenerConfig_('Hora_CheckOut_Default', '12:00') };
  const fechas = construirFechas_(espacio.modoFecha, datos, horas, inicioDelDia_(ahora));
  if (!fechas.valido) return fechas;
  const validacion = validarDatosReserva_(datos);
  if (!validacion.valido) return validacion;

  return { valido: true, entrada: construirEntradaReserva_(datos, espacio, canal, fechas) };
};

// Datos ya validados + servicios con snapshot del catálogo + importes calculados.
const construirEntradaReserva_ = (datos, espacio, canal, fechas) => {
  const lineas = resolverLineasServicio_(datos.servicios, obtenerServiciosActivos_(espacio.nombre));
  const totales = totalesServicios_(lineas);
  const comisionPct = Number(datos.comision) || 0;
  const importeAlquiler = Number(datos.importeAlquiler);
  return {
    espacio: espacio.nombre, canal: canal.nombre, modoFecha: espacio.modoFecha, gestionContrato: canal.gestionContrato,
    inicio: fechas.inicio, fin: fechas.fin,
    nombre: texto_(datos.nombre), telefono: texto_(datos.telefono), email: texto_(datos.email), refCanal: texto_(datos.refCanal),
    adultos: parseInt(datos.adultos, 10), menores: parseInt(datos.menores, 10) || 0,
    comisionPct, costeFijoCanal: canal.costeFijo, importeAlquiler, lineas, totalesServicios: totales,
    importes: calcularImportes_({ importeAlquiler, serviciosPrecio: totales.precio, serviciosCoste: totales.coste, comisionPct, costeFijoCanal: canal.costeFijo }),
  };
};

// Bajo bloqueo: comprueba el solapamiento contra el Sheet, guarda y, después, sincroniza Calendar y avisa (B-11).
const guardarReservaNueva_ = (entrada, email, ahora) => {
  const lectura = leerReservas_();
  const invitados = obtenerEmailsGestion_(); // Antes de escribir: si falla, no queda nada a medias.
  const reservas = lectura.entradas.map((e) => e.reserva);
  if (haySolapamiento_(reservas, entrada.espacio, entrada.inicio, entrada.fin)) {
    return { success: false, error: obtenerConfig_('Mensaje_Solapamiento', 'Ya existe una reserva para ese espacio en esas fechas.') };
  }
  // D-04: la referencia lleva el año en que se crea la reserva, no el de la estancia (B-15).
  const id = generarIdReserva_(reservas.map((r) => r.id), ahora.getFullYear());
  const reserva = construirReservaNueva_(entrada, { id, email, ahora });
  const filaSheet = anadirReserva_(lectura.tabla, reserva);
  anadirLineasServicio_(id, entrada.lineas);

  const calendarEventId = crearEventoReserva_(reserva, invitados);
  if (calendarEventId) guardarCampoReserva_(lectura.tabla, filaSheet, 'calendarEventId', calendarEventId);
  notificarReservaCreada_(reserva);
  const respuesta = { success: true, id: referenciaMostrada_(id) };
  return calendarEventId ? respuesta : { ...respuesta, aviso: AVISO_SIN_EVENTO_CALENDARIO, incidencia: id };
};

// F-21: el usuario reenvía a los administradores los errores registrados de una reserva. Solo viaja el ID;
// el contenido lo arma el servidor desde la hoja Errores, así que el cliente no puede inyectar nada.
const MAX_ERRORES_INCIDENCIA = 5;
const FORMATO_ID_RESERVA = /^\d{4}-\d{3}$/;

const notificarIncidencia = (id) => ejecutarEndpoint_('notificarIncidencia', { id }, () => {
  if (!FORMATO_ID_RESERVA.test(texto_(id))) return { success: false, error: 'Referencia de incidencia no válida.' };
  const errores = erroresDeReserva_(id).slice(0, MAX_ERRORES_INCIDENCIA);
  if (errores.length === 0) return { success: false, error: 'No hay errores registrados para esta reserva.' };
  const admins = obtenerEmailsSoporte_();
  if (admins.length === 0) return { success: false, error: 'No hay ningún administrador configurado. Avisa a un copropietario.' };
  const enviado = enviarIncidenciaAdmin_({ id, informante: obtenerEmailSesion_(), errores }, admins);
  return enviado ? { success: true } : { success: false, error: 'No se pudo enviar el email. Inténtalo más tarde.' };
}, { errorUsuario: 'No se pudo enviar la incidencia. Inténtalo más tarde.' });

// Proyección ligera para las tablas; incluye claves numéricas para ordenar fechas en el cliente.
const proyeccionListado_ = (r) => ({
  id: referenciaMostrada_(r.id),
  espacio: r.espacio,
  inicioTexto: formatearFechaHora_(r.inicio),
  inicioOrden: r.inicio.getTime(),
  finTexto: formatearFechaHora_(r.fin),
  finOrden: r.fin.getTime(),
  nombre: r.nombre,
  neto: r.neto,
});

const cargarUltimasReservas = () => ejecutarEndpoint_('cargarUltimasReservas', {}, () => {
  const ordenRegistro = (r, i) => (esFechaValida_(r.fechaRegistro) ? r.fechaRegistro.getTime() : i);
  const ultimas = leerReservas_().entradas
    .map((e, i) => ({ reserva: e.reserva, orden: ordenRegistro(e.reserva, i) }))
    .sort((a, b) => b.orden - a.orden)
    .slice(0, NUM_ULTIMAS_RESERVAS)
    .map((x) => proyeccionListado_(x.reserva));
  return { success: true, data: ultimas };
}, { errorUsuario: 'No se pudieron cargar las últimas reservas.' });

// Reservas no canceladas que coinciden por nombre y/o que ocupan la fecha indicada (RF-11, B-02).
const buscarReservas = (filtro) => ejecutarEndpoint_('buscarReservas', {}, () => {
  const nombre = texto_(filtro && filtro.nombre).toLowerCase();
  const dia = filtro && filtro.fecha ? combinarFechaHora_(filtro.fecha, '00:00') : null;
  const encontradas = leerReservas_().entradas
    .map((e) => e.reserva)
    .filter((r) => esModificable_(r) && coincideBusqueda_(r, nombre, dia))
    .map(proyeccionListado_);
  return { success: true, data: encontradas };
}, { errorUsuario: 'No se pudo completar la búsqueda.' });
