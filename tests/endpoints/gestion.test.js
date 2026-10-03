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

const listar = (e, filtro = {}) => e.llamar('listarReservasGestion', filtro).data;
const idsListados = (e, filtro) => listar(e, filtro).elementos.map((r) => r.id);

test.describe('RF-42/RF-43, F-34, F-36 · lista de gestión', () => {
  test('debe mostrar las no canceladas y filtrar por nombre, espacio y rango rápido', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    assert.equal(listar(e).total, 2);
    assert.deepEqual(idsListados(e, { nombre: 'ruiz' }), [idPiscina]);
    assert.deepEqual(idsListados(e, { espacio: 'Habitación Interior' }), [idHabitacion]);
    assert.deepEqual(idsListados(e, { rango: 'mes' }), [idPiscina, idHabitacion], 'dentro de 20 y de 30 días');
    assert.deepEqual(idsListados(e, { rango: 'semana' }), []);
    e.llamar('crearReserva', datosReservaPiscina({ fechaUnica: isoDentroDe(3) }));
    assert.equal(idsListados(e, { rango: 'semana' }).length, 1);
  });

  test('debe mostrar las canceladas solo con el filtro Cancelada, y filtrar por cobro', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    e.llamar('cancelarReserva', idPiscina);
    assert.deepEqual(idsListados(e), [idHabitacion]);
    assert.deepEqual(idsListados(e, { estado: 'Cancelada' }), [idPiscina]);
    assert.deepEqual(idsListados(e, { cobro: 'Ingresado' }), []);
    assert.deepEqual(idsListados(e, { cobro: 'No ingresado' }), [idHabitacion]);
  });

  test('Q-16 · sin filtros, la primera es la siguiente por fecha de entrada', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    assert.deepEqual(idsListados(e), [idPiscina, idHabitacion]);
  });

  test('F-36 · tarjeta con referencia, nombre, espacio corto, estado, cobro y fechas cortas', () => {
    const { e } = preparar();
    const [tarjeta] = listar(e, { espacio: 'Habitación Interior' }).elementos;
    assert.deepEqual(Object.keys(tarjeta).sort(), ['cobro', 'espacio', 'estado', 'finTexto', 'id', 'inicioTexto', 'nombre', 'ref'].sort());
    assert.equal(tarjeta.espacio, 'Interior');
    assert.match(tarjeta.inicioTexto, /^\d\d\/\d\d\/\d\d 16:00$/);
  });

  test('F-36 · pagina de 5 en 5', () => {
    const e = crearEntornoConDatos();
    for (let i = 0; i < 7; i += 1) e.llamar('crearReserva', datosReservaPiscina({ fechaUnica: isoDentroDe(10 + i) }));
    const p2 = listar(e, { pagina: 2 });
    assert.deepEqual([p2.total, p2.paginas, p2.pagina, p2.elementos.length], [7, 2, 2, 2]);
  });

  test('CLAUDE.md §4.8 · rechaza estados, cobros o espacios que no existen', () => {
    const { e } = preparar();
    assert.equal(e.llamar('listarReservasGestion', { estado: 'Borrada' }).success, false);
    assert.equal(e.llamar('listarReservasGestion', { cobro: 'Pagado' }).success, false);
    assert.equal(e.llamar('listarReservasGestion', { espacio: 'Garaje' }).success, false);
  });
});

