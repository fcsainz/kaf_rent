// F-14 · Reglas puras de las checklists (DD-01): qué puntos salen y cuándo una lista está resuelta.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');

const e = crearEntorno();
const fn = (n) => e.fn(n);
const plano = (x) => JSON.parse(JSON.stringify(x));
const catalogo = plano(fn('SEMILLA_CHECKLIST')).map((f) => fn('puntoDesdeFila_')(f));
const ids = (puntos) => plano(puntos).map((p) => p.id);
const aplicables = (opciones) => fn('puntosAplicables_')({ catalogo, servicios: [], estadosCheckin: {}, diasHastaSiguiente: null, diasOfficeReponer: 3, ...opciones });

test.describe('F-14 · puntos aplicables', () => {
  test('filtra por espacio y momento y respeta el orden', () => {
    const p = aplicables({ espacio: 'Piscina / Jardín', momento: 'Check-in' });
    assert.equal(ids(p)[0], 'EXT-IN-01');
    assert.ok(ids(p).every((id) => id.startsWith('EXT-IN-')));
  });

  test('barbacoa y extras solo salen si el servicio está contratado', () => {
    const sin = ids(aplicables({ espacio: 'Piscina / Jardín', momento: 'Check-in' }));
    assert.ok(!sin.includes('EXT-IN-24'), 'plancha BBQ');
    assert.ok(!sin.includes('EXT-IN-28'), 'colchonetas');
    const con = ids(aplicables({ espacio: 'Piscina / Jardín', momento: 'Check-in', servicios: ['Carbón 1 Bolsa', 'Colchoneta'] }));
    assert.ok(con.includes('EXT-IN-24') && con.includes('EXT-IN-25') && con.includes('EXT-IN-26'));
    assert.ok(con.includes('EXT-IN-28'));
    assert.ok(!con.includes('EXT-IN-29'), 'pistolas no contratadas');
  });

  test('office de la Habitación: reponer si la siguiente reserva llega en ≤ 3 días; recoger si no', () => {
    const pronto = ids(aplicables({ espacio: 'Habitación Interior', momento: 'Check-out', diasHastaSiguiente: 2 }));
    assert.ok(pronto.includes('INT-OUT-11') && !pronto.includes('INT-OUT-15'));
    const lejos = ids(aplicables({ espacio: 'Habitación Interior', momento: 'Check-out', diasHastaSiguiente: 5 }));
    assert.ok(!lejos.includes('INT-OUT-11') && lejos.includes('INT-OUT-15'));
    const ninguna = ids(aplicables({ espacio: 'Habitación Interior', momento: 'Check-out', diasHastaSiguiente: null }));
    assert.ok(ninguna.includes('INT-OUT-15'));
  });

  test('un bloque entero "No aplica" en el check-in no sale en el check-out', () => {
    const terrazaIn = ['INT-IN-23', 'INT-IN-24', 'INT-IN-25', 'INT-IN-26'];
    const estadosCheckin = Object.fromEntries(terrazaIn.map((id) => [id, 'No aplica']));
    const out = plano(aplicables({ espacio: 'Habitación Interior', momento: 'Check-out', estadosCheckin }));
    assert.ok(!out.some((p) => p.bloque === 'Terraza'));
  });

  test('con un punto del bloque hecho en el check-in, el bloque sí sale en el check-out', () => {
    const estadosCheckin = { 'INT-IN-23': 'Hecho', 'INT-IN-24': 'No aplica', 'INT-IN-25': 'No aplica', 'INT-IN-26': 'No aplica' };
    const out = plano(aplicables({ espacio: 'Habitación Interior', momento: 'Check-out', estadosCheckin }));
    assert.ok(out.some((p) => p.bloque === 'Terraza'));
  });

  test('un punto con pareja "No aplica" en el check-in no sale en el check-out', () => {
    const conPareja = catalogo.map((p) => (p.id === 'INT-OUT-17' ? { ...p, pareja: 'INT-IN-24' } : p));
    const out = ids(fn('puntosAplicables_')({ catalogo: conPareja, espacio: 'Habitación Interior', momento: 'Check-out', servicios: [], estadosCheckin: { 'INT-IN-24': 'No aplica' }, diasHastaSiguiente: null, diasOfficeReponer: 3 }));
    assert.ok(!out.includes('INT-OUT-17'));
  });

  test('los puntos desactivados no salen', () => {
    const desactivado = catalogo.map((p) => (p.id === 'EXT-IN-01' ? { ...p, activo: 'No' } : p));
    const p = ids(fn('puntosAplicables_')({ catalogo: desactivado, espacio: 'Piscina / Jardín', momento: 'Check-in', servicios: [], estadosCheckin: {}, diasHastaSiguiente: null, diasOfficeReponer: 3 }));
    assert.ok(!p.includes('EXT-IN-01'));
  });
});

test.describe('F-14 · lista resuelta', () => {
  const puntos = [
    { id: 'A', tipo: 'Casilla' }, { id: 'B', tipo: 'Fecha' }, { id: 'C', tipo: 'Video' }, { id: 'D', tipo: 'Foto' },
  ];
  const resuelta = (estados) => fn('checklistResuelta_')(puntos, estados);

  test('resuelta si cada punto está Hecho o No aplica; la fecha exige valor; las fotos son opcionales', () => {
    assert.equal(resuelta({ A: { estado: 'Hecho' }, B: { estado: 'Hecho', valor: '2026-09-27' }, C: { estado: 'No aplica' } }), true);
  });
  test('no resuelta con un punto pendiente o una fecha sin valor', () => {
    assert.equal(resuelta({ A: { estado: 'Hecho' }, B: { estado: 'Hecho' }, C: { estado: 'Hecho' } }), false);
    assert.equal(resuelta({ B: { estado: 'Hecho', valor: '2026-09-27' }, C: { estado: 'Hecho' } }), false);
  });
});

test.describe('F-14 · días hasta la siguiente reserva del mismo espacio', () => {
  const d = (dia, hora = 12) => new Date(2026, 9, dia, hora);
  const dias = (reserva, reservas) => fn('diasHastaSiguienteReserva_')(reserva, reservas);
  const base = { id: '1', espacio: 'Habitación Interior', inicio: d(1), fin: d(3), estado: 'Abierta' };

  test('cuenta días desde la salida hasta la siguiente entrada no cancelada del mismo espacio', () => {
    const reservas = [base,
      { id: '2', espacio: 'Habitación Interior', inicio: d(5, 16), fin: d(7), estado: 'Abierta' },
      { id: '3', espacio: 'Habitación Interior', inicio: d(4, 16), fin: d(5), estado: 'Cancelada' },
      { id: '4', espacio: 'Piscina / Jardín', inicio: d(3, 16), fin: d(3, 20), estado: 'Abierta' }];
    assert.equal(dias(base, reservas), 2);
  });
  test('null si no hay siguiente', () => assert.equal(dias(base, [base]), null));
});

test.describe('F-14 · regla de cierre', () => {
  const estado = (r) => fn('calcularEstadoReserva_')({ estado: 'Abierta', incidencias: 'Sin incidentes', ...r });
  test('cobrada pero sin check-out hecho sigue Abierta', () => assert.equal(estado({ cobro: 'Ingresado', checkout: 'Pendiente' }), 'Abierta'));
  test('cobrada y con check-out hecho pasa a Cerrada', () => assert.equal(estado({ cobro: 'Ingresado', checkout: 'Hecho' }), 'Cerrada'));
});
