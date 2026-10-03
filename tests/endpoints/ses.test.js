// S27 · tareas de SES.Hospedajes (ADR-0018, DD-02): activador del Form, envío, consulta del lote, reintentos y catálogos.
// Sheet del Form y servicio web de SES simulados; datos de huéspedes inventados.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntornoConDatos, datosReservaHabitacion, datosReservaPiscina } = require('../soporte/gas');
const { CABECERAS_FORM, filaAdulto, filaMenor } = require('../soporte/form_viajeros');

const ID_FORM = 'FORM-1';
const LOTE = '11111111-2222-3333-4444-555555555555';
const altaOk = `<r><respuesta><codigoRetorno>0</codigoRetorno><descripcion>Ok</descripcion><lote>${LOTE}</lote></respuesta></r>`;
const loteConEstado = (estado, comunicacion = '') => `<r><respuesta><codigo>0</codigo><descripcion>Ok</descripcion></respuesta><resultado><lote>${LOTE}</lote><codigoEstado>${estado}</codigoEstado><descEstado>Estado ${estado}</descEstado><resultadoComunicaciones>${comunicacion}</resultadoComunicaciones></resultado></r>`;
const comunicada = loteConEstado(1, '<resultadoComunicacion><orden>1</orden><codigoComunicacion>COM-77</codigoComunicacion></resultadoComunicacion>');

const ponerConfig = (e, valores) => e.hoja('Config').datos.forEach((f) => { if (valores[f[0]] !== undefined) f[1] = valores[f[0]]; });

// Reserva de Habitación con código HMTEST1234 (2 personas), Sheet del Form, catálogos y credenciales.
const entornoSES = ({ conCredenciales = true } = {}) => {
  const e = crearEntornoConDatos();
  // Antes de la primera llamada: la caché de Config dura toda la ejecución (en los tests, todo el entorno).
  ponerConfig(e, { Sheet_Viajeros_Id: ID_FORM, SES_Codigo_Arrendador: '0000000001', SES_Codigo_Establecimiento: 'EST-1', SES_Tipo_Pago: 'OTRO' });
  e.llamar('crearReserva', datosReservaHabitacion({ adultos: '1', menores: '1' }));
  if (conCredenciales) Object.assign(e.propiedades, { SES_USUARIO: 'usuario', SES_CONTRASENA: 'secreto' });
  const libro = new e.LibroFalso();
  libro.insertSheet('Respuestas de formulario 1').appendRow(CABECERAS_FORM);
  e.librosExternos[ID_FORM] = libro;
  [['PAIS', 'ESP', 'España'], ['SEXO', 'M', 'Mujer'], ['SEXO', 'H', 'Hombre'], ['TIPO_DOCUMENTO', 'NIF', 'NIF'], ['TIPO_DOCUMENTO', 'PAS', 'Pasaporte'], ['TIPO_PARENTESCO', 'HJ', 'Hijo/a']]
    .forEach((f) => e.hoja('Catálogo_SES').appendRow(f));
  e.hoja('Municipios_INE').appendRow(['Madrid', 'Madrid', '28079']);
  const form = libro.getSheetByName('Respuestas de formulario 1');
  // Como Google: la respuesta se añade y el activador recibe su rango.
  const enviarForm = (fila) => {
    form.appendRow(fila);
    return e.comoPropietario(() => e.llamar('alEnviarFormularioViajeros', { triggerUid: 'TR-FORM', range: { getRow: () => form.getLastRow() } }));
  };
  e.disparadores.push({ uid: 'TR-FORM', getUniqueId: () => 'TR-FORM', getHandlerFunction: () => 'alEnviarFormularioViajeros' });
  const procesar = () => e.comoPropietario(() => e.llamar('procesarComunicacionesSES'));
  const comunicaciones = () => e.hoja('Comunicaciones_SES').registros();
  const reserva = () => e.hoja('Reservas').registros()[0];
  return { ...e, form, enviarForm, procesar, comunicaciones, reserva };
};

const antesDeEntrar = (fila) => { fila[0] = new Date(); return fila; };

