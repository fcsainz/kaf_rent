// Capa: DOMINIO — días cerrados y ocupación por espacio y canal (DD-04 §3.1–§3.3, F-48, F-49), como funciones PURAS.
// Cada espacio se mide como se cobra: por noches (Rango_Dias) o por horas (Dia_y_Hora).

const UNIDAD_OCUPACION = { NOCHE: 'noche', HORA: 'hora' };
const HORAS_POR_DIA = 24;
const MAX_DIAS_CIERRE = 366;
const MESES_POR_ANYO = 12;
const PERIODO_ANYO = 'anyo';
const RE_PERIODO = /^(anyo|T[1-4]|M([1-9]|1[0-2]))$/;

const unidadDeModo_ = (modoFecha) => (modoFecha === MODO_FECHA.RANGO_DIAS ? UNIDAD_OCUPACION.NOCHE : UNIDAD_OCUPACION.HORA);

// Clave local 'AAAA-MM-DD' de un día (sin zona horaria: las fechas ya son locales).
const claveDia_ = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const diaSiguiente_ = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);

// Días [desde, hasta) a las 00:00. Se avanza por calendario, no por milisegundos, por los cambios de hora.
const diasDelRango_ = (desde, hastaExcluido) => {
  const dias = [];
  for (let d = inicioDelDia_(desde); d < hastaExcluido; d = diaSiguiente_(d)) dias.push(d);
  return dias;
};

// Días que ocupa una reserva: sus noches (el día de salida no cuenta) o, por horas, el día en que empieza.
const diasDeReserva_ = (reserva, modoFecha) => {
  const primero = inicioDelDia_(reserva.inicio);
  if (unidadDeModo_(modoFecha) === UNIDAD_OCUPACION.HORA) return [primero];
  const noches = diasDelRango_(primero, inicioDelDia_(reserva.fin));
  return noches.length > 0 ? noches : [primero];
};

const horasDeReserva_ = (reserva) => Math.max(0, (reserva.fin - reserva.inicio) / MS_POR_HORA);

// Horas abiertas de un día: si el cierre es anterior a la apertura, es del día siguiente (09:00 → 02:00 = 17 h).
const horasAbiertasPorDia_ = (apertura, cierre) => {
  if (!RE_HORA.test(texto_(apertura)) || !RE_HORA.test(texto_(cierre))) return HORAS_POR_DIA;
  const minutos = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const diferencia = minutos(cierre) - minutos(apertura);
  return (diferencia > 0 ? diferencia : diferencia + HORAS_POR_DIA * 60) / 60;
};

// ---------- Días cerrados (F-48) ----------

const fechaDesdeIso_ = (iso) => (RE_FECHA_ISO.test(texto_(iso)) ? combinarFechaHora_(iso, '00:00') : null);

// Valida un cierre que llega del cliente: espacio del catálogo, fechas válidas (hasta incluido) y motivo.
const validarCierre_ = (datos, nombresEspacios) => {
  if (!datos) return invalido_('Faltan los datos del cierre.');
  const espacio = texto_(datos.espacio);
  if (!nombresEspacios.includes(espacio)) return invalido_('Elige un espacio válido.');
  const desde = fechaDesdeIso_(datos.desde);
  const hasta = fechaDesdeIso_(datos.hasta);
  if (!desde || !hasta) return invalido_('Indica las fechas de inicio y fin del cierre.');
  if (hasta < desde) return invalido_('La fecha de fin no puede ser anterior a la de inicio.');
  if (diasDelRango_(desde, diaSiguiente_(hasta)).length > MAX_DIAS_CIERRE) return invalido_(`Un cierre no puede pasar de ${MAX_DIAS_CIERRE} días: divídelo en dos.`);
  const motivo = texto_(datos.motivo);
  if (!motivo) return invalido_('Indica el motivo del cierre (p. ej. "Fuera de temporada").');
  return { valido: true, cierre: { espacio, desde, hasta, motivo } };
};

