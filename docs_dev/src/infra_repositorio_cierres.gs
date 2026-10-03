// Capa: INFRAESTRUCTURA — repositorio de Dias_Cerrados (DD-04, F-48): días en que un espacio no se alquila.

const aCierre_ = (registro) => ({
  id: texto_(registro.id),
  espacio: texto_(registro.espacio),
  desde: inicioDelDia_(aFecha_(registro.desde)),
  hasta: inicioDelDia_(aFecha_(registro.hasta)),
  motivo: texto_(registro.motivo),
  calendarEventId: texto_(registro.calendarEventId),
});

// Lectura completa para escribir después (quitar un cierre o guardar su evento).
const leerTablaCierres_ = () => {
  const tabla = leerTabla_(HOJA_DIAS_CERRADOS);
  return { tabla, entradas: tabla.entradas.map((e) => ({ ...e, cierre: aCierre_(e.registro) })) };
};

const leerCierres_ = () => leerTablaCierres_().entradas.map((e) => e.cierre).filter((c) => esFechaValida_(c.desde) && esFechaValida_(c.hasta));

const anadirCierre_ = (tabla, cierre) => anadirRegistro_(tabla, cierre);

const guardarEventoCierre_ = (tabla, filaSheet, eventoId) => actualizarCampo_(tabla, filaSheet, 'calendarEventId', eventoId);

// Reescribe la hoja sin la fila del cierre (atómico: escribe primero y limpia después, RNF-14).
const quitarFilaCierre_ = (lectura, id) =>
  reescribirFilas_(lectura.tabla, lectura.entradas.filter((e) => e.cierre.id !== id).map((e) => e.valores));