test.describe('S27 · al llegar un Form (RF-76, RF-78, D-31)', () => {
  test('la primera respuesta antes del día de entrada programa la reserva (RH) y actualiza el estado del registro', () => {
    const e = entornoSES();
    const r = e.enviarForm(antesDeEntrar(filaAdulto()));
    assert.equal(r.rh, true);
    const [c] = e.comunicaciones();
    assert.deepEqual([c.Tipo, c.Estado, String(c.Filas_Form)], ['RH', 'Pendiente', '2']);
    assert.equal(e.reserva().Registro_Viajeros_Estado, 'Pendiente', '1 de 2 personas');
    e.enviarForm(antesDeEntrar(filaMenor()));
    assert.equal(e.comunicaciones().length, 1, 'la segunda respuesta no repite la RH');
    assert.equal(e.reserva().Registro_Viajeros_Estado, 'Completado', '2 de 2 personas');
  });

  test('una respuesta sin reserva con ese código no programa nada y queda en Logs', () => {
    const e = entornoSES();
    const r = e.enviarForm(antesDeEntrar(filaAdulto({ 'Código de reserva': 'NO-EXISTE' })));
    assert.equal(r.reserva, null);
    assert.equal(e.comunicaciones().length, 0);
    assert.ok(e.hoja('Logs').registros().some((l) => l.Tipo === 'SES_SIN_RESERVA'));
    const aviso = e.correos.find((c) => /! SES Formulario: respuesta sin reserva/.test(c.subject));
    assert.match(aviso.subject, /"NO-EXISTE"/);
    assert.match(aviso.body, /Fila del Sheet del Form: 2/);
  });

  test('una respuesta que llega el día de entrada no comunica la reserva (D-31)', () => {
    const e = entornoSES();
    const fila = filaAdulto();
    fila[0] = new Date(e.reserva().Fecha_Hora_Inicio.getTime() + 60 * 60 * 1000);
    assert.equal(e.enviarForm(fila).rh, false);
  });
});

