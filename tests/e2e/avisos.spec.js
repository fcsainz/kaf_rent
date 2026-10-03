// F-21 / RF-81, RF-82 · Éxitos centrados que se cierran solos; errores y avisos en ventana que hay que cerrar.
const { test, expect } = require('@playwright/test');
const { irA, reiniciar, prueba, rellenarReservaHabitacion, dialogo } = require('./ayudas');

// El botón Guardar aparece al elegir el espacio; el resto de campos se deja vacío.
const abrirFormularioVacio = async (page) => {
  await irA(page, 'Crear Reservas');
  await page.locator('#campo-espacio').selectOption('Habitación Interior');
};

test.beforeEach(async ({ page, request }) => {
  await reiniciar(request);
  await page.goto('/');
});

test('J-1 · guardar una reserva muestra un éxito centrado que se cierra solo', async ({ page }) => {
  await rellenarReservaHabitacion(page);
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  const exito = page.getByRole('status');
  await expect(exito).toHaveText(/Reserva 01\/\d\d guardada correctamente/);
  await expect(dialogo(page)).toHaveCount(0);
  await expect(exito).toBeHidden({ timeout: 6000 });
});

test('RF-81 · un error de validación abre una ventana que solo se cierra al pulsar "Entendido"', async ({ page }) => {
  await abrirFormularioVacio(page);
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  await expect(dialogo(page)).toContainText('Revisa los campos marcados.');
  await page.waitForTimeout(4000);
  await expect(dialogo(page)).toBeVisible();
  await dialogo(page).getByRole('button', { name: 'Entendido' }).click();
  await expect(dialogo(page)).toHaveCount(0);
});

test('RF-81 · Escape cierra la ventana y el foco no se escapa con Tab', async ({ page }) => {
  await abrirFormularioVacio(page);
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  await expect(dialogo(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(dialogo(page).getByRole('button', { name: 'Entendido' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialogo(page)).toHaveCount(0);
});

test('RF-82 · sin evento de Calendar: aviso con botón que envía la incidencia al administrador', async ({ page, request }) => {
  await prueba(request, '/__test/calendario-falla?falla=1');
  await rellenarReservaHabitacion(page);
  await page.getByRole('button', { name: 'Guardar Reserva' }).click();
  await expect(dialogo(page)).toContainText('no se pudo crear su evento en el calendario');
  await dialogo(page).getByRole('button', { name: 'Enviar al administrador' }).click();
  await expect(page.getByRole('status')).toHaveText('Incidencia enviada al administrador.');
  await expect(dialogo(page)).toHaveCount(0);
  const correos = await prueba(request, '/__test/correos');
  const incidencia = correos.find((c) => /Incidencia/.test(c.subject));
  expect(incidencia.to).toBe('admin@test.com');
  expect(incidencia.body).not.toContain('Marta Pérez');
});
