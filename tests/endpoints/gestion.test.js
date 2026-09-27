const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina, isoDentroDe } = require('../soporte/gas');

const preparar = () => {
  const e = crearEntornoConDatos();
  e.llamar('crearReserva', datosReservaPiscina());
  e.llamar('crearReserva', datosReservaHabitacion());
  const [piscina, habitacion] = e.hoja('Reservas').registros();
  return { e, idPiscina: piscina.ID_Reserva, idHabitacion: habitacion.ID_Reserva };
};

const cambiosBase = (d, extra = {}) => ({
  nombre: d.nombre, telefono: d.telefono, email: d.email, adultos: d.adultos, menores: d.menores,
  importeAlquiler: d.importeAlquiler, comisionPct: d.comisionPct, cobro: d.cobro, contratoEstado: d.contratoEstado,
  incidencias: d.incidencias, incidenteComunicado: d.incidenteComunicado, compensacion: d.compensacion,
  incidenciaResuelta: d.incidenciaResuelta, checkin: d.checkin, checkout: d.checkout, notas: d.notas, ...extra,
});

const reserva = (e, id) => e.hoja('Reservas').registros().find((r) => r.ID_Reserva === id);

// Deja el check-out en "Hecho" directamente en la hoja (lo que hace confirmarChecklist, probado en checklist.test.js).
const marcarCheckoutHecho = (e, id) => {
  const hoja = e.hoja('Reservas');
  const fila = hoja.registros().findIndex((r) => r.ID_Reserva === id) + 2;
  hoja.getRange(fila, hoja.cabeceras().indexOf('Checkout_Revisado') + 1).setValue('Hecho');
};

test.describe('RF-42/RF-43 · lista de gestión', () => {
  test('muestra las no canceladas y filtra por nombre y por rango', () => {
    const { e, idPiscina } = preparar();
    assert.equal(e.llamar('listarReservasActivas', {}).data.length, 2);
    assert.equal(e.llamar('listarReservasActivas', { nombre: 'ruiz' }).data.length, 1);
    assert.equal(e.llamar('listarReservasActivas', { desde: isoDentroDe(0), hasta: isoDentroDe(25) }).data.length, 1);
    e.llamar('cancelarReserva', idPiscina);
    const lista = e.llamar('listarReservasActivas', {}).data;
    assert.equal(lista.length, 1);
    assert.equal(lista[0].adultos + lista[0].menores, 2);
  });
});

test.describe('RF-44..RF-50 · ver y editar', () => {
  test('obtenerReserva devuelve la ficha completa', () => {
    const { e, idHabitacion } = preparar();
    const r = e.llamar('obtenerReserva', idHabitacion);
    assert.equal(r.success, true);
    assert.equal(r.data.nombre, 'Marta Pérez');
    assert.equal(r.data.bruto, 320);
    assert.equal(r.data.cobro, 'No ingresado');
  });

  test('editar audita cada campo cambiado, recalcula importes y completa la reserva', () => {
    const { e, idHabitacion } = preparar();
    marcarCheckoutHecho(e, idHabitacion);
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    const r = e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { importeAlquiler: '400', cobro: 'Ingresado', nombre: 'Marta P. López' }));
    assert.equal(r.success, true, r.error);
    assert.equal(r.estado, 'Completada');
    const res = reserva(e, idHabitacion);
    assert.equal(res.Importe_Bruto, 420);
    assert.equal(res.Estado_Reserva, 'Completada');
    assert.equal(res.Modificado_Por, 'ana@test.com');
    const campos = e.hoja('Historial_Cambios').registros().map((h) => h.Campo);
    assert.deepEqual(campos.sort(), ['Estado de cobro', 'Estado de la reserva', 'Importe del alquiler', 'Nombre del huésped'].sort());
  });

  test('RF-56 · el formulario no puede marcar el check-out: solo la checklist', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', checkout: 'Hecho' }));
    const res = reserva(e, idHabitacion);
    assert.equal(res.Checkout_Revisado, 'Pendiente');
    assert.equal(res.Estado_Reserva, 'Abierta');
  });

  test('B-09 · cambiar el nombre actualiza el título del evento de Calendar', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { nombre: 'Marta P. López' }));
    const ev = e.calendario.getEventById(reserva(e, idHabitacion).Calendar_Event_Id);
    assert.match(ev.getTitle(), /Marta P\. López$/);
  });

  test('RF-50 · incidencia sin resolver mantiene la reserva Abierta', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    const r = e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', incidencias: 'Con incidentes', incidenciaResuelta: 'No' }));
    assert.equal(r.estado, 'Abierta');
  });

  test('RF-51 · la ficha indica qué falta para completar', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    assert.deepEqual(d.pendientes, ['Pendiente de cobro', 'Check-out sin hacer']);
    marcarCheckoutHecho(e, idHabitacion);
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', incidencias: 'Con incidentes', incidenciaResuelta: 'No' }));
    assert.deepEqual(e.llamar('obtenerReserva', idHabitacion).data.pendientes, ['Incidencia sin resolver']);
  });

  test('B-04 · rechaza valores fuera de dominio y la edición de canceladas', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerReserva', idHabitacion).data;
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Pagado' })).success, false);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { checkin: 'Quizá' })).success, false);
    e.llamar('cancelarReserva', idHabitacion);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d)).success, false);
    assert.equal(e.llamar('actualizarServiciosReserva', idHabitacion, []).success, false);
  });

  test('reserva inexistente', () => {
    const { e } = preparar();
    assert.equal(e.llamar('obtenerReserva', '1999-001').success, false);
  });
});

