// Capa: DOMINIO — agregados de estadísticas e informes, como funciones PURAS (reciben las reservas y la fecha).
// Ver ADR-0009 y HU-31/HU-32.

const ZONA_TODOS = 'Todos';
const MESES_POR_TRIMESTRE = 3;
const MESES_INICIO_TRIMESTRE = [0, 3, 6, 9];

const noCanceladas_ = (reservas) => reservas.filter((r) => r.estado !== ESTADO_RESERVA.CANCELADA);

// Por zona ("Todos" + cada espacio): nº de reservas no canceladas que empiezan en el año y suma de su neto (RF-59).
const agregadosEstadisticas_ = (reservas, espacios, anyo, ahora) => {
  const delAnyo = noCanceladas_(reservas).filter((r) => r.inicio.getFullYear() === anyo);
  return [ZONA_TODOS, ...espacios].map((zona) => {
    const subconjunto = zona === ZONA_TODOS ? delAnyo : delAnyo.filter((r) => r.espacio === zona);
    return {
      zona,
      totalReservas: subconjunto.length,
      ingresosNetos: subconjunto.reduce((s, r) => s + numero_(r.neto), 0),
      actualizado: ahora,
    };
  });
};

const dosDigitos_ = (n) => String(n).padStart(2, '0');

// Periodo del informe mensual: el mes natural anterior a `ahora`.
const periodoMensual_ = (ahora) => {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  return { tipo: 'Mensual', periodo: `${inicio.getFullYear()}-${dosDigitos_(inicio.getMonth() + 1)}`, inicio, fin: new Date(ahora.getFullYear(), ahora.getMonth(), 1) };
};

// Periodo del informe trimestral: el trimestre natural anterior a `ahora`.
const periodoTrimestral_ = (ahora) => {
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - MESES_POR_TRIMESTRE, 1);
  return { tipo: 'Trimestral', periodo: `${inicio.getFullYear()}-T${Math.floor(inicio.getMonth() / MESES_POR_TRIMESTRE) + 1}`, inicio, fin: new Date(ahora.getFullYear(), ahora.getMonth(), 1) };
};

const esInicioDeTrimestre_ = (ahora) => MESES_INICIO_TRIMESTRE.includes(ahora.getMonth());

const reservasDelPeriodo_ = (reservas, { inicio, fin }) =>
  noCanceladas_(reservas).filter((r) => r.inicio >= inicio && r.inicio < fin);

// Agregados por espacio y canal para el informe (RF-61).
const agregarPorEspacioCanal_ = (reservas) => {
  const mapa = reservas.reduce((acc, r) => {
    const clave = `${r.espacio}||${r.canal}`;
    const a = acc[clave] || { espacio: r.espacio, canal: r.canal, numReservas: 0, brutos: 0, comisiones: 0, netos: 0 };
    acc[clave] = {
      ...a,
      numReservas: a.numReservas + 1,
      brutos: a.brutos + numero_(r.bruto),
      comisiones: a.comisiones + numero_(r.comision),
      netos: a.netos + numero_(r.neto),
    };
    return acc;
  }, {});
  return Object.keys(mapa).map((k) => mapa[k]);
};

const totalesInforme_ = (agregados) => agregados.reduce((t, a) => ({
  numReservas: t.numReservas + a.numReservas,
  brutos: t.brutos + a.brutos,
  comisiones: t.comisiones + a.comisiones,
  netos: t.netos + a.netos,
}), { numReservas: 0, brutos: 0, comisiones: 0, netos: 0 });

// ---------- Comparativa del informe (D-41: periodo anterior y mismo periodo del año anterior) ----------

const GENERADOR_PERIODO = { Mensual: periodoMensual_, Trimestral: periodoTrimestral_ };

// Cada generador da el periodo anterior a una fecha: desde el inicio, el inmediatamente anterior; desde el fin
// de hace un año, el mismo periodo del año anterior.
const periodosDeComparacion_ = (periodo) => {
  const generar = GENERADOR_PERIODO[periodo.tipo];
  return { anterior: generar(periodo.inicio), anyoAnterior: generar(new Date(periodo.fin.getFullYear() - 1, periodo.fin.getMonth(), 1)) };
};

// Variación relativa del neto; null si no hay base con la que comparar.
const variacion_ = (actual, previo) => (previo > 0 ? (actual - previo) / previo : null);

const claveEspacioCanal_ = (a) => `${a.espacio}||${a.canal}`;

// Filas por espacio y canal con su variación. Incluye los que tuvieron reservas en los periodos comparados y ahora no:
// una caída a cero también informa.
const comparativaInforme_ = ({ actual, anterior, anyoAnterior }) => {
  const netos = (agregados) => new Map(agregados.map((a) => [claveEspacioCanal_(a), a.netos]));
  const [netosAnterior, netosAnyoAnterior] = [netos(anterior), netos(anyoAnterior)];
  const sinReservas = (a) => ({ espacio: a.espacio, canal: a.canal, numReservas: 0, brutos: 0, comisiones: 0, netos: 0 });
  const filas = [...actual, ...[...anterior, ...anyoAnterior].map(sinReservas)]
    .filter((a, i, todas) => todas.findIndex((b) => claveEspacioCanal_(b) === claveEspacioCanal_(a)) === i);
  const conVariacion = (a, previoAnterior, previoAnyo) => ({ ...a, vsAnterior: variacion_(a.netos, previoAnterior), vsAnyoAnterior: variacion_(a.netos, previoAnyo) });
  return {
    filas: filas.map((a) => conVariacion(a, netosAnterior.get(claveEspacioCanal_(a)) || 0, netosAnyoAnterior.get(claveEspacioCanal_(a)) || 0)),
    total: conVariacion(totalesInforme_(actual), totalesInforme_(anterior).netos, totalesInforme_(anyoAnterior).netos),
  };
};
