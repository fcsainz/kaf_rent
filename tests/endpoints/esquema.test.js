// Tests de "Inicializar / reparar hojas" y del acceso por cabecera sobre hojas con datos reales (B-16, D-19).
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno, crearEntornoConDatos } = require('../soporte/gas');

const inicializar = (e) => e.comoPropietario(() => e.llamar('inicializarBaseDeDatos'));

// Hoja Logs creada "a mano" antes de reparar, con las cabeceras y datos que se indiquen.
const conLogsManual = (cabeceras, filas) => {
  const e = crearEntorno();
  const hoja = e.libro.insertSheet('Logs');
  [cabeceras, ...filas].forEach((f) => hoja.appendRow(f));
  return e;
};

test.describe('RF-72 · reparar hojas sin tocar los datos existentes (B-16)', () => {
  test('no renombra ni reordena las columnas de una hoja existente', () => {
    const e = conLogsManual(['Email', 'Fecha_Hora', 'Detalle', 'Tipo'], [['ana@test.com', 'ayer', 'Acceso concedido', 'ACCESO']]);
    inicializar(e);
    assert.deepEqual(e.hoja('Logs').cabeceras(), ['Email', 'Fecha_Hora', 'Detalle', 'Tipo']);
    assert.deepEqual(e.hoja('Logs').filas()[0], ['ana@test.com', 'ayer', 'Acceso concedido', 'ACCESO']);
  });

  test('añade al final las columnas que faltan, sin mover las demás', () => {
    const e = conLogsManual(['Fecha_Hora', 'Email', 'Nota propia'], [['ayer', 'ana@test.com', 'mía']]);
    inicializar(e);
    assert.deepEqual(e.hoja('Logs').cabeceras(), ['Fecha_Hora', 'Email', 'Nota propia', 'Tipo', 'Detalle']);
    assert.deepEqual(e.hoja('Logs').filas()[0].slice(0, 3), ['ayer', 'ana@test.com', 'mía']);
  });

  test('es idempotente: repararla dos veces no añade nada más', () => {
    const e = conLogsManual(['Fecha_Hora', 'Email'], []);
    inicializar(e);
    inicializar(e);
    assert.deepEqual(e.hoja('Logs').cabeceras(), ['Fecha_Hora', 'Email', 'Tipo', 'Detalle']);
  });

  test('la semilla se coloca por cabecera aunque la hoja tenga otro orden', () => {
    const e = crearEntorno();
    e.libro.insertSheet('Config').appendRow(['Descripcion', 'Clave', 'Valor']);
    inicializar(e);
    const fila = e.hoja('Config').registros().find((r) => r.Clave === 'Emails_Notificacion');
    assert.ok(fila, 'la clave está en su columna');
    assert.match(fila.Descripcion, /copropietarios/);
  });

  test('S27 · en un Config con datos añade las claves nuevas al final sin tocar las que ya tienen valor', () => {
    const e = crearEntorno();
    const config = e.libro.insertSheet('Config');
    [['Clave', 'Valor', 'Descripcion'], ['Emails_Notificacion', 'a@b.es', 'puesto a mano'], ['SES_Aplicacion', 'Mi app', 'cambiado']].forEach((f) => config.appendRow(f));
    const r = inicializar(e);
    const registros = e.hoja('Config').registros();
    assert.equal(registros.find((x) => x.Clave === 'Emails_Notificacion').Valor, 'a@b.es');
    assert.equal(registros.find((x) => x.Clave === 'SES_Aplicacion').Valor, 'Mi app', 'no pisa un valor existente');
    assert.equal(registros.find((x) => x.Clave === 'SES_Max_Intentos').Valor, '3');
    assert.ok(r.clavesConfigAnadidas.includes('SES_Url'));
    assert.ok(!r.clavesConfigAnadidas.includes('SES_Aplicacion'));
    assert.equal(inicializar(e).clavesConfigAnadidas, undefined, 'idempotente');
  });
});

test.describe('REF-02 · acceso por cabecera (B-16)', () => {
  test('si falta una columna del esquema, la lectura falla con un mensaje claro en vez de usar otra', () => {
    const e = crearEntornoConDatos();
    const hoja = e.hoja('Logs');
    hoja.getRange(1, 1, 1, 4).setValues([['Fecha_Hora', 'Otra cosa', 'Email', 'Detalle']]);
    assert.throws(() => e.fn('registrosDe_')('Logs'), /Falta la columna "Tipo" en la hoja "Logs"/);
  });

  test('lee bien una hoja con las columnas en otro orden y columnas propias', () => {
    const e = conLogsManual(['Nota', 'Detalle', 'Tipo', 'Email', 'Fecha_Hora'], [['x', 'Acceso concedido', 'ACCESO', 'ana@test.com', 'ayer']]);
    const [registro] = e.fn('registrosDe_')('Logs');
    assert.equal(registro.email, 'ana@test.com');
    assert.equal(registro.tipo, 'ACCESO');
  });
});
