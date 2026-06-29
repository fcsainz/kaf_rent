// Informes por email (mensual y trimestral) con KPIs por espacio y canal; archiva los agregados en Historico_Informes. US-021.

// Lo invoca el trigger del día 1 de cada mes: informe mensual siempre; trimestral al inicio de cada trimestre.
const informesProgramados = () => {
  ejecutarTarea('informeMensual', informeMensual);
  if ([0, 3, 6, 9].indexOf(new Date().getMonth()) !== -1) ejecutarTarea('informeTrimestral', informeTrimestral);
};

const informeMensual = () => {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  generarInforme('Mensual', Utilities.formatDate(inicio, obtenerSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM'), inicio, fin);
};

const informeTrimestral = () => {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const trimestre = Math.floor(inicio.getMonth() / 3) + 1;
  generarInforme('Trimestral', `${inicio.getFullYear()}-T${trimestre}`, inicio, fin);
};

const generarInforme = (tipo, periodo, inicio, fin) => {
  const iniMs = inicio.getTime();
  const finMs = fin.getTime();
  const reservas = obtenerFilas(obtenerHoja(HOJA_RESERVAS)).filter((fila) => {
    if (String(fila[COL_RES_ESTADO]).trim() === ESTADO_RESERVA_CANCELADA) return false;
    const t = aFecha(fila[COL_RES_INICIO]).getTime();
    return t >= iniMs && t < finMs;
  });

  const agregados = agregarPorEspacioCanal(reservas);
  guardarHistoricoInformes(periodo, tipo, agregados);
  enviarInformeEmail(tipo, periodo, agregados);
};

const agregarPorEspacioCanal = (reservas) => {
  const mapa = {};
  reservas.forEach((fila) => {
    const clave = `${fila[COL_RES_ESPACIO]}||${fila[COL_RES_CANAL]}`;
    const a = mapa[clave] || (mapa[clave] = { espacio: String(fila[COL_RES_ESPACIO]), canal: String(fila[COL_RES_CANAL]), num: 0, brutos: 0, comisiones: 0, netos: 0 });
    a.num += 1;
    a.brutos += Number(fila[COL_RES_BRUTO]) || 0;
    a.comisiones += Number(fila[COL_RES_COMISION_IMP]) || 0;
    a.netos += Number(fila[COL_RES_NETO]) || 0;
  });
  return Object.keys(mapa).map((k) => mapa[k]);
};

const guardarHistoricoInformes = (periodo, tipo, agregados) => {
  if (agregados.length === 0) return;
  const hoja = obtenerHoja(HOJA_HISTORICO_INFORMES);
  const filas = agregados.map((a) => [periodo, tipo, a.espacio, a.canal, a.num, a.brutos, a.comisiones, a.netos, '']);
  hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
};

const enviarInformeEmail = (tipo, periodo, agregados) => {
  const destinatarios = obtenerEmailsNotificacion();
  if (destinatarios.length === 0) return;

  const totales = agregados.reduce((t, a) => ({
    num: t.num + a.num, brutos: t.brutos + a.brutos, comisiones: t.comisiones + a.comisiones, netos: t.netos + a.netos,
  }), { num: 0, brutos: 0, comisiones: 0, netos: 0 });

  const filasHtml = agregados.map((a) =>
    `<tr><td>${a.espacio}</td><td>${a.canal}</td><td style="text-align:right">${a.num}</td>` +
    `<td style="text-align:right">${formatearImporte(a.brutos)}</td><td style="text-align:right">${formatearImporte(a.comisiones)}</td>` +
    `<td style="text-align:right">${formatearImporte(a.netos)}</td></tr>`).join('');

  const html =
    `<h2>Informe ${tipo} — ${periodo}</h2>` +
    (agregados.length === 0
      ? '<p>No hubo reservas en el periodo.</p>'
      : `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif">
           <thead><tr><th>Espacio</th><th>Canal</th><th>Reservas</th><th>Brutos</th><th>Comisiones</th><th>Netos</th></tr></thead>
           <tbody>${filasHtml}</tbody>
           <tfoot><tr><th colspan="2">Total</th><th style="text-align:right">${totales.num}</th>
             <th style="text-align:right">${formatearImporte(totales.brutos)}</th>
             <th style="text-align:right">${formatearImporte(totales.comisiones)}</th>
             <th style="text-align:right">${formatearImporte(totales.netos)}</th></tr></tfoot>
         </table>`);

  MailApp.sendEmail({
    to: destinatarios.join(','),
    subject: `[${NOMBRE_APP_EMAIL}] Informe ${tipo} — ${periodo}`,
    htmlBody: html,
  });
};
