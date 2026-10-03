// Tests unitarios de las reglas de DD-03 (Reservas: listado, funciones de la barra, avisos, cobro aparte y puesta al día).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');

const { fn } = crearEntorno();
const plano = (v) => JSON.parse(JSON.stringify(v));
const d = (y, m, dia, h = 0, min = 0) => new Date(y, m - 1, dia, h, min);
const AHORA = d(2030, 7, 10, 12);
const INTERIOR = 'Habitación Interior';
const EXTERIOR = 'Piscina / Jardín';

const reserva = (id, cambios = {}) => ({
  id, espacio: INTERIOR, nombre: 'Marta Pérez', estado: 'Abierta', cobro: 'No ingresado', checkin: 'Pendiente', checkout: 'Pendiente',
  contratoEstado: 'Pendiente', inicio: d(2030, 7, 20, 16), fin: d(2030, 7, 22, 12), adultos: 2, menores: 1, refCanal: '',
  avisoCheckin: '', avisoCheckout: '', contratoArchivo: '', ...cambios,
});
const ids = (lista) => plano(lista).map((r) => r.id);

test.describe('Q-07 · "Completada" pasa a "Cerrada"', () => {
  test('debe leer el valor antiguo como Cerrada y dejar el resto igual', () => {
    const n = fn('normalizarEstadoReserva_');
    assert.deepEqual(['Completada', 'Cerrada', 'Abierta', ' Cancelada '].map(n), ['Cerrada', 'Cerrada', 'Abierta', 'Cancelada']);
  });
});

test.describe('F-34 · filtros de Gestionar', () => {
  const c = (r, criterio) => fn('coincideFiltroGestion_')(r, { nombre: '', espacio: '', estado: '', cobro: '', desde: null, hasta: null, ...criterio });
  test('debe ocultar las canceladas salvo que se pidan', () => {
    const cancelada = reserva('a', { estado: 'Cancelada' });
    assert.equal(c(cancelada, {}), false);
    assert.equal(c(cancelada, { estado: 'Cancelada' }), true);
    assert.equal(c(reserva('b'), { estado: 'Cancelada' }), false);
  });
  test('debe filtrar por espacio, estado y cobro', () => {
    const r = reserva('a', { estado: 'Cerrada', cobro: 'Ingresado' });
    assert.equal(c(r, { espacio: EXTERIOR }), false);
    assert.equal(c(r, { espacio: INTERIOR, estado: 'Cerrada', cobro: 'Ingresado' }), true);
    assert.equal(c(r, { cobro: 'No ingresado' }), false);
  });
  test('Próxima semana va de hoy a las 00:00 a dentro de 7 días a las 23:59; un rango desconocido no filtra', () => {
    const { desde, hasta } = plano(fn('rangoRapido_')('semana', AHORA));
    assert.equal(new Date(desde).getTime(), d(2030, 7, 10).getTime());
    assert.equal(new Date(hasta).getTime(), d(2030, 7, 17, 23, 59).getTime() + 59999);
    assert.deepEqual(plano(fn('rangoRapido_')('año', AHORA)), { desde: null, hasta: null });
  });
});

test.describe('Q-16 · orden de Gestionar y paginado (F-36)', () => {
  const lista = [
    reserva('pasada-antigua', { inicio: d(2030, 6, 1), fin: d(2030, 6, 2) }),
    reserva('lejana', { inicio: d(2030, 9, 1), fin: d(2030, 9, 3) }),
    reserva('en-curso', { inicio: d(2030, 7, 9), fin: d(2030, 7, 11) }),
    reserva('pasada-reciente', { inicio: d(2030, 7, 5), fin: d(2030, 7, 6) }),
    reserva('cercana', { inicio: d(2030, 7, 15), fin: d(2030, 7, 16) }),
  ];
  test('debe poner primero la en curso y las próximas de la más cercana a la más lejana, y después las pasadas de la más reciente a la más antigua', () => {
    assert.deepEqual(ids(fn('ordenarParaGestion_')(lista, AHORA)), ['en-curso', 'cercana', 'lejana', 'pasada-reciente', 'pasada-antigua']);
  });
  test('no debe mutar la lista recibida', () => {
    const copia = [...lista];
    fn('ordenarParaGestion_')(lista, AHORA);
    assert.deepEqual(ids(lista), ids(copia));
  });
  test('debe paginar de 5 en 5 y acotar la página pedida', () => {
    const doce = Array.from({ length: 12 }, (_, i) => i);
    const p = (pagina) => plano(fn('paginar_')(doce, pagina, 5));
    assert.deepEqual(p(1), { elementos: [0, 1, 2, 3, 4], pagina: 1, paginas: 3, total: 12 });
    assert.deepEqual(p(3).elementos, [10, 11]);
    assert.equal(p(9).pagina, 3);
    assert.equal(p('x').pagina, 1);
    assert.deepEqual(plano(fn('paginar_')([], 1, 5)), { elementos: [], pagina: 1, paginas: 1, total: 0 });
  });
  test('F-32 · las próximas incluyen la que está en curso y excluyen canceladas y pasadas', () => {
    const conCancelada = [...lista, reserva('cancelada', { estado: 'Cancelada', inicio: d(2030, 7, 12), fin: d(2030, 7, 13) })];
    assert.deepEqual(ids(fn('proximasReservas_')(conCancelada, AHORA, 2)), ['en-curso', 'cercana']);
  });
});

