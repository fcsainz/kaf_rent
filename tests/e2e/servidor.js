// Servidor local de los E2E (T-05): sirve la interfaz real (plantillas de docs_dev/src con sus include) y responde
// a google.script.run ejecutando el código real del servidor sobre los dobles de Google (tests/soporte).
// Nada de esto se despliega. Rutas /__test/* solo existen aquí, para preparar cada escenario.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { crearEntornoConDatos, datosReservaHabitacion } = require('../soporte/gas');
const { CABECERAS_FORM, filaAdulto, filaMenor } = require('../soporte/form_viajeros');

const PUERTO = Number(process.env.PUERTO_E2E) || 4173;
const DIR_SRC = path.join(__dirname, '..', '..', 'docs_dev', 'src');
const USUARIO_POR_DEFECTO = 'ana@test.com';

let entorno = null;
const reiniciar = () => {
  entorno = crearEntornoConDatos({ usuarioActivo: USUARIO_POR_DEFECTO });
  entorno.hoja('Usuarios_Autorizados').appendRow(['admin@test.com', 'Sí', 'Admin']);
};

// F-28: reserva de la Habitación (1 adulto + 1 menor) con sus dos formularios; el del menor con un municipio que no
// está en el INE. Sheet del Form, catálogos y municipios simulados; datos inventados.
const prepararViajeros = () => {
  const config = { Sheet_Viajeros_Id: 'FORM-E2E', Form_Viajeros_Enlace: 'https://docs.google.com/forms/d/e/FORM/viewform?entry.1={codigo}' };
  entorno.hoja('Config').datos.forEach((f) => { if (config[f[0]] !== undefined) f[1] = config[f[0]]; });
  require('vm').runInContext('cacheConfig_ = null;', entorno.ctx);
  entorno.llamar('crearReserva', datosReservaHabitacion({ adultos: '1', menores: '1' }));
  const libro = new entorno.LibroFalso();
  const form = libro.insertSheet('Respuestas de formulario 1');
  [CABECERAS_FORM, filaAdulto(), filaMenor({ 'Municipio del menor': 'Madrid ciudad' })].forEach((f) => form.appendRow(f));
  entorno.librosExternos['FORM-E2E'] = libro;
  [['PAIS', 'ESP', 'España'], ['SEXO', 'M', 'Mujer'], ['SEXO', 'H', 'Hombre'], ['TIPO_DOCUMENTO', 'NIF', 'NIF'], ['TIPO_DOCUMENTO', 'PAS', 'Pasaporte'], ['TIPO_PARENTESCO', 'HJ', 'Hijo/a']]
    .forEach((f) => entorno.hoja('Catálogo_SES').appendRow(f));
  [['Madrid', 'Madrid', '28079'], ['Madrid', 'Majadahonda', '28080'], ['Madrid', 'Alcalá de Henares', '28005']]
    .forEach((f) => entorno.hoja('Municipios_INE').appendRow(f));
};

