// Módulo de Gastos y resumen fiscal (rendimiento del capital inmobiliario, reparto a tercios). Ver ADR-0012.
// El sistema registra y agrega; la deducibilidad concreta la confirma el gestor.

const COL_GASTO_ID        = 0;
const COL_GASTO_EJERCICIO = 2;
const COL_GASTO_CATEGORIA = 4;
const COL_GASTO_ESPACIO   = 5;
const COL_GASTO_IMPORTE   = 6;
const COL_GASTO_DEDUCIBLE = 7;

const ESPACIOS_GASTO   = ['Piscina / Jardín', 'Habitación Interior', 'Común'];
const ESPACIOS_INGRESO = ['Piscina / Jardín', 'Habitación Interior'];
const TASA_AMORTIZACION = 0.03;
const NUM_COMUNEROS = 3;

// Endpoint: categorías activas para el desplegable del formulario de gasto.
const cargarCategoriasGasto = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const data = obtenerFilas(obtenerHoja(HOJA_CAT_CATEGORIAS_GASTO))
      .filter((f) => String(f[0]).trim() !== '' && esVerdadero(f[2]))
      .map((f) => ({ nombre: String(f[0]).trim(), deducibleDefault: esVerdadero(f[3]) }));
    return { success: true, data };
  } catch (error) {
    registrarError('cargarCategoriasGasto', error, {});
    return { success: false, error: 'No se pudieron cargar las categorías.' };
  }
};

// Endpoint: registra un gasto y, si se adjunta, sube el justificante a Drive (US-027).
const registrarGasto = (datos, archivo) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const validacion = validarGasto(datos);
    if (!validacion.valido) return { success: false, error: validacion.error };

    const fecha = combinarFechaHora(datos.fecha, '00:00');
    const ejercicio = fecha.getFullYear();

    const bloqueo = LockService.getScriptLock();
    bloqueo.waitLock(20000);
    try {
      const hoja = obtenerHoja(HOJA_GASTOS);
      const id = generarIdGasto(obtenerFilas(hoja), ejercicio);
      const justificante = subirJustificante(archivo, id, datos.concepto, ejercicio, fecha);
      hoja.appendRow([
        id, fecha, ejercicio, String(datos.concepto).trim(), datos.categoria, datos.espacio,
        Number(datos.importe), datos.deducible || 'Sí', String(datos.pagadoPor || '').trim(), justificante, String(datos.notas || '').trim(),
      ]);
      return { success: true, id };
    } finally {
      bloqueo.releaseLock();
    }
  } catch (error) {
    registrarError('registrarGasto', error, datos);
    return { success: false, error: 'No se pudo guardar el gasto. Inténtalo de nuevo.' };
  }
};

const validarGasto = (datos) => {
  if (!datos) return { valido: false, error: 'Faltan los datos del gasto.' };
  if (!datos.fecha || !combinarFechaHora(datos.fecha, '00:00')) return { valido: false, error: 'Indica una fecha válida.' };
  if (!String(datos.concepto || '').trim()) return { valido: false, error: 'El concepto es obligatorio.' };
  if (!datos.categoria) return { valido: false, error: 'Selecciona una categoría.' };
  if (ESPACIOS_GASTO.indexOf(datos.espacio) === -1) return { valido: false, error: 'Selecciona un espacio válido.' };
  if (!(Number(datos.importe) > 0)) return { valido: false, error: 'El importe debe ser mayor que 0.' };
  return { valido: true };
};

const subirJustificante = (archivo, id, concepto, ejercicio, fecha) => {
  if (!archivo || !archivo.datosBase64) return '';
  const validacion = validarArchivo(archivo, TIPOS_CONTRATO, Number(obtenerConfig('Tamano_Max_Contrato_MB', 5)));
  if (!validacion.valido) throw new Error(validacion.error);
  const carpeta = carpetaDeGasto(ejercicio);
  const nombre = `${id} - ${String(concepto).trim()} - ${fechaCorta(fecha)}.${extensionDe(archivo.nombre)}`;
  return guardarArchivo(carpeta, archivo, nombre);
};

// Justificantes en Documentos/Gastos/{Ejercicio} (no se borran: conservación ≥4 años, ADR-0012 §7).
const carpetaDeGasto = (ejercicio) => {
  const idPadre = obtenerConfig('Carpeta_Documentos_Id');
  if (!idPadre) throw new Error('Falta Carpeta_Documentos_Id en Config.');
  const gastos = buscarOcrearSubcarpeta(DriveApp.getFolderById(idPadre), 'Gastos');
  return buscarOcrearSubcarpeta(gastos, String(ejercicio));
};

