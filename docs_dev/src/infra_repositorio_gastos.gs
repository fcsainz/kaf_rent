// Capa: INFRAESTRUCTURA — repositorio de gastos y del resumen fiscal persistido (ADR-0012).

const leerGastos_ = () => registrosDe_(HOJA_GASTOS).map((g) => ({
  id: texto_(g.id), ejercicio: numero_(g.ejercicio), categoria: texto_(g.categoria), espacio: texto_(g.espacio),
  importe: numero_(g.importe), deducible: texto_(g.deducible),
}));

const anadirGasto_ = (gasto) => anadirRegistro_(leerTabla_(HOJA_GASTOS), gasto);

// Reescribe las filas del ejercicio y conserva las de otros ejercicios.
const guardarResumenFiscal_ = (anyo, resumen) => {
  const tabla = leerTabla_(HOJA_RESUMEN_FISCAL);
  const otros = tabla.entradas.filter((e) => String(e.registro.ejercicio) !== String(anyo)).map((e) => e.valores);
  const nuevos = resumen.map((r) => filaDesdeRegistro_({
    ejercicio: anyo, espacio: r.espacio, ingresos: r.ingresos, gastosDeducibles: r.gastosDeducibles, rendimiento: r.rendimiento, tercio: r.tercio,
  }, tabla.columnas, tabla.numColumnas));
  reescribirFilas_(tabla, [...otros, ...nuevos]);
};