// ---------- Demo interactiva para validar la interfaz en el navegador (`npm run demo`) ----------
// Datos inventados con reservas pasadas, en curso y futuras de los dos espacios. Solo en local; nada va a Google.
const MS_DIA = 24 * 60 * 60 * 1000;
const enDias = (dias, hora = 12) => { const d = new Date(); d.setDate(d.getDate() + dias); d.setHours(hora, 0, 0, 0); return d; };
const isoEnDias = (dias) => { const d = enDias(dias); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const habitacionDemo = (c) => ({ espacio: 'Habitación Interior', canal: 'Airbnb', comision: '3', horaLlegada: '16:00', horaSalida: '12:00', adultos: '2', menores: '0', importeAlquiler: '120', telefono: '600111222', email: '', servicios: [], ...c });
const piscinaDemo = (c) => ({ espacio: 'Piscina / Jardín', canal: 'Cocopool', comision: '15', horaLlegada: '12:00', horaSalida: '20:00', adultos: '12', menores: '3', importeAlquiler: '240', telefono: '', email: '', servicios: [], ...c });

const fijarCelda = (id, columna, valor) => {
  const hoja = entorno.hoja('Reservas');
  const fila = hoja.registros().findIndex((r) => r.ID_Reserva === id) + 2;
  hoja.getRange(fila, hoja.cabeceras().indexOf(columna) + 1).setValue(valor);
};
const idDe = (nombre) => entorno.hoja('Reservas').registros().find((r) => r.Nombre_Huesped === nombre).ID_Reserva;
// La app no deja crear reservas en el pasado: se crean en el futuro y se mueven en la hoja.
const moverA = (nombre, inicio, fin) => { fijarCelda(idDe(nombre), 'Fecha_Hora_Inicio', inicio); fijarCelda(idDe(nombre), 'Fecha_Hora_Fin', fin); };

const sembrarDemo = () => {
  prepararViajeros(); // Marta Pérez: Habitación dentro de 30 días, con sus dos formularios del Form de viajeros
  [
    habitacionDemo({ nombre: 'Oliver Fried', refCanal: 'HMAKER3ZKZ', fechaEntrada: isoEnDias(40), fechaSalida: isoEnDias(42) }),
    habitacionDemo({ nombre: 'Iria Maceiras', refCanal: 'HMKNXP9B8C', fechaEntrada: isoEnDias(9), fechaSalida: isoEnDias(13) }),
    habitacionDemo({ nombre: 'Len Gibbs', refCanal: 'HMLEN0001', fechaEntrada: isoEnDias(50), fechaSalida: isoEnDias(51) }),
    habitacionDemo({ nombre: 'Claudia Sánchez Tendero', refCanal: 'HMCLAU0002', fechaEntrada: isoEnDias(60), fechaSalida: isoEnDias(61) }),
    piscinaDemo({ nombre: 'Mª Ángeles', fechaUnica: isoEnDias(2), servicios: [{ nombre: 'BBQ', cantidad: '1' }, { nombre: 'Hielo', cantidad: '2' }] }),
    piscinaDemo({ nombre: 'Grupo Ruiz', canal: 'Directo', comision: '0', fechaUnica: isoEnDias(5) }),
    piscinaDemo({ nombre: 'Cumpleaños Lucía', fechaUnica: isoEnDias(70) }),
    piscinaDemo({ nombre: 'Familia Ortega', canal: 'Directo', comision: '0', fechaUnica: isoEnDias(80) }),
    piscinaDemo({ nombre: 'Reserva cancelada', fechaUnica: isoEnDias(90) }),
  ].forEach((datos) => entorno.llamar('crearReserva', datos));
  // Pasadas y en curso, para ver la ficha, los avisos y la puesta al día.
  moverA('Oliver Fried', new Date(Date.now() - 2 * MS_DIA), new Date(Date.now() + 1 * MS_DIA)); // en curso
  moverA('Len Gibbs', enDias(-12, 16), enDias(-10, 12)); // salió hace 10 días: toca el aviso de cobro
  moverA('Claudia Sánchez Tendero', enDias(-30, 16), enDias(-28, 12));
  moverA('Familia Ortega', new Date(Date.now() + 3 * 60 * 60 * 1000), new Date(Date.now() + 10 * 60 * 60 * 1000)); // llega en 3 h: aviso de check-in
  ['Checkin_Revisado', 'Checkout_Revisado'].forEach((c) => fijarCelda(idDe('Claudia Sánchez Tendero'), c, 'Hecho'));
  fijarCelda(idDe('Claudia Sánchez Tendero'), 'Estado_Cobro', 'Ingresado');
  fijarCelda(idDe('Claudia Sánchez Tendero'), 'Estado_Reserva', 'Completada'); // valor antiguo: se ve como "Cerrada"
  entorno.llamar('cancelarReserva', idDe('Reserva cancelada'));
  // DD-04: un cierre pasado de Interior y la temporada baja de Exterior, para ver Cerrar días y la ocupación.
  entorno.llamar('cerrarDias', { espacio: 'Habitación Interior', desde: isoEnDias(-6), hasta: isoEnDias(-4), motivo: 'Uso familiar' });
  entorno.llamar('cerrarDias', { espacio: 'Piscina / Jardín', desde: isoEnDias(100), hasta: isoEnDias(130), motivo: 'Fuera de temporada' });
  entorno.correos.length = 0;
};

const enlaceDemo = (texto, href, nota = '') => `<li><a href="${href}" target="_blank" rel="noopener">${escaparDemo(texto)}</a>${nota ? ` <small>${escaparDemo(nota)}</small>` : ''}</li>`;
const escaparDemo = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Panel de la demo: usuario activo, enlaces de los emails, avisos y emails enviados.
const paginaDemo = () => {
  const usuario = entorno.sesion.activo;
  const correos = entorno.correos.slice().reverse().map((c, i) => `<details${i === 0 ? ' open' : ''}><summary>${escaparDemo(c.subject)} <small>→ ${escaparDemo(c.to)}</small></summary>`
    + `<iframe sandbox srcdoc="${escaparDemo(c.htmlBody || c.body || '')}"></iframe></details>`).join('') || '<p>Aún no se ha enviado ningún email.</p>';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KAF Rent · demo</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;color:#2A2420;background:#FBF8F4}h1{color:#8E4322}
a{color:#8E4322;font-weight:600}li{margin:6px 0}small{color:#6E655C}form{display:inline}button{min-height:40px;margin:4px 6px 4px 0;padding:6px 12px;border-radius:8px;border:1px solid #B5562E;background:#fff;color:#8E4322;font-weight:600;cursor:pointer}
.caja{background:#fff;border:1px solid #ECE5DC;border-radius:12px;padding:12px 16px;margin:12px 0}iframe{width:100%;height:520px;border:1px solid #ECE5DC;border-radius:8px;background:#fff}</style></head><body>
<h1>KAF Rent · demo local</h1>
<p>La app real con datos inventados, sin Google. Ábrela en el móvil o con el navegador en modo móvil (F12 → icono de móvil, 360–393 px). Usuario activo: <b>${escaparDemo(usuario)}</b>.</p>
<div class="caja"><b>1. Entrar como</b><ul>
${enlaceDemo('Admin (ve el menú Admin)', '/__demo/usuario?email=admin@test.com')}
${enlaceDemo('Gestión (Ana, sin menú Admin)', '/__demo/usuario?email=ana@test.com')}
${enlaceDemo('Abrir KAF Rent', '/')}</ul></div>
<div class="caja"><b>2. Enlaces de los emails</b> (como si los pulsaras en Gmail)<ul>
${enlaceDemo('«Sí, se ha ingresado» de Len Gibbs', `/?accion=ingreso&id=${idDe('Len Gibbs')}`, 'abre la ficha y pide confirmar')}
${enlaceDemo('«Hacer el check-in» de Familia Ortega', `/?accion=checkin&id=${idDe('Familia Ortega')}`, 'abre la checklist de esa reserva')}
${enlaceDemo('«Hacer el check-out» de Oliver Fried', `/?accion=checkout&id=${idDe('Oliver Fried')}`)}
${enlaceDemo('Un enlace manipulado (acción desconocida)', `/?accion=borrar&id=${idDe('Len Gibbs')}`, 'debe abrir el Inicio sin hacer nada')}</ul></div>
<div class="caja"><b>3. Lanzar las tareas automáticas ahora</b><br>
<form method="post" action="/__demo/tarea?nombre=avisosDeCobro"><button>Aviso de cobro (9:00)</button></form>
<form method="post" action="/__demo/tarea?nombre=avisosDeChecklist"><button>Avisos de check-in/out (cada 15 min)</button></form>
<form method="post" action="/__demo/tarea?nombre=ponerAlDiaReservas"><button>Puesta al día (F-45)</button></form>
<form method="post" action="/__demo/reiniciar"><button>Volver a los datos iniciales</button></form>
${ultimoResultado.texto ? `<p><small>Resultado de la última tarea:</small></p><pre style="white-space:pre-wrap">${escaparDemo(ultimoResultado.texto)}</pre>` : ''}</div>
<div class="caja"><b>4. Emails enviados</b> (el último, abierto)${correos}</div>
</body></html>`;
};

// Sustituye a google.script.run en el navegador: cada llamada viaja por POST /rpc/<funcion>.
const SIMULADOR_GOOGLE = `<script>
  (() => {
    const crearRunner = (alExito, alFallo) => new Proxy({}, {
      get: (_, nombre) => {
        if (nombre === 'withSuccessHandler') return (f) => crearRunner(f, alFallo);
        if (nombre === 'withFailureHandler') return (f) => crearRunner(alExito, f);
        return (...args) => {
          fetch('/rpc/' + nombre, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
            .then((r) => r.json())
            .then((r) => (r.excepcion ? alFallo && alFallo(new Error(r.excepcion)) : alExito && alExito(r.valor)))
            .catch((e) => alFallo && alFallo(e));
        };
      },
    });
    window.google = { script: { run: crearRunner(null, null) } };
  })();
</script>`;

const escapar = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const leerPlantilla = (nombre) => fs.readFileSync(path.join(DIR_SRC, `${nombre}.html`), 'utf8');

// Réplica mínima de HtmlService para las dos construcciones que usan las plantillas.
const renderizar = (nombre, datos) => leerPlantilla(nombre)
  .replace(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g, (_, archivo) => leerPlantilla(archivo))
  .replace(/<\?=\s*datos\.email\s*\?>/g, () => escapar(datos.email))
  .replace(/<\?=\s*datos\.icono\s*\?>/g, () => escapar(datos.icono || ''))
  .replace(/<\?=\s*datos\.accion\s*\?>/g, () => escapar(datos.accion || ''))
  .replace(/<\?=\s*datos\.idAccion\s*\?>/g, () => escapar(datos.idAccion || ''))
  .replace('<head>', `<head>\n<meta name="viewport" content="width=device-width, initial-scale=1">${SIMULADOR_GOOGLE}`);

const leerCuerpo = (req) => new Promise((resolver) => {
  let cuerpo = '';
  req.on('data', (trozo) => { cuerpo += trozo; });
  req.on('end', () => resolver(cuerpo ? JSON.parse(cuerpo) : []));
});

const responder = (res, estado, tipo, contenido) => {
  res.writeHead(estado, { 'Content-Type': tipo });
  res.end(contenido);
};
const json = (res, datos) => responder(res, 200, 'application/json', JSON.stringify(datos));

const rutasDePrueba = {
  '/__test/reiniciar': () => { reiniciar(); return { ok: true }; },
  '/__test/viajeros': () => { prepararViajeros(); return { ok: true }; },
  '/__test/usuario': ({ email }) => { entorno.sesion.activo = email; return { ok: true }; },
  '/__test/calendario-falla': ({ falla }) => { entorno.calendario.fallar = falla === '1'; return { ok: true }; },
  '/__test/correos': () => entorno.correos,
  '/__test/eventos': () => entorno.calendario.eventos.map((e) => ({ titulo: e.titulo, opciones: e.opciones })),
  '/__test/hoja': ({ nombre }) => entorno.hoja(nombre).registros(),
  // Cambia una celda de una reserva (p. ej. fechas pasadas, que la app no deja crear).
  '/__test/reserva': ({ id, columna, valor, fecha }) => {
    const hoja = entorno.hoja('Reservas');
    const fila = hoja.registros().findIndex((r) => r.ID_Reserva === id) + 2;
    hoja.getRange(fila, hoja.cabeceras().indexOf(columna) + 1).setValue(fecha ? new Date(Number(fecha)) : valor);
    return { ok: fila > 1 };
  },
};

const MODO_DEMO = process.env.DEMO === '1';
const ultimoResultado = { texto: '' };

const rutasDemo = {
  '/demo': () => ({ html: paginaDemo() }),
  '/__demo/usuario': ({ email }) => { entorno.sesion.activo = email; return { volver: true }; },
  '/__demo/reiniciar': () => { reiniciar(); sembrarDemo(); entorno.sesion.activo = 'admin@test.com'; return { volver: true }; },
  '/__demo/tarea': ({ nombre }) => {
    if (!['avisosDeCobro', 'avisosDeChecklist', 'ponerAlDiaReservas'].includes(nombre)) return { volver: true };
    ultimoResultado.texto = JSON.stringify(entorno.comoPropietario(() => entorno.llamar(nombre)));
    return { volver: true };
  },
};

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  try {
    const demo = MODO_DEMO && rutasDemo[url.pathname];
    if (demo) {
      const r = demo(Object.fromEntries(url.searchParams));
      if (r.html) return responder(res, 200, 'text/html; charset=utf-8', r.html);
      res.writeHead(303, { Location: '/demo' });
      return res.end();
    }
    if (url.pathname === '/') {
      const email = entorno.sesion.activo;
      const autorizado = entorno.fn('verificarAcceso_')(email).autorizado;
      // Como doGet: la acción de un enlace de email solo pasa si es conocida y el ID es válido (F-37, F-40).
      const inicial = autorizado ? entorno.fn('accionInicial_')(Object.fromEntries(url.searchParams)) : {};
      return responder(res, 200, 'text/html; charset=utf-8', renderizar(autorizado ? 'index' : 'acceso-denegado', { email, accion: inicial.accion, idAccion: inicial.id }));
    }
    if (url.pathname.startsWith('/rpc/')) {
      const nombre = url.pathname.slice('/rpc/'.length);
      const args = await leerCuerpo(req);
      try {
        return json(res, { valor: entorno.llamar(nombre, ...args) });
      } catch (error) {
        return json(res, { excepcion: error.message });
      }
    }
    const ruta = rutasDePrueba[url.pathname];
    if (ruta) return json(res, ruta(Object.fromEntries(url.searchParams)));
    return responder(res, 404, 'text/plain', 'No encontrado');
  } catch (error) {
    return responder(res, 500, 'text/plain', error.stack);
  }
});

reiniciar();
if (MODO_DEMO) { sembrarDemo(); entorno.sesion.activo = 'admin@test.com'; }
servidor.listen(PUERTO, () => console.log(MODO_DEMO
  ? `Demo de KAF Rent en http://localhost:${PUERTO}/demo (Ctrl+C para pararla)`
  : `Servidor E2E en http://localhost:${PUERTO}`));
