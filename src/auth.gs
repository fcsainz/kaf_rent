// Verificación de usuario autorizado y registro de accesos. Ver ADR-0001.

const COL_USUARIO_EMAIL  = 0;
const COL_USUARIO_ACTIVO = 1;

// Email de la sesión activa. La Web App se ejecuta como el usuario que accede (executeAs: USER_ACCESSING).
const obtenerEmailSesion = () => {
  try {
    return (Session.getActiveUser().getEmail() || '').trim();
  } catch (error) {
    registrarError('obtenerEmailSesion', error, {});
    return '';
  }
};

// Devuelve { autorizado: boolean, email }.
const verificarAcceso = (email) => {
  if (!email) {
    registrarLog('ACCESO_DENEGADO', '', 'Sesión sin email identificable');
    return { autorizado: false, email: '' };
  }
  if (!esUsuarioAutorizado(email)) {
    registrarLog('ACCESO_DENEGADO', email, 'Email no autorizado');
    return { autorizado: false, email };
  }
  registrarLog('ACCESO', email, 'Acceso concedido');
  return { autorizado: true, email };
};

const esUsuarioAutorizado = (email) => {
  try {
    const hoja = obtenerHoja(HOJA_USUARIOS);
    if (!hoja) return false;
    const objetivo = email.toLowerCase();
    return obtenerFilas(hoja).some((fila) =>
      String(fila[COL_USUARIO_EMAIL]).trim().toLowerCase() === objetivo &&
      esVerdadero(fila[COL_USUARIO_ACTIVO])
    );
  } catch (error) {
    registrarError('esUsuarioAutorizado', error, { email });
    return false;
  }
};
