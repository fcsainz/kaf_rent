// RNF-11 · Mobile-first: ninguna sección obliga a desplazarse en horizontal.
const { test, expect } = require('@playwright/test');
const { reiniciar, rpc, datosHabitacion } = require('./ayudas');

const SECCIONES = ['Inicio', 'Crear Reserva', 'Gestionar Reserva', 'Estadísticas', 'Gastos'];

test('RNF-11 · sin desbordamiento horizontal en ninguna sección', async ({ page, request }) => {
  await reiniciar(request);
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  for (const seccion of SECCIONES) {
    await page.getByRole('button', { name: seccion, exact: true }).click();
    await page.waitForLoadState('networkidle');
    // Contra el ancho del dispositivo: en móvil, window.innerWidth crece con la página si esta se desborda (B-17).
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, `desbordamiento en ${seccion}`).toBeLessThanOrEqual(page.viewportSize().width);
  }
});
