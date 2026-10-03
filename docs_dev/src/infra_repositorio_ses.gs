// Capa: INFRAESTRUCTURA — repositorio de SES.Hospedajes: Catálogo_SES, Municipios_INE y Comunicaciones_SES (DD-02 §3.2).
// Ninguna de estas hojas guarda datos personales de los huéspedes.

const leerCatalogoSES_ = () => registrosDe_(HOJA_CATALOGO_SES)
  .map((r) => ({ catalogo: texto_(r.catalogo), codigo: texto_(r.codigo), descripcion: texto_(r.descripcion) }))
  .filter((r) => r.catalogo && r.codigo);

// Sustituye las filas de un catálogo conservando los demás (PAIS y PROVINCIA no vienen de SES).
const reemplazarCatalogoSES_ = (catalogo, tuplas) => {
  const tabla = leerTabla_(HOJA_CATALOGO_SES);
  const otras = tabla.entradas.map((e) => e.registro).filter((r) => texto_(r.catalogo) !== catalogo);
  reescribirRegistros_(tabla, [...otras, ...tuplas.map((t) => ({ catalogo, codigo: t.codigo, descripcion: t.descripcion }))]);
};

const leerMunicipiosINE_ = () => registrosDe_(HOJA_MUNICIPIOS_INE)
  .map((r) => ({ provincia: texto_(r.provincia), municipio: texto_(r.municipio), codigo: texto_(r.codigo) }));

// Filas_Form: números de fila del Sheet del Form separados por comas.
const SEPARADOR_FILAS_FORM = ',';
const filasFormDe_ = (registro) => texto_(registro.filasForm).split(SEPARADOR_FILAS_FORM).map(Number).filter((n) => n > 1);

const comunicacionDesdeRegistro_ = (r) => ({
  ...r, id: texto_(r.id), idReserva: texto_(r.idReserva), tipo: texto_(r.tipo), estado: texto_(r.estado), intento: numero_(r.intento),
  filasForm: filasFormDe_(r), lote: texto_(r.lote), codigo: texto_(r.codigo), anulaA: texto_(r.anulaA),
  proximoIntento: r.proximoIntento === '' ? null : aFecha_(r.proximoIntento),
});

// { tabla, entradas: [{ filaSheet, valores, comunicacion }] }
const leerComunicacionesSES_ = () => {
  const tabla = leerTabla_(HOJA_COMUNICACIONES_SES);
  return { tabla, entradas: tabla.entradas.map((e) => ({ ...e, comunicacion: comunicacionDesdeRegistro_(e.registro) })) };
};

const comunicacionARegistro_ = (c) => ({ ...c, filasForm: (c.filasForm || []).join(SEPARADOR_FILAS_FORM), proximoIntento: c.proximoIntento || '' });

const anadirComunicacionSES_ = (comunicacion) => anadirRegistro_(leerTabla_(HOJA_COMUNICACIONES_SES), comunicacionARegistro_(comunicacion));

const guardarComunicacionSES_ = (tabla, entrada, comunicacion) => actualizarRegistro_(tabla, entrada, comunicacionARegistro_(comunicacion));

// ---------- Validación presencial de viajeros (F-28) ----------

const leerValidacionesReserva_ = (idReserva) => registrosDe_(HOJA_VALIDACION_VIAJEROS)
  .filter((v) => texto_(v.idReserva) === idReserva)
  .map((v) => ({ fila: numero_(v.filaForm), validadoPor: texto_(v.validadoPor), fecha: v.fecha, codigoMunicipio: texto_(v.codigoMunicipio) }));

const anadirValidacionViajero_ = (registro) => anadirRegistro_(leerTabla_(HOJA_VALIDACION_VIAJEROS), registro);

// Deshacer: se reescribe la hoja sin esa validación (son pocas filas).
const quitarValidacionViajero_ = (idReserva, fila) => {
  const tabla = leerTabla_(HOJA_VALIDACION_VIAJEROS);
  const quedan = tabla.entradas.map((e) => e.registro)
    .filter((v) => !(texto_(v.idReserva) === idReserva && numero_(v.filaForm) === fila));
  reescribirRegistros_(tabla, quedan);
};
