// Capa: API — punto de entrada de la Web App (doGet) y plantillas. Ver ADR-0008 y ADR-0001.

const NOMBRE_APP = 'KAF Rent';

// F-37/F-40: un enlace de email puede abrir la app en una acción (?accion=ingreso&id=2026-015). Solo pasan las acciones
// conocidas con un ID con formato válido; cualquier otra cosa abre el Inicio. El cliente vuelve a pedir confirmación.
const accionInicial_ = (parametros) => {
  const accion = texto_(parametros && parametros.accion);
  const id = texto_(parametros && parametros.id);
  return Object.values(ACCION_APP).includes(accion) && FORMATO_ID_RESERVA.test(id) ? { accion, id } : { accion: '', id: '' };
};

const doGet = (e) => {
  const acceso = verificarAcceso_(obtenerEmailSesion_());
  const inicial = acceso.autorizado ? accionInicial_(e && e.parameter) : { accion: '', id: '' };
  return renderizarVista_(acceso.autorizado ? 'index' : 'acceso-denegado', {
    email: acceso.email, icono: texto_(obtenerConfig_('Icono_Url', '')), accion: inicial.accion, idAccion: inicial.id,
  });
};

const renderizarVista_ = (nombreArchivo, datos) => {
  const plantilla = HtmlService.createTemplateFromFile(nombreArchivo);
  plantilla.datos = datos || {};
  // B-30: sin setFaviconUrl; Google rechazaba Config.Icono_Url y llenaba Errores. El icono del móvil es D-23.
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
