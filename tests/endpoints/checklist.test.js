// F-14 · Checklists digitales (DD-01): catálogo, puntos aplicables, registro y cierre.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno, crearEntornoConDatos, datosReservaPiscina, datosReservaHabitacion } = require('../soporte/gas');
const { leerChecklistsMd } = require('../soporte/checklists_md');

const plano = (x) => JSON.parse(JSON.stringify(x));

test.describe('F-14 · catálogo de checklists', () => {
  test('la semilla del código coincide punto por punto con docs_work/doc_check/checklists-check-in-out.md', () => {
    const e = crearEntorno();
    const semilla = plano(e.fn('SEMILLA_CHECKLIST'));
    const md = leerChecklistsMd().map((r) => [r.id, r.espacio, r.momento, r.bloque, r.punto, r.tipo, r.servicios, r.condicion, r.pareja, r.orden, r.activo]);
    assert.deepEqual(semilla, md);
  });

  test('reparar hojas crea Catálogo_Checklist con los 138 puntos y Checklists_Reserva vacía', () => {
    const e = crearEntornoConDatos();
    assert.equal(e.hoja('Catálogo_Checklist').registros().length, 138);
    assert.deepEqual(e.hoja('Checklists_Reserva').cabeceras(), ['ID_Reserva', 'Momento', 'Puntos', 'Observaciones', 'Usuario', 'Fecha_Hora']);
    assert.equal(e.hoja('Checklists_Reserva').registros().length, 0);
  });
});

const archivo = (nombre) => ({ nombre, tipoMime: 'video/mp4', datosBase64: Buffer.alloc(10).toString('base64') });

// Reserva de Piscina con barbacoa contratada; devuelve el entorno y el ID interno.
const conReservaPiscina = () => {
  const e = crearEntornoConDatos();
  e.hoja('Catálogo_Servicios_Extra').appendRow(['Piscina / Jardín', 'Carbón 1 Bolsa', 'Sí', 0, 10]);
  e.llamar('crearReserva', datosReservaPiscina({ servicios: [{ nombre: 'Carbón 1 Bolsa', cantidad: '1' }] }));
  return { e, id: e.hoja('Reservas').registros()[0].ID_Reserva };
};
const puntosDe = (data) => data.bloques.flatMap((b) => b.puntos);
const VALOR_RESUELTO = { Fecha: '2026-09-27', 'Daños': 'Sin daños' };
const todosResueltos = (data, cambios = {}) => puntosDe(data).map((p) => ({
  idPunto: p.id, estado: 'Hecho', valor: VALOR_RESUELTO[p.tipo] || '', ...(cambios[p.id] || {}),
}));

