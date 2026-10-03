// Tests unitarios del dominio de SES.Hospedajes (ADR-0018, DD-02 §3.3): funciones puras, sin dobles de Google.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno } = require('../soporte/gas');
const { CABECERAS_FORM, filaAdulto, filaMenor, CATALOGO, MUNICIPIOS } = require('../soporte/form_viajeros');

const { fn } = crearEntorno();
const plano = (v) => JSON.parse(JSON.stringify(v));
const tablas = { catalogo: CATALOGO, municipios: MUNICIPIOS };
const columnas = () => fn('columnasFormViajeros_')(CABECERAS_FORM).columnas;
const respuesta = (filaForm, n = 2) => fn('respuestaDesdeFila_')(filaForm, columnas(), n);
const viajero = (filaForm) => fn('viajeroDesdeRespuesta_')(respuesta(filaForm), tablas);

test.describe('DD-02 · lectura del Form de viajeros', () => {
  test('D-37 · lee cada pregunta por su título, sin depender del orden ni de las columnas retiradas', () => {
    const r = fn('columnasFormViajeros_')(CABECERAS_FORM);
    assert.equal(r.valido, true);
    assert.deepEqual(plano(r.columnas.codigoReserva), [CABECERAS_FORM.indexOf('Código de reserva')]);
    assert.deepEqual(plano(r.columnas.soporte), [29, 31], 'el título repetido da sus dos columnas');
    const conEspacioFinal = CABECERAS_FORM.findIndex((c) => c.startsWith('¿Cuál es su relación'));
    assert.deepEqual(plano(r.columnas.parentesco), [conEspacioFinal], 'el título con espacio final también vale');
    const desordenadas = [...CABECERAS_FORM].reverse();
    assert.deepEqual(plano(fn('columnasFormViajeros_')(desordenadas).columnas.nombre), [desordenadas.indexOf('Nombre')]);
    const enMinusculas = CABECERAS_FORM.map((c) => c.toLowerCase());
    assert.equal(fn('columnasFormViajeros_')(enMinusculas).valido, true, 'sin distinguir mayúsculas');
  });

  test('R-22 · si falta una pregunta, lo dice con su texto', () => {
    const sinSexo = CABECERAS_FORM.map((c) => (c === 'Sexo del menor' ? 'Género del menor' : c));
    const r = fn('columnasFormViajeros_')(sinSexo);
    assert.equal(r.valido, false);
    assert.match(r.error, /"Sexo del menor"/);
  });

  test('una fila de adulto toma las columnas del adulto', () => {
    const r = respuesta(filaAdulto(), 7);
    assert.equal(r.fila, 7);
    assert.equal(r.esAdulto, true);
    assert.equal(r.codigoReserva, 'hm test 1234');
    assert.deepEqual([r.apellido1, r.apellido2], ['García', 'de la Fuente']);
    assert.equal(r.numeroDocumento, '12345678Z');
    assert.equal(r.soporte, 'ABC123456');
  });

  test('una fila de menor toma las columnas del menor y su parentesco', () => {
    const r = respuesta(filaMenor());
    assert.equal(r.esAdulto, false);
    assert.deepEqual([r.nombre, r.apellido1, r.apellido2, r.parentesco, r.codigoReserva], ['Leo', 'García', 'Pérez', 'Hijo/a', 'HMTEST1234']);
  });

  test('con el título repetido (sección DNI y sección NIE), vale la columna que tenga respuesta', () => {
    const f = filaAdulto({ 'Tipo de documento': 'NIE', 'Número de documento (DNI o NIE)': '', 'Número de soporte': '' });
    f[30] = 'X1234567L';
    f[31] = 'E12345678';
    const r = respuesta(f);
    assert.deepEqual([r.numeroDocumento, r.soporte], ['X1234567L', 'E12345678']);
  });

  test('sin DNI ni NIE, el número de documento es el del pasaporte', () => {
    const conPasaporte = filaAdulto({ 'Tipo de documento': 'Pasaporte', 'Número de documento (DNI o NIE)': '', 'Número de soporte': '', 'Número de pasaporte': 'X1234567' });
    assert.equal(respuesta(conPasaporte).numeroDocumento, 'X1234567');
  });
});

