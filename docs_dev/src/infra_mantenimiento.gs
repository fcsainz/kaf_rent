// Capa: INFRAESTRUCTURA — tareas de mantenimiento: copia del Sheet, purga de Logs/Errores y poda de vídeos (ADR-0013, ADR-0014, ADR-0016).

const NIVEL_CARPETA_RESERVA = 2; // Vídeos (0) / espacio (1) / reserva (2)
const FORMATO_DIA = 'yyyy-MM-dd';

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

const diaDe_ = (fecha) => Utilities.formatDate(fecha, zonaHoraria_(), FORMATO_DIA);

const copiasDeMasRecienteAMasAntigua_ = (carpeta) =>
  listarFicheros_(carpeta).sort((a, b) => b.getDateCreated() - a.getDateCreated());

// Mínimo 1 por nivel: una clave vacía o a 0 en Config nunca debe mandar todas las copias a la papelera.
const politicaCopias_ = () => ({
  diarias: Math.max(1, obtenerConfigNumero_('Backup_Diarias', 7)),
  semanales: Math.max(1, obtenerConfigNumero_('Backup_Semanales', 4)),
  mensuales: Math.max(1, obtenerConfigNumero_('Backup_Mensuales', 12)),
});

const podarCopias_ = (carpeta) => {
  const copias = copiasDeMasRecienteAMasAntigua_(carpeta);
  const conservar = copiasAConservar_(copias.map((f) => diaDe_(f.getDateCreated())), politicaCopias_());
  copias.forEach((f, i) => { if (!conservar.includes(i)) f.setTrashed(true); });
};

const copiaSeguridadSheet_ = (ahora) => {
  const carpeta = carpetaPorId_('Carpeta_Backups_Id');
  const hoy = diaDe_(ahora);
  const ultima = copiasDeMasRecienteAMasAntigua_(carpeta)[0];
  if (tocaCopia_(ultima ? diaDe_(ultima.getDateCreated()) : null, hoy)) {
    DriveApp.getFileById(obtenerSpreadsheet_().getId()).makeCopy(`BBDD_KAF_Rent — backup ${hoy}`, carpeta);
  }
  podarCopias_(carpeta);
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
