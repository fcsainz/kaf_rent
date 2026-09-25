// Capa: INFRAESTRUCTURA — repositorio de reservas: hojas Reservas, Reserva_Servicios e Historial_Cambios.
// Traduce filas ⇄ objetos de dominio; no contiene reglas de negocio.

const CAMPOS_NUMERICOS_RESERVA = ['adultos', 'menores', 'importeAlquiler', 'serviciosPrecio', 'serviciosCoste', 'bruto',
  'comisionPct', 'comision', 'margenServicios', 'neto', 'costeFijoCanal'];
const CAMPOS_FECHA_RESERVA = ['inicio', 'fin'];
const CAMPOS_FECHA_OPCIONAL_RESERVA = ['fechaRegistro', 'fechaModificacion'];

// Normaliza los tipos de una fila leída (celdas vacías, números guardados como texto, etc.).
const reservaDesdeRegistro_ = (registro) => Object.keys(registro).reduce((reserva, campo) => {
  const valor = registro[campo];
  if (CAMPOS_NUMERICOS_RESERVA.includes(campo)) reserva[campo] = numero_(valor);
  else if (CAMPOS_FECHA_RESERVA.includes(campo)) reserva[campo] = aFecha_(valor);
  else if (CAMPOS_FECHA_OPCIONAL_RESERVA.includes(campo)) reserva[campo] = valor === '' ? '' : aFecha_(valor);
  else reserva[campo] = texto_(valor);
  return reserva;
}, {});

// { tabla, entradas: [{ filaSheet, valores, reserva }] }
const leerReservas_ = () => {
  const tabla = leerTabla_(HOJA_RESERVAS);
  const entradas = tabla.entradas
    .map((e) => ({ ...e, reserva: reservaDesdeRegistro_(e.registro) }))
    .filter((e) => e.reserva.id !== '');
  return { tabla, entradas };
};

const buscarReserva_ = (lectura, id) => lectura.entradas.find((e) => e.reserva.id === texto_(id)) || null;

const anadirReserva_ = (tabla, reserva) => anadirRegistro_(tabla, reserva);

const guardarReserva_ = (tabla, entrada, reserva) => actualizarRegistro_(tabla, entrada, reserva);

const guardarCampoReserva_ = (tabla, filaSheet, campo, valor) => actualizarCampo_(tabla, filaSheet, campo, valor);

// ---------- Líneas de servicio ----------

const leerLineasServicio_ = (idReserva) => registrosDe_(HOJA_RESERVA_SERVICIOS)
  .filter((l) => texto_(l.idReserva) === idReserva)
  .map((l) => ({ nombre: texto_(l.nombre), cantidad: numero_(l.cantidad) || 1, coste: numero_(l.coste), precio: numero_(l.precio) }));

const lineaARegistro_ = (idReserva) => (l) => ({ idReserva, nombre: l.nombre, cantidad: l.cantidad, coste: l.coste, precio: l.precio });

const anadirLineasServicio_ = (idReserva, lineas) =>
  anadirRegistros_(leerTabla_(HOJA_RESERVA_SERVICIOS), lineas.map(lineaARegistro_(idReserva)));

// Sustituye las líneas de una reserva conservando las demás, sin dejar nunca la hoja vacía (B-03).
const reemplazarLineasServicio_ = (idReserva, lineas) => {
  const tabla = leerTabla_(HOJA_RESERVA_SERVICIOS);
  const otras = tabla.entradas.filter((e) => texto_(e.registro.idReserva) !== idReserva).map((e) => e.valores);
  const nuevas = lineas.map(lineaARegistro_(idReserva)).map((r) => filaDesdeRegistro_(r, tabla.columnas, tabla.numColumnas));
  reescribirFilas_(tabla, [...otras, ...nuevas]);
};

// ---------- Historial de cambios (auditoría, ADR-0005) ----------

const registrarHistorial_ = (idReserva, diffs, email, ahora) => {
  if (diffs.length === 0) return;
  anadirRegistros_(leerTabla_(HOJA_HISTORIAL_CAMBIOS),
    diffs.map((d) => ({ fecha: ahora, usuario: email, idReserva, campo: d.campo, anterior: d.anterior, nuevo: d.nuevo })));
};

const leerHistorial_ = (idReserva) => registrosDe_(HOJA_HISTORIAL_CAMBIOS)
  .filter((h) => texto_(h.idReserva) === idReserva)
  .map((h) => ({ fecha: aFecha_(h.fecha), usuario: texto_(h.usuario), campo: texto_(h.campo), anterior: texto_(h.anterior), nuevo: texto_(h.nuevo) }));
