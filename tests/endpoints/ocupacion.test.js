// Tests de endpoints de DD-04 (S36): Cerrar días y Estadísticas por canal, con los dobles de Google.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina, isoDentroDe } = require('../soporte/gas');

const cierre = (c = {}) => ({ espacio: 'Habitación Interior', desde: isoDentroDe(40), hasta: isoDentroDe(42), motivo: 'Uso familiar', ...c });

test.describe('RF-104 · Cerrar días', () => {
  test('debe guardar el cierre con su evento gris de día completo en Calendar', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('cerrarDias', cierre());
    assert.equal(r.success, true, r.error);
    const [fila] = e.hoja('Dias_Cerrados').registros();
    assert.deepEqual([fila.ID_Cierre, fila.Espacio, fila.Motivo, fila.Registrado_Por], ['CIE-001', 'Habitación Interior', 'Uso familiar', 'ana@test.com']);
    const evento = e.calendario.eventos.find((ev) => ev.id === fila.Calendar_Event_Id);
    assert.equal(evento.titulo, 'Cerrado · Interior · Uso familiar');
    assert.equal(evento.color, '8', 'gris');
    assert.equal((evento.fin - evento.inicio) / 86400000, 3, 'el fin de Calendar es el día siguiente al último cerrado');
    const listado = e.llamar('cargarCierres').data;
    assert.deepEqual(listado.cierres.map((c) => [c.id, c.espacio, c.pasado]), [['CIE-001', 'Interior', false]]);
    assert.ok(listado.espacios.some((x) => x.nombreCorto === 'Exterior'));
  });
  test('debe rechazar un cierre que pisa una reserva o se solapa con otro cierre', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaHabitacion()); // entra dentro de 30 días y sale a los 33
    const conReserva = e.llamar('cerrarDias', cierre({ desde: isoDentroDe(31), hasta: isoDentroDe(31) }));
    assert.equal(conReserva.success, false);
    assert.match(conReserva.error, /tiene la reserva/);
    assert.equal(e.llamar('cerrarDias', cierre({ desde: isoDentroDe(33), hasta: isoDentroDe(33) })).success, true, 'el día de salida no ocupa noche');
    const solapado = e.llamar('cerrarDias', cierre({ desde: isoDentroDe(33), hasta: isoDentroDe(35) }));
    assert.match(solapado.error, /Ya hay un cierre/);
    assert.equal(e.llamar('cerrarDias', cierre({ espacio: 'Piscina / Jardín', desde: isoDentroDe(33), hasta: isoDentroDe(35) })).success, true, 'otro espacio sí');
  });
  test('debe validar en el servidor lo que llega del cliente', () => {
    const e = crearEntornoConDatos();
    assert.equal(e.llamar('cerrarDias', cierre({ motivo: '' })).success, false);
    assert.equal(e.llamar('cerrarDias', cierre({ espacio: 'Garaje' })).success, false);
    assert.equal(e.hoja('Dias_Cerrados').filas().length, 0);
  });
  test('si Calendar falla, el cierre se guarda igual y se avisa', () => {
    const e = crearEntornoConDatos();
    e.calendario.fallar = true;
    const r = e.llamar('cerrarDias', cierre());
    assert.equal(r.success, true);
    assert.match(r.aviso, /calendario/);
    assert.equal(e.hoja('Dias_Cerrados').filas().length, 1);
  });
  test('quitar un cierre borra la fila y su evento', () => {
    const e = crearEntornoConDatos();
    e.llamar('cerrarDias', cierre());
    e.llamar('cerrarDias', cierre({ desde: isoDentroDe(50), hasta: isoDentroDe(50), motivo: 'Pintura' }));
    assert.equal(e.llamar('quitarCierre', 'CIE-001').success, true);
    assert.deepEqual(e.hoja('Dias_Cerrados').registros().map((c) => c.ID_Cierre), ['CIE-002']);
    assert.equal(e.calendario.eventos.length, 1);
    assert.equal(e.llamar('quitarCierre', 'CIE-001').success, false, 'ya no existe');
  });
  test('un usuario no autorizado no puede cerrar ni quitar días', () => {
    const e = crearEntornoConDatos({ usuarioActivo: 'intruso@test.com' });
    assert.equal(e.llamar('cerrarDias', cierre()).success, false);
    assert.equal(e.llamar('quitarCierre', 'CIE-001').success, false);
    assert.equal(e.llamar('cargarCierres').success, false);
  });
});