test.describe('DD-02 · casado con la reserva y RH (D-31)', () => {
  test('casa por el código del canal o la referencia de KAF Rent, sin espacios ni mayúsculas', () => {
    const respuestas = [respuesta(filaAdulto()), respuesta(filaMenor()), respuesta(filaAdulto({ 'Código de reserva': 'OTRA' }))];
    assert.equal(fn('casarRespuestasConReserva_')(respuestas, ['HMTEST1234', '15/26']).length, 2);
    assert.equal(fn('casarRespuestasConReserva_')([respuesta(filaAdulto({ 'Código de reserva': '15/26' }))], ['', '15/26']).length, 1);
    assert.equal(fn('casarRespuestasConReserva_')(respuestas, ['', '']).length, 0);
  });

  test('la reserva se comunica con la primera respuesta, solo si llega antes del día de entrada', () => {
    const debe = fn('debeComunicarRH_');
    const inicio = new Date(2030, 6, 1, 16, 0);
    assert.equal(debe([], new Date(2030, 5, 30, 23, 0), inicio), true);
    assert.equal(debe([], new Date(2030, 6, 1, 9, 0), inicio), false, 'el mismo día de entrada ya no');
    assert.equal(debe([{}], new Date(2030, 5, 20), inicio), false, 'solo la primera');
  });
});

test.describe('DD-02 · traducción a códigos de SES', () => {
  test('D-42 · tipo de documento: la opción del catálogo y, en respuestas anteriores, "DNI" como NIF', () => {
    const c = (texto) => fn('codigoTipoDocumento_')(CATALOGO, texto);
    assert.deepEqual([c('NIF'), c('DNI'), c('dni'), c('NIE'), c('Pasaporte'), c('Otro documento extranjero'), c('Carné')], ['NIF', 'NIF', 'NIF', 'NIE', 'PAS', 'OTRO', '']);
  });

  test('traduce la descripción del catálogo a su código, sin distinguir mayúsculas ni acentos', () => {
    const t = fn('traducirCodigo_');
    assert.equal(t(CATALOGO, 'PAIS', 'ESPAÑA'), 'ESP');
    assert.equal(t(CATALOGO, 'PAIS', 'reino unido'), 'GBR');
    assert.equal(t(CATALOGO, 'SEXO', 'España'), '', 'solo dentro de su catálogo');
    assert.equal(t(CATALOGO, 'PAIS', 'Narnia'), '');
  });

  test('reconoce los nombres del INE con artículo pospuesto o en dos lenguas', () => {
    const c = fn('codigoMunicipioIne_');
    const ine = [{ provincia: 'A Coruña', municipio: 'Coruña, A', codigo: '15030' }, { provincia: 'Alicante', municipio: 'Alacant/Alicante', codigo: '03014' },
      { provincia: 'Illes Balears', municipio: "Palma", codigo: '07040' }, { provincia: 'Lleida', municipio: "Seu d'Urgell, La", codigo: '25203' }];
    assert.equal(c(ine, 'A Coruña', 'A Coruña'), '15030');
    assert.equal(c(ine, 'A Coruña', 'coruña, a'), '15030');
    assert.equal(c(ine, 'Alicante', 'Alicante'), '03014');
    assert.equal(c(ine, 'Alicante', 'Alacant'), '03014');
    assert.equal(c(ine, 'Lleida', "La Seu d'Urgell"), '25203');
  });

  test('código INE de 5 dígitos por provincia y municipio', () => {
    const c = fn('codigoMunicipioIne_');
    assert.equal(c(MUNICIPIOS, 'madrid', 'MADRID'), '28079');
    assert.equal(c(MUNICIPIOS, 'Alava', 'Agurain/Salvatierra'), '01051');
    assert.equal(c(MUNICIPIOS, 'Madrid', 'Móstoles'), '');
  });

  test('construye el viajero con códigos, fechas ISO y municipio INE si vive en España', () => {
    const v = plano(viajero(filaAdulto()));
    assert.deepEqual([v.apellido1, v.apellido2], ['García', 'de la Fuente']);
    assert.deepEqual([v.tipoDocumento, v.sexo, v.nacionalidad, v.fechaNacimiento], ['NIF', 'M', 'ESP', '1985-03-07']);
    assert.deepEqual(v.direccion, { direccion: 'C/ Mayor 1, 2ºB', codigoPostal: '28001', pais: 'ESP', codigoMunicipio: '28079', nombreMunicipio: '' });
  });

  test('fuera de España usa el nombre del municipio; el menor lleva su parentesco y su fecha en texto', () => {
    const extranjero = plano(viajero(filaAdulto({ País: 'Francia', Municipio: 'Lyon' })));
    assert.deepEqual([extranjero.direccion.codigoMunicipio, extranjero.direccion.nombreMunicipio], ['', 'Lyon']);
    const menor = plano(viajero(filaMenor()));
    assert.deepEqual([menor.parentesco, menor.fechaNacimiento], ['HJ', '2018-04-15']);
  });
});

