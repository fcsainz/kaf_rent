// Creación de reservas: validación servidor, fechas por modo, importes, solapamiento, ID y guardado. Ver ADR-0003/0004/0014.

// Valores de dominio del estado inicial (ADR-0004).
const ESTADO_RESERVA_ABIERTA   = 'Abierta';
const ESTADO_RESERVA_CANCELADA = 'Cancelada';
const ESTADO_COBRO_INICIAL     = 'No ingresado';
const CONTRATO_GESTIONADO_CANAL = 'Gestionado por canal';
const CONTRATO_PENDIENTE        = 'Pendiente';
const INCIDENCIAS_SIN          = 'Sin incidentes';
const REVISION_PENDIENTE       = 'Pendiente';
const GESTION_CONTRATO_AUTOMATICA = 'Automática';
const MODO_DIA_HORA            = 'Dia_y_Hora';
const MODO_RANGO_DIAS         = 'Rango_Dias';

// Índices (0-based) de las columnas de Reservas que se leen para validar, listar y buscar.
const COL_RES_ID              = 0;
const COL_RES_ESPACIO         = 1;
const COL_RES_INICIO          = 3;
const COL_RES_FIN             = 4;
const COL_RES_NOMBRE          = 5;
const COL_RES_NETO            = 18;
const COL_RES_ESTADO          = 26;
const COL_RES_FECHA_REGISTRO  = 33;
const COL_RES_VIDEO_IN        = 36;
const COL_RES_VIDEO_OUT       = 37;

// Endpoint (google.script.run): valida, calcula y guarda una reserva nueva.
const crearReserva = (datos) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };

    const preparada = prepararReserva(datos);
    if (!preparada.valido) return { success: false, error: preparada.error };

    return guardarReservaConBloqueo(preparada.reserva, obtenerEmailSesion());
  } catch (error) {
    registrarError('crearReserva', error, datos);
    return { success: false, error: 'No se pudo guardar la reserva. Inténtalo de nuevo.' };
  }
};

// Valida los datos del cliente contra los catálogos y construye el objeto reserva (sin tocar la Sheet).
const prepararReserva = (datos) => {
  if (!datos) return { valido: false, error: 'Faltan los datos de la reserva.' };

  const espacio = obtenerEspaciosActivos().find((e) => e.nombre === datos.espacio);
  if (!espacio) return { valido: false, error: 'El espacio seleccionado no es válido.' };

  const canal = obtenerCanalesActivos(datos.espacio).find((c) => c.nombre === datos.canal);
  if (!canal) return { valido: false, error: 'El canal seleccionado no es válido para este espacio.' };

  const fechas = construirFechas(espacio.modoFecha, datos);
  if (!fechas.valido) return { valido: false, error: fechas.error };

  const validacion = validarDatosReserva(datos);
  if (!validacion.valido) return validacion;

  const lineas = resolverLineasServicio(datos.espacio, datos.servicios);
  const comisionPct = Number(datos.comision) || 0;
  const importes = calcularImportesReserva(Number(datos.importeAlquiler), comisionPct, lineas);

  return {
    valido: true,
    reserva: {
      espacio: datos.espacio,
      canal: datos.canal,
      modoFecha: espacio.modoFecha,
      gestionContrato: canal.gestionContrato,
      inicio: fechas.inicio,
      fin: fechas.fin,
      nombre: String(datos.nombre).trim(),
      telefono: String(datos.telefono || '').trim(),
      email: String(datos.email || '').trim(),
      adultos: parseInt(datos.adultos, 10),
      menores: parseInt(datos.menores, 10) || 0,
      comisionPct,
      importeAlquiler: Number(datos.importeAlquiler),
      lineas,
      importes,
    },
  };
};

// Construye Fecha_Hora_Inicio/Fin según el modo del espacio (ADR-0003). Las horas de Rango_Dias salen de Config.
const construirFechas = (modo, datos) => {
  if (modo === MODO_DIA_HORA) {
    const inicio = combinarFechaHora(datos.fechaUnica, datos.horaLlegada || '00:00');
    const fin = combinarFechaHora(datos.fechaUnica, datos.horaSalida || '23:59');
    return validarRangoFechas(inicio, fin);
  }
  if (modo === MODO_RANGO_DIAS) {
    const horaEntrada = obtenerConfig('Hora_CheckIn_Default', '16:00');
    const horaSalida = obtenerConfig('Hora_CheckOut_Default', '12:00');
    const inicio = combinarFechaHora(datos.fechaEntrada, horaEntrada);
    const fin = combinarFechaHora(datos.fechaSalida, horaSalida);
    return validarRangoFechas(inicio, fin);
  }
  return { valido: false, error: 'El espacio no tiene un modo de fecha válido.' };
};

