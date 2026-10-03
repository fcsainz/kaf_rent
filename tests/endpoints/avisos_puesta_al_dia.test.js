// F-37, F-40, F-41 y F-45 (DD-03): avisos de cobro y de checklist, poda de contratos y puesta al día de los datos.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina } = require('../soporte/gas');
const { CABECERAS_FORM, filaAdulto } = require('../soporte/form_viajeros');

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

const registros = (e) => e.hoja('Reservas').registros();
const reservaDe = (e, id) => registros(e).find((r) => r.ID_Reserva === id);

// Cambia una celda de la reserva directamente en la hoja (las fechas pasadas no se pueden crear desde la app).
const fijar = (e, id, columna, valor) => {
  const hoja = e.hoja('Reservas');
  const fila = registros(e).findIndex((r) => r.ID_Reserva === id) + 2;
  hoja.getRange(fila, hoja.cabeceras().indexOf(columna) + 1).setValue(valor);
};
const fijarFechas = (e, id, inicio, fin) => { fijar(e, id, 'Fecha_Hora_Inicio', inicio); fijar(e, id, 'Fecha_Hora_Fin', fin); };

const conReserva = (datos = datosReservaHabitacion()) => {
  const e = crearEntornoConDatos();
  e.llamar('crearReserva', datos);
  const id = registros(e).slice(-1)[0].ID_Reserva;
  e.correos.length = 0;
  return { e, id };
};

test.describe('F-37 · aviso de cobro (trigger diario)', () => {
  test('a los 10 días de la salida sin ingresar avisa a Gestión y Admin con el botón "Sí, se ha ingresado"', () => {
    const { e, id } = conReserva();
    const salida = new Date(Date.now() - 10 * DIA);
    fijarFechas(e, id, new Date(salida.getTime() - 2 * DIA), salida);
    const r = e.comoPropietario(() => e.llamar('avisosDeCobro'));
    assert.deepEqual(r.avisadas, [id]);
    const [correo] = e.correos;
    assert.match(correo.subject, /¿Se ha ingresado la reserva 01\/\d\d\?/);
    assert.equal(correo.to, 'ana@test.com,luis@test.com,carlos@test.com');
    assert.ok(correo.htmlBody.includes(`exec?accion=ingreso&amp;id=${id}`), 'enlace de acción, escapado en el HTML');
    assert.match(correo.body, /Sí, se ha ingresado: https:\/\/script\.google\.com\/macros\/s\/APP\/exec\?accion=ingreso&id=/);
  });

  test('no avisa el día 11 ni si ya está ingresada', () => {
    const { e, id } = conReserva();
    const salida = new Date(Date.now() - 11 * DIA);
    fijarFechas(e, id, new Date(salida.getTime() - DIA), salida);
    assert.deepEqual(e.comoPropietario(() => e.llamar('avisosDeCobro')).avisadas, []);
    fijarFechas(e, id, new Date(Date.now() - 21 * DIA), new Date(Date.now() - 20 * DIA));
    fijar(e, id, 'Estado_Cobro', 'Ingresado');
    assert.deepEqual(e.comoPropietario(() => e.llamar('avisosDeCobro')).avisadas, []);
    assert.equal(e.correos.length, 0);
  });
});