test.describe('S27 · envío y consulta del lote (RF-89, RF-90)', () => {
  test('envía la RH, queda Enviada con su lote y, al consultarlo, Comunicada con el código anotado en el Form', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ cuerpo: altaOk });
    e.procesar();
    assert.deepEqual([e.comunicaciones()[0].Estado, e.comunicaciones()[0].Lote, e.comunicaciones()[0].Intento], ['Enviada', LOTE, 1]);
    const peticion = e.ses.peticiones[0];
    assert.match(peticion.opciones.payload, /<tipoComunicacion>RH<\/tipoComunicacion>/);
    assert.match(peticion.opciones.headers.Authorization, /^Basic /);
    assert.ok(!peticion.opciones.payload.includes('secreto'), 'la contraseña no viaja en el cuerpo');
    e.ses.respuestas.push({ cuerpo: comunicada });
    e.procesar();
    assert.deepEqual([e.comunicaciones()[0].Estado, e.comunicaciones()[0].Codigo_Comunicacion], ['Comunicada', 'COM-77']);
    const filaForm = e.form.registros()[0];
    assert.equal(filaForm['Reserva comunicada'], true, 'la RH va en sus columnas');
    assert.equal(filaForm['Lote reserva'], LOTE);
    assert.equal(filaForm['Código comunicación reserva'], 'COM-77');
    assert.equal(filaForm.Comunicados, '', 'las columnas del parte no se tocan');
    const exito = e.correos.find((c) => /✓ SES Reserva: comunicada · Reserva \d\d\/\d\d · COM-77/.test(c.subject));
    assert.ok(exito, 'se avisa de que la reserva quedó comunicada');
    assert.match(exito.body, /Código de comunicación: COM-77/);
    assert.match(exito.htmlBody, /Comunicada a SES/);
  });

  test('mientras el lote está en proceso no cambia nada', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ cuerpo: altaOk }, { cuerpo: loteConEstado(4) });
    e.procesar();
    e.procesar();
    assert.equal(e.comunicaciones()[0].Estado, 'Enviada');
  });

  test('si SES no responde, la reserva se reintenta más tarde; tras el último intento queda No comunicada y se avisa', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ errorRed: 'timeout' });
    e.procesar();
    const [c] = e.comunicaciones();
    assert.deepEqual([c.Estado, c.Intento], ['Pendiente', 1]);
    assert.match(c.Error, /Sin conexión con SES: timeout/);
    assert.ok(c.Proximo_Intento > new Date(), 'el reintento queda programado, no inmediato');
    const intermedio = e.correos.find((x) => /! SES Reserva: 1º intento fallido · reintento a las \d\d:\d\d · Reserva/.test(x.subject));
    assert.ok(intermedio, 'aviso en cada intento fallido');
    assert.match(intermedio.body, /lo vuelve a intentar solo/);
    assert.match(intermedio.body, /quedan 2 intentos/);
    e.procesar();
    assert.equal(e.ses.peticiones.length, 1, 'antes de su hora no se reintenta');
    const programar = (n) => e.hoja('Comunicaciones_SES').datos.forEach((f, i) => { if (i > 0) { f[e.hoja('Comunicaciones_SES').cabeceras().indexOf('Proximo_Intento')] = new Date(2000, 0, 1); f[e.hoja('Comunicaciones_SES').cabeceras().indexOf('Intento')] = n; } });
    programar(2);
    e.ses.respuestas.push({ http: 503, cuerpo: 'Service Unavailable' });
    e.procesar();
    assert.deepEqual([e.comunicaciones()[0].Estado, e.comunicaciones()[0].Intento], ['No comunicada', 3]);
    const aviso = e.correos.find((c) => /! SES Reserva: 3º intento · no comunicada · Reserva/.test(c.subject));
    assert.ok(aviso, 'aviso a los copropietarios');
    assert.match(aviso.body, /el trámite que importa es el parte de huéspedes/);
    assert.match(aviso.body, /HTTP 503/);
    assert.doesNotMatch(aviso.body, /Abrir SES/, 'la reserva no se comunica a mano: sin botón de SES');
  });

  test('el parte (PV) que agota los intentos pasa a Manual y el aviso pide comunicarlo a mano', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    const hoja = e.hoja('Comunicaciones_SES');
    const col = (t) => hoja.cabeceras().indexOf(t);
    hoja.datos[1][col('Tipo')] = 'PV';
    hoja.datos[1][col('Intento')] = 2;
    e.ses.respuestas.push({ errorRed: 'timeout' });
    e.procesar();
    assert.equal(e.comunicaciones()[0].Estado, 'Manual');
    const aviso = e.correos.find((c) => /✕ SES Huéspedes: 3º intento · comunicar a mano/.test(c.subject));
    assert.ok(aviso);
    assert.match(aviso.body, /Abrir SES\.Hospedajes: https:\/\/hospedajes\.ses\.mir\.es\//);
    assert.match(aviso.body, /Plazo: hasta el /);
  });

  test('un rechazo de datos de SES no se reintenta', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ cuerpo: altaOk }, { cuerpo: loteConEstado(6, '<resultadoComunicacion><orden>1</orden><error>Dato incorrecto: nacionalidad</error></resultadoComunicacion>') });
    e.procesar();
    e.procesar();
    const [c] = e.comunicaciones();
    assert.deepEqual([c.Estado, c.Error], ['Rechazada', 'Dato incorrecto: nacionalidad']);
  });

  test('con datos incompletos no se llama a SES: queda Rechazada explicando qué falta', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto({ 'Teléfono Móvil': '', Email: '' })));
    e.procesar();
    assert.equal(e.ses.peticiones.length, 0);
    assert.match(e.comunicaciones()[0].Error, /teléfono o email/);
    const aviso = e.correos.find((c) => /✕ SES Reserva: 1º intento · datos que corregir/.test(c.subject));
    assert.ok(aviso, 'se avisa de que ha fallado');
    assert.match(aviso.body, /Qué falta: .*teléfono o email/);
  });

  test('sin credenciales el fallo se registra y la comunicación sigue pendiente', () => {
    const e = entornoSES({ conCredenciales: false });
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.procesar();
    assert.equal(e.comunicaciones()[0].Estado, 'Pendiente');
    assert.match(e.hoja('Errores').registros().at(-1).Mensaje, /SES_USUARIO/);
  });
});

