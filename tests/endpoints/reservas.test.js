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

  test('F-23 · los espacios por días llegan con las horas de Config; los de un día, sin ellas', () => {
    const e = crearEntornoConDatos();
    const [piscina, habitacion] = e.llamar('cargarEspaciosFormulario').data;
    assert.equal(piscina.horasPorDefecto, null);
    assert.deepEqual(habitacion.horasPorDefecto, { llegada: '16:00', salida: '12:00' });
  });

  test('B-22 · las horas de Config guardadas por Sheets como valor de hora se leen como HH:mm', () => {
    const e = crearEntornoConDatos();
    e.hoja('Config').datos.forEach((f) => {
      if (f[0] === 'Hora_CheckIn_Default') f[1] = new Date(1899, 11, 30, 16, 0);
      if (f[0] === 'Hora_CheckOut_Default') f[1] = new Date(1899, 11, 30, 11, 30);
    });
    const habitacion = e.llamar('cargarEspaciosFormulario').data.find((x) => x.modoFecha === 'Rango_Dias');
    assert.deepEqual(habitacion.horasPorDefecto, { llegada: '16:00', salida: '11:30' });
  });

  test('F-23 · no se crea una reserva sin hora de llegada', () => {
    const e = crearEntornoConDatos();
    const r = crear(e, datosReservaHabitacion({ horaLlegada: '' }));
    assert.equal(r.success, false);
    assert.match(r.error, /hora de llegada/);
    assert.equal(reservas(e).length, 0);
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
    const cierre = e.correos.find((c) => /! Cierra canales/.test(c.subject));
    assert.ok(cierre);
    assert.match(cierre.body, /Directo/);
    assert.ok(e.correos.some((c) => /✓ Nueva reserva 01\//.test(c.subject)));

    e.correos.length = 0;
    crear(e, datosReservaHabitacion());
    assert.ok(!e.correos.some((c) => /Cierra canales/.test(c.subject)), 'Habitación solo tiene un canal activo');
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

  test('B-14 · si no se crea el evento de Calendar, la respuesta avisa al usuario', () => {
    const e = crearEntornoConDatos();
    e.calendario.fallar = true;
    const r = crear(e, datosReservaPiscina());
    assert.equal(r.success, true);
    assert.match(r.aviso, /calendario/i);
  });

  test('B-14 · si el evento se crea, la respuesta no lleva aviso', () => {
    const e = crearEntornoConDatos();
    assert.equal(crear(e, datosReservaPiscina()).aviso, undefined);
  });

  test('B-14 · si el usuario no tiene el calendario en su lista, se le suscribe oculto y sin marcar y se crea el evento', () => {
    const e = crearEntornoConDatos();
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Calendar_Id') f[1] = 'CAL-GRUPO'; });
    e.calendario.suscrito = false;
    const r = crear(e, datosReservaPiscina());
    assert.equal(r.aviso, undefined);
    assert.equal(e.calendario.eventos.length, 1);
    assert.deepEqual(e.calendario.opcionesSuscripcion, { hidden: true, selected: false });
  });

  test('B-14 · si la suscripción falla, la reserva se guarda, se avisa y se registra el error', () => {
    const e = crearEntornoConDatos();
    e.hoja('Config').datos.forEach((f) => { if (f[0] === 'Calendar_Id') f[1] = 'CAL-AJENO'; });
    const r = crear(e, datosReservaPiscina());
    assert.equal(r.success, true);
    assert.match(r.aviso, /calendario/i);
    assert.match(e.hoja('Errores').registros().at(-1).Contexto, /Sin acceso al calendario CAL-AJENO/);
  });
});

test.describe('RF-83 · invitaciones del evento de Calendar', () => {
  test('F-13 · el evento invita a los usuarios autorizados activos y envía la invitación', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaPiscina());
    const [ev] = e.calendario.eventos;
    assert.equal(ev.opciones.guests, 'ana@test.com,luis@test.com,carlos@test.com');
    assert.equal(ev.opciones.sendInvites, true);
  });

  test('F-13 · la reconciliación también invita', () => {
    const e = crearEntornoConDatos();
    e.calendario.fallar = true;
    crear(e, datosReservaPiscina());
    e.calendario.fallar = false;
    e.comoPropietario(() => e.llamar('sincronizarReservasCalendario'));
    assert.equal(e.calendario.eventos[0].opciones.guests, 'ana@test.com,luis@test.com,carlos@test.com');
  });
});