test.describe('F-14 · cargar, guardar y confirmar la checklist', () => {
  test('carga los bloques aplicables, con la barbacoa si está contratada y sin extras no contratados', () => {
    const { e, id } = conReservaPiscina();
    const r = e.llamar('cargarChecklist', id, 'Check-in');
    assert.equal(r.success, true, r.error);
    const bloques = r.data.bloques.map((b) => b.nombre);
    assert.ok(bloques.includes('Barbacoa'));
    assert.ok(!bloques.includes('Extras'));
    assert.equal(r.data.confirmada, false);
    assert.equal(r.data.resueltos, 0);
  });

  test('guarda estados (Hecho / No aplica) con usuario y los devuelve al cargar', () => {
    const { e, id } = conReservaPiscina();
    const r = e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }, { idPunto: 'EXT-IN-02', estado: 'No aplica' }], 'Todo bien');
    assert.equal(r.success, true, r.error);
    const data = e.llamar('cargarChecklist', id, 'Check-in').data;
    const [p1, p2] = puntosDe(data);
    assert.deepEqual([p1.estado, p2.estado], ['Hecho', 'No aplica']);
    assert.equal(data.resueltos, 2);
    assert.equal(data.observaciones, 'Todo bien');
    const [fila] = e.hoja('Checklists_Reserva').registros();
    assert.equal(JSON.parse(fila.Puntos).find((p) => p.idPunto === 'EXT-IN-01').usuario, 'ana@test.com');
  });

  test('TD-02 · volver a guardar actualiza la fila de esa checklist, no duplica', () => {
    const { e, id } = conReservaPiscina();
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }], '');
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'No aplica' }], '');
    const filas = e.hoja('Checklists_Reserva').registros();
    assert.equal(filas.length, 1);
    const puntos = JSON.parse(filas[0].Puntos).filter((p) => p.idPunto === 'EXT-IN-01');
    assert.deepEqual(puntos.map((p) => p.estado), ['No aplica']);
  });

  test('TD-02 · cada checklist (reserva + momento) tiene su fila y guardar una no toca las demás', () => {
    const { e, id } = conReservaPiscina();
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }], 'entrada');
    const antes = e.hoja('Checklists_Reserva').filas()[0].slice();
    e.llamar('guardarChecklist', id, 'Check-out', [{ idPunto: 'EXT-OUT-01', estado: 'Hecho' }], 'salida');
    const filas = e.hoja('Checklists_Reserva').filas();
    assert.equal(filas.length, 2);
    assert.deepEqual(filas[0], antes);
    assert.equal(e.llamar('cargarChecklist', id, 'Check-out').data.observaciones, 'salida');
  });

  test('TD-02 · un punto sin cambios conserva quién lo marcó', () => {
    const { e, id } = conReservaPiscina();
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }], '');
    e.sesion.activo = 'luis@test.com';
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }, { idPunto: 'EXT-IN-02', estado: 'Hecho' }], '');
    const puntos = JSON.parse(e.hoja('Checklists_Reserva').registros()[0].Puntos);
    assert.deepEqual(puntos.map((p) => p.usuario), ['ana@test.com', 'luis@test.com']);
  });

  test('TD-02 · si la celda de puntos es ilegible, no se guarda encima y se avisa', () => {
    const { e, id } = conReservaPiscina();
    e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Hecho' }], '');
    const hoja = e.hoja('Checklists_Reserva');
    hoja.datos[1][hoja.datos[0].indexOf('Puntos')] = '{roto';
    assert.equal(e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-02', estado: 'Hecho' }], '').success, false);
    assert.equal(hoja.datos[1][hoja.datos[0].indexOf('Puntos')], '{roto');
  });

  test('rechaza puntos que no pertenecen a la lista, estados inválidos y momentos inválidos', () => {
    const { e, id } = conReservaPiscina();
    assert.equal(e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'INT-IN-01', estado: 'Hecho' }], '').success, false);
    assert.equal(e.llamar('guardarChecklist', id, 'Check-in', [{ idPunto: 'EXT-IN-01', estado: 'Quizá' }], '').success, false);
    assert.equal(e.llamar('cargarChecklist', id, 'Durante').success, false);
  });

  test('confirmar exige la lista resuelta; al confirmar el check-out, con cobro, la reserva se completa y se audita', () => {
    const { e, id } = conReservaPiscina();
    assert.equal(e.llamar('confirmarChecklist', id, 'Check-out').success, false);
    const data = e.llamar('cargarChecklist', id, 'Check-out').data;
    e.llamar('guardarChecklist', id, 'Check-out', todosResueltos(data), '');
    const d = e.llamar('obtenerFichaReserva', id).data;
    e.llamar('actualizarReserva', id, { ...d, comisionPct: d.comisionPct, cobro: 'Ingresado' });
    const r = e.llamar('confirmarChecklist', id, 'Check-out');
    assert.equal(r.success, true, r.error);
    const reserva = e.hoja('Reservas').registros()[0];
    assert.equal(reserva.Checkout_Revisado, 'Hecho');
    assert.equal(reserva.Estado_Reserva, 'Cerrada');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Check-out revisado' && h.Valor_Nuevo === 'Hecho'));
  });

  test('B-18 · si una checklist terminada vuelve a tener un punto pendiente, deja de estar terminada', () => {
    const { e, id } = conReservaPiscina();
    const data = e.llamar('cargarChecklist', id, 'Check-in').data;
    e.llamar('guardarChecklist', id, 'Check-in', todosResueltos(data), '');
    e.llamar('confirmarChecklist', id, 'Check-in');
    const r = e.llamar('guardarChecklist', id, 'Check-in', todosResueltos(data, { 'EXT-IN-01': { estado: 'Pendiente' } }), '');
    assert.equal(r.reabierta, true);
    assert.equal(e.hoja('Reservas').registros()[0].Checkin_Revisado, 'Pendiente');
    assert.equal(e.llamar('cargarChecklist', id, 'Check-in').data.confirmada, false);
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Check-in revisado' && h.Valor_Nuevo === 'Pendiente'));
  });

  test('B-18 · guardar una checklist terminada que sigue resuelta no la reabre', () => {
    const { e, id } = conReservaPiscina();
    const data = e.llamar('cargarChecklist', id, 'Check-in').data;
    e.llamar('guardarChecklist', id, 'Check-in', todosResueltos(data), '');
    e.llamar('confirmarChecklist', id, 'Check-in');
    assert.equal(e.llamar('guardarChecklist', id, 'Check-in', todosResueltos(data), 'Nota').reabierta, false);
    assert.equal(e.hoja('Reservas').registros()[0].Checkin_Revisado, 'Hecho');
  });

  test('B-19 · los puntos de daños son de tipo Daños, se resuelven con Sin daños o Con daños y no admiten "No aplica"', () => {
    const { e, id } = conReservaPiscina();
    const data = e.llamar('cargarChecklist', id, 'Check-out').data;
    const danos = puntosDe(data).filter((p) => p.tipo === 'Daños').map((p) => p.id);
    assert.deepEqual(danos.sort(), ['EXT-OUT-03', 'EXT-OUT-04', 'EXT-OUT-21']);
    const conDanos = todosResueltos(data, { 'EXT-OUT-21': { valor: 'Con daños' } });
    assert.equal(e.llamar('guardarChecklist', id, 'Check-out', conDanos, '').success, true);
    assert.equal(e.llamar('cargarChecklist', id, 'Check-out').data.resuelta, true);
    const noAplica = todosResueltos(data, { 'EXT-OUT-03': { estado: 'No aplica', valor: '' } });
    assert.equal(e.llamar('guardarChecklist', id, 'Check-out', noAplica, '').success, false);
    const sinRespuesta = todosResueltos(data, { 'EXT-OUT-03': { valor: '' } });
    e.llamar('guardarChecklist', id, 'Check-out', sinRespuesta, '');
    assert.equal(e.llamar('cargarChecklist', id, 'Check-out').data.resuelta, false);
  });

  test('un punto de fecha sin fecha no deja confirmar', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaHabitacion());
    const id = e.hoja('Reservas').registros()[0].ID_Reserva;
    const data = e.llamar('cargarChecklist', id, 'Check-out').data;
    e.llamar('guardarChecklist', id, 'Check-out', todosResueltos(data, { 'INT-OUT-09': { valor: '' } }), '');
    assert.equal(e.llamar('confirmarChecklist', id, 'Check-out').success, false);
  });

  test('subir el vídeo de inicio marca solo su punto de la checklist', () => {
    const { e, id } = conReservaPiscina();
    e.llamar('subirVideo', id, 'In', archivo('in.mp4'));
    const video = puntosDe(e.llamar('cargarChecklist', id, 'Check-in').data).find((p) => p.tipo === 'Video');
    assert.equal(video.estado, 'Hecho');
  });

  test('sube una foto de desperfectos a Drive y la anota en la checklist de salida', () => {
    const { e, id } = conReservaPiscina();
    const r = e.llamar('subirFotoDesperfecto', id, { nombre: 'golpe.jpg', tipoMime: 'image/jpeg', datosBase64: Buffer.alloc(10).toString('base64') });
    assert.equal(r.success, true, r.error);
    const foto = puntosDe(e.llamar('cargarChecklist', id, 'Check-out').data).find((p) => p.tipo === 'Foto');
    assert.equal(foto.estado, 'Hecho');
    assert.match(foto.valor, /http/);
  });
});

