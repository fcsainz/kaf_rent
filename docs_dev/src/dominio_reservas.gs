// Capa: DOMINIO — reglas de negocio de las reservas, como funciones PURAS: no llaman a servicios de Google
// ni leen la hora actual (se recibe como parámetro). Ver ADR-0003, ADR-0004, ADR-0005, ADR-0014.

// ---------- Valores del dominio ----------
const ESTADO_RESERVA = { ABIERTA: 'Abierta', CERRADA: 'Cerrada', CANCELADA: 'Cancelada' };
// Q-07 (2026-10-03): "Completada" pasa a llamarse "Cerrada". Hasta migrar el Sheet (ponerAlDiaReservas) se leen igual.
const ESTADO_LEGADO_COMPLETADA = 'Completada';
const normalizarEstadoReserva_ = (estado) => (texto_(estado) === ESTADO_LEGADO_COMPLETADA ? ESTADO_RESERVA.CERRADA : texto_(estado));
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
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  checkout: 'Check-out revisado', notas: 'Notas', refCanal: 'Código de reserva del canal',
};
const ETIQUETA_ESTADO = 'Estado de la reserva';
const ETIQUETA_SERVICIOS = 'Servicios extra';
const ETIQUETA_NETO = 'Importe neto';
const ETIQUETA_COBRO_SERVICIOS = 'Cobro de servicios extra';
const ETIQUETA_INICIO = 'Fecha y hora de entrada';
const ETIQUETA_FIN = 'Fecha y hora de salida';

const valido_ = () => ({ valido: true });
const invalido_ = (error) => ({ valido: false, error });

// ---------- Validaciones (RF-19..RF-25, RF-46) ----------

const validarRangoFechas_ = (inicio, fin, hoy) => {
  if (!inicio || !fin) return invalido_('Indica las fechas de la reserva.');
  if (inicio < hoy) return invalido_('La reserva no puede empezar en una fecha pasada.');
  if (fin <= inicio) return invalido_('La fecha/hora de salida debe ser posterior a la de entrada.');
  return { valido: true, inicio, fin };
};

// F-23 (ADR-0019): hora de llegada y de salida obligatorias en todos los espacios.
const validarHoras_ = (datos) => {
  if (!RE_HORA.test(texto_(datos.horaLlegada))) return invalido_('Indica la hora de llegada.');
  if (!RE_HORA.test(texto_(datos.horaSalida))) return invalido_('Indica la hora de salida.');
  return valido_();
};

// Fecha_Hora_Inicio/Fin según el modo del espacio (ADR-0003, ADR-0019).
const construirFechas_ = (modo, datos, hoy) => {
  const horas = validarHoras_(datos);
  if (!horas.valido) return horas;
  if (modo === MODO_FECHA.DIA_HORA) {
    return validarRangoFechas_(
      combinarFechaHora_(datos.fechaUnica, datos.horaLlegada),
      combinarFechaHora_(datos.fechaUnica, datos.horaSalida), hoy);
  }
  if (modo === MODO_FECHA.RANGO_DIAS) {
    return validarRangoFechas_(
      combinarFechaHora_(datos.fechaEntrada, datos.horaLlegada),
      combinarFechaHora_(datos.fechaSalida, datos.horaSalida), hoy);
  }
  return invalido_('El espacio no tiene un modo de fecha válido.');
};

