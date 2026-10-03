// RNF-11 · Mobile-first: ninguna sección obliga a desplazarse en horizontal.
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, rpc, datosHabitacion } = require('./ayudas');

const SECCIONES = ['Inicio', 'Crear Reservas', 'Gestionar Reservas', 'Estadísticas', 'Gastos'];

test('RNF-11 · sin desbordamiento horizontal en ninguna sección', async ({ page, request }) => {
  await reiniciar(request);
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  for (const seccion of SECCIONES) {
    await irA(page, seccion);
    await page.waitForLoadState('networkidle');
    // Contra el ancho del dispositivo: en móvil, window.innerWidth crece con la página si esta se desborda (B-17).
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, `desbordamiento en ${seccion}`).toBeLessThanOrEqual(page.viewportSize().width);
  }
});

test('F-25 · "Reservas" abre el segundo piso con Gestionar y Crear; otra sección lo cierra', async ({ page, request }) => {
  await reiniciar(request);
  await page.goto('/');
  const gestionar = page.getByRole('button', { name: 'Gestionar Reservas', exact: true });
  await expect(gestionar).toBeHidden();
  await page.getByRole('button', { name: 'Reservas', exact: true }).click();
  await expect(gestionar).toBeVisible();
  await gestionar.click();
  await expect(page.locator('#seccion-gestionar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservas', exact: true })).toHaveAttribute('aria-current', 'page');
  await irA(page, 'Gastos');
  await expect(gestionar).toBeHidden();
});
