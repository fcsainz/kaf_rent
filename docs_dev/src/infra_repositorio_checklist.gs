// Capa: INFRAESTRUCTURA — repositorio de checklists (F-14, DD-01): catálogo de puntos y registro por reserva.
// Registro: una fila por checklist (reserva + momento) con los puntos en JSON (TD-02, ADR-0020).

const PUNTO_OBSERVACIONES = 'OBSERVACIONES';

const leerCatalogoChecklist_ = () => registrosDe_(HOJA_CAT_CHECKLIST);

const buscarFilaChecklist_ = (tabla, idReserva, momento) =>
  tabla.entradas.find((e) => texto_(e.registro.idReserva) === idReserva && texto_(e.registro.momento) === momento) || null;

// Una celda ilegible se notifica: guardar encima perdería lo marcado.
const puntosGuardados_ = (entrada) => {
  if (!entrada) return [];
  try {
    return JSON.parse(texto_(entrada.registro.puntos) || '[]');
  } catch (error) {
    throw new Error(`Puntos ilegibles en ${HOJA_CHECKLISTS_RESERVA} (fila ${entrada.filaSheet}): ${error.message}`);
  }
};

// Puntos marcados + una entrada OBSERVACIONES con el texto libre.
const leerRegistroChecklist_ = (idReserva, momento) => {
  const entrada = buscarFilaChecklist_(leerTabla_(HOJA_CHECKLISTS_RESERVA), idReserva, momento);
  if (!entrada) return [];
  return [
    ...puntosGuardados_(entrada).map((p) => ({ idPunto: texto_(p.idPunto), estado: texto_(p.estado), valor: texto_(p.valor) })),
    { idPunto: PUNTO_OBSERVACIONES, estado: '', valor: texto_(entrada.registro.observaciones) },
  ];
};

// Combina los puntos recibidos con los guardados: uno sin cambios conserva quién y cuándo lo marcó.
const combinarPuntos_ = (guardados, recibidos, email, ahora) => {
  const porId = new Map(guardados.map((p) => [p.idPunto, p]));
  recibidos.forEach((p) => {
    const previo = porId.get(p.idPunto);
    const igual = previo && previo.estado === p.estado && previo.valor === texto_(p.valor);
    if (!igual) porId.set(p.idPunto, { idPunto: p.idPunto, estado: p.estado, valor: texto_(p.valor), usuario: email, fecha: ahora.toISOString() });
  });
  return [...porId.values()];
};

// Escribe solo la fila de esta checklist (RNF-14).
const guardarRegistroChecklist_ = (idReserva, momento, puntos, email, ahora) => {
  const tabla = leerTabla_(HOJA_CHECKLISTS_RESERVA);
  const entrada = buscarFilaChecklist_(tabla, idReserva, momento);
  const observaciones = puntos.find((p) => p.idPunto === PUNTO_OBSERVACIONES);
  const recibidos = puntos.filter((p) => p.idPunto !== PUNTO_OBSERVACIONES);
  const registro = {
    idReserva,
    momento,
    puntos: JSON.stringify(combinarPuntos_(puntosGuardados_(entrada), recibidos, email, ahora)),
    observaciones: observaciones ? texto_(observaciones.valor) : texto_(entrada?.registro.observaciones),
    usuario: email,
    fecha: ahora,
  };
  if (entrada) actualizarRegistro_(tabla, entrada, registro);
  else anadirRegistro_(tabla, registro);
};
