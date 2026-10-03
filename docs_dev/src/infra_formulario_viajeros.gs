// Capa: INFRAESTRUCTURA — Sheet de respuestas del Google Form de viajeros (ADR-0018): se lee sin copiar los datos
// y se anota el resultado de la comunicación en las columnas que antes se rellenaban a mano.

// Las columnas que ya existían son del parte de viajeros (PV); la reserva (RH) tiene las suyas (usuario, 2026-10-02).
const COLUMNAS_RESULTADO_FORM = {
  PV: { comunicado: 'Comunicados', usuario: 'Usuario', tipo: 'Tipo_Comunicación', fecha: 'Fecha', codigo: 'Código de comunicación', lote: 'Lote' },
  RH: { comunicado: 'Reserva comunicada', lote: 'Lote reserva', codigo: 'Código comunicación reserva', fecha: 'Fecha comunicación reserva', usuario: 'Usuario comunicación reserva' },
  AN: { comunicado: 'Anulación SES', lote: 'Lote anulación', fecha: 'Fecha anulación', usuario: 'Usuario anulación' }, // ADR-0022
};
const TIPO_COMUNICACION_AUTOMATICA = 'Automática'; // las anotadas a mano dicen "Manual"
const HOJA_FORM_VIAJEROS_DEFECTO = 'Respuestas de formulario 1';

const hojaFormViajeros_ = () => {
  const id = texto_(obtenerConfig_('Sheet_Viajeros_Id'));
  if (!id) throw new Error('Falta Sheet_Viajeros_Id en Config (ID del Sheet de respuestas del Form de viajeros).');
  const nombre = texto_(obtenerConfig_('Sheet_Viajeros_Hoja', HOJA_FORM_VIAJEROS_DEFECTO));
  const hoja = SpreadsheetApp.openById(id).getSheetByName(nombre);
  if (!hoja) throw new Error(`El Sheet del Form de viajeros no tiene la pestaña "${nombre}" (Config.Sheet_Viajeros_Hoja).`);
  return hoja;
};

// Respuestas reales (con marca temporal: la casilla "Comunicados" está copiada en filas sin respuesta), leídas por título.
const leerRespuestasFormViajeros_ = () => {
  const [cabeceras, ...filas] = hojaFormViajeros_().getDataRange().getValues();
  const lectura = columnasFormViajeros_(cabeceras);
  if (!lectura.valido) throw new Error(lectura.error);
  return filas
    .map((fila, i) => respuestaDesdeFila_(fila, lectura.columnas, i + 2))
    .filter((r) => texto_(r.marcaTemporal) !== '');
};

// Valor de cada columna de resultado; las que no tiene un trámite no se escriben.
const valoresResultadoForm_ = ({ usuario, fecha, codigo, lote }) =>
  ({ comunicado: true, usuario, tipo: TIPO_COMUNICACION_AUTOMATICA, fecha, codigo, lote });

// Marca las filas como comunicadas en una sola lectura y una sola escritura del bloque de filas afectado.
const anotarComunicacionEnForm_ = (filas, tipo, resultado) => {
  if (filas.length === 0) return;
  const hoja = hojaFormViajeros_();
  const cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map((c) => texto_(c));
  const titulos = COLUMNAS_RESULTADO_FORM[tipo];
  const columnas = Object.fromEntries(Object.entries(titulos).map(([campo, titulo]) => [campo, cabeceras.indexOf(titulo)]));
  const faltan = Object.entries(columnas).filter(([, i]) => i < 0).map(([campo]) => titulos[campo]);
  if (faltan.length > 0) throw new Error(`Al Sheet del Form le faltan las columnas ${faltan.join(', ')}.`);
  const valores = valoresResultadoForm_(resultado);
  const primera = Math.min(...filas);
  const rango = hoja.getRange(primera, 1, Math.max(...filas) - primera + 1, cabeceras.length);
  const bloque = rango.getValues().map((fila, i) => {
    if (!filas.includes(primera + i)) return fila;
    const nueva = fila.slice();
    Object.entries(columnas).forEach(([campo, indice]) => { nueva[indice] = valores[campo]; });
    return nueva;
  });
  rango.setValues(bloque);
};

// F-28: al corregir el municipio en la validación se sobrescriben municipio y provincia del huésped con los nombres
// del INE (decisión del usuario, 2026-10-02), en las columnas del adulto o del menor según quién sea.
const corregirMunicipioEnForm_ = (fila, esAdulto, { municipio, provincia }) => {
  const hoja = hojaFormViajeros_();
  const cabeceras = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  const lectura = columnasFormViajeros_(cabeceras);
  if (!lectura.valido) throw new Error(lectura.error);
  const columna = (campo) => lectura.columnas[esAdulto ? campo : `${campo}${SUFIJO_MENOR}`][0];
  const rango = hoja.getRange(fila, 1, 1, cabeceras.length);
  const valores = rango.getValues()[0].slice();
  valores[columna('municipio')] = municipio;
  valores[columna('provincia')] = provincia;
  rango.setValues([valores]);
};