test.describe('DD-02 · validación del parte de viajeros (PV)', () => {
  test('un adulto con DNI completo y un menor con parentesco y el contacto de su adulto son válidos', () => {
    const viajeros = fn('completarContactoMenores_')([viajero(filaAdulto()), viajero(filaMenor())]);
    assert.equal(fn('validarParteViajeros_')(viajeros).valido, true);
  });

  test('D-38 · el menor sin contacto lleva el de su adulto responsable, buscado por nombre', () => {
    const otro = viajero(filaAdulto({ Nombre: 'Luis', 'Primer Apellido': 'Pérez', 'Segundo Apellido': 'Gil', 'Teléfono Móvil': '+34 611000000', Email: 'luis@ejemplo.es' }));
    const [, , menor] = plano(fn('completarContactoMenores_')([otro, viajero(filaAdulto()), viajero(filaMenor())]));
    assert.deepEqual([menor.telefono, menor.correo], ['+34 600111222', 'ana@ejemplo.es']);
  });

  test('D-38 · si el nombre del responsable no coincide, toma el primer adulto con contacto; sin adultos, sigue sin contacto', () => {
    const c = fn('completarContactoMenores_');
    const [, menor] = plano(c([viajero(filaAdulto()), viajero(filaMenor({ 'Nombre y Apellidos responsable del menor': 'Otra Persona' }))]));
    assert.equal(menor.telefono, '+34 600111222');
    const [solo] = plano(c([viajero(filaMenor())]));
    assert.equal(solo.telefono, '');
    assert.match(fn('validarViajeroPV_')(solo).error, /teléfono o email/);
  });

  test('D-37 (E) · un guion en el segundo apellido significa que no tiene', () => {
    assert.equal(respuesta(filaAdulto({ 'Segundo Apellido': ' - ' })).apellido2, '');
    assert.equal(respuesta(filaAdulto({ 'Segundo Apellido': '—' })).apellido2, '');
    assert.equal(respuesta(filaAdulto({ 'Segundo Apellido': 'Martín-Pérez' })).apellido2, 'Martín-Pérez');
    const conDniYGuion = fn('validarViajeroPV_')(viajero(filaAdulto({ 'Segundo Apellido': '-' })));
    assert.deepEqual(plano(conDniYGuion.faltan), ['segundo apellido'], 'con DNI, SES lo sigue exigiendo');
  });

  test('el adulto necesita documento; con NIF, soporte y segundo apellido', () => {
    const r = fn('validarViajeroPV_')(viajero(filaAdulto({ 'Segundo Apellido': '', 'Número de soporte': '' })));
    assert.deepEqual(plano(r.faltan), ['número de soporte', 'segundo apellido']);
    assert.match(r.error, /^Ana: falta/);
    assert.deepEqual(plano(fn('validarViajeroPV_')(viajero(filaAdulto({ 'Tipo de documento': '', 'Número de documento (DNI o NIE)': '' }))).faltan), ['tipo de documento', 'número de documento']);
  });

  test('el menor necesita parentesco; todos, un contacto y el municipio INE si viven en España', () => {
    const v = fn('validarViajeroPV_');
    const parentesco = '¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?';
    assert.deepEqual(plano(v(viajero(filaMenor({ [parentesco]: 'Primo lejano', 'Teléfono Móvil': '+34 600111222' }))).faltan), ['parentesco']);
    assert.deepEqual(plano(v(viajero(filaAdulto({ 'Teléfono Móvil': '', Email: '' }))).faltan), ['teléfono o email']);
    assert.deepEqual(plano(v(viajero(filaAdulto({ Municipio: 'Móstoles' }))).faltan), ['municipio (código INE)']);
  });

  test('ADR-0021 · comprueba la letra de control del DNI y del NIE', () => {
    const l = fn('letraDniNieValida_');
    assert.equal(l('12345678Z'), true);
    assert.equal(l('12345678z'), true);
    assert.equal(l('12345678A'), false);
    assert.equal(l('X1234567L'), true);
    assert.equal(l('X1234567A'), false);
    assert.equal(l('ABC'), false);
    const r = fn('validarViajeroPV_')(viajero(filaAdulto({ 'Número de documento (DNI o NIE)': '12345678A' })));
    assert.deepEqual(plano(r.faltan), ['número de documento válido (revisa la letra)']);
  });

  test('el menor que marca DNI sin número no envía el tipo ni se le exige soporte ni segundo apellido', () => {
    const menor = viajero(filaMenor({ 'Tipo de documento del menor': 'DNI', 'Segundo Apellido del menor de edad': '', 'Teléfono Móvil': '+34 600111222' }));
    assert.equal(menor.tipoDocumento, '');
    assert.equal(fn('validarViajeroPV_')(menor).valido, true);
  });

  test('el parte necesita al menos un adulto', () => {
    assert.match(fn('validarParteViajeros_')([viajero(filaMenor())]).error, /mayor de edad/);
  });

  test('el titular de la reserva (RH) solo necesita nombre, primer apellido y un contacto', () => {
    const t = fn('validarTitularRH_');
    assert.equal(t(viajero(filaAdulto({ 'Tipo de documento': '', 'Número de documento (DNI o NIE)': '', 'Fecha de nacimiento': '' }))).valido, true);
    assert.match(t(viajero(filaAdulto({ 'Teléfono Móvil': '', Email: '' }))).error, /teléfono o email/);
  });
});

