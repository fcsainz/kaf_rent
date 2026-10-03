// B-28 · Apps Script, al servir la página, quita como comentario lo que sigue a "//" dentro de las cadenas con
// comillas invertidas; el script de esa plantilla deja de cargar entero (Gestionar y Estadísticas, 2026-10-03).
// En local no se reproduce: el navegador lee el código tal cual. Este test lo impide en el origen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR_SRC = path.join(__dirname, '..', '..', 'docs_dev', 'src');
const plantillas = fs.readdirSync(DIR_SRC).filter((f) => f.endsWith('.html'));

// Cadenas con comillas invertidas (sin anidar) que contienen "//".
const cadenasConBarras = (codigo) => [...codigo.matchAll(/`[^`]*`/g)].map((m) => m[0]).filter((c) => c.includes('//'));

test('B-28 · ninguna plantilla HTML tiene "//" dentro de una cadena con comillas invertidas', () => {
  const encontradas = plantillas.flatMap((f) => cadenasConBarras(fs.readFileSync(path.join(DIR_SRC, f), 'utf8')).map((c) => `${f}: ${c.slice(0, 60)}`));
  assert.deepEqual(encontradas, []);
});

test('B-28 · el test detecta el caso que rompió la app', () => {
  assert.equal(cadenasConBarras('return `intent://${x}#Intent`;').length, 1);
  assert.equal(cadenasConBarras("return 'intent://' + x;").length, 0);
});
