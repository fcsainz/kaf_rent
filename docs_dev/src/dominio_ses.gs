// Capa: DOMINIO — comunicación de viajeros a SES.Hospedajes (ADR-0018, DD-02), como funciones PURAS.
// Lectura del Form de viajeros, casado con la reserva, viajero de SES, validación, XML de RH/PV, errores y reintentos.

// ---------- Form de viajeros (DD-02 §3.6, D-37) ----------

// Títulos de las preguntas: [del adulto, del menor]; las comunes, uno solo. Contrato con el Form y su script (ADR-0021).
// Se comparan sin distinguir mayúsculas ni acentos. Un título puede repetirse (p. ej. el nº de documento en la sección
// del DNI y en la del NIE): cada fila es una sola persona, así que vale la columna que tenga respuesta.
const PREGUNTAS_FORM_VIAJEROS = {
  marcaTemporal: ['Marca temporal'], mayorDeEdad: ['¿El huésped tiene la mayoría de edad?'], codigoReserva: ['Código de reserva'],
  nombre: ['Nombre', 'Nombre menor de edad'],
  apellido1: ['Primer Apellido', 'Primer Apellido del menor de edad'],
  apellido2: ['Segundo Apellido', 'Segundo Apellido del menor de edad'],
  fechaNacimiento: ['Fecha de nacimiento', 'Fecha de nacimiento del menor'],
  nacionalidad: ['Nacionalidad', 'Nacionalidad del menor'], sexo: ['Sexo', 'Sexo del menor'],
  direccion: ['Dirección Postal', 'Dirección Postal de menor'], codigoPostal: ['Código Postal', 'Código Postal del menor'],
  municipio: ['Municipio', 'Municipio del menor'], provincia: ['Provincia', 'Provincia del menor'], pais: ['País', 'País del menor'],
  tipoDocumento: ['Tipo de documento', 'Tipo de documento del menor'],
  numeroDocumento: ['Número de documento (DNI o NIE)'], soporte: ['Número de soporte'], pasaporte: ['Número de pasaporte'],
  parentesco: ['¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?'],
  responsable: ['Nombre y Apellidos responsable del menor'],
  telefono: ['Teléfono Móvil'], correo: ['Email'], comunicado: ['Comunicados'], codigoComunicacion: ['Código de comunicación'],
};
const SUFIJO_MENOR = 'Menor';

// { campo: [índices], campoMenor: [índices] }; error con los títulos que falten (riesgo R-22).
const columnasFormViajeros_ = (cabeceras) => {
  const limpias = cabeceras.map(normalizarTexto_);
  const indices = (titulo) => limpias.reduce((acc, c, i) => (c === normalizarTexto_(titulo) ? [...acc, i] : acc), []);
  const pares = Object.entries(PREGUNTAS_FORM_VIAJEROS).flatMap(([campo, [adulto, menor]]) =>
    (menor ? [[campo, adulto], [`${campo}${SUFIJO_MENOR}`, menor]] : [[campo, adulto]]));
  const faltan = pares.filter(([, titulo]) => indices(titulo).length === 0).map(([, titulo]) => `"${titulo}"`);
  if (faltan.length > 0) return invalido_(`El Form de viajeros ha cambiado: faltan las preguntas ${faltan.join(', ')}.`);
  return { valido: true, columnas: Object.fromEntries(pares.map(([campo, titulo]) => [campo, indices(titulo)])) };
};

// D-37 (opción E): el segundo apellido es obligatorio en el Form y quien no tiene escribe un guion.
const sinMarcaDeVacio_ = (valor) => (/^[\s\-–—.]*$/.test(valor) ? '' : valor);

const esRespuestaAfirmativa_ = (valor) => normalizarTexto_(valor).startsWith('si');

// Una fila del Form → respuesta con los datos del adulto o del menor, según la pregunta de mayoría de edad.
const respuestaDesdeFila_ = (fila, columnas, numeroFila) => {
  const valor = (campo) => {
    const indices = columnas[campo] || [];
    const conRespuesta = indices.find((i) => texto_(fila[i]) !== '');
    return fila[conRespuesta === undefined ? indices[0] : conRespuesta];
  };
  const esAdulto = esRespuestaAfirmativa_(valor('mayorDeEdad'));
  const delHuesped = (campo) => valor(esAdulto || !columnas[`${campo}${SUFIJO_MENOR}`] ? campo : `${campo}${SUFIJO_MENOR}`);
  const textoDe = (campo) => texto_(delHuesped(campo));
  return {
    fila: numeroFila, marcaTemporal: valor('marcaTemporal'), esAdulto, codigoReserva: texto_(valor('codigoReserva')),
    nombre: textoDe('nombre'), apellido1: textoDe('apellido1'), apellido2: sinMarcaDeVacio_(textoDe('apellido2')),
    fechaNacimiento: delHuesped('fechaNacimiento'), nacionalidad: textoDe('nacionalidad'), sexo: textoDe('sexo'),
    direccion: textoDe('direccion'), codigoPostal: textoDe('codigoPostal'), municipio: textoDe('municipio'),
    provincia: textoDe('provincia'), pais: textoDe('pais'), tipoDocumento: textoDe('tipoDocumento'),
    numeroDocumento: textoDe('numeroDocumento') || textoDe('pasaporte'), soporte: textoDe('soporte'),
    parentesco: esAdulto ? '' : texto_(valor('parentesco')), responsable: esAdulto ? '' : texto_(valor('responsable')),
    telefono: texto_(valor('telefono')), correo: texto_(valor('correo')), comunicado: texto_(valor('comunicado')),
    codigoComunicacion: texto_(valor('codigoComunicacion')),
  };
};

// ---------- Casado con la reserva ----------

const normalizarCodigoReserva_ = (codigo) => texto_(codigo).toUpperCase().replace(/\s+/g, '');

// `codigos`: código del canal (Ref_Canal) y referencia de KAF Rent (15/26) de la reserva (DD-02 §3.1).
const casarRespuestasConReserva_ = (respuestas, codigos) => {
  const validos = new Set(codigos.map(normalizarCodigoReserva_).filter(Boolean));
  return respuestas.filter((r) => validos.has(normalizarCodigoReserva_(r.codigoReserva)));
};

// D-31: la reserva (RH) se comunica con la primera respuesta, si llega antes del día de entrada.
const debeComunicarRH_ = (respuestasPrevias, marcaTemporal, inicioReserva) =>
  respuestasPrevias.length === 0 && marcaTemporal < inicioDelDia_(inicioReserva);

// ---------- Traducción a códigos de SES ----------

const normalizarTexto_ = (valor) => texto_(valor).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// El Form ofrece las descripciones de Catálogo_SES; se traduce a su código. '' si no está.
// `catalogo`: [{ catalogo, codigo, descripcion }] (hoja Catálogo_SES; incluye PAIS y PROVINCIA, D-37).
const CATALOGO_SES = { SEXO: 'SEXO', TIPO_DOCUMENTO: 'TIPO_DOCUMENTO', PARENTESCO: 'TIPO_PARENTESCO', PAIS: 'PAIS', PROVINCIA: 'PROVINCIA' };

