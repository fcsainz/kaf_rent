// Carga los .gs de docs_dev/src en un contexto vm aislado, igual que Apps Script: un único ámbito global
// compartido por todos los ficheros. Cada test crea su propio entorno (FIRST: independiente y repetible).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { crearServicios } = require('./dobles');

const DIR_SRC = path.join(__dirname, '..', '..', 'docs_dev', 'src');
const ficherosGs = () => fs.readdirSync(DIR_SRC).filter((f) => f.endsWith('.gs')).sort();
const leerFuente = (f) => fs.readFileSync(path.join(DIR_SRC, f), 'utf8');

const EMAIL_PROPIETARIO = 'operacion@test.com';
const EMAILS_AUTORIZADOS = ['ana@test.com', 'luis@test.com', 'carlos@test.com'];

const crearEntorno = (opciones = {}) => {
  const entorno = crearServicios({ usuarioEfectivo: EMAIL_PROPIETARIO, ...opciones });
  const ctx = vm.createContext({ ...entorno.servicios, Buffer, Date, Math, JSON });
  const orden = opciones.ordenInverso ? ficherosGs().reverse() : ficherosGs();
  orden.forEach((f) => vm.runInContext(leerFuente(f), ctx, { filename: path.join(DIR_SRC, f) }));

  const fn = (nombre) => vm.runInContext(nombre, ctx);
  // Como google.script.run, la respuesta viaja serializada: se clona por JSON (y los objetos quedan en el ámbito del test).
  const llamar = (nombre, ...args) => {
    const r = fn(nombre)(...args);
    return r === undefined ? r : JSON.parse(JSON.stringify(r));
  };
  const hoja = (nombre) => entorno.libro.getSheetByName(nombre);

  // Actúa como la propia cuenta operativa (ejecución desde el editor) durante `accion`.
  const comoPropietario = (accion) => {
    const previo = entorno.sesion.activo;
    entorno.sesion.activo = EMAIL_PROPIETARIO;
    try { return accion(); } finally { entorno.sesion.activo = previo; }
  };

  return { ...entorno, ctx, fn, llamar, hoja, comoPropietario };
};

// Entorno con la base de datos inicializada, usuarios, catálogos y Config listos para usar.
const crearEntornoConDatos = (opciones = {}) => {
  const e = crearEntorno(opciones);
  e.comoPropietario(() => e.llamar('inicializarBaseDeDatos'));
  const anadir = (nombre, filas) => filas.forEach((f) => e.hoja(nombre).appendRow(f));

  anadir('Usuarios_Autorizados', EMAILS_AUTORIZADOS.map((m) => [m, 'Sí', '']).concat([['baja@test.com', 'No', '']]));
  anadir('Catálogo_Canales', [
    ['Piscina / Jardín', 'Cocopool', 'Sí', 15, 'Automática', 9.5],
    ['Piscina / Jardín', 'Directo', 'Sí', 0, 'Manual', 0],
    ['Habitación Interior', 'Airbnb', 'Sí', 3, 'Automática', 0, 'Sí'],
    ['Habitación Interior', 'Booking', 'No', 15, 'Automática', 0],
  ]);
  anadir('Catálogo_Servicios_Extra', [
    ['Piscina / Jardín', 'Hielo', 'Sí', 1, 3],
    ['Piscina / Jardín', 'BBQ', 'Sí', 5, 20],
    ['Habitación Interior', 'Desayuno', 'Sí', 4, 10],
  ]);

  const raiz = e.drive.registrarCarpeta(new e.CarpetaFalsa('KAF. KAF Rent'));
  const videos = raiz.createFolder('KAF. Videos - KAF Rent');
  videos.createFolder('KAF. VIdeos in-out - Piscina');
  const documentos = raiz.createFolder('KAF. Documentos - KAF Rent');
  const backups = raiz.createFolder('KAF. Backups - KAF Rent');
  const config = {
    Emails_Notificacion: EMAILS_AUTORIZADOS.join(', '),
    Carpeta_Videos_Id: videos.id,
    Carpeta_Documentos_Id: documentos.id,
    Carpeta_Backups_Id: backups.id,
    Calendar_Url: 'https://calendar.test/grupo',
  };
  const hojaConfig = e.hoja('Config');
  hojaConfig.datos.forEach((fila) => { if (config[fila[0]] !== undefined) fila[1] = config[fila[0]]; });

  return { ...e, carpetas: { raiz, videos, documentos, backups } };
};

// Fechas relativas a hoy (los formularios rechazan fechas pasadas).
const isoDentroDe = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const datosReservaHabitacion = (cambios = {}) => ({
  espacio: 'Habitación Interior', canal: 'Airbnb', comision: '3',
  fechaEntrada: isoDentroDe(30), fechaSalida: isoDentroDe(33),
  adultos: '2', menores: '0', importeAlquiler: '300',
  nombre: 'Marta Pérez', telefono: '600111222', email: 'marta@huesped.com', refCanal: 'HMTEST1234',
  servicios: [{ nombre: 'Desayuno', cantidad: '2' }],
  ...cambios,
});

const datosReservaPiscina = (cambios = {}) => ({
  espacio: 'Piscina / Jardín', canal: 'Cocopool', comision: '15',
  fechaUnica: isoDentroDe(20), horaLlegada: '11:00', horaSalida: '19:00',
  adultos: '6', menores: '2', importeAlquiler: '200',
  nombre: 'Grupo Ruiz', telefono: '', email: '',
  servicios: [{ nombre: 'Hielo', cantidad: '3' }],
  ...cambios,
});

module.exports = {
  crearEntorno, crearEntornoConDatos, ficherosGs, leerFuente, isoDentroDe,
  datosReservaHabitacion, datosReservaPiscina, EMAIL_PROPIETARIO, EMAILS_AUTORIZADOS,
};
