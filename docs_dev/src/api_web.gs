// Capa: API — punto de entrada de la Web App (doGet) y plantillas. Ver ADR-0008 y ADR-0001.

const NOMBRE_APP = 'KAF Rent';

const doGet = () => {
  const acceso = verificarAcceso_(obtenerEmailSesion_());
  return renderizarVista_(acceso.autorizado ? 'index' : 'acceso-denegado', { email: acceso.email });
};

const renderizarVista_ = (nombreArchivo, datos) => {
  const plantilla = HtmlService.createTemplateFromFile(nombreArchivo);
  plantilla.datos = datos || {};
  return plantilla.evaluate()
    .setTitle(NOMBRE_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
};

// Público porque lo invocan las plantillas (<?!= include('…') ?>); solo devuelve HTML estático de la interfaz.
const include = (nombreArchivo) => HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();

// Perfil de quien usa la app, para mostrar u ocultar opciones (el servidor vuelve a comprobarlo en cada endpoint).
const obtenerPerfil = () => ejecutarEndpoint_('obtenerPerfil', {}, () => ({
  success: true, data: { email: obtenerEmailSesion_(), esAdmin: sesionEsAdmin_() },
}));
