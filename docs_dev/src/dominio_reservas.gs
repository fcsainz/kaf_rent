// Capa: DOMINIO — reglas de negocio de las reservas, como funciones PURAS: no llaman a servicios de Google
// ni leen la hora actual (se recibe como parámetro). Ver ADR-0003, ADR-0004, ADR-0005, ADR-0014.

// ---------- Valores del dominio ----------
const ESTADO_RESERVA = { ABIERTA: 'Abierta', COMPLETADA: 'Completada', CANCELADA: 'Cancelada' };
const COBRO = { NO_INGRESADO: 'No ingresado', INGRESADO: 'Ingresado' };
const CONTRATO = { GESTIONADO_CANAL: 'Gestionado por canal', PENDIENTE: 'Pendiente', FIRMADO: 'Firmado' };
const INCIDENCIAS = { SIN: 'Sin incidentes', CON: 'Con incidentes' };
const REVISION = { PENDIENTE: 'Pendiente', HECHO: 'Hecho' };
const SI = 'Sí';
const NO = 'No';
const GESTION_CONTRATO_AUTOMATICA = 'Automática';
const MODO_FECHA = { DIA_HORA: 'Dia_y_Hora', RANGO_DIAS: 'Rango_Dias' };
const RE_TELEFONO = /^\d{9}$/;
const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Valores permitidos en la edición (RF-46, B-04).
const DOMINIOS_EDICION = {
  cobro: [COBRO.NO_INGRESADO, COBRO.INGRESADO],
  contratoEstado: [CONTRATO.GESTIONADO_CANAL, CONTRATO.PENDIENTE, CONTRATO.FIRMADO],
  incidencias: [INCIDENCIAS.SIN, INCIDENCIAS.CON],
  incidenteComunicado: ['', SI, NO],
  compensacion: ['', 'No recibida', 'Recibida'],
  incidenciaResuelta: ['', SI, NO],
  checkin: [REVISION.PENDIENTE, REVISION.HECHO],
  checkout: [REVISION.PENDIENTE, REVISION.HECHO],
};

// Etiqueta legible de cada campo editable, en el orden en que se auditan (Historial_Cambios).
const ETIQUETAS_EDICION = {
  nombre: 'Nombre del huésped', telefono: 'Teléfono', email: 'Email', adultos: 'Adultos', menores: 'Menores',
  importeAlquiler: 'Importe del alquiler', comisionPct: '% Comisión', cobro: 'Estado de cobro',
  contratoEstado: 'Estado del contrato', incidencias: 'Incidencias', incidenteComunicado: 'Incidente comunicado',
  compensacion: 'Compensación de daños', incidenciaResuelta: 'Incidencia resuelta', checkin: 'Check-in revisado',
  checkout: 'Check-out revisado', notas: 'Notas',
};
const ETIQUETA_ESTADO = 'Estado de la reserva';
const ETIQUETA_SERVICIOS = 'Servicios extra';
const ETIQUETA_NETO = 'Importe neto';

const valido_ = () => ({ valido: true });
const invalido_ = (error) => ({ valido: false, error });

// ---------- Validaciones (RF-19..RF-25, RF-46) ----------

const validarRangoFechas_ = (inicio, fin, hoy) => {
  if (!inicio || !fin) return invalido_('Indica las fechas de la reserva.');
  if (inicio < hoy) return invalido_('La reserva no puede empezar en una fecha pasada.');
  if (fin <= inicio) return invalido_('La fecha/hora de salida debe ser posterior a la de entrada.');
  return { valido: true, inicio, fin };
};

// Fecha_Hora_Inicio/Fin según el modo del espacio (ADR-0003). `horas` = horas por defecto de Config para Rango_Dias.
const construirFechas_ = (modo, datos, horas, hoy) => {
  if (modo === MODO_FECHA.DIA_HORA) {
    return validarRangoFechas_(
      combinarFechaHora_(datos.fechaUnica, datos.horaLlegada || '00:00'),
      combinarFechaHora_(datos.fechaUnica, datos.horaSalida || '23:59'), hoy);
  }
  if (modo === MODO_FECHA.RANGO_DIAS) {
    return validarRangoFechas_(
      combinarFechaHora_(datos.fechaEntrada, horas.checkIn),
      combinarFechaHora_(datos.fechaSalida, horas.checkOut), hoy);
  }
  return invalido_('El espacio no tiene un modo de fecha válido.');
};