test.describe('DD-02 · XML de RH y PV', () => {
  const contrato = {
    referencia: '2030-001', fechaContrato: new Date(2030, 5, 1), inicio: new Date(2030, 6, 1, 16, 0),
    fin: new Date(2030, 6, 4, 12, 0), numPersonas: 2, tipoPago: 'OTRO',
  };

  test('PV: establecimiento, contrato con fechas locales y viajeros en el orden de la especificación', () => {
    const xml = fn('construirXmlPV_')({ codigoEstablecimiento: '0000012345', contrato, viajeros: [viajero(filaAdulto()), viajero(filaMenor())] });
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?><alt:peticion xmlns:alt="http:\/\/www.neg.hospedajes.mir.es\/altaParteHospedaje"><solicitud><codigoEstablecimiento>0000012345<\/codigoEstablecimiento><comunicacion><contrato>/);
    assert.match(xml, /<fechaContrato>2030-06-01<\/fechaContrato><fechaEntrada>2030-07-01T16:00:00<\/fechaEntrada><fechaSalida>2030-07-04T12:00:00<\/fechaSalida><numPersonas>2<\/numPersonas><numHabitaciones>1<\/numHabitaciones><pago><tipoPago>OTRO<\/tipoPago><\/pago>/);
    assert.match(xml, /<persona><rol>VI<\/rol><nombre>Ana<\/nombre><apellido1>García<\/apellido1><apellido2>de la Fuente<\/apellido2><tipoDocumento>NIF<\/tipoDocumento><numeroDocumento>12345678Z<\/numeroDocumento><soporteDocumento>ABC123456<\/soporteDocumento><fechaNacimiento>1985-03-07<\/fechaNacimiento>/);
    assert.match(xml, /<direccion><direccion>C\/ Mayor 1, 2ºB<\/direccion><codigoMunicipio>28079<\/codigoMunicipio><codigoPostal>28001<\/codigoPostal><pais>ESP<\/pais><\/direccion>/);
    assert.match(xml, /<nombre>Leo<\/nombre>.*<parentesco>HJ<\/parentesco><\/persona><\/comunicacion><\/solicitud><\/alt:peticion>$/);
    assert.ok(!/<tipoDocumento><\/tipoDocumento>/.test(xml), 'los opcionales vacíos no se envían');
  });

  test('RH: establecimiento por código, contrato y titular con rol TI', () => {
    const xml = fn('construirXmlRH_')({ codigoEstablecimiento: '0000012345', contrato, titular: viajero(filaAdulto()) });
    assert.match(xml, /<comunicacion><establecimiento><codigo>0000012345<\/codigo><\/establecimiento><contrato>/);
    assert.match(xml, /<persona><rol>TI<\/rol><nombre>Ana<\/nombre>/);
  });

  test('escapa los caracteres especiales de XML', () => {
    const xml = fn('construirXmlPV_')({ codigoEstablecimiento: '1', contrato, viajeros: [viajero(filaAdulto({ Nombre: 'Ana <b> & "Co"' }))] });
    assert.match(xml, /<nombre>Ana &lt;b&gt; &amp; &quot;Co&quot;<\/nombre>/);
  });
});

