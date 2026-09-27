const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina } = require('../soporte/gas');

const archivo = (nombre, bytes = 10) => ({ nombre, tipoMime: 'application/pdf', datosBase64: Buffer.alloc(bytes).toString('base64') });
const reservaUno = (e) => e.hoja('Reservas').registros()[0];

test.describe('RF-54..RF-58 · documentos en Drive', () => {
  test('sube el contrato a Documentos/{Espacio}/{reserva}, lo enlaza y lo marca Firmado', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaPiscina({ canal: 'Directo', comision: '0' }));
    const { ID_Reserva: id } = reservaUno(e);
    const r = e.llamar('subirContrato', id, archivo('contrato.PDF'));
    assert.equal(r.success, true, r.error);
    const res = reservaUno(e);
    assert.equal(res.Contrato_Estado, 'Firmado');
    assert.equal(res.Contrato_Archivo, r.url);
    const [espacio] = e.carpetas.documentos.carpetas;
    assert.equal(espacio.nombre, 'Piscina / Jardín');
    assert.match(espacio.carpetas[0].ficheros[0].nombre, /^01-\d\d - contrato - \d{6}\.pdf$/);
  });

  test('rechaza formato no permitido y tamaño excesivo', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaPiscina({ canal: 'Directo', comision: '0' }));
    const { ID_Reserva: id } = reservaUno(e);
    assert.equal(e.llamar('subirContrato', id, archivo('contrato.docx')).success, false);
    assert.equal(e.llamar('subirContrato', id, archivo('grande.pdf', 6 * 1024 * 1024)).success, false);
  });

  test('RF-55 · no se sube contrato si lo gestiona el canal', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaHabitacion());
    assert.equal(e.llamar('subirContrato', reservaUno(e).ID_Reserva, archivo('c.pdf')).success, false);
  });

  test('sube el vídeo a la carpeta existente del espacio y guarda la URL', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaPiscina());
    const { ID_Reserva: id } = reservaUno(e);
    const r = e.llamar('subirVideo', id, 'In', { ...archivo('v.mp4'), tipoMime: 'video/mp4' });
    assert.equal(r.success, true, r.error);
    assert.equal(reservaUno(e).Video_In_Url, r.url);
    assert.equal(reservaUno(e).Modificado_Por, 'ana@test.com');
    assert.ok(e.hoja('Historial_Cambios').registros().some((h) => h.Campo === 'Vídeo check-in' && h.Valor_Nuevo === r.url), 'RNF-22: queda auditado');
    const piscina = e.carpetas.videos.carpetas.find((c) => /Piscina/.test(c.nombre));
    assert.match(piscina.carpetas[0].nombre, /^KAF\. Videos 01-\d\d - \d{6}$/);
    assert.equal(e.llamar('subirVideo', id, 'Lateral', archivo('v.mp4')).success, false);
  });
});

test.describe('RF-59/RF-60 · estadísticas', () => {
  test('recalcula por zona y el endpoint lee el cache', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaPiscina());
    e.llamar('crearReserva', datosReservaHabitacion());
    const r = e.llamar('recalcularEstadisticas');
    const datos = e.llamar('cargarEstadisticas').data;
    // Solo cuentan las del año en curso (las reservas de prueba pueden caer en el siguiente a final de año).
    const esteAnyo = (espacio) => e.hoja('Reservas').registros().filter((r) => (!espacio || r.Espacio === espacio) && r.Fecha_Hora_Inicio.getFullYear() === new Date().getFullYear()).length;
    assert.deepEqual(datos.map((z) => [z.zona, z.totalReservas]),
      [['Todos', esteAnyo()], ['Piscina / Jardín', esteAnyo('Piscina / Jardín')], ['Habitación Interior', esteAnyo('Habitación Interior')]]);
    assert.ok(r === undefined || r.success !== false);
  });

  test('un usuario no autorizado no puede forzar el recálculo', () => {
    const e = crearEntornoConDatos({ usuarioActivo: 'intruso@test.com' });
    const r = e.llamar('recalcularEstadisticas');
    assert.equal(r && r.success, false);
  });
});

