// Tests unitarios de la capa de dominio: funciones puras, sin dobles de Google (FIRST).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');

const { fn } = crearEntorno();
const plano = (v) => JSON.parse(JSON.stringify(v));
const d = (y, m, dia, h = 0, min = 0) => new Date(y, m - 1, dia, h, min);
const HOY = d(2030, 6, 10);

const reservaBase = (cambios = {}) => ({
  id: '2030-001', espacio: 'Habitación Interior', canal: 'Airbnb', inicio: d(2030, 7, 1, 16), fin: d(2030, 7, 4, 12),
  nombre: 'Marta', telefono: '', email: '', adultos: 2, menores: 0, importeAlquiler: 300, serviciosPrecio: 20, serviciosCoste: 8,
  bruto: 320, comisionPct: 3, comision: 9.6, margenServicios: 12, neto: 302.4, costeFijoCanal: 0, serviciosExtra: 'Desayuno x2',
  cobro: 'No ingresado', contratoEstado: 'Gestionado por canal', incidencias: 'Sin incidentes', incidenteComunicado: '',
  compensacion: '', incidenciaResuelta: '', estado: 'Abierta', checkin: 'Pendiente', checkout: 'Pendiente', notas: '',
  ...cambios,
});
const cambiosDe = (r, extra = {}) => ({
  nombre: r.nombre, telefono: r.telefono, email: r.email, adultos: r.adultos, menores: r.menores, importeAlquiler: r.importeAlquiler,
  comisionPct: r.comisionPct, cobro: r.cobro, contratoEstado: r.contratoEstado, incidencias: r.incidencias,
  incidenteComunicado: r.incidenteComunicado, compensacion: r.compensacion, incidenciaResuelta: r.incidenciaResuelta,
  checkin: r.checkin, checkout: r.checkout, notas: r.notas, ...extra,
});

test.describe('RF-19..RF-21 · fechas', () => {
  const horas = { checkIn: '16:00', checkOut: '12:00' };
  test('Dia_y_Hora combina fecha y horas', () => {
    const r = fn('construirFechas_')('Dia_y_Hora', { fechaUnica: '2030-07-01', horaLlegada: '10:30', horaSalida: '18:00' }, horas, HOY);
    assert.equal(r.valido, true);
    assert.equal(r.inicio.getHours(), 10);
    assert.equal(r.fin.getMinutes(), 0);
  });
  test('Rango_Dias usa las horas por defecto', () => {
    const r = fn('construirFechas_')('Rango_Dias', { fechaEntrada: '2030-07-01', fechaSalida: '2030-07-03' }, horas, HOY);
    assert.equal(r.inicio.getHours(), 16);
    assert.equal(r.fin.getHours(), 12);
  });
  test('rechaza pasado, salida no posterior, sin fechas y modo desconocido', () => {
    const f = fn('construirFechas_');
    assert.equal(f('Rango_Dias', { fechaEntrada: '2030-06-01', fechaSalida: '2030-06-03' }, horas, HOY).valido, false);
    assert.equal(f('Dia_y_Hora', { fechaUnica: '2030-07-01', horaLlegada: '18:00', horaSalida: '10:00' }, horas, HOY).valido, false);
    assert.equal(f('Rango_Dias', {}, horas, HOY).valido, false);
    assert.equal(f('Otro', {}, horas, HOY).valido, false);
  });
});

test.describe('RF-22..RF-25, RF-46 · validaciones', () => {
  const huesped = (x = {}) => ({ nombre: 'Ana', adultos: '1', menores: '', telefono: '', email: '', ...x });
  test('huésped', () => {
    const v = fn('validarHuesped_');
    assert.equal(v(huesped()).valido, true);
    assert.equal(v(huesped({ nombre: ' ' })).valido, false);
    assert.equal(v(huesped({ adultos: '0' })).valido, false);
    assert.equal(v(huesped({ menores: '-1' })).valido, false);
    assert.equal(v(huesped({ telefono: '6001112223' })).valido, false);
    assert.equal(v(huesped({ telefono: '600111222', email: 'a@b.es' })).valido, true);
    assert.equal(v(huesped({ email: 'a@b' })).valido, false);
  });
  test('importes', () => {
    const v = fn('validarImportes_');
    assert.equal(v('0', '0').valido, true);
    assert.equal(v('', '0').valido, false);
    assert.equal(v('-5', '0').valido, false);
    assert.equal(v('10', '-1').valido, false);
    assert.equal(v('10', '100').valido, true);
  });
  test('dominios de edición', () => {
    const v = fn('validarCambiosReserva_');
    const r = reservaBase();
    assert.equal(v(cambiosDe(r)).valido, true);
    assert.equal(v(cambiosDe(r, { contratoEstado: 'Perdido' })).valido, false);
    assert.equal(v(cambiosDe(r, { compensacion: 'Parcial' })).valido, false);
    assert.equal(v(null).valido, false);
  });
});