const clavesDeCierre_ = (cierre) => diasDelRango_(cierre.desde, diaSiguiente_(cierre.hasta)).map(claveDia_);

// Primer cierre del espacio que coincide con alguno de los días dados; null si ninguno.
const cierreEnDias_ = (cierres, espacio, dias) => {
  const claves = new Set(dias.map(claveDia_));
  return cierres.find((c) => c.espacio === espacio && clavesDeCierre_(c).some((k) => claves.has(k))) || null;
};

// Primera reserva no cancelada del espacio que ocupa algún día del cierre; null si ninguna.
const reservaEnCierre_ = (reservas, cierre, modoFecha) => {
  const claves = new Set(clavesDeCierre_(cierre));
  return reservas.find((r) => r.espacio === cierre.espacio && r.estado !== ESTADO_RESERVA.CANCELADA
    && diasDeReserva_(r, modoFecha).some((d) => claves.has(claveDia_(d)))) || null;
};

const generarIdCierre_ = (ids) => {
  const maximo = ids.reduce((max, id) => Math.max(max, parseInt(String(id).replace(/^CIE-/, ''), 10) || 0), 0);
  return `CIE-${String(maximo + 1).padStart(3, '0')}`;
};

// ---------- Periodos del informe ----------

// periodo: 'anyo', 'T1'…'T4' o 'M1'…'M12'. Devuelve { inicio, fin } con fin excluido, o null si no es válido.
const periodoOcupacion_ = (anyo, periodo) => {
  const a = parseInt(anyo, 10);
  if (!(a >= 2000 && a <= 2100) || !RE_PERIODO.test(texto_(periodo))) return null;
  if (periodo === PERIODO_ANYO) return { inicio: new Date(a, 0, 1), fin: new Date(a + 1, 0, 1) };
  const numero = parseInt(periodo.slice(1), 10);
  const primerMes = periodo[0] === 'T' ? (numero - 1) * MESES_POR_TRIMESTRE : numero - 1;
  const meses = periodo[0] === 'T' ? MESES_POR_TRIMESTRE : 1;
  return { inicio: new Date(a, primerMes, 1), fin: new Date(a, primerMes + meses, 1) };
};

// ---------- Reparto de una reserva en un periodo (DD-04 §3.1) ----------

// Parte de la reserva que cae en el periodo: sus días dentro y la fracción del total (las noches se reparten).
const parteEnPeriodo_ = (reserva, modoFecha, { inicio, fin }) => {
  const dias = diasDeReserva_(reserva, modoFecha);
  const dentro = dias.filter((d) => d >= inicio && d < fin);
  return { dias: dentro, fraccion: dentro.length / dias.length };
};

// Reservas no canceladas del periodo, con los importes repartidos por noches (lo usa el informe por email).
const reservasDelPeriodo_ = (reservas, periodo, modoDeEspacio) => noCanceladas_(reservas)
  .map((r) => ({ reserva: r, parte: parteEnPeriodo_(r, modoDeEspacio(r.espacio), periodo) }))
  .filter(({ parte }) => parte.fraccion > 0)
  .map(({ reserva, parte }) => ({
    ...reserva,
    bruto: numero_(reserva.bruto) * parte.fraccion,
    comision: numero_(reserva.comision) * parte.fraccion,
    neto: numero_(reserva.neto) * parte.fraccion,
  }));

// ---------- Métricas de ocupación (F-49) ----------

const cociente_ = (a, b) => (b > 0 ? a / b : null);

const acumuladoVacio_ = () => ({ reservas: 0, canceladas: 0, vendidas: 0, dias: new Set(), neto: 0, alquiler: 0 });