test.describe('S27 · catálogos y activadores', () => {
  test('actualizarCatalogosSES sustituye los catálogos de SES y conserva PAIS', () => {
    const e = entornoSES();
    const tuplas = (pares) => `<r><resultado><codigo>0</codigo></resultado><respuesta><resultado>${pares.map(([c, d]) => `<tupla><codigo>${c}</codigo><descripcion>${d}</descripcion></tupla>`).join('')}</resultado></respuesta></r>`;
    e.ses.respuestas.push({ cuerpo: tuplas([['H', 'Hombre'], ['M', 'Mujer'], ['O', 'Otro']]) }, { cuerpo: tuplas([['NIF', 'NIF'], ['NIE', 'NIE'], ['PAS', 'Pasaporte']]) },
      { cuerpo: tuplas([['HJ', 'Hijo/a']]) }, { errorRed: 'timeout' });
    const r = e.comoPropietario(() => e.llamar('actualizarCatalogosSES'));
    assert.deepEqual(r.catalogos.map((c) => c.actualizado), [true, true, true, false]);
    const catalogo = e.hoja('Catálogo_SES').registros();
    assert.equal(catalogo.filter((f) => f.Catalogo === 'SEXO').length, 3);
    assert.ok(catalogo.some((f) => f.Catalogo === 'PAIS' && f.Codigo === 'ESP'));
  });

  test('los catálogos se actualizan solos el día 1 y solo si hay credenciales', () => {
    const e = entornoSES();
    assert.equal(e.fn('tocaActualizarCatalogosSES_')(new Date(2030, 0, 1, 3)), true);
    assert.equal(e.fn('tocaActualizarCatalogosSES_')(new Date(2030, 0, 2, 3)), false);
    const sin = entornoSES({ conCredenciales: false });
    assert.equal(sin.fn('tocaActualizarCatalogosSES_')(new Date(2030, 0, 1, 3)), false);
  });

  test('con Sheet_Viajeros_Id, instalarTriggers añade el de cada 10 min y el del Form', () => {
    const e = entornoSES();
    e.disparadores.length = 0;
    e.comoPropietario(() => e.llamar('instalarTriggers'));
    assert.equal(e.disparadores.find((t) => t.funcion === 'procesarComunicacionesSES').minutos, 10);
    const delForm = e.disparadores.find((t) => t.funcion === 'alEnviarFormularioViajeros');
    assert.deepEqual([delForm.origen, delForm.alEnviarForm], [ID_FORM, true]);
  });
});

test.describe('ADR-0022 · cancelar una reserva ya comunicada', () => {
  // Deja la RH comunicada con el código COM-77.
  const comunicadaRH = () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ cuerpo: altaOk }, { cuerpo: comunicada });
    e.procesar();
    e.procesar();
    return e;
  };
  const idReserva = (e) => e.reserva().ID_Reserva;

  test('la ficha trae el aviso para la confirmación de cancelar', () => {
    const e = comunicadaRH();
    assert.match(e.llamar('obtenerReserva', idReserva(e)).data.avisoCancelacionSES, /comunicada a SES.Hospedajes \(código COM-77\).*se anulará también en SES/);
  });

  test('al cancelar se programa la anulación; al confirmarla SES, la original queda Anulada y se anota en el Form', () => {
    const e = comunicadaRH();
    assert.equal(e.llamar('cancelarReserva', idReserva(e)).success, true);
    const anulacion = e.comunicaciones().find((c) => c.Tipo === 'AN');
    assert.equal(anulacion.Estado, 'Pendiente');
    e.ses.respuestas.push({ cuerpo: altaOk }, { cuerpo: loteConEstado(1, '<resultadoComunicacion><orden>1</orden></resultadoComunicacion>') });
    e.procesar();
    const peticion = e.ses.peticiones.at(-1).opciones.payload;
    assert.match(peticion, /<tipoOperacion>B<\/tipoOperacion>/);
    assert.ok(!/<tipoComunicacion>/.test(peticion), 'la anulación no lleva tipo de comunicación');
    e.procesar();
    const estados = Object.fromEntries(e.comunicaciones().map((c) => [c.Tipo, c.Estado]));
    assert.deepEqual(estados, { RH: 'Anulada', AN: 'Comunicada' });
    const exito = e.correos.find((c) => /✓ SES Anulación: reserva anulada · Reserva \d\d\/\d\d · COM-77/.test(c.subject));
    assert.ok(exito, 'se avisa de la anulación con el código anulado');
    assert.match(exito.body, /Comunicación: COM-77 \(reserva\)/);
    const filaForm = e.form.registros()[0];
    assert.equal(filaForm['Anulación SES'], true);
    assert.equal(filaForm['Lote anulación'], LOTE);
    assert.equal(filaForm['Usuario anulación'], 'ana@test.com');
  });

  test('si se cancela antes de enviarse, la comunicación se descarta y no se llama a SES', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.llamar('cancelarReserva', idReserva(e));
    e.procesar();
    assert.deepEqual(e.comunicaciones().map((c) => c.Estado), ['Descartada']);
    assert.equal(e.ses.peticiones.length, 0);
  });

  test('si SES aún procesa la original, la anulación espera a que quede comunicada', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.ses.respuestas.push({ cuerpo: altaOk });
    e.procesar();
    e.llamar('cancelarReserva', idReserva(e));
    e.ses.respuestas.push({ cuerpo: loteConEstado(4) });
    e.procesar();
    assert.equal(e.comunicaciones().find((c) => c.Tipo === 'AN').Estado, 'Pendiente', 'espera sin gastar intentos');
    assert.equal(e.comunicaciones().find((c) => c.Tipo === 'AN').Intento, 0);
  });

  test('si la anulación agota los intentos queda Manual y el aviso pide anular a mano', () => {
    const e = comunicadaRH();
    e.llamar('cancelarReserva', idReserva(e));
    const hoja = e.hoja('Comunicaciones_SES');
    hoja.datos[2][hoja.cabeceras().indexOf('Intento')] = 2;
    e.ses.respuestas.push({ errorRed: 'timeout' });
    e.procesar();
    assert.equal(e.comunicaciones().find((c) => c.Tipo === 'AN').Estado, 'Manual');
    assert.ok(e.correos.some((c) => /✕ SES Anulación: 3º intento · anular a mano/.test(c.subject)));
  });

  test('cancelar dos veces no programa dos anulaciones', () => {
    const e = comunicadaRH();
    e.llamar('cancelarReserva', idReserva(e));
    e.fn('programarAnulacionesSES_')(idReserva(e), 'x', new Date());
    assert.equal(e.comunicaciones().filter((c) => c.Tipo === 'AN').length, 1);
  });
});

