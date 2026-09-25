// Capa: INFRAESTRUCTURA — tareas de mantenimiento: copia del Sheet, purga de Logs/Errores y poda de vídeos (ADR-0013, ADR-0014).

const NIVEL_CARPETA_RESERVA = 2; // Vídeos (0) / espacio (1) / reserva (2)

// Toca copia si no hay ninguna o la última tiene al menos `cadaDias` días. Pura.
const tocaCopia_ = (fechaUltimaCopia, cadaDias, ahora) =>
  !fechaUltimaCopia || ahora.getTime() - fechaUltimaCopia.getTime() >= cadaDias * MS_POR_DIA;

const listarFicheros_ = (carpeta) => {
  const ficheros = [];
  const it = carpeta.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed()) ficheros.push(f);
  }
  return ficheros;
};

const listarSubcarpetas_ = (carpeta) => {
  const carpetas = [];
  const it = carpeta.getFolders();
  while (it.hasNext()) {
    const c = it.next();
    if (!c.isTrashed()) carpetas.push(c);
  }
  return carpetas;
};

const copiaSeguridadSheet_ = (ahora) => {
  const carpeta = carpetaPorId_('Carpeta_Backups_Id');
  const copias = listarFicheros_(carpeta).sort((a, b) => b.getDateCreated() - a.getDateCreated());
  if (!tocaCopia_(copias[0] ? copias[0].getDateCreated() : null, obtenerConfigNumero_('Backup_Cada_Dias', 2), ahora)) return;
  const nombre = `BBDD_KAF_Rent — backup ${Utilities.formatDate(ahora, zonaHoraria_(), 'yyyy-MM-dd')}`;
  DriveApp.getFileById(obtenerSpreadsheet_().getId()).makeCopy(nombre, carpeta);
  listarFicheros_(carpeta)
    .sort((a, b) => b.getDateCreated() - a.getDateCreated())
    .slice(obtenerConfigNumero_('Backup_Max_Copias', 15))
    .forEach((f) => f.setTrashed(true));
};

// Elimina las filas cuya fecha supera el periodo de retención, reescribiendo sin dejar la hoja vacía.
const purgarPorAntiguedad_ = (nombreHoja, dias, ahora) => {
  const tabla = leerTabla_(nombreHoja);
  const limite = ahora.getTime() - dias * MS_POR_DIA;
  const conservar = tabla.entradas.filter((e) => aFecha_(e.registro.fecha).getTime() >= limite);
  if (conservar.length === tabla.entradas.length) return;
  reescribirFilas_(tabla, conservar.map((e) => e.valores));
};

// Manda a la papelera los vídeos antiguos y las carpetas de reserva que queden vacías por ello (B-07).
const podarCarpeta_ = (carpeta, limite, nivel) => {
  let borrados = 0;
  listarFicheros_(carpeta)
    .filter((f) => f.getDateCreated().getTime() < limite)
    .forEach((f) => { f.setTrashed(true); borrados += 1; });
  listarSubcarpetas_(carpeta).forEach((sub) => podarCarpeta_(sub, limite, nivel + 1));
  const vacia = listarFicheros_(carpeta).length === 0 && listarSubcarpetas_(carpeta).length === 0;
  if (nivel === NIVEL_CARPETA_RESERVA && borrados > 0 && vacia) carpeta.setTrashed(true);
};

const purgarVideosAntiguos_ = (ahora) => {
  if (!obtenerConfig_('Carpeta_Videos_Id')) return;
  const limite = ahora.getTime() - obtenerConfigNumero_('Retencion_Videos_Dias', 180) * MS_POR_DIA;
  podarCarpeta_(carpetaPorId_('Carpeta_Videos_Id'), limite, 0);
};
