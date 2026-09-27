// Servidor local de los E2E (T-05): sirve la interfaz real (plantillas de docs_dev/src con sus include) y responde
// a google.script.run ejecutando el código real del servidor sobre los dobles de Google (tests/soporte).
// Nada de esto se despliega. Rutas /__test/* solo existen aquí, para preparar cada escenario.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { crearEntornoConDatos } = require('../soporte/gas');

const PUERTO = Number(process.env.PUERTO_E2E) || 4173;
const DIR_SRC = path.join(__dirname, '..', '..', 'docs_dev', 'src');
const USUARIO_POR_DEFECTO = 'ana@test.com';

let entorno = null;
const reiniciar = () => {
  entorno = crearEntornoConDatos({ usuarioActivo: USUARIO_POR_DEFECTO });
  entorno.hoja('Usuarios_Autorizados').appendRow(['admin@test.com', 'Sí', 'Admin']);
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
  '/__test/usuario': ({ email }) => { entorno.sesion.activo = email; return { ok: true }; },
  '/__test/calendario-falla': ({ falla }) => { entorno.calendario.fallar = falla === '1'; return { ok: true }; },
  '/__test/correos': () => entorno.correos,
  '/__test/eventos': () => entorno.calendario.eventos.map((e) => ({ titulo: e.titulo, opciones: e.opciones })),
  '/__test/hoja': ({ nombre }) => entorno.hoja(nombre).registros(),
};

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  try {
    if (url.pathname === '/') {
      const email = entorno.sesion.activo;
      const vista = entorno.fn('verificarAcceso_')(email).autorizado ? 'index' : 'acceso-denegado';
      return responder(res, 200, 'text/html; charset=utf-8', renderizar(vista, { email }));
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
servidor.listen(PUERTO, () => console.log(`Servidor E2E en http://localhost:${PUERTO}`));
