// Capa: DOMINIO — checklists de check-in y check-out (F-14, DD-01), como funciones PURAS.
// Qué puntos salen en cada reserva y cuándo una lista está resuelta. Los puntos viven en Catálogo_Checklist.

const MOMENTO_CHECKLIST = { CHECKIN: 'Check-in', CHECKOUT: 'Check-out' };
const ESTADO_PUNTO = { HECHO: 'Hecho', NO_APLICA: 'No aplica', PENDIENTE: 'Pendiente' };
const TIPO_PUNTO = { CASILLA: 'Casilla', FECHA: 'Fecha', VIDEO: 'Video', FOTO: 'Foto', DANOS: 'Daños' };
// B-19: un punto de daños se responde siempre con una de estas dos opciones; no admite "No aplica".
const RESPUESTA_DANOS = { SIN: 'Sin daños', CON: 'Con daños' };
const CONDICION_PUNTO = { PRONTO: 'Siguiente_Pronto', LEJOS: 'Siguiente_Lejos' };
const SEPARADOR_SERVICIOS = '|';
const RE_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
// Mismo orden que CAMPOS_PUNTO_CHECKLIST (literal: sin dependencias entre ficheros al cargar).
const CAMPOS_FILA_PUNTO = ['id', 'espacio', 'momento', 'bloque', 'punto', 'tipo', 'servicios', 'condicion', 'pareja', 'orden', 'activo'];

const puntoDesdeFila_ = (fila) => CAMPOS_FILA_PUNTO.reduce((p, campo, i) => ({ ...p, [campo]: fila[i] }), {});

const serviciosRequeridos_ = (punto) => texto_(punto.servicios).split(SEPARADOR_SERVICIOS).map(texto_).filter(Boolean);

// Sin servicios requeridos sale siempre; con ellos, si la reserva tiene contratado alguno (barbacoa, extras).
const cumpleServicios_ = (punto, contratados) => {
  const requeridos = serviciosRequeridos_(punto);
  return requeridos.length === 0 || requeridos.some((s) => contratados.includes(s));
};

// Office de la Habitación: reponer si la siguiente reserva llega pronto; recoger entero si no (DD-01 §4).
const cumpleCondicion_ = (punto, diasHastaSiguiente, diasOfficeReponer) => {
  const condicion = texto_(punto.condicion);
  if (!condicion) return true;
  const pronto = diasHastaSiguiente !== null && diasHastaSiguiente <= diasOfficeReponer;
  if (condicion === CONDICION_PUNTO.PRONTO) return pronto;
  if (condicion === CONDICION_PUNTO.LEJOS) return !pronto;
  return true;
};

// Bloques del check-in cuyos puntos registrados son todos "No aplica": no salen en el check-out.
const bloquesNoAplica_ = (puntosCheckin, estadosCheckin) => {
  const porBloque = puntosCheckin.reduce((acc, p) => {
    const estado = estadosCheckin[p.id];
    if (!estado) return acc;
    const previo = acc[p.bloque] || [];
    return { ...acc, [p.bloque]: [...previo, estado] };
  }, {});
  return new Set(Object.keys(porBloque).filter((b) => porBloque[b].every((e) => e === ESTADO_PUNTO.NO_APLICA)));
};

const parejaNoAplica_ = (punto, estadosCheckin) => Boolean(texto_(punto.pareja)) && estadosCheckin[texto_(punto.pareja)] === ESTADO_PUNTO.NO_APLICA;

const puntosAplicables_ = ({ catalogo, espacio, momento, servicios, estadosCheckin, diasHastaSiguiente, diasOfficeReponer }) => {
  const delEspacio = catalogo.filter((p) => esVerdadero_(p.activo) && p.espacio === espacio);
  const ocultos = momento === MOMENTO_CHECKLIST.CHECKOUT
    ? bloquesNoAplica_(delEspacio.filter((p) => p.momento === MOMENTO_CHECKLIST.CHECKIN), estadosCheckin)
    : new Set();
  return delEspacio
    .filter((p) => p.momento === momento
      && cumpleServicios_(p, servicios)
      && cumpleCondicion_(p, diasHastaSiguiente, diasOfficeReponer)
      && !ocultos.has(p.bloque)
      && !parejaNoAplica_(p, estadosCheckin))
    .sort((a, b) => numero_(a.orden) - numero_(b.orden));
};

const esRespuestaDanos_ = (valor) => Object.values(RESPUESTA_DANOS).includes(texto_(valor));