test.describe('F-40 · aviso de check-in y check-out (trigger cada 15 min)', () => {
  test('avisa una sola vez del check-in a menos de 4 h de la llegada y lo anota en la reserva', () => {
    const { e, id } = conReserva();
    fijarFechas(e, id, new Date(Date.now() + 3 * HORA), new Date(Date.now() + 2 * DIA));
    const r = e.comoPropietario(() => e.llamar('avisosDeChecklist'));
    assert.deepEqual(r.avisos, [`${id} checkin`]);
    assert.match(e.correos[0].subject, /Toca hacer el check-in · 01\/\d\d/);
    assert.ok(e.correos[0].htmlBody.includes(`accion=checkin&amp;id=${id}`));
    assert.ok(reservaDe(e, id).Aviso_Checkin_Enviado instanceof Date);
    e.comoPropietario(() => e.llamar('avisosDeChecklist'));
    assert.equal(e.correos.length, 1, 'no repite el aviso');
  });

  test('avisa del check-out desde la salida, pero no de salidas de hace más de un día', () => {
    const { e, id } = conReserva();
    fijarFechas(e, id, new Date(Date.now() - 2 * DIA), new Date(Date.now() - HORA));
    fijar(e, id, 'Checkin_Revisado', 'Hecho');
    assert.deepEqual(e.comoPropietario(() => e.llamar('avisosDeChecklist')).avisos, [`${id} checkout`]);
    const otra = conReserva();
    fijarFechas(otra.e, otra.id, new Date(Date.now() - 5 * DIA), new Date(Date.now() - 2 * DIA));
    fijar(otra.e, otra.id, 'Checkin_Revisado', 'Hecho');
    assert.deepEqual(otra.e.comoPropietario(() => otra.e.llamar('avisosDeChecklist')).avisos, []);
  });

  test('si el email no sale, no se anota: se reintenta en la siguiente pasada', () => {
    const { e, id } = conReserva();
    fijarFechas(e, id, new Date(Date.now() + HORA), new Date(Date.now() + DIA));
    e.hoja('Usuarios_Autorizados').datos.slice(1).forEach((f) => { f[1] = 'No'; });
    e.comoPropietario(() => e.llamar('avisosDeChecklist'));
    assert.equal(reservaDe(e, id).Aviso_Checkin_Enviado, '');
  });
});

test.describe('F-41 · retención de las fotos del contrato (tarea nocturna)', () => {
  test('a los 5 años de la salida manda la carpeta a la papelera, vacía el enlace y lo deja en el historial', () => {
    const { e, id } = conReserva(datosReservaPiscina({ canal: 'Directo', comision: '0' }));
    e.llamar('subirContrato', id, { nombre: 'c.jpg', tipoMime: 'image/jpeg', datosBase64: 'AAAA' });
    const carpeta = e.carpetas.documentos.carpetas[0].carpetas[0].carpetas[0];
    fijarFechas(e, id, new Date(2020, 0, 1, 11), new Date(2020, 0, 1, 19));
    e.comoPropietario(() => e.llamar('tareasNocturnas'));
    assert.equal(carpeta.papelera, true);
    assert.equal(reservaDe(e, id).Contrato_Archivo, '');
    assert.equal(reservaDe(e, id).Contrato_Estado, 'Firmado', 'el contrato sigue constando como firmado');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Fotos del contrato' && /más de 5 años/.test(h.Valor_Nuevo)));
  });

  test('antes de los 5 años no toca nada', () => {
    const { e, id } = conReserva(datosReservaPiscina({ canal: 'Directo', comision: '0' }));
    e.llamar('subirContrato', id, { nombre: 'c.jpg', tipoMime: 'image/jpeg', datosBase64: 'AAAA' });
    e.comoPropietario(() => e.llamar('tareasNocturnas'));
    assert.equal(e.carpetas.documentos.carpetas[0].carpetas[0].carpetas[0].papelera, false);
  });
});

