// Dobles en memoria de los servicios de Google Apps Script usados por KAF Rent.
// Cumplen el mismo contrato que el servicio real en lo que usa el código (Liskov, CLAUDE.md §3.1).

const vacio = (v) => v === '' || v === null || v === undefined;

// ---------- Sheets ----------
class RangoFalso {
  constructor(hoja, fila, columna, numFilas, numColumnas) {
    Object.assign(this, { hoja, fila, columna, numFilas, numColumnas });
  }

  getValues() {
    const valores = [];
    for (let f = 0; f < this.numFilas; f++) {
      const origen = this.hoja.datos[this.fila - 1 + f] || [];
      const fila = [];
      for (let c = 0; c < this.numColumnas; c++) {
        const v = origen[this.columna - 1 + c];
        fila.push(vacio(v) ? '' : v);
      }
      valores.push(fila);
    }
    return valores;
  }

  getValue() { return this.getValues()[0][0]; }

  setValues(valores) {
    if (valores.length !== this.numFilas || valores.some((f) => f.length !== this.numColumnas)) {
      throw new Error(`Las dimensiones de los datos (${valores.length}x${valores[0] && valores[0].length}) no coinciden con el rango (${this.numFilas}x${this.numColumnas}).`);
    }
    this.hoja.contarEscritura();
    valores.forEach((fila, f) => fila.forEach((v, c) => this.hoja.escribir(this.fila + f, this.columna + c, v)));
    return this;
  }

  setValue(v) { this.hoja.contarEscritura(); this.hoja.escribir(this.fila, this.columna, v); return this; }

  clearContent() {
    this.hoja.contarEscritura();
    for (let f = 0; f < this.numFilas; f++) {
      for (let c = 0; c < this.numColumnas; c++) this.hoja.escribir(this.fila + f, this.columna + c, '');
    }
    return this;
  }

  setFontWeight() { return this; }
}

class HojaFalsa {
  constructor(nombre, datos = []) {
    this.nombre = nombre;
    this.datos = datos.map((f) => f.slice());
    this.escrituras = 0;
    this.fallarEnEscritura = null; // número de escritura (1-based) que lanzará error, para probar atomicidad
  }

  contarEscritura() {
    this.escrituras += 1;
    if (this.fallarEnEscritura === this.escrituras) throw new Error(`Fallo simulado en la escritura ${this.escrituras} de ${this.nombre}`);
  }

  escribir(fila, columna, v) {
    while (this.datos.length < fila) this.datos.push([]);
    const f = this.datos[fila - 1];
    while (f.length < columna) f.push('');
    f[columna - 1] = v;
  }

  getName() { return this.nombre; }

  getLastRow() {
    for (let i = this.datos.length - 1; i >= 0; i--) {
      if (this.datos[i].some((v) => !vacio(v))) return i + 1;
    }
    return 0;
  }

  getLastColumn() {
    return this.datos.reduce((max, f) => {
      let ultimo = 0;
      f.forEach((v, i) => { if (!vacio(v)) ultimo = i + 1; });
      return Math.max(max, ultimo);
    }, 0);
  }

  getRange(fila, columna, numFilas = 1, numColumnas = 1) {
    if (fila < 1 || columna < 1 || numFilas < 1 || numColumnas < 1) {
      throw new Error(`Rango no válido (${fila}, ${columna}, ${numFilas}, ${numColumnas})`);
    }
    return new RangoFalso(this, fila, columna, numFilas, numColumnas);
  }

  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }

  appendRow(valores) { this.contarEscritura(); const fila = this.getLastRow() + 1; valores.forEach((v, c) => this.escribir(fila, c + 1, v)); return this; }

  clearContents() { this.contarEscritura(); this.datos = this.datos.map((f) => f.map(() => '')); return this; }

  setFrozenRows() { return this; }

  // Ayudas de test (no existen en Apps Script)
  filas() { return this.datos.slice(1, this.getLastRow()); }
  cabeceras() { return this.datos[0] || []; }
  registros() {
    const cab = this.cabeceras();
    return this.filas().map((f) => Object.fromEntries(cab.map((c, i) => [c, vacio(f[i]) ? '' : f[i]])));
  }
}

class LibroFalso {
  constructor() { this.hojas = []; }
  getSheetByName(nombre) { return this.hojas.find((h) => h.nombre === nombre) || null; }
  insertSheet(nombre) { const h = new HojaFalsa(nombre); this.hojas.push(h); return h; }
  getSheets() { return this.hojas.slice(); }
  deleteSheet(h) { this.hojas = this.hojas.filter((x) => x !== h); }
  getId() { return 'ID-LIBRO'; }
  getSpreadsheetTimeZone() { return 'Europe/Madrid'; }
}

