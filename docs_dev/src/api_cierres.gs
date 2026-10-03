// Capa: API — Cerrar días (DD-04 §3.2, F-48): días en que un espacio no se alquila. Bloquean las reservas
// de esos días y no cuentan como abiertos en Estadísticas.

const formatearDia_ = (fecha) => Utilities.formatDate(fecha, zonaHoraria_(), 'dd/MM/yyyy');

const proyeccionCierre_ = (nombresCortos, hoy) => (c) => ({
  id: c.id,
  espacio: nombresCortos.get(c.espacio) || c.espacio,
  desdeTexto: formatearDia_(c.desde),
  hastaTexto: formatearDia_(c.hasta),
  desdeOrden: c.desde.getTime(),
  motivo: c.motivo,
  pasado: c.hasta < hoy,
});

const cargarCierres = () => ejecutarEndpoint_('cargarCierres', {}, () => {
  const espacios = obtenerEspacios_();
  const nombresCortos = new Map(obtenerEspacios_({ soloActivos: false }).map((e) => [e.nombre, e.nombreCorto]));
  const cierres = leerCierres_().sort((a, b) => a.desde - b.desde).map(proyeccionCierre_(nombresCortos, inicioDelDia_(new Date())));
  return { success: true, data: { espacios: espacios.map((e) => ({ nombre: e.nombre, nombreCorto: e.nombreCorto })), cierres } };
}, { errorUsuario: 'No se pudieron cargar los días cerrados.' });

const cerrarDias = (datos) => ejecutarEndpoint_('cerrarDias', { espacio: datos && datos.espacio }, () => {
  const espacios = obtenerEspacios_();
  const validacion = validarCierre_(datos, espacios.map((e) => e.nombre));
  if (!validacion.valido) return { success: false, error: validacion.error };
  return conBloqueo_(() => guardarCierre_(validacion.cierre, espacios.find((e) => e.nombre === validacion.cierre.espacio)));
}, { errorUsuario: 'No se pudieron cerrar los días. Inténtalo de nuevo.' });

// Bajo bloqueo: no puede pisar una reserva ni otro cierre del mismo espacio. Calendar no bloquea (RNF-16).
const guardarCierre_ = (cierre, espacio) => {
  const reserva = reservaEnCierre_(leerReservas_().entradas.map((e) => e.reserva), cierre, espacio.modoFecha);
  if (reserva) {
    return { success: false, error: `Ese espacio tiene la reserva ${referenciaMostrada_(reserva.id)} el ${formatearDia_(reserva.inicio)}. Cancélala o elige otras fechas.` };
  }
  const lectura = leerTablaCierres_();
  const existentes = lectura.entradas.map((e) => e.cierre);
  const solapado = cierreEnDias_(existentes, cierre.espacio, diasDelRango_(cierre.desde, diaSiguiente_(cierre.hasta)));
  if (solapado) return { success: false, error: `Ya hay un cierre en esas fechas (${formatearDia_(solapado.desde)} → ${formatearDia_(solapado.hasta)}: ${solapado.motivo}).` };

  const nuevo = { ...cierre, id: generarIdCierre_(existentes.map((c) => c.id)), registradoPor: obtenerEmailSesion_(), fechaRegistro: new Date() };
  const filaSheet = anadirCierre_(lectura.tabla, nuevo);
  const eventoId = crearEventoCierre_(nuevo, espacio.nombreCorto);
  if (eventoId) guardarEventoCierre_(lectura.tabla, filaSheet, eventoId);
  const respuesta = { success: true, mensaje: `Días cerrados: ${formatearDia_(nuevo.desde)} → ${formatearDia_(nuevo.hasta)}. Recuerda bloquearlos también en la plataforma.` };
  return eventoId ? respuesta : { ...respuesta, aviso: 'Los días se han cerrado, pero no se pudo crear el aviso en el calendario. Avisa al administrador.' };
};

const quitarCierre = (id) => ejecutarEndpoint_('quitarCierre', { id }, () => {
  const lectura = leerTablaCierres_();
  const entrada = lectura.entradas.find((e) => e.cierre.id === texto_(id));
  if (!entrada) return { success: false, error: 'Ese cierre ya no existe. Recarga la pantalla.' };
  quitarFilaCierre_(lectura, entrada.cierre.id);
  eliminarEventoReserva_(entrada.cierre.calendarEventId);
  return { success: true };
}, { bloqueo: true, errorUsuario: 'No se pudo quitar el cierre. Inténtalo de nuevo.' });

// Para Crear Reserva (D-13.3): mensaje si la reserva cae en un día cerrado; '' si no.
const mensajeSiCerrado_ = (entrada) => {
  const cierre = cierreEnDias_(leerCierres_(), entrada.espacio, diasDeReserva_(entrada, entrada.modoFecha));
  return cierre
    ? `Ese espacio está cerrado del ${formatearDia_(cierre.desde)} al ${formatearDia_(cierre.hasta)} (${cierre.motivo}). Si hay que abrirlo, quita el cierre en Reservas → Cerrar días.`
    : '';
};