test.describe('F-45 · puesta al día de los datos (tarea de editor)', () => {
  const pasada = (e, id) => fijarFechas(e, id, new Date(Date.now() - 10 * DIA), new Date(Date.now() - 8 * DIA));

  test('da por hechos el check-in y el check-out de las reservas pasadas, con su fila de checklist y su historial', () => {
    const { e, id } = conReserva();
    pasada(e, id);
    fijar(e, id, 'Estado_Cobro', 'Ingresado');
    const r = e.comoPropietario(() => e.llamar('ponerAlDiaReservas'));
    assert.deepEqual(r.reservasCambiadas, [id]);
    const res = reservaDe(e, id);
    assert.deepEqual([res.Checkin_Revisado, res.Checkout_Revisado, res.Estado_Reserva], ['Hecho', 'Hecho', 'Cerrada']);
    const filas = e.hoja('Checklists_Reserva').registros();
    assert.deepEqual(filas.map((f) => [f.Momento, f.Usuario]), [['Check-in', 'Puesta al día (2026-10-03)'], ['Check-out', 'Puesta al día (2026-10-03)']]);
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Check-out revisado' && h.Usuario === 'Puesta al día (2026-10-03)'));
  });

  test('cambia "Completada" por "Cerrada" y lo deja en el historial; repetirla no cambia nada', () => {
    const { e, id } = conReserva();
    pasada(e, id);
    ['Checkin_Revisado', 'Checkout_Revisado'].forEach((c) => fijar(e, id, c, 'Hecho'));
    fijar(e, id, 'Estado_Cobro', 'Ingresado');
    fijar(e, id, 'Estado_Reserva', 'Completada');
    e.comoPropietario(() => e.llamar('ponerAlDiaReservas'));
    assert.equal(reservaDe(e, id).Estado_Reserva, 'Cerrada');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Valor_Anterior === 'Completada' && h.Valor_Nuevo === 'Cerrada'));
    assert.deepEqual(e.comoPropietario(() => e.llamar('ponerAlDiaReservas')).reservasCambiadas, []);
  });

  test('no toca las reservas futuras ni las canceladas', () => {
    const { e, id } = conReserva();
    e.llamar('crearReserva', datosReservaPiscina());
    const cancelada = registros(e)[1].ID_Reserva;
    pasada(e, cancelada);
    e.llamar('cancelarReserva', cancelada);
    assert.deepEqual(e.comoPropietario(() => e.llamar('ponerAlDiaReservas')).reservasCambiadas, []);
    assert.equal(reservaDe(e, id).Checkin_Revisado, 'Pendiente');
  });

  test('pone el código del canal que el huésped escribió en el Form a la única reserva suya sin código', () => {
    const e = crearEntornoConDatos();
    e.hoja('Catálogo_Canales').datos.forEach((f) => { if (f[1] === 'Booking') f[2] = 'Sí'; });
    e.llamar('crearReserva', datosReservaHabitacion({ canal: 'Booking', refCanal: '', nombre: 'Ana García López' }));
    const id = registros(e)[0].ID_Reserva;
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Sheet_Viajeros_Id') f[1] = 'FORM'; });
    vm.runInContext('cacheConfig_ = null;', e.ctx);
    const libro = new e.LibroFalso();
    const form = libro.insertSheet('Respuestas de formulario 1');
    [CABECERAS_FORM, filaAdulto({ 'Código de reserva': 'hm nuevo 77', 'Marca temporal': new Date() })].forEach((f) => form.appendRow(f));
    e.librosExternos.FORM = libro;
    const r = e.comoPropietario(() => e.llamar('ponerAlDiaReservas'));
    assert.deepEqual(r.codigosAsignados, [{ id, codigo: 'HMNUEVO77' }]);
    assert.equal(reservaDe(e, id).Ref_Canal, 'HMNUEVO77');
  });

  test('pone al día el registro de viajeros de la Habitación con los formularios ya recibidos (RF-78)', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaHabitacion({ adultos: '1', menores: '0' }));
    const id = registros(e)[0].ID_Reserva;
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Sheet_Viajeros_Id') f[1] = 'FORM'; });
    vm.runInContext('cacheConfig_ = null;', e.ctx);
    const libro = new e.LibroFalso();
    const form = libro.insertSheet('Respuestas de formulario 1');
    [CABECERAS_FORM, filaAdulto({ 'Código de reserva': 'HMTEST1234', 'Marca temporal': new Date() })].forEach((f) => form.appendRow(f));
    e.librosExternos.FORM = libro;
    assert.equal(reservaDe(e, id).Registro_Viajeros_Estado, 'Pendiente');
    assert.deepEqual(e.comoPropietario(() => e.llamar('ponerAlDiaReservas')).reservasCambiadas, [id]);
    assert.equal(reservaDe(e, id).Registro_Viajeros_Estado, 'Completado');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Registro de viajeros' && h.Valor_Nuevo === 'Completado'));
    assert.deepEqual(e.comoPropietario(() => e.llamar('ponerAlDiaReservas')).reservasCambiadas, [], 'repetirla no cambia nada');
  });

  test('sin el Form configurado, sigue con lo demás y lo dice', () => {
    const { e } = conReserva();
    const r = e.comoPropietario(() => e.llamar('ponerAlDiaReservas'));
    assert.equal(r.success, true);
    assert.match(r.avisoForm, /Sheet_Viajeros_Id|Form/);
  });
});