test.describe('DD-03 §3.5 · funciones de la barra de Reservas', () => {
  const contexto = (extra = {}) => ({ espaciosInterior: [INTERIOR], partesComunicados: new Set(), conExtrasPendientes: new Set(), ...extra });
  const propuesta = (funcion, lista, c = contexto()) => {
    const r = fn('propuestaDeFuncion_')(funcion, lista, c, AHORA);
    return r ? r.id : null;
  };
  test('Identidades solo ofrece Interior y Contrato solo Exterior; ninguna ofrece canceladas', () => {
    const lista = [reserva('int'), reserva('ext', { espacio: EXTERIOR }), reserva('cancelada', { estado: 'Cancelada' })];
    assert.deepEqual(ids(fn('reservasDeFuncion_')('identidades', lista, contexto())), ['int']);
    assert.deepEqual(ids(fn('reservasDeFuncion_')('contrato', lista, contexto())), ['ext']);
    assert.deepEqual(ids(fn('reservasDeFuncion_')('checkin', lista, contexto())), ['int', 'ext']);
  });
  test('Check-in propone la siguiente que no ha terminado y tiene el check-in pendiente', () => {
    const lista = [
      reserva('hecha', { inicio: d(2030, 7, 11), fin: d(2030, 7, 12), checkin: 'Hecho' }),
      reserva('lejana', { inicio: d(2030, 8, 1), fin: d(2030, 8, 2) }),
      reserva('cercana', { inicio: d(2030, 7, 12), fin: d(2030, 7, 13) }),
      reserva('pasada', { inicio: d(2030, 7, 1), fin: d(2030, 7, 2) }),
    ];
    assert.equal(propuesta('checkin', lista), 'cercana');
  });
  test('Check-out propone la última que ya ha empezado y sigue sin check-out; si no hay, la siguiente', () => {
    const lista = [
      reserva('anterior', { inicio: d(2030, 7, 1), fin: d(2030, 7, 3) }),
      reserva('recien-ida', { inicio: d(2030, 7, 8), fin: d(2030, 7, 9, 12) }),
      reserva('futura', { inicio: d(2030, 7, 20), fin: d(2030, 7, 21) }),
    ];
    assert.equal(propuesta('checkout', lista), 'recien-ida');
    assert.equal(propuesta('checkout', [lista[2]]), 'futura');
  });
  test('Identidades no propone reservas con el parte ya comunicado; Contrato, las firmadas', () => {
    const lista = [reserva('comunicada', { inicio: d(2030, 7, 11), fin: d(2030, 7, 12) }), reserva('siguiente')];
    assert.equal(propuesta('identidades', lista, contexto({ partesComunicados: new Set(['comunicada']) })), 'siguiente');
    const ext = [reserva('firmada', { espacio: EXTERIOR, contratoEstado: 'Firmado', inicio: d(2030, 7, 11), fin: d(2030, 7, 12) }), reserva('sin-firmar', { espacio: EXTERIOR })];
    assert.equal(propuesta('contrato', ext), 'sin-firmar');
  });
  test('Extras ofrece todas (para añadir servicios) y propone la más antigua con cobros pendientes; si no hay, la siguiente', () => {
    const lista = [reserva('nueva'), reserva('vieja', { inicio: d(2030, 6, 1), fin: d(2030, 6, 2) }), reserva('sin-extras', { inicio: d(2030, 7, 11), fin: d(2030, 7, 12) })];
    const c = contexto({ conExtrasPendientes: new Set(['nueva', 'vieja']) });
    assert.deepEqual(ids(fn('reservasDeFuncion_')('extras', lista, c)).sort(), ['nueva', 'sin-extras', 'vieja']);
    assert.equal(propuesta('extras', lista, c), 'vieja');
    assert.equal(propuesta('extras', lista, contexto()), 'sin-extras');
  });
  test('una función desconocida no es válida', () => {
    assert.equal(fn('esFuncionReserva_')('borrar'), false);
    assert.equal(fn('esFuncionReserva_')('toString'), false);
    assert.equal(fn('esFuncionReserva_')('contrato'), true);
  });
  test('Total PAX = adultos + menores', () => assert.equal(fn('totalPersonas_')(reserva('a')), 3));
});

