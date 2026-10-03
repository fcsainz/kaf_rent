// Journeys J-1 a J-6 (01_problema.md, Anexo A) de principio a fin en el navegador (T-05).
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, prueba, rpc, datosHabitacion, rellenarReservaHabitacion, dialogo, isoDentroDe, resolverChecklist, idInterno } = require('./ayudas');

const reservaEnHoja = async (request) => (await prueba(request, '/__test/hoja?nombre=Reservas'))[0];

const abrirModificar = async (page, nombre = 'Marta Pérez') => {
  await irA(page, 'Gestionar Reservas');
  const fila = page.locator('#tabla-gestion tr', { hasText: nombre });
  await fila.getByRole('button', { name: 'Modificar' }).click();
  await expect(page.locator('#edicion-titulo')).toContainText('Reserva');
};

test.beforeEach(async ({ request }) => reiniciar(request));

test('J-1 · crear una reserva: queda Abierta, con evento, invitaciones y emails', async ({ page, request }) => {
  await page.goto('/');
  await rellenarReservaHabitacion(page);
  await expect(page.locator('#res-bruto')).not.toHaveText('');
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  await expect(page.getByRole('status')).toContainText('guardada correctamente');
  expect((await reservaEnHoja(request)).Estado_Reserva).toBe('Abierta');
  const [evento] = await prueba(request, '/__test/eventos');
  expect(evento.opciones.guests).toContain('ana@test.com');
  expect((await prueba(request, '/__test/correos')).length).toBeGreaterThan(0);
});

test('J-1 · un solapamiento se explica en una ventana y no guarda nada', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await rellenarReservaHabitacion(page, { entrada: isoDentroDe(31), salida: isoDentroDe(32), nombre: 'Otro Huésped' });
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  await expect(dialogo(page)).toBeVisible();
  expect((await prueba(request, '/__test/hoja?nombre=Reservas')).length).toBe(1);
});

test('J-2 · completar el ciclo: cobro ingresado + check-out terminado (con confirmación) → Completada', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await resolverChecklist(request, await idInterno(request), 'Check-out');
  await page.goto('/');
  await abrirModificar(page);
  await page.locator('#ed-cobro').selectOption('Ingresado');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toHaveText('Cambios guardados.');
  expect((await reservaEnHoja(request)).Estado_Reserva).toBe('Abierta');

  await abrirModificar(page);
  await page.locator('details.checklist', { hasText: 'Check-out' }).locator('summary').click();
  await page.getByRole('button', { name: 'Dar el check-out por terminado' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, continuar' }).click();
  await expect(page.getByRole('status')).toHaveText('Check-out terminado.');
  expect((await reservaEnHoja(request)).Estado_Reserva).toBe('Completada');
});

test('J-3 · cancelar pide confirmación; "No, volver" no cancela y "Sí, continuar" sí', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await abrirModificar(page);
  await page.getByRole('button', { name: 'Cancelar reserva' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'No, volver' }).click();
  expect((await reservaEnHoja(request)).Estado_Reserva).toBe('Abierta');
  await page.getByRole('button', { name: 'Cancelar reserva' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sí, continuar' }).click();
  await expect(page.getByRole('status')).toHaveText('Reserva cancelada.');
  expect((await reservaEnHoja(request)).Estado_Reserva).toBe('Cancelada');
  expect((await prueba(request, '/__test/eventos')).length).toBe(0);
});

test('J-4 · el historial muestra el cambio hecho', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await abrirModificar(page);
  await page.locator('#ed-telefono').fill('611222333');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('status')).toHaveText('Cambios guardados.');
  await abrirModificar(page);
  await expect(page.locator('#tabla-historial')).toContainText('611222333');
});

test('J-5 · buscar por nombre desde el Inicio', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await page.locator('#buscar-nombre').fill('marta');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.locator('#tabla-busqueda')).toContainText('Marta Pérez');
});

test('J-6 · registrar un gasto y ver el resumen fiscal del ejercicio', async ({ page }) => {
  await page.goto('/');
  await irA(page, 'Gastos');
  await page.locator('#ga-fecha').fill(isoDentroDe(-1));
  await page.locator('#ga-importe').fill('120');
  await page.locator('#ga-concepto').fill('Productos de piscina');
  await page.locator('#ga-categoria').selectOption({ index: 1 });
  await page.locator('#ga-espacio').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Guardar Gasto' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(dialogo(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Calcular' }).click();
  await expect(page.locator('#rf-resultado')).toContainText('€');
});