test.describe('F-27 · endpoint mensajeHuesped', () => {
  const PLANTILLA = 'https://docs.google.com/forms/d/e/FORM/viewform?usp=pp_url&entry.123={codigo}';
  const conPlantilla = () => {
    const e = crearEntornoConDatos();
    ponerConfig(e, { Form_Viajeros_Enlace: PLANTILLA });
    e.llamar('crearReserva', datosReservaHabitacion());
    e.llamar('crearReserva', datosReservaPiscina());
    return e;
  };
  const id = (e, espacio) => e.hoja('Reservas').registros().find((r) => r.Espacio === espacio).ID_Reserva;

  test('devuelve el texto y el enlace de WhatsApp de una reserva de Habitación', () => {
    const e = conPlantilla();
    const r = e.llamar('mensajeHuesped', id(e, 'Habitación Interior'));
    assert.equal(r.success, true, r.error);
    assert.match(r.data.texto, /entry\.123=HMTEST1234/);
    assert.match(r.data.whatsapp, /^https:\/\/wa\.me\/34600111222\?text=/);
  });

  test('no aplica a la Piscina ni sin plantilla en Config', () => {
    const e = conPlantilla();
    assert.match(e.llamar('mensajeHuesped', id(e, 'Piscina / Jardín')).error, /solo se pide en la Habitación/);
    const sin = crearEntornoConDatos();
    sin.llamar('crearReserva', datosReservaHabitacion());
    assert.match(sin.llamar('mensajeHuesped', sin.hoja('Reservas').registros()[0].ID_Reserva).error, /Form_Viajeros_Enlace/);
  });
});

test.describe('ADR-0022 · solo la Habitación tiene comunicaciones que anular', () => {
  test('cancelar una reserva de la Piscina no programa nada en SES ni lo menciona en la confirmación', () => {
    const e = entornoSES();
    e.llamar('crearReserva', datosReservaPiscina());
    const piscina = e.hoja('Reservas').registros().find((r) => r.Espacio === 'Piscina / Jardín').ID_Reserva;
    assert.equal(e.llamar('obtenerReserva', piscina).data.avisoCancelacionSES, '');
    e.llamar('cancelarReserva', piscina);
    assert.equal(e.comunicaciones().length, 0);
  });
});

