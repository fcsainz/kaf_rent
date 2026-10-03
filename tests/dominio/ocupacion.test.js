// Tests unitarios de dominio_ocupacion.gs (DD-04): días cerrados, reparto por noches y métricas de ocupación.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');

const { fn } = crearEntorno();
const plano = (v) => JSON.parse(JSON.stringify(v));
const d = (y, m, dia, h = 0, min = 0) => new Date(y, m - 1, dia, h, min);

const INTERIOR = { nombre: 'Habitación Interior', modoFecha: 'Rango_Dias' };
const EXTERIOR = { nombre: 'Piscina / Jardín', modoFecha: 'Dia_y_Hora' };
const reserva = (c = {}) => ({
  id: '2030-001', espacio: INTERIOR.nombre, canal: 'Airbnb', inicio: d(2030, 7, 1, 16), fin: d(2030, 7, 4, 12),
  importeAlquiler: 90, neto: 60, bruto: 90, comision: 30, estado: 'Abierta', ...c,
});
const piscina = (c = {}) => reserva({ espacio: EXTERIOR.nombre, canal: 'Cocopool', inicio: d(2030, 7, 5, 12), fin: d(2030, 7, 5, 20), importeAlquiler: 240, neto: 200, ...c });
const cierre = (c = {}) => ({ id: 'CIE-001', espacio: INTERIOR.nombre, desde: d(2030, 7, 10), hasta: d(2030, 7, 12), motivo: 'Uso familiar', ...c });
const JULIO = { inicio: d(2030, 7, 1), fin: d(2030, 8, 1) };

test.describe('RF-104 · días cerrados', () => {
  const validar = (datos) => plano(fn('validarCierre_')(datos, [INTERIOR.nombre, EXTERIOR.nombre]));
  const datos = (c = {}) => ({ espacio: INTERIOR.nombre, desde: '2030-07-10', hasta: '2030-07-12', motivo: 'Uso familiar', ...c });

  test('debe aceptar un cierre válido con el día de fin incluido', () => {
    const r = fn('validarCierre_')(datos(), [INTERIOR.nombre]);
    assert.equal(r.valido, true);
    assert.deepEqual(plano(fn('clavesDeCierre_')(r.cierre)), ['2030-07-10', '2030-07-11', '2030-07-12']);
  });
  test('debe rechazar espacio desconocido, fechas mal formadas o invertidas, motivo vacío y más de 366 días', () => {
    assert.equal(validar(datos({ espacio: 'Garaje' })).valido, false);
    assert.equal(validar(datos({ desde: '10/07/2030' })).valido, false);
    assert.equal(validar(datos({ desde: '2030-07-13' })).valido, false);
    assert.equal(validar(datos({ motivo: '  ' })).valido, false);
    assert.match(validar(datos({ desde: '2030-01-01', hasta: '2031-01-02' })).error, /366/);
    assert.equal(validar(null).valido, false);
  });
  test('debe detectar la reserva que ocupa un día cerrado: noches para Interior, día de inicio por horas', () => {
    const enCierre = fn('reservaEnCierre_');
    const sale = reserva({ inicio: d(2030, 7, 8, 16), fin: d(2030, 7, 10, 12) }); // noches 8 y 9: el día 10 solo sale
    assert.equal(enCierre([sale], cierre(), 'Rango_Dias'), null, 'el día de salida no ocupa la noche');
    assert.equal(enCierre([reserva({ inicio: d(2030, 7, 9, 16), fin: d(2030, 7, 11, 12) })], cierre(), 'Rango_Dias').id, '2030-001');
    assert.equal(enCierre([reserva({ inicio: d(2030, 7, 9, 16), fin: d(2030, 7, 11, 12), estado: 'Cancelada' })], cierre(), 'Rango_Dias'), null);
    const exterior = cierre({ espacio: EXTERIOR.nombre });
    assert.equal(enCierre([piscina({ inicio: d(2030, 7, 12, 22), fin: d(2030, 7, 13, 1) })], exterior, 'Dia_y_Hora').canal, 'Cocopool');
    assert.equal(enCierre([piscina({ inicio: d(2030, 7, 9, 22), fin: d(2030, 7, 10, 1) })], exterior, 'Dia_y_Hora'), null, 'por horas cuenta el día en que empieza');
  });
  test('debe encontrar el cierre que coincide con unos días del mismo espacio', () => {
    const dias = [d(2030, 7, 12), d(2030, 7, 13)];
    assert.equal(fn('cierreEnDias_')([cierre()], INTERIOR.nombre, dias).id, 'CIE-001');
    assert.equal(fn('cierreEnDias_')([cierre()], EXTERIOR.nombre, dias), null);
    assert.equal(fn('cierreEnDias_')([cierre()], INTERIOR.nombre, [d(2030, 7, 13)]), null);
  });
  test('debe numerar los cierres de forma correlativa', () => {
    assert.equal(fn('generarIdCierre_')([]), 'CIE-001');
    assert.equal(fn('generarIdCierre_')(['CIE-001', 'CIE-009', 'x']), 'CIE-010');
  });
});