test.describe('DD-02 §3.5 · errores y reintentos', () => {
  test('clasifica: red, HTTP 5xx y 10999 se reintentan; 0 es ok; los rechazos de datos no se reintentan', () => {
    const c = fn('clasificarErrorSES_');
    assert.equal(c({ errorRed: true }), 'reintentar');
    assert.equal(c({ httpCodigo: 503 }), 'reintentar');
    assert.equal(c({ httpCodigo: 200, codigoSES: 10999 }), 'reintentar');
    assert.equal(c({ httpCodigo: 200, codigoSES: 0 }), 'ok');
    assert.equal(c({ httpCodigo: 200, codigoSES: '10121' }), 'rechazo');
    assert.equal(c({ httpCodigo: 401, codigoSES: '' }), 'rechazo');
  });

  test('programa el siguiente intento o pasa a Manual tras el último', () => {
    const p = fn('proximoIntento_');
    const ahora = new Date(2030, 6, 1, 18, 10);
    const r1 = p(1, 3, ahora, 30);
    assert.equal(r1.estado, 'Pendiente');
    assert.equal(r1.proximo.getTime(), new Date(2030, 6, 1, 18, 40).getTime());
    assert.deepEqual(plano(p(3, 3, ahora, 30)), { estado: 'Manual', proximo: null });
  });
});

// ---------- S27 · solicitud completa y mensajes SOAP ----------
// Respuestas tomadas de los Anexos I y II de la especificación v3.1.3 (incluida su errata "resutadoComunicacion").
const RESPUESTA_ALTA_OK = `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body>
  <ns3:comunicacionResponse xmlns:ns3="http://www.soap.servicios.hospedajes.mir.es/comunicacion"><respuesta>
  <codigoRetorno>0</codigoRetorno><descripcion>Ok</descripcion><lote>11111111-2222-3333-4444-555555555555</lote>
  </respuesta></ns3:comunicacionResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;
const respuestaLote = (estado, comunicacion) => `<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body>
  <ns3:comunicacionResponse xmlns:ns3="x"><respuesta><codigo>0</codigo><descripcion>Ok</descripcion></respuesta>
  <resultado><lote>L-1</lote><tipoComuniacion>PV</tipoComuniacion><codigoEstado>${estado}</codigoEstado><descEstado>Estado ${estado}</descEstado>
  <resultadoComunicaciones>${comunicacion}</resultadoComunicaciones></resultado></ns3:comunicacionResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;

