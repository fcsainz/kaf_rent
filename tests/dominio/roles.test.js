// RF-84 · Roles y permisos (F-11): funciones puras.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');

const e = crearEntorno();
const tiene = e.fn('tienePermiso_');
const PERMISO = e.fn('PERMISO');

test.describe('RF-84 · permisos por rol', () => {
  test('Admin tiene gestión y técnico', () => {
    assert.equal(tiene('Admin', PERMISO.GESTION), true);
    assert.equal(tiene('admin', PERMISO.TECNICO), true);
  });
  test('Soporte solo técnico; Gestión solo gestión; Sistema nada', () => {
    assert.deepEqual([tiene('Soporte', PERMISO.GESTION), tiene('Soporte', PERMISO.TECNICO)], [false, true]);
    assert.deepEqual([tiene('Gestion', PERMISO.GESTION), tiene('Gestión', PERMISO.TECNICO)], [true, false]);
    assert.deepEqual([tiene('Sistema', PERMISO.GESTION), tiene('Sistema', PERMISO.TECNICO)], [false, false]);
  });
  test('vacío, "Copropietario" o desconocido cuentan como Gestión (compatibilidad con el Sheet actual)', () => {
    ['', 'Copropietario', 'otro', null].forEach((rol) => {
      assert.equal(tiene(rol, PERMISO.GESTION), true);
      assert.equal(tiene(rol, PERMISO.TECNICO), false);
    });
  });
});
