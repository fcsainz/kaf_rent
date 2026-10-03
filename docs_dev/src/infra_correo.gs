// Capa: INFRAESTRUCTURA — envío de emails (avisos de canales, confirmación, informes, incidencias y SES). Ver ADR-0006.
// Todos usan la plantilla común (infra_plantilla_email.gs, D-35). Nunca hacen fallar la operación que los llama:
// capturan y registran sus propios errores (RNF-16).

const NOMBRE_APP_EMAIL = 'KAF Rent';
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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

// ---------- Fechas en lenguaje de las personas ----------

const mayuscula_ = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// "Lun 20/10/2026 · 16:00"
const fechaHoraEmail_ = (f) => `${mayuscula_(DIAS_CORTOS[f.getDay()])} ${dosCifras_(f.getDate())}/${dosCifras_(f.getMonth() + 1)}/${f.getFullYear()} · ${horaMinutos_(f)}`;
const nochesDe_ = (r) => Math.round((inicioDelDia_(r.fin) - inicioDelDia_(r.inicio)) / MS_POR_DIA);

// "Lun 20/10/2026 · 16:00 → Jue 23/10/2026 · 12:00 (3 noches)"; en el mismo día, "Lun 20/10/2026 · 11:00 → 19:00".
const estanciaEmail_ = (r) => {
  const noches = nochesDe_(r);
  if (noches === 0) return `${fechaHoraEmail_(r.inicio)} → ${horaMinutos_(r.fin)}`;
  return `${fechaHoraEmail_(r.inicio)} → ${fechaHoraEmail_(r.fin)} (${noches} ${noches === 1 ? 'noche' : 'noches'})`;
};

// Para el asunto: "20–23 oct", "30 oct–2 nov" o, en el mismo día, "lun 20/10 11:00–19:00".
const rangoCortoEmail_ = (r) => {
  const [a, b] = [r.inicio, r.fin];
  if (nochesDe_(r) === 0) return `${DIAS_CORTOS[a.getDay()]} ${dosCifras_(a.getDate())}/${dosCifras_(a.getMonth() + 1)} ${horaMinutos_(a)}–${horaMinutos_(b)}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MESES_CORTOS[a.getMonth()]}`;
  return `${a.getDate()} ${MESES_CORTOS[a.getMonth()]}–${b.getDate()} ${MESES_CORTOS[b.getMonth()]}`;
};

const personasEmail_ = (r) => [`${numero_(r.adultos)} ${numero_(r.adultos) === 1 ? 'adulto' : 'adultos'}`,
  numero_(r.menores) > 0 ? `${numero_(r.menores)} ${numero_(r.menores) === 1 ? 'menor' : 'menores'}` : ''].filter(Boolean).join(', ');

const botonApp_ = (texto = 'Abrir la reserva en KAF Rent') => ({ texto, url: urlApp_() });

// ---------- Reservas ----------

const otrosCanalesActivos_ = (reserva) =>
  obtenerCanalesActivos_(reserva.espacio).map((c) => c.nombre).filter((nombre) => nombre !== reserva.canal);

