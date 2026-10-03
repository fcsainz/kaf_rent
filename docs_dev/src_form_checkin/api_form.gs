// Capa: API — entradas del script del Form de viajeros (ADR-0021): menú en el editor del Form y configuración.
// Las ejecuta quien edita el Form (la cuenta propietaria); los huéspedes nunca ejecutan este código.

const onOpen = () => FormApp.getUi()
  .createMenu('KAF Rent')
  .addItem('Actualizar listas y validaciones', 'configurarFormularioDesdeMenu')
  .addToUi();

// Aplica cada entrada del plan por separado: un fallo en una pregunta no impide configurar las demás.
const aplicarPlan_ = (preguntas, plan) => {
  const informe = { aplicadas: [], faltan: [], sinDatos: [], saltos: [], errores: [] };
  const aplicar = (titulo, accion) => {
    const items = preguntas.get(normalizarTitulo_(titulo)) || [];
    if (items.length === 0) { informe.faltan.push(titulo); return; }
    try {
      items.forEach(accion);
      informe.aplicadas.push(titulo);
    } catch (error) {
      console.error(`configurarFormulario · ${titulo}`, error);
      informe.errores.push(`${titulo}: ${error.message}`);
    }
  };
  plan.listas.forEach(({ titulo, opciones }) => {
    if (opciones.length === 0) { informe.sinDatos.push(titulo); return; }
    aplicar(titulo, (item) => informe.saltos.push(...aplicarOpciones_(item, opciones).map((v) => `${titulo} → ${v}`)));
  });
  plan.validaciones.forEach((regla) => aplicar(regla.titulo, (item) => aplicarValidacion_(item, regla)));
  plan.obligatorias.forEach(({ titulo, ayuda }) => aplicar(titulo, (item) => aplicarObligatoria_(item, ayuda)));
  return informe;
};

// Sin catálogo (aún no existe la hoja o falta la propiedad) se ponen igualmente las validaciones (fase 1, DD-02 §3.6).
const catalogoOVacio_ = () => {
  try {
    return { filas: leerCatalogoSES_(), aviso: '' };
  } catch (error) {
    console.error('configurarFormulario · catálogo', error);
    return { filas: [], aviso: `Catálogo no disponible: ${error.message}` };
  }
};

// Rellena los desplegables desde Catálogo_SES y pone las validaciones. Se puede repetir cuando cambien los catálogos.
const configurarFormulario = () => {
  const { filas, aviso } = catalogoOVacio_();
  const informe = aplicarPlan_(preguntasPorTitulo_(FormApp.getActiveForm()), planConfiguracion_(filas));
  if (aviso) informe.errores.unshift(aviso);
  console.log(textoInforme_(informe));
  return informe;
};

// Solo lectura: escribe en el registro la estructura del Form (secciones, preguntas, obligatorias y saltos).
const describirFormulario = () => {
  const texto = FormApp.getActiveForm().getItems().map(describirPregunta_).join('\n');
  console.log(texto);
  return texto;
};

const configurarFormularioDesdeMenu = () => FormApp.getUi().alert(textoInforme_(configurarFormulario()));