test.describe('RF-44..RF-50 · ver y editar', () => {
  test('obtenerReserva devuelve la ficha completa', () => {
    const { e, idHabitacion } = preparar();
    const r = e.llamar('obtenerFichaReserva', idHabitacion);
    assert.equal(r.success, true);
    assert.equal(r.data.nombre, 'Marta Pérez');
    assert.equal(r.data.bruto, 320);
    assert.equal(r.data.cobro, 'No ingresado');
  });

  test('editar audita cada campo cambiado, recalcula importes y completa la reserva', () => {
    const { e, idHabitacion } = preparar();
    marcarCheckoutHecho(e, idHabitacion);
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    const r = e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { importeAlquiler: '400', cobro: 'Ingresado', nombre: 'Marta P. López' }));
    assert.equal(r.success, true, r.error);
    assert.equal(r.estado, 'Cerrada');
    const res = reserva(e, idHabitacion);
    assert.equal(res.Importe_Bruto, 420);
    assert.equal(res.Estado_Reserva, 'Cerrada');
    assert.equal(res.Modificado_Por, 'ana@test.com');
    const campos = e.hoja('Historial_Cambios').registros().map((h) => h.Campo);
    assert.deepEqual(campos.sort(), ['Estado de cobro', 'Estado de la reserva', 'Importe del alquiler', 'Nombre del huésped'].sort());
  });

  test('DI-18 · el formulario no puede marcar el contrato como firmado: solo la foto en "Contrato"', () => {
    const { e, idPiscina } = preparar();
    const d = e.llamar('obtenerFichaReserva', idPiscina).data;
    e.llamar('actualizarReserva', idPiscina, cambiosBase(d, { contratoEstado: 'Firmado' }));
    assert.equal(reserva(e, idPiscina).Contrato_Estado, d.contratoEstado);
  });

  test('RF-56 · el formulario no puede marcar el check-out: solo la checklist', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', checkout: 'Hecho' }));
    const res = reserva(e, idHabitacion);
    assert.equal(res.Checkout_Revisado, 'Pendiente');
    assert.equal(res.Estado_Reserva, 'Abierta');
  });

  test('B-09 · cambiar el nombre actualiza el título del evento de Calendar', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { nombre: 'Marta P. López' }));
    const ev = e.calendario.getEventById(reserva(e, idHabitacion).Calendar_Event_Id);
    assert.match(ev.getTitle(), /Marta P\. López$/);
  });

  test('RF-50 · incidencia sin resolver mantiene la reserva Abierta', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    const r = e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', incidencias: 'Con incidentes', incidenciaResuelta: 'No' }));
    assert.equal(r.estado, 'Abierta');
  });

  test('RF-51 · la ficha indica qué falta para completar', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    assert.deepEqual(d.pendientes, ['Pendiente de cobro', 'Check-out sin hacer']);
    marcarCheckoutHecho(e, idHabitacion);
    e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Ingresado', incidencias: 'Con incidentes', incidenciaResuelta: 'No' }));
    assert.deepEqual(e.llamar('obtenerFichaReserva', idHabitacion).data.pendientes, ['Incidencia sin resolver']);
  });

  test('B-04 · rechaza valores fuera de dominio y la edición de canceladas', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { cobro: 'Pagado' })).success, false);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { checkin: 'Quizá' })).success, false);
    e.llamar('cancelarReserva', idHabitacion);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d)).success, false);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { servicios: [] })).success, false);
  });

  test('reserva inexistente', () => {
    const { e } = preparar();
    assert.equal(e.llamar('obtenerFichaReserva', '1999-001').success, false);
  });
});

const conServicios = (e, id, servicios) => e.llamar('actualizarReserva', id, cambiosBase(e.llamar('obtenerFichaReserva', id).data, { servicios }));

test.describe('RF-49, F-44 · servicios de una reserva existente (con el mismo "Guardar cambios")', () => {
  test('sustituye líneas, recalcula sin tocar la comisión y conserva las de otras reservas', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    const antes = reserva(e, idPiscina);
    const r = conServicios(e, idPiscina, [{ nombre: 'BBQ', cantidad: '1' }, { nombre: 'Hielo', cantidad: '1' }]);
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

  test('sin `servicios` en los cambios no toca las líneas', () => {
    const { e, idPiscina } = preparar();
    const d = e.llamar('obtenerFichaReserva', idPiscina).data;
    e.llamar('actualizarReserva', idPiscina, cambiosBase(d, { notas: 'solo notas' }));
    assert.deepEqual(e.hoja('Reserva_Servicios').registros().filter((l) => l.ID_Reserva === idPiscina).map((l) => l.Nombre_Servicio), ['Hielo']);
  });

  test('B-03 · si la escritura falla no se pierden las líneas de otras reservas', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idPiscina).data;
    const hoja = e.hoja('Reserva_Servicios');
    hoja.fallarEnEscritura = hoja.escrituras + 2;
    e.llamar('actualizarReserva', idPiscina, cambiosBase(d, { servicios: [{ nombre: 'BBQ', cantidad: '1' }] }));
    hoja.fallarEnEscritura = null;
    assert.ok(hoja.registros().some((l) => l.ID_Reserva === idHabitacion), 'la línea de la otra reserva sigue');
  });

  test('la ficha trae el catálogo del espacio y las líneas actuales con su cobro', () => {
    const { e, idPiscina } = preparar();
    const { servicios } = e.llamar('obtenerFichaReserva', idPiscina).data;
    assert.deepEqual(servicios.catalogo.map((s) => s.nombre), ['Hielo', 'BBQ']);
    assert.deepEqual(servicios.lineas.map((l) => [l.nombre, l.cantidad, l.cobroEstado]), [['Hielo', 3, 'Pendiente']]);
  });
});

