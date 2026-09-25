// Capa: DOMINIO — gastos y resumen fiscal del IRPF (capital inmobiliario, reparto a tercios), como funciones PURAS.
// El sistema registra y agrega; la deducibilidad la confirma el gestor. Ver ADR-0012.

const ESPACIO_COMUN = 'Común';
const TASA_AMORTIZACION = 0.03;
const NUM_COMUNEROS = 3;
// Literales (no SI/NO de otro fichero): Apps Script no garantiza el orden de carga entre ficheros.
const VALORES_DEDUCIBLE = ['Sí', 'No'];

// Espacios a los que se puede imputar un gasto: los del catálogo + "Común".
const espaciosDeGasto_ = (espacios) => [...espacios, ESPACIO_COMUN];

const validarGasto_ = (datos, espaciosValidos, fecha) => {
  if (!datos) return invalido_('Faltan los datos del gasto.');
  if (!fecha) return invalido_('Indica una fecha válida.');
  if (!texto_(datos.concepto)) return invalido_('El concepto es obligatorio.');
  if (!texto_(datos.categoria)) return invalido_('Selecciona una categoría.');
  if (!espaciosValidos.includes(datos.espacio)) return invalido_('Selecciona un espacio válido.');
  if (!(Number(datos.importe) > 0)) return invalido_('El importe debe ser mayor que 0.');
  if (texto_(datos.deducible) && !VALORES_DEDUCIBLE.includes(texto_(datos.deducible))) return invalido_('Indica si el gasto es deducible (Sí/No).');
  return valido_();
};

// Correlativo anual 'G{AAAA}-NNN'.
const generarIdGasto_ = (ids, anyo) => {
  const prefijo = `G${anyo}-`;
  const maximo = ids.reduce((max, id) => (String(id).startsWith(prefijo)
    ? Math.max(max, parseInt(String(id).slice(prefijo.length), 10) || 0)
    : max), 0);
  return `${prefijo}${String(maximo + 1).padStart(3, '0')}`;
};

// Amortización anual ≈ 3 % del valor de construcción × proporción alquilada (0–1 o 0–100). 0 si faltan datos.
const calcularAmortizacion_ = (valorConstruccion, proporcionAlquilada) => {
  const proporcion = numero_(proporcionAlquilada) > 1 ? numero_(proporcionAlquilada) / 100 : numero_(proporcionAlquilada);
  return numero_(valorConstruccion) * TASA_AMORTIZACION * proporcion;
};

const sumaImportes_ = (gastos) => gastos.reduce((s, g) => s + numero_(g.importe), 0);

// Resumen de un espacio: ingresos íntegros, comisiones, gastos deducibles (propios + parte de los comunes),
// amortización repartida, rendimiento neto y tercio por comunero (RF-66).
const resumenDeEspacio_ = (espacio, reservas, gastosDeducibles, amortizacionAnual, numEspacios) => {
  const delEspacio = reservas.filter((r) => r.espacio === espacio);
  const ingresos = delEspacio.reduce((s, r) => s + numero_(r.bruto), 0);
  const comisiones = delEspacio.reduce((s, r) => s + numero_(r.comision), 0);
  const propios = sumaImportes_(gastosDeducibles.filter((g) => g.espacio === espacio));
  const comunes = sumaImportes_(gastosDeducibles.filter((g) => g.espacio === ESPACIO_COMUN)) / numEspacios;
  const amortizacion = amortizacionAnual / numEspacios;
  const gastos = comisiones + propios + comunes + amortizacion;
  const rendimiento = ingresos - gastos;
  return {
    espacio, ingresos, comisiones, gastosRegistrados: propios + comunes, amortizacion,
    gastosDeducibles: gastos, rendimiento, tercio: rendimiento / NUM_COMUNEROS,
  };
};

const agruparGastosPorCategoria_ = (gastosDeducibles) => {
  const mapa = gastosDeducibles.reduce((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + numero_(g.importe);
    return acc;
  }, {});
  return Object.keys(mapa).map((categoria) => ({ categoria, importe: mapa[categoria] }));
};

// Resumen fiscal completo de un ejercicio a partir de datos ya leídos.
const calcularResumenEjercicio_ = ({ espacios, reservas, gastos, anyo, valorConstruccion, proporcionAlquilada }) => {
  const reservasDelAnyo = reservas.filter((r) => r.estado !== ESTADO_RESERVA.CANCELADA && r.inicio.getFullYear() === anyo);
  const deducibles = gastos.filter((g) => Number(g.ejercicio) === anyo && esVerdadero_(g.deducible));
  const amortizacionAnual = calcularAmortizacion_(valorConstruccion, proporcionAlquilada);
  const numEspacios = Math.max(espacios.length, 1);
  return {
    ejercicio: anyo,
    resumen: espacios.map((espacio) => resumenDeEspacio_(espacio, reservasDelAnyo, deducibles, amortizacionAnual, numEspacios)),
    porCategoria: agruparGastosPorCategoria_(deducibles),
    amortizacionAnual,
  };
};