// D-28 (B-22): las reservas por días se guardaron a 00:00 porque no se leía la hora de Config.
// Devuelve las fechas con la hora por defecto, o null si no hay nada que corregir.
const corregirHorasMedianoche_ = (reserva, horas) => {
  const esMedianoche = (f) => f.getHours() === 0 && f.getMinutes() === 0;
  const conHora = (f, hhmm) => {
    const [hora, minuto] = hhmm.split(':').map(Number);
    return new Date(f.getFullYear(), f.getMonth(), f.getDate(), hora, minuto, 0);
  };
  const inicio = esMedianoche(reserva.inicio) ? conHora(reserva.inicio, horas.llegada) : reserva.inicio;
  const fin = esMedianoche(reserva.fin) ? conHora(reserva.fin, horas.salida) : reserva.fin;
  return inicio === reserva.inicio && fin === reserva.fin ? null : { inicio, fin };
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

const MAX_LONGITUD_REF_CANAL = 40;

// RF-88: el código de la reserva en la plataforma; obligatorio si el catálogo del canal lo exige (p. ej. Airbnb).
const validarRefCanal_ = (refCanal, nombreCanal, obligatoria) => {
  const ref = texto_(refCanal);
  if (obligatoria && !ref) return invalido_(`El código de reserva de ${nombreCanal} es obligatorio.`);
  if (ref.length > MAX_LONGITUD_REF_CANAL) return invalido_(`El código de reserva no puede pasar de ${MAX_LONGITUD_REF_CANAL} caracteres.`);
  return valido_();
};

// Al editar, solo es obligatorio si el canal lo exige y la reserva ya lo tenía (las anteriores sin código siguen editándose).
const refCanalObligatoriaAlEditar_ = (canalLaExige, refAnterior) => Boolean(canalLaExige) && texto_(refAnterior) !== '';

const primeraInvalida_ = (validaciones) => validaciones.find((v) => !v.valido) || valido_();

const validarDatosReserva_ = (datos) => (datos
  ? primeraInvalida_([validarImportes_(datos.importeAlquiler, datos.comision), validarHuesped_(datos)])
  : invalido_('Faltan los datos de la reserva.'));

const validarCambiosReserva_ = (cambios) => (cambios
  ? primeraInvalida_([validarHuesped_(cambios), validarImportes_(cambios.importeAlquiler, cambios.comisionPct), validarDominios_(cambios)])
  : invalido_('No hay cambios que guardar.'));

// ---------- Servicios e importes (RF-23, RF-27, RF-49; fórmulas en arc42 §8.2) ----------

// F-43 (Q-14, DI-11 resuelta el 2026-10-03): todo servicio nace Pendiente de cobro; al cobrarlo en Extras se indica
// si fue vía plataforma o presencial. Las líneas anteriores a DD-03 (sin estado) cuentan como cobradas.
const COBRO_SERVICIO = { PENDIENTE: 'Pendiente', COBRADO: 'Cobrado' };
const FORMA_COBRO = { PLATAFORMA: 'Plataforma', PRESENCIAL: 'Presencial' };

const estaPendienteDeCobro_ = (linea) => texto_(linea.cobroEstado) === COBRO_SERVICIO.PENDIENTE;

// El coste y el precio salen SIEMPRE del catálogo (snapshot); nunca del cliente. `actuales`: líneas ya guardadas,
// cuyo estado de cobro se conserva al volver a guardar la reserva.
const resolverLineasServicio_ = (solicitados, catalogo, actuales = []) => {
  if (!Array.isArray(solicitados)) return [];
  return solicitados.reduce((lineas, s) => {
    const servicio = catalogo.find((c) => c.nombre === s.nombre);
    const cantidad = parseInt(s.cantidad, 10);
    if (servicio && cantidad >= 1) {
      const previa = actuales.find((l) => l.nombre === servicio.nombre);
      lineas.push({
        nombre: servicio.nombre, cantidad, coste: servicio.costeUnitario, precio: servicio.precioUnitario,
        cobroEstado: previa ? texto_(previa.cobroEstado) : COBRO_SERVICIO.PENDIENTE, cobroForma: previa ? texto_(previa.cobroForma) : '',
      });
    }
    return lineas;
  }, []);
};

const tieneCobroPendiente_ = (lineas) => lineas.some(estaPendienteDeCobro_);

// F-43: añadir un servicio desde Extras. Si ya estaba, se suman las unidades y vuelve a quedar Pendiente (DI-26).
const anadirLineaServicio_ = (lineas, servicio, cantidad) => {
  const unidades = parseInt(cantidad, 10);
  if (!servicio) return invalido_('Ese servicio no está en el catálogo de este espacio.');
  if (!(unidades >= 1)) return invalido_('Indica cuántas unidades (al menos 1).');
  const previa = lineas.find((l) => l.nombre === servicio.nombre);
  const nueva = {
    nombre: servicio.nombre, cantidad: (previa ? previa.cantidad : 0) + unidades,
    coste: previa ? previa.coste : servicio.costeUnitario, precio: previa ? previa.precio : servicio.precioUnitario,
    cobroEstado: COBRO_SERVICIO.PENDIENTE, cobroForma: '',
  };
  return { valido: true, lineas: previa ? lineas.map((l) => (l === previa ? nueva : l)) : [...lineas, nueva] };
};

// Cobro de servicios extra (F-43): 'cobrado' lo marca con su forma de cobro; 'quitar' lo elimina porque el cliente lo rechazó.
const ACCION_COBRO_SERVICIO = { COBRADO: 'cobrado', QUITAR: 'quitar' };

const aplicarCobroServicio_ = (lineas, nombre, accion, forma) => {
  const linea = lineas.find((l) => l.nombre === nombre);
  if (!linea) return invalido_('Ese servicio ya no está en la reserva. Recarga la pantalla.');
  if (accion === ACCION_COBRO_SERVICIO.QUITAR) return { valido: true, lineas: lineas.filter((l) => l !== linea) };
  if (accion !== ACCION_COBRO_SERVICIO.COBRADO) return invalido_('Acción no válida.');
  if (!Object.values(FORMA_COBRO).includes(forma)) return invalido_('Indica si se cobró vía plataforma o presencial.');
  if (!estaPendienteDeCobro_(linea)) return invalido_('Ese servicio ya está cobrado.');
  return { valido: true, lineas: lineas.map((l) => (l === linea ? { ...l, cobroEstado: COBRO_SERVICIO.COBRADO, cobroForma: forma } : l)) };
};

// "BBQ (Pendiente), Hielo (Cobrado, Presencial)": el cobro de cada servicio, para auditar sus cambios en el historial.
const textoCobroLinea_ = (l) => [texto_(l.cobroEstado) || COBRO_SERVICIO.COBRADO, texto_(l.cobroForma)].filter(Boolean).join(', ');
const resumenCobros_ = (lineas) => lineas.map((l) => `${l.nombre} (${textoCobroLinea_(l)})`).join(', ');

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
    ? ESTADO_RESERVA.CERRADA : ESTADO_RESERVA.ABIERTA;
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
  refCanal: entrada.refCanal,
  contratoFirmadoPor: '',
  contratoFecha: '',
  avisoCheckin: '',
  avisoCheckout: '',
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
  refCanal: c.refCanal === undefined ? texto_(reserva.refCanal) : texto_(c.refCanal),
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
// `previas`: líneas que tenía, para auditar los cambios de su cobro (F-43).
const aplicarServicios_ = (reserva, lineas, email, ahora, previas = []) => {
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
  // Solo los servicios que estaban y siguen: los añadidos o quitados ya quedan en "Servicios extra".
  const enAmbas = (lista, otra) => lista.filter((l) => otra.some((x) => x.nombre === l.nombre));
  const [cobroAntes, cobroDespues] = [resumenCobros_(enAmbas(previas, lineas)), resumenCobros_(enAmbas(lineas, previas))];
  if (cobroAntes !== cobroDespues) diffs.push({ campo: ETIQUETA_COBRO_SERVICIOS, anterior: cobroAntes, nuevo: cobroDespues });
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

// F-34: Estado vacío = todas salvo las canceladas (se ven eligiendo "Cancelada"). `espacio` vacío = todos.
const coincideFiltroGestion_ = (r, { nombre, espacio, estado, cobro, desde, hasta }) => {
  if (nombre && !String(r.nombre).toLowerCase().includes(nombre)) return false;
  if (espacio && r.espacio !== espacio) return false;
  if (estado ? r.estado !== estado : r.estado === ESTADO_RESERVA.CANCELADA) return false;
  if (cobro && r.cobro !== cobro) return false;
  if (desde !== null && r.fin.getTime() < desde) return false;
  if (hasta !== null && r.inicio.getTime() > hasta) return false;
  return true;
};

// Próxima semana / Próximo mes (F-34): desde hoy a las 00:00 hasta dentro de 7 o 30 días a las 23:59.
const DIAS_RANGO_RAPIDO = { semana: 7, mes: 30 };

const rangoRapido_ = (rango, ahora) => {
  const dias = DIAS_RANGO_RAPIDO[rango];
  if (!dias) return { desde: null, hasta: null };
  const hoy = inicioDelDia_(ahora);
  return { desde: hoy.getTime(), hasta: hoy.getTime() + (dias + 1) * MS_POR_DIA - 1 };
};

// Q-16: primero las que no han terminado (en curso y próximas), de la más cercana a la más lejana;
// después las pasadas, de la más reciente a la más antigua.
const ordenarParaGestion_ = (reservas, ahora) => {
  const t = ahora.getTime();
  const vigentes = reservas.filter((r) => r.fin.getTime() >= t).sort((a, b) => a.inicio - b.inicio);
  const pasadas = reservas.filter((r) => r.fin.getTime() < t).sort((a, b) => b.inicio - a.inicio);
  return [...vigentes, ...pasadas];
};

// F-36: página pedida (acotada a las que existen) y el total, para los botones de paginación.
const paginar_ = (lista, pagina, porPagina) => {
  const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const actual = Math.min(Math.max(1, parseInt(pagina, 10) || 1), paginas);
  return { elementos: lista.slice((actual - 1) * porPagina, actual * porPagina), pagina: actual, paginas, total: lista.length };
};

// F-32: las siguientes por fecha de entrada (incluida la que está en curso), sin canceladas.
const proximasReservas_ = (reservas, ahora, cuantas) => reservas
  .filter((r) => r.estado !== ESTADO_RESERVA.CANCELADA && r.fin.getTime() >= ahora.getTime())
  .sort((a, b) => a.inicio - b.inicio)
  .slice(0, cuantas);

const totalPersonas_ = (r) => numero_(r.adultos) + numero_(r.menores);

// ---------- Funciones de la barra de Reservas (F-38, F-39, F-41, F-43; DD-03 §3.5) ----------

const FUNCION_RESERVA = { CHECKIN: 'checkin', CHECKOUT: 'checkout', IDENTIDADES: 'identidades', CONTRATO: 'contrato', EXTRAS: 'extras' };

// `c`: { espaciosInterior: [nombres], partesComunicados: Set(ids), conExtrasPendientes: Set(ids) }.
// admite: qué reservas ofrece la función; pendiente: si aún hay trabajo en ella (para proponerla).
const REGLAS_FUNCION = {
  [FUNCION_RESERVA.CHECKIN]: { admite: () => true, pendiente: (r) => r.checkin !== REVISION.HECHO },
  [FUNCION_RESERVA.CHECKOUT]: { admite: () => true, pendiente: (r) => r.checkout !== REVISION.HECHO },
  [FUNCION_RESERVA.IDENTIDADES]: { admite: (r, c) => c.espaciosInterior.includes(r.espacio), pendiente: (r, c) => !c.partesComunicados.has(r.id) },
  [FUNCION_RESERVA.CONTRATO]: { admite: (r, c) => !c.espaciosInterior.includes(r.espacio), pendiente: (r) => r.contratoEstado !== CONTRATO.FIRMADO },
  // F-43: en Extras también se añaden servicios, así que se ofrecen todas; se proponen las que tienen cobros pendientes.
  [FUNCION_RESERVA.EXTRAS]: { admite: () => true, pendiente: (r, c) => c.conExtrasPendientes.has(r.id) },
};

const esFuncionReserva_ = (funcion) => Object.prototype.hasOwnProperty.call(REGLAS_FUNCION, funcion);

const reservasDeFuncion_ = (funcion, reservas, c) =>
  reservas.filter((r) => esModificable_(r) && REGLAS_FUNCION[funcion].admite(r, c));

// La reserva más cercana a hoy con trabajo pendiente. El check-out propone la última que ya ha empezado
// (la que acaba de irse); el resto, la siguiente que no ha terminado; Extras, la más antigua con cobros pendientes
// o, si no hay, la siguiente (para añadirle servicios).
const propuestaDeFuncion_ = (funcion, reservas, c, ahora) => {
  const t = ahora.getTime();
  const pendientes = reservasDeFuncion_(funcion, reservas, c).filter((r) => REGLAS_FUNCION[funcion].pendiente(r, c));
  const porEntrada = [...pendientes].sort((a, b) => a.inicio - b.inicio);
  if (funcion === FUNCION_RESERVA.EXTRAS && porEntrada.length > 0) return porEntrada[0];
  if (funcion === FUNCION_RESERVA.EXTRAS) {
    return reservasDeFuncion_(funcion, reservas, c).sort((x, y) => x.inicio - y.inicio).find((r) => r.fin.getTime() >= t) || null;
  }
  if (funcion === FUNCION_RESERVA.CHECKOUT) {
    const empezadas = porEntrada.filter((r) => r.inicio.getTime() <= t);
    if (empezadas.length > 0) return empezadas[empezadas.length - 1];
  }
  return porEntrada.find((r) => r.fin.getTime() >= t) || null;
};

// ---------- Avisos (F-37, F-40) ----------

// DI-07: el aviso de check-out se envía durante las 24 h siguientes a la salida; después ya no.
// (Literal: MS_POR_HORA vive en dominio_ses.gs y no se puede usar al cargar.)
const VENTANA_AVISO_CHECKOUT_MS = 24 * 60 * 60 * 1000;

const diasNaturalesEntre_ = (desde, hasta) => Math.round((inicioDelDia_(hasta) - inicioDelDia_(desde)) / MS_POR_DIA);

// F-37 (Q-08): a los N días de la salida sin ingresar y cada N días después (N, 2N, 3N…), sin guardar estado.
const tocaAvisoIngreso_ = (r, ahora, dias) => {
  if (r.estado === ESTADO_RESERVA.CANCELADA || r.cobro === COBRO.INGRESADO || !(dias >= 1)) return false;
  const transcurridos = diasNaturalesEntre_(r.fin, ahora);
  return transcurridos >= dias && transcurridos % dias === 0;
};

// F-40 (DI-07): una sola vez, desde N horas antes de la llegada hasta la hora de llegada.
const tocaAvisoCheckin_ = (r, ahora, horas) => esModificable_(r) && r.checkin !== REVISION.HECHO && !esFechaValida_(r.avisoCheckin)
  && ahora.getTime() >= r.inicio.getTime() - horas * MS_POR_HORA && ahora.getTime() < r.inicio.getTime();

// F-40 (DI-07): una sola vez, desde la hora de salida hasta 24 h después.
const tocaAvisoCheckout_ = (r, ahora) => {
  if (!esModificable_(r) || r.checkout === REVISION.HECHO || esFechaValida_(r.avisoCheckout)) return false;
  const desdeSalida = ahora.getTime() - r.fin.getTime();
  return desdeSalida >= 0 && desdeSalida < VENTANA_AVISO_CHECKOUT_MS;
};

// ---------- Puesta al día (F-45) ----------

const USUARIO_PUESTA_AL_DIA = 'Puesta al día (2026-10-03)';
const CAMPOS_REVISION = ['checkin', 'checkout'];

// Reservas ya terminadas y no canceladas: qué revisiones siguen pendientes.
const revisionesPorPonerAlDia_ = (r, ahora) => (esModificable_(r) && r.fin.getTime() < ahora.getTime()
  ? CAMPOS_REVISION.filter((campo) => r[campo] !== REVISION.HECHO)
  : []);

// Respuesta del Form (adulto) con un código que no casa con ninguna reserva → la única reserva sin código
// cuyo nombre contiene el nombre y el primer apellido de quien responde y que no había terminado al responder.
const reservaParaCodigoForm_ = (respuesta, candidatas) => {
  const nombre = normalizarTexto_(respuesta.nombre);
  const apellido = normalizarTexto_(respuesta.apellido1);
  if (!respuesta.esAdulto || !nombre || !apellido || !texto_(respuesta.codigoReserva)) return null;
  const respondida = aFecha_(respuesta.marcaTemporal).getTime();
  const coinciden = candidatas.filter((r) => {
    const delHuesped = normalizarTexto_(r.nombre);
    return delHuesped.includes(nombre) && delHuesped.includes(apellido) && respondida <= r.fin.getTime();
  });
  return coinciden.length === 1 ? coinciden[0] : null;
};

// F-45: códigos del canal que se pueden poner desde el Form de viajeros. Una respuesta cuyo código no casa con
// ninguna reserva se asigna a la única reserva de Interior sin código que le corresponde (reservaParaCodigoForm_).
// Si no hay una sola, o una reserva recibe dos códigos distintos, no se escribe: se devuelve para revisarla a mano.
const asignarCodigosForm_ = (respuestas, reservas, espaciosInterior) => {
  const conocidos = new Set(reservas.flatMap((r) => [r.refCanal, referenciaMostrada_(r.id)]).map(normalizarCodigoReserva_).filter(Boolean));
  const sinCodigo = reservas.filter((r) => espaciosInterior.includes(r.espacio) && esModificable_(r) && !texto_(r.refCanal));
  const huerfanas = respuestas.filter((r) => r.esAdulto && texto_(r.codigoReserva) && !conocidos.has(normalizarCodigoReserva_(r.codigoReserva)));
  const propuestas = huerfanas.map((respuesta) => ({ respuesta, reserva: reservaParaCodigoForm_(respuesta, sinCodigo) }));
  const codigosPorReserva = propuestas.filter((p) => p.reserva).reduce((mapa, p) => {
    mapa.set(p.reserva.id, new Set([...(mapa.get(p.reserva.id) || []), normalizarCodigoReserva_(p.respuesta.codigoReserva)]));
    return mapa;
  }, new Map());
  const asignables = propuestas.filter((p) => p.reserva && codigosPorReserva.get(p.reserva.id).size === 1);
  const asignaciones = [...new Map(asignables.map((p) => [p.reserva.id, { id: p.reserva.id, codigo: normalizarCodigoReserva_(p.respuesta.codigoReserva) }])).values()];
  return { asignaciones, revisar: propuestas.filter((p) => !asignables.includes(p)).map((p) => p.respuesta.fila) };
};