const validarHuesped_ = (d) => {
  if (!texto_(d.nombre)) return invalido_('El nombre del huésped es obligatorio.');
  if (!(parseInt(d.adultos, 10) >= 1)) return invalido_('Debe haber al menos 1 adulto.');
  if (texto_(d.menores) !== '' && !(parseInt(d.menores, 10) >= 0)) return invalido_('El número de menores no es válido.');
  const telefono = texto_(d.telefono);
  if (telefono && !RE_TELEFONO.test(telefono)) return invalido_('El teléfono debe tener 9 cifras.');
  const email = texto_(d.email);
  if (email && !RE_EMAIL.test(email)) return invalido_('El email no tiene un formato válido.');
  return valido_();
};

const validarImportes_ = (importeAlquiler, comisionPct) => {
  if (!(Number(importeAlquiler) >= 0) || texto_(importeAlquiler) === '') {
    return invalido_('El importe del alquiler debe ser un número mayor o igual que 0.');
  }
  const comision = Number(comisionPct) || 0;
  if (comision < 0 || comision > 100) return invalido_('La comisión debe estar entre 0 y 100.');
  return valido_();
};

const validarDominios_ = (cambios) => {
  const campo = Object.keys(DOMINIOS_EDICION).find((c) => !DOMINIOS_EDICION[c].includes(texto_(cambios[c])));
  return campo ? invalido_(`Valor no permitido en "${ETIQUETAS_EDICION[campo]}".`) : valido_();
};

const primeraInvalida_ = (validaciones) => validaciones.find((v) => !v.valido) || valido_();

const validarDatosReserva_ = (datos) => (datos
  ? primeraInvalida_([validarImportes_(datos.importeAlquiler, datos.comision), validarHuesped_(datos)])
  : invalido_('Faltan los datos de la reserva.'));

const validarCambiosReserva_ = (cambios) => (cambios
  ? primeraInvalida_([validarHuesped_(cambios), validarImportes_(cambios.importeAlquiler, cambios.comisionPct), validarDominios_(cambios)])
  : invalido_('No hay cambios que guardar.'));

// ---------- Servicios e importes (RF-23, RF-27, RF-49; fórmulas en arc42 §8.2) ----------

// El coste y el precio salen SIEMPRE del catálogo (snapshot); nunca del cliente.
const resolverLineasServicio_ = (solicitados, catalogo) => {
  if (!Array.isArray(solicitados)) return [];
  return solicitados.reduce((lineas, s) => {
    const servicio = catalogo.find((c) => c.nombre === s.nombre);
    const cantidad = parseInt(s.cantidad, 10);
    if (servicio && cantidad >= 1) {
      lineas.push({ nombre: servicio.nombre, cantidad, coste: servicio.costeUnitario, precio: servicio.precioUnitario });
    }
    return lineas;
  }, []);
};

const totalesServicios_ = (lineas) => ({
  precio: lineas.reduce((s, l) => s + l.cantidad * l.precio, 0),
  coste: lineas.reduce((s, l) => s + l.cantidad * l.coste, 0),
});

const resumenServicios_ = (lineas) => lineas.map((l) => `${l.nombre} x${l.cantidad}`).join(', ');

// Única fórmula de importes del sistema (REF-01). Si `comisionFija` viene informada no se recalcula
// (servicios añadidos a una reserva existente: acuerdo directo sin el canal, ADR-0003).
const calcularImportes_ = ({ importeAlquiler, serviciosPrecio, serviciosCoste, comisionPct, costeFijoCanal, comisionFija }) => {
  const bruto = numero_(importeAlquiler) + numero_(serviciosPrecio);
  const comision = comisionFija === undefined ? bruto * (numero_(comisionPct) / 100) : numero_(comisionFija);
  return {
    bruto,
    comision,
    margenServicios: numero_(serviciosPrecio) - numero_(serviciosCoste),
    neto: bruto - comision - numero_(serviciosCoste) - numero_(costeFijoCanal),
  };
};

// ---------- Solapamiento, identificadores y referencias (RF-29, RF-31) ----------

// Mismo espacio, no cancelada y rangos que se cruzan (los extremos que se tocan no cuentan).
const haySolapamiento_ = (reservas, espacio, inicio, fin, idExcluido = '') =>
  reservas.some((r) =>
    r.id !== idExcluido &&
    r.espacio === espacio &&
    r.estado !== ESTADO_RESERVA.CANCELADA &&
    inicio < r.fin && r.inicio < fin);