test.describe('RF-23, RF-27, RF-49 · servicios e importes', () => {
  const catalogo = [{ nombre: 'Hielo', costeUnitario: 1, precioUnitario: 3 }];
  test('las líneas usan el catálogo y descartan cantidades no válidas o servicios desconocidos', () => {
    const lineas = fn('resolverLineasServicio_')([{ nombre: 'Hielo', cantidad: '2', precio: 0 }, { nombre: 'X', cantidad: 1 }, { nombre: 'Hielo', cantidad: '0' }], catalogo);
    assert.deepEqual(plano(lineas), [{ nombre: 'Hielo', cantidad: 2, coste: 1, precio: 3 }]);
    assert.deepEqual(plano(fn('resolverLineasServicio_')(null, catalogo)), []);
  });
  test('fórmula única de importes', () => {
    const i = fn('calcularImportes_')({ importeAlquiler: 200, serviciosPrecio: 9, serviciosCoste: 3, comisionPct: 15, costeFijoCanal: 9.5 });
    assert.equal(i.bruto, 209);
    assert.ok(Math.abs(i.comision - 31.35) < 1e-9);
    assert.equal(i.margenServicios, 6);
    assert.ok(Math.abs(i.neto - 165.15) < 1e-9);
  });
  test('con comisión fija no se recalcula', () => {
    const i = fn('calcularImportes_')({ importeAlquiler: 200, serviciosPrecio: 50, serviciosCoste: 0, comisionPct: 15, costeFijoCanal: 0, comisionFija: 30 });
    assert.equal(i.comision, 30);
    assert.equal(i.neto, 220);
  });
  test('aplicarServicios_ audita servicios y neto', () => {
    const { reserva, diffs } = fn('aplicarServicios_')(reservaBase(), [{ nombre: 'Desayuno', cantidad: 3, coste: 4, precio: 10 }], 'x@y', HOY);
    assert.equal(reserva.comision, 9.6);
    assert.equal(reserva.bruto, 330);
    assert.deepEqual(plano(diffs).map((x) => x.campo), ['Servicios extra', 'Importe neto']);
  });
});

test.describe('RF-29, RF-31 · solapamiento e identificadores', () => {
  const existente = reservaBase();
  test('solapa si se cruzan; no si se tocan, otro espacio, cancelada o la propia', () => {
    const s = fn('haySolapamiento_');
    assert.equal(s([existente], existente.espacio, d(2030, 7, 3, 16), d(2030, 7, 5, 12)), true);
    assert.equal(s([existente], existente.espacio, d(2030, 7, 4, 12), d(2030, 7, 5, 12)), false);
    assert.equal(s([existente], 'Piscina / Jardín', d(2030, 7, 2), d(2030, 7, 3)), false);
    assert.equal(s([{ ...existente, estado: 'Cancelada' }], existente.espacio, d(2030, 7, 2), d(2030, 7, 3)), false);
    assert.equal(s([existente], existente.espacio, d(2030, 7, 2), d(2030, 7, 3), existente.id), false);
  });
  test('ID correlativo anual y referencias', () => {
    assert.equal(fn('generarIdReserva_')(['2030-001', '2030-009', '2029-050', 'basura'], 2030), '2030-010');
    assert.equal(fn('generarIdReserva_')([], 2031), '2031-001');
    assert.equal(fn('referenciaMostrada_')('2030-007'), '07/30');
    assert.equal(fn('referenciaMostrada_')('2030-123'), '123/30');
    assert.equal(fn('referenciaDrive_')('2030-007'), '07-30');
  });
});

