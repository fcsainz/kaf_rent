// DD-03 en el navegador: Inicio con Próximas/Últimas, listado en tarjetas, ficha (consultar y modificar), cambios sin
// guardar, enlaces de email, funciones de la barra de Reservas (contrato, extras, identidades) y "Ver calendario".
const { test, expect } = require('@playwright/test');
const { abrirFicha, irA, reiniciar, prueba, rpc, datosHabitacion, isoDentroDe, idInterno } = require('./ayudas');

const datosPiscina = (cambios = {}) => ({
  espacio: 'Piscina / Jardín', canal: 'Directo', comision: '0', fechaUnica: isoDentroDe(20), horaLlegada: '11:00', horaSalida: '19:00',
  adultos: '6', menores: '0', importeAlquiler: '200', nombre: 'Grupo Ruiz', telefono: '', email: '', servicios: [], ...cambios,
});
const barraReservas = (page) => page.locator('#nav-reservas');
const reservas = async (request) => prueba(request, '/__test/hoja?nombre=Reservas');

test.beforeEach(async ({ request }) => reiniciar(request));

test('F-32 · el Inicio cambia entre las 5 próximas y las 5 últimas registradas', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion({ nombre: 'Lejana', fechaEntrada: isoDentroDe(60), fechaSalida: isoDentroDe(61) }));
  await rpc(request, 'crearReserva', datosHabitacion({ nombre: 'Cercana', fechaEntrada: isoDentroDe(10), fechaSalida: isoDentroDe(11) }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Reservas de un vistazo' })).toBeVisible();
  const tarjetas = page.locator('#lista-vistazo .tarjeta-reserva');
  await expect(tarjetas.first()).toContainText('Cercana');
  await page.locator('#vistazo-orden').selectOption('entrada-desc');
  await expect(tarjetas.first()).toContainText('Lejana');
  await page.locator('#vistazo-modo').selectOption('ultimas');
  await expect(tarjetas).toHaveCount(2);
  await tarjetas.filter({ hasText: 'Cercana' }).click();
  await expect(page.locator('#ficha-titulo')).toBeVisible();
});

