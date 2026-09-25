// Tests de las funciones que llama la interfaz (su nombre y su respuesta no cambian con el refactor).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina, isoDentroDe } = require('../soporte/gas');

const crear = (e, datos) => e.llamar('crearReserva', datos);
const reservas = (e) => e.hoja('Reservas').registros();

test.describe('RF-02/RF-05 · autorización de endpoints', () => {
  test('un usuario no autorizado no puede crear reservas', () => {
    const e = crearEntornoConDatos({ usuarioActivo: 'intruso@test.com' });
    const r = crear(e, datosReservaHabitacion());
    assert.equal(r.success, false);
    assert.equal(reservas(e).length, 0);
  });

  test('un usuario dado de baja (Activo = No) no puede leer datos', () => {
    const e = crearEntornoConDatos({ usuarioActivo: 'baja@test.com' });
    assert.equal(e.llamar('cargarUltimasReservas').success, false);
  });

  test('un usuario autorizado carga los espacios activos', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('cargarEspaciosFormulario');
    assert.equal(r.success, true);
    assert.deepEqual(r.data.map((x) => x.nombre), ['Piscina / Jardín', 'Habitación Interior']);
  });

  test('RF-15 · solo se ofrecen canales y servicios activos del espacio', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('cargarOpcionesEspacio', 'Habitación Interior');
    assert.deepEqual(r.data.canales.map((c) => c.nombre), ['Airbnb']);
    assert.deepEqual(r.data.servicios.map((s) => s.nombre), ['Desayuno']);
  });
});

test.describe('RF-19..RF-32 · crear reserva', () => {
  test('Rango_Dias: fechas con horas de Config, importes, estado inicial e ID', () => {
    const e = crearEntornoConDatos();
    const r = crear(e, datosReservaHabitacion());
    assert.equal(r.success, true, r.error);
    const [res] = reservas(e);
    const anyo = new Date(`${isoDentroDe(30)}T00:00:00`).getFullYear();
    assert.equal(res.ID_Reserva, `${anyo}-001`);
    assert.equal(r.id, `01/${String(anyo).slice(2)}`);
    assert.equal(res.Fecha_Hora_Inicio.getHours(), 16);
    assert.equal(res.Fecha_Hora_Fin.getHours(), 12);
    // bruto = 300 + 2×10 = 320 · comisión 3 % = 9,6 · coste servicios 2×4 = 8 · neto = 302,4
    assert.equal(res.Importe_Bruto, 320);
    assert.ok(Math.abs(res.Importe_Comisión - 9.6) < 1e-9);
    assert.ok(Math.abs(res.Importe_Neto - 302.4) < 1e-9);
    assert.equal(res.Margen_Servicios, 12);
    assert.equal(res.Estado_Reserva, 'Abierta');
    assert.equal(res.Estado_Cobro, 'No ingresado');
    assert.equal(res.Contrato_Estado, 'Gestionado por canal');
    assert.equal(res.Registro_Viajeros_Estado, 'Pendiente');
    assert.equal(res.Checkin_Revisado, 'Pendiente');
    assert.equal(res.Registrado_Por, 'ana@test.com');
    assert.equal(res.Servicios_Extra, 'Desayuno x2');
    assert.equal(e.hoja('Reserva_Servicios').filas().length, 1);
  });

  test('Dia_y_Hora: coste fijo del canal descontado del neto y snapshot guardado', () => {
    const e = crearEntornoConDatos();
    const r = crear(e, datosReservaPiscina());
    assert.equal(r.success, true, r.error);
    const [res] = reservas(e);
    // bruto = 200 + 3×3 = 209 · comisión 15 % = 31,35 · coste 3×1 = 3 · fijo 9,5 · neto = 165,15
    assert.ok(Math.abs(res.Importe_Neto - 165.15) < 1e-9);
    assert.equal(res.Coste_Canal_Fijo, 9.5);
    assert.equal(res.Registro_Viajeros_Estado, '');
    assert.equal(res.Fecha_Hora_Inicio.getHours(), 11);
  });

  test('RF-18 · canal Manual inicializa el contrato como Pendiente', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaPiscina({ canal: 'Directo', comision: '0' }));
    assert.equal(reservas(e)[0].Contrato_Estado, 'Pendiente');
  });

  test('RF-23 · el servidor ignora precios del cliente y usa el catálogo', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion({ servicios: [{ nombre: 'Desayuno', cantidad: '1', precio: 0 }, { nombre: 'Inventado', cantidad: '5' }] }));
    assert.equal(reservas(e)[0].Servicios_Precio_Total, 10);
  });

  test('RF-28 · rechaza canal ajeno o inactivo y datos no válidos', () => {
    const e = crearEntornoConDatos();
    assert.equal(crear(e, datosReservaHabitacion({ canal: 'Cocopool' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ canal: 'Booking' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ adultos: '0' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ nombre: '  ' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ telefono: '12345' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ email: 'no-es-email' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ importeAlquiler: '-1' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ comision: '101' })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(-2), fechaSalida: isoDentroDe(1) })).success, false);
    assert.equal(crear(e, datosReservaHabitacion({ fechaSalida: isoDentroDe(30) })).success, false);
    assert.equal(reservas(e).length, 0);
  });

  test('RF-29 · bloquea solapamientos; extremos que se tocan y canceladas no bloquean', () => {
    const e = crearEntornoConDatos();
    assert.equal(crear(e, datosReservaHabitacion()).success, true);
    const solapada = crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(31), fechaSalida: isoDentroDe(35) }));
    assert.equal(solapada.success, false);
    assert.match(solapada.error, /Ya existe/);
    const contigua = crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(33), fechaSalida: isoDentroDe(35) }));
    assert.equal(contigua.success, true, 'salida 12:00 y entrada 16:00 del mismo día no solapan');
    assert.equal(crear(e, datosReservaPiscina({ fechaUnica: isoDentroDe(31) })).success, true);

    const id = reservas(e)[0].ID_Reserva;
    assert.equal(e.llamar('cancelarReserva', id).success, true);
    assert.equal(crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(31), fechaSalida: isoDentroDe(32) })).success, true);
  });

  test('RF-31 · el ID es correlativo dentro del año', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    crear(e, datosReservaPiscina());
    assert.deepEqual(reservas(e).map((r) => r.ID_Reserva.split('-')[1]), ['001', '002']);
  });

  test('RF-30 · el guardado usa y libera el bloqueo', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    assert.ok(e.bloqueos.adquiridos >= 1);
    assert.equal(e.bloqueos.adquiridos, e.bloqueos.liberados);
  });
});