// Aviso de cierre de canales, solo si el espacio tiene otros activos (RF-34).
const enviarAvisoCierreCanales_ = (reserva) => {
  const otros = otrosCanalesActivos_(reserva);
  if (otros.length === 0) return;
  const ref = referenciaMostrada_(reserva.id);
  enviarCorreo_('enviarAvisoCierreCanales_', { id: reserva.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ! Cierra canales · ${reserva.espacio} · ${rangoCortoEmail_(reserva)}`, {
      tono: 'aviso', etiqueta: 'Acción necesaria', titulo: 'Cierra la fecha en los otros canales',
      resumen: `Hay una reserva nueva en **${reserva.espacio}** por ${reserva.canal}. Bloquea esa franja en el resto de canales para evitar dobles reservas.`,
      datos: [['Reserva', `${ref} · ${reserva.nombre}`], ['Franja', estanciaEmail_(reserva)], ['Canales que cerrar', `**${otros.join(' · ')}**`]],
      accion: 'Entra en cada canal de la lista y bloquea la franja. No hace falta responder.',
    }));
};

// Confirmación de la reserva a los copropietarios (RF-35).
const enviarConfirmacionReserva_ = (reserva) => {
  const ref = referenciaMostrada_(reserva.id);
  const conRegistro = Boolean(reserva.registroViajeros);
  enviarCorreo_('enviarConfirmacionReserva_', { id: reserva.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ✓ Nueva reserva ${ref} · ${reserva.espacio} · ${rangoCortoEmail_(reserva)}`, {
      tono: 'exito', etiqueta: 'Reserva creada', titulo: `Nueva reserva ${ref} — ${reserva.espacio}`,
      resumen: `${reserva.nombre} ha reservado **${reserva.espacio}** por ${reserva.canal}.`,
      datos: [
        ['Entrada', fechaHoraEmail_(reserva.inicio)], ['Salida', fechaHoraEmail_(reserva.fin)], ['Huéspedes', personasEmail_(reserva)],
        ['Canal', [reserva.canal, reserva.refCanal].filter(Boolean).join(' · ')], ['Servicios', reserva.serviciosExtra || '—'],
        ['Importe bruto', formatearImporte_(reserva.bruto)], [`Comisión (${numero_(reserva.comisionPct)} %)`, `−${formatearImporte_(reserva.comision)}`],
        ['**Neto**', `**${formatearImporte_(reserva.neto)}**`], ['Registrada por', reserva.registradoPor || '—'],
      ],
      accion: conRegistro ? 'Envía al huésped el mensaje con el enlace al formulario de viajeros (Gestionar → Mensaje para el huésped).' : '',
      botones: [botonApp_()],
    }));
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
  enviarCorreo_('notificarReaperturaCanales_', { id: reserva.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ! Reabre canales · ${reserva.espacio} · ${rangoCortoEmail_(reserva)} (reserva ${ref} cancelada)`, {
      tono: 'aviso', etiqueta: 'Acción necesaria', titulo: 'Reabre la fecha en los otros canales',
      resumen: `Se ha cancelado la reserva **${ref}** de ${reserva.espacio}. La franja vuelve a estar libre.`,
      datos: [['Reserva cancelada', `${ref} · ${reserva.nombre}`], ['Franja', estanciaEmail_(reserva)], ['Canales que reabrir', `**${otros.join(' · ')}**`],
        ['Cancelada por', reserva.modificadoPor || '—']],
      accion: 'Desbloquea la franja en cada canal. Si la reserva estaba comunicada a SES, KAF Rent la anula sola y te avisará del resultado.',
    }));
};

// ---------- Informes ----------

const ORDINAL_TRIMESTRE = ['1.er', '2.º', '3.er', '4.º'];

// "2026-09" → "septiembre 2026" (o "sep 2026" en corto); "2026-T3" → "3.er trimestre 2026" (o "T3 2026").
const periodoLegible_ = (periodo, corto = false) => {
  const [anyo, parte] = texto_(periodo).split('-');
  if (/^T\d$/.test(parte)) return corto ? `${parte} ${anyo}` : `${ORDINAL_TRIMESTRE[Number(parte.slice(1)) - 1]} trimestre ${anyo}`;
  const mes = Number(parte) - 1;
  return `${(corto ? MESES_CORTOS : MESES_LARGOS)[mes]} ${anyo}`;
};

// Importes del informe en euros enteros, como en la maqueta: "2.840 €".
const eurosEnteros_ = (n) => formatearImporte_(Math.round(numero_(n))).replace(',00 €', ' €');

// "▲ 18 %", "▼ 5 %", "= 0 %"; "—" sin base con la que comparar.
const variacionEmail_ = (v) => {
  if (v === null) return '—';
  const pct = Math.round(Math.abs(v) * 100);
  if (pct === 0) return '= 0 %';
  return `${v > 0 ? '▲' : '▼'} ${pct} %`;
};

// "un 18 % más que septiembre 2025"; en los trimestres, con artículo: "que el 2.º trimestre 2026", "sin datos del…".
const fraseVariacion_ = (v, etiqueta, esTrimestre) => {
  if (v === null) return `sin datos ${esTrimestre ? 'del' : 'de'} ${etiqueta} para comparar`;
  const pct = Math.round(Math.abs(v) * 100);
  const con = `${esTrimestre ? 'el ' : ''}${etiqueta}`;
  if (pct === 0) return `igual que ${con}`;
  return `un ${pct} % ${v > 0 ? 'más' : 'menos'} que ${con}`;
};

// Informe mensual o trimestral con su comparativa (RF-61, D-41). `comparados`: los periodos anterior y del año anterior.
const enviarInforme_ = (periodo, { filas, total }, comparados) => {
  const legible = periodoLegible_(periodo.periodo);
  const [anterior, anyoAnterior] = [comparados.anterior.periodo, comparados.anyoAnterior.periodo];
  const tabla = filas.length === 0 ? null : {
    cabeceras: ['Espacio · canal', 'Reservas', 'Neto', `vs. ${periodoLegible_(anterior, true)}`, `vs. ${periodoLegible_(anyoAnterior, true)}`], numericas: [1, 2, 3, 4],
    filas: filas.map((a) => [`${a.espacio} · ${a.canal}`, a.numReservas, eurosEnteros_(a.netos), variacionEmail_(a.vsAnterior), variacionEmail_(a.vsAnyoAnterior)]),
    total: ['Total', total.numReservas, eurosEnteros_(total.netos), variacionEmail_(total.vsAnterior), variacionEmail_(total.vsAnyoAnterior)],
  };
  const esTrimestre = periodo.tipo === 'Trimestral';
  const comparativa = `${fraseVariacion_(total.vsAnterior, periodoLegible_(anterior), esTrimestre)} y ${fraseVariacion_(total.vsAnyoAnterior, periodoLegible_(anyoAnterior), esTrimestre)}`;
  return enviarCorreo_('enviarInforme_', { tipo: periodo.tipo, periodo: periodo.periodo }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] Informe ${esTrimestre ? 'del' : 'de'} ${legible} · ${total.numReservas} reservas · ${eurosEnteros_(total.netos)} netos`, {
      tono: 'info', etiqueta: `Informe ${periodo.tipo.toLowerCase()}`, titulo: mayuscula_(legible),
      resumen: `**${total.numReservas} reservas** y **${eurosEnteros_(total.netos)} netos**: ${comparativa}.`,
      tabla, botones: [botonApp_('Ver estadísticas en KAF Rent')],
    }));
};