test.describe('F-37 · aviso de ingreso cada 10 días desde la salida', () => {
  const toca = (r, ahora) => fn('tocaAvisoIngreso_')(r, ahora, 10);
  const salida = d(2030, 7, 1, 12);
  test('debe avisar a los 10, 20 y 30 días, y no en los días intermedios', () => {
    const r = reserva('a', { fin: salida });
    assert.deepEqual([9, 10, 11, 20, 25, 30].map((dias) => toca(r, d(2030, 7, 1 + dias, 9))), [false, true, false, true, false, true]);
  });
  test('no debe avisar si ya está ingresada, si está cancelada o si los días no son válidos', () => {
    const ahora = d(2030, 7, 11, 9);
    assert.equal(toca(reserva('a', { fin: salida, cobro: 'Ingresado' }), ahora), false);
    assert.equal(toca(reserva('a', { fin: salida, estado: 'Cancelada' }), ahora), false);
    assert.equal(fn('tocaAvisoIngreso_')(reserva('a', { fin: salida }), ahora, 0), false);
  });
});

test.describe('F-40 · avisos de check-in y check-out', () => {
  const r = reserva('a', { inicio: d(2030, 7, 10, 16), fin: d(2030, 7, 12, 12) });
  const checkin = (res, ahora) => fn('tocaAvisoCheckin_')(res, ahora, 4);
  const checkout = (res, ahora) => fn('tocaAvisoCheckout_')(res, ahora);
  test('DI-07 · check-in: desde 4 h antes hasta la hora de llegada, una sola vez y si no está hecho', () => {
    assert.equal(checkin(r, d(2030, 7, 10, 11, 59)), false);
    assert.equal(checkin(r, d(2030, 7, 10, 12)), true);
    assert.equal(checkin(r, d(2030, 7, 10, 15, 59)), true);
    assert.equal(checkin(r, d(2030, 7, 10, 16)), false);
    assert.equal(checkin({ ...r, checkin: 'Hecho' }, d(2030, 7, 10, 13)), false);
    assert.equal(checkin({ ...r, avisoCheckin: d(2030, 7, 10, 12) }, d(2030, 7, 10, 13)), false);
    assert.equal(checkin({ ...r, estado: 'Cancelada' }, d(2030, 7, 10, 13)), false);
  });
  test('DI-07 · check-out: desde la hora de salida hasta 24 h después (sin avalancha de antiguas)', () => {
    assert.equal(checkout(r, d(2030, 7, 12, 11, 59)), false);
    assert.equal(checkout(r, d(2030, 7, 12, 12)), true);
    assert.equal(checkout(r, d(2030, 7, 13, 11, 59)), true);
    assert.equal(checkout(r, d(2030, 7, 13, 12)), false);
    assert.equal(checkout({ ...r, checkout: 'Hecho' }, d(2030, 7, 12, 13)), false);
    assert.equal(checkout({ ...r, avisoCheckout: d(2030, 7, 12, 12, 45) }, d(2030, 7, 12, 13)), false);
  });
});