test.describe('RF-31 · año de la referencia', () => {
  test('B-15 · una reserva para el año siguiente lleva el año en que se crea', () => {
    const e = crearEntornoConDatos();
    const siguiente = new Date().getFullYear() + 1;
    const r = crear(e, datosReservaHabitacion({ fechaEntrada: `${siguiente}-01-15`, fechaSalida: `${siguiente}-01-17` }));
    assert.equal(r.success, true);
    assert.equal(reservas(e)[0].ID_Reserva, `${new Date().getFullYear()}-001`);
    assert.equal(r.id, `01/${String(new Date().getFullYear()).slice(2)}`);
  });
});

test.describe('F-21 · enviar una incidencia al administrador', () => {
  const conAdmin = () => {
    const e = crearEntornoConDatos();
    e.hoja('Usuarios_Autorizados').appendRow(['admin@test.com', 'Sí', 'Admin']);
    return e;
  };
  const reservaSinEvento = (e) => {
    e.calendario.fallar = true;
    const r = crear(e, datosReservaPiscina());
    e.correos.length = 0;
    return r;
  };

  test('el error queda registrado con su pila técnica', () => {
    const e = conAdmin();
    reservaSinEvento(e);
    const [error] = e.hoja('Errores').registros();
    assert.match(JSON.parse(error.Contexto).pila, /Calendar no disponible/);
  });

  test('envía a las cuentas con rol Admin el detalle técnico, sin datos del huésped', () => {
    const e = conAdmin();
    const r = reservaSinEvento(e);
    const res = e.llamar('notificarIncidencia', r.incidencia);
    assert.equal(res.success, true);
    assert.equal(e.correos.length, 1);
    const [correo] = e.correos;
    assert.equal(correo.to, 'admin@test.com');
    assert.match(correo.subject, /Incidencia/);
    assert.match(correo.body, /crearEventoReserva_/);
    assert.match(correo.body, /Calendar no disponible/);
    assert.match(correo.body, /ana@test\.com/);
    assert.doesNotMatch(correo.body, /Grupo Ruiz/);
  });

  test('sin ninguna cuenta Admin activa, avisa al usuario y no envía nada', () => {
    const e = crearEntornoConDatos();
    const r = reservaSinEvento(e);
    const res = e.llamar('notificarIncidencia', r.incidencia);
    assert.equal(res.success, false);
    assert.match(res.error, /administrador/);
    assert.equal(e.correos.length, 0);
  });

  test('rechaza una referencia inválida o sin errores registrados', () => {
    const e = conAdmin();
    assert.equal(e.llamar('notificarIncidencia', '<script>').success, false);
    assert.equal(e.llamar('notificarIncidencia', '2026-999').success, false);
    assert.equal(e.correos.length, 0);
  });

  test('un usuario no autorizado no puede enviarla', () => {
    const e = conAdmin();
    const r = reservaSinEvento(e);
    e.sesion.activo = 'intruso@test.com';
    assert.equal(e.llamar('notificarIncidencia', r.incidencia).success, false);
    assert.equal(e.correos.length, 0);
  });
});

