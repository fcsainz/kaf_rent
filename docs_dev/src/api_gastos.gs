// Capa: API — Gastos y resumen fiscal a tercios (HU-33, HU-34, ADR-0012).

// Categorías activas y espacios imputables (los del catálogo + "Común") para el formulario.
const cargarCategoriasGasto = () => ejecutarEndpoint_('cargarCategoriasGasto', {}, () => ({
  success: true,
  data: { categorias: obtenerCategoriasGastoActivas_(), espacios: espaciosDeGasto_(nombresEspacios_()) },
}), { errorUsuario: 'No se pudieron cargar las categorías.' });

// Registra un gasto y, si se adjunta, sube el justificante a Documentos/Gastos/{Ejercicio} (RF-64, RF-65).
const registrarGasto = (datos, archivo) => ejecutarEndpoint_('registrarGasto', { categoria: datos && datos.categoria }, () => {
  const fecha = datos && datos.fecha ? combinarFechaHora_(datos.fecha, '00:00') : null;
  const validacion = validarGasto_(datos, espaciosDeGasto_(nombresEspacios_({ soloActivos: false })), fecha);
  if (!validacion.valido) return { success: false, error: validacion.error };
  if (archivo && archivo.datosBase64) {
    const archivoValido = validarArchivo_(archivo, TIPOS_CONTRATO, tamanoMaxContratoMB_());
    if (!archivoValido.valido) return { success: false, error: archivoValido.error };
  }

  const ejercicio = fecha.getFullYear();
  const id = generarIdGasto_(leerGastos_().map((g) => g.id), ejercicio);
  const concepto = texto_(datos.concepto);
  const justificante = archivo && archivo.datosBase64
    ? guardarArchivo_(carpetaJustificantesGasto_(ejercicio), archivo, `${id} - ${concepto} - ${fechaCorta_(fecha)}.${extensionDe_(archivo.nombre)}`)
    : '';
  anadirGasto_({
    id, fecha, ejercicio, concepto, categoria: texto_(datos.categoria), espacio: datos.espacio, importe: Number(datos.importe),
    deducible: texto_(datos.deducible) || 'Sí', pagadoPor: texto_(datos.pagadoPor), justificante, notas: texto_(datos.notas),
  });
  return { success: true, id };
}, { bloqueo: true, errorUsuario: 'No se pudo guardar el gasto. Inténtalo de nuevo.' });

// Resumen del ejercicio por espacio con el tercio de cada comunero; se persiste en Resumen_Fiscal (RF-66).
const calcularResumenFiscal = (ejercicio) => ejecutarEndpoint_('calcularResumenFiscal', { ejercicio }, () => {
  const anyo = Number(ejercicio);
  if (!anyo) return { success: false, error: 'Indica un ejercicio válido.' };
  const resultado = calcularResumenEjercicio_({
    espacios: nombresEspacios_({ soloActivos: false }),
    reservas: leerReservas_().entradas.map((e) => e.reserva),
    gastos: leerGastos_(),
    anyo,
    valorConstruccion: obtenerConfig_('Valor_Construccion', 0),
    proporcionAlquilada: obtenerConfig_('Proporcion_Alquilada', 0),
  });
  guardarResumenFiscal_(anyo, resultado.resumen);
  return { success: true, data: resultado };
}, { errorUsuario: 'No se pudo calcular el resumen fiscal.' });
