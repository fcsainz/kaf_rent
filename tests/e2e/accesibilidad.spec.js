// RNF-12 · B-12: áreas táctiles de al menos 44×44 px en móvil (WCAG 2.5.5, CLAUDE.md §6.5).
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, rpc, datosHabitacion } = require('./ayudas');

const MINIMO_PX = 44;
const SECCIONES = ['Inicio', 'Crear Reservas', 'Gestionar Reservas', 'Cerrar días', 'Estadísticas', 'Gastos'];

test('RNF-12 · botones y campos visibles miden al menos 44 px de alto', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'movil', 'solo aplica al móvil');
  await reiniciar(request);
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  const pequenos = [];
  for (const seccion of SECCIONES) {
    await irA(page, seccion);
    await page.waitForLoadState('networkidle');
    const encontrados = await page.evaluate((minimo) => [...document.querySelectorAll('button, select, input:not([type=checkbox]):not([type=radio]):not([type=file]), a')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el: `${el.tagName.toLowerCase()}#${el.id || ''}.${el.className || ''} "${(el.textContent || '').trim().slice(0, 20)}"`, alto: Math.round(el.getBoundingClientRect().height) }))
      .filter((x) => x.alto < minimo), MINIMO_PX);
    pequenos.push(...encontrados.map((x) => `${seccion}: ${x.el} ${x.alto}px`));
  }
  // DD-03: ficha (consulta y edición) y pantallas de las funciones de la barra de Reservas.
  const medir = async (pantalla) => {
    await page.waitForLoadState('networkidle');
    const encontrados = await page.evaluate((minimo) => [...document.querySelectorAll('button, select, input:not([type=checkbox]):not([type=radio]):not([type=file]), a')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el: `${el.tagName.toLowerCase()}#${el.id || ''}.${el.className || ''} "${(el.textContent || '').trim().slice(0, 20)}"`, alto: Math.round(el.getBoundingClientRect().height) }))
      .filter((x) => x.alto < minimo), MINIMO_PX);
    pequenos.push(...encontrados.map((x) => `${pantalla}: ${x.el} ${x.alto}px`));
  };
  await irA(page, 'Gestionar Reservas');
  await page.locator('#lista-gestion .tarjeta-reserva').first().click();
  await medir('Ficha');
  await page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Modificar' }).click();
  await medir('Ficha (modificar)');
  await page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Descartar cambios' }).click();
  for (const funcion of ['Checklist', 'Identidades', 'Contrato', 'Extras']) {
    await page.locator('#nav-reservas').getByRole('button', { name: funcion }).click();
    if (funcion === 'Checklist') await page.getByRole('button', { name: 'IN · Check-in' }).click();
    await medir(funcion);
  }
  expect([...new Set(pequenos)]).toEqual([]);
});
