// Cabeceras reales del Google Form de viajeros tras la fase 1 de D-37 (leídas el 2026-10-02, sin respuestas).
// Incluye la columna de la pregunta borrada (código del menor) y los títulos repetidos (nº de documento en la sección
// del DNI y en la del NIE, etc.). Si el Form cambia, los tests de títulos fallan antes que la lectura en real (R-22).
const CABECERAS_FORM = [
  'Marca temporal', '¿El huésped tiene la mayoría de edad?', 'Código de reserva', 'Nombre', 'Primer Apellido',
  'Fecha de nacimiento', 'Nacionalidad', 'Sexo', 'Dirección Postal', 'Código Postal', 'Municipio', 'Provincia', 'País',
  'Tipo de documento', 'Código de reserva de Airbnb',
  '¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre? ',
  'Nombre y Apellidos responsable del menor', 'Nombre menor de edad', 'Primer Apellido del menor de edad',
  'Fecha de nacimiento del menor', 'Nacionalidad del menor', 'Sexo del menor', 'Dirección Postal de menor',
  'Código Postal del menor', 'Municipio del menor', 'Provincia del menor', 'País del menor', 'Tipo de documento del menor',
  'Número de documento (DNI o NIE)', 'Número de soporte', 'Número de documento (DNI o NIE)', 'Número de soporte',
  'Número de pasaporte', 'Número de pasaporte', 'Teléfono Móvil', 'Email',
  'Declaro que los datos que he facilitado en este formulario son veraces, exactos y corresponden a la identidad comunicada, y  en caso de haber comunicado documento legal identificativo me comprometo a mostrarlo a mi llegada al alojamiento para su verificación.  ',
  '¿Motivo de su hospedaje?',
  'Declaro que los datos que he facilitado en este formulario son veraces, exactos y corresponden a la identidad comunicada, y me comprometo a mostrar mi documento legal de identidad a mi llegada al alojamiento para su verificación.  ',
  'Segundo Apellido del menor de edad', 'Segundo Apellido', 'Comunicados', 'Usuario', 'Tipo_Comunicación', 'Fecha',
  'Código de comunicación', 'Lote',
  // Columnas de la reserva (RH) y de la anulación, creadas en el Sheet real el 2026-10-02 (AU–BD).
  'Reserva comunicada', 'Lote reserva', 'Código comunicación reserva', 'Fecha comunicación reserva', 'Usuario comunicación reserva',
  // Anulación al cancelar la reserva (ADR-0022).
  'Anulación SES', 'Lote anulación', 'Fecha anulación', 'Usuario anulación',
];

// Fila del Sheet a partir de { título: valor }: un título repetido se rellena en su primera columna; el resto, vacío.
const fila = (valores) => CABECERAS_FORM.map((c, i) => {
  const titulo = c.trim();
  const primera = CABECERAS_FORM.findIndex((x) => x.trim() === titulo) === i;
  return primera && valores[titulo] !== undefined ? valores[titulo] : '';
});

// Datos inventados. 12345678Z es un DNI con la letra correcta.
const datosAdulto = {
  'Marca temporal': new Date(2030, 5, 20, 10, 0), 'Código de reserva': 'hm test 1234', '¿El huésped tiene la mayoría de edad?': 'Sí',
  Nombre: 'Ana', 'Primer Apellido': 'García', 'Segundo Apellido': 'de la Fuente', 'Fecha de nacimiento': new Date(1985, 2, 7),
  Nacionalidad: 'España', Sexo: 'Mujer', 'Dirección Postal': 'C/ Mayor 1, 2ºB', 'Código Postal': '28001', Municipio: 'Madrid',
  Provincia: 'Madrid', País: 'España', 'Tipo de documento': 'DNI', 'Número de documento (DNI o NIE)': '12345678Z',
  'Número de soporte': 'ABC123456', 'Teléfono Móvil': '+34 600111222', Email: 'ana@ejemplo.es',
};
const datosMenor = {
  'Marca temporal': new Date(2030, 5, 20, 10, 5), 'Código de reserva': 'HMTEST1234', '¿El huésped tiene la mayoría de edad?': 'No',
  '¿Cuál es su relación con el adulto responsable que rellena este formulario en su nombre?': 'Hijo/a',
  'Nombre y Apellidos responsable del menor': 'Ana García de la Fuente', 'Nombre menor de edad': 'Leo', 'Primer Apellido del menor de edad': 'García',
  'Segundo Apellido del menor de edad': 'Pérez', 'Fecha de nacimiento del menor': '15/04/2018', 'Nacionalidad del menor': 'España',
  'Sexo del menor': 'Hombre', 'Dirección Postal de menor': 'C/ Mayor 1, 2ºB', 'Código Postal del menor': '28001',
  'Municipio del menor': 'Madrid', 'Provincia del menor': 'Madrid', 'País del menor': 'España',
};
const filaAdulto = (cambios = {}) => fila({ ...datosAdulto, ...cambios });
const filaMenor = (cambios = {}) => fila({ ...datosMenor, ...cambios });

// Filas de Catálogo_SES: los textos del Form son las descripciones (D-37).
const CATALOGO = [
  ['PAIS', 'ESP', 'España'], ['PAIS', 'FRA', 'Francia'], ['PAIS', 'GBR', 'Reino Unido'],
  ['SEXO', 'M', 'Mujer'], ['SEXO', 'H', 'Hombre'],
  // TIPO_DOCUMENTO como lo devuelve SES en producción (2026-10-02).
  ['TIPO_DOCUMENTO', 'NIF', 'NIF'], ['TIPO_DOCUMENTO', 'NIE', 'NIE'], ['TIPO_DOCUMENTO', 'PAS', 'Pasaporte'], ['TIPO_DOCUMENTO', 'OTRO', 'Otro documento extranjero'],
  ['TIPO_PARENTESCO', 'HJ', 'Hijo/a'],
  ['PROVINCIA', '28', 'Madrid'], ['PROVINCIA', '01', 'Araba/Álava'],
].map(([catalogo, codigo, descripcion]) => ({ catalogo, codigo, descripcion }));
const MUNICIPIOS = [{ provincia: 'Madrid', municipio: 'Madrid', codigo: '28079' }, { provincia: 'Álava', municipio: 'Agurain/Salvatierra', codigo: 1051 }];

module.exports = { CABECERAS_FORM, fila, filaAdulto, filaMenor, CATALOGO, MUNICIPIOS };