test.describe('RF-105 · no se reserva un día cerrado', () => {
  test('Crear Reserva rechaza una noche cerrada y explica cómo abrirla', () => {
    const e = crearEntornoConDatos();
    e.llamar('cerrarDias', cierre({ desde: isoDentroDe(31), hasta: isoDentroDe(31) }));
    const r = e.llamar('crearReserva', datosReservaHabitacion());
    assert.equal(r.success, false);
    assert.match(r.error, /cerrado .*Uso familiar.*Cerrar días/);
    assert.equal(e.hoja('Reservas').filas().length, 0);
    e.llamar('quitarCierre', 'CIE-001');
    assert.equal(e.llamar('crearReserva', datosReservaHabitacion()).success, true, 'al quitar el cierre ya se puede');
  });
  test('en Exterior bloquea el día de la reserva', () => {
    const e = crearEntornoConDatos();
    e.llamar('cerrarDias', cierre({ espacio: 'Piscina / Jardín', desde: isoDentroDe(20), hasta: isoDentroDe(20), motivo: 'Fuera de temporada' }));
    assert.match(e.llamar('crearReserva', datosReservaPiscina()).error, /Fuera de temporada/);
    assert.equal(e.llamar('crearReserva', datosReservaPiscina({ fechaUnica: isoDentroDe(21) })).success, true);
  });
});

test.describe('RF-107, RF-108 · Estadísticas por canal', () => {
  test('debe devolver la ocupación del periodo por canal, el total y la evolución del año', () => {
    const e = crearEntornoConDatos();
    e.llamar('crearReserva', datosReservaHabitacion());
    const inicio = new Date();
    inicio.setDate(inicio.getDate() + 30);
    const r = e.llamar('cargarInformeOcupacion', { espacio: 'Habitación Interior', anyo: inicio.getFullYear(), periodo: `M${inicio.getMonth() + 1}` });
    assert.equal(r.success, true, r.error);
    const { metricas, evolucion, espacios, anyos } = r.data;
    assert.equal(metricas.unidad, 'noche');
    const airbnb = metricas.canales.find((c) => c.canal === 'Airbnb');
    assert.equal(airbnb.reservas, 1);
    assert.ok(airbnb.vendidas >= 1 && airbnb.vendidas <= 3, 'sus noches dentro del mes');
    assert.equal(evolucion.length, 12);
    assert.ok(espacios.length === 2 && anyos.includes(new Date().getFullYear()));
  });
  test('Exterior usa las horas abiertas de Config', () => {
    const e = crearEntornoConDatos();
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Exterior_Hora_Cierre') f[1] = '21:00'; });
    const r = e.llamar('cargarInformeOcupacion', { espacio: 'Piscina / Jardín', anyo: 2026, periodo: 'M7' });
    assert.deepEqual([r.data.metricas.unidad, r.data.metricas.horasDia, r.data.metricas.unidadesAbiertas], ['hora', 12, 31 * 12]);
  });
  test('sin filtro abre el primer espacio y el mes en curso; un periodo inválido da error claro', () => {
    const e = crearEntornoConDatos();
    const r = e.llamar('cargarInformeOcupacion', {});
    assert.equal(r.success, true);
    assert.equal(r.data.espacio, 'Piscina / Jardín');
    assert.equal(e.llamar('cargarInformeOcupacion', { anyo: 2026, periodo: 'M13' }).success, false);
  });
});
