// Utilidades transversales: acceso cacheado a la hoja, lectura en bloque y logging.

let _spreadsheet = null;

const obtenerSpreadsheet = () => {
  if (!_spreadsheet) _spreadsheet = SpreadsheetApp.getActive();
  return _spreadsheet;
};

const obtenerHoja = (nombre) => obtenerSpreadsheet().getSheetByName(nombre);

// Devuelve las filas de datos (sin la cabecera). Lee en bloque, no celda a celda.
const obtenerFilas = (hoja) => {
  if (!hoja || hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn()).getValues();
};

// Combina una fecha 'YYYY-MM-DD' y una hora 'HH:MM' en un objeto Date local. Devuelve null si la fecha es inválida.
const combinarFechaHora = (fechaISO, horaHHMM) => {
  if (!fechaISO) return null;
  const [anyo, mes, dia] = String(fechaISO).split('-').map(Number);
  const [hora, minuto] = String(horaHHMM || '00:00').split(':').map(Number);
  if (!anyo || !mes || !dia) return null;
  return new Date(anyo, mes - 1, dia, hora || 0, minuto || 0, 0);
};

// Medianoche local de hoy, para comparar "no se permiten fechas pasadas".
const inicioDeHoy = () => {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0);
};

// Normaliza un valor de celda (Date o string) a Date.
const aFecha = (valor) => (valor instanceof Date ? valor : new Date(valor));

// Normaliza valores tipo "Sí"/"true"/"x"/1 a booleano.
const esVerdadero = (valor) => {
  if (valor === true) return true;
  const v = String(valor).trim().toLowerCase();
  return v === 'sí' || v === 'si' || v === 'true' || v === 'x' || v === '1';
};

const registrarLog = (tipo, email, detalle) => {
  try {
    const hoja = obtenerHoja(HOJA_LOGS);
    if (hoja) hoja.appendRow([new Date(), tipo, email, detalle]);
  } catch (error) {
    // El logger nunca debe relanzar ni entrar en bucle.
  }
};

const registrarError = (funcion, error, contexto) => {
  try {
    const hoja = obtenerHoja(HOJA_ERRORES);
    const mensaje = (error && error.message) ? error.message : String(error);
    if (hoja) hoja.appendRow([new Date(), funcion, mensaje, JSON.stringify(contexto || {})]);
  } catch (e) {
    // Nunca relanzar desde el logger de errores.
  }
};