const validarRangoFechas = (inicio, fin) => {
  if (!inicio || !fin) return { valido: false, error: 'Indica las fechas de la reserva.' };
  if (inicio < inicioDeHoy()) return { valido: false, error: 'La reserva no puede empezar en una fecha pasada.' };
  if (fin <= inicio) return { valido: false, error: 'La fecha/hora de salida debe ser posterior a la de entrada.' };
  return { valido: true, inicio, fin };
};

const validarDatosReserva = (datos) => {
  const importe = Number(datos.importeAlquiler);
  if (!(importe >= 0)) return { valido: false, error: 'El importe del alquiler debe ser un número mayor o igual que 0.' };

  const comision = Number(datos.comision) || 0;
  if (comision < 0 || comision > 100) return { valido: false, error: 'La comisión debe estar entre 0 y 100.' };

  if (!(parseInt(datos.adultos, 10) >= 1)) return { valido: false, error: 'Debe haber al menos 1 adulto.' };
  if (!String(datos.nombre || '').trim()) return { valido: false, error: 'El nombre del huésped es obligatorio.' };

  const telefono = String(datos.telefono || '').trim();
  if (telefono && !/^\d{9}$/.test(telefono)) return { valido: false, error: 'El teléfono debe tener 9 cifras.' };

  const email = String(datos.email || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { valido: false, error: 'El email no tiene un formato válido.' };

  return { valido: true };
};

// Releemos coste/precio del catálogo (snapshot autoritativo); no nos fiamos de los del cliente. Ver ADR-0003.
const resolverLineasServicio = (espacio, serviciosSolicitados) => {
  if (!Array.isArray(serviciosSolicitados) || serviciosSolicitados.length === 0) return [];
  const catalogo = obtenerServiciosActivos(espacio);
  return serviciosSolicitados.reduce((acc, solicitado) => {
    const servicio = catalogo.find((s) => s.nombre === solicitado.nombre);
    const cantidad = parseInt(solicitado.cantidad, 10);
    if (servicio && cantidad >= 1) {
      acc.push({ nombre: servicio.nombre, cantidad, coste: servicio.costeUnitario, precio: servicio.precioUnitario });
    }
    return acc;
  }, []);
};

const calcularImportesReserva = (importeAlquiler, comisionPct, lineas) => {
  const serviciosPrecio = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
  const serviciosCoste = lineas.reduce((s, l) => s + l.cantidad * l.coste, 0);
  const bruto = importeAlquiler + serviciosPrecio;
  const comision = bruto * (comisionPct / 100);
  return {
    serviciosPrecio,
    serviciosCoste,
    bruto,
    comision,
    margenServicios: serviciosPrecio - serviciosCoste,
    neto: bruto - comision - serviciosCoste,
  };
};

// Serializa el guardado para evitar la condición de carrera del solapamiento (Risk Register R-02).
const guardarReservaConBloqueo = (reserva, email) => {
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(20000);
  try {
    const hojaReservas = obtenerHoja(HOJA_RESERVAS);
    const filas = obtenerFilas(hojaReservas);

    if (haySolapamiento(filas, reserva.espacio, reserva.inicio, reserva.fin)) {
      return { success: false, error: obtenerConfig('Mensaje_Solapamiento', 'Ya existe una reserva para ese espacio en esas fechas.') };
    }

    const id = generarIdReserva(filas, reserva.inicio.getFullYear());
    const eventoId = crearEventoReserva(reserva, id);
    hojaReservas.appendRow(construirFilaReserva(reserva, id, email, eventoId));
    guardarLineasServicio(id, reserva.lineas);

    notificarReservaCreada(reserva, id);
    return { success: true, id: referenciaMostrada(id) };
  } finally {
    bloqueo.releaseLock();
  }
};

// Solapamiento: mismo espacio, reserva no cancelada y rangos que se cruzan (los límites que se tocan no cuentan).
const haySolapamiento = (filas, espacio, inicio, fin) =>
  filas.some((fila) => {
    if (String(fila[COL_RES_ESPACIO]).trim() !== espacio) return false;
    if (String(fila[COL_RES_ESTADO]).trim() === ESTADO_RESERVA_CANCELADA) return false;
    const inicioExistente = aFecha(fila[COL_RES_INICIO]);
    const finExistente = aFecha(fila[COL_RES_FIN]);
    return inicio < finExistente && inicioExistente < fin;
  });

// Correlativo anual: busca el mayor del año en Reservas y suma 1. Almacenado como 'AAAA-NNN'. Ver ADR-0014.
const generarIdReserva = (filas, anyo) => {
  const prefijo = `${anyo}-`;
  const maximo = filas.reduce((max, fila) => {
    const id = String(fila[COL_RES_ID]).trim();
    if (!id.startsWith(prefijo)) return max;
    return Math.max(max, parseInt(id.slice(prefijo.length), 10) || 0);
  }, 0);
  return `${anyo}-${String(maximo + 1).padStart(3, '0')}`;
};

// 'AAAA-NNN' → 'NN/AA' para mostrar al usuario; mínimo 2 dígitos, como la convención manual (ADR-0014).
const referenciaMostrada = (id) => {
  const [anyo, num] = String(id).split('-');
  return `${String(parseInt(num, 10)).padStart(2, '0')}/${String(anyo).slice(2)}`;
};

const construirFilaReserva = (reserva, id, email) => {
  const ahora = new Date();
  const resumenServicios = reserva.lineas.map((l) => `${l.nombre} x${l.cantidad}`).join(', ');
  const contratoEstado = reserva.gestionContrato === GESTION_CONTRATO_AUTOMATICA ? CONTRATO_GESTIONADO_CANAL : CONTRATO_PENDIENTE;
  const registroViajeros = reserva.modoFecha === MODO_RANGO_DIAS ? REVISION_PENDIENTE : '';

  return [
    id, reserva.espacio, reserva.canal, reserva.inicio, reserva.fin,
    reserva.nombre, reserva.telefono, reserva.email, reserva.adultos, reserva.menores,
    resumenServicios, reserva.importeAlquiler, reserva.importes.serviciosPrecio, reserva.importes.serviciosCoste,
    reserva.importes.bruto, reserva.comisionPct, reserva.importes.comision, reserva.importes.margenServicios, reserva.importes.neto,
    ESTADO_COBRO_INICIAL, contratoEstado, '', INCIDENCIAS_SIN, '',
    '', '', ESTADO_RESERVA_ABIERTA, registroViajeros,
    REVISION_PENDIENTE, REVISION_PENDIENTE,
    '', '', email, ahora, '',
    '', '', '',
  ];
};

const guardarLineasServicio = (id, lineas) => {
  if (lineas.length === 0) return;
  const hoja = obtenerHoja(HOJA_RESERVA_SERVICIOS);
  const filas = lineas.map((l) => [id, l.nombre, l.cantidad, l.coste, l.precio]);
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
};

// ----- Lectura de reservas: Inicio (US-004) y Buscar Reserva (US-022) -----

// Proyección ligera para tablas; incluye claves de orden numéricas para ordenar fechas correctamente en cliente.
const mapearReservaListado = (fila) => {
  const inicio = aFecha(fila[COL_RES_INICIO]);
  const fin = aFecha(fila[COL_RES_FIN]);
  return {
    id: referenciaMostrada(String(fila[COL_RES_ID])),
    espacio: String(fila[COL_RES_ESPACIO]),
    inicioTexto: formatearFechaHora(inicio),
    inicioOrden: inicio.getTime(),
    finTexto: formatearFechaHora(fin),
    finOrden: fin.getTime(),
    nombre: String(fila[COL_RES_NOMBRE]),
    neto: Number(fila[COL_RES_NETO]) || 0,
  };
};

// Endpoint: las 5 reservas más recientes por Fecha_Registro.
const cargarUltimasReservas = () => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const ultimas = obtenerFilas(obtenerHoja(HOJA_RESERVAS))
      .map((fila, indice) => ({ fila, orden: aFecha(fila[COL_RES_FECHA_REGISTRO]).getTime() || indice }))
      .sort((a, b) => b.orden - a.orden)
      .slice(0, 5)
      .map((item) => mapearReservaListado(item.fila));
    return { success: true, data: ultimas };
  } catch (error) {
    registrarError('cargarUltimasReservas', error, {});
    return { success: false, error: 'No se pudieron cargar las últimas reservas.' };
  }
};