test.describe('RF-50, RF-51 · ciclo de vida (cierre = cobro + check-out hecho, F-14)', () => {
  const casos = [
    ['Ingresado', 'Hecho', 'Sin incidentes', '', 'Completada', []],
    ['Ingresado', 'Hecho', 'Con incidentes', 'Sí', 'Completada', []],
    ['Ingresado', 'Pendiente', 'Sin incidentes', '', 'Abierta', ['Check-out sin hacer']],
    ['Ingresado', 'Hecho', 'Con incidentes', 'No', 'Abierta', ['Incidencia sin resolver']],
    ['No ingresado', 'Hecho', 'Sin incidentes', '', 'Abierta', ['Pendiente de cobro']],
    ['No ingresado', 'Pendiente', 'Con incidentes', '', 'Abierta', ['Pendiente de cobro', 'Check-out sin hacer', 'Incidencia sin resolver']],
  ];
  casos.forEach(([cobro, checkout, incidencias, incidenciaResuelta, estado, pendientes]) => {
    test(`${cobro} + check-out ${checkout} + ${incidencias} ${incidenciaResuelta} → ${estado}`, () => {
      const r = reservaBase({ cobro, checkout, incidencias, incidenciaResuelta });
      assert.equal(fn('calcularEstadoReserva_')(r), estado);
      assert.deepEqual(plano(fn('motivosPendientes_')({ ...r, estado })), pendientes);
    });
  });
  test('una cancelada nunca cambia de estado ni tiene pendientes', () => {
    const r = reservaBase({ estado: 'Cancelada', cobro: 'Ingresado' });
    assert.equal(fn('calcularEstadoReserva_')(r), 'Cancelada');
    assert.deepEqual(plano(fn('motivosPendientes_')(r)), []);
  });
  test('estado inicial del contrato según el canal', () => {
    assert.equal(fn('estadoInicialContrato_')('Automática'), 'Gestionado por canal');
    assert.equal(fn('estadoInicialContrato_')('Manual'), 'Pendiente');
  });
});

test.describe('RF-45..RF-48 · aplicar cambios', () => {
  test('sin cambios no hay auditoría (tampoco por tipos distintos)', () => {
    const r = reservaBase();
    const { diffs } = fn('aplicarCambios_')(r, cambiosDe(r, { adultos: '2', importeAlquiler: '300', comisionPct: '3' }), 'x', HOY);
    assert.deepEqual(plano(diffs), []);
  });
  test('recalcula importes y estado, y marca autor y fecha', () => {
    const r = reservaBase();
    const { reserva, diffs } = fn('aplicarCambios_')(r, cambiosDe(r, { importeAlquiler: '400', cobro: 'Ingresado', checkout: 'Hecho' }), 'luis@x', HOY);
    assert.equal(reserva.bruto, 420);
    assert.equal(reserva.estado, 'Completada');
    assert.equal(reserva.modificadoPor, 'luis@x');
    assert.deepEqual(plano(diffs).map((x) => x.campo), ['Importe del alquiler', 'Estado de cobro', 'Check-out revisado', 'Estado de la reserva']);
  });
  test('no muta la reserva original (inmutabilidad)', () => {
    const r = reservaBase();
    fn('aplicarCambios_')(r, cambiosDe(r, { nombre: 'Otra' }), 'x', HOY);
    assert.equal(r.nombre, 'Marta');
  });
});

test.describe('RF-11, RF-43 · filtros', () => {
  const r = reservaBase();
  test('búsqueda por nombre y día', () => {
    const c = fn('coincideBusqueda_');
    assert.equal(c(r, 'mar', null), true);
    assert.equal(c(r, 'pepe', null), false);
    assert.equal(c(r, '', d(2030, 7, 4)), true);
    assert.equal(c(r, '', d(2030, 7, 5)), false);
  });
  test('filtro de gestión por rango', () => {
    const c = fn('coincideFiltroGestion_');
    assert.equal(c(r, { nombre: '', desde: d(2030, 7, 3).getTime(), hasta: null }), true);
    assert.equal(c(r, { nombre: '', desde: d(2030, 7, 5).getTime(), hasta: null }), false);
    assert.equal(c(r, { nombre: '', desde: null, hasta: d(2030, 6, 30).getTime() }), false);
  });
});

test.describe('RF-59, RF-61 · estadísticas e informes', () => {
  const reservas = [
    reservaBase(),
    reservaBase({ id: '2030-002', espacio: 'Piscina / Jardín', canal: 'Cocopool', neto: 100, bruto: 120, comision: 20 }),
    reservaBase({ id: '2030-003', estado: 'Cancelada' }),
    reservaBase({ id: '2029-001', inicio: d(2029, 12, 30), fin: d(2030, 1, 2) }),
  ];
  test('agregados por zona del año natural sin canceladas', () => {
    const a = fn('agregadosEstadisticas_')(reservas, ['Piscina / Jardín', 'Habitación Interior'], 2030, HOY);
    assert.deepEqual(plano(a).map((z) => [z.zona, z.totalReservas, z.ingresosNetos]),
      [['Todos', 2, 402.4], ['Piscina / Jardín', 1, 100], ['Habitación Interior', 1, 302.4]]);
  });
  test('periodos: en enero, el mensual es diciembre y el trimestral el T4 del año anterior', () => {
    const enero = d(2031, 1, 1, 7);
    assert.equal(fn('periodoMensual_')(enero).periodo, '2030-12');
    assert.equal(fn('periodoTrimestral_')(enero).periodo, '2030-T4');
    assert.equal(fn('esInicioDeTrimestre_')(enero), true);
    assert.equal(fn('esInicioDeTrimestre_')(d(2031, 2, 1)), false);
  });
  test('agregado por espacio y canal y totales', () => {
    const agregados = fn('agregarPorEspacioCanal_')(reservas.slice(0, 2));
    assert.equal(agregados.length, 2);
    assert.deepEqual(plano(fn('totalesInforme_')(agregados)), { numReservas: 2, brutos: 440, comisiones: 29.6, netos: 402.4 });
  });
});

