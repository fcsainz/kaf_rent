// RNF-11 · Mobile-first: ninguna sección obliga a desplazarse en horizontal.
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, prueba, rpc, datosHabitacion } = require('./ayudas');

const SECCIONES = ['Inicio', 'Crear Reservas', 'Gestionar Reservas', 'Cerrar días', 'Estadísticas', 'Gastos'];

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
    // DI-22: tampoco ningún bloque de la pantalla con su propio scroll lateral (salvo el texto dentro de un campo).
    const conScroll = await page.evaluate(() => [...document.querySelectorAll('.seccion.activa *')]
      .filter((e) => e.offsetParent && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.tagName) && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible')
      .map((e) => `${e.tagName}.${e.className}`));
    expect(conScroll, `scroll lateral en ${seccion}`).toEqual([]);
  }
  // F-36/F-42 (DD-03): ni la lista ni la ficha obligan a desplazarse en horizontal.
  await irA(page, 'Gestionar Reservas');
  await page.locator('#lista-gestion .tarjeta-reserva').first().click();
  for (const modo of ['consulta', 'edición']) {
    if (modo === 'edición') await page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Modificar' }).click();
    await page.waitForLoadState('networkidle');
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho, `desbordamiento en la ficha (${modo})`).toBeLessThanOrEqual(page.viewportSize().width);
  }
});

test('F-25 · "Reservas" abre el segundo piso con Gestionar y Crear; otra sección lo cierra', async ({ page, request }) => {
  await reiniciar(request);
  await page.goto('/');
  const gestionar = page.getByRole('button', { name: 'Gestionar Reservas', exact: true });
  await expect(gestionar).toBeHidden();
  await page.getByRole('button', { name: 'Reservas', exact: true }).click();
  await expect(gestionar).toBeVisible();
  await page.getByRole('button', { name: 'Crear Reservas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reservas', exact: true })).toHaveAttribute('aria-current', 'page');
  await irA(page, 'Gastos');
  await expect(gestionar).toBeHidden();
});

test('F-33 · Gestionar cambia la barra por la de Reservas; "Inicio" devuelve la general', async ({ page, request }) => {
  await reiniciar(request);
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  const barra = page.locator('#nav-reservas');
  await expect(barra).toBeVisible();
  await expect(page.locator('#nav-general')).toBeHidden();
  for (const funcion of ['Checklist', 'Identidades', 'Contrato', 'Extras']) await expect(barra.getByRole('button', { name: funcion })).toBeVisible();
  await barra.getByRole('button', { name: 'Inicio' }).click();
  await expect(page.locator('#seccion-inicio')).toBeVisible();
  await expect(page.locator('#nav-general')).toBeVisible();
});

test('F-31 · el menú Admin solo lo ve el rol Admin y abre Checklists y Conexión SES', async ({ page, request }) => {
  await reiniciar(request);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Admin', exact: true })).toBeHidden();
  await prueba(request, '/__test/usuario?email=admin@test.com');
  await page.goto('/');
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Checklists', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Conexión SES', exact: true }).click();
  await expect(page.locator('#seccion-conexion-ses')).toBeVisible();
});
