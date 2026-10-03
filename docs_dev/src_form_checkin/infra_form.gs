// Capa: INFRAESTRUCTURA — el Form (FormApp) y la hoja Catálogo_SES de BBDD_KAF_Rent (ADR-0021).
// Solo lee el Sheet de KAF Rent: los catálogos los pide a SES KAF Rent, que es quien tiene las credenciales.

const PROPIEDAD_ID_BBDD = 'BBDD_KAF_RENT_ID';
const HOJA_CATALOGO_SES = 'Catálogo_SES';
const COLUMNAS_CATALOGO = { catalogo: 'Catalogo', codigo: 'Codigo', descripcion: 'Descripcion' };

const hojaCatalogo_ = () => {
  const id = PropertiesService.getScriptProperties().getProperty(PROPIEDAD_ID_BBDD);
  if (!id) throw new Error(`Falta la propiedad del script ${PROPIEDAD_ID_BBDD} con el ID de BBDD_KAF_Rent (Configuración del proyecto → Propiedades del script).`);
  const hoja = SpreadsheetApp.openById(id).getSheetByName(HOJA_CATALOGO_SES);
  if (!hoja) throw new Error(`BBDD_KAF_Rent no tiene la hoja ${HOJA_CATALOGO_SES}. Pulsa "Reparar hojas" en KAF Rent.`);
  return hoja;
};

// [{ catalogo, codigo, descripcion }] leídas en bloque, por nombre de columna.
const leerCatalogoSES_ = () => {
  const [cabecera, ...filas] = hojaCatalogo_().getDataRange().getValues();
  const titulos = cabecera.map((c) => String(c).trim());
  const indices = Object.fromEntries(Object.entries(COLUMNAS_CATALOGO).map(([campo, titulo]) => [campo, titulos.indexOf(titulo)]));
  const faltan = Object.values(COLUMNAS_CATALOGO).filter((titulo) => !titulos.includes(titulo));
  if (faltan.length > 0) throw new Error(`A ${HOJA_CATALOGO_SES} le faltan las columnas ${faltan.join(', ')}.`);
  return filas.map((f) => ({ catalogo: String(f[indices.catalogo]).trim(), codigo: String(f[indices.codigo]).trim(), descripcion: f[indices.descripcion] }));
};

// Título normalizado → preguntas del Form con ese título (puede haber varias, una por sección).
const preguntasPorTitulo_ = (form) => form.getItems().reduce((mapa, item) => {
  const clave = normalizarTitulo_(item.getTitle());
  return mapa.set(clave, [...(mapa.get(clave) || []), item]);
}, new Map());

const preguntaDeOpciones_ = (item) => {
  if (item.getType() === FormApp.ItemType.LIST) return item.asListItem();
  if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) return item.asMultipleChoiceItem();
  throw new Error(`"${item.getTitle().trim()}" debe ser desplegable u opción única`);
};

// Salto de sección de una opción, o null si simplemente continúa.
const saltoDe_ = (opcion) => {
  const salto = opcion.getGotoPage() || opcion.getPageNavigationType();
  return salto && salto !== FormApp.PageNavigationType.CONTINUE ? salto : null;
};

const navegacionDe_ = (opcion) => opcion.getGotoPage() || opcion.getPageNavigationType();

// Sustituye las opciones. Si la pregunta salta según la respuesta, todas llevan su sección (la suya o la heredada,
// D-42); si alguna no la tiene, no se cambia nada y se explica. Devuelve las opciones antiguas con salto que desaparecen.
const aplicarOpciones_ = (item, opciones) => {
  const pregunta = preguntaDeOpciones_(item);
  const actuales = pregunta.getChoices();
  const conSalto = actuales.filter(saltoDe_).map((o) => o.getValue());
  if (conSalto.length === 0) {
    pregunta.setChoices(opciones.map((v) => pregunta.createChoice(v)));
    return [];
  }
  const navegacion = new Map(actuales.map((o) => [normalizarTitulo_(o.getValue()), navegacionDe_(o)]));
  const { asignadas, sinSalto, perdidos } = planSaltos_(navegacion, conSalto, opciones);
  if (sinSalto.length > 0) {
    throw new Error(`no sé a qué sección llevar ${sinSalto.join(', ')} (opciones actuales: ${actuales.map((o) => o.getValue()).join(', ')}); no se ha cambiado`);
  }
  pregunta.setChoices(asignadas.map(([v, n]) => pregunta.createChoice(v, n)));
  return perdidos;
};

// Descripción de una pregunta para el diagnóstico: tipo, obligatoria y, en las de opciones, a dónde salta cada una.
const describirPregunta_ = (item) => {
  const tipo = String(item.getType());
  if (tipo === String(FormApp.ItemType.PAGE_BREAK)) {
    const seccion = item.asPageBreakItem();
    const destino = seccion.getGoToPage() ? ` (al terminar la anterior → «${seccion.getGoToPage().getTitle()}»)` : '';
    return `\n=== SECCIÓN: ${item.getTitle()}${destino}`;
  }
  const conOpciones = [String(FormApp.ItemType.LIST), String(FormApp.ItemType.MULTIPLE_CHOICE)].includes(tipo);
  const obligatoria = conOpciones || tipo === String(FormApp.ItemType.TEXT) ? (preguntaConObligatoria_(item).isRequired() ? ' *' : '') : '';
  const opciones = conOpciones ? describirOpciones_(preguntaDeOpciones_(item).getChoices()) : '';
  return `  - [${tipo}] ${item.getTitle().trim()}${obligatoria}${opciones}`;
};

// Las listas largas sin saltos (países, provincias) se resumen: el registro de Apps Script corta los textos largos.
const MAX_OPCIONES_DESCRITAS = 15;
const describirOpciones_ = (choices) => {
  if (choices.length > MAX_OPCIONES_DESCRITAS && !choices.some(saltoDe_)) {
    return `\n      · ${choices.length} opciones, sin saltos: ${choices.slice(0, 3).map((o) => o.getValue()).join(', ')}…`;
  }
  return choices.map((o) => `\n      · ${o.getValue()}${saltoDe_(o) ? ` → ${saltoDe_(o).getTitle ? `«${saltoDe_(o).getTitle()}»` : saltoDe_(o)}` : ''}`).join('');
};

const preguntaConObligatoria_ = (item) => (String(item.getType()) === String(FormApp.ItemType.TEXT) ? item.asTextItem() : preguntaDeOpciones_(item));

const aplicarObligatoria_ = (item, ayuda) => {
  if (item.getType() !== FormApp.ItemType.TEXT) throw new Error(`"${item.getTitle().trim()}" debe ser de respuesta corta`);
  item.asTextItem().setRequired(true).setHelpText(ayuda);
};

const aplicarValidacion_ = (item, regla) => {
  if (item.getType() !== FormApp.ItemType.TEXT) throw new Error(`"${item.getTitle().trim()}" debe ser de respuesta corta`);
  const validacion = FormApp.createTextValidation().setHelpText(regla.mensaje);
  const conRegla = regla.email ? validacion.requireTextIsEmail() : validacion.requireTextMatchesPattern(regla.patron);
  item.asTextItem().setValidation(conRegla.build());
};