const puntoResuelto_ = (punto, registro) => {
  if (punto.tipo === TIPO_PUNTO.FOTO) return true; // opcional: "si los hay"
  if (!registro) return false;
  if (punto.tipo === TIPO_PUNTO.DANOS) return registro.estado === ESTADO_PUNTO.HECHO && esRespuestaDanos_(registro.valor);
  if (registro.estado === ESTADO_PUNTO.NO_APLICA) return true;
  if (registro.estado !== ESTADO_PUNTO.HECHO) return false;
  return punto.tipo !== TIPO_PUNTO.FECHA || Boolean(texto_(registro.valor));
};

// estados: { idPunto: { estado, valor } }.
const checklistResuelta_ = (puntos, estados) => puntos.every((p) => puntoResuelto_(p, estados[p.id]));

// Estado guardado de un punto de la checklist: fecha ISO o respuesta de daños, según su tipo (B-19).
const estadoPuntoValido_ = (punto, estado, valor) => {
  if (!Object.values(ESTADO_PUNTO).includes(estado)) return false;
  if (punto.tipo === TIPO_PUNTO.FECHA) return valor === '' || RE_FECHA_ISO.test(valor);
  if (punto.tipo === TIPO_PUNTO.DANOS) return estado !== ESTADO_PUNTO.NO_APLICA && (valor === '' || esRespuestaDanos_(valor));
  return true;
};

// Días naturales entre la salida y la siguiente entrada no cancelada del mismo espacio; null si no hay.
const diasHastaSiguienteReserva_ = (reserva, reservas) => {
  const siguientes = reservas
    .filter((r) => r.id !== reserva.id && r.espacio === reserva.espacio && r.estado !== ESTADO_RESERVA.CANCELADA && r.inicio >= reserva.fin)
    .sort((a, b) => a.inicio - b.inicio);
  if (siguientes.length === 0) return null;
  return Math.round((inicioDelDia_(siguientes[0].inicio) - inicioDelDia_(reserva.fin)) / MS_POR_DIA);
};

// ---------- Editor del catálogo (solo Admin, DD-01 §3.3) ----------

const MAX_TEXTO_PUNTO = 200;
const VALORES_ACTIVO_PUNTO = ['Sí', 'No'];
const CAMPOS_EDITABLES_PUNTO = ['bloque', 'punto', 'tipo', 'servicios', 'condicion', 'pareja', 'orden', 'activo'];

const validarPuntoChecklist_ = (p, espaciosValidos) => {
  if (!espaciosValidos.includes(p.espacio)) return invalido_('Espacio no válido.');
  if (!Object.values(MOMENTO_CHECKLIST).includes(p.momento)) return invalido_('Momento no válido.');
  if (!texto_(p.bloque)) return invalido_('Indica el bloque.');
  if (!texto_(p.punto) || texto_(p.punto).length > MAX_TEXTO_PUNTO) return invalido_('Escribe el punto (máximo 200 caracteres).');
  if (!Object.values(TIPO_PUNTO).includes(p.tipo)) return invalido_('Tipo de punto no válido.');
  if (texto_(p.condicion) && !Object.values(CONDICION_PUNTO).includes(texto_(p.condicion))) return invalido_('Condición no válida.');
  if (!VALORES_ACTIVO_PUNTO.includes(p.activo)) return invalido_('Indica si el punto está activo (Sí/No).');
  return valido_();
};

// Aplica sobre un punto solo los campos editables recibidos.
const editarPunto_ = (punto, cambios) => CAMPOS_EDITABLES_PUNTO
  .filter((campo) => cambios[campo] !== undefined)
  .reduce((p, campo) => ({ ...p, [campo]: campo === 'orden' ? numero_(cambios[campo]) : texto_(cambios[campo]) }), punto);

// ID del siguiente punto de un grupo espacio + momento: mismo prefijo ("EXT-IN") y número siguiente.
const nuevoIdPunto_ = (puntosDelGrupo, prefijoPorDefecto) => {
  const prefijo = puntosDelGrupo.length > 0 ? String(puntosDelGrupo[0].id).replace(/-\d+$/, '') : prefijoPorDefecto;
  const maximo = puntosDelGrupo.reduce((max, p) => Math.max(max, parseInt(String(p.id).split('-').pop(), 10) || 0), 0);
  return `${prefijo}-${String(maximo + 1).padStart(2, '0')}`;
};

const siguienteOrden_ = (puntosDelGrupo) => puntosDelGrupo.reduce((max, p) => Math.max(max, numero_(p.orden)), 0) + 1;