test.describe('RF-63..RF-66 · gastos y resumen fiscal', () => {
  const anyo = new Date().getFullYear();
  const gasto = (cambios = {}) => ({ fecha: `${anyo}-03-10`, concepto: 'IBI', categoria: 'Tributos y tasas no estatales', espacio: 'Común', importe: '200', deducible: 'Sí', pagadoPor: 'A', notas: '', ...cambios });

  test('registra gastos validados con ID por ejercicio', () => {
    const e = crearEntornoConDatos();
    assert.equal(e.llamar('registrarGasto', gasto(), null).id, `G${anyo}-001`);
    assert.equal(e.llamar('registrarGasto', gasto({ importe: '0' }), null).success, false);
    assert.equal(e.llamar('registrarGasto', gasto({ espacio: 'Garaje' }), null).success, false);
    assert.equal(e.llamar('registrarGasto', gasto({ concepto: '' }), null).success, false);
  });

  test('categorías y espacios para el formulario', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('cargarCategoriasGasto');
    assert.equal(r.success, true);
    const categorias = Array.isArray(r.data) ? r.data : r.data.categorias;
    assert.ok(categorias.some((c) => c.nombre === 'Seguros' && c.deducibleDefault === true));
  });

  test('resumen: comunes al 50 %, amortización repartida y tercio por comunero', () => {
    const e = crearEntornoConDatos();
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Valor_Construccion') f[1] = 100000; if (f[0] === 'Proporcion_Alquilada') f[1] = 20; });
    e.llamar('registrarGasto', gasto(), null);
    e.llamar('registrarGasto', gasto({ espacio: 'Piscina / Jardín', importe: '100', concepto: 'Cloro', categoria: 'Conservación y reparación' }), null);
    e.llamar('registrarGasto', gasto({ espacio: 'Piscina / Jardín', importe: '999', deducible: 'No' }), null);
    const r = e.llamar('calcularResumenFiscal', anyo);
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.amortizacionAnual, 600);
    const piscina = r.data.resumen.find((x) => x.espacio === 'Piscina / Jardín');
    // sin ingresos: gastos = 100 propios + 100 comunes + 300 amortización = 500
    assert.equal(piscina.gastosDeducibles, 500);
    assert.ok(Math.abs(piscina.tercio - (-500 / 3)) < 1e-9);
    assert.equal(e.hoja('Resumen_Fiscal').filas().length, 2);
  });
});

test.describe('RF-61 · informes', () => {
  test('el informe mensual se archiva y se envía escapando HTML (B-05)', () => {
    const e = crearEntornoConDatos();
    e.hoja('Catálogo_Canales').appendRow(['Piscina / Jardín', '<b>Raro</b>', 'Sí', 0, 'Manual', 0]);
    const hoy = new Date();
    const mesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 15, 10);
    const hoja = e.hoja('Reservas');
    const cab = hoja.cabeceras();
    const fila = cab.map((c) => ({ ID_Reserva: '2000-001', Espacio: 'Piscina / Jardín', Canal: '<b>Raro</b>', Fecha_Hora_Inicio: mesPasado, Fecha_Hora_Fin: mesPasado, Importe_Bruto: 100, Importe_Comisión: 10, Importe_Neto: 90, Estado_Reserva: 'Abierta' }[c] ?? ''));
    hoja.appendRow(fila);
    e.comoPropietario(() => e.llamar('informesProgramados'));
    const informe = e.correos.find((c) => /Informe Mensual/.test(c.subject));
    assert.ok(informe, 'se envía el informe mensual');
    assert.ok(!informe.htmlBody.includes('<b>Raro</b>'), 'el HTML se escapa');
    assert.ok(e.hoja('Historico_Informes').filas().length >= 1);
  });
});

