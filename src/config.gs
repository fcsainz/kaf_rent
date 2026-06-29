// Lectura de parámetros desde la hoja Config (clave-valor). Nunca hardcodear estos valores en el código.

const COL_CONFIG_CLAVE = 0;
const COL_CONFIG_VALOR = 1;

let _configCache = null;

const leerConfig = () => {
  if (_configCache) return _configCache;
  const hoja = obtenerHoja(HOJA_CONFIG);
  if (!hoja) return {};
  _configCache = obtenerFilas(hoja).reduce((acc, fila) => {
    const clave = String(fila[COL_CONFIG_CLAVE]).trim();
    if (clave) acc[clave] = fila[COL_CONFIG_VALOR];
    return acc;
  }, {});
  return _configCache;
};

const obtenerConfig = (clave, porDefecto = '') => {
  const valor = leerConfig()[clave];
  return (valor === undefined || valor === '') ? porDefecto : valor;
};

// Lista de emails de notificación (los tres copropietarios), desde Config.
const obtenerEmailsNotificacion = () =>
  String(obtenerConfig('Emails_Notificacion', ''))
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
