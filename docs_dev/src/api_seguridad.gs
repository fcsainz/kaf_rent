// Capa: API — seguridad común a todos los puntos de entrada: identidad, autorización y ejecución protegida
// de endpoints y tareas del sistema. Ver ADR-0001, RNF-20.
// En Apps Script toda función global sin sufijo "_" es invocable desde el navegador con google.script.run,
// y se ejecuta con los permisos de la cuenta operativa. Por eso todo lo interno termina en "_".

const MENSAJE_NO_AUTORIZADO = 'Sesión no autorizada.';
const ESPERA_BLOQUEO_MS = 20000;

// Email real de quien accede: se conserva aunque la Web App se ejecute como la cuenta operativa (USER_DEPLOYING).
const obtenerEmailSesion_ = () => {
  try {
    return texto_(Session.getActiveUser().getEmail());
  } catch (error) {
    registrarError_('obtenerEmailSesion_', error, {});
    return '';
  }
};

const usuariosActivos_ = () => registrosDe_(HOJA_USUARIOS).filter((u) => esVerdadero_(u.activo));

const esUsuarioAutorizado_ = (email) => {
  if (!email) return false;
  try {
    const objetivo = email.toLowerCase();
    return usuariosActivos_().some((u) => texto_(u.email).toLowerCase() === objetivo);
  } catch (error) {
    registrarError_('esUsuarioAutorizado_', error, {});
    return false;
  }
};

const emailsConPermiso_ = (permiso) => usuariosActivos_()
  .filter((u) => tienePermiso_(u.rol, permiso))
  .map((u) => texto_(u.email))
  .filter((email) => email.length > 0);

const rolDe_ = (email) => {
  const objetivo = texto_(email).toLowerCase();
  const usuario = usuariosActivos_().find((u) => texto_(u.email).toLowerCase() === objetivo);
  return usuario ? usuario.rol : '';
};

const sesionEsAdmin_ = () => esRolAdmin_(rolDe_(obtenerEmailSesion_()));

// Reciben las incidencias técnicas (F-21): Admin y Soporte (RF-84).
const obtenerEmailsSoporte_ = () => emailsConPermiso_(PERMISO.TECNICO);

// Invitados a los eventos de ocupación (F-13): quien gestiona reservas, no Soporte ni la cuenta Sistema (RF-84).
const obtenerEmailsGestion_ = () => emailsConPermiso_(PERMISO.GESTION);

// Comprueba el acceso al cargar la app y lo deja registrado (RF-02..RF-04).
const verificarAcceso_ = (email) => {
  if (!email) {
    registrarLog_('ACCESO_DENEGADO', '', 'Sesión sin email identificable');
    return { autorizado: false, email: '' };
  }
  if (!esUsuarioAutorizado_(email)) {
    registrarLog_('ACCESO_DENEGADO', email, 'Email no autorizado');
    return { autorizado: false, email };
  }
  registrarLog_('ACCESO', email, 'Acceso concedido');
  return { autorizado: true, email };
};

// Comprobación silenciosa para endpoints (el acceso ya quedó registrado en doGet).
const sesionAutorizada_ = () => esUsuarioAutorizado_(obtenerEmailSesion_());

const conBloqueo_ = (accion) => {
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(ESPERA_BLOQUEO_MS);
  try {
    return accion();
  } finally {
    bloqueo.releaseLock();
  }
};

// Plantilla única de todo endpoint (REF-03): autorización → [bloqueo] → acción; cualquier error se registra
// y el usuario recibe un mensaje claro. `contexto` no debe incluir datos personales (RNF-34).
const ejecutarEndpoint_ = (nombre, contexto, accion, { bloqueo = false, errorUsuario = 'No se pudo completar la operación. Inténtalo de nuevo.' } = {}) => {
  try {
    if (!sesionAutorizada_()) return { success: false, error: MENSAJE_NO_AUTORIZADO };
    return bloqueo ? conBloqueo_(accion) : accion();
  } catch (error) {
    registrarError_(nombre, error, contexto);
    return { success: false, error: errorUsuario };
  }
};

// Ejecución "directa": editor, menú del Sheet o trigger, no delegada a través de la Web App.
// En la Web App (USER_DEPLOYING) el usuario efectivo es la cuenta operativa y el activo es quien navega.
const esEjecucionDirecta_ = () => {
  const activo = obtenerEmailSesion_().toLowerCase();
  const efectivo = texto_(Session.getEffectiveUser().getEmail()).toLowerCase();
  return activo !== '' && activo === efectivo;
};

// Un trigger del proyecto entrega un evento con su triggerUid, que nadie de fuera puede conocer.
const esDisparadorDelProyecto_ = (evento) =>
  Boolean(evento && evento.triggerUid) &&
  ScriptApp.getProjectTriggers().some((t) => t.getUniqueId() === evento.triggerUid);

// Protege las entradas del sistema que deben seguir siendo públicas (triggers, menú, utilidades de editor).
const ejecutarTareaDelSistema_ = (nombre, evento, accion) => {
  if (!esDisparadorDelProyecto_(evento) && !esEjecucionDirecta_()) {
    registrarLog_('SISTEMA_DENEGADO', obtenerEmailSesion_(), nombre);
    return { success: false, error: 'Esta tarea solo la puede ejecutar el sistema o la cuenta operativa desde el editor.' };
  }
  return accion();
};