test.describe('F-28 · validar identidades y comunicar el parte', () => {
  // Reserva de 1 adulto + 1 menor con sus dos formularios; el del menor con un municipio que no está en el INE.
  const conFormularios = () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    e.enviarForm(antesDeEntrar(filaMenor({ 'Municipio del menor': 'Madrid ciudad' })));
    e.ses.respuestas.length = 0;
    e.hoja('Comunicaciones_SES').datos.splice(1); // sin la RH, para centrarse en el parte
    return e;
  };
  const id = (e) => e.reserva().ID_Reserva;

  test('carga los huéspedes con lo que hay que cotejar y lo que falta corregir', () => {
    const e = conFormularios();
    const { data } = e.llamar('cargarViajeros', id(e));
    assert.deepEqual([data.personas, data.formularios, data.validados, data.puedeComunicar], [2, 2, 0, false]);
    const [adulto, menor] = data.huespedes;
    assert.deepEqual([adulto.nombre, adulto.documento, adulto.soporte], ['Ana García de la Fuente', 'DNI 12345678Z', 'ABC123456']);
    assert.equal(menor.faltaMunicipio, true);
    assert.ok(menor.municipiosProvincia.some((m) => m.codigo === '28079' && m.nombre === 'Madrid'));
  });

  test('validar el menor eligiendo el municipio lo corrige en el Form y guarda el código; con todos validados se puede comunicar', () => {
    const e = conFormularios();
    const [adulto, menor] = e.llamar('cargarViajeros', id(e)).data.huespedes;
    assert.equal(e.llamar('validarViajero', id(e), adulto.fila).success, true);
    assert.match(e.llamar('validarViajero', id(e), menor.fila).error, /municipio/);
    const r = e.llamar('validarViajero', id(e), menor.fila, '28079');
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.puedeComunicar, true);
    assert.equal(e.form.registros()[1]['Municipio del menor'], 'Madrid');
    assert.equal(e.hoja('Validacion_Viajeros').registros()[1].Codigo_INE_Municipio, '28079');
    assert.equal(r.data.huespedes[0].validado.por, 'ana@test.com');
  });

  test('comunicar envía el parte en el momento; "Comprobar ahora" trae el resultado y lo anota en el Form', () => {
    const e = conFormularios();
    const [adulto, menor] = e.llamar('cargarViajeros', id(e)).data.huespedes;
    e.llamar('validarViajero', id(e), adulto.fila);
    e.llamar('validarViajero', id(e), menor.fila, '28079');
    e.ses.respuestas.push({ cuerpo: altaOk });
    const r = e.llamar('comunicarParte', id(e));
    assert.equal(r.success, true, r.error);
    assert.deepEqual(r.data.estadoSES.parte, { estado: 'Enviada', codigo: '', error: '' });
    assert.match(e.ses.peticiones[0].opciones.payload, /<tipoComunicacion>PV<\/tipoComunicacion>/);
    e.ses.respuestas.push({ cuerpo: comunicada });
    const ahora = e.llamar('comprobarSES', id(e));
    assert.equal(ahora.data.estadoSES.parte.estado, 'Comunicada');
    assert.deepEqual(e.form.registros().map((f) => [f.Comunicados, f.Lote]), [[true, LOTE], [true, LOTE]]);
    const exito = e.correos.find((c) => /✓ SES Huéspedes: parte comunicado/.test(c.subject));
    assert.match(exito.body, /Validado por: \S+@\S+ · \d\d\/\d\d\/\d{4}/, 'quién validó en persona');
    assert.match(e.llamar('deshacerValidacionViajero', id(e), adulto.fila).error, /ya se ha enviado/);
    assert.match(e.llamar('comunicarParte', id(e)).error, /ya está enviado o comunicado/);
  });

  test('sin todos los formularios no se comunica', () => {
    const e = entornoSES();
    e.enviarForm(antesDeEntrar(filaAdulto()));
    const [adulto] = e.llamar('cargarViajeros', id(e)).data.huespedes;
    e.llamar('validarViajero', id(e), adulto.fila);
    assert.match(e.llamar('comunicarParte', id(e)).error, /Falta el formulario de 1 huésped/);
  });

  test('deshacer una validación antes de comunicar', () => {
    const e = conFormularios();
    const [adulto] = e.llamar('cargarViajeros', id(e)).data.huespedes;
    e.llamar('validarViajero', id(e), adulto.fila);
    assert.equal(e.llamar('deshacerValidacionViajero', id(e), adulto.fila).data.validados, 0);
  });

  test('solo Gestión y Admin pueden validar y comunicar', () => {
    const e = conFormularios();
    e.hoja('Usuarios_Autorizados').appendRow(['soporte@test.com', 'Sí', 'Soporte']);
    e.sesion.activo = 'soporte@test.com';
    assert.match(e.llamar('cargarViajeros', id(e)).error, /Gestión o Admin/);
    assert.match(e.llamar('comunicarParte', id(e)).error, /Gestión o Admin/);
  });
});

