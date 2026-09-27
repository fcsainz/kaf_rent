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
  fechaEntrada: isoDentroDe(30), fechaSalida: isoDentroDe(33),
  adultos: '2', menores: '0', importeAlquiler: '300',
  nombre: 'Marta Pérez', telefono: '600111222', email: 'marta@huesped.com', servicios: [],
  ...cambios,
});

// Rellena el formulario de Crear Reserva para la Habitación (modo Rango_Dias).
const rellenarReservaHabitacion = async (page, { entrada = isoDentroDe(30), salida = isoDentroDe(33), nombre = 'Marta Pérez' } = {}) => {
  await page.getByRole('button', { name: 'Crear Reserva' }).click();
  await page.locator('#campo-espacio').selectOption('Habitación Interior');
  await expect(page.locator('#campo-canal option', { hasText: 'Airbnb' })).toHaveCount(1);
  await page.locator('#campo-canal').selectOption('Airbnb');
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
    .map((p) => ({ idPunto: p.id, estado: 'Hecho', valor: p.tipo === 'Fecha' ? isoDentroDe(0) : '' }));
  return rpc(request, 'guardarChecklist', id, momento, estados, '');
};
const idInterno = async (request) => (await prueba(request, '/__test/hoja?nombre=Reservas'))[0].ID_Reserva;

module.exports = { isoDentroDe, reiniciar, prueba, rpc, datosHabitacion, rellenarReservaHabitacion, dialogo, resolverChecklist, idInterno };
