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

const obtenerConfigNumero_ = (clave, porDefecto) => Number(obtenerConfig_(clave, porDefecto)) || porDefecto;

// Tamaños máximos de archivo (MB); el valor por defecto coincide con la semilla de Config.
const tamanoMaxContratoMB_ = () => obtenerConfigNumero_('Tamano_Max_Contrato_MB', 5);
const tamanoMaxVideoMB_ = () => obtenerConfigNumero_('Tamano_Max_Video_MB', 100);

// Destinatarios de todos los avisos e informes (los tres copropietarios).
const obtenerEmailsNotificacion_ = () =>
  String(obtenerConfig_('Emails_Notificacion', ''))
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
