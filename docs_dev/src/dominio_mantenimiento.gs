// Capa: DOMINIO — reglas de las copias de seguridad (ADR-0013, ADR-0016), como funciones PURAS (TD-04).
// Trabajan con días 'yyyy-MM-dd'; leer y borrar las copias de Drive es de infra_mantenimiento.gs.

const DIAS_POR_SEMANA = 7;

// Toca copia si ninguna es de hoy (días 'yyyy-MM-dd' en la zona del Sheet).
const tocaCopia_ = (diaUltimaCopia, hoy) => diaUltimaCopia !== hoy;

// Lunes de la semana del día 'yyyy-MM-dd', como clave de la semana.
const claveSemana_ = (dia) => {
  const fecha = new Date(`${dia}T00:00:00Z`);
  const diasDesdeLunes = (fecha.getUTCDay() + DIAS_POR_SEMANA - 1) % DIAS_POR_SEMANA;
  return new Date(fecha.getTime() - diasDesdeLunes * MS_POR_DIA).toISOString().slice(0, 10);
};

// Rotación abuelo-padre-hijo (ADR-0016): en los últimos N días, semanas y meses con copia se conserva la más
// reciente de cada uno. Recibe los días de las copias de la más reciente a la más antigua y devuelve los índices que se quedan.
const copiasAConservar_ = (dias, { diarias, semanales, mensuales }) => {
  const conservar = new Set();
  const aplicar = (clavePeriodo, cuantos) => {
    const periodos = new Set();
    dias.forEach((dia, i) => {
      const periodo = clavePeriodo(dia);
      if (periodos.has(periodo) || periodos.size >= cuantos) return;
      periodos.add(periodo);
      conservar.add(i);
    });
  };
  aplicar((dia) => dia, diarias);
  aplicar(claveSemana_, semanales);
  aplicar((dia) => dia.slice(0, 7), mensuales);
  return [...conservar].sort((a, b) => a - b);
};
