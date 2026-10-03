// Capa: INFRAESTRUCTURA — plantilla común de los emails (D-35 → B, S28; maquetas aprobadas en docs_work/emails_propuesta/).
// Cabecera con el logo, etiqueta de estado, título, resumen, datos clave, "Qué hacer", botones, datos técnicos y pie.
// HTML con estilos en línea y tablas (lo que entienden Gmail y Outlook) y su versión en texto plano. Todo dato se escapa.

const COLORES_EMAIL = {
  marca: '#B5562E', marcaOscuro: '#8E4322', fondo: '#F5F0E9', texto: '#2A2420', suave: '#6B625A', borde: '#E4DCD2',
};
// Tono del aviso: [color del texto, color de fondo, icono de la etiqueta].
const TONOS_EMAIL = {
  exito: ['#2E7D32', '#E8F3E8', '✓'], aviso: ['#8A5200', '#FFF4E0', '!'], error: ['#B3261E', '#FCE8E6', '✕'], info: ['#1F5F8B', '#E6F0F7', 'i'],
};
const PIE_EMAIL_DEFECTO = 'Recibes este email porque estás en la lista de avisos de KAF Rent (Config → Emails_Notificacion).';

// **texto** → negrita, después de escapar (los datos nunca se interpretan como HTML).
const conNegritas_ = (texto) => escaparHtml_(texto).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const sinNegritas_ = (texto) => texto_(texto).replace(/\*\*(.+?)\*\*/g, '$1');

const logoEmail_ = () => {
  const url = texto_(obtenerConfig_('Icono_Url', ''));
  return url
    ? `<img src="${escaparHtml_(url)}" width="36" height="36" alt="" style="display:block;border-radius:9px">`
    : `<div style="width:36px;height:36px;line-height:36px;background:#fff;border-radius:9px;text-align:center;font-weight:700;color:${COLORES_EMAIL.marca};font-size:18px">K</div>`;
};

const filaDatoEmail_ = ([etiqueta, valor]) => `<tr><td style="padding:6px 0;color:${COLORES_EMAIL.suave};width:42%;vertical-align:top">${conNegritas_(etiqueta)}</td>`
  + `<td style="padding:6px 0;font-weight:600">${conNegritas_(valor)}</td></tr>`;

const bloqueDatosEmail_ = (datos) => (datos.length === 0 ? '' : `<tr><td style="padding:12px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" `
  + `style="font-size:15px;border-top:1px solid ${COLORES_EMAIL.borde};border-bottom:1px solid ${COLORES_EMAIL.borde}">${datos.map(filaDatoEmail_).join('')}</table></td></tr>`);

// Tabla de cifras (informes): { cabeceras, filas, total, numericas: [índices alineados a la derecha] }.
const bloqueTablaEmail_ = (tabla) => {
  if (!tabla) return '';
  const celda = (v, i, extra = '') => `<td${tabla.numericas.includes(i) ? ' align="right"' : ''} style="padding:8px;border-top:1px solid ${COLORES_EMAIL.borde};${extra}">${escaparHtml_(v)}</td>`;
  const cabecera = tabla.cabeceras.map((c, i) => `<th${tabla.numericas.includes(i) ? ' align="right"' : ' align="left"'} style="padding:8px">${escaparHtml_(c)}</th>`).join('');
  const filas = tabla.filas.map((f) => `<tr>${f.map((v, i) => celda(v, i)).join('')}</tr>`).join('');
  const total = tabla.total ? `<tr style="font-weight:700">${tabla.total.map((v, i) => celda(v, i, `border-top:2px solid ${COLORES_EMAIL.texto}`)).join('')}</tr>` : '';
  return `<tr><td style="padding:12px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">`
    + `<tr style="background:${COLORES_EMAIL.fondo}">${cabecera}</tr>${filas}${total}</table></td></tr>`;
};