test.describe('RF-67..RF-70 · mantenimiento nocturno', () => {
  test('purga logs antiguos, hace copia y poda vídeos y carpetas vacías (B-07)', () => {
    const e = crearEntornoConDatos();
    const viejo = new Date(Date.now() - 400 * 24 * 3600 * 1000);
    e.hoja('Logs').appendRow([viejo, 'ACCESO', 'x', '']);
    e.hoja('Logs').appendRow([new Date(), 'ACCESO', 'y', '']);
    const piscina = e.carpetas.videos.carpetas[0];
    const reservaVieja = piscina.createFolder('KAF. Videos 01-20 - 010120');
    const f = reservaVieja.createFile({ nombre: 'Video In.mp4' });
    f.creado = viejo;
    e.comoPropietario(() => e.llamar('tareasNocturnas'));
    assert.equal(e.hoja('Logs').filas().length, 1);
    assert.equal(e.carpetas.backups.ficheros.length, 1);
    assert.equal(f.isTrashed(), true);
    assert.equal(reservaVieja.isTrashed(), true, 'la carpeta de reserva vacía se elimina');
    assert.equal(piscina.isTrashed(), false, 'la carpeta del espacio no se toca');
  });
  test('RF-68 · una copia al día y poda abuelo-padre-hijo de las antiguas (ADR-0016)', () => {
    const e = crearEntornoConDatos();
    const backups = e.carpetas.backups;
    const hace = (dias) => new Date(Date.now() - dias * 24 * 3600 * 1000);
    const antiguas = Array.from({ length: 60 }, (_, i) => {
      const f = backups.createFile({ nombre: `copia ${i + 1}` });
      f.creado = hace(i + 1);
      return f;
    });
    e.comoPropietario(() => e.llamar('tareasNocturnas'));
    e.comoPropietario(() => e.llamar('tareasNocturnas'));
    const vivas = backups.ficheros.filter((f) => !f.isTrashed());
    assert.equal(vivas.filter((f) => !antiguas.includes(f)).length, 1, 'una sola copia de hoy aunque se ejecute dos veces');
    assert.ok(vivas.length > 7 && vivas.length <= 7 + 4 + 12, `quedan ${vivas.length}`);
    assert.ok(antiguas.some((f) => f.isTrashed()), 'las que no son de ningún periodo van a la papelera');
  });
});

test.describe('RF-40 · reconciliación de Calendar', () => {
  test('crea los eventos que faltan y omite canceladas y existentes', () => {
    const e = crearEntornoConDatos();
    e.calendario.fallar = true;
    e.llamar('crearReserva', datosReservaPiscina());
    e.llamar('crearReserva', datosReservaHabitacion());
    e.calendario.fallar = false;
    e.llamar('cancelarReserva', e.hoja('Reservas').registros()[1].ID_Reserva);
    const r = e.comoPropietario(() => e.llamar('sincronizarReservasCalendario'));
    assert.deepEqual([r.creados, r.omitidos], [1, 1]);
    assert.ok(e.hoja('Reservas').registros()[0].Calendar_Event_Id);
    const otra = e.comoPropietario(() => e.llamar('sincronizarReservasCalendario'));
    assert.deepEqual([otra.creados, otra.omitidos], [0, 2]);
  });
});

test.describe('RF-65 · justificante de gasto', () => {
  test('se guarda en Documentos/Gastos/{Ejercicio} y se enlaza; formato no válido se rechaza', () => {
    const e = crearEntornoConDatos();
    const anyo = new Date().getFullYear();
    const gasto = { fecha: `${anyo}-02-01`, concepto: 'Seguro', categoria: 'Seguros', espacio: 'Común', importe: '90', deducible: 'Sí' };
    assert.equal(e.llamar('registrarGasto', gasto, archivo('poliza.exe')).success, false);
    const r = e.llamar('registrarGasto', gasto, archivo('poliza.pdf'));
    assert.equal(r.success, true, r.error);
    const carpetaAnyo = e.carpetas.documentos.carpetas.find((c) => c.nombre === 'Gastos').carpetas[0];
    assert.equal(carpetaAnyo.nombre, String(anyo));
    assert.match(e.hoja('Gastos').registros()[0].Justificante, /^https:\/\/drive\.test\//);
  });
});