// ---------- Soporte ----------

// Incidencia enviada por un usuario desde el aviso de la app (F-21): detalle técnico, sin datos del huésped (RNF-34).
const enviarIncidenciaAdmin_ = ({ id, informante, errores }, destinatarios) => {
  const ref = referenciaMostrada_(id);
  const [ultimo = {}] = errores;
  const bloque = (e) => [`${formatearFechaHora_(e.fecha)} · ${texto_(e.funcion)}`, `Mensaje: ${texto_(e.mensaje)}`, `Contexto: ${texto_(e.contexto)}`].join('\n');
  return enviarCorreo_('enviarIncidenciaAdmin_', { id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ✕ Incidencia técnica · reserva ${ref} · ${texto_(ultimo.funcion) || 'sin detalle'}`, {
      tono: 'error', etiqueta: 'Incidencia', titulo: 'Un usuario ha enviado una incidencia',
      resumen: `**${informante}** ha informado de un fallo en la reserva ${ref}. La reserva está guardada.`,
      datos: [['Reserva', `${ref} (ID ${id})`], ['Qué falló', texto_(ultimo.mensaje) || '—'], ['Informada por', informante], ['Enviada', formatearFechaHora_(new Date())],
        ['Errores registrados', String(errores.length)]],
      accion: 'Revisa los datos técnicos. Si es de permisos, comparte el recurso con ese usuario; si es de Calendar, ejecuta después "sincronizarReservasCalendario" desde el editor.',
      botones: [botonApp_()],
      tecnico: errores.map(bloque).join('\n\n'),
      pie: 'Recibes este email porque tienes rol Admin o Soporte en KAF Rent.',
    }), destinatarios);
};

// ---------- SES.Hospedajes ----------

// Una respuesta del Form sin reserva de Habitación con ese código: no se puede comunicar nada.
const enviarAvisoSESSinReserva_ = ({ fila, codigo, nombre }) => enviarCorreo_('enviarAvisoSESSinReserva_', { fila }, correoConPlantilla_(
  `[${NOMBRE_APP_EMAIL}] ! SES Formulario: respuesta sin reserva · código "${codigo || '(vacío)'}"`, {
    tono: 'aviso', etiqueta: 'Sin comunicar', titulo: 'Una respuesta del formulario no coincide con ninguna reserva',
    resumen: `Ha llegado el formulario de **${nombre || '(sin nombre)'}** con el código **${codigo || '(vacío)'}**, pero no hay ninguna reserva de la Habitación con ese código. No se ha comunicado nada a SES.`,
    datos: [['Huésped', nombre || '(sin nombre)'], ['Código escrito', codigo || '(vacío)'], ['Fila del Sheet del Form', String(fila)],
      ['Recibido', formatearFechaHora_(new Date())]],
    accion: 'Comprueba el código: corrígelo en esa fila del Sheet del Form o crea la reserva en KAF Rent con ese código del canal. Si la reserva está cancelada, no hay que hacer nada.',
    botones: [{ texto: 'Abrir el Sheet del Form', url: urlSheetFormViajeros_() }, botonApp_('Abrir Gestionar en KAF Rent')],
  }));

// Datos de la reserva en los avisos de SES (`detalle` lo prepara la API): el titular en la reserva, los huéspedes en el parte.
const datosReservaSES_ = (comunicacion, { reserva, titular, codigoAnulado, tipoAnulado, validadoPor }) => {
  if (!reserva) return [['Reserva', referenciaMostrada_(comunicacion.idReserva)]];
  const filas = [['Reserva', `${referenciaMostrada_(reserva.id)} · ${reserva.espacio}`], ['Estancia', estanciaEmail_(reserva)]];
  if (comunicacion.tipo === TIPO_COMUNICACION_SES.RESERVA && titular) filas.push(['Titular', titular]);
  if (comunicacion.tipo === TIPO_COMUNICACION_SES.PARTE) filas.push(['Huéspedes', personasEmail_(reserva)]);
  if (validadoPor) filas.push(['Validado por', validadoPor]);
  if (comunicacion.tipo === TIPO_COMUNICACION_SES.ANULACION && codigoAnulado) {
    filas.push(['Comunicación', `${codigoAnulado} (${tipoAnulado === TIPO_COMUNICACION_SES.PARTE ? 'parte' : 'reserva'})`]);
  }
  return filas;
};

const tecnicoSES_ = (c, maxIntentos) => [
  `Comunicación ${c.id} (${c.tipo}) · estado ${c.estado} · intento ${c.intento}${maxIntentos ? ` de ${maxIntentos}` : ''}`,
  `Lote: ${c.lote || '—'} · filas del Form: ${(c.filasForm || []).join(', ') || '—'}`,
  ...(c.error ? [`Detalle: ${c.error}`] : []),
].join('\n');

const botonesAvisoSES_ = (enlaces) => enlaces.map((clave) => ({
  [ENLACE_AVISO_SES.SHEET]: { texto: 'Abrir el Sheet del Form', url: urlSheetFormViajeros_() },
  [ENLACE_AVISO_SES.APP]: botonApp_(),
  [ENLACE_AVISO_SES.SES]: { texto: 'Abrir SES.Hospedajes', url: urlWebSES_() },
}[clave]));

// Fallo de una comunicación (datos, rechazo, reintento o intentos agotados): qué pasó, qué hacer y datos técnicos.
const enviarAvisoSESFallo_ = (comunicacion, aviso, detalle = {}) => {
  const ref = referenciaMostrada_(comunicacion.idReserva);
  const datos = [...datosReservaSES_(comunicacion, detalle), [aviso.motivo, `**${comunicacion.error || 'sin detalle'}**`],
    ...(aviso.plazo ? [['Plazo', `**${aviso.plazo}**`]] : []), ...(aviso.proximo ? [['Próximo intento', `**${aviso.proximo}**`]] : [])];
  return enviarCorreo_('enviarAvisoSESFallo_', { id: comunicacion.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ${aviso.icono} ${aviso.titulo} · Reserva ${ref}`, {
      tono: aviso.tono, etiqueta: aviso.etiqueta, titulo: aviso.cabecera, resumen: aviso.resumen, datos, accion: aviso.accion,
      botones: botonesAvisoSES_(aviso.enlaces), tecnico: tecnicoSES_(comunicacion, detalle.maxIntentos),
    }));
};