test.describe('F-43 · cobro de servicios extra (DI-11: pendiente hasta cobrarlo, vía plataforma o presencial)', () => {
  const catalogo = [{ nombre: 'BBQ', costeUnitario: 5, precioUnitario: 20 }, { nombre: 'Hielo', costeUnitario: 1, precioUnitario: 3 }];
  const resolver = (solicitados, actuales) => plano(fn('resolverLineasServicio_')(solicitados, catalogo, actuales));
  test('todo servicio nuevo nace Pendiente, sin forma de cobro', () => {
    assert.deepEqual(resolver([{ nombre: 'BBQ', cantidad: 1 }]).map((l) => [l.cobroEstado, l.cobroForma]), [['Pendiente', '']]);
  });
  test('un servicio ya cobrado conserva su cobro al volver a guardar la reserva', () => {
    const [l] = resolver([{ nombre: 'BBQ', cantidad: 1 }], [{ nombre: 'BBQ', cobroEstado: 'Cobrado', cobroForma: 'Presencial' }]);
    assert.deepEqual([l.cobroEstado, l.cobroForma], ['Cobrado', 'Presencial']);
  });
  test('solo cuentan como pendientes las líneas en Pendiente (las anteriores a DD-03, sin estado, no)', () => {
    const t = fn('tieneCobroPendiente_');
    assert.deepEqual([t([{ cobroEstado: '' }]), t([{ cobroEstado: 'Pendiente' }]), t([{ cobroEstado: 'Cobrado' }])], [false, true, false]);
  });
  const lineas = [{ nombre: 'BBQ', cantidad: 1, cobroEstado: 'Pendiente', cobroForma: '' }, { nombre: 'Hielo', cantidad: 2, cobroEstado: 'Cobrado', cobroForma: 'Plataforma' }];
  const a = (nombre, accion, forma) => plano(fn('aplicarCobroServicio_')(lineas, nombre, accion, forma));
  test('cobrar exige la forma (plataforma o presencial) y la guarda', () => {
    const [bbq] = a('BBQ', 'cobrado', 'Presencial').lineas;
    assert.deepEqual([bbq.cobroEstado, bbq.cobroForma], ['Cobrado', 'Presencial']);
    assert.equal(a('BBQ', 'cobrado', '').valido, false);
    assert.equal(a('BBQ', 'cobrado', 'Bizum').valido, false);
  });
  test('no se cobra dos veces; quitar lo elimina; acciones y servicios desconocidos se rechazan', () => {
    assert.equal(a('Hielo', 'cobrado', 'Presencial').valido, false);
    assert.deepEqual(a('BBQ', 'quitar').lineas.map((l) => l.nombre), ['Hielo']);
    assert.equal(a('Pistolas', 'cobrado', 'Presencial').valido, false);
    assert.equal(a('BBQ', 'borrar').valido, false);
    assert.equal(lineas[0].cobroEstado, 'Pendiente', 'no muta las líneas recibidas');
  });
  test('añadir un servicio nuevo lo deja Pendiente; si ya estaba, suma unidades y vuelve a Pendiente (DI-26)', () => {
    const anadir = (servicio, cantidad) => plano(fn('anadirLineaServicio_')(lineas, servicio, cantidad));
    const nuevo = anadir({ nombre: 'Toalla', costeUnitario: 0, precioUnitario: 3 }, '2');
    assert.deepEqual(nuevo.lineas[2], { nombre: 'Toalla', cantidad: 2, coste: 0, precio: 3, cobroEstado: 'Pendiente', cobroForma: '' });
    const mas = anadir(catalogo[1], 1).lineas.find((l) => l.nombre === 'Hielo');
    assert.deepEqual([mas.cantidad, mas.cobroEstado, mas.cobroForma], [3, 'Pendiente', '']);
    assert.equal(anadir(undefined, 1).valido, false);
    assert.equal(anadir(catalogo[0], 0).valido, false);
  });
  test('aplicarServicios_ debe auditar los cambios de cobro', () => {
    const base = { importeAlquiler: 100, comision: 10, costeFijoCanal: 0, serviciosExtra: 'BBQ x1', neto: 105 };
    const previas = [{ nombre: 'BBQ', cantidad: 1, coste: 5, precio: 20, cobroEstado: 'Pendiente', cobroForma: '' }];
    const nuevas = [{ ...previas[0], cobroEstado: 'Cobrado', cobroForma: 'Plataforma' }];
    const { diffs } = plano(fn('aplicarServicios_')(base, nuevas, 'x@y', AHORA, previas));
    assert.deepEqual(diffs.map((x) => [x.campo, x.anterior, x.nuevo]), [['Cobro de servicios extra', 'BBQ (Pendiente)', 'BBQ (Cobrado, Plataforma)']]);
  });
});

