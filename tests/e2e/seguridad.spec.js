// RF-02..RF-05 y RNF-26 en el navegador: acceso por lista y datos del huésped nunca interpretados como HTML.
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, prueba, rpc, datosHabitacion } = require('./ayudas');

const XSS = '<img src=x onerror="window.__xss=1">';

test.beforeEach(async ({ request }) => reiniciar(request));

test('RF-03 · una cuenta no autorizada ve "Acceso denegado" y no la app', async ({ page, request }) => {
  await prueba(request, '/__test/usuario?email=intruso@test.com');
  await page.goto('/');
  await expect(page.getByText('no está autorizada')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservas', exact: true })).toHaveCount(0);
});

test('RNF-26 · un nombre con HTML se muestra como texto en Inicio y en Gestionar', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion({ nombre: XSS }));
  await page.goto('/');
  await expect(page.locator('#tabla-ultimas')).toContainText(XSS);
  await irA(page, 'Gestionar Reservas');
  await expect(page.locator('#tabla-gestion')).toContainText(XSS);
  expect(await page.evaluate(() => window.__xss)).toBeUndefined();
});