// Correlativo anual 'AAAA-NNN' (ADR-0014).
const generarIdReserva_ = (ids, anyo) => {
  const prefijo = `${anyo}-`;
  const maximo = ids.reduce((max, id) => (String(id).startsWith(prefijo)
    ? Math.max(max, parseInt(String(id).slice(prefijo.length), 10) || 0)
    : max), 0);
  return `${prefijo}${String(maximo + 1).padStart(3, '0')}`;
};

// 'AAAA-NNN' → 'NN/AA' (pantalla) y 'NN-AA' (Drive).
const referenciaMostrada_ = (id) => {
  const [anyo, num] = String(id).split('-');
  return `${String(parseInt(num, 10)).padStart(2, '0')}/${String(anyo).slice(2)}`;
};

const referenciaDrive_ = (id) => referenciaMostrada_(id).replace('/', '-');

const tituloEventoReserva_ = (reserva) => `${referenciaMostrada_(reserva.id)} · ${reserva.espacio} — ${reserva.nombre}`;

// ---------- Ciclo de vida (ADR-0004) ----------

const estadoInicialContrato_ = (gestionContrato) =>
  (gestionContrato === GESTION_CONTRATO_AUTOMATICA ? CONTRATO.GESTIONADO_CANAL : CONTRATO.PENDIENTE);

const calcularEstadoReserva_ = (r) => {
  if (r.estado === ESTADO_RESERVA.CANCELADA) return ESTADO_RESERVA.CANCELADA;
  const sinIncidenciaAbierta = r.incidencias !== INCIDENCIAS.CON || r.incidenciaResuelta === SI;
  // F-14: cerrar exige cobro y check-out hecho (DD-01 §3.5).
  return r.cobro === COBRO.INGRESADO && r.checkout === REVISION.HECHO && sinIncidenciaAbierta
    ? ESTADO_RESERVA.COMPLETADA : ESTADO_RESERVA.ABIERTA;
};

// Qué falta para completar la reserva (RF-51).
const motivosPendientes_ = (r) => {
  if (r.estado === ESTADO_RESERVA.CANCELADA) return [];
  const motivos = [];
  if (r.cobro !== COBRO.INGRESADO) motivos.push('Pendiente de cobro');
  if (r.checkout !== REVISION.HECHO) motivos.push('Check-out sin hacer');
  if (r.incidencias === INCIDENCIAS.CON && r.incidenciaResuelta !== SI) motivos.push('Incidencia sin resolver');
  return motivos;
};

const esModificable_ = (r) => r.estado !== ESTADO_RESERVA.CANCELADA;

// Reserva completa lista para guardar, con su estado inicial (RF-18, RF-32, RF-06).
const construirReservaNueva_ = (entrada, { id, email, ahora }) => ({
  id,
  espacio: entrada.espacio,
  canal: entrada.canal,
  inicio: entrada.inicio,
  fin: entrada.fin,
  nombre: entrada.nombre,
  telefono: entrada.telefono,
  email: entrada.email,
  adultos: entrada.adultos,
  menores: entrada.menores,
  serviciosExtra: resumenServicios_(entrada.lineas),
  importeAlquiler: entrada.importeAlquiler,
  serviciosPrecio: entrada.totalesServicios.precio,
  serviciosCoste: entrada.totalesServicios.coste,
  bruto: entrada.importes.bruto,
  comisionPct: entrada.comisionPct,
  comision: entrada.importes.comision,
  margenServicios: entrada.importes.margenServicios,
  neto: entrada.importes.neto,
  cobro: COBRO.NO_INGRESADO,
  contratoEstado: estadoInicialContrato_(entrada.gestionContrato),
  contratoArchivo: '',
  incidencias: INCIDENCIAS.SIN,
  incidenteComunicado: '',
  compensacion: '',
  incidenciaResuelta: '',
  estado: ESTADO_RESERVA.ABIERTA,
  registroViajeros: entrada.modoFecha === MODO_FECHA.RANGO_DIAS ? REVISION.PENDIENTE : '',
  checkin: REVISION.PENDIENTE,
  checkout: REVISION.PENDIENTE,
  calendarEventId: '',
  notas: '',
  registradoPor: email,
  fechaRegistro: ahora,
  modificadoPor: '',
  fechaModificacion: '',
  videoInUrl: '',
  videoOutUrl: '',
  costeFijoCanal: entrada.costeFijoCanal,
});

