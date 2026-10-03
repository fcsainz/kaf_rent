// Capa: INFRAESTRUCTURA — repositorio de Historico_Informes (acumulado de los informes por email). ADR-0009.
// Estadisticas_Cache ya no se usa desde S36: Estadísticas se calcula al abrir (DD-04).

const archivarInforme_ = (periodo, tipo, agregados) =>
  anadirRegistros_(leerTabla_(HOJA_HISTORICO_INFORMES), agregados.map((a) => ({
    periodo, tipo, espacio: a.espacio, canal: a.canal, numReservas: a.numReservas,
    brutos: a.brutos, comisiones: a.comisiones, netos: a.netos, ocupacion: a.ocupacion ?? '',
  })));
