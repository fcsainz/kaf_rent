// Tests del script propio del Form de viajeros (ADR-0021, DD-02 §3.6), con dobles de FormApp, Sheets y propiedades.
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearEntorno, DIR_SRC_FORM } = require('../soporte/gas');
const { CABECERAS_FORM } = require('../soporte/form_viajeros');

const plano = (v) => JSON.parse(JSON.stringify(v));

// ---------- Dobles ----------
const NAVEGACION = { CONTINUE: 'CONTINUE', SUBMIT: 'SUBMIT' };
const TIPO = { LIST: 'LIST', MULTIPLE_CHOICE: 'MULTIPLE_CHOICE', TEXT: 'TEXT', DATE: 'DATE', PAGE_BREAK: 'PAGE_BREAK' };

const opcionFalsa = (valor, salto = null) => ({
  valor, salto,
  getValue: () => valor,
  getGotoPage: () => (salto && salto.pagina ? salto : null),
  getPageNavigationType: () => (salto && !salto.pagina ? salto : NAVEGACION.CONTINUE),
});

const preguntaFalsa = (titulo, tipo, opciones = []) => {
  const p = {
    titulo, tipo, opciones: opciones.map(([v, s]) => opcionFalsa(v, s)), validacion: null,
    getTitle: () => p.titulo, getType: () => p.tipo,
    getChoices: () => p.opciones,
    createChoice: (v, salto) => opcionFalsa(v, salto || null),
    setChoices: (nuevas) => { p.opciones = nuevas; },
    setValidation: (v) => { p.validacion = v; },
    setRequired: (r) => { p.obligatoria = r; return p; },
    setHelpText: (t) => { p.ayuda = t; return p; },
    isRequired: () => Boolean(p.obligatoria),
    getGoToPage: () => null,
  };
  p.asPageBreakItem = () => p;
  p.asListItem = () => p;
  p.asMultipleChoiceItem = () => p;
  p.asTextItem = () => p;
  return p;
};

const PAGINA_DNI = { pagina: 'Datos del DNI', getTitle: () => 'Datos del DNI' };
const PAGINA_PASAPORTE = { pagina: 'Datos del pasaporte', getTitle: () => 'Datos del pasaporte' };
const PAGINA_NIE = { pagina: 'Datos del NIE', getTitle: () => 'Datos del NIE' };

// Form con las preguntas de D-37 (títulos de la fixture compartida con KAF Rent, menos las retiradas).
const crearFormFalso = () => {
  const tipos = {
    Sexo: TIPO.MULTIPLE_CHOICE, 'Sexo del menor': TIPO.MULTIPLE_CHOICE, 'Fecha de nacimiento': TIPO.DATE,
    'Tipo de documento': TIPO.LIST, 'Tipo de documento del menor': TIPO.LIST,
    '¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?': TIPO.LIST,
    Nacionalidad: TIPO.LIST, 'Nacionalidad del menor': TIPO.LIST, País: TIPO.LIST, 'País del menor': TIPO.LIST,
    Provincia: TIPO.LIST, 'Provincia del menor': TIPO.LIST,
  };
  const titulos = CABECERAS_FORM.filter((c) => !['Marca temporal', 'Código de reserva de Airbnb', 'Comunicados', 'Usuario', 'Tipo_Comunicación', 'Fecha', 'Código de comunicación'].includes(c));
  const preguntas = titulos.map((t) => {
    const tipo = tipos[t.trim()] || TIPO.TEXT;
    const opcionesPorTitulo = {
      'Tipo de documento': [['DNI', PAGINA_DNI], ['NIE', PAGINA_NIE], ['Pasaporte', PAGINA_PASAPORTE], ['Otro', NAVEGACION.SUBMIT]],
      'Tipo de documento del menor': [['DNI'], ['NIE'], ['Pasaporte'], ['No tiene']],
    };
    const opciones = opcionesPorTitulo[t] || [];
    return preguntaFalsa(t, tipo, opciones);
  });
  const todas = (t) => preguntas.filter((p) => p.titulo.trim() === t);
  return { preguntas, pregunta: (t) => todas(t)[0], todas, getItems: () => preguntas };
};