test.describe('RF-64, RF-66 · fiscal', () => {
  test('amortización acepta proporción en tanto por uno o por ciento', () => {
    assert.equal(fn('calcularAmortizacion_')(100000, 0.2), 600);
    assert.equal(fn('calcularAmortizacion_')(100000, 20), 600);
    assert.equal(fn('calcularAmortizacion_')('', ''), 0);
  });
  test('resumen del ejercicio a tercios', () => {
    const r = fn('calcularResumenEjercicio_')({
      espacios: ['Piscina / Jardín', 'Habitación Interior'],
      reservas: [reservaBase()],
      gastos: [{ ejercicio: 2030, espacio: 'Común', importe: 100, deducible: 'Sí', categoria: 'IBI' }, { ejercicio: 2030, espacio: 'Habitación Interior', importe: 50, deducible: 'No', categoria: 'X' }],
      anyo: 2030, valorConstruccion: 0, proporcionAlquilada: 0,
    });
    const hab = plano(r.resumen).find((x) => x.espacio === 'Habitación Interior');
    assert.equal(hab.ingresos, 320);
    assert.ok(Math.abs(hab.gastosDeducibles - (9.6 + 50)) < 1e-9);
    assert.ok(Math.abs(hab.tercio - (320 - 59.6) / 3) < 1e-9);
    assert.deepEqual(plano(r.porCategoria), [{ categoria: 'IBI', importe: 100 }]);
  });
  test('validación e ID de gasto', () => {
    const espacios = ['Piscina / Jardín', 'Común'];
    const ok = { concepto: 'IBI', categoria: 'Tributos', espacio: 'Común', importe: '10', deducible: 'Sí' };
    assert.equal(fn('validarGasto_')(ok, espacios, HOY).valido, true);
    assert.equal(fn('validarGasto_')({ ...ok, deducible: 'Tal vez' }, espacios, HOY).valido, false);
    assert.equal(fn('validarGasto_')(ok, espacios, null).valido, false);
    assert.equal(fn('generarIdGasto_')(['G2030-004'], 2030), 'G2030-005');
  });
});

test.describe('Infraestructura pura', () => {
  test('RNF-26 · escapar HTML', () => {
    assert.equal(fn('escaparHtml_')('<img src=x onerror="a()">&\''), '&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;');
  });
  test('REF-02 · columnas por cabecera, en cualquier orden y con columnas ajenas', () => {
    const m = fn('mapaColumnas_')({ a: 'A', b: 'B' }, ['X', 'B', 'A'], 'H');
    assert.deepEqual(plano(m), { a: 2, b: 1 });
  });
  test('B-16 · si falta una cabecera, error claro y nunca la posición del esquema', () => {
    assert.throws(() => fn('mapaColumnas_')({ a: 'A', b: 'B', c: 'C' }, ['B', 'A'], 'H'), /Falta la columna "C" en la hoja "H"/);
  });
  test('B-16 · columnas que faltan, en el orden del esquema', () => {
    assert.deepEqual([...fn('columnasQueFaltan_')(['B', 'Z'], ['A', 'B', 'C'])], ['A', 'C']);
  });
  test('toca copia según la cadencia', () => {
    const t = fn('tocaCopia_');
    assert.equal(t(null, 2, HOY), true);
    assert.equal(t(d(2030, 6, 9), 2, HOY), false);
    assert.equal(t(d(2030, 6, 8), 2, HOY), true);
  });
  test('validar archivo', () => {
    const v = fn('validarArchivo_');
    const a = { nombre: 'c.PDF', datosBase64: 'AAAA' };
    assert.equal(v(a, ['pdf'], 5).valido, true);
    assert.equal(v({ ...a, nombre: 'c.exe' }, ['pdf'], 5).valido, false);
    assert.equal(v(null, ['pdf'], 5).valido, false);
  });
});