const generarIdGasto = (filas, anyo) => {
  const prefijo = `G${anyo}-`;
  const maximo = filas.reduce((max, fila) => {
    const id = String(fila[COL_GASTO_ID]).trim();
    if (!id.startsWith(prefijo)) return max;
    return Math.max(max, parseInt(id.slice(prefijo.length), 10) || 0);
  }, 0);
  return `${prefijo}${String(maximo + 1).padStart(3, '0')}`;
};

// Endpoint: calcula el resumen fiscal del ejercicio por espacio y el tercio de cada comunero (US-028).
const calcularResumenFiscal = (ejercicio) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const anyo = Number(ejercicio);
    if (!anyo) return { success: false, error: 'Indica un ejercicio válido.' };

    const reservas = obtenerFilas(obtenerHoja(HOJA_RESERVAS)).filter((f) =>
      String(f[COL_RES_ESTADO]).trim() !== ESTADO_RESERVA_CANCELADA && aFecha(f[COL_RES_INICIO]).getFullYear() === anyo);
    const gastos = obtenerFilas(obtenerHoja(HOJA_GASTOS)).filter((f) => Number(f[COL_GASTO_EJERCICIO]) === anyo);

    const amortizacionAnual = calcularAmortizacion();
    const resumen = ESPACIOS_INGRESO.map((espacio) => resumenDeEspacio(espacio, reservas, gastos, amortizacionAnual));

    guardarResumenFiscal(anyo, resumen);
    return { success: true, data: { ejercicio: anyo, resumen, porCategoria: agruparGastosPorCategoria(gastos), amortizacionAnual } };
  } catch (error) {
    registrarError('calcularResumenFiscal', error, { ejercicio });
    return { success: false, error: 'No se pudo calcular el resumen fiscal.' };
  }
};

const resumenDeEspacio = (espacio, reservas, gastos, amortizacionAnual) => {
  const delEspacio = reservas.filter((f) => String(f[COL_RES_ESPACIO]).trim() === espacio);
  const ingresos = delEspacio.reduce((s, f) => s + (Number(f[COL_RES_BRUTO]) || 0), 0);
  const comisiones = delEspacio.reduce((s, f) => s + (Number(f[COL_RES_COMISION_IMP]) || 0), 0);

  const deducibles = gastos.filter((f) => esVerdadero(f[COL_GASTO_DEDUCIBLE]));
  const propios = sumaImporteGastos(deducibles.filter((f) => String(f[COL_GASTO_ESPACIO]).trim() === espacio));
  const comunes = sumaImporteGastos(deducibles.filter((f) => String(f[COL_GASTO_ESPACIO]).trim() === 'Común')) / ESPACIOS_INGRESO.length;
  const amortizacion = amortizacionAnual / ESPACIOS_INGRESO.length;

  const gastosDeducibles = comisiones + propios + comunes + amortizacion;
  const rendimiento = ingresos - gastosDeducibles;
  return {
    espacio, ingresos, comisiones, gastosRegistrados: propios + comunes, amortizacion,
    gastosDeducibles, rendimiento, tercio: rendimiento / NUM_COMUNEROS,
  };
};

const sumaImporteGastos = (gastos) => gastos.reduce((s, f) => s + (Number(f[COL_GASTO_IMPORTE]) || 0), 0);

// Amortización anual ≈ 3% del valor de construcción × proporción alquilada (ADR-0012 §6). 0 si faltan datos.
const calcularAmortizacion = () => {
  const valor = Number(obtenerConfig('Valor_Construccion', 0)) || 0;
  let proporcion = Number(obtenerConfig('Proporcion_Alquilada', 0)) || 0;
  if (proporcion > 1) proporcion = proporcion / 100;
  return valor * TASA_AMORTIZACION * proporcion;
};

const agruparGastosPorCategoria = (gastos) => {
  const mapa = {};
  gastos.filter((f) => esVerdadero(f[COL_GASTO_DEDUCIBLE])).forEach((f) => {
    const categoria = String(f[COL_GASTO_CATEGORIA]);
    mapa[categoria] = (mapa[categoria] || 0) + (Number(f[COL_GASTO_IMPORTE]) || 0);
  });
  return Object.keys(mapa).map((categoria) => ({ categoria, importe: mapa[categoria] }));
};

// Reescribe las filas del ejercicio en Resumen_Fiscal (ADR-0012 §4).
const guardarResumenFiscal = (anyo, resumen) => {
  const hoja = obtenerHoja(HOJA_RESUMEN_FISCAL);
  const conservar = obtenerFilas(hoja).filter((f) => String(f[0]) !== String(anyo));
  const nuevas = resumen.map((r) => [anyo, r.espacio, r.ingresos, r.gastosDeducibles, r.rendimiento, r.tercio]);
  const filas = conservar.concat(nuevas);
  if (hoja.getLastRow() > 1) hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).clearContent();
  if (filas.length > 0) hoja.getRange(2, 1, filas.length, 6).setValues(filas);
};
