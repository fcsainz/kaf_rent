// Capa: INFRAESTRUCTURA — parámetros de la hoja Config (clave-valor), leídos una vez por ejecución (RNF-23).

let cacheConfig_ = null;

const leerConfig_ = () => {
  if (cacheConfig_) return cacheConfig_;
  cacheConfig_ = registrosDe_(HOJA_CONFIG).reduce((config, r) => {
    const clave = texto_(r.clave);
    if (clave) config[clave] = r.valor;
    return config;
  }, {});
  return cacheConfig_;
};

const obtenerConfig_ = (clave, porDefecto = '') => {
  const valor = leerConfig_()[clave];
  return valor === undefined || valor === '' ? porDefecto : valor;
};

// B-22: Sheets convierte "16:00" en un valor de hora (fecha de 1899); se devuelve siempre 'HH:mm'.
const obtenerConfigHora_ = (clave, porDefecto) => {
  const valor = obtenerConfig_(clave, porDefecto);
  return valor instanceof Date ? Utilities.formatDate(valor, zonaHoraria_(), 'HH:mm') : texto_(valor);
};

// Horas con que se prerrellena el formulario en los espacios por días (F-23, ADR-0019).
const horasPorDefecto_ = () => ({
  llegada: obtenerConfigHora_('Hora_CheckIn_Default', '16:00'),
  salida: obtenerConfigHora_('Hora_CheckOut_Default', '12:00'),
});

const obtenerConfigNumero_ = (clave, porDefecto) => Number(obtenerConfig_(clave, porDefecto)) || porDefecto;

// Tamaños máximos de archivo (MB); el valor por defecto coincide con la semilla de Config.
const tamanoMaxContratoMB_ = () => obtenerConfigNumero_('Tamano_Max_Contrato_MB', 15);
const tamanoMaxVideoMB_ = () => obtenerConfigNumero_('Tamano_Max_Video_MB', 100);

// Destinatarios de todos los avisos e informes (los tres copropietarios).
const obtenerEmailsNotificacion_ = () =>
  String(obtenerConfig_('Emails_Notificacion', ''))
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