test.describe('RF-49 · servicios de una reserva existente', () => {
  test('sustituye líneas, recalcula sin tocar la comisión y conserva las de otras reservas', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    const antes = reserva(e, idPiscina);
    const r = e.llamar('actualizarServiciosReserva', idPiscina, [{ nombre: 'BBQ', cantidad: '1' }, { nombre: 'Hielo', cantidad: '1' }]);
    assert.equal(r.success, true, r.error);
    const res = reserva(e, idPiscina);
    assert.equal(res.Importe_Comisión, antes.Importe_Comisión);
    assert.equal(res.Servicios_Precio_Total, 23);
    assert.equal(res.Importe_Bruto, 223);
    assert.ok(Math.abs(res.Importe_Neto - (223 - antes.Importe_Comisión - 6 - 9.5)) < 1e-9);
    const lineas = e.hoja('Reserva_Servicios').registros();
    assert.equal(lineas.filter((l) => l.ID_Reserva === idPiscina).length, 2);
    assert.equal(lineas.filter((l) => l.ID_Reserva === idHabitacion).length, 1);
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Servicios extra'));
  });

  test('B-03 · si la escritura falla no se pierden las líneas de otras reservas', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    const hoja = e.hoja('Reserva_Servicios');
    hoja.fallarEnEscritura = hoja.escrituras + 2;
    e.llamar('actualizarServiciosReserva', idPiscina, [{ nombre: 'BBQ', cantidad: '1' }]);
    hoja.fallarEnEscritura = null;
    assert.ok(hoja.registros().some((l) => l.ID_Reserva === idHabitacion), 'la línea de la otra reserva sigue');
  });

  test('cargarServiciosReserva devuelve catálogo y actuales', () => {
    const { e, idPiscina } = preparar();
    const r = e.llamar('cargarServiciosReserva', idPiscina);
    assert.deepEqual(r.data.catalogo.map((s) => s.nombre), ['Hielo', 'BBQ']);
    assert.deepEqual(r.data.actuales, [{ nombre: 'Hielo', cantidad: 3 }]);
  });
});

test.describe('RF-52/RF-53 · cancelar e historial', () => {
  test('cancela, audita, borra el evento y avisa de reabrir; no permite cancelar dos veces', () => {
    const { e, idPiscina } = preparar();
    e.correos.length = 0;
    const eventos = e.calendario.eventos.length;
    assert.equal(e.llamar('cancelarReserva', idPiscina).success, true);
    assert.equal(reserva(e, idPiscina).Estado_Reserva, 'Cancelada');
    assert.equal(e.calendario.eventos.length, eventos - 1);
    assert.ok(e.correos.some((c) => /Reabrir canales/.test(c.subject)));
    assert.equal(e.llamar('cancelarReserva', idPiscina).success, false);
    const h = e.llamar('obtenerHistorial', idPiscina).data;
    assert.equal(h[0].nuevo, 'Cancelada');
  });

  test('historial vacío', () => {
    const { e, idPiscina } = preparar();
    assert.deepEqual(e.llamar('obtenerHistorial', idPiscina).data, []);
  });
});
