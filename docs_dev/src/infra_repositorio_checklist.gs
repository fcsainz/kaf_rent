// Capa: INFRAESTRUCTURA — repositorio de checklists (F-14, DD-01): catálogo de puntos y registro por reserva.

const PUNTO_OBSERVACIONES = 'OBSERVACIONES';
const FORMATO_FECHA_PUNTO = 'yyyy-MM-dd';

const leerCatalogoChecklist_ = () => registrosDe_(HOJA_CAT_CHECKLIST);

// Sheets convierte '2026-09-27' en fecha al escribir: se devuelve siempre como texto ISO.
const valorPunto_ = (valor) => (esFechaValida_(valor) ? Utilities.formatDate(valor, zonaHoraria_(), FORMATO_FECHA_PUNTO) : texto_(valor));

const leerRegistroChecklist_ = (idReserva, momento) => registrosDe_(HOJA_REGISTRO_CHECKLIST)
  .filter((r) => texto_(r.idReserva) === idReserva && texto_(r.momento) === momento)
  .map((r) => ({ ...r, idPunto: texto_(r.idPunto), estado: texto_(r.estado), valor: valorPunto_(r.valor) }));

const claveRegistro_ = (r) => `${texto_(r.idReserva)}|${texto_(r.momento)}|${texto_(r.idPunto)}`;

// Guarda los puntos recibidos en una sola escritura (RNF-14). Un punto sin cambios conserva quién y cuándo lo marcó.
const guardarRegistroChecklist_ = (idReserva, momento, puntos, email, ahora) => {
  const tabla = leerTabla_(HOJA_REGISTRO_CHECKLIST);
  const actuales = tabla.entradas.map((e) => e.registro);
  const porClave = new Map(actuales.map((r) => [claveRegistro_(r), r]));
  const recibidos = puntos.map((p) => {
    const nuevo = { idReserva, momento, idPunto: p.idPunto, estado: p.estado, valor: texto_(p.valor), usuario: email, fecha: ahora };
    const previo = porClave.get(claveRegistro_(nuevo));
    const igual = previo && texto_(previo.estado) === nuevo.estado && valorPunto_(previo.valor) === nuevo.valor;
    return igual ? previo : nuevo;
  });
  const clavesRecibidas = new Set(recibidos.map(claveRegistro_));
  reescribirRegistros_(tabla, [...actuales.filter((r) => !clavesRecibidas.has(claveRegistro_(r))), ...recibidos]);
};