const validacionFalsa = () => {
  const v = { ayuda: '', regla: null };
  const b = {
    setHelpText: (t) => { v.ayuda = t; return b; },
    requireTextIsEmail: () => { v.regla = 'email'; return b; },
    requireTextMatchesPattern: (p) => { v.regla = p; return b; },
    build: () => ({ ...v }),
  };
  return b;
};

const CATALOGO = [
  ['Catalogo', 'Codigo', 'Descripcion'],
  ['SEXO', 'M', 'Mujer'], ['SEXO', 'H', 'Hombre'],
  // TIPO_DOCUMENTO tal como lo devuelve SES en producción (2026-10-02).
  ['TIPO_DOCUMENTO', 'CIF', 'CIF'], ['TIPO_DOCUMENTO', 'CIF_E', 'CIF extranjero'], ['TIPO_DOCUMENTO', 'NIE', 'NIE'],
  ['TIPO_DOCUMENTO', 'NIF', 'NIF'], ['TIPO_DOCUMENTO', 'OTRO', 'Otro documento extranjero'], ['TIPO_DOCUMENTO', 'PAS', 'Pasaporte'],
  ['PAIS', 'GBR', 'Reino Unido'], ['PAIS', 'ESP', 'España'], ['PAIS', 'FRA', 'Francia'], ['PAIS', 'AUT', 'Austria'],
  ['PROVINCIA', '28', 'Madrid'], ['PROVINCIA', '01', 'Araba/Álava'],
];

const entornoForm = ({ catalogo = CATALOGO, idBbdd = 'BBDD-1' } = {}) => {
  const form = crearFormFalso();
  const alertas = [];
  const hoja = { getDataRange: () => ({ getValues: () => catalogo.map((f) => f.slice()) }) };
  const serviciosExtra = {
    FormApp: {
      ItemType: TIPO, PageNavigationType: NAVEGACION,
      getActiveForm: () => form,
      getUi: () => ({ alert: (t) => alertas.push(t) }),
      createTextValidation: validacionFalsa,
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k === 'BBDD_KAF_RENT_ID' ? idBbdd : null) }) },
    SpreadsheetApp: { openById: (id) => ({ getSheetByName: (n) => (id === 'BBDD-1' && n === 'Catálogo_SES' ? hoja : null) }) },
  };
  const e = crearEntorno({ dirSrc: DIR_SRC_FORM, serviciosExtra });
  return { ...e, form, alertas };
};

// ---------- Dominio ----------
test.describe('ADR-0021 · opciones de las listas del Form', () => {
  const { fn } = entornoForm();
  const filas = CATALOGO.slice(1).map(([catalogo, codigo, descripcion]) => ({ catalogo, codigo, descripcion }));

  test('países por orden alfabético con España primero', () => {
    assert.deepEqual(plano(fn('opcionesLista_')(filas, 'PAIS')), ['España', 'Austria', 'Francia', 'Reino Unido']);
  });

  test('provincias por orden alfabético y "Fuera de España" al final', () => {
    assert.deepEqual(plano(fn('opcionesLista_')(filas, 'PROVINCIA')), ['Araba/Álava', 'Madrid', 'Fuera de España']);
  });

  test('los catálogos de SES, en su orden; un catálogo vacío no da opciones', () => {
    assert.deepEqual(plano(fn('opcionesLista_')(filas, 'TIPO_DOCUMENTO')), ['CIF', 'CIF extranjero', 'NIE', 'NIF', 'Otro documento extranjero', 'Pasaporte']);
    assert.deepEqual(plano(fn('opcionesLista_')(filas, 'TIPO_PARENTESCO')), []);
  });

  test('los títulos del Form coinciden con los que lee KAF Rent', () => {
    const titulosKafRent = Object.values(crearEntorno().fn('PREGUNTAS_FORM_VIAJEROS')).flat().filter(Boolean);
    const plan = fn('planConfiguracion_')(filas);
    const titulosForm = [...plan.listas, ...plan.validaciones].map((p) => p.titulo);
    assert.deepEqual(titulosForm.filter((t) => !titulosKafRent.includes(t)), []);
  });
});

