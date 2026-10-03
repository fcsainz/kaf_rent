// Capa: DOMINIO — configuración del Form de viajeros (ADR-0021, DD-02 §3.6), como funciones PURAS.
// Qué opciones lleva cada desplegable y qué validación cada campo de texto. Los títulos son el contrato con
// KAF Rent (PREGUNTAS_FORM_VIAJEROS en docs_dev/src/dominio_ses.gs): si cambian aquí, cambian allí.

const CATALOGO_FORM = { SEXO: 'SEXO', TIPO_DOCUMENTO: 'TIPO_DOCUMENTO', PARENTESCO: 'TIPO_PARENTESCO', PAIS: 'PAIS', PROVINCIA: 'PROVINCIA' };
const PAIS_PRIMERO = 'España';
const FUERA_DE_ESPANA = 'Fuera de España';

// Desplegables u opción única: título de la pregunta → catálogo de la hoja Catálogo_SES, más las opciones propias del
// Form que SES no tiene (el menor puede no tener documento y la pregunta es obligatoria).
const LISTAS_FORM = [
  { catalogo: 'SEXO', titulos: ['Sexo', 'Sexo del menor'] },
  { catalogo: 'TIPO_DOCUMENTO', titulos: ['Tipo de documento'] },
  { catalogo: 'TIPO_DOCUMENTO', titulos: ['Tipo de documento del menor'], extras: ['No tiene'] },
  { catalogo: 'TIPO_PARENTESCO', titulos: ['¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?'] },
  { catalogo: 'PAIS', titulos: ['Nacionalidad', 'Nacionalidad del menor', 'País', 'País del menor'] },
  { catalogo: 'PROVINCIA', titulos: ['Provincia', 'Provincia del menor'] },
];

// Validaciones de los campos de texto: Forms las comprueba al rellenar y muestra el mensaje bajo la pregunta.
// Un título puede estar en varias secciones (DNI, NIE): la regla se pone en todas.
const VALIDACIONES_FORM = [
  {
    titulos: ['Número de documento (DNI o NIE)'],
    patron: '^([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])$',
    mensaje: 'El DNI son 8 números y una letra (12345678Z); el NIE, X, Y o Z seguida de 7 números y una letra (X1234567L). Sin espacios ni guiones.',
  },
  {
    titulos: ['Número de soporte'],
    patron: '^[A-Za-z0-9]{9}$',
    mensaje: 'El número de soporte tiene 9 letras y números, sin espacios (p. ej. ABC123456). Aparece en el documento como «Nº de soporte» o «IDESP».',
  },
  { titulos: ['Email'], email: true, mensaje: 'Escribe un email válido, p. ej. nombre@correo.com' },
  {
    titulos: ['Teléfono Móvil'],
    patron: '^\\+[0-9][0-9 ]{7,19}$',
    mensaje: 'Escribe el teléfono con el prefijo de tu país, empezando por +, p. ej. +34 600 111 222',
  },
];