test.describe('RF-08/RF-11 · Inicio y buscador', () => {
  test('últimas reservas: máximo 5', () => {
    const e = crearEntornoConDatos();
    for (let i = 0; i < 6; i++) crear(e, datosReservaHabitacion({ fechaEntrada: isoDentroDe(10 + i * 3), fechaSalida: isoDentroDe(11 + i * 3) }));
    assert.equal(e.llamar('cargarUltimasReservas').data.length, 5);
  });

  test('F-26 · últimas reservas: espacio corto, código del canal y fechas cortas', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    crear(e, datosReservaPiscina());
    const ultimas = e.llamar('cargarUltimasReservas').data;
    const habitacion = ultimas.find((r) => r.nombre === 'Marta Pérez');
    const piscina = ultimas.find((r) => r.nombre === 'Grupo Ruiz');
    assert.equal(habitacion.espacio, 'Interior');
    assert.equal(habitacion.refCanal, 'HMTEST1234');
    assert.match(habitacion.inicioTexto, /^\d\d\/\d\d\/\d\d 16:00$/);
    assert.equal(piscina.espacio, 'Exterior');
    assert.equal(piscina.refCanal, '');
  });

  test('F-26 · si el espacio no tiene nombre corto, se usa el nombre completo', () => {
    const e = crearEntornoConDatos();
    e.hoja('Catálogo_Espacios').datos.forEach((f) => { if (f[0] === 'Habitación Interior') f[3] = ''; });
    crear(e, datosReservaHabitacion());
    assert.equal(e.llamar('cargarUltimasReservas').data[0].espacio, 'Habitación Interior');
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

test.describe('RF-84 · roles de usuario (F-11)', () => {
  const conRoles = () => {
    const e = crearEntornoConDatos();
    [['admin@test.com', 'Sí', 'Admin'], ['soporte@test.com', 'Sí', 'Soporte'], ['sistema@test.com', 'Sí', 'Sistema'],
      ['gestion@test.com', 'Sí', 'Gestión'], ['vieja@test.com', 'Sí', 'Copropietario']]
      .forEach((f) => e.hoja('Usuarios_Autorizados').appendRow(f));
    return e;
  };

  test('las invitaciones van a Admin, Gestión y roles antiguos o vacíos; nunca a Soporte ni a Sistema', () => {
    const e = conRoles();
    crear(e, datosReservaPiscina());
    const invitados = e.calendario.eventos[0].opciones.guests.split(',');
    ['ana@test.com', 'admin@test.com', 'gestion@test.com', 'vieja@test.com'].forEach((m) => assert.ok(invitados.includes(m), m));
    ['soporte@test.com', 'sistema@test.com'].forEach((m) => assert.ok(!invitados.includes(m), m));
  });

  test('las incidencias van a Admin y Soporte, no a Gestión ni a Sistema', () => {
    const e = conRoles();
    e.calendario.fallar = true;
    const r = crear(e, datosReservaPiscina());
    e.correos.length = 0;
    e.llamar('notificarIncidencia', r.incidencia);
    assert.deepEqual(e.correos[0].to.split(',').sort(), ['admin@test.com', 'soporte@test.com']);
  });
});

test.describe('D-28 · corregir las reservas guardadas a 00:00 (B-22)', () => {
  const ponerAMedianoche = (e) => {
    const datos = e.hoja('Reservas').datos;
    ['Fecha_Hora_Inicio', 'Fecha_Hora_Fin'].forEach((cabecera) => {
      const col = datos[0].indexOf(cabecera);
      datos.slice(1).forEach((fila) => { const f = fila[col]; fila[col] = new Date(f.getFullYear(), f.getMonth(), f.getDate()); });
    });
  };

  test('corrige las reservas por días, su evento y lo anota en el historial; las de un día no se tocan', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    crear(e, datosReservaPiscina());
    ponerAMedianoche(e);
    const r = e.comoPropietario(() => e.llamar('corregirHorasReservas'));
    assert.equal(r.corregidas.length, 1);
    const [habitacion, piscina] = reservas(e);
    assert.equal(habitacion.Fecha_Hora_Inicio.getHours(), 16);
    assert.equal(habitacion.Fecha_Hora_Fin.getHours(), 12);
    assert.equal(piscina.Fecha_Hora_Inicio.getHours(), 0);
    const evento = e.calendario.eventos.find((ev) => ev.id === habitacion.Calendar_Event_Id);
    assert.equal(evento.inicio.getHours(), 16);
    const historial = e.hoja('Historial_Cambios').registros().filter((h) => h.ID_Reserva === habitacion.ID_Reserva);
    assert.equal(historial.length, 2);
    assert.match(historial[0].Valor_Nuevo, / 16:00$/);
  });

  test('volver a ejecutarla no cambia nada', () => {
    const e = crearEntornoConDatos();
    crear(e, datosReservaHabitacion());
    ponerAMedianoche(e);
    e.comoPropietario(() => e.llamar('corregirHorasReservas'));
    assert.deepEqual(e.comoPropietario(() => e.llamar('corregirHorasReservas')).corregidas, []);
  });
});