test.describe('RF-34..RF-37 · avisos y calendario al crear', () => {
  test('aviso de cierre solo si hay otros canales activos; confirmación siempre', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaPiscina());
    const cierre = e.correos.find((c) => /Cerrar canales/.test(c.subject));
    assert.ok(cierre);
    assert.match(cierre.body, /Directo/);
    assert.ok(e.correos.some((c) => /Reserva 01\//.test(c.subject)));

    e.correos.length = 0;
    crear(e, datosReservaHabitacion());
    assert.ok(!e.correos.some((c) => /Cerrar canales/.test(c.subject)), 'Habitación solo tiene un canal activo');
  });

  test('crea el evento con color del espacio y guarda su ID', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaPiscina());
    const [ev] = e.calendario.eventos;
    assert.match(ev.titulo, /^01\/\d\d · Piscina \/ Jardín — Grupo Ruiz$/);
    assert.equal(ev.color, '2');
    assert.equal(reservas(e)[0].Calendar_Event_Id, ev.id);
  });

  test('RF-37 · si Calendar y el email fallan, la reserva se guarda igual y el fallo se registra', () => {
    const e = crearEntornoConDatos();
    e.calendario.fallar = true;
    e.servicios.MailApp.fallar = true;
    assert.equal(crear(e, datosReservaPiscina()).success, true);
    assert.equal(reservas(e)[0].Calendar_Event_Id, '');
    assert.ok(e.hoja('Errores').filas().length >= 2);
  });
});

test.describe('RF-08/RF-11 · Inicio y buscador', () => {
  test('últimas reservas: máximo 5', () => {
    const e = crearEntornoConDatos();
    for (let i = 0; i < 6; i++) crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(10 + i * 3), fechaSalida: isoDentroDe(11 + i * 3) }));
    assert.equal(e.llamar('cargarUltimasReservas').data.length, 5);
  });

  test('busca por nombre (sin mayúsculas) y por fecha ocupada, y excluye canceladas (B-02)', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    crear(e, datosReservaPiscina());
    assert.equal(e.llamar('buscarReservas', { nombre: 'marta' }).data.length, 1);
    assert.equal(e.llamar('buscarReservas', { fecha: isoDentroDe(31) }).data.length, 1);
    assert.equal(e.llamar('buscarReservas', { nombre: 'marta', fecha: isoDentroDe(20) }).data.length, 0);
    e.llamar('cancelarReserva', reservas(e)[0].ID_Reserva);
    assert.equal(e.llamar('buscarReservas', { nombre: 'marta' }).data.length, 0);
  });
});