// ---------- Drive ----------
let contadorIds = 0;
const nuevoId = (p) => `${p}-${++contadorIds}`;
const iterador = (lista) => { let i = 0; return { hasNext: () => i < lista.length, next: () => lista[i++] }; };

class FicheroFalso {
  constructor(nombre, creado = new Date(), contenido = null) {
    Object.assign(this, { id: nuevoId('F'), nombre, creado, contenido, papelera: false });
  }
  getId() { return this.id; }
  getName() { return this.nombre; }
  getUrl() { return `https://drive.test/${this.id}`; }
  getDateCreated() { return this.creado; }
  setTrashed(v) { this.papelera = v; return this; }
  isTrashed() { return this.papelera; }
  makeCopy(nombre, carpeta) { const f = new FicheroFalso(nombre); carpeta.ficheros.push(f); return f; }
  getOwner() { return { getEmail: () => this.propietario || '' }; }
}

class CarpetaFalsa {
  constructor(nombre) { Object.assign(this, { id: nuevoId('C'), nombre, ficheros: [], carpetas: [], papelera: false }); }
  getId() { return this.id; }
  getName() { return this.nombre; }
  getFoldersByName(n) { return iterador(this.carpetas.filter((c) => c.nombre === n && !c.papelera)); }
  getFolders() { return iterador(this.carpetas.filter((c) => !c.papelera)); }
  getFiles() { return iterador(this.ficheros.slice()); }
  createFolder(n) { const c = new CarpetaFalsa(n); this.carpetas.push(c); return c; }
  createFile(blob) { const f = new FicheroFalso(blob.nombre, new Date(), blob); this.ficheros.push(f); return f; }
  setTrashed(v) { this.papelera = v; return this; }
  isTrashed() { return this.papelera; }
}

class DriveFalso {
  constructor(propietarioLibro) { this.carpetas = new Map(); this.ficheros = new Map(); this.propietarioLibro = propietarioLibro; }
  registrarCarpeta(c) { this.carpetas.set(c.id, c); return c; }
  getFolderById(id) {
    const buscar = (lista) => {
      for (const c of lista) { if (c.id === id) return c; const r = buscar(c.carpetas); if (r) return r; }
      return null;
    };
    const c = buscar([...this.carpetas.values()]);
    if (!c) throw new Error(`Carpeta ${id} no encontrada`);
    return c;
  }
  getFileById(id) {
    if (!this.ficheros.has(id)) this.ficheros.set(id, Object.assign(new FicheroFalso('BBDD_KAF_Rent'), { propietario: this.propietarioLibro }));
    return this.ficheros.get(id);
  }
}

// ---------- Calendar ----------
class EventoFalso {
  constructor(cal, titulo, inicio, fin, opciones) {
    Object.assign(this, { cal, id: nuevoId('EV'), titulo, inicio, fin, opciones, color: null });
  }
  getId() { return this.id; }
  getTitle() { return this.titulo; }
  setTitle(t) { this.titulo = t; return this; }
  setColor(c) { this.color = c; return this; }
  setTime(inicio, fin) { Object.assign(this, { inicio, fin }); return this; }
  deleteEvent() { this.cal.eventos = this.cal.eventos.filter((e) => e !== this); }
}

class CalendarioFalso {
  // `suscrito`: si el calendario compartido está en la lista del usuario (getCalendarById devuelve null si no, B-14).
  constructor() { this.eventos = []; this.fallar = false; this.suscrito = true; this.opcionesSuscripcion = null; }
  createEvent(titulo, inicio, fin, opciones) {
    if (this.fallar) throw new Error('Calendar no disponible (simulado)');
    const e = new EventoFalso(this, titulo, inicio, fin, opciones);
    this.eventos.push(e);
    return e;
  }
  getEventById(id) { return this.eventos.find((e) => e.id === id) || null; }
}