test.describe('S27 · solicitud a SES desde la reserva y el Form', () => {
  const reserva = {
    id: '2030-007', inicio: new Date(2030, 6, 1, 16), fin: new Date(2030, 6, 4, 12), adultos: 1, menores: 1, fechaRegistro: new Date(2030, 5, 1, 9),
  };
  const base = { reserva, tablas, codigoEstablecimiento: 'EST-1', tipoPago: 'OTRO' };

  test('PV: todos los viajeros, el menor con el contacto de su adulto, y número de personas de la reserva', () => {
    const r = fn('prepararSolicitudSES_')({ ...base, tipo: 'PV', respuestas: [respuesta(filaAdulto()), respuesta(filaMenor(), 3)] });
    assert.equal(r.valido, true, r.error);
    assert.match(r.xml, /altaParteHospedaje/);
    assert.match(r.xml, /<referencia>2030-007<\/referencia><fechaContrato>2030-06-01<\/fechaContrato>/);
    assert.match(r.xml, /<numPersonas>2<\/numPersonas>/);
    assert.equal((r.xml.match(/<telefono>\+34 600111222<\/telefono>/g) || []).length, 2);
  });

  test('RH: solo el titular (la primera respuesta), con rol TI', () => {
    const r = fn('prepararSolicitudSES_')({ ...base, tipo: 'RH', respuestas: [respuesta(filaAdulto())] });
    assert.equal(r.valido, true, r.error);
    assert.equal((r.xml.match(/<persona>/g) || []).length, 1);
    assert.match(r.xml, /<rol>TI<\/rol>/);
  });

  test('sin respuestas o con datos incompletos no hay solicitud y se dice por qué', () => {
    assert.match(fn('prepararSolicitudSES_')({ ...base, tipo: 'PV', respuestas: [] }).error, /No hay respuestas/);
    assert.match(fn('prepararSolicitudSES_')({ ...base, tipo: 'PV', respuestas: [respuesta(filaAdulto({ 'Número de soporte': '' }))] }).error, /soporte/);
  });
});

test.describe('S27 · mensajes SOAP de SES', () => {
  test('el sobre de alta lleva la cabecera y la solicitud comprimida', () => {
    const sobre = fn('construirSobreComunicacion_')({ codigoArrendador: '0000000001', aplicacion: 'KAF Rent', tipoComunicacion: 'PV', solicitudBase64: 'UEsDB' });
    assert.match(sobre, /<com:comunicacionRequest><peticion><cabecera><codigoArrendador>0000000001<\/codigoArrendador><aplicacion>KAF Rent<\/aplicacion><tipoOperacion>A<\/tipoOperacion><tipoComunicacion>PV<\/tipoComunicacion><\/cabecera><solicitud>UEsDB<\/solicitud>/);
    assert.match(fn('construirSobreConsultaLote_')(['L-1', 'L-2']), /<codigosLote><lote>L-1<\/lote><lote>L-2<\/lote><\/codigosLote>/);
    assert.match(fn('construirSobreCatalogo_')('SEXO'), /<com:catalogoRequest><peticion><catalogo>SEXO<\/catalogo>/);
  });

  test('lee la respuesta de alta (ejemplo del Anexo I)', () => {
    assert.deepEqual(plano(fn('leerRespuestaAlta_')(RESPUESTA_ALTA_OK)), { codigoSES: '0', descripcion: 'Ok', lote: '11111111-2222-3333-4444-555555555555' });
  });

  test('lee el lote con las dos grafías de la etiqueta de resultado', () => {
    const ok = fn('leerRespuestaLote_')(respuestaLote(1, '<resultadoComunicacion><orden>1</orden><codigoComunicacion>C-99</codigoComunicacion></resultadoComunicacion>'));
    assert.equal(ok.lotes[0].comunicaciones[0].codigoComunicacion, 'C-99');
    const conErrata = fn('leerRespuestaLote_')(respuestaLote(6, '<resutadoComunicacion><orden>1</orden><tipoError>Error validación de datos</tipoError><error>No existe &quot;X&quot;</error></resutadoComunicacion>'));
    assert.equal(conErrata.lotes[0].comunicaciones[0].error, 'No existe "X"');
  });

  test('lee las tuplas de un catálogo', () => {
    const xml = '<r><resultado><codigo>0</codigo></resultado><respuesta><resultado><tupla><codigo>H</codigo><descripcion>Hombre</descripcion></tupla><tupla><codigo>M</codigo><descripcion>Mujer</descripcion></tupla></resultado></respuesta></r>';
    const r = plano(fn('leerRespuestaCatalogo_')(xml));
    assert.equal(r.codigoSES, '0');
    assert.deepEqual(r.tuplas, [{ codigo: 'H', descripcion: 'Hombre' }, { codigo: 'M', descripcion: 'Mujer' }]);
  });

  test('interpreta el estado del lote: comunicada, rechazada, esperar o reintentar', () => {
    const lote = (xml) => fn('leerRespuestaLote_')(xml).lotes[0];
    const i = (x) => plano(fn('interpretarLote_')(x));
    assert.deepEqual(i(lote(respuestaLote(1, '<resultadoComunicacion><orden>1</orden><codigoComunicacion>C-99</codigoComunicacion></resultadoComunicacion>'))), { resultado: 'comunicada', codigoComunicacion: 'C-99' });
    assert.equal(i(lote(respuestaLote(6, '<resultadoComunicacion><orden>1</orden><error>Dato incorrecto</error></resultadoComunicacion>'))).error, 'Dato incorrecto');
    assert.equal(i(lote(respuestaLote(2, ''))).resultado, 'rechazada');
    assert.equal(i(lote(respuestaLote(4, ''))).resultado, 'esperar');
    assert.equal(i(lote(respuestaLote(5, ''))).resultado, 'esperar');
    assert.equal(i(lote(respuestaLote(3, ''))).resultado, 'reintentar');
    assert.equal(i(undefined).resultado, 'esperar', 'un lote que aún no aparece');
  });
});