// Botones con enlace: el primero relleno (acción principal); el resto con contorno. Los que no tienen URL no salen.
const bloqueBotonesEmail_ = (botones) => {
  const conUrl = botones.filter((b) => texto_(b.url));
  if (conUrl.length === 0) return '';
  const estilo = (i) => (i === 0 ? `background:${COLORES_EMAIL.marca};color:#fff` : `background:#fff;color:${COLORES_EMAIL.marcaOscuro}`);
  return `<tr><td style="padding:8px 24px 16px">${conUrl.map((b, i) => `<a href="${escaparHtml_(b.url)}" style="display:inline-block;${estilo(i)};`
    + `border:2px solid ${COLORES_EMAIL.marca};text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;font-size:15px;margin:0 8px 8px 0">${escaparHtml_(b.texto)}</a>`).join('')}</td></tr>`;
};

const htmlEmail_ = ({ tono, etiqueta, titulo, resumen, datos = [], accion, botones = [], tabla, tecnico, pie }) => {
  const [color, fondo, icono] = TONOS_EMAIL[tono];
  const C = COLORES_EMAIL;
  return `<div style="margin:0;background:${C.fondo};font-family:Arial,Helvetica,sans-serif;color:${C.texto};padding:24px 12px">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">`
    + `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;border:1px solid ${C.borde}">`
    + `<tr><td style="background:${C.marca};padding:16px 24px;border-radius:12px 12px 0 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>`
    + `<td>${logoEmail_()}</td><td style="padding-left:12px;color:#fff;font-size:18px;font-weight:700">${NOMBRE_APP_EMAIL}</td></tr></table></td></tr>`
    + `<tr><td style="padding:24px 24px 8px"><span style="display:inline-block;background:${fondo};color:${color};font-weight:700;font-size:13px;padding:4px 10px;border-radius:999px">${icono} ${escaparHtml_(etiqueta)}</span>`
    + `<h1 style="font-size:22px;line-height:1.3;margin:12px 0 8px">${escaparHtml_(titulo)}</h1>`
    + `<p style="font-size:16px;line-height:1.5;margin:0">${conNegritas_(resumen)}</p></td></tr>`
    + bloqueDatosEmail_(datos) + bloqueTablaEmail_(tabla)
    + (accion ? `<tr><td style="padding:12px 24px"><div style="background:${fondo};border-left:4px solid ${color};padding:12px 16px;border-radius:6px;font-size:15px;line-height:1.5"><strong>Qué hacer:</strong> ${conNegritas_(accion)}</div></td></tr>` : '')
    + bloqueBotonesEmail_(botones)
    + (tecnico ? `<tr><td style="padding:8px 24px 16px"><div style="font-size:12px;color:${C.suave};border-top:1px dashed ${C.borde};padding-top:10px"><strong>Datos técnicos</strong>`
      + `<pre style="font-family:Consolas,monospace;font-size:12px;white-space:pre-wrap;margin:6px 0 0">${escaparHtml_(tecnico)}</pre></div></td></tr>` : '')
    + `<tr><td style="background:${C.fondo};padding:12px 24px;font-size:12px;color:${C.suave};line-height:1.5;border-radius:0 0 12px 12px">${escaparHtml_(pie || PIE_EMAIL_DEFECTO)}</td></tr>`
    + '</table></td></tr></table></div>';
};

// Versión en texto plano, para los clientes de correo que no muestran HTML.
const textoEmail_ = ({ etiqueta, titulo, resumen, datos = [], accion, botones = [], tabla, tecnico, pie }) => [
  `[${etiqueta}] ${titulo}`, '', sinNegritas_(resumen), '',
  ...datos.map(([k, v]) => `${sinNegritas_(k)}: ${sinNegritas_(v)}`),
  ...(tabla ? ['', tabla.cabeceras.join(' | '), ...tabla.filas.map((f) => f.join(' | ')), ...(tabla.total ? [tabla.total.join(' | ')] : [])] : []),
  ...(accion ? ['', `Qué hacer: ${sinNegritas_(accion)}`] : []),
  ...botones.filter((b) => texto_(b.url)).map((b) => `${b.texto}: ${b.url}`),
  ...(tecnico ? ['', 'Datos técnicos:', tecnico] : []),
  '', pie || PIE_EMAIL_DEFECTO,
].join('\n');

// Mensaje listo para MailApp: asunto, HTML y texto.
const correoConPlantilla_ = (asunto, contenido) => ({ subject: asunto, htmlBody: htmlEmail_(contenido), body: textoEmail_(contenido) });

// Acciones que un enlace de email puede pedir a la app (?accion=…&id=…); doGet solo admite estas (F-37, F-40).
const ACCION_APP = { INGRESO: 'ingreso', FICHA: 'ficha', CHECKIN: 'checkin', CHECKOUT: 'checkout' };

// Enlaces de los botones.
const urlApp_ = () => {
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (error) {
    registrarError_('urlApp_', error, {});
    return '';
  }
};
const urlSheetFormViajeros_ = () => {
  const id = texto_(obtenerConfig_('Sheet_Viajeros_Id'));
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : '';
};
const urlWebSES_ = () => texto_(obtenerConfig_('SES_Web_Url', 'https://hospedajes.ses.mir.es/'));