test.describe('F-43 · cobro de servicios extra (vía plataforma o presencial)', () => {
  const servicios = (e, id) => e.llamar('cargarServiciosCobro', id).data;

  test('al crear la reserva sus servicios quedan Pendientes de cobro', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaPiscina({ servicios: [{ nombre: 'Hielo', cantidad: '1' }, { nombre: 'BBQ', cantidad: '1' }] }));
    const lineas = e.hoja('Reserva_Servicios').registros().map((l) => [l.Nombre_Servicio, l.Cobro_Estado, l.Cobro_Forma]);
    assert.deepEqual(lineas, [['Hielo', 'Pendiente', ''], ['BBQ', 'Pendiente', '']]);
  });

  test('cobrar pide la forma, la guarda y la reserva deja de proponerse en Extras', () => {
    const { e, idPiscina } = preparar();
    assert.equal(e.llamar('buscarReservasPara', 'extras', {}).data.propuesta.id, idPiscina, 'tiene el Hielo pendiente');
    assert.equal(e.llamar('registrarCobroServicio', idPiscina, 'Hielo', 'cobrado', '').success, false, 'sin forma no');
    assert.equal(e.llamar('registrarCobroServicio', idPiscina, 'Hielo', 'cobrado', 'Presencial').success, true);
    assert.deepEqual(servicios(e, idPiscina).lineas, [{ nombre: 'Hielo', cantidad: 3, importe: 9, estado: 'Cobrado', forma: 'Presencial' }]);
    assert.notEqual(e.llamar('buscarReservasPara', 'extras', {}).data.propuesta.id, idPiscina);
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Cobro de servicios extra' && h.Valor_Nuevo === 'Hielo (Cobrado, Presencial)'));
  });

  test('añadir un servicio desde Extras lo deja Pendiente, recalcula importes sin tocar la comisión y trae el catálogo', () => {
    const { e, idPiscina } = preparar();
    const antes = reserva(e, idPiscina);
    assert.deepEqual(servicios(e, idPiscina).catalogo.map((x) => x.nombre), ['Hielo', 'BBQ']);
    assert.equal(e.llamar('anadirServicioReserva', idPiscina, 'BBQ', '2').success, true);
    const res = reserva(e, idPiscina);
    assert.equal(res.Importe_Bruto, antes.Importe_Bruto + 40);
    assert.equal(res.Importe_Comisión, antes.Importe_Comisión);
    assert.deepEqual(servicios(e, idPiscina).lineas.map((l) => [l.nombre, l.cantidad, l.estado]), [['Hielo', 3, 'Pendiente'], ['BBQ', 2, 'Pendiente']]);
    assert.equal(e.llamar('anadirServicioReserva', idPiscina, 'Desayuno', '1').success, false, 'no es de este espacio');
  });

  test('quitar un servicio que el cliente rechazó lo elimina y recalcula los importes', () => {
    const { e, idPiscina } = preparar();
    conServicios(e, idPiscina, [{ nombre: 'BBQ', cantidad: '1' }, { nombre: 'Hielo', cantidad: '1' }]);
    const bruto = reserva(e, idPiscina).Importe_Bruto;
    assert.equal(e.llamar('registrarCobroServicio', idPiscina, 'BBQ', 'quitar', '').success, true);
    assert.equal(reserva(e, idPiscina).Importe_Bruto, bruto - 20);
    assert.equal(reserva(e, idPiscina).Servicios_Extra, 'Hielo x1');
  });

  test('rechaza acciones desconocidas y reservas canceladas', () => {
    const { e, idPiscina } = preparar();
    assert.equal(e.llamar('registrarCobroServicio', idPiscina, 'Hielo', 'regalar', '').success, false);
    e.llamar('cancelarReserva', idPiscina);
    assert.equal(e.llamar('registrarCobroServicio', idPiscina, 'Hielo', 'quitar', '').success, false);
    assert.equal(e.llamar('anadirServicioReserva', idPiscina, 'BBQ', '1').success, false);
  });
});

