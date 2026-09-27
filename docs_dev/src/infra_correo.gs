// Capa: INFRAESTRUCTURA — envío de emails (avisos de canales, confirmación e informes). Ver ADR-0006.
// Nunca hace fallar la operación que lo llama: captura y registra sus propios errores (RNF-16).

const NOMBRE_APP_EMAIL = 'KAF Rent';

// Devuelve si se envió, para quien necesite contárselo al usuario.
const enviarCorreo_ = (nombreFuncion, contexto, mensaje, destinatarios = obtenerEmailsNotificacion_()) => {
  if (destinatarios.length === 0) return false;
  try {
    MailApp.sendEmail({ to: destinatarios.join(','), ...mensaje });
    return true;
  } catch (error) {
    registrarError_(nombreFuncion, error, contexto);
    return false;
  }
};

const otrosCanalesActivos_ = (reserva) =>
  obtenerCanalesActivos_(reserva.espacio).map((c) => c.nombre).filter((nombre) => nombre !== reserva.canal);

const franja_ = (reserva) => `${formatearFechaHora_(reserva.inicio)} → ${formatearFechaHora_(reserva.fin)}`;

// Aviso de cierre de canales, solo si el espacio tiene otros activos (RF-34).
const enviarAvisoCierreCanales_ = (reserva) => {
  const otros = otrosCanalesActivos_(reserva);
  if (otros.length === 0) return;
  const ref = referenciaMostrada_(reserva.id);
  enviarCorreo_('enviarAvisoCierreCanales_', { id: reserva.id }, {
    subject: `[${NOMBRE_APP_EMAIL}] Cerrar canales — ${reserva.espacio} ${ref}`,
    body: [
      `Reserva ${ref} creada en ${reserva.espacio} (canal ${reserva.canal}).`,
      `Franja: ${franja_(reserva)}.`,
      '',
      'Cierra la disponibilidad de esta franja en los siguientes canales:',
      ...otros.map((c) => ` · ${c}`),
    ].join('\n'),
  });
};

// Confirmación de la reserva a los tres copropietarios (RF-35).
const enviarConfirmacionReserva_ = (reserva) => {
  const ref = referenciaMostrada_(reserva.id);
  enviarCorreo_('enviarConfirmacionReserva_', { id: reserva.id }, {
    subject: `[${NOMBRE_APP_EMAIL}] Reserva ${ref} — ${reserva.espacio}`,
    body: [
      `Nueva reserva ${ref}`,
      '',
      `Espacio: ${reserva.espacio}`,
      `Canal: ${reserva.canal}`,
      `Fechas: ${franja_(reserva)}`,
      `Huésped: ${reserva.nombre}`,
      `Personas: ${reserva.adultos} adultos, ${reserva.menores} menores`,
      `Importe bruto: ${formatearImporte_(reserva.bruto)}`,
      `Importe neto: ${formatearImporte_(reserva.neto)}`,
    ].join('\n'),
  });
};

// Al crear una reserva se envían los dos avisos.
const notificarReservaCreada_ = (reserva) => {
  enviarAvisoCierreCanales_(reserva);
  enviarConfirmacionReserva_(reserva);
};

// Al cancelar: aviso de reapertura de canales (RF-39).
const notificarReaperturaCanales_ = (reserva) => {
  const otros = otrosCanalesActivos_(reserva);
  if (otros.length === 0) return;
  const ref = referenciaMostrada_(reserva.id);
  enviarCorreo_('notificarReaperturaCanales_', { id: reserva.id }, {
    subject: `[${NOMBRE_APP_EMAIL}] Reabrir canales — ${reserva.espacio} ${ref}`,
    body: [
      `Reserva ${ref} CANCELADA en ${reserva.espacio} (canal ${reserva.canal}).`,
      `Franja liberada: ${franja_(reserva)}.`,
      '',
      'Vuelve a abrir la disponibilidad de esta franja en:',
      ...otros.map((c) => ` · ${c}`),
    ].join('\n'),
  });
};

const celda_ = (valor, alinearDerecha = false) =>
  `<td${alinearDerecha ? ' style="text-align:right"' : ''}>${escaparHtml_(valor)}</td>`;

// Informe en HTML; todo dato se escapa (RNF-26, B-05).
const htmlInforme_ = (tipo, periodo, agregados) => {
  const titulo = `<h2>Informe ${escaparHtml_(tipo)} — ${escaparHtml_(periodo)}</h2>`;
  if (agregados.length === 0) return `${titulo}<p>No hubo reservas en el periodo.</p>`;
  const t = totalesInforme_(agregados);
  const filas = agregados.map((a) => `<tr>${celda_(a.espacio)}${celda_(a.canal)}${celda_(a.numReservas, true)}`
    + `${celda_(formatearImporte_(a.brutos), true)}${celda_(formatearImporte_(a.comisiones), true)}${celda_(formatearImporte_(a.netos), true)}</tr>`).join('');
  return `${titulo}<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif">`
    + '<thead><tr><th>Espacio</th><th>Canal</th><th>Reservas</th><th>Brutos</th><th>Comisiones</th><th>Netos</th></tr></thead>'
    + `<tbody>${filas}</tbody>`
    + `<tfoot><tr><th colspan="2">Total</th>${celda_(t.numReservas, true)}${celda_(formatearImporte_(t.brutos), true)}`
    + `${celda_(formatearImporte_(t.comisiones), true)}${celda_(formatearImporte_(t.netos), true)}</tr></tfoot></table>`;
};

const enviarInforme_ = (tipo, periodo, agregados) =>
  enviarCorreo_('enviarInforme_', { tipo, periodo }, {
    subject: `[${NOMBRE_APP_EMAIL}] Informe ${tipo} — ${periodo}`,
    htmlBody: htmlInforme_(tipo, periodo, agregados),
  });

// Incidencia enviada por un usuario desde el aviso de la app (F-21): detalle técnico, sin datos del huésped (RNF-34).
const enviarIncidenciaAdmin_ = ({ id, informante, errores }, destinatarios) => {
  const ref = referenciaMostrada_(id);
  const bloque = (e) => [
    `Fecha: ${formatearFechaHora_(e.fecha)}`,
    `Función: ${texto_(e.funcion)}`,
    `Mensaje: ${texto_(e.mensaje)}`,
    `Contexto técnico: ${texto_(e.contexto)}`,
  ].join('\n');
  return enviarCorreo_('enviarIncidenciaAdmin_', { id }, {
    subject: `[${NOMBRE_APP_EMAIL}] Incidencia — reserva ${ref}`,
    body: [
      `${informante} ha enviado una incidencia desde la app sobre la reserva ${ref} (ID ${id}).`,
      `Enviada: ${formatearFechaHora_(new Date())}`,
      '',
      `Errores registrados (${errores.length}, del más reciente al más antiguo):`,
      '',
      errores.map(bloque).join('\n\n'),
    ].join('\n'),
  }, destinatarios);
};