// Normaliza los campos editables recibidos del cliente sobre una copia de la reserva.
const normalizarCambios_ = (reserva, c) => ({
  ...reserva,
  nombre: texto_(c.nombre),
  telefono: texto_(c.telefono),
  email: texto_(c.email),
  adultos: parseInt(c.adultos, 10),
  menores: parseInt(c.menores, 10) || 0,
  importeAlquiler: Number(c.importeAlquiler),
  comisionPct: Number(c.comisionPct) || 0,
  cobro: texto_(c.cobro),
  contratoEstado: texto_(c.contratoEstado),
  incidencias: texto_(c.incidencias),
  incidenteComunicado: texto_(c.incidenteComunicado),
  compensacion: texto_(c.compensacion),
  incidenciaResuelta: texto_(c.incidenciaResuelta),
  checkin: texto_(c.checkin),
  checkout: texto_(c.checkout),
  notas: c.notas === undefined || c.notas === null ? '' : String(c.notas),
});

// Aplica una edición: recalcula importes y estado y devuelve la reserva nueva y los cambios a auditar (RF-45..RF-50).
const aplicarCambios_ = (reserva, c, email, ahora) => {
  const editada = normalizarCambios_(reserva, c);
  const importes = calcularImportes_({
    importeAlquiler: editada.importeAlquiler, serviciosPrecio: editada.serviciosPrecio, serviciosCoste: editada.serviciosCoste,
    comisionPct: editada.comisionPct, costeFijoCanal: editada.costeFijoCanal,
  });
  const conImportes = { ...editada, ...importes };
  const nueva = { ...conImportes, estado: calcularEstadoReserva_(conImportes), modificadoPor: email, fechaModificacion: ahora };

  const diffs = Object.keys(ETIQUETAS_EDICION)
    .filter((campo) => String(reserva[campo]) !== String(nueva[campo]))
    .map((campo) => ({ campo: ETIQUETAS_EDICION[campo], anterior: reserva[campo], nuevo: nueva[campo] }));
  if (nueva.estado !== reserva.estado) diffs.push({ campo: ETIQUETA_ESTADO, anterior: reserva.estado, nuevo: nueva.estado });
  return { reserva: nueva, diffs };
};

// Sustituye los servicios de una reserva existente sin recalcular la comisión (RF-49).
const aplicarServicios_ = (reserva, lineas, email, ahora) => {
  const totales = totalesServicios_(lineas);
  const importes = calcularImportes_({
    importeAlquiler: reserva.importeAlquiler, serviciosPrecio: totales.precio, serviciosCoste: totales.coste,
    costeFijoCanal: reserva.costeFijoCanal, comisionFija: reserva.comision,
  });
  const nueva = {
    ...reserva, ...importes, serviciosExtra: resumenServicios_(lineas),
    serviciosPrecio: totales.precio, serviciosCoste: totales.coste, modificadoPor: email, fechaModificacion: ahora,
  };
  const diffs = [];
  if (String(reserva.serviciosExtra) !== nueva.serviciosExtra) diffs.push({ campo: ETIQUETA_SERVICIOS, anterior: reserva.serviciosExtra, nuevo: nueva.serviciosExtra });
  if (numero_(reserva.neto) !== nueva.neto) diffs.push({ campo: ETIQUETA_NETO, anterior: reserva.neto, nuevo: nueva.neto });
  return { reserva: nueva, diffs };
};

const cancelar_ = (reserva, email, ahora) => ({
  reserva: { ...reserva, estado: ESTADO_RESERVA.CANCELADA, modificadoPor: email, fechaModificacion: ahora },
  diffs: [{ campo: ETIQUETA_ESTADO, anterior: reserva.estado, nuevo: ESTADO_RESERVA.CANCELADA }],
});

// ---------- Filtros de búsqueda y listados (RF-11, RF-43) ----------

// Nombre por subcadena sin mayúsculas y/o fecha ocupada (el día cruza el rango de la reserva).
const coincideBusqueda_ = (r, nombre, dia) => {
  if (nombre && !String(r.nombre).toLowerCase().includes(nombre)) return false;
  if (!dia) return true;
  const inicioDia = dia.getTime();
  const finDia = inicioDia + MS_POR_DIA;
  return r.inicio.getTime() < finDia && inicioDia < r.fin.getTime();
};

const coincideFiltroGestion_ = (r, { nombre, desde, hasta }) => {
  if (nombre && !String(r.nombre).toLowerCase().includes(nombre)) return false;
  if (desde !== null && r.fin.getTime() < desde) return false;
  if (hasta !== null && r.inicio.getTime() > hasta) return false;
  return true;
};