test.describe('ADR-0021 · expresiones de validación (las mismas que aplicará Forms)', () => {
  const { fn } = entornoForm();
  const regla = (titulo) => fn('planConfiguracion_')([]).validaciones.find((v) => v.titulo === titulo);
  const cumple = (titulo, valor) => new RegExp(regla(titulo).patron).test(valor);

  test('DNI y NIE con su formato; sin espacios ni guiones', () => {
    ['12345678Z', 'X1234567L', 'y1234567l'].forEach((v) => assert.ok(cumple('Número de documento (DNI o NIE)', v), v));
    ['1234567Z', '12345678-Z', '12345678 Z', 'A1234567L', ''].forEach((v) => assert.ok(!cumple('Número de documento (DNI o NIE)', v), v));
  });

  test('soporte de 9 letras y números; teléfono con prefijo internacional obligatorio', () => {
    assert.ok(cumple('Número de soporte', 'ABC123456'));
    assert.ok(!cumple('Número de soporte', 'ABC12345'));
    assert.ok(cumple('Teléfono Móvil', '+44 7700 900123'));
    assert.ok(cumple('Teléfono Móvil', '+34600111222'));
    assert.ok(!cumple('Teléfono Móvil', '600 111 222'), 'sin prefijo no');
    assert.ok(!cumple('Teléfono Móvil', '+34 600-111-222'));
    assert.equal(regla('Email').email, true);
  });
});