// Endpoint: reservas que coinciden por nombre (subcadena) y/o que ocupan la fecha indicada.
const buscarReservas = (filtro) => {
  try {
    if (!sesionAutorizada()) return { success: false, error: 'Sesión no autorizada.' };
    const nombre = String((filtro && filtro.nombre) || '').trim().toLowerCase();
    const fecha = (filtro && filtro.fecha) ? combinarFechaHora(filtro.fecha, '00:00') : null;
    const encontradas = obtenerFilas(obtenerHoja(HOJA_RESERVAS))
      .filter((fila) => coincideBusqueda(fila, nombre, fecha))
      .map(mapearReservaListado);
    return { success: true, data: encontradas };
  } catch (error) {
    registrarError('buscarReservas', error, filtro);
    return { success: false, error: 'No se pudo completar la búsqueda.' };
  }
};

const coincideBusqueda = (fila, nombre, fecha) => {
  if (nombre && !String(fila[COL_RES_NOMBRE]).toLowerCase().includes(nombre)) return false;
  if (!fecha) return true;
  const dia = fecha.getTime();
  const finDia = dia + 24 * 60 * 60 * 1000;
  return aFecha(fila[COL_RES_INICIO]).getTime() < finDia && dia < aFecha(fila[COL_RES_FIN]).getTime();
};