// ---------- Entorno completo ----------
const crearServicios = ({ usuarioActivo = 'ana@test.com', usuarioEfectivo = 'operacion@test.com' } = {}) => {
  const libro = new LibroFalso();
  const drive = new DriveFalso(usuarioEfectivo); // El libro es de la cuenta operativa.
  const calendario = new CalendarioFalso();
  const correos = [];
  const alertas = [];
  const disparadores = [];
  const sesion = { activo: usuarioActivo, efectivo: usuarioEfectivo };
  const bloqueos = { adquiridos: 0, liberados: 0 };
  // SES.Hospedajes (S27): respuestas simuladas en orden ({ cuerpo, http } o { errorRed }) y peticiones recibidas.
  const ses = { respuestas: [], peticiones: [] };
  const propiedades = {};
  const librosExternos = {};

  const servicios = {
    SpreadsheetApp: {
      getActive: () => libro, getActiveSpreadsheet: () => libro,
      getUi: () => ({ createMenu: () => ({ addItem() { return this; }, addToUi() {} }), alert: (mensaje) => { alertas.push(mensaje); } }),
      openById: (id) => { if (!librosExternos[id]) throw new Error(`No se encuentra el documento ${id} (simulado)`); return librosExternos[id]; },
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (propiedades[k] === undefined ? null : propiedades[k]) }) },
    UrlFetchApp: {
      fetch: (url, opciones) => {
        ses.peticiones.push({ url, opciones });
        const r = ses.respuestas.shift();
        if (!r) throw new Error('UrlFetchApp: sin respuesta simulada');
        if (r.errorRed) throw new Error(r.errorRed);
        return { getResponseCode: () => r.http || 200, getContentText: () => r.cuerpo || '' };
      },
    },
    DriveApp: drive,
    CalendarApp: {
      EventColor: { PALE_BLUE: '1', PALE_GREEN: '2', MAUVE: '3', PALE_RED: '4', YELLOW: '5', ORANGE: '6', CYAN: '7', GRAY: '8', BLUE: '9', GREEN: '10', RED: '11' },
      getDefaultCalendar: () => calendario,
      getCalendarById: (id) => (id === 'CAL-GRUPO' && calendario.suscrito ? calendario : null),
      subscribeToCalendar: (id, opciones) => {
        if (id !== 'CAL-GRUPO') throw new Error(`Sin acceso al calendario ${id} (simulado)`);
        Object.assign(calendario, { suscrito: true, opcionesSuscripcion: { ...opciones } });
        return calendario;
      },
    },
    MailApp: {
      sendEmail: (...args) => {
        if (servicios.MailApp.fallar) throw new Error('Mail no disponible (simulado)');
        correos.push(typeof args[0] === 'object' ? args[0] : { to: args[0], subject: args[1], body: args[2] });
      },
      fallar: false,
    },
    LockService: { getScriptLock: () => ({ waitLock: () => { bloqueos.adquiridos += 1; }, releaseLock: () => { bloqueos.liberados += 1; } }) },
    Session: {
      getActiveUser: () => ({ getEmail: () => sesion.activo }),
      getEffectiveUser: () => ({ getEmail: () => sesion.efectivo }),
    },
    Utilities: {
      formatDate: (fecha, _tz, patron) => {
        const d = fecha instanceof Date ? fecha : new Date(fecha);
        const p = (n, l = 2) => String(n).padStart(l, '0');
        return patron
          .replace('yyyy', d.getFullYear()).replace('yy', p(d.getFullYear() % 100))
          .replace('MM', p(d.getMonth() + 1)).replace('dd', p(d.getDate()))
          .replace('HH', p(d.getHours())).replace('mm', p(d.getMinutes()));
      },
      base64Decode: (s) => [...Buffer.from(s, 'base64')],
      newBlob: (bytes, tipoMime, nombre) => ({ bytes, tipoMime, nombre }),
      zip: (blobs) => ({ getBytes: () => [...Buffer.from(JSON.stringify(blobs.map((b) => [b.nombre, String(b.bytes)])))] }),
      base64Encode: (datos) => Buffer.from(Array.isArray(datos) ? datos : String(datos)).toString('base64'),
    },
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/APP/exec' }),
      getProjectTriggers: () => disparadores.slice(),
      deleteTrigger: (t) => { const i = disparadores.indexOf(t); if (i >= 0) disparadores.splice(i, 1); },
      newTrigger: (funcion) => {
        const t = { funcion, uid: nuevoId('TR'), getUniqueId() { return this.uid; }, getHandlerFunction() { return this.funcion; } };
        const constructor = {
          timeBased: () => constructor, atHour: () => constructor, everyDays: () => constructor, onMonthDay: () => constructor,
          everyMinutes: (m) => { t.minutos = m; return constructor; },
          forSpreadsheet: (id) => { t.origen = id; return constructor; }, onFormSubmit: () => { t.alEnviarForm = true; return constructor; },
          create: () => { disparadores.push(t); return t; },
        };
        return constructor;
      },
    },
    HtmlService: {
      createTemplateFromFile: (nombre) => ({ nombre, evaluate() {
        // HtmlService rechaza una URL de favicon no válida: el doble lo simula con 'url-invalida'.
        const s = { vista: nombre, datos: this.datos, setFaviconUrl(url) { if (url === 'url-invalida') throw new Error('Invalid argument: faviconUrl'); this.icono = url; return this; } };
        return { setTitle: () => ({ addMetaTag: () => s }) };
      } }),
      createHtmlOutputFromFile: (nombre) => ({ getContent: () => `<!-- ${nombre} -->` }),
    },
    console,
  };

  return { servicios, libro, drive, calendario, correos, alertas, disparadores, sesion, bloqueos, ses, propiedades, librosExternos, CarpetaFalsa, FicheroFalso, LibroFalso, HojaFalsa };
};

module.exports = { crearServicios, HojaFalsa, CarpetaFalsa, FicheroFalso };
