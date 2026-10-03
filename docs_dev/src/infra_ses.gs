// Capa: INFRAESTRUCTURA — servicio web de SES.Hospedajes: SOAP sobre HTTPS con HTTP Basic (ADR-0018, DD-02 §3.3).
// Las credenciales viven en las Propiedades del script, nunca en el Sheet ni en el código (D-32, CLAUDE.md §4.8).

const PROPIEDAD_SES_USUARIO = 'SES_USUARIO';
const PROPIEDAD_SES_CONTRASENA = 'SES_CONTRASENA';
const NOMBRE_FICHERO_SOLICITUD = 'solicitud.xml';

const leerCredencialesSES_ = () => {
  const propiedades = PropertiesService.getScriptProperties();
  return { usuario: texto_(propiedades.getProperty(PROPIEDAD_SES_USUARIO)), contrasena: texto_(propiedades.getProperty(PROPIEDAD_SES_CONTRASENA)) };
};

const hayCredencialesSES_ = () => {
  const { usuario, contrasena } = leerCredencialesSES_();
  return Boolean(usuario && contrasena);
};

const credencialesSES_ = () => {
  if (!hayCredencialesSES_()) {
    throw new Error(`Faltan las credenciales de SES en las Propiedades del script (${PROPIEDAD_SES_USUARIO}, ${PROPIEDAD_SES_CONTRASENA}).`);
  }
  return leerCredencialesSES_();
};

// La solicitud va como XML en UTF-8, comprimido en ZIP y codificado en Base64 (§3.1.1).
const comprimirSolicitud_ = (xml) =>
  Utilities.base64Encode(Utilities.zip([Utilities.newBlob(xml, 'application/xml', NOMBRE_FICHERO_SOLICITUD)]).getBytes());

// Una llamada al servicio: { httpCodigo, cuerpo }, o { errorRed } si no hubo respuesta (se reintenta, DD-02 §3.5).
const llamarSES_ = (sobre) => {
  const { usuario, contrasena } = credencialesSES_();
  try {
    const respuesta = UrlFetchApp.fetch(texto_(obtenerConfig_('SES_Url')), {
      method: 'post',
      contentType: 'text/xml; charset=utf-8',
      payload: sobre,
      muteHttpExceptions: true,
      headers: { Authorization: `Basic ${Utilities.base64Encode(`${usuario}:${contrasena}`)}` },
    });
    return { httpCodigo: respuesta.getResponseCode(), cuerpo: respuesta.getContentText() };
  } catch (error) {
    registrarError_('llamarSES_', error, {});
    return { errorRed: error.message };
  }
};

const conRespuesta_ = (llamada, leer) => (llamada.cuerpo === undefined ? llamada : { ...llamada, ...leer(llamada.cuerpo) });

const llamarComunicacionSES_ = (tipoOperacion, tipoComunicacion, xmlSolicitud) => conRespuesta_(llamarSES_(construirSobreComunicacion_({
  codigoArrendador: texto_(obtenerConfig_('SES_Codigo_Arrendador')),
  aplicacion: texto_(obtenerConfig_('SES_Aplicacion', 'KAF Rent')),
  tipoOperacion,
  tipoComunicacion,
  solicitudBase64: comprimirSolicitud_(xmlSolicitud),
})), leerRespuestaAlta_);

// Alta de una reserva (RH) o un parte (PV); o anulación de comunicaciones ya hechas (ADR-0022).
const enviarComunicacionSES_ = (tipo, xmlSolicitud) => (tipo === TIPO_COMUNICACION_SES.ANULACION
  ? llamarComunicacionSES_(OPERACION_SES.ANULACION, '', xmlSolicitud)
  : llamarComunicacionSES_(OPERACION_SES.ALTA, tipo, xmlSolicitud));

const consultarLoteSES_ = (lote) => conRespuesta_(llamarSES_(construirSobreConsultaLote_([lote])), leerRespuestaLote_);

const consultarCatalogoSES_ = (catalogo) => conRespuesta_(llamarSES_(construirSobreCatalogo_(catalogo)), leerRespuestaCatalogo_);
