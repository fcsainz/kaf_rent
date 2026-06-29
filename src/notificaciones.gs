// Envío de emails del sistema. Nunca debe hacer fallar el guardado: captura y registra sus propios errores. Ver ADR-0006.

const NOMBRE_APP_EMAIL = 'KAF Rent';

// Orquesta los avisos al crear una reserva: cierre de canales (US-014) y confirmación (US-025).
const notificarReservaCreada = (reserva, id) => {
  const destinatarios = obtenerEmailsNotificacion();
  if (destinatarios.length === 0) return;
  const para = destinatarios.join(',');

  enviarAvisoCierreCanales(para, reserva, id);
  enviarConfirmacionReserva(para, reserva, id);
};

// Si el espacio tiene otros canales activos, avisa de cuáles cerrar para esa franja (US-014).
const enviarAvisoCierreCanales = (para, reserva, id) => {
  try {
    const otrosCanales = obtenerCanalesActivos(reserva.espacio)
      .map((c) => c.nombre)
      .filter((nombre) => nombre !== reserva.canal);
    if (otrosCanales.length === 0) return;

    const cuerpo = [
      `Reserva ${referenciaMostrada(id)} creada en ${reserva.espacio} (canal ${reserva.canal}).`,
      `Franja: ${formatearFechaHora(reserva.inicio)} → ${formatearFechaHora(reserva.fin)}.`,
      '',
      'Cierra la disponibilidad de esta franja en los siguientes canales:',
      ...otrosCanales.map((c) => ` · ${c}`),
    ].join('\n');

    MailApp.sendEmail(para, `[${NOMBRE_APP_EMAIL}] Cerrar canales — ${reserva.espacio} ${referenciaMostrada(id)}`, cuerpo);
  } catch (error) {
    registrarError('enviarAvisoCierreCanales', error, { id });
  }
};

// Resumen de la reserva recién creada, a los tres copropietarios (US-025).
const enviarConfirmacionReserva = (para, reserva, id) => {
  try {
    const cuerpo = [
      `Nueva reserva ${referenciaMostrada(id)}`,
      '',
      `Espacio: ${reserva.espacio}`,
      `Canal: ${reserva.canal}`,
      `Fechas: ${formatearFechaHora(reserva.inicio)} → ${formatearFechaHora(reserva.fin)}`,
      `Huésped: ${reserva.nombre}`,
      `Personas: ${reserva.adultos} adultos, ${reserva.menores} menores`,
      `Importe bruto: ${formatearImporte(reserva.importes.bruto)}`,
      `Importe neto: ${formatearImporte(reserva.importes.neto)}`,
    ].join('\n');

    MailApp.sendEmail(para, `[${NOMBRE_APP_EMAIL}] Reserva ${referenciaMostrada(id)} — ${reserva.espacio}`, cuerpo);
  } catch (error) {
    registrarError('enviarConfirmacionReserva', error, { id });
  }
};

// Al cancelar una reserva, avisa de reabrir la disponibilidad en los demás canales del espacio (US-020).
const notificarReaperturaCanales = (datos) => {
  const destinatarios = obtenerEmailsNotificacion();
  if (destinatarios.length === 0) return;
  try {
    const otrosCanales = obtenerCanalesActivos(datos.espacio)
      .map((c) => c.nombre)
      .filter((nombre) => nombre !== datos.canal);
    if (otrosCanales.length === 0) return;

    const cuerpo = [
      `Reserva ${datos.ref} CANCELADA en ${datos.espacio} (canal ${datos.canal}).`,
      `Franja liberada: ${formatearFechaHora(datos.inicio)} → ${formatearFechaHora(datos.fin)}.`,
      '',
      'Vuelve a abrir la disponibilidad de esta franja en:',
      ...otrosCanales.map((c) => ` · ${c}`),
    ].join('\n');

    MailApp.sendEmail(destinatarios.join(','), `[${NOMBRE_APP_EMAIL}] Reabrir canales — ${datos.espacio} ${datos.ref}`, cuerpo);
  } catch (error) {
    registrarError('notificarReaperturaCanales', error, datos);
  }
};

const formatearFechaHora = (fecha) =>
  Utilities.formatDate(fecha, obtenerSpreadsheet().getSpreadsheetTimeZone(), 'dd/MM/yyyy HH:mm');

const formatearImporte = (importe) => `${Number(importe || 0).toFixed(2)} €`;
