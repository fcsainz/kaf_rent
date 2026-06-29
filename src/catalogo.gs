// Lectura de catálogos en cascada para el formulario de reserva (ADR-0003). Solo lectura, filtra activos.

const COL_ESP_NOMBRE     = 0;
const COL_ESP_ACTIVO     = 1;
const COL_ESP_MODO_FECHA = 2;

const COL_CAN_ESPACIO          = 0;
const COL_CAN_NOMBRE           = 1;
const COL_CAN_ACTIVO           = 2;
const COL_CAN_COMISION_DEFAULT = 3;
const COL_CAN_GESTION_CONTRATO = 4;

const COL_SRV_ESPACIO = 0;
const COL_SRV_NOMBRE  = 1;
const COL_SRV_ACTIVO  = 2;
const COL_SRV_COSTE   = 3;
const COL_SRV_PRECIO  = 4;

const obtenerEspaciosActivos = () => {
  const hoja = obtenerHoja(HOJA_CAT_ESPACIOS);
  if (!hoja) return [];
  return obtenerFilas(hoja)
    .filter((fila) => esVerdadero(fila[COL_ESP_ACTIVO]))
    .map((fila) => ({
      nombre: String(fila[COL_ESP_NOMBRE]).trim(),
      modoFecha: String(fila[COL_ESP_MODO_FECHA]).trim(),
    }));
};

const obtenerCanalesActivos = (espacio) => {
  const hoja = obtenerHoja(HOJA_CAT_CANALES);
  if (!hoja) return [];
  return obtenerFilas(hoja)
    .filter((fila) =>
      String(fila[COL_CAN_ESPACIO]).trim() === espacio &&
      String(fila[COL_CAN_NOMBRE]).trim() !== '' &&
      esVerdadero(fila[COL_CAN_ACTIVO]))
    .map((fila) => ({
      nombre: String(fila[COL_CAN_NOMBRE]).trim(),
      comision: fila[COL_CAN_COMISION_DEFAULT] === '' ? '' : Number(fila[COL_CAN_COMISION_DEFAULT]),
      gestionContrato: String(fila[COL_CAN_GESTION_CONTRATO]).trim(),
    }));
};

const obtenerServiciosActivos = (espacio) => {
  const hoja = obtenerHoja(HOJA_CAT_SERVICIOS);
  if (!hoja) return [];
  return obtenerFilas(hoja)
    .filter((fila) =>
      String(fila[COL_SRV_ESPACIO]).trim() === espacio &&
      String(fila[COL_SRV_NOMBRE]).trim() !== '' &&
      esVerdadero(fila[COL_SRV_ACTIVO]))
    .map((fila) => ({
      nombre: String(fila[COL_SRV_NOMBRE]).trim(),
      costeUnitario: Number(fila[COL_SRV_COSTE]) || 0,
      precioUnitario: Number(fila[COL_SRV_PRECIO]) || 0,
    }));
};

// Endpoint (google.script.run): espacios activos para el desplegable inicial del formulario.
const cargarEspaciosFormulario = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    return { success: true, data: obtenerEspaciosActivos() };
  } catch (error) {
    registrarError('cargarEspaciosFormulario', error, {});
    return { success: false, error: 'No se pudieron cargar los espacios.' };
  }
};

// Endpoint (google.script.run): canales y servicios activos del espacio elegido (cascada).
const cargarOpcionesEspacio = (espacio) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    if (!espacio) return { success: false, error: 'Espacio requerido.' };
    return {
      success: true,
      data: {
        canales: obtenerCanalesActivos(espacio),
        servicios: obtenerServiciosActivos(espacio),
      },
    };
  } catch (error) {
    registrarError('cargarOpcionesEspacio', error, { espacio });
    return { success: false, error: 'No se pudieron cargar las opciones del espacio.' };
  }
};
