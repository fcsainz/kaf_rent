// RNF-20 · Solo son invocables desde el cliente las funciones pensadas para ello.
// En Apps Script, toda función global sin sufijo "_" es invocable con google.script.run.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, ficherosGs, leerFuente } = require('../soporte/gas');

// Endpoints que usa la interfaz (28).
const ENDPOINTS = [
  'cargarEspaciosFormulario', 'cargarOpcionesEspacio', 'crearReserva', 'cargarUltimasReservas', 'buscarReservas',
  'listarReservasActivas', 'obtenerReserva', 'actualizarReserva', 'cargarServiciosReserva', 'actualizarServiciosReserva',
  'cancelarReserva', 'obtenerHistorial', 'subirContrato', 'subirVideo', 'obtenerEnlaceCalendario',
  'cargarEstadisticas', 'recalcularEstadisticas', 'cargarCategoriasGasto', 'registrarGasto', 'calcularResumenFiscal',
  'notificarIncidencia', 'cargarChecklist', 'guardarChecklist', 'confirmarChecklist', 'subirFotoDesperfecto',
  'cargarCatalogoChecklist', 'guardarPuntoChecklist', 'obtenerPerfil',
];
// Puntos de entrada de Google (web, plantillas, menú, triggers) y utilidades de editor, todas protegidas.
const ENTRADAS_SISTEMA = ['doGet', 'include', 'onOpen', 'tareasNocturnas', 'informesProgramados', 'instalarTriggers', 'inicializarBaseDeDatos', 'sincronizarReservasCalendario'];

const funcionesGlobales = () => ficherosGs().flatMap((f) => {
  const fuente = leerFuente(f);
  const flechas = [...fuente.matchAll(/^const ([A-Za-z0-9_$]+) = (?:async )?(?:\([^)]*\)|[A-Za-z0-9_$]+) =>/gm)].map((m) => m[1]);
  const clasicas = [...fuente.matchAll(/^function ([A-Za-z0-9_$]+)\s*\(/gm)].map((m) => m[1]);
  return [...flechas, ...clasicas];
});

test('RNF-20 · toda función global sin "_" es un endpoint o una entrada del sistema conocida', () => {
  const expuestas = funcionesGlobales().filter((n) => !n.endsWith('_'));
  const inesperadas = expuestas.filter((n) => !ENDPOINTS.includes(n) && !ENTRADAS_SISTEMA.includes(n));
  assert.deepEqual(inesperadas, []);
});

test('RNF-20 · todos los endpoints existen', () => {
  const todas = funcionesGlobales();
  assert.deepEqual(ENDPOINTS.filter((n) => !todas.includes(n)), []);
});

test('RNF-20 · un usuario autorizado no puede lanzar tareas del sistema desde la web', () => {
  const e = crearEntornoConDatos({ usuarioActivo: 'ana@test.com' });
  e.hoja('Logs').appendRow([new Date(2000, 0, 1), 'ACCESO', 'x', '']);
  e.llamar('tareasNocturnas', { triggerUid: 'inventado' });
  e.llamar('informesProgramados');
  e.llamar('inicializarBaseDeDatos');
  e.llamar('instalarTriggers');
  e.llamar('sincronizarReservasCalendario');
  assert.ok(e.hoja('Logs').registros().some((l) => l.Email === 'x'), 'no purga');
  assert.equal(e.hoja('Logs').registros().filter((l) => l.Tipo === 'SISTEMA_DENEGADO').length, 5, 'cada intento queda registrado');
  assert.equal(e.disparadores.length, 0, 'no instala triggers');
  assert.equal(e.correos.length, 0, 'no envía informes');
});

test('las tareas del sistema sí se ejecutan desde un trigger real del proyecto', () => {
  const e = crearEntornoConDatos({ usuarioActivo: '' });
  e.comoPropietario(() => e.llamar('instalarTriggers'));
  assert.equal(e.disparadores.length, 2);
  e.hoja('Logs').appendRow([new Date(2000, 0, 1), 'ACCESO', 'x', '']);
  const uid = e.disparadores.find((t) => t.funcion === 'tareasNocturnas').getUniqueId();
  e.llamar('tareasNocturnas', { triggerUid: uid });
  assert.ok(!e.hoja('Logs').registros().some((l) => l.Email === 'x'), 'purga ejecutada');
});

test('doGet muestra Inicio a autorizados y acceso denegado al resto, registrándolo', () => {
  const ok = crearEntornoConDatos();
  assert.equal(ok.llamar('doGet').vista, 'index');
  const no = crearEntornoConDatos({ usuarioActivo: 'intruso@test.com' });
  assert.equal(no.llamar('doGet').vista, 'acceso-denegado');
  assert.ok(no.hoja('Logs').registros().some((l) => l.Tipo === 'ACCESO_DENEGADO' && l.Email === 'intruso@test.com'));
});

test('RNF-20 · todo identificador global en camelCase sin "_" es un endpoint o entrada del sistema (incluye no-flechas)', () => {
  const globales = ficherosGs().flatMap((f) => [...leerFuente(f).matchAll(/^(?:const|let|var|function) ([A-Za-z0-9_$]+)/gm)].map((m) => m[1]));
  const sospechosos = globales.filter((n) => /^[a-z]/.test(n) && !n.endsWith('_') && !ENDPOINTS.includes(n) && !ENTRADAS_SISTEMA.includes(n));
  assert.deepEqual(sospechosos, []);
});

test('el código no depende del orden de carga de los ficheros (Apps Script no lo garantiza)', () => {
  const { crearEntorno } = require('../soporte/gas');
  assert.doesNotThrow(() => crearEntorno({ ordenInverso: true }));
});