test.describe('RF-107 · unidades, horario y periodos', () => {
  test('debe calcular las horas abiertas, también si se cierra pasada la medianoche', () => {
    assert.equal(fn('horasAbiertasPorDia_')('09:00', '02:00'), 17);
    assert.equal(fn('horasAbiertasPorDia_')('10:00', '20:30'), 10.5);
    assert.equal(fn('horasAbiertasPorDia_')('', '02:00'), 24, 'sin horario válido, el día entero');
  });
  test('debe dar los periodos de mes, trimestre y año con el fin excluido', () => {
    const p = (anyo, periodo) => plano(fn('periodoOcupacion_')(anyo, periodo));
    assert.deepEqual(p(2030, 'M2'), plano({ inicio: d(2030, 2, 1), fin: d(2030, 3, 1) }));
    assert.deepEqual(p(2030, 'T4'), plano({ inicio: d(2030, 10, 1), fin: d(2031, 1, 1) }));
    assert.deepEqual(p(2030, 'anyo'), plano({ inicio: d(2030, 1, 1), fin: d(2031, 1, 1) }));
    assert.equal(fn('periodoOcupacion_')(2030, 'M13'), null);
    assert.equal(fn('periodoOcupacion_')('x', 'M1'), null);
  });
  test('debe repartir por noches una reserva que cruza de mes', () => {
    const cruza = reserva({ inicio: d(2030, 7, 30, 16), fin: d(2030, 8, 2, 12), neto: 90 }); // noches 30, 31 y 1
    const parte = fn('parteEnPeriodo_')(cruza, 'Rango_Dias', JULIO);
    assert.equal(parte.dias.length, 2);
    assert.ok(Math.abs(parte.fraccion - 2 / 3) < 1e-9);
    const [enJulio] = fn('reservasDelPeriodo_')([cruza], JULIO, () => 'Rango_Dias');
    assert.ok(Math.abs(enJulio.neto - 60) < 1e-9, 'el neto se reparte en proporción a las noches');
  });
});

test.describe('RF-107 · métricas de ocupación', () => {
  const metricas = (c) => plano(fn('metricasOcupacion_')({ cierres: [], canales: [], periodo: JULIO, horasDia: 17, ...c }));

  test('Interior: noches ocupadas frente a abiertas, con los días cerrados fuera', () => {
    const m = metricas({ espacio: INTERIOR, canales: ['Airbnb', 'Sin plataforma'], cierres: [cierre()],
      reservas: [reserva(), reserva({ id: '2030-002', estado: 'Cancelada' }), piscina()] });
    assert.deepEqual([m.unidad, m.diasPeriodo, m.diasCerrados, m.diasAbiertos, m.unidadesAbiertas], ['noche', 31, 3, 28, 28]);
    const airbnb = m.canales.find((c) => c.canal === 'Airbnb');
    assert.deepEqual([airbnb.reservas, airbnb.canceladas, airbnb.vendidas], [1, 1, 3]);
    assert.ok(Math.abs(airbnb.ocupacion - 3 / 28) < 1e-9);
    assert.equal(airbnb.cobradoPorUnidad, 30, '90 € de alquiler entre 3 noches');
    assert.ok(Math.abs(airbnb.ingresoPorUnidadAbierta - 60 / 28) < 1e-9);
    const sinPlataforma = m.canales.find((c) => c.canal === 'Sin plataforma');
    assert.deepEqual([sinPlataforma.reservas, sinPlataforma.ocupacion, sinPlataforma.cobradoPorUnidad], [0, 0, null], 'los canales del catálogo salen aunque no tengan reservas');
    assert.equal(m.total.reservas, 1, 'la piscina no cuenta en Interior');
  });
  test('Exterior: horas vendidas frente a horas abiertas y días con reserva frente a días abiertos', () => {
    const m = metricas({ espacio: EXTERIOR, canales: ['Cocopool'],
      reservas: [piscina(), piscina({ id: '2030-002', inicio: d(2030, 7, 5, 21), fin: d(2030, 7, 6, 1), neto: 100 }), piscina({ id: '2030-003', canal: 'Swimmy', inicio: d(2030, 7, 20, 10), fin: d(2030, 7, 20, 14) })] });
    assert.deepEqual([m.unidad, m.horasDia, m.unidadesAbiertas], ['hora', 17, 31 * 17]);
    const cocopool = m.canales.find((c) => c.canal === 'Cocopool');
    assert.deepEqual([cocopool.reservas, cocopool.vendidas, cocopool.diasConReserva], [2, 12, 1], 'dos reservas el mismo día cuentan un día con reserva');
    assert.ok(Math.abs(cocopool.ocupacionDias - 1 / 31) < 1e-9);
    assert.equal(cocopool.cobradoPorUnidad, 40, '480 € entre 12 horas');
    assert.ok(m.canales.some((c) => c.canal === 'Swimmy'), 'un canal con reservas aparece aunque no esté en el catálogo');
    assert.deepEqual([m.total.reservas, m.total.vendidas, m.total.diasConReserva], [3, 16, 2]);
    assert.equal(fn('ocupacionPrincipal_')(m, m.total), m.total.ocupacionDias, 'por horas, lo primero son los días con reserva');
  });
  test('un periodo cerrado entero no da ocupación (no hay días abiertos)', () => {
    const m = metricas({ espacio: INTERIOR, reservas: [], cierres: [cierre({ desde: d(2030, 7, 1), hasta: d(2030, 7, 31) })] });
    assert.deepEqual([m.diasAbiertos, m.total.ocupacion, m.total.ingresoPorUnidadAbierta], [0, null, null]);
  });
  test('la evolución da los 12 meses del año', () => {
    const evolucion = plano(fn('evolucionMensual_')({ espacio: INTERIOR, reservas: [reserva()], cierres: [], canales: [], horasDia: 17 }, 2030));
    assert.equal(evolucion.length, 12);
    assert.ok(Math.abs(evolucion[6].ocupacion - 3 / 31) < 1e-9);
    assert.equal(evolucion[0].ocupacion, 0);
  });
});