const traducirCodigo_ = (catalogo, tabla, descripcion) => {
  const buscada = normalizarTexto_(descripcion);
  const fila = catalogo.find((c) => c.catalogo === tabla && normalizarTexto_(c.descripcion) === buscada);
  return fila ? texto_(fila.codigo) : '';
};

// El INE escribe "Coruña, A" o "Alacant/Alicante"; el huésped, "A Coruña" o "Alicante". Se aceptan todas las formas.
const RE_ARTICULO_POSPUESTO = /^(.*), (a|o|as|os|el|la|los|las|l'|es|sa|ses|els|les|lo)$/i;
const variantesMunicipio_ = (nombreIne) => [texto_(nombreIne), ...texto_(nombreIne).split('/')].flatMap((parte) => {
  const nombre = parte.trim();
  const pospuesto = nombre.match(RE_ARTICULO_POSPUESTO);
  if (!pospuesto) return [nombre];
  const articulo = pospuesto[2];
  return [nombre, pospuesto[1], articulo.endsWith("'") ? `${articulo}${pospuesto[1]}` : `${articulo} ${pospuesto[1]}`];
}).map(normalizarTexto_);

// `municipios`: [{ provincia, municipio, codigo }] (hoja Municipios_INE). Código INE de 5 dígitos (§4.1 de la especificación).
const codigoMunicipioIne_ = (municipios, provincia, municipio) => {
  const prov = normalizarTexto_(provincia);
  const mun = normalizarTexto_(municipio);
  const encontrado = municipios.find((m) => variantesMunicipio_(m.municipio).includes(mun) && (!prov || normalizarTexto_(m.provincia) === prov));
  return encontrado ? String(encontrado.codigo).padStart(5, '0') : '';
};

const dosCifras_ = (n) => String(n).padStart(2, '0');
const fechaISO_ = (f) => `${f.getFullYear()}-${dosCifras_(f.getMonth() + 1)}-${dosCifras_(f.getDate())}`;
const fechaHoraISO_ = (f) => `${fechaISO_(f)}T${dosCifras_(f.getHours())}:${dosCifras_(f.getMinutes())}:${dosCifras_(f.getSeconds())}`;

// Fecha del Form: Date de Sheets o texto dd/mm/aaaa. '' si no se entiende.
const fechaDelForm_ = (valor) => {
  if (valor instanceof Date && !isNaN(valor.getTime())) return fechaISO_(valor);
  const partes = texto_(valor).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return partes ? `${partes[3]}-${dosCifras_(partes[2])}-${dosCifras_(partes[1])}` : '';
};

const PAIS_ESPANA = 'ESP';

// Opciones del Form anteriores a D-42 (2026-10-02): las respuestas ya enviadas con "DNI" se comunican como NIF.
const TIPO_DOCUMENTO_ANTIGUO = { dni: 'NIF' };

const codigoTipoDocumento_ = (catalogo, descripcion) =>
  traducirCodigo_(catalogo, CATALOGO_SES.TIPO_DOCUMENTO, descripcion) || TIPO_DOCUMENTO_ANTIGUO[normalizarTexto_(descripcion)] || '';

// Respuesta del Form → persona de SES con los códigos traducidos. `tablas`: { catalogo, municipios }.
const viajeroDesdeRespuesta_ = (respuesta, { catalogo, municipios }) => {
  const pais = traducirCodigo_(catalogo, CATALOGO_SES.PAIS, respuesta.pais);
  return {
    fila: respuesta.fila, esAdulto: respuesta.esAdulto, nombre: respuesta.nombre,
    apellido1: respuesta.apellido1, apellido2: respuesta.apellido2,
    // El Form no pide el número al menor: sin número no se envía el tipo (para menores es opcional, §3.1.1.1).
    tipoDocumento: respuesta.esAdulto || respuesta.numeroDocumento ? codigoTipoDocumento_(catalogo, respuesta.tipoDocumento) : '',
    numeroDocumento: respuesta.numeroDocumento.toUpperCase(), soporteDocumento: respuesta.soporte.toUpperCase(),
    fechaNacimiento: fechaDelForm_(respuesta.fechaNacimiento),
    nacionalidad: traducirCodigo_(catalogo, CATALOGO_SES.PAIS, respuesta.nacionalidad),
    sexo: traducirCodigo_(catalogo, CATALOGO_SES.SEXO, respuesta.sexo),
    direccion: {
      direccion: respuesta.direccion, codigoPostal: respuesta.codigoPostal, pais,
      codigoMunicipio: pais === PAIS_ESPANA ? codigoMunicipioIne_(municipios, respuesta.provincia, respuesta.municipio) : '',
      nombreMunicipio: pais === PAIS_ESPANA ? '' : respuesta.municipio,
    },
    telefono: respuesta.telefono, correo: respuesta.correo, responsable: respuesta.responsable,
    parentesco: respuesta.esAdulto ? '' : traducirCodigo_(catalogo, CATALOGO_SES.PARENTESCO, respuesta.parentesco),
  };
};

// ---------- Validación del parte de viajeros (especificación v3.1.3, §3.1.1.1) ----------

// Códigos de TIPO_DOCUMENTO de SES (comprobados en el catálogo de producción el 2026-10-02).
const TIPO_DOCUMENTO_SES = { NIF: 'NIF', NIE: 'NIE' };

// Letra de control del DNI/NIE (algoritmo oficial: número módulo 23; en el NIE, X/Y/Z valen 0/1/2).
const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
const PREFIJOS_NIE = { X: '0', Y: '1', Z: '2' };
const RE_DNI_NIE = /^([XYZ]?)(\d{7,8})([A-Z])$/;

const letraDniNieValida_ = (documento) => {
  const partes = texto_(documento).toUpperCase().match(RE_DNI_NIE);
  if (!partes) return false;
  const numero = Number(`${PREFIJOS_NIE[partes[1]] || ''}${partes[2]}`);
  return LETRAS_DNI[numero % LETRAS_DNI.length] === partes[3];
};

const esDniNie_ = (tipoDocumento) => Object.values(TIPO_DOCUMENTO_SES).includes(tipoDocumento);

const camposQueFaltanPV_ = (v) => [
  [!v.nombre, 'nombre'], [!v.apellido1, 'primer apellido'], [!v.fechaNacimiento, 'fecha de nacimiento'],
  [!v.direccion.direccion, 'dirección'], [!v.direccion.codigoPostal, 'código postal'], [!v.direccion.pais, 'país'],
  [v.direccion.pais === PAIS_ESPANA && !v.direccion.codigoMunicipio, 'municipio (código INE)'],
  [v.direccion.pais && v.direccion.pais !== PAIS_ESPANA && !v.direccion.nombreMunicipio, 'municipio'],
  [!v.telefono && !v.correo, 'teléfono o email'],
  [v.esAdulto && !v.tipoDocumento, 'tipo de documento'], [v.esAdulto && !v.numeroDocumento, 'número de documento'],
  [esDniNie_(v.tipoDocumento) && v.numeroDocumento && !letraDniNieValida_(v.numeroDocumento), 'número de documento válido (revisa la letra)'],
  [esDniNie_(v.tipoDocumento) && !v.soporteDocumento, 'número de soporte'],
  [v.tipoDocumento === TIPO_DOCUMENTO_SES.NIF && !v.apellido2, 'segundo apellido'],
  [!v.esAdulto && !v.parentesco, 'parentesco'],
].filter(([falta]) => falta).map(([, campo]) => campo);

const validarViajeroPV_ = (viajero) => {
  const faltan = camposQueFaltanPV_(viajero);
  return faltan.length === 0 ? valido_() : { valido: false, faltan, error: `${viajero.nombre || 'Huésped'}: falta ${faltan.join(', ')}.` };
};

// El parte necesita al menos un adulto y cada viajero completo.
// D-38: el Form no pide contacto al menor; lleva el de su adulto responsable (el adulto de la reserva cuyo nombre
// coincide con "Nombre y Apellidos responsable del menor" o, si no, el primero con contacto). SES lo exige por persona.
const nombreCompleto_ = (v) => normalizarTexto_([v.nombre, v.apellido1, v.apellido2].filter(Boolean).join(' '));

const adultoResponsable_ = (menor, adultos) => {
  const buscado = normalizarTexto_(menor.responsable);
  const porNombre = buscado ? adultos.find((a) => nombreCompleto_(a).startsWith(buscado) || buscado.startsWith(nombreCompleto_(a))) : null;
  return porNombre || adultos.find((a) => a.telefono || a.correo) || null;
};

const completarContactoMenores_ = (viajeros) => {
  const adultos = viajeros.filter((v) => v.esAdulto);
  return viajeros.map((v) => {
    if (v.esAdulto || v.telefono || v.correo) return v;
    const adulto = adultoResponsable_(v, adultos);
    return adulto ? { ...v, telefono: adulto.telefono, correo: adulto.correo } : v;
  });
};

const validarParteViajeros_ = (viajeros) => {
  if (!viajeros.some((v) => v.esAdulto)) return invalido_('El parte necesita al menos un huésped mayor de edad.');
  const errores = viajeros.map(validarViajeroPV_).filter((v) => !v.valido).map((v) => v.error);
  return errores.length === 0 ? valido_() : { valido: false, error: errores.join(' ') };
};

// La reserva (RH) solo exige del titular nombre, primer apellido y un contacto (§3.1.1.2).
const validarTitularRH_ = (titular) => {
  const faltan = [[!titular.nombre, 'nombre'], [!titular.apellido1, 'primer apellido'], [!titular.telefono && !titular.correo, 'teléfono o email']]
    .filter(([falta]) => falta).map(([, campo]) => campo);
  return faltan.length === 0 ? valido_() : invalido_(`Titular de la reserva: falta ${faltan.join(', ')}.`);
};

// ---------- XML de la solicitud (Anexo I de la especificación) ----------

const NS_PARTE_VIAJEROS = 'http://www.neg.hospedajes.mir.es/altaParteHospedaje';
// No verificado: la especificación no trae el ejemplo de RH; se comprueba en pre-ses (S29).
const NS_RESERVA_HOSPEDAJE = 'http://www.neg.hospedajes.mir.es/altaReservaHospedaje';

const escaparXml_ = (valor) => texto_(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Elemento con valor; vacío si no hay valor (los opcionales no se envían).
const elementoXml_ = (nombre, valor) => (texto_(valor) === '' ? '' : `<${nombre}>${escaparXml_(valor)}</${nombre}>`);

const xmlDireccion_ = (d) => `<direccion>${elementoXml_('direccion', d.direccion)}${elementoXml_('codigoMunicipio', d.codigoMunicipio)}`
  + `${elementoXml_('nombreMunicipio', d.nombreMunicipio)}${elementoXml_('codigoPostal', d.codigoPostal)}${elementoXml_('pais', d.pais)}</direccion>`;

// `contrato`: { referencia, fechaContrato, inicio, fin, numPersonas, tipoPago } con fechas Date.
const xmlContrato_ = (c) => `<contrato>${elementoXml_('referencia', c.referencia)}${elementoXml_('fechaContrato', fechaISO_(c.fechaContrato))}`
  + `${elementoXml_('fechaEntrada', fechaHoraISO_(c.inicio))}${elementoXml_('fechaSalida', fechaHoraISO_(c.fin))}`
  + `${elementoXml_('numPersonas', c.numPersonas)}${elementoXml_('numHabitaciones', 1)}`
  + `<pago>${elementoXml_('tipoPago', c.tipoPago)}</pago></contrato>`;

// Orden de los elementos según el ejemplo de la especificación (el XSD valida la secuencia).
const xmlPersona_ = (p, rol) => `<persona>${elementoXml_('rol', rol)}${elementoXml_('nombre', p.nombre)}`
  + `${elementoXml_('apellido1', p.apellido1)}${elementoXml_('apellido2', p.apellido2)}`
  + `${elementoXml_('tipoDocumento', p.tipoDocumento)}${elementoXml_('numeroDocumento', p.numeroDocumento)}`
  + `${elementoXml_('soporteDocumento', p.soporteDocumento)}${elementoXml_('fechaNacimiento', p.fechaNacimiento)}`
  + `${elementoXml_('nacionalidad', p.nacionalidad)}${elementoXml_('sexo', p.sexo)}`
  + `${p.direccion && p.direccion.direccion ? xmlDireccion_(p.direccion) : ''}`
  + `${elementoXml_('telefono', p.telefono)}${elementoXml_('correo', p.correo)}${elementoXml_('parentesco', p.parentesco)}</persona>`;

const ROL_SES = { TITULAR: 'TI', VIAJERO: 'VI' };

const construirXmlPV_ = ({ codigoEstablecimiento, contrato, viajeros }) =>
  `<?xml version="1.0" encoding="UTF-8"?><alt:peticion xmlns:alt="${NS_PARTE_VIAJEROS}"><solicitud>`
  + `${elementoXml_('codigoEstablecimiento', codigoEstablecimiento)}<comunicacion>${xmlContrato_(contrato)}`
  + `${viajeros.map((v) => xmlPersona_(v, ROL_SES.VIAJERO)).join('')}</comunicacion></solicitud></alt:peticion>`;

// RH con el titular (quien rellenó el primer Form, D-31); sin datos personales que la reserva no exige.
const construirXmlRH_ = ({ codigoEstablecimiento, contrato, titular }) =>
  `<?xml version="1.0" encoding="UTF-8"?><alt:peticion xmlns:alt="${NS_RESERVA_HOSPEDAJE}"><solicitud><comunicacion>`
  + `<establecimiento>${elementoXml_('codigo', codigoEstablecimiento)}</establecimiento>${xmlContrato_(contrato)}`
  + `${xmlPersona_(titular, ROL_SES.TITULAR)}</comunicacion></solicitud></alt:peticion>`;

// ---------- Errores y reintentos (DD-02 §3.5) ----------

const RESULTADO_SES = { OK: 'ok', REINTENTAR: 'reintentar', RECHAZO: 'rechazo' };
const CODIGO_SES_OK = 0;
const CODIGO_SES_NO_CONTROLADO = 10999;
const HTTP_ERROR_SERVIDOR = 500;

// Fallos de red, HTTP 5xx o 10999 se reintentan; el resto repetiría el mismo error.
const clasificarErrorSES_ = ({ errorRed, httpCodigo, codigoSES }) => {
  if (errorRed || numero_(httpCodigo) >= HTTP_ERROR_SERVIDOR) return RESULTADO_SES.REINTENTAR;
  if (texto_(codigoSES) === '') return RESULTADO_SES.RECHAZO; // p. ej. HTTP 401: sin respuesta de SES que leer
  if (Number(codigoSES) === CODIGO_SES_OK) return RESULTADO_SES.OK;
  if (Number(codigoSES) === CODIGO_SES_NO_CONTROLADO) return RESULTADO_SES.REINTENTAR;
  return RESULTADO_SES.RECHAZO;
};

// Manual: el parte (PV) no se pudo enviar y hay que comunicarlo a mano. No comunicada: la reserva (RH) no se pudo
// enviar; solo se informa, porque el trámite que importa es el parte (decisión del usuario, 2026-10-02).
// Anulada: comunicación anulada en SES al cancelar la reserva; Descartada: no llegó a enviarse porque se canceló (ADR-0022).
const ESTADO_COMUNICACION_SES = {
  PENDIENTE: 'Pendiente', ENVIADA: 'Enviada', COMUNICADA: 'Comunicada', RECHAZADA: 'Rechazada', MANUAL: 'Manual', NO_COMUNICADA: 'No comunicada',
  ANULADA: 'Anulada', DESCARTADA: 'Descartada',
};

// Tras un intento fallido reintentable: otro intento en `minutos`, o Manual si era el último.
const proximoIntento_ = (intento, maxIntentos, ahora, minutos) => (intento >= maxIntentos
  ? { estado: ESTADO_COMUNICACION_SES.MANUAL, proximo: null }
  : { estado: ESTADO_COMUNICACION_SES.PENDIENTE, proximo: new Date(ahora.getTime() + minutos * MS_POR_MINUTO) });

const MS_POR_MINUTO = 60 * 1000;

// ---------- Solicitud completa a partir de la reserva y del Form (S27) ----------

// Contrato de SES desde la reserva: referencia = ID interno; fecha de contrato = la de registro en KAF Rent.
const contratoSES_ = (reserva, tipoPago) => ({
  referencia: reserva.id,
  fechaContrato: esFechaValida_(reserva.fechaRegistro) ? reserva.fechaRegistro : reserva.inicio,
  inicio: reserva.inicio, fin: reserva.fin, numPersonas: numero_(reserva.adultos) + numero_(reserva.menores), tipoPago,
});

// AN: anulación de una comunicación ya hecha (operación B de SES, ADR-0022); no es un tipo de comunicación de SES.
const TIPO_COMUNICACION_SES = { RESERVA: 'RH', PARTE: 'PV', ANULACION: 'AN' };

// { valido, xml } o { valido: false, error }. RH: el titular es la primera respuesta (D-31); PV: todos, con el
// contacto del adulto en los menores (D-38).
const prepararSolicitudSES_ = ({ tipo, reserva, respuestas, tablas, codigoEstablecimiento, tipoPago }) => {
  if (respuestas.length === 0) return invalido_('No hay respuestas del Form para esta comunicación.');
  const contrato = contratoSES_(reserva, tipoPago);
  if (tipo === TIPO_COMUNICACION_SES.RESERVA) {
    const titular = viajeroDesdeRespuesta_(respuestas[0], tablas);
    const validacion = validarTitularRH_(titular);
    return validacion.valido ? { valido: true, xml: construirXmlRH_({ codigoEstablecimiento, contrato, titular }) } : validacion;
  }
  const viajeros = completarContactoMenores_(respuestas.map((r) => viajeroDesdeRespuesta_(r, tablas)));
  const validacion = validarParteViajeros_(viajeros);
  return validacion.valido ? { valido: true, xml: construirXmlPV_({ codigoEstablecimiento, contrato, viajeros }) } : validacion;
};

// ---------- Mensajes SOAP (Anexos I y II de la especificación) ----------

const NS_SOAP_ENVELOPE = 'http://schemas.xmlsoap.org/soap/envelope/';
const NS_SOAP_COMUNICACION = 'http://www.soap.servicios.hospedajes.mir.es/comunicacion';
const OPERACION_SES = { ALTA: 'A', ANULACION: 'B' };
const NS_ANULACION = 'http://www.neg.hospedajes.mir.es/anularComunicacion';

// Solicitud de anulación (Anexo III): los códigos de comunicación que se anulan.
const construirXmlAnulacion_ = (codigos) => `<?xml version="1.0" encoding="UTF-8"?><anul:comunicaciones xmlns:anul="${NS_ANULACION}">`
  + `${codigos.map((c) => `<anul:codigoComunicacion>${escaparXml_(c)}</anul:codigoComunicacion>`).join('')}</anul:comunicaciones>`;

const sobreSOAP_ = (cuerpo) => `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="${NS_SOAP_ENVELOPE}" `
  + `xmlns:com="${NS_SOAP_COMUNICACION}"><soapenv:Header/><soapenv:Body>${cuerpo}</soapenv:Body></soapenv:Envelope>`;

// Alta (A, con tipo de comunicación) o anulación (B, sin él).
const construirSobreComunicacion_ = ({ codigoArrendador, aplicacion, tipoOperacion = OPERACION_SES.ALTA, tipoComunicacion = '', solicitudBase64 }) => sobreSOAP_(
  `<com:comunicacionRequest><peticion><cabecera>${elementoXml_('codigoArrendador', codigoArrendador)}`
  + `${elementoXml_('aplicacion', aplicacion)}${elementoXml_('tipoOperacion', tipoOperacion)}`
  + `${elementoXml_('tipoComunicacion', tipoComunicacion)}</cabecera>${elementoXml_('solicitud', solicitudBase64)}</peticion></com:comunicacionRequest>`);

// No verificado: la especificación da estos esquemas en figuras; se comprueban en pre-ses (S29).
const construirSobreConsultaLote_ = (lotes) => sobreSOAP_(
  `<com:consultaLoteRequest><codigosLote>${lotes.map((l) => elementoXml_('lote', l)).join('')}</codigosLote></com:consultaLoteRequest>`);

const construirSobreCatalogo_ = (catalogo) => sobreSOAP_(`<com:catalogoRequest><peticion>${elementoXml_('catalogo', catalogo)}</peticion></com:catalogoRequest>`);

// Lectura de respuestas por nombre de etiqueta, sin depender del prefijo del espacio de nombres.
const desescaparXml_ = (t) => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const bloquesXml_ = (xml, etiqueta) => [...String(xml)
  .matchAll(new RegExp(`<(?:[\\w-]+:)?${etiqueta}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${etiqueta}>`, 'g'))].map((m) => m[1]);

const valorXml_ = (xml, etiqueta) => {
  const [bloque] = bloquesXml_(xml, etiqueta);
  return bloque === undefined ? '' : desescaparXml_(bloque.trim());
};

const leerRespuestaAlta_ = (xml) => ({
  codigoSES: valorXml_(xml, 'codigoRetorno') || valorXml_(xml, 'codigo'), descripcion: valorXml_(xml, 'descripcion'), lote: valorXml_(xml, 'lote'),
});

// La especificación escribe la etiqueta del resultado de dos formas (resultadoComunicacion / resutadoComunicacion).
const comunicacionesDeLote_ = (bloque) => [...bloquesXml_(bloque, 'resultadoComunicacion'), ...bloquesXml_(bloque, 'resutadoComunicacion')]
  .map((c) => ({ orden: Number(valorXml_(c, 'orden')), codigoComunicacion: valorXml_(c, 'codigoComunicacion'), tipoError: valorXml_(c, 'tipoError'), error: valorXml_(c, 'error') }));

const leerRespuestaLote_ = (xml) => ({
  codigoSES: valorXml_(xml, 'codigo'), descripcion: valorXml_(xml, 'descripcion'),
  lotes: bloquesXml_(xml, 'resultado').map((r) => ({
    lote: valorXml_(r, 'lote'), codigoEstado: Number(valorXml_(r, 'codigoEstado')), descEstado: valorXml_(r, 'descEstado'),
    comunicaciones: comunicacionesDeLote_(r),
  })),
});

const leerRespuestaCatalogo_ = (xml) => ({
  codigoSES: valorXml_(xml, 'codigo'), descripcion: valorXml_(xml, 'descripcion'),
  tuplas: bloquesXml_(xml, 'tupla').map((t) => ({ codigo: valorXml_(t, 'codigo'), descripcion: valorXml_(t, 'descripcion') })),
});

// Estado de un lote (§3.2.2): 1 tramitado · 2 error de cabecera · 3 error inesperado · 4 en proceso · 5 pendiente · 6 con errores.
const ESTADO_LOTE_SES = { TRAMITADO: 1, ERROR_CABECERA: 2, ERROR_INESPERADO: 3, EN_PROCESO: 4, PENDIENTE: 5, CON_ERRORES: 6 };
const RESULTADO_LOTE = { COMUNICADA: 'comunicada', RECHAZADA: 'rechazada', ESPERAR: 'esperar', REINTENTAR: 'reintentar' };

// Cada lote de KAF Rent lleva una sola comunicación (orden 1). Una anulación tramitada puede no devolver código.
const interpretarLote_ = (lote, { exigeCodigo = true } = {}) => {
  if (!lote) return { resultado: RESULTADO_LOTE.ESPERAR };
  const [comunicacion = {}] = lote.comunicaciones;
  if ([ESTADO_LOTE_SES.EN_PROCESO, ESTADO_LOTE_SES.PENDIENTE].includes(lote.codigoEstado)) return { resultado: RESULTADO_LOTE.ESPERAR };
  if (lote.codigoEstado === ESTADO_LOTE_SES.ERROR_INESPERADO) return { resultado: RESULTADO_LOTE.REINTENTAR, error: lote.descEstado };
  if (lote.codigoEstado === ESTADO_LOTE_SES.TRAMITADO && (comunicacion.codigoComunicacion || (!exigeCodigo && !comunicacion.error))) {
    return { resultado: RESULTADO_LOTE.COMUNICADA, codigoComunicacion: comunicacion.codigoComunicacion };
  }
  return { resultado: RESULTADO_LOTE.RECHAZADA, error: comunicacion.error || lote.descEstado || 'SES rechazó la comunicación sin detallar el motivo.' };
};

// ---------- Reglas de la tarea de comunicación (S27) ----------

// RF-78: "Completado" cuando hay tantos Forms casados como Adultos + Menores.
const ESTADO_REGISTRO_VIAJEROS_COMPLETO = 'Completado';
const estadoRegistroViajeros_ = (formsCasados, personas) => (formsCasados >= personas ? ESTADO_REGISTRO_VIAJEROS_COMPLETO : REVISION.PENDIENTE);

// Texto del fallo para la hoja y los avisos: lo que dijo SES o por qué no hubo respuesta.
const describirFalloSES_ = ({ errorRed, httpCodigo, codigoSES, descripcion }) => {
  if (errorRed) return `Sin conexión con SES: ${errorRed}`;
  return [`HTTP ${httpCodigo || '—'}`, texto_(codigoSES) && `código ${codigoSES}`, texto_(descripcion)].filter(Boolean).join(' · ');
};

// Tras un fallo reintentable: estado y próximo intento (DD-02 §3.5). Agotados los intentos, el parte pasa a Manual
// y la reserva a No comunicada.
const trasFalloReintentable_ = (tipo, intento, maxIntentos, ahora, minutos) => {
  const { estado, proximo } = proximoIntento_(intento, maxIntentos, ahora, minutos);
  const final = estado === ESTADO_COMUNICACION_SES.MANUAL && tipo === TIPO_COMUNICACION_SES.RESERVA ? ESTADO_COMUNICACION_SES.NO_COMUNICADA : estado;
  return { estado: final, proximoIntento: proximo };
};

// Al cancelar la reserva (ADR-0022): lo pendiente no se envía; lo enviado o comunicado se anula. Una sola anulación por comunicación.
const planAnulacionAlCancelar_ = (comunicaciones) => {
  const yaAnuladas = new Set(comunicaciones.filter((c) => c.tipo === TIPO_COMUNICACION_SES.ANULACION).map((c) => c.anulaA));
  return comunicaciones
    .filter((c) => c.tipo !== TIPO_COMUNICACION_SES.ANULACION && !yaAnuladas.has(c.id))
    .map((c) => {
      if (c.estado === ESTADO_COMUNICACION_SES.PENDIENTE) return { accion: 'descartar', id: c.id };
      if ([ESTADO_COMUNICACION_SES.ENVIADA, ESTADO_COMUNICACION_SES.COMUNICADA].includes(c.estado)) return { accion: 'anular', id: c.id };
      return null;
    })
    .filter(Boolean);
};

// Aviso que se añade a la confirmación de cancelar una reserva con comunicaciones a SES.
const avisoCancelacionSES_ = (comunicaciones) => {
  const vivas = comunicaciones.filter((c) => c.tipo !== TIPO_COMUNICACION_SES.ANULACION);
  const codigos = vivas.filter((c) => c.estado === ESTADO_COMUNICACION_SES.COMUNICADA).map((c) => c.codigo).filter(Boolean);
  const enCurso = vivas.some((c) => c.estado === ESTADO_COMUNICACION_SES.ENVIADA);
  if (codigos.length > 0) return `Esta reserva está comunicada a SES.Hospedajes (código ${codigos.join(', ')}). Al cancelarla se anulará también en SES.`;
  if (enCurso) return 'Esta reserva se está comunicando a SES.Hospedajes. Al cancelarla se anulará en SES en cuanto quede comunicada.';
  return '';
};

// ---------- Avisos por email (DD-02 §3.5; maquetas aprobadas en docs_work/emails_propuesta/) ----------

// Por qué se avisa: faltan datos (no se envía), SES rechaza, fallo con reintento o se agotan los intentos.
const CAUSA_AVISO_SES = { DATOS: 'datos', RECHAZO: 'rechazo', REINTENTO: 'reintento', AGOTADO: 'agotado' };
const TRAMITE_AVISO_SES = { RH: 'SES Reserva', PV: 'SES Huéspedes', AN: 'SES Anulación' };
const RECHAZADO_POR_SES = { RH: 'rechazada por SES', PV: 'rechazado por SES', AN: 'rechazada por SES' };
const AGOTADO_SES = { RH: 'no comunicada', PV: 'comunicar a mano', AN: 'anular a mano' };
const ACCION_REINTENTO_SES = 'No hace falta hacer nada: KAF Rent lo vuelve a intentar solo y te avisará del resultado.';
const NOMBRE_TRAMITE_REINTENTO = { RH: 'La reserva no se ha comunicado', PV: 'El parte de huéspedes no se ha comunicado', AN: 'La anulación no se ha enviado' };
const PLAZO_ANULACION_SES = '24 h desde la cancelación';
// Botones del email por clave; la infraestructura pone las URL.
const ENLACE_AVISO_SES = { SHEET: 'sheet', APP: 'app', SES: 'ses' };

const horaMinutos_ = (f) => `${dosCifras_(f.getHours())}:${dosCifras_(f.getMinutes())}`;
const plazoParteTexto_ = (inicio) => {
  const plazo = plazoParte_(inicio);
  return `hasta el ${fechaParaHuesped_(plazo)} a las ${horaMinutos_(plazo)}`;
};

// Una anulación no lleva datos del huésped: si faltara algo, se avisa como un rechazo.
const anulacionRechazadaSES_ = (d) => ({ etiqueta: 'No anulada', cabecera: 'SES no ha aceptado la anulación', motivo: 'Motivo de SES', plazo: PLAZO_ANULACION_SES,
  resumen: `La reserva **${d.ref}** está cancelada en KAF Rent, pero SES no ha anulado la comunicación **${d.codigoAnulado}**. Sigue constando como válida en SES.`,
  accion: `Anula la comunicación a mano en la web de SES.Hospedajes con el código ${d.codigoAnulado}.`,
  enlaces: [ENLACE_AVISO_SES.SES, ENLACE_AVISO_SES.SHEET] });

// Textos de cada trámite y causa. `d`: { ref, codigoAnulado, filas, maxIntentos } (lo prepara avisoSES_).
const TEXTOS_AVISO_SES = {
  RH: {
    datos: (d) => ({ etiqueta: 'No comunicada', cabecera: 'La reserva no se ha comunicado: faltan datos', motivo: 'Qué falta',
      resumen: `Al preparar la comunicación de la reserva **${d.ref}** falta un dato obligatorio. No se ha enviado nada a SES.`,
      accion: 'Completa el dato en la fila del titular en el Sheet del Form antes de la llegada. No hace falta comunicar la reserva a mano: el trámite que importa es el parte de huéspedes del check-in.' }),
    rechazo: (d) => ({ etiqueta: 'Rechazada', cabecera: 'SES ha rechazado la comunicación de la reserva', motivo: 'Motivo de SES',
      resumen: `SES.Hospedajes no ha aceptado un dato de la reserva **${d.ref}**. Repetir el envío daría el mismo error, así que no se reintenta.`,
      accion: 'Corrige el dato en el Sheet del Form antes de la llegada. No hace falta comunicar la reserva a mano.' }),
    agotado: (d) => ({ etiqueta: 'Solo informativo', cabecera: 'La reserva no se ha podido comunicar', motivo: 'Último fallo',
      resumen: `SES.Hospedajes no ha respondido en ${d.maxIntentos} intentos. La reserva **${d.ref}** queda como "No comunicada".`,
      accion: 'No hace falta hacer nada: el trámite que importa es el parte de huéspedes, que se comunicará en el check-in.', enlaces: [] }),
  },
  PV: {
    datos: (d) => ({ etiqueta: 'No comunicado', cabecera: 'El parte no se ha comunicado: faltan datos', motivo: 'Qué falta', plazoLegal: true,
      resumen: `Al preparar el parte de la reserva **${d.ref}** falta un dato obligatorio. No se ha enviado nada a SES. Plazo legal: 24 h desde la llegada.`,
      accion: 'Corrige el dato en el Sheet del Form y vuelve a pulsar "Comunicar a SES" en la reserva. Si no llegas a tiempo, comunícalo a mano.',
      enlaces: [ENLACE_AVISO_SES.SHEET, ENLACE_AVISO_SES.APP, ENLACE_AVISO_SES.SES] }),
    rechazo: (d) => ({ etiqueta: 'Rechazado', cabecera: 'SES ha rechazado el parte de huéspedes', motivo: 'Motivo de SES', plazoLegal: true,
      resumen: `SES.Hospedajes no ha aceptado un dato del parte de la reserva **${d.ref}**. No se reintenta. Plazo legal: 24 h desde la llegada.`,
      accion: 'Corrige el dato en el Sheet del Form y vuelve a comunicar desde la reserva, o comunícalo a mano en SES con los datos del Sheet.',
      enlaces: [ENLACE_AVISO_SES.SHEET, ENLACE_AVISO_SES.APP, ENLACE_AVISO_SES.SES] }),
    agotado: (d) => ({ etiqueta: 'Comunicar a mano', cabecera: 'El parte de huéspedes no se ha podido enviar a SES', motivo: 'Último fallo', plazoLegal: true,
      resumen: `Tras ${d.maxIntentos} intentos SES.Hospedajes no ha respondido. El parte de la reserva **${d.ref}** no consta como comunicado.`,
      accion: `Abre el Sheet del Form (filas ${d.filas}) para tener los datos de los huéspedes y comunica el parte en la web de SES.Hospedajes. Después marca "Comunicados" en esas filas.`,
      enlaces: [ENLACE_AVISO_SES.SES, ENLACE_AVISO_SES.SHEET] }),
  },
  AN: {
    datos: anulacionRechazadaSES_,
    rechazo: anulacionRechazadaSES_,
    agotado: (d) => ({ etiqueta: 'Anular a mano', cabecera: 'La anulación no se ha podido enviar a SES', motivo: 'Último fallo', plazo: PLAZO_ANULACION_SES,
      resumen: `Tras ${d.maxIntentos} intentos SES.Hospedajes no ha respondido. La reserva **${d.ref}** está cancelada en KAF Rent pero sigue comunicada en SES.`,
      accion: `Anula la comunicación a mano en la web de SES.Hospedajes con el código ${d.codigoAnulado}. Después marca "Anulación SES" en el Sheet del Form.`,
      enlaces: [ENLACE_AVISO_SES.SES, ENLACE_AVISO_SES.SHEET] }),
  },
};

const quedanIntentos_ = (n) => (n === 1 ? 'queda 1 intento' : `quedan ${n} intentos`);

const textosReintentoSES_ = (c, d) => {
  const proximo = c.proximoIntento ? horaMinutos_(c.proximoIntento) : '—';
  return {
    etiqueta: 'Reintentando', cabecera: `${NOMBRE_TRAMITE_REINTENTO[c.tipo]} todavía: SES no ha respondido, se reintentará`, motivo: 'Fallo',
    resumen: `El ${c.intento}º intento ha fallado por un problema de conexión con SES.Hospedajes. KAF Rent lo volverá a intentar a las ${proximo} (${quedanIntentos_(d.maxIntentos - c.intento)}).`,
    accion: ACCION_REINTENTO_SES, proximo: `${proximo} (${c.intento + 1}º de ${d.maxIntentos})`, enlaces: [],
  };
};

// Aviso de un fallo: asunto (título + icono), tono y contenido del email. `detalle`: { codigoAnulado, maxIntentos, inicio }.
const avisoSES_ = (comunicacion, causa, detalle = {}) => {
  const { tipo, intento, proximoIntento } = comunicacion;
  const n = `${intento}º intento`;
  const resultados = {
    [CAUSA_AVISO_SES.DATOS]: `${n} · datos que corregir`,
    [CAUSA_AVISO_SES.RECHAZO]: `${n} · ${RECHAZADO_POR_SES[tipo]}`,
    [CAUSA_AVISO_SES.REINTENTO]: `${n} fallido · reintento a las ${proximoIntento ? horaMinutos_(proximoIntento) : '—'}`,
    [CAUSA_AVISO_SES.AGOTADO]: `${n} · ${AGOTADO_SES[tipo]}`,
  };
  const informativo = causa === CAUSA_AVISO_SES.REINTENTO || (causa === CAUSA_AVISO_SES.AGOTADO && tipo === TIPO_COMUNICACION_SES.RESERVA);
  const d = { maxIntentos: intento, ...detalle, ref: referenciaMostrada_(comunicacion.idReserva), filas: (comunicacion.filasForm || []).join(', ') };
  const textos = causa === CAUSA_AVISO_SES.REINTENTO ? textosReintentoSES_(comunicacion, d) : TEXTOS_AVISO_SES[tipo][causa](d);
  return {
    enlaces: [ENLACE_AVISO_SES.SHEET, ENLACE_AVISO_SES.APP], ...textos,
    titulo: `${TRAMITE_AVISO_SES[tipo]}: ${resultados[causa]}`, icono: informativo ? '!' : '✕', tono: informativo ? 'aviso' : 'error',
    plazo: textos.plazoLegal && detalle.inicio ? plazoParteTexto_(detalle.inicio) : textos.plazo,
  };
};

// Aviso de éxito: reserva comunicada, parte comunicado o comunicación anulada.
const avisoSESExito_ = (comunicacion, detalle = {}) => {
  const ref = referenciaMostrada_(comunicacion.idReserva);
  const textos = {
    RH: { titulo: 'SES Reserva: comunicada', etiqueta: 'Comunicada a SES', cabecera: 'Reserva comunicada a SES.Hospedajes',
      resumen: `SES ha registrado la reserva **${ref}**. No hay que hacer nada más: el parte de huéspedes se comunicará en el check-in.`,
      pie: 'Anotado en el Sheet del Form (Reserva comunicada, Lote reserva, Código, Fecha y Usuario).' },
    PV: { titulo: 'SES Huéspedes: parte comunicado', etiqueta: 'Comunicado a SES', cabecera: 'Parte de huéspedes comunicado',
      resumen: `SES.Hospedajes ha registrado el parte de la reserva **${ref}**. Trámite cumplido.`,
      pie: 'Anotado en el Sheet del Form (Comunicados, Usuario, Tipo_Comunicación = Automática, Fecha, Código y Lote).' },
    AN: { titulo: 'SES Anulación: reserva anulada', etiqueta: 'Anulada en SES', cabecera: 'Comunicación anulada en SES.Hospedajes',
      resumen: `La reserva **${ref}** se canceló en KAF Rent y SES ha anulado su comunicación${detalle.codigoAnulado ? ` ${detalle.codigoAnulado}` : ''}. No hay que hacer nada más.`,
      pie: 'Anotado en el Sheet del Form (Anulación SES, Lote anulación, Fecha y Usuario).' },
  };
  return textos[comunicacion.tipo];
};

// ---------- Comprobación de la conexión (F-30) ----------

const HTTP_SIN_PERMISO = [401, 403];
const MARCA_URL_PRUEBAS_SES = 'pre-ses';

const entornoSES_ = (url) => (texto_(url).includes(MARCA_URL_PRUEBAS_SES) ? 'pruebas (pre-ses)' : 'producción');

// Qué significa la respuesta a una consulta de catálogo, en una frase para el usuario: { ok, mensaje }.
const diagnosticoConexionSES_ = ({ hayCredenciales, url, respuesta }) => {
  const entorno = `Entorno: ${entornoSES_(url)}.`;
  if (!texto_(url)) return { ok: false, mensaje: 'Falta la dirección del servicio de SES (Config → SES_Url).' };
  if (!hayCredenciales) return { ok: false, mensaje: `Faltan el usuario o la contraseña de SES en las Propiedades del script (SES_USUARIO, SES_CONTRASENA). ${entorno}` };
  if (respuesta.errorRed) return { ok: false, mensaje: `SES no responde: ${respuesta.errorRed}. Vuelve a probar en unos minutos. ${entorno}` };
  if (HTTP_SIN_PERMISO.includes(numero_(respuesta.httpCodigo))) {
    return { ok: false, mensaje: `SES rechaza el usuario o la contraseña (HTTP ${respuesta.httpCodigo}). Revisa las Propiedades del script y que las credenciales sean de este entorno. ${entorno}` };
  }
  if (clasificarErrorSES_(respuesta) === RESULTADO_SES.OK && (respuesta.tuplas || []).length > 0) {
    return { ok: true, mensaje: `Conexión con SES correcta: ha respondido con ${respuesta.tuplas.length} tipos de documento. ${entorno}` };
  }
  return { ok: false, mensaje: `SES ha respondido de forma inesperada (${describirFalloSES_(respuesta)}). ${entorno}` };
};

// ---------- Mensaje de WhatsApp para el huésped (F-27) ----------

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MARCA_CODIGO_ENLACE = '{codigo}';
const PREFIJO_TELEFONO_ESPANA = '34';
const LONGITUD_TELEFONO_ESPANA = 9;

const fechaParaHuesped_ = (f) => `${DIAS_SEMANA[f.getDay()]} ${dosCifras_(f.getDate())}/${dosCifras_(f.getMonth() + 1)}`;

// El del canal (Airbnb…) o, si no hay, la referencia de KAF Rent: es el que casa el Form con la reserva (RF-76).
const codigoReservaHuesped_ = (reserva) => texto_(reserva.refCanal) || referenciaMostrada_(reserva.id);

// Enlace prerrellenado del Form: la plantilla de Config lleva {codigo} en el lugar del código de reserva.
const enlaceFormHuesped_ = (plantilla, codigo) => texto_(plantilla).replace(MARCA_CODIGO_ENLACE, encodeURIComponent(codigo));

// Texto aprobado por el usuario (2026-10-03): sin saludo (la conversación ya está empezada), sin emojis
// (WhatsApp los mostraba como "�") y un párrafo por línea, separados por una línea en blanco.
const mensajeHuesped_ = ({ reserva, plantillaEnlace }) => {
  const codigo = codigoReservaHuesped_(reserva);
  return [
    `Antes de tu llegada el ${fechaParaHuesped_(reserva.inicio)}, la ley española (RD 933/2021) nos obliga a registrar a todos los huéspedes ante el Ministerio del Interior.`,
    'Rellena un formulario por persona (menores incluidos; el de un menor lo rellena un adulto):',
    enlaceFormHuesped_(plantillaEnlace, codigo),
    `El código de tu reserva (${codigo}).`,
    'Tardas unos 3 minutos.',
    'Al llegar comprobaremos los documentos en persona.',
    'Cualquier duda, me dices.',
  ].join('\n\n');
};

// Enlace de WhatsApp con el texto escrito; '' si la reserva no tiene teléfono (entonces se copia el texto).
const enlaceWhatsApp_ = (telefono, texto) => {
  const digitos = texto_(telefono).replace(/\D/g, '');
  if (!digitos) return '';
  const numero = digitos.length === LONGITUD_TELEFONO_ESPANA ? `${PREFIJO_TELEFONO_ESPANA}${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
};

// ---------- Validar identidades y comunicar el parte (F-28, S28) ----------

const HORAS_PLAZO_PARTE = 24;
const MS_POR_HORA = 60 * 60 * 1000;

// Plazo legal del parte: 24 h desde la llegada (Art. 6.3 b del RD 933/2021).
const plazoParte_ = (inicio) => new Date(inicio.getTime() + HORAS_PLAZO_PARTE * MS_POR_HORA);

const edadEn_ = (fechaISO, ahora) => {
  const [anyo, mes, dia] = texto_(fechaISO).split('-').map(Number);
  if (!anyo) return null;
  const cumplidos = ahora.getMonth() + 1 > mes || (ahora.getMonth() + 1 === mes && ahora.getDate() >= dia);
  return ahora.getFullYear() - anyo - (cumplidos ? 0 : 1);
};

// Lo último de cada trámite de la reserva (sin contar anulaciones): estado y código.
const estadoSESDeReserva_ = (comunicaciones) => {
  const ultima = (tipo) => comunicaciones.filter((c) => c.tipo === tipo).slice(-1)[0] || null;
  const resumen = (c) => (c ? { estado: c.estado, codigo: c.codigo || '', error: c.error || '' } : null);
  return { reserva: resumen(ultima(TIPO_COMUNICACION_SES.RESERVA)), parte: resumen(ultima(TIPO_COMUNICACION_SES.PARTE)) };
};

// D-45: un parte comunicado a mano solo consta en el Sheet del Form (casilla "Comunicados" y su código).
// Basta con una respuesta de la reserva marcada como comunicada.
const parteComunicadoEnForm_ = (respuestasCasadas) => {
  const comunicada = respuestasCasadas.find((r) => esVerdadero_(r.comunicado));
  return comunicada ? { comunicado: true, codigo: texto_(comunicada.codigoComunicacion) } : { comunicado: false, codigo: '' };
};

// D-45: el parte comunicado a mano cuenta como comunicado en toda la app, salvo que la app ya lo haya comunicado.
const parteConManual_ = (parteApp, manual) => {
  if ((parteApp && parteApp.estado === ESTADO_COMUNICACION_SES.COMUNICADA) || !manual.comunicado) return parteApp;
  return { estado: ESTADO_COMUNICACION_SES.COMUNICADA, codigo: manual.codigo, error: '', manual: true };
};

// Un parte enviado o comunicado no se vuelve a comunicar desde la app (si falla, se avisa y se decide).
const ESTADOS_PARTE_EN_CURSO = [ESTADO_COMUNICACION_SES.PENDIENTE, ESTADO_COMUNICACION_SES.ENVIADA, ESTADO_COMUNICACION_SES.COMUNICADA];

// Política del usuario (2026-10-02): sin todos los formularios validados no se comunica (ni se entra en la finca).
const resumenRegistro_ = ({ personas, filasCasadas, filasValidadas, parte }) => {
  const validados = filasCasadas.filter((f) => filasValidadas.includes(f)).length;
  const enCurso = Boolean(parte && ESTADOS_PARTE_EN_CURSO.includes(parte.estado));
  return {
    personas, formularios: filasCasadas.length, validados,
    faltanFormularios: Math.max(0, personas - filasCasadas.length),
    puedeComunicar: filasCasadas.length >= personas && personas > 0 && validados === filasCasadas.length && !enCurso,
  };
};

// Ficha de un huésped para validarlo en persona: lo que se coteja con el documento y lo que falta corregir.
const fichaHuesped_ = (respuesta, viajero, validacion, ahora) => {
  const edad = edadEn_(viajero.fechaNacimiento, ahora);
  const faltan = camposQueFaltanPV_(viajero);
  return {
    fila: respuesta.fila,
    nombre: [viajero.nombre, viajero.apellido1, viajero.apellido2].filter(Boolean).join(' '),
    esAdulto: viajero.esAdulto, edad, parentesco: respuesta.parentesco,
    documento: [respuesta.tipoDocumento, viajero.numeroDocumento].filter(Boolean).join(' ') || 'No tiene',
    soporte: viajero.soporteDocumento, nacionalidad: respuesta.nacionalidad,
    domicilio: [respuesta.direccion, respuesta.codigoPostal, respuesta.municipio].filter(Boolean).join(' · '),
    provincia: respuesta.provincia,
    faltaMunicipio: faltan.includes('municipio (código INE)'),
    otrosFaltan: faltan.filter((f) => f !== 'municipio (código INE)'),
    validado: validacion ? { por: validacion.validadoPor, fecha: validacion.fecha } : null,
  };
};

// Municipios de una provincia para elegir cuando el escrito no está en el INE (F-28).
const municipiosDeProvincia_ = (municipios, provincia) => {
  const buscada = normalizarTexto_(provincia);
  return municipios
    .filter((m) => buscada && normalizarTexto_(m.provincia) === buscada)
    .map((m) => ({ codigo: String(m.codigo).padStart(5, '0'), nombre: m.municipio }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};