test.describe('F-30 · comprobar la conexión con SES', () => {
  const catalogoOk = '<r><resultado><codigo>0</codigo></resultado><respuesta><resultado><tupla><codigo>NIF</codigo><descripcion>NIF</descripcion></tupla><tupla><codigo>PAS</codigo><descripcion>Pasaporte</descripcion></tupla></resultado></respuesta></r>';
  const comoAdmin = (e) => {
    e.hoja('Usuarios_Autorizados').appendRow(['admin@test.com', 'Sí', 'Admin']);
    e.sesion.activo = 'admin@test.com';
    return e;
  };

  test('con credenciales válidas responde "correcta", indica el entorno y no escribe en el Sheet', () => {
    const e = comoAdmin(entornoSES());
    const catalogoAntes = e.hoja('Catálogo_SES').registros().length;
    e.ses.respuestas.push({ cuerpo: catalogoOk });
    const r = e.llamar('probarConexionSES');
    assert.equal(r.success, true, r.error);
    assert.equal(r.data.ok, true);
    assert.match(r.data.mensaje, /Conexión con SES correcta: ha respondido con 2 tipos de documento\. Entorno: pruebas \(pre-ses\)/);
    assert.match(e.ses.peticiones[0].opciones.payload, /TIPO_DOCUMENTO/);
    assert.equal(e.hoja('Catálogo_SES').registros().length, catalogoAntes, 'solo lectura');
    assert.ok(e.hoja('Logs').registros().some((l) => l.Tipo === 'SES_CONEXION'));
  });

  test('distingue credenciales rechazadas, SES sin respuesta y respuesta inesperada', () => {
    const e = comoAdmin(entornoSES());
    e.ses.respuestas.push({ http: 401, cuerpo: 'Unauthorized' }, { errorRed: 'timeout' }, { cuerpo: '<r><resultado><codigo>10101</codigo><descripcion>Arrendador no válido</descripcion></resultado></r>' });
    const mensajes = [1, 2, 3].map(() => e.llamar('probarConexionSES').data);
    assert.ok(mensajes.every((m) => m.ok === false));
    assert.match(mensajes[0].mensaje, /rechaza el usuario o la contraseña \(HTTP 401\)/);
    assert.match(mensajes[1].mensaje, /SES no responde: timeout/);
    assert.match(mensajes[2].mensaje, /de forma inesperada \(.*código 10101.*Arrendador no válido\)/);
  });

  test('sin credenciales lo dice sin llamar a SES', () => {
    const e = comoAdmin(entornoSES({ conCredenciales: false }));
    const r = e.llamar('probarConexionSES');
    assert.match(r.data.mensaje, /Faltan el usuario o la contraseña de SES/);
    assert.equal(e.ses.peticiones.length, 0);
  });

  test('solo un Admin puede usar el botón de la app', () => {
    const e = entornoSES();
    e.hoja('Usuarios_Autorizados').appendRow(['gestion@test.com', 'Sí', 'Gestión']);
    e.sesion.activo = 'gestion@test.com';
    assert.match(e.llamar('probarConexionSES').error, /Solo un administrador/);
    assert.equal(e.ses.peticiones.length, 0);
  });

  test('desde el menú del Sheet, la cuenta operativa ve el resultado en una ventana', () => {
    const e = entornoSES();
    e.ses.respuestas.push({ cuerpo: catalogoOk });
    const r = e.comoPropietario(() => e.llamar('comprobarConexionSES'));
    assert.equal(r.success, true);
    assert.match(e.alertas.at(-1), /Conexión con SES correcta/);
  });
});
