// RNF-12 · B-12: contraste WCAG 2.1 AA (≥ 4.5:1) de cada combinación texto/fondo que usa la interfaz.
// Lee los tokens reales de estilos.html: si alguien cambia un color, el test lo detecta sin abrir el navegador.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ESTILOS = fs.readFileSync(path.join(__dirname, '..', '..', 'docs_dev', 'src', 'estilos.html'), 'utf8');
const MINIMO_AA = 4.5;

const tokens = Object.fromEntries([...ESTILOS.matchAll(/--(c-[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
const color = (nombre) => (nombre.startsWith('#') ? nombre : tokens[nombre]);

const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

// [texto, fondo, dónde se usa]. Los controles deshabilitados están exentos (WCAG 1.4.3).
const COMBINACIONES = [
  ['c-text', 'c-bg', 'cuerpo'],
  ['c-text', 'c-surface', 'tarjetas, tablas, formularios'],
  ['c-text-muted', 'c-surface', 'textos secundarios, modales'],
  ['c-text-muted', 'c-bg', 'textos secundarios sobre el fondo'],
  ['c-text-muted', 'c-surface-alt', 'cabeceras de tabla'],
  ['#FFFFFF', 'c-primary-500', 'botón primario, navegación activa'],
  ['c-primary-700', 'c-surface', 'botón secundario'],
  ['c-primary-700', 'c-primary-50', 'botón secundario (hover)'],
  ['c-error', 'c-surface', 'obligatorio, error de campo, título de error'],
  ['c-error', 'c-error-bg', 'error de campo sobre campo inválido'],
  ['#FFFFFF', 'c-success', 'mensaje de éxito (F-21)'],
  ['#FFFFFF', 'c-error', 'mensaje de error'],
  ['c-text', 'c-badge-abierta', 'estado Abierta'],
  ['c-text', 'c-badge-cerrada', 'estado Cerrada'],
  ['c-text', 'c-badge-cancelada', 'estado Cancelada'],
  ['c-text', 'c-badge-cobro-si', 'cobro ingresado'],
  ['c-text', 'c-badge-cobro-no', 'cobro pendiente'],
];

test.describe('RNF-12 · contraste AA de los colores de la interfaz (B-12)', () => {
  COMBINACIONES.forEach(([texto, fondo, uso]) => {
    test(`${texto} sobre ${fondo} (${uso}) ≥ ${MINIMO_AA}:1`, () => {
      assert.ok(color(texto) && color(fondo), `token inexistente: ${texto} o ${fondo}`);
      const ratio = contraste(color(texto), color(fondo));
      assert.ok(ratio >= MINIMO_AA, `${ratio.toFixed(2)}:1`);
    });
  });
});