const acumularReserva_ = (acc, reserva, unidad, parte) => {
  if (reserva.estado === ESTADO_RESERVA.CANCELADA) return { ...acc, canceladas: acc.canceladas + 1 };
  const vendidas = unidad === UNIDAD_OCUPACION.NOCHE ? parte.dias.length : horasDeReserva_(reserva);
  return {
    reservas: acc.reservas + 1,
    canceladas: acc.canceladas,
    vendidas: acc.vendidas + vendidas,
    dias: new Set([...acc.dias, ...parte.dias.map(claveDia_)]),
    neto: acc.neto + numero_(reserva.neto) * parte.fraccion,
    alquiler: acc.alquiler + numero_(reserva.importeAlquiler) * parte.fraccion,
  };
};

// Fila de un canal (o del total): en noches, la ocupación es de noches; por horas, lo primero son los días con reserva.
const filaOcupacion_ = (canal, acc, abiertas) => ({
  canal,
  reservas: acc.reservas,
  canceladas: acc.canceladas,
  vendidas: acc.vendidas,
  diasConReserva: acc.dias.size,
  ocupacion: cociente_(acc.vendidas, abiertas.unidades),
  ocupacionDias: cociente_(acc.dias.size, abiertas.dias),
  neto: acc.neto,
  cobradoPorUnidad: cociente_(acc.alquiler, acc.vendidas),
  ingresoPorUnidadAbierta: cociente_(acc.neto, abiertas.unidades),
});

// Ocupación de un espacio en un periodo, por canal y en total. `canales`: los del catálogo, aunque no tengan reservas.
const metricasOcupacion_ = ({ reservas, cierres, espacio, canales, periodo, horasDia }) => {
  const unidad = unidadDeModo_(espacio.modoFecha);
  const cerrados = new Set(cierres.filter((c) => c.espacio === espacio.nombre).flatMap(clavesDeCierre_));
  const diasPeriodo = diasDelRango_(periodo.inicio, periodo.fin);
  const diasAbiertos = diasPeriodo.filter((d) => !cerrados.has(claveDia_(d))).length;
  const abiertas = { dias: diasAbiertos, unidades: unidad === UNIDAD_OCUPACION.NOCHE ? diasAbiertos : diasAbiertos * horasDia };

  const partes = reservas.filter((r) => r.espacio === espacio.nombre)
    .map((r) => ({ reserva: r, parte: parteEnPeriodo_(r, espacio.modoFecha, periodo) }))
    .filter(({ parte }) => parte.fraccion > 0);
  const nombres = [...new Set([...canales, ...partes.map(({ reserva }) => reserva.canal)])];
  const acumular = (lista) => lista.reduce((acc, { reserva, parte }) => acumularReserva_(acc, reserva, unidad, parte), acumuladoVacio_());

  return {
    unidad,
    horasDia: unidad === UNIDAD_OCUPACION.HORA ? horasDia : null,
    diasPeriodo: diasPeriodo.length,
    diasCerrados: diasPeriodo.length - diasAbiertos,
    diasAbiertos,
    unidadesAbiertas: abiertas.unidades,
    canales: nombres.map((canal) => filaOcupacion_(canal, acumular(partes.filter(({ reserva }) => reserva.canal === canal)), abiertas)),
    total: filaOcupacion_('Total', acumular(partes), abiertas),
  };
};

// Lo que se ve primero de un espacio (DD-04 §3.1): por horas, los días con reserva; por noches, la ocupación.
const ocupacionPrincipal_ = (metricas, fila) =>
  (metricas.unidad === UNIDAD_OCUPACION.HORA ? fila.ocupacionDias : fila.ocupacion);

// Evolución de los 12 meses del año: ocupación principal e ingreso por unidad abierta del espacio.
const evolucionMensual_ = (datos, anyo) => Array.from({ length: MESES_POR_ANYO }, (_, i) => {
  const metricas = metricasOcupacion_({ ...datos, periodo: periodoOcupacion_(anyo, `M${i + 1}`) });
  return { mes: i + 1, ocupacion: ocupacionPrincipal_(metricas, metricas.total), ingresoPorUnidadAbierta: metricas.total.ingresoPorUnidadAbierta };
});