// Comunicación registrada por SES (reserva, parte o anulación).
const enviarAvisoSESExito_ = (comunicacion, aviso, detalle = {}) => {
  const ref = referenciaMostrada_(comunicacion.idReserva);
  const codigo = comunicacion.tipo === TIPO_COMUNICACION_SES.ANULACION ? detalle.codigoAnulado : comunicacion.codigo;
  const datos = [...datosReservaSES_(comunicacion, detalle),
    ...(comunicacion.codigo && comunicacion.tipo !== TIPO_COMUNICACION_SES.ANULACION ? [['Código de comunicación', `**${comunicacion.codigo}**`]] : []),
    [comunicacion.tipo === TIPO_COMUNICACION_SES.ANULACION ? 'Lote de anulación' : 'Lote', comunicacion.lote || '—']];
  return enviarCorreo_('enviarAvisoSESExito_', { id: comunicacion.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ✓ ${aviso.titulo} · Reserva ${ref}${codigo ? ` · ${codigo}` : ''}`, {
      tono: 'exito', etiqueta: aviso.etiqueta, titulo: aviso.cabecera, resumen: aviso.resumen, datos, pie: aviso.pie,
    }));
};

// ---------- Recordatorios (F-37, F-40) ----------

// Enlace a la app que abre una acción concreta (doGet la valida contra una lista cerrada).
const urlAccionApp_ = (accion, id) => {
  const base = urlApp_();
  return base ? `${base}?accion=${encodeURIComponent(accion)}&id=${encodeURIComponent(id)}` : '';
};

// F-37: la reserva sigue sin ingresar N días después de la salida; se repite cada N días hasta que se marque.
const enviarRecordatorioIngreso_ = (reserva, dias, destinatarios) => {
  const ref = referenciaMostrada_(reserva.id);
  return enviarCorreo_('enviarRecordatorioIngreso_', { id: reserva.id }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ? ¿Se ha ingresado la reserva ${ref}? · ${reserva.espacio} · ${rangoCortoEmail_(reserva)}`, {
      tono: 'aviso', etiqueta: 'Cobro pendiente', titulo: `¿Se ha ingresado la reserva ${ref}?`,
      resumen: `Han pasado **${dias} días** desde la salida y la reserva sigue como **No ingresada** en KAF Rent.`,
      datos: [['Reserva', `${ref} · ${reserva.nombre}`], ['Espacio', reserva.espacio], ['Canal', reserva.canal],
        ['Estancia', estanciaEmail_(reserva)], ['**Neto esperado**', `**${formatearImporte_(reserva.neto)}**`]],
      accion: 'Si ya está ingresada, pulsa "Sí, se ha ingresado" y confírmalo en la app. Si no, revisa el pago con el canal. Este aviso se repite cada '
        + `${dias} días hasta que la reserva se marque como ingresada.`,
      botones: [{ texto: 'Sí, se ha ingresado', url: urlAccionApp_(ACCION_APP.INGRESO, reserva.id) }, { texto: 'Abrir la reserva', url: urlAccionApp_(ACCION_APP.FICHA, reserva.id) }],
      pie: 'Recibes este email porque tienes rol Gestión o Admin en KAF Rent.',
    }), destinatarios);
};

