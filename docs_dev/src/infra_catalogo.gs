// Capa: INFRAESTRUCTURA — lectura de los catálogos configurables del Sheet (ADR-0003). Solo lectura.

// Espacios en el orden del catálogo. `soloActivos` = false incluye también los desactivados (histórico fiscal).
const obtenerEspacios_ = ({ soloActivos = true } = {}) => registrosDe_(HOJA_CAT_ESPACIOS)
  .filter((e) => texto_(e.nombre) !== '' && (!soloActivos || esVerdadero_(e.activo)))
  .map((e) => ({ nombre: texto_(e.nombre), modoFecha: texto_(e.modoFecha), nombreCorto: texto_(e.nombreCorto) || texto_(e.nombre) }));

const nombresEspacios_ = (opciones) => obtenerEspacios_(opciones).map((e) => e.nombre);

const obtenerCanalesActivos_ = (espacio) => registrosDe_(HOJA_CAT_CANALES)
  .filter((c) => texto_(c.espacio) === espacio && texto_(c.nombre) !== '' && esVerdadero_(c.activo))
  .map((c) => ({
    nombre: texto_(c.nombre),
    comision: c.comision === '' ? '' : Number(c.comision),
    gestionContrato: texto_(c.gestionContrato),
    costeFijo: numero_(c.costeFijo),
    requiereRef: esVerdadero_(c.requiereRef),
  }));

// Nombres de los canales activos de cada espacio con una sola lectura del catálogo (RNF-05: nada de leer en bucle).
const nombresCanalesActivosPorEspacio_ = () => {
  const activos = registrosDe_(HOJA_CAT_CANALES).filter((c) => texto_(c.nombre) !== '' && esVerdadero_(c.activo));
  return (espacio) => activos.filter((c) => texto_(c.espacio) === espacio).map((c) => texto_(c.nombre));
};

const obtenerServiciosActivos_ = (espacio) => registrosDe_(HOJA_CAT_SERVICIOS)
  .filter((s) => texto_(s.espacio) === espacio && texto_(s.nombre) !== '' && esVerdadero_(s.activo))
  .map((s) => ({ nombre: texto_(s.nombre), costeUnitario: numero_(s.coste), precioUnitario: numero_(s.precio) }));

const obtenerCategoriasGastoActivas_ = () => registrosDe_(HOJA_CAT_CATEGORIAS_GASTO)
  .filter((c) => texto_(c.nombre) !== '' && esVerdadero_(c.activo))
  .map((c) => ({ nombre: texto_(c.nombre), deducibleDefault: esVerdadero_(c.deducibleDefault) }));