test.describe('F-41 · retención de las fotos del contrato', () => {
  const r = reserva('a', { fin: d(2025, 7, 12, 12), contratoArchivo: 'https://drive.google.com/drive/folders/ABC' });
  test('debe caducar a los 5 años de la salida, no antes, y nunca sin archivo', () => {
    const c = fn('contratoCaducado_');
    assert.equal(c(r, d(2030, 7, 12, 11), 5), false);
    assert.equal(c(r, d(2030, 7, 12, 12), 5), true);
    assert.equal(c({ ...r, contratoArchivo: '' }, d(2040, 1, 1), 5), false);
    assert.equal(c(r, d(2040, 1, 1), 0), false, 'una retención de 0 años no borra nada');
  });
  test('debe reconocer enlaces de carpeta y de archivo de Drive', () => {
    const i = (url) => plano(fn('idDriveDeUrl_')(url));
    assert.deepEqual(i('https://drive.google.com/drive/folders/1AbC-d_9'), { tipo: 'carpeta', id: '1AbC-d_9' });
    assert.deepEqual(i('https://drive.google.com/file/d/XYZ123/view'), { tipo: 'archivo', id: 'XYZ123' });
    assert.equal(i('no es un enlace'), null);
  });
});

test.describe('F-45 · puesta al día', () => {
  test('solo las reservas terminadas y no canceladas, y solo lo que falta', () => {
    const p = (r) => plano(fn('revisionesPorPonerAlDia_')(r, AHORA));
    assert.deepEqual(p(reserva('a', { fin: d(2030, 7, 1) })), ['checkin', 'checkout']);
    assert.deepEqual(p(reserva('a', { fin: d(2030, 7, 1), checkin: 'Hecho' })), ['checkout']);
    assert.deepEqual(p(reserva('a', { fin: d(2030, 7, 1), estado: 'Cancelada' })), []);
    assert.deepEqual(p(reserva('a')), [], 'futura');
  });
  const respuesta = (cambios = {}) => ({ fila: 2, esAdulto: true, nombre: 'Marta', apellido1: 'Pérez', codigoReserva: 'hm abc 123', marcaTemporal: d(2030, 7, 18), ...cambios });
  test('asigna el código a la única reserva de Interior sin código del mismo huésped', () => {
    const reservas = [reserva('2030-001'), reserva('2030-002', { nombre: 'Otro Señor' }), reserva('2030-003', { espacio: EXTERIOR })];
    assert.deepEqual(plano(fn('asignarCodigosForm_')([respuesta()], reservas, [INTERIOR])), { asignaciones: [{ id: '2030-001', codigo: 'HMABC123' }], revisar: [] });
  });
  test('no asigna si el código ya es de una reserva, si hay dos candidatas o si la respuesta es de un menor', () => {
    const a = (respuestas, reservas) => plano(fn('asignarCodigosForm_')(respuestas, reservas, [INTERIOR]));
    assert.deepEqual(a([respuesta()], [reserva('2030-001', { refCanal: 'HMABC123' })]).asignaciones, [], 'ya casa');
    assert.deepEqual(a([respuesta()], [reserva('2030-001'), reserva('2030-002')]), { asignaciones: [], revisar: [2] });
    assert.deepEqual(a([respuesta({ esAdulto: false })], [reserva('2030-001')]), { asignaciones: [], revisar: [] });
  });
  test('no asigna si la respuesta llegó después de la salida', () => {
    assert.deepEqual(plano(fn('asignarCodigosForm_')([respuesta({ marcaTemporal: d(2030, 8, 1) })], [reserva('2030-001')], [INTERIOR])),
      { asignaciones: [], revisar: [2] });
  });
  test('una reserva con dos códigos distintos se deja para revisar a mano', () => {
    const r = plano(fn('asignarCodigosForm_')([respuesta(), respuesta({ fila: 3, codigoReserva: 'HMOTRO' })], [reserva('2030-001')], [INTERIOR]));
    assert.deepEqual(r, { asignaciones: [], revisar: [2, 3] });
  });
});
