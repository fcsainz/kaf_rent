// Capa: INFRAESTRUCTURA — utilidades comunes: tablas por campo (lectura/escritura en bloque), fechas, formato,
// escape de HTML y registro de logs/errores. Solo la usan otros ficheros infra_* y api_* (y fechas puras, el dominio).

const MS_POR_DIA = 24 * 60 * 60 * 1000;

let cacheLibro_ = null;

const obtenerSpreadsheet_ = () => {
  if (!cacheLibro_) cacheLibro_ = SpreadsheetApp.getActive();
  return cacheLibro_;
};

const obtenerHoja_ = (nombre) => obtenerSpreadsheet_().getSheetByName(nombre);

// ---------- Tablas: lectura en bloque y acceso por campo lógico (REF-02) ----------

// Índice de cada campo: la columna cuya cabecera coincide. Si falta, error claro: nunca se lee ni se escribe
// en otra columna por posición, porque las hojas tienen datos reales y se editan a mano (B-16, D-19).
const mapaColumnas_ = (campos, cabecerasHoja, nombreHoja) => Object.keys(campos).reduce((mapa, campo) => {
  const indice = cabecerasHoja.indexOf(campos[campo]);
  if (indice < 0) {
    throw new Error(`Falta la columna "${campos[campo]}" en la hoja "${nombreHoja}". Ejecuta KAF Rent → Inicializar / reparar hojas.`);
  }
  mapa[campo] = indice;
  return mapa;
}, {});

// Cabeceras del esquema que no están en la hoja, en el orden del esquema.
const columnasQueFaltan_ = (cabecerasHoja, cabecerasEsquema) => cabecerasEsquema.filter((c) => !cabecerasHoja.includes(c));

const cabecerasDe_ = (hoja) => (hoja.getLastColumn() > 0
  ? hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map((c) => String(c).trim())
  : []);

const registroDesdeFila_ = (fila, columnas) =>
  Object.keys(columnas).reduce((registro, campo) => {
    const valor = fila[columnas[campo]];
    registro[campo] = valor === undefined ? '' : valor;
    return registro;
  }, {});

// Construye la fila completa partiendo de `base` (conserva columnas ajenas al esquema).
const filaDesdeRegistro_ = (registro, columnas, numColumnas, base = []) => {
  const fila = Array.from({ length: numColumnas }, (_, i) => (base[i] === undefined ? '' : base[i]));
  Object.keys(registro).forEach((campo) => {
    if (campo in columnas) fila[columnas[campo]] = registro[campo];
  });
  return fila;
};

const filaVacia_ = (fila) => fila.every((v) => v === '' || v === null || v === undefined);

// Lee la hoja entera en una sola llamada. Cada entrada conserva su fila del Sheet para escribirla después.
const leerTabla_ = (nombreHoja) => {
  const { campos } = definicionHoja_(nombreHoja);
  const hoja = obtenerHoja_(nombreHoja);
  if (!hoja) throw new Error(`Falta la hoja "${nombreHoja}". Ejecuta KAF Rent → Inicializar / reparar hojas.`);
  const ultimaFila = hoja.getLastRow();
  const numColumnas = Math.max(hoja.getLastColumn(), Object.keys(campos).length);
  const valores = ultimaFila > 0 ? hoja.getRange(1, 1, ultimaFila, numColumnas).getValues() : [[]];
  const columnas = mapaColumnas_(campos, valores[0].map((c) => String(c).trim()), nombreHoja);
  const entradas = valores.slice(1)
    .map((fila, i) => ({ filaSheet: i + 2, valores: fila, registro: registroDesdeFila_(fila, columnas) }))
    .filter((entrada) => !filaVacia_(entrada.valores));
  return { hoja, columnas, numColumnas, entradas };
};

const registrosDe_ = (nombreHoja) => leerTabla_(nombreHoja).entradas.map((e) => e.registro);

const anadirRegistros_ = (tabla, registros) => {
  if (registros.length === 0) return;
  const filas = registros.map((r) => filaDesdeRegistro_(r, tabla.columnas, tabla.numColumnas));
  tabla.hoja.getRange(tabla.hoja.getLastRow() + 1, 1, filas.length, tabla.numColumnas).setValues(filas);
};

// Añade un registro y devuelve su número de fila en el Sheet.
const anadirRegistro_ = (tabla, registro) => {
  anadirRegistros_(tabla, [registro]);
  return tabla.hoja.getLastRow();
};

const actualizarRegistro_ = (tabla, entrada, registro) => {
  const fila = filaDesdeRegistro_(registro, tabla.columnas, tabla.numColumnas, entrada.valores);
  tabla.hoja.getRange(entrada.filaSheet, 1, 1, tabla.numColumnas).setValues([fila]);
};

const actualizarCampo_ = (tabla, filaSheet, campo, valor) =>
  tabla.hoja.getRange(filaSheet, tabla.columnas[campo] + 1).setValue(valor);