const TEXTOS_AVISO_CHECKLIST = {
  checkin: { titulo: 'Toca hacer el check-in', cuando: (r) => `Los huéspedes llegan el **${fechaHoraEmail_(r.inicio)}**`, boton: 'Hacer el check-in' },
  checkout: { titulo: 'Toca hacer el check-out', cuando: (r) => `Los huéspedes salen el **${fechaHoraEmail_(r.fin)}**`, boton: 'Hacer el check-out' },
};

// F-40: el check-in (antes de la llegada) o el check-out (tras la salida) sigue sin hacer.
const enviarAvisoChecklist_ = (reserva, momento, destinatarios) => {
  const ref = referenciaMostrada_(reserva.id);
  const textos = TEXTOS_AVISO_CHECKLIST[momento];
  return enviarCorreo_('enviarAvisoChecklist_', { id: reserva.id, momento }, correoConPlantilla_(
    `[${NOMBRE_APP_EMAIL}] ! ${textos.titulo} · ${ref} · ${reserva.espacio}`, {
      tono: 'aviso', etiqueta: 'Checklist pendiente', titulo: `${textos.titulo} de la reserva ${ref}`,
      resumen: `${textos.cuando(reserva)} y el ${momento === 'checkin' ? 'check-in' : 'check-out'} aún no está hecho en KAF Rent.`,
      datos: [['Reserva', `${ref} · ${reserva.nombre}`], ['Espacio', reserva.espacio], ['Estancia', estanciaEmail_(reserva)], ['Huéspedes', personasEmail_(reserva)]],
      accion: 'Abre la checklist desde el botón y márcala punto por punto. Si ya la hiciste en papel, dala por terminada en la app.',
      botones: [{ texto: textos.boton, url: urlAccionApp_(momento, reserva.id) }],
      pie: 'Recibes este email porque tienes rol Gestión o Admin en KAF Rent.',
    }), destinatarios);
};