test('F-34/F-36 · los filtros actúan al momento, las canceladas solo salen con su filtro y se pagina de 5 en 5', async ({ page, request }) => {
  for (let i = 0; i < 6; i += 1) await rpc(request, 'crearReserva', datosPiscina({ nombre: `Grupo ${i}`, fechaUnica: isoDentroDe(10 + i) }));
  const [primera] = await reservas(request);
  await rpc(request, 'cancelarReserva', primera.ID_Reserva);
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  await expect(page.locator('#gestion-total')).toHaveText('5 reservas');
  await expect(page.locator('#lista-gestion .tarjeta-reserva')).toHaveCount(5);
  await expect(page.locator('#paginacion-gestion')).toBeHidden();
  await page.locator('#filtro-estado').selectOption('Cancelada');
  await expect(page.locator('#lista-gestion .tarjeta-reserva')).toHaveCount(1);
  await expect(page.locator('#lista-gestion')).toContainText('Grupo 0');
  await page.locator('#filtro-estado').selectOption('');
  await rpc(request, 'crearReserva', datosPiscina({ nombre: 'Grupo 6', fechaUnica: isoDentroDe(30) }));
  await page.getByRole('button', { name: 'Próximo mes' }).click();
  await expect(page.getByRole('button', { name: 'Próximo mes' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#pagina-actual')).toHaveText('Página 1 de 2');
  await page.getByRole('button', { name: 'Siguiente ›' }).click();
  await expect(page.locator('#lista-gestion .tarjeta-reserva')).toHaveCount(1);
});

test('F-42 · la ficha se abre en su pantalla con todas las secciones; sin servicios dice NA', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await abrirFicha(page, 'Marta Pérez');
  await expect(page.locator('#seccion-gestionar')).toBeHidden();
  const ficha = page.locator('#ficha-contenido');
  for (const seccion of ['Datos reserva', 'Datos del cliente', 'Checklist', 'Documentación', 'Resumen económico', 'Servicios extra', 'Notas', 'Historial de cambios']) {
    await expect(ficha.getByRole('heading', { name: seccion, exact: true })).toBeVisible();
  }
  await expect(ficha).toContainText('Total PAX');
  await expect(ficha).toContainText('Validación de identidad');
  await expect(ficha).toContainText('NA (No aplica)');
  await expect(page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Mensaje para el huésped' })).toBeVisible();
});

test('F-44 · salir con cambios sin guardar pregunta; "Guardar" los guarda y continúa', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await abrirFicha(page, 'Marta Pérez');
  await page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Modificar' }).click();
  await expect(page.locator('#ficha-acciones-abajo').getByRole('button', { name: 'Guardar cambios' })).toBeVisible();
  await page.locator('#ed-notas').fill('Llegan tarde');
  await page.getByRole('button', { name: '← Volver' }).click();
  const aviso = page.getByRole('alertdialog');
  await expect(aviso).toContainText('aún no los has guardado');
  await aviso.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.locator('#ed-notas')).toHaveValue('Llegan tarde');
  await barraReservas(page).getByRole('button', { name: 'Inicio' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('#seccion-inicio')).toBeVisible();
  expect((await reservas(request))[0].Notas).toBe('Llegan tarde');
});

test('F-44 · "Descartar" sale sin guardar', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await abrirFicha(page, 'Marta Pérez');
  await page.locator('#ficha-acciones-arriba').getByRole('button', { name: 'Modificar' }).click();
  await page.locator('#ed-notas').fill('No guardar');
  await page.getByRole('button', { name: '← Volver' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Descartar' }).click();
  await expect(page.locator('#seccion-gestionar')).toBeVisible();
  expect((await reservas(request))[0].Notas).toBe('');
});

test('F-37 · el enlace "Sí, se ha ingresado" del email abre la ficha y pide confirmación antes de marcarla', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  const id = await idInterno(request);
  await page.goto(`/?accion=ingreso&id=${id}`);
  const confirmar = page.getByRole('dialog');
  await expect(confirmar).toContainText('ya se ha ingresado');
  await confirmar.getByRole('button', { name: 'Sí, continuar' }).click();
  await expect(page.getByRole('status')).toHaveText('Reserva marcada como ingresada.');
  expect((await reservas(request))[0].Estado_Cobro).toBe('Ingresado');
});

test('F-37 · un enlace con una acción desconocida abre el Inicio sin hacer nada', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto(`/?accion=borrar&id=${await idInterno(request)}`);
  await expect(page.locator('#seccion-inicio')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('F-41 · Contrato propone la reserva de Exterior y la foto la marca firmada a mi nombre', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosPiscina());
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  await barraReservas(page).getByRole('button', { name: 'Contrato' }).click();
  await expect(page.locator('#funcion-opciones option')).toHaveCount(2);
  await expect(page.locator('#funcion-opciones')).not.toContainText('Marta Pérez');
  await page.locator('#funcion-propuesta .tarjeta-reserva', { hasText: 'Grupo Ruiz' }).click();
  await expect(page.locator('#contrato-estado')).toContainText('sin firmar');
  await page.locator('#contrato-archivo').setInputFiles({ name: 'contrato.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('foto') });
  await page.getByRole('button', { name: 'Subir foto' }).click();
  await expect(page.locator('#contrato-estado')).toContainText('Contrato firmado');
  const [piscina] = await reservas(request);
  expect([piscina.Contrato_Estado, piscina.Contrato_Firmado_Por]).toEqual(['Firmado', 'ana@test.com']);
});

test('F-43 · en Extras se cobra preguntando la forma y se añaden servicios', async ({ page, request }) => {
  await rpc(request, 'crearReserva', { ...datosPiscina(), canal: 'Cocopool', comision: '15', servicios: [{ nombre: 'BBQ', cantidad: '1' }] });
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  await barraReservas(page).getByRole('button', { name: 'Extras' }).click();
  await page.locator('#funcion-propuesta .tarjeta-reserva').click();
  const bbq = () => page.locator('#extras-lista .extra-item', { hasText: 'BBQ' });
  await expect(bbq()).toContainText('Pendiente');
  await bbq().getByRole('button', { name: 'Cobrar' }).click();
  const pregunta = page.getByRole('dialog');
  await expect(pregunta).toContainText('¿Cómo se ha cobrado');
  await pregunta.getByRole('button', { name: 'Presencial' }).click();
  await expect(bbq()).toContainText('Cobrado · Presencial');
  await page.locator('#extras-servicio').selectOption('Hielo');
  await page.locator('#extras-cantidad').fill('3');
  await page.getByRole('button', { name: 'Añadir servicio' }).click();
  await expect(page.locator('#extras-lista .extra-item', { hasText: 'Hielo' })).toContainText('Pendiente');
  const lineas = await prueba(request, '/__test/hoja?nombre=Reserva_Servicios');
  expect(lineas.map((l) => [l.Nombre_Servicio, l.Cantidad, l.Cobro_Estado, l.Cobro_Forma])).toEqual([['BBQ', 1, 'Cobrado', 'Presencial'], ['Hielo', 3, 'Pendiente', '']]);
});

test('F-39 · Validar identidades solo ofrece la Habitación y muestra el registro de viajeros', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosPiscina());
  await prueba(request, '/__test/viajeros');
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  await barraReservas(page).getByRole('button', { name: 'Identidades' }).click();
  await expect(page.locator('#grupo-funcion-espacio')).toBeHidden();
  await expect(page.locator('#funcion-opciones')).not.toContainText('Grupo Ruiz');
  await page.locator('#funcion-propuesta .tarjeta-reserva').click();
  await expect(page.locator('#viajeros-chips')).toContainText('Formularios 2 de 2');
  await expect(page.getByRole('button', { name: 'Mensaje para el huésped' })).toBeVisible();
});

test('F-38 · Checklist pide IN u OUT y luego la reserva; el email de check-in abre la checklist directamente', async ({ page, request }) => {
  await rpc(request, 'crearReserva', datosHabitacion());
  await page.goto('/');
  await irA(page, 'Gestionar Reservas');
  await barraReservas(page).getByRole('button', { name: 'Checklist' }).click();
  await expect(page.locator('#funcion-selector')).toBeHidden();
  await page.getByRole('button', { name: 'IN · Check-in' }).click();
  await expect(page.locator('#funcion-propuesta')).toContainText('Marta Pérez');
  await page.goto(`/?accion=checkin&id=${await idInterno(request)}`);
  await expect(page.locator('#trabajo-checklist details.checklist summary')).toContainText('Check-in');
  await expect(page.locator('#funcion-reserva-titulo')).toContainText('Marta Pérez');
});

test('D-44 · "Ver calendario" abre la app de Calendar en Android y otra pestaña en el resto', async ({ page }, info) => {
  await page.goto('/');
  const enlace = page.locator('#enlace-calendario');
  if (info.project.name === 'movil') await expect(enlace).toHaveAttribute('href', /^intent:\/\/calendar\.test\/grupo#Intent;scheme=https;package=com\.google\.android\.calendar;S\.browser_fallback_url=/);
  else await expect(enlace).toHaveAttribute('href', 'https://calendar.test/grupo');
  await expect(enlace).toHaveAttribute('target', '_blank');
});