// Los títulos se comparan sin distinguir mayúsculas, acentos ni espacios al final (igual que KAF Rent).
const normalizarTitulo_ = (titulo) => String(titulo).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Preguntas que pasan a obligatorias con una descripción que explica qué poner (D-37, opción E: el segundo
// apellido lo exige SES con DNI; quien no tiene escribe un guion y KAF Rent lo entiende como vacío).
const OBLIGATORIAS_FORM = [
  { titulos: ['Segundo Apellido', 'Segundo Apellido del menor de edad'], ayuda: 'Si no tiene segundo apellido, escriba un guion (-).' },
];

const ordenAlfabetico_ = (lista) => [...lista].sort((a, b) => a.localeCompare(b, 'es'));

// Opciones de un catálogo: países por orden alfabético con España primero; provincias con "Fuera de España" al final;
// el resto, en el orden de la hoja (como los devuelve SES). [] si el catálogo aún no tiene filas.
const opcionesLista_ = (filasCatalogo, catalogo) => {
  const descripciones = [...new Set(filasCatalogo
    .filter((f) => f.catalogo === catalogo)
    .map((f) => String(f.descripcion).trim())
    .filter(Boolean))];
  if (descripciones.length === 0) return [];
  if (catalogo === CATALOGO_FORM.PAIS) {
    const resto = ordenAlfabetico_(descripciones.filter((d) => d !== PAIS_PRIMERO));
    return descripciones.includes(PAIS_PRIMERO) ? [PAIS_PRIMERO, ...resto] : resto;
  }
  if (catalogo === CATALOGO_FORM.PROVINCIA) return [...ordenAlfabetico_(descripciones), FUERA_DE_ESPANA];
  return descripciones;
};

// Opciones de una lista con sus extras al final; sin catálogo no hay opciones (no se toca la pregunta).
const opcionesConExtras_ = (filasCatalogo, { catalogo, extras = [] }) => {
  const opciones = opcionesLista_(filasCatalogo, catalogo);
  return opciones.length === 0 ? [] : [...opciones, ...extras.filter((e) => !opciones.includes(e))];
};

// Qué hay que aplicar en el Form: una entrada por título.
const planConfiguracion_ = (filasCatalogo) => ({
  listas: LISTAS_FORM.flatMap((l) => l.titulos.map((titulo) => ({ titulo, catalogo: l.catalogo, opciones: opcionesConExtras_(filasCatalogo, l) }))),
  validaciones: VALIDACIONES_FORM.flatMap(({ titulos, ...regla }) => titulos.map((titulo) => ({ titulo, ...regla }))),
  obligatorias: OBLIGATORIAS_FORM.flatMap(({ titulos, ayuda }) => titulos.map((titulo) => ({ titulo, ayuda }))),
});

// D-42 (C): el desplegable muestra el catálogo de SES tal cual. Cada opción nueva lleva a la sección de la opción
// antigua equivalente: el DNI es el NIF; el resto de documentos piden un número libre, como el pasaporte.
const SALTO_HEREDADO_DE = { NIF: 'DNI', 'Otro documento extranjero': 'Pasaporte', CIF: 'Pasaporte', 'CIF extranjero': 'Pasaporte' };

// Forms no admite mezclar opciones con y sin salto: si la pregunta salta según la respuesta, cada opción nueva toma
// la navegación de su opción actual o de la heredada. `navegacion`: Map título normalizado → navegación actual.
// Devuelve las opciones con su navegación, las que no tienen a dónde ir y las antiguas con salto que desaparecen.
const planSaltos_ = (navegacion, valoresConSalto, opciones) => {
  const de = (v) => navegacion.get(normalizarTitulo_(v));
  const asignadas = opciones.map((v) => [v, de(v) || (SALTO_HEREDADO_DE[v] ? de(SALTO_HEREDADO_DE[v]) : null) || null]);
  const heredadas = opciones.map((v) => SALTO_HEREDADO_DE[v]).filter(Boolean).map(normalizarTitulo_);
  const nuevas = opciones.map(normalizarTitulo_);
  return {
    asignadas,
    sinSalto: asignadas.filter(([, n]) => !n).map(([v]) => v),
    perdidos: valoresConSalto.filter((v) => !nuevas.includes(normalizarTitulo_(v)) && !heredadas.includes(normalizarTitulo_(v))),
  };
};

// Informe legible para quien ejecuta el script desde el editor del Form.
const textoInforme_ = ({ aplicadas, faltan, sinDatos, saltos, errores }) => [
  `Preguntas actualizadas: ${aplicadas.length}.`,
  faltan.length ? `No encontradas en el Form (revisa el título): ${faltan.join(' · ')}.` : '',
  sinDatos.length ? `Sin opciones todavía (catálogo vacío en KAF Rent): ${sinDatos.join(' · ')}.` : '',
  saltos.length ? `Revisa los saltos de sección de: ${saltos.join(' · ')}.` : '',
  errores.length ? `Errores: ${errores.map((e) => e.replace(/\.+$/, '')).join(' · ')}.` : '',
].filter(Boolean).join('\n');