test.describe('F-27 · mensaje de WhatsApp para el huésped', () => {
  const plantilla = 'https://docs.google.com/forms/d/e/FORM/viewform?usp=pp_url&entry.123={codigo}';
  const reserva = { id: '2026-015', refCanal: 'HMABC123', inicio: new Date(2026, 9, 19, 16), adultos: 1, menores: 1, telefono: '600111222' };

  test('texto aprobado: fecha con día, personas, enlace con el código del canal y el código a la vista', () => {
    const texto = fn('mensajeHuesped_')({ reserva, plantillaEnlace: plantilla });
    assert.equal(texto, [
      'Antes de tu llegada el lunes 19/10, la ley española (RD 933/2021) nos obliga a registrar a todos los huéspedes ante el Ministerio del Interior.',
      '📝 Rellena un formulario por persona (2 en total, menores incluidos; el de un menor lo rellena un adulto):',
      '👉 https://docs.google.com/forms/d/e/FORM/viewform?usp=pp_url&entry.123=HMABC123',
      'El código de tu reserva (HMABC123) ya viene puesto. Tarda unos 3 minutos y necesitarás vuestro DNI, NIE o pasaporte.',
      'Al llegar comprobaremos los documentos en persona. Cualquier duda, escríbenos por aquí.',
    ].join('\n'));
  });

  test('sin código del canal usa la referencia de KAF Rent, codificada en el enlace', () => {
    const texto = fn('mensajeHuesped_')({ reserva: { ...reserva, refCanal: '' }, plantillaEnlace: plantilla });
    assert.match(texto, /entry\.123=15%2F26/);
    assert.match(texto, /El código de tu reserva \(15\/26\)/);
  });

  test('enlace de WhatsApp con prefijo de España si el teléfono tiene 9 cifras; vacío sin teléfono', () => {
    const w = fn('enlaceWhatsApp_');
    assert.equal(w('600 111 222', 'Hola y adiós'), 'https://wa.me/34600111222?text=Hola%20y%20adi%C3%B3s');
    assert.equal(w('+44 7700 900123', 'x'), 'https://wa.me/447700900123?text=x');
    assert.equal(w('', 'x'), '');
  });
});
