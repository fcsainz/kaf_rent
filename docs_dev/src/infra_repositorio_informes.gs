// Capa: INFRAESTRUCTURA — repositorio de Estadisticas_Cache (snapshot diario) e Historico_Informes (acumulado). ADR-0009.

const guardarEstadisticas_ = (agregados) => reescribirRegistros_(leerTabla_(HOJA_ESTADISTICAS_CACHE), agregados);

const leerEstadisticas_ = () => registrosDe_(HOJA_ESTADISTICAS_CACHE).map((z) => ({
  zona: texto_(z.zona), totalReservas: numero_(z.totalReservas), ingresosNetos: numero_(z.ingresosNetos),
  actualizado: z.actualizado ? aFecha_(z.actualizado) : null,
}));

const archivarInforme_ = (periodo, tipo, agregados) =>
  anadirRegistros_(leerTabla_(HOJA_HISTORICO_INFORMES), agregados.map((a) => ({
    periodo, tipo, espacio: a.espacio, canal: a.canal, numReservas: a.numReservas,
    brutos: a.brutos, comisiones: a.comisiones, netos: a.netos, ocupacion: '',
  })));
