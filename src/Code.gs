// Punto de entrada de la Web App. Ver ADR-0008 (navegación) y ADR-0001 (acceso).

const NOMBRE_APP = 'KAF Rent';

const doGet = () => {
  const acceso = verificarAcceso(obtenerEmailSesion());
  const vista = acceso.autorizado ? 'index' : 'acceso-denegado';
  return renderizarVista(vista, { email: acceso.email });
};

const renderizarVista = (nombreArchivo, datos) => {
  const plantilla = HtmlService.createTemplateFromFile(nombreArchivo);
  plantilla.datos = datos || {};
  return plantilla.evaluate()
    .setTitle(NOMBRE_APP)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
};

// Permite incrustar otros archivos HTML (estilos, cliente) dentro de una plantilla.
const include = (nombreArchivo) => HtmlService.createHtmlOutputFromFile(nombreArchivo).getContent();
