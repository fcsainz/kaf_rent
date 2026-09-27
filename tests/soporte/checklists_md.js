// Lee docs_work/doc_check/checklists-check-in-out.md (contenido aprobado de las checklists) y lo convierte en las
// filas de Catálogo_Checklist. Lo usa el test que comprueba que la semilla del código coincide con el documento.
const fs = require('fs');
const path = require('path');

const RUTA_MD = path.join(__dirname, '..', '..', 'docs_work', 'doc_check', 'checklists-check-in-out.md');

const ESPACIOS = { Exterior: 'Piscina / Jardín', Interior: 'Habitación Interior' };
const PREFIJO_ESPACIO = { Exterior: 'EXT', Interior: 'INT' };
const PREFIJO_MOMENTO = { 'Check-in': 'IN', 'Check-out': 'OUT' };
const SERVICIOS_BBQ = 'Carbón 1 Bolsa|Utensilios BBQ';
// Extras: la palabra clave del punto → servicio del catálogo que lo activa.
const SERVICIO_EXTRA = [
  [/capazo/i, 'Capazo con Hielo'], [/colchoneta/i, 'Colchoneta'], [/pistolas/i, 'Pistolas de agua'],
  [/vajilla/i, 'Vajilla 6 PAX'], [/bolsas de hielo/i, 'Bolsa Hielo 2 Kg'], [/toallas/i, 'Toalla de Piscina'],
];
const CONDICIONES = [[/3 días o menos/i, 'Siguiente_Pronto'], [/después/i, 'Siguiente_Lejos']];

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const limpiarPunto = (t) => t.replace(/\*Observaciones\.\*/, '').replace(/\.\s*$/, '').trim();

const tipoDe = (texto) => {
  if (texto.startsWith('📅')) return 'Fecha';
  if (/^vídeo de/i.test(texto)) return 'Video';
  if (/^fotos de desperfectos/i.test(texto)) return 'Foto';
  return 'Casilla';
};

const textoPunto = (crudo) => capitalizar(crudo.replace(/^📅\s*/, '').replace(/\s*\(se elige[^)]*\)/, '').trim());

const serviciosDe = (marca, punto) => {
  if (marca === '🔥') return SERVICIOS_BBQ;
  if (marca === '➕') return (SERVICIO_EXTRA.find(([re]) => re.test(punto)) || [null, ''])[1];
  return '';
};

const puntosDeLinea = (lista) => lista.split(' · ').map(limpiarPunto).filter(Boolean);

const leerChecklistsMd = (ruta = RUTA_MD) => {
  const filas = [];
  let actual = null;
  let bloque = null;
  let marcaBloque = '';
  const anadir = (crudo, condicion) => {
    actual.contador += 1;
    const punto = textoPunto(crudo);
    filas.push({
      id: `${actual.prefijo}-${String(actual.contador).padStart(2, '0')}`,
      espacio: actual.espacio, momento: actual.momento, bloque, punto, tipo: tipoDe(crudo),
      servicios: serviciosDe(marcaBloque, punto), condicion: condicion || '', pareja: '', orden: actual.contador, activo: 'Sí',
    });
  };
  fs.readFileSync(ruta, 'utf8').split('\n').forEach((linea) => {
    const cabecera = linea.match(/^### (Exterior|Interior) — (Check-in|Check-out)/);
    if (cabecera) {
      const [, zona, momento] = cabecera;
      actual = { espacio: ESPACIOS[zona], momento, prefijo: `${PREFIJO_ESPACIO[zona]}-${PREFIJO_MOMENTO[momento]}`, contador: 0 };
      return;
    }
    if (!actual) return;
    const lineaBloque = linea.match(/^\d+\.\s*(🔥|➕)?\s*\*\*([^*:]+?)(?:\s*\([^)]*\))?:?\*\*(?:\s*\([^)]*\))?(?::)?\s*(.*)$/);
    if (lineaBloque) {
      const [, marca, nombre, resto] = lineaBloque;
      bloque = nombre.replace(/:$/, '').trim();
      marcaBloque = marca || '';
      if (resto && !resto.startsWith('—')) puntosDeLinea(resto).forEach((p) => anadir(p));
      return;
    }
    const variante = linea.match(/^\s+-\s*\*([^*]+):\*\s*(.*)$/);
    if (variante && bloque) {
      const condicion = (CONDICIONES.find(([re]) => re.test(variante[1])) || [null, ''])[1];
      puntosDeLinea(variante[2]).forEach((p) => anadir(p, condicion));
      return;
    }
    if (/^## /.test(linea)) actual = null;
  });
  return filas;
};

module.exports = { leerChecklistsMd };