test.describe('F-14 · editor de la checklist (solo Admin)', () => {
  const conAdmin = () => {
    const e = crearEntornoConDatos();
    e.hoja('Usuarios_Autorizados').appendRow(['jefe@test.com', 'Sí', 'Admin']);
    return e;
  };
  const comoAdmin = (e) => { e.sesion.activo = 'jefe@test.com'; };

  test('solo un Admin puede ver y editar el catálogo', () => {
    const e = conAdmin();
    assert.equal(e.llamar('cargarCatalogoChecklist', 'Piscina / Jardín', 'Check-in').success, false);
    assert.equal(e.llamar('guardarPuntoChecklist', { id: 'EXT-IN-01', activo: 'No' }).success, false);
    comoAdmin(e);
    const r = e.llamar('cargarCatalogoChecklist', 'Piscina / Jardín', 'Check-in');
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.length, 40);
  });

  test('desactivar un punto lo oculta en las reservas pero no lo borra', () => {
    const e = conAdmin();
    comoAdmin(e);
    const r = e.llamar('guardarPuntoChecklist', { id: 'EXT-IN-01', activo: 'No' });
    assert.equal(r.success, true, r.error);
    const fila = e.hoja('Catálogo_Checklist').registros().find((p) => p.ID_Punto === 'EXT-IN-01');
    assert.equal(fila.Activo, 'No');
    assert.equal(fila.Punto, 'Suelo de la barbacoa barrido y baldeado');
  });

  test('añade un punto a un bloque existente o a un bloque nuevo, con ID nuevo y al final', () => {
    const e = conAdmin();
    comoAdmin(e);
    const r = e.llamar('guardarPuntoChecklist', { espacio: 'Piscina / Jardín', momento: 'Check-in', bloque: 'Jardín', punto: 'Césped regado' });
    assert.equal(r.success, true, r.error);
    const nuevo = e.hoja('Catálogo_Checklist').registros().find((p) => p.Punto === 'Césped regado');
    assert.equal(nuevo.ID_Punto, 'EXT-IN-41');
    assert.equal(nuevo.Orden, 41);
    assert.equal(nuevo.Tipo, 'Casilla');
    assert.equal(nuevo.Activo, 'Sí');
  });

  test('rechaza espacio, momento, tipo o texto no válidos', () => {
    const e = conAdmin();
    comoAdmin(e);
    const base = { espacio: 'Piscina / Jardín', momento: 'Check-in', bloque: 'X', punto: 'Y' };
    assert.equal(e.llamar('guardarPuntoChecklist', { ...base, espacio: 'Garaje' }).success, false);
    assert.equal(e.llamar('guardarPuntoChecklist', { ...base, momento: 'Durante' }).success, false);
    assert.equal(e.llamar('guardarPuntoChecklist', { ...base, tipo: 'Audio' }).success, false);
    assert.equal(e.llamar('guardarPuntoChecklist', { ...base, punto: '' }).success, false);
    assert.equal(e.llamar('guardarPuntoChecklist', { id: 'NO-EXISTE', activo: 'No' }).success, false);
  });
});
