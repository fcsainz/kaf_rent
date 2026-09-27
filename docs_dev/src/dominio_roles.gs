// Capa: DOMINIO — roles de usuario y sus permisos (F-11, RF-84), como funciones PURAS.
// Admin = gestión + técnico. Un rol vacío, antiguo ("Copropietario") o desconocido cuenta como Gestión,
// para que el Sheet en uso siga funcionando sin cambios.

const PERMISO = { GESTION: 'gestion', TECNICO: 'tecnico' };

const PERMISOS_POR_ROL = {
  admin: [PERMISO.GESTION, PERMISO.TECNICO],
  gestion: [PERMISO.GESTION],
  soporte: [PERMISO.TECNICO],
  sistema: [],
};

const ROL_POR_DEFECTO = 'gestion';

// "Gestión" → "gestion": sin mayúsculas, tildes ni espacios sobrantes.
const normalizarRol_ = (valor) => {
  const rol = texto_(valor).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return rol in PERMISOS_POR_ROL ? rol : ROL_POR_DEFECTO;
};

const tienePermiso_ = (rol, permiso) => PERMISOS_POR_ROL[normalizarRol_(rol)].includes(permiso);

const esRolAdmin_ = (rol) => normalizarRol_(rol) === 'admin';