test.describe('F-37 · marcar como ingresada (desde el email, tras confirmar)', () => {
  test('marca Ingresado, lo audita y repetirlo no cambia nada', () => {
    const { e, idHabitacion } = preparar();
    assert.equal(e.llamar('marcarIngresado', idHabitacion).success, true);
    assert.equal(reserva(e, idHabitacion).Estado_Cobro, 'Ingresado');
    const cambios = e.hoja('Historial_Cambios').registros().length;
    assert.equal(e.llamar('marcarIngresado', idHabitacion).yaEstaba, true);
    assert.equal(e.hoja('Historial_Cambios').registros().length, cambios);
  });

  test('con el check-out hecho, la reserva pasa a Cerrada', () => {
    const { e, idHabitacion } = preparar();
    marcarCheckoutHecho(e, idHabitacion);
    assert.equal(e.llamar('marcarIngresado', idHabitacion).estado, 'Cerrada');
  });

  test('no se puede marcar una cancelada ni una inexistente', () => {
    const { e, idHabitacion } = preparar();
    e.llamar('cancelarReserva', idHabitacion);
    assert.equal(e.llamar('marcarIngresado', idHabitacion).success, false);
    assert.equal(e.llamar('marcarIngresado', '1999-001').success, false);
  });
});

test.describe('F-42 · ficha de la reserva', () => {
  test('trae Total PAX, si es de Interior, checklists, identidades y el historial en una sola llamada', () => {
    const { e, idHabitacion, idPiscina } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    assert.equal(d.totalPersonas, 2);
    assert.equal(d.esInterior, true);
    assert.deepEqual(d.checklists.checkin, { estado: 'Pendiente', usuario: '', fecha: '' });
    assert.deepEqual([d.identidades.validados, d.identidades.personas, d.identidades.completa, d.identidades.sesComunicado], [0, 2, false, false]);
    assert.deepEqual(d.historial, []);
    const p = e.llamar('obtenerFichaReserva', idPiscina).data;
    assert.equal(p.esInterior, false);
    assert.equal(p.identidades, null);
  });

  test('la checklist guardada muestra quién la guardó y cuándo', () => {
    const { e, idPiscina } = preparar();
    e.llamar('guardarChecklist', idPiscina, 'Check-in', [], 'todo bien');
    const { checkin } = e.llamar('obtenerFichaReserva', idPiscina).data.checklists;
    assert.equal(checkin.usuario, 'ana@test.com');
    assert.match(checkin.fecha, /^\d\d\/\d\d\/\d{4} \d\d:\d\d$/);
  });

  test('una cancelada se puede consultar pero no modificar', () => {
    const { e, idPiscina } = preparar();
    e.llamar('cancelarReserva', idPiscina);
    assert.equal(e.llamar('obtenerFichaReserva', idPiscina).data.modificable, false);
  });
});

test.describe('DD-03 §3.5 · funciones de la barra de Reservas', () => {
  test('Identidades solo ofrece la Habitación y Contrato solo la Piscina, y proponen la siguiente', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    const para = (funcion, filtro = {}) => e.llamar('buscarReservasPara', funcion, filtro).data;
    assert.deepEqual(para('identidades').opciones.map((r) => r.id), [idHabitacion]);
    assert.equal(para('identidades').propuesta.id, idHabitacion);
    assert.deepEqual(para('contrato').opciones.map((r) => r.id), [idPiscina]);
    assert.equal(para('checkin').propuesta.id, idPiscina, 'la Piscina llega antes');
    assert.deepEqual(para('checkin', { espacio: 'Habitación Interior' }).opciones.map((r) => r.id), [idHabitacion]);
    assert.deepEqual(para('checkin', { nombre: 'marta' }).opciones.map((r) => r.id), [idHabitacion]);
  });

  test('rechaza una función desconocida', () => {
    const { e } = preparar();
    assert.equal(e.llamar('buscarReservasPara', 'borrar', {}).success, false);
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
    assert.ok(e.correos.some((c) => /! Reabre canales · .* \(reserva \d\d\/\d\d cancelada\)/.test(c.subject)));
    assert.equal(e.llamar('cancelarReserva', idPiscina).success, false);
    const h = e.llamar('obtenerFichaReserva', idPiscina).data.historial;
    assert.equal(h[0].nuevo, 'Cancelada');
  });
});

