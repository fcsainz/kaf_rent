// Utilidades comunes de los E2E: estado del servidor de pruebas y datos de ejemplo.
const { expect } = require('@playwright/test');

const isoDentroDe = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const reiniciar = (request) => request.get('/__test/reiniciar');
const prueba = async (request, ruta) => (await request.get(ruta)).json();
const rpc = async (request, nombre, ...args) => (await (await request.post(`/rpc/${nombre}`, { data: args })).json()).valor;

const datosHabitacion = (cambios = {}) => ({
  espacio: 'Habitación Interior', canal: 'Airbnb', comision: '3',
  fechaEntrada: isoDentroDe(30), fechaSalida: isoDentroDe(33), horaLlegada: '16:00', horaSalida: '12:00',
  adultos: '2', menores: '0', importeAlquiler: '300',
  nombre: 'Marta Pérez', telefono: '600111222', email: 'marta@huesped.com', refCanal: 'HMTEST1234', servicios: [],
  ...cambios,
});

// Navega con la barra inferior (F-25, F-31, F-33): Gestionar y Crear están en el segundo piso de "Reservas";
// Checklists y Conexión SES, en el de "Admin". Desde la barra de Reservas se vuelve antes con "Inicio".
const SUBSECCIONES = { 'Gestionar Reservas': 'Reservas', 'Crear Reservas': 'Reservas', Checklists: 'Admin', 'Conexión SES': 'Admin' };
const irA = async (page, seccion) => {
  if (await page.locator('#nav-reservas').isVisible()) await page.locator('#btn-nav-volver-inicio').click();
  const boton = page.locator('.nav-inferior').getByRole('button', { name: seccion, exact: true });
  if (SUBSECCIONES[seccion] && !(await boton.isVisible())) {
    await page.locator('#nav-general').getByRole('button', { name: SUBSECCIONES[seccion], exact: true }).click();
  }
  await boton.click();
};

// Abre la ficha de una reserva desde Gestionar tocando su tarjeta (F-36, F-42).
const abrirFicha = async (page, nombre) => {
  await irA(page, 'Gestionar Reservas');
  await page.locator('#lista-gestion .tarjeta-reserva', { hasText: nombre }).click();
  await expect(page.locator('#ficha-titulo')).toContainText('Reserva');
};

// Rellena el formulario de Crear Reserva para la Habitación (modo Rango_Dias).
const rellenarReservaHabitacion = async (page, { entrada = isoDentroDe(30), salida = isoDentroDe(33), nombre = 'Marta Pérez' } = {}) => {
  await irA(page, 'Crear Reservas');
  await page.locator('#campo-espacio').selectOption('Habitación Interior');
  await expect(page.locator('#campo-canal option', { hasText: 'Airbnb' })).toHaveCount(1);
  await page.locator('#campo-canal').selectOption('Airbnb');
  await page.locator('#campo-ref-canal').fill('HMTEST1234');
  await page.locator('#campo-fecha-entrada').fill(entrada);
  await page.locator('#campo-fecha-salida').fill(salida);
  await page.locator('#campo-adultos').fill('2');
  await page.locator('#campo-importe-alquiler').fill('300');
  await page.locator('#campo-nombre').fill(nombre);
};

const dialogo = (page) => page.getByRole('alertdialog');

// Deja resuelta una checklist por detrás (todos los puntos Hecho, con fecha donde toca), sin confirmarla.
const resolverChecklist = async (request, id, momento) => {
  const { data } = await rpc(request, 'cargarChecklist', id, momento);
  const estados = data.bloques.flatMap((b) => b.puntos).filter((p) => p.tipo !== 'Foto')
    .map((p) => ({ idPunto: p.id, estado: 'Hecho', valor: { Fecha: isoDentroDe(0), 'Daños': 'Sin daños' }[p.tipo] || '' }));
  return rpc(request, 'guardarChecklist', id, momento, estados, '');
};
const idInterno = async (request) => (await prueba(request, '/__test/hoja?nombre=Reservas'))[0].ID_Reserva;

module.exports = { abrirFicha, irA, isoDentroDe, reiniciar, prueba, rpc, datosHabitacion, rellenarReservaHabitacion, dialogo, resolverChecklist, idInterno };