// ---------- Configurar el Form ----------
test.describe('ADR-0021 · configurarFormulario', () => {
  test('rellena los desplegables y pone las validaciones con su mensaje', () => {
    const e = entornoForm();
    const informe = e.llamar('configurarFormulario');
    assert.deepEqual(plano(e.form.pregunta('Nacionalidad').opciones.map((o) => o.valor)), ['España', 'Austria', 'Francia', 'Reino Unido']);
    assert.deepEqual(plano(e.form.pregunta('Sexo del menor').opciones.map((o) => o.valor)), ['Mujer', 'Hombre']);
    const dni = e.form.pregunta('Número de documento (DNI o NIE)').validacion;
    assert.match(dni.ayuda, /12345678Z/);
    assert.equal(e.form.pregunta('Email').validacion.regla, 'email');
    assert.deepEqual(informe.faltan, []);
    assert.deepEqual(informe.errores, []);
  });

  test('D-42 · el catálogo de SES tal cual: cada opción lleva a su sección (NIF a la del DNI; el resto, a la del pasaporte)', () => {
    const e = entornoForm();
    const informe = e.llamar('configurarFormulario');
    const opciones = e.form.pregunta('Tipo de documento').opciones;
    assert.deepEqual(plano(opciones.map((o) => [o.valor, o.salto && o.salto.pagina])), [
      ['CIF', 'Datos del pasaporte'], ['CIF extranjero', 'Datos del pasaporte'], ['NIE', 'Datos del NIE'],
      ['NIF', 'Datos del DNI'], ['Otro documento extranjero', 'Datos del pasaporte'], ['Pasaporte', 'Datos del pasaporte'],
    ]);
    assert.deepEqual(informe.saltos, ['Tipo de documento → Otro'], 'avisa de la opción antigua con salto que desaparece');
  });

  test('D-42 · si alguna opción no tiene a qué sección ir, no cambia la pregunta y dice qué opciones encontró', () => {
    const e = entornoForm();
    e.form.pregunta('Tipo de documento').opciones = [['D.N.I.', PAGINA_DNI], ['NIE', PAGINA_NIE], ['Pasaporte', PAGINA_PASAPORTE]].map(([v, s]) => ({
      valor: v, salto: s, getValue: () => v, getGotoPage: () => s, getPageNavigationType: () => NAVEGACION.CONTINUE,
    }));
    const informe = e.llamar('configurarFormulario');
    assert.deepEqual(plano(e.form.pregunta('Tipo de documento').opciones.map((o) => o.valor)), ['D.N.I.', 'NIE', 'Pasaporte']);
    assert.match(informe.errores.join(), /no sé a qué sección llevar NIF \(opciones actuales: D\.N\.I\., NIE, Pasaporte\); no se ha cambiado/);
  });

  test('el tipo de documento del menor conserva "No tiene", que no está en el catálogo de SES', () => {
    const e = entornoForm();
    e.llamar('configurarFormulario');
    assert.deepEqual(plano(e.form.pregunta('Tipo de documento del menor').opciones.map((o) => o.valor)), ['CIF', 'CIF extranjero', 'NIE', 'NIF', 'Otro documento extranjero', 'Pasaporte', 'No tiene']);
  });

  test('un título repetido en varias secciones (DNI y NIE) recibe la validación en todas', () => {
    const e = entornoForm();
    e.llamar('configurarFormulario');
    const soportes = e.form.todas('Número de soporte');
    assert.equal(soportes.length, 2);
    soportes.forEach((p) => assert.equal(p.validacion.regla, '^[A-Za-z0-9]{9}$'));
  });

  test('encuentra las preguntas sin distinguir mayúsculas ni acentos', () => {
    const e = entornoForm();
    e.form.pregunta('Email').titulo = 'EMAIL';
    assert.ok(!e.llamar('configurarFormulario').faltan.includes('Email'));
  });

  test('un catálogo vacío no borra las opciones actuales: lo dice en el informe', () => {
    const e = entornoForm();
    const parentesco = '¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?';
    assert.ok(e.llamar('configurarFormulario').sinDatos.includes(parentesco));
  });

  test('una pregunta que no está o es de otro tipo no impide configurar las demás', () => {
    const e = entornoForm();
    e.form.preguntas.splice(e.form.preguntas.indexOf(e.form.pregunta('Provincia del menor')), 1);
    e.form.pregunta('Sexo').tipo = TIPO.TEXT;
    const informe = e.llamar('configurarFormulario');
    assert.deepEqual(informe.faltan, ['Provincia del menor']);
    assert.match(informe.errores[0], /^Sexo: .*desplegable u opción única/);
    assert.ok(informe.aplicadas.includes('Sexo del menor'));
  });

  test('fase 1 · sin catálogo pone igualmente las validaciones, no toca las listas y explica qué falta', () => {
    const e = entornoForm({ idBbdd: null });
    const informe = e.llamar('configurarFormulario');
    assert.match(informe.errores[0], /BBDD_KAF_RENT_ID/);
    assert.ok(informe.sinDatos.includes('Nacionalidad'));
    assert.equal(e.form.pregunta('Email').validacion.regla, 'email');
    assert.deepEqual(plano(e.form.pregunta('Tipo de documento').opciones.map((o) => o.valor)), ['DNI', 'NIE', 'Pasaporte', 'Otro']);
  });

  test('D-37 (E) · los dos "Segundo Apellido" pasan a obligatorios con la indicación del guion', () => {
    const e = entornoForm();
    e.llamar('configurarFormulario');
    ['Segundo Apellido', 'Segundo Apellido del menor de edad'].forEach((t) => {
      assert.equal(e.form.pregunta(t).obligatoria, true, t);
      assert.match(e.form.pregunta(t).ayuda, /guion \(-\)/);
    });
  });

  test('describirFormulario lista secciones, preguntas, obligatorias y saltos sin cambiar nada', () => {
    const e = entornoForm();
    e.form.preguntas.unshift(preguntaFalsa('Datos personales', TIPO.PAGE_BREAK));
    e.form.pregunta('Nombre').obligatoria = true;
    const texto = e.fn('describirFormulario')();
    assert.match(texto, /=== SECCIÓN: Datos personales/);
    assert.match(texto, /- \[TEXT\] Nombre \*/);
    assert.match(texto, /· DNI → «Datos del DNI»/);
    assert.match(texto, /· Otro → SUBMIT/);
    assert.equal(e.form.pregunta('Tipo de documento').opciones.length, 4, 'no toca las opciones');
  });

  test('describirFormulario resume las listas largas sin saltos para que el registro no se corte', () => {
    const e = entornoForm();
    e.llamar('configurarFormulario');
    e.form.pregunta('Nacionalidad').opciones = Array.from({ length: 20 }, (_, i) => opcionFalsa(`País ${i}`));
    const texto = e.fn('describirFormulario')();
    assert.match(texto, /\[LIST\] Nacionalidad\n {6}· 20 opciones, sin saltos: País 0, País 1, País 2…/);
    assert.doesNotMatch(texto, /País 19/);
  });

  test('desde el menú muestra el informe al usuario', () => {
    const e = entornoForm();
    e.fn('configurarFormularioDesdeMenu')();
    assert.match(e.alertas[0], /^Preguntas actualizadas: \d+\./);
  });
});