test.describe('RF-88 · código de reserva del canal', () => {
  test('crear en un canal que lo exige sin código se rechaza y no guarda nada', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('crearReserva', datosReservaHabitacion({ refCanal: '' }));
    assert.deepEqual([r.success, r.error], [false, 'El código de reserva de Airbnb es obligatorio.']);
    assert.equal(e.hoja('Reservas').registros().length, 0);
  });

  test('en un canal que no lo exige es opcional; si viene, se guarda y se ve en la ficha', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    assert.equal(reserva(e, idPiscina).Ref_Canal, '');
    assert.equal(e.llamar('obtenerFichaReserva', idHabitacion).data.refCanal, 'HMTEST1234');
  });

  test('B-21 · la ficha indica si el código es obligatorio al editar, con la misma regla que el servidor', () => {
    const { e, idPiscina, idHabitacion } = preparar();
    assert.equal(e.llamar('obtenerFichaReserva', idHabitacion).data.refCanalObligatoria, true);
    assert.equal(e.llamar('obtenerFichaReserva', idPiscina).data.refCanalObligatoria, false);
  });

  test('editar no permite borrarlo si el canal lo exige, pero sí cambiarlo (y se audita)', () => {
    const { e, idHabitacion } = preparar();
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { refCanal: '' })).success, false);
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { refCanal: 'HMNUEVO999' })).success, true);
    assert.equal(reserva(e, idHabitacion).Ref_Canal, 'HMNUEVO999');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Código de reserva del canal'));
  });

  test('una reserva anterior sin código se sigue pudiendo editar sin rellenarlo', () => {
    const { e, idHabitacion } = preparar();
    const hoja = e.hoja('Reservas');
    const fila = hoja.registros().findIndex((r) => r.ID_Reserva === idHabitacion) + 2;
    hoja.getRange(fila, hoja.cabeceras().indexOf('Ref_Canal') + 1).setValue('');
    const d = e.llamar('obtenerFichaReserva', idHabitacion).data;
    assert.equal(e.llamar('actualizarReserva', idHabitacion, cambiosBase(d, { refCanal: '', notas: 'x' })).success, true);
  });
});

test.describe('D-45 · la ficha y "Identidades" ven también lo comunicado a SES a mano (consta solo en el Form)', () => {
  const vm = require('node:vm');
  const { CABECERAS_FORM, filaAdulto } = require('../soporte/form_viajeros');
  const conForm = (e, filas) => {
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Sheet_Viajeros_Id') f[1] = 'FORM'; });
    vm.runInContext('cacheConfig_ = null;', e.ctx);
    const libro = new e.LibroFalso();
    const hoja = libro.insertSheet('Respuestas de formulario 1');
    [CABECERAS_FORM, ...filas].forEach((f) => hoja.appendRow(f));
    e.librosExternos.FORM = libro;
  };

  test('con la casilla "Comunicados" y su código en el Form, la ficha dice SES: Sí (a mano) e identidad comunicada', () => {
    const { e, idHabitacion } = preparar();
    conForm(e, [filaAdulto({ 'Código de reserva': 'HMTEST1234', Comunicados: true, 'Código de comunicación': 'COD-MANUAL-1' })]);
    const i = e.llamar('obtenerFichaReserva', idHabitacion).data.identidades;
    assert.deepEqual([i.sesComunicado, i.sesManual, i.sesCodigo, i.formNoDisponible], [true, true, 'COD-MANUAL-1', false]);
  });

  test('sin la casilla marcada, SES: No; y si el Form no se puede leer, la ficha lo dice sin fallar', () => {
    const { e, idHabitacion } = preparar();
    conForm(e, [filaAdulto({ 'Código de reserva': 'HMTEST1234', Comunicados: false })]);
    assert.equal(e.llamar('obtenerFichaReserva', idHabitacion).data.identidades.sesComunicado, false);
    const otro = preparar();
    const r = otro.e.llamar('obtenerFichaReserva', otro.idHabitacion);
    assert.equal(r.success, true);
    assert.equal(r.data.identidades.formNoDisponible, true);
  });

  test('"Identidades" no propone una reserva ya comunicada a mano', () => {
    const { e, idHabitacion } = preparar();
    assert.equal(e.llamar('buscarReservasPara', 'identidades', {}).data.propuesta.id, idHabitacion);
    conForm(e, [filaAdulto({ 'Código de reserva': 'HMTEST1234', Comunicados: true, 'Código de comunicación': 'COD-MANUAL-1' })]);
    assert.equal(e.llamar('buscarReservasPara', 'identidades', {}).data.propuesta, null);
  });
});