// Sustituye todas las filas de datos. Escribe primero y limpia después el sobrante:
// si algo falla a mitad, nunca queda la hoja vacía (B-03, RNF-14).
const reescribirFilas_ = (tabla, filas) => {
  const previas = Math.max(0, tabla.hoja.getLastRow() - 1);
  const ajustadas = filas.map((f) => Array.from({ length: tabla.numColumnas }, (_, i) => (f[i] === undefined ? '' : f[i])));
  if (ajustadas.length > 0) tabla.hoja.getRange(2, 1, ajustadas.length, tabla.numColumnas).setValues(ajustadas);
  if (previas > ajustadas.length) {
    tabla.hoja.getRange(2 + ajustadas.length, 1, previas - ajustadas.length, tabla.numColumnas).clearContent();
  }
};

const reescribirRegistros_ = (tabla, registros) =>
  reescribirFilas_(tabla, registros.map((r) => filaDesdeRegistro_(r, tabla.columnas, tabla.numColumnas)));

// ---------- Valores y fechas ----------

// Combina 'YYYY-MM-DD' y 'HH:MM' en una fecha local. Devuelve null si la fecha no es válida.
const combinarFechaHora_ = (fechaISO, horaHHMM) => {
  if (!fechaISO) return null;
  const [anyo, mes, dia] = String(fechaISO).split('-').map(Number);
  const [hora, minuto] = String(horaHHMM || '00:00').split(':').map(Number);
  if (!anyo || !mes || !dia) return null;
  return new Date(anyo, mes - 1, dia, hora || 0, minuto || 0, 0);
};

const inicioDelDia_ = (fecha) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0);

const aFecha_ = (valor) => (valor instanceof Date ? valor : new Date(valor));

const esFechaValida_ = (valor) => valor instanceof Date && !isNaN(valor.getTime());

// Normaliza "Sí"/"true"/"x"/1 a booleano (celdas editadas a mano).
const esVerdadero_ = (valor) => {
  if (valor === true) return true;
  const v = String(valor).trim().toLowerCase();
  return v === 'sí' || v === 'si' || v === 'true' || v === 'x' || v === '1';
};

const texto_ = (valor) => (valor === null || valor === undefined ? '' : String(valor).trim());

const numero_ = (valor) => Number(valor) || 0;

// ---------- Formato ----------

const zonaHoraria_ = () => obtenerSpreadsheet_().getSpreadsheetTimeZone();

const formatearFechaHora_ = (fecha) => Utilities.formatDate(aFecha_(fecha), zonaHoraria_(), 'dd/MM/yyyy HH:mm');

// F-26: formato corto para tablas en móvil (solo visualización).
const formatearFechaHoraCorta_ = (fecha) => Utilities.formatDate(aFecha_(fecha), zonaHoraria_(), 'dd/MM/yy HH:mm');

const fechaCorta_ = (fecha) => Utilities.formatDate(aFecha_(fecha), zonaHoraria_(), 'ddMMyy');

// Formato español: "2.840,50 €" (sin depender de Intl, que en Apps Script no agrupa los miles con 4 cifras).
const formatearImporte_ = (importe) => {
  const [entera, decimales] = Math.abs(numero_(importe)).toFixed(2).split('.');
  return `${numero_(importe) < 0 ? '−' : ''}${entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimales} €`;
};

// Todo dato que acabe dentro de HTML pasa por aquí (RNF-26).
const escaparHtml_ = (valor) => String(valor === null || valor === undefined ? '' : valor)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---------- Registro (nunca relanza: un fallo al registrar no puede tumbar la operación) ----------

const registrarLog_ = (tipo, email, detalle) => {
  try {
    const hoja = obtenerHoja_(HOJA_LOGS);
    if (hoja) hoja.appendRow([new Date(), tipo, email, detalle]);
  } catch (error) {
    // Sin destino posible para el error: se ignora a propósito.
  }
};

const registrarError_ = (funcion, error, contexto) => {
  try {
    const hoja = obtenerHoja_(HOJA_ERRORES);
    const mensaje = error && error.message ? error.message : String(error);
    const pila = error && error.stack ? { pila: String(error.stack) } : {};
    if (hoja) hoja.appendRow([new Date(), funcion, mensaje, JSON.stringify({ ...(contexto || {}), ...pila })]);
  } catch (e) {
    // Sin destino posible para el error: se ignora a propósito.
  }
};

// Contexto de un error registrado; {} si no es JSON válido (filas antiguas o editadas a mano).
const contextoDeError_ = (registro) => {
  try {
    return JSON.parse(texto_(registro.contexto) || '{}');
  } catch (error) {
    return {};
  }
};

// Errores registrados de una reserva (por su ID interno), los más recientes primero.
const erroresDeReserva_ = (id) => registrosDe_(HOJA_ERRORES)
  .filter((registro) => contextoDeError_(registro).id === id)
  .reverse();
