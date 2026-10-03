// Capa: INFRAESTRUCTURA — esquema de la base de datos: fuente única de hojas y columnas.
// Sin dependencias de otros ficheros al cargar. Lo usan los repositorios (infra_*) para leer y escribir por campo.
// Cada hoja define sus campos lógicos → nombre de columna; el código accede siempre por campo, nunca por posición (REF-02).

const HOJA_RESERVAS             = 'Reservas';
const HOJA_RESERVA_SERVICIOS    = 'Reserva_Servicios';
const HOJA_CAT_ESPACIOS         = 'Catálogo_Espacios';
const HOJA_CAT_CANALES          = 'Catálogo_Canales';
const HOJA_CAT_SERVICIOS        = 'Catálogo_Servicios_Extra';
const HOJA_CAT_CATEGORIAS_GASTO = 'Catálogo_Categorias_Gasto';
const HOJA_CONFIG               = 'Config';
const HOJA_USUARIOS             = 'Usuarios_Autorizados';
const HOJA_LOGS                 = 'Logs';
const HOJA_ERRORES              = 'Errores';
const HOJA_HISTORIAL_CAMBIOS    = 'Historial_Cambios';
const HOJA_HISTORICO_INFORMES   = 'Historico_Informes';
const HOJA_ESTADISTICAS_CACHE   = 'Estadisticas_Cache';
const HOJA_GASTOS               = 'Gastos';
const HOJA_RESUMEN_FISCAL       = 'Resumen_Fiscal';
const HOJA_CAT_CHECKLIST        = 'Catálogo_Checklist';
const HOJA_CHECKLISTS_RESERVA   = 'Checklists_Reserva';
const HOJA_CATALOGO_SES         = 'Catálogo_SES';
const HOJA_MUNICIPIOS_INE       = 'Municipios_INE';
const HOJA_COMUNICACIONES_SES   = 'Comunicaciones_SES';
const HOJA_VALIDACION_VIAJEROS  = 'Validacion_Viajeros';
const HOJA_DIAS_CERRADOS        = 'Dias_Cerrados';

const CAMPOS_RESERVA = {
  id: 'ID_Reserva', espacio: 'Espacio', canal: 'Canal', inicio: 'Fecha_Hora_Inicio', fin: 'Fecha_Hora_Fin',
  nombre: 'Nombre_Huesped', telefono: 'Telefono_Huesped', email: 'Email_Huesped', adultos: 'Adultos', menores: 'Menores',
  serviciosExtra: 'Servicios_Extra', importeAlquiler: 'Importe_Alquiler', serviciosPrecio: 'Servicios_Precio_Total',
  serviciosCoste: 'Servicios_Coste_Total', bruto: 'Importe_Bruto', comisionPct: '%_Comisión', comision: 'Importe_Comisión',
  margenServicios: 'Margen_Servicios', neto: 'Importe_Neto', cobro: 'Estado_Cobro', contratoEstado: 'Contrato_Estado',
  contratoArchivo: 'Contrato_Archivo', incidencias: 'Incidencias', incidenteComunicado: 'Incidente_Comunicado',
  compensacion: 'Compensación_Daños', incidenciaResuelta: 'Incidencia_Resuelta', estado: 'Estado_Reserva',
  registroViajeros: 'Registro_Viajeros_Estado', checkin: 'Checkin_Revisado', checkout: 'Checkout_Revisado',
  calendarEventId: 'Calendar_Event_Id', notas: 'Notas', registradoPor: 'Registrado_Por', fechaRegistro: 'Fecha_Registro',
  modificadoPor: 'Modificado_Por', fechaModificacion: 'Fecha_Última_Modificación', videoInUrl: 'Video_In_Url',
  videoOutUrl: 'Video_Out_Url', costeFijoCanal: 'Coste_Canal_Fijo', refCanal: 'Ref_Canal',
  // DD-03: firma del contrato (F-41) y avisos de check-in/check-out ya enviados (F-40).
  contratoFirmadoPor: 'Contrato_Firmado_Por', contratoFecha: 'Contrato_Fecha', avisoCheckin: 'Aviso_Checkin_Enviado', avisoCheckout: 'Aviso_Checkout_Enviado',
};
// DD-03 (F-43): cobro de cada servicio: Pendiente o Cobrado, y si se cobró vía plataforma o presencial.
const CAMPOS_LINEA_SERVICIO = {
  idReserva: 'ID_Reserva', nombre: 'Nombre_Servicio', cantidad: 'Cantidad', coste: 'Coste_Unitario_Snapshot', precio: 'Precio_Unitario_Snapshot',
  cobroEstado: 'Cobro_Estado', cobroForma: 'Cobro_Forma',
};
const CAMPOS_ESPACIO = { nombre: 'Nombre_Espacio', activo: 'Activo', modoFecha: 'Modo_Fecha', nombreCorto: 'Nombre_Corto' };
const CAMPOS_CANAL = { espacio: 'Espacio', nombre: 'Nombre_Canal', activo: 'Activo', comision: '%_Comisión_Default', gestionContrato: 'Gestión_Contrato', costeFijo: 'Coste_Fijo_Por_Reserva', requiereRef: 'Requiere_Ref_Canal' };
const CAMPOS_SERVICIO = { espacio: 'Espacio', nombre: 'Nombre_Servicio', activo: 'Activo', coste: 'Coste_Unitario', precio: 'Precio_Unitario' };
const CAMPOS_CATEGORIA_GASTO = { nombre: 'Nombre_Categoria', descripcion: 'Descripcion', activo: 'Activo', deducibleDefault: 'Deducible_Default', esAmortizacion: 'Es_Amortizacion' };
const CAMPOS_CONFIG = { clave: 'Clave', valor: 'Valor', descripcion: 'Descripcion' };
const CAMPOS_USUARIO = { email: 'Email', activo: 'Activo', rol: 'Rol' };
const CAMPOS_LOG = { fecha: 'Fecha_Hora', tipo: 'Tipo', email: 'Email', detalle: 'Detalle' };
const CAMPOS_ERROR = { fecha: 'Fecha_Hora', funcion: 'Funcion', mensaje: 'Mensaje', contexto: 'Contexto' };
const CAMPOS_HISTORIAL = { fecha: 'Fecha_Hora', usuario: 'Usuario', idReserva: 'ID_Reserva', campo: 'Campo', anterior: 'Valor_Anterior', nuevo: 'Valor_Nuevo' };
const CAMPOS_INFORME = { periodo: 'Periodo', tipo: 'Tipo', espacio: 'Espacio', canal: 'Canal', numReservas: 'Num_Reservas', brutos: 'Ingresos_Brutos', comisiones: 'Comisiones', netos: 'Ingresos_Netos', ocupacion: 'Ocupacion' };
// Sin uso desde S36 (DD-04: Estadísticas se calcula al abrir). La hoja se conserva: solo cambios aditivos.
const CAMPOS_ESTADISTICA = { zona: 'Zona', totalReservas: 'Total_Reservas_Anyo', ingresosNetos: 'Ingresos_Netos', actualizado: 'Fecha_Actualizacion' };
const CAMPOS_GASTO = { id: 'ID_Gasto', fecha: 'Fecha', ejercicio: 'Ejercicio', concepto: 'Concepto', categoria: 'Categoria', espacio: 'Espacio', importe: 'Importe', deducible: 'Deducible', pagadoPor: 'Pagado_Por', justificante: 'Justificante', notas: 'Notas' };
const CAMPOS_RESUMEN_FISCAL = { ejercicio: 'Ejercicio', espacio: 'Espacio', ingresos: 'Ingresos_Integros', gastosDeducibles: 'Gastos_Deducibles', rendimiento: 'Rendimiento_Neto', tercio: 'Tercio_Comunero' };

const CAMPOS_PUNTO_CHECKLIST = { id: 'ID_Punto', espacio: 'Espacio', momento: 'Momento', bloque: 'Bloque', punto: 'Punto', tipo: 'Tipo', servicios: 'Servicios_Requeridos', condicion: 'Condicion', pareja: 'Punto_Pareja', orden: 'Orden', activo: 'Activo' };
// TD-02 (ADR-0020): una fila por checklist; `puntos` = JSON [{ idPunto, estado, valor, usuario, fecha }].
const CAMPOS_CHECKLIST_RESERVA = { idReserva: 'ID_Reserva', momento: 'Momento', puntos: 'Puntos', observaciones: 'Observaciones', usuario: 'Usuario', fecha: 'Fecha_Hora' };
// SES.Hospedajes (ADR-0018, DD-02 §3.2): sin datos personales; Filas_Form apunta a las filas del Sheet del Form.
const CAMPOS_CATALOGO_SES = { catalogo: 'Catalogo', codigo: 'Codigo', descripcion: 'Descripcion' };
const CAMPOS_MUNICIPIO_INE = { provincia: 'Provincia', municipio: 'Municipio', codigo: 'Codigo_INE' };
const CAMPOS_COMUNICACION_SES = {
  id: 'ID_Comunicacion', idReserva: 'ID_Reserva', tipo: 'Tipo', estado: 'Estado', intento: 'Intento', filasForm: 'Filas_Form',
  lote: 'Lote', codigo: 'Codigo_Comunicacion', error: 'Error', usuario: 'Usuario', fechaEnvio: 'Fecha_Envio', proximoIntento: 'Proximo_Intento',
  anulaA: 'Anula_A', // en las anulaciones (tipo AN): ID_Comunicacion que se anula (ADR-0022)
};
const CAMPOS_VALIDACION_VIAJERO = {
  idReserva: 'ID_Reserva', filaForm: 'Fila_Form', marcaTemporal: 'Marca_Temporal_Form', validadoPor: 'Validado_Por', fecha: 'Fecha_Hora',
  codigoMunicipio: 'Codigo_INE_Municipio', // si se corrigió el municipio al validar (F-28)
};
// DD-04 (F-48): días en que un espacio no se alquila; `hasta` incluido.
const CAMPOS_DIA_CERRADO = {
  id: 'ID_Cierre', espacio: 'Espacio', desde: 'Desde', hasta: 'Hasta', motivo: 'Motivo', calendarEventId: 'Calendar_Event_Id',
  registradoPor: 'Registrado_Por', fechaRegistro: 'Fecha_Registro',
};

// Semilla de las 4 checklists (F-14): copia exacta de docs_work/doc_check/checklists-check-in-out.md v1.0.
// Un test comprueba que coincide con el documento. En producción manda la hoja (el admin la edita desde la app).
const SEMILLA_CHECKLIST = [
  ['EXT-IN-01', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Suelo de la barbacoa barrido y baldeado', 'Casilla', '', '', '', 1, 'Sí'],
  ['EXT-IN-02', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Suelo de la pérgola barrido y baldeado', 'Casilla', '', '', '', 2, 'Sí'],
  ['EXT-IN-03', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Suelo del chillout barrido y baldeado', 'Casilla', '', '', '', 3, 'Sí'],
  ['EXT-IN-04', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Mesa y sillas de la pérgola limpias', 'Casilla', '', '', '', 4, 'Sí'],
  ['EXT-IN-05', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Mesa verde auxiliar limpia', 'Casilla', '', '', '', 5, 'Sí'],
  ['EXT-IN-06', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Fregadero limpio', 'Casilla', '', '', '', 6, 'Sí'],
  ['EXT-IN-07', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Cubo de basura limpio con bolsa nueva', 'Casilla', '', '', '', 7, 'Sí'],
  ['EXT-IN-08', 'Piscina / Jardín', 'Check-in', 'Limpieza', 'Barbacoa limpia del uso anterior', 'Casilla', '', '', '', 8, 'Sí'],
  ['EXT-IN-09', 'Piscina / Jardín', 'Check-in', 'Agua', 'Presión de la maquinaria de la piscina en verde', 'Casilla', '', '', '', 9, 'Sí'],
  ['EXT-IN-10', 'Piscina / Jardín', 'Check-in', 'Agua', 'Zodiac hizo su ciclo al menos 24 h antes', 'Casilla', '', '', '', 10, 'Sí'],
  ['EXT-IN-11', 'Piscina / Jardín', 'Check-in', 'Agua', 'Nivel del agua correcto', 'Casilla', '', '', '', 11, 'Sí'],
  ['EXT-IN-12', 'Piscina / Jardín', 'Check-in', 'Agua', 'Limpiador de superficie pasado', 'Casilla', '', '', '', 12, 'Sí'],
  ['EXT-IN-13', 'Piscina / Jardín', 'Check-in', 'Agua', 'Cloro y pH del agua en rango', 'Casilla', '', '', '', 13, 'Sí'],
  ['EXT-IN-14', 'Piscina / Jardín', 'Check-in', 'WC', 'WC limpio', 'Casilla', '', '', '', 14, 'Sí'],
  ['EXT-IN-15', 'Piscina / Jardín', 'Check-in', 'WC', 'Alfombra de ducha exterior puesta', 'Casilla', '', '', '', 15, 'Sí'],
  ['EXT-IN-16', 'Piscina / Jardín', 'Check-in', 'WC', 'Papel higiénico', 'Casilla', '', '', '', 16, 'Sí'],
  ['EXT-IN-17', 'Piscina / Jardín', 'Check-in', 'WC', 'Jabón', 'Casilla', '', '', '', 17, 'Sí'],
  ['EXT-IN-18', 'Piscina / Jardín', 'Check-in', 'WC', 'Toalla de lavabo', 'Casilla', '', '', '', 18, 'Sí'],
  ['EXT-IN-19', 'Piscina / Jardín', 'Check-in', 'Mobiliario', 'Tumbonas colocadas', 'Casilla', '', '', '', 19, 'Sí'],
  ['EXT-IN-20', 'Piscina / Jardín', 'Check-in', 'Mobiliario', 'Sombrilla abierta', 'Casilla', '', '', '', 20, 'Sí'],
  ['EXT-IN-21', 'Piscina / Jardín', 'Check-in', 'Mobiliario', 'Mesa montada para el nº de personas', 'Casilla', '', '', '', 21, 'Sí'],
  ['EXT-IN-22', 'Piscina / Jardín', 'Check-in', 'Mobiliario', 'Mantel o hule', 'Casilla', '', '', '', 22, 'Sí'],
  ['EXT-IN-23', 'Piscina / Jardín', 'Check-in', 'Mobiliario', 'Cojines colocados', 'Casilla', '', '', '', 23, 'Sí'],
  ['EXT-IN-24', 'Piscina / Jardín', 'Check-in', 'Barbacoa', 'Plancha montada', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 24, 'Sí'],
  ['EXT-IN-25', 'Piscina / Jardín', 'Check-in', 'Barbacoa', 'Carbón colocado', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 25, 'Sí'],
  ['EXT-IN-26', 'Piscina / Jardín', 'Check-in', 'Barbacoa', 'Utensilios colocados', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 26, 'Sí'],
  ['EXT-IN-27', 'Piscina / Jardín', 'Check-in', 'Extras', 'Capazo y hielo', 'Casilla', 'Capazo con Hielo', '', '', 27, 'Sí'],
  ['EXT-IN-28', 'Piscina / Jardín', 'Check-in', 'Extras', 'Colchonetas', 'Casilla', 'Colchoneta', '', '', 28, 'Sí'],
  ['EXT-IN-29', 'Piscina / Jardín', 'Check-in', 'Extras', 'Pistolas de agua', 'Casilla', 'Pistolas de agua', '', '', 29, 'Sí'],
  ['EXT-IN-30', 'Piscina / Jardín', 'Check-in', 'Extras', 'Vajilla y vasos', 'Casilla', 'Vajilla 6 PAX', '', '', 30, 'Sí'],
  ['EXT-IN-31', 'Piscina / Jardín', 'Check-in', 'Extras', 'Bolsas de hielo', 'Casilla', 'Bolsa Hielo 2 Kg', '', '', 31, 'Sí'],
  ['EXT-IN-32', 'Piscina / Jardín', 'Check-in', 'Extras', 'Toallas de piscina', 'Casilla', 'Toalla de Piscina', '', '', 32, 'Sí'],
  ['EXT-IN-33', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Puerta de la maquinaria de la piscina cerrada', 'Casilla', '', '', '', 33, 'Sí'],
  ['EXT-IN-34', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Puerta de la maquinaria del WC cerrada', 'Casilla', '', '', '', 34, 'Sí'],
  ['EXT-IN-35', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Puerta del caseto 2 cerrada', 'Casilla', '', '', '', 35, 'Sí'],
  ['EXT-IN-36', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Valla divisoria cerrada', 'Casilla', '', '', '', 36, 'Sí'],
  ['EXT-IN-37', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Boca de riego lateral tapada', 'Casilla', '', '', '', 37, 'Sí'],
  ['EXT-IN-38', 'Piscina / Jardín', 'Check-in', 'Al terminar — cierres', 'Manguera lateral recogida', 'Casilla', '', '', '', 38, 'Sí'],
  ['EXT-IN-39', 'Piscina / Jardín', 'Check-in', 'Evidencia', 'Vídeo de inicio', 'Video', '', '', '', 39, 'Sí'],
  ['EXT-IN-40', 'Piscina / Jardín', 'Check-in', 'Evidencia', 'Revisión visual final', 'Casilla', '', '', '', 40, 'Sí'],
  ['EXT-OUT-01', 'Piscina / Jardín', 'Check-out', 'Evidencia', 'Vídeo de fin', 'Video', '', '', '', 1, 'Sí'],
  ['EXT-OUT-02', 'Piscina / Jardín', 'Check-out', 'Evidencia', 'Fotos de desperfectos, si los hay', 'Foto', '', '', '', 2, 'Sí'],
  ['EXT-OUT-03', 'Piscina / Jardín', 'Check-out', 'Daños', 'Mobiliario', 'Daños', '', '', '', 3, 'Sí'],
  ['EXT-OUT-04', 'Piscina / Jardín', 'Check-out', 'Daños', 'Instalaciones y piscina', 'Daños', '', '', '', 4, 'Sí'],
  ['EXT-OUT-05', 'Piscina / Jardín', 'Check-out', 'Daños', 'Incidencias anotadas', 'Casilla', '', '', '', 5, 'Sí'],
  ['EXT-OUT-06', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Suelo de la barbacoa barrido y baldeado', 'Casilla', '', '', '', 6, 'Sí'],
  ['EXT-OUT-07', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Pérgola barrida', 'Casilla', '', '', '', 7, 'Sí'],
  ['EXT-OUT-08', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Chillout barrido', 'Casilla', '', '', '', 8, 'Sí'],
  ['EXT-OUT-09', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Mesas y superficies de trabajo limpias', 'Casilla', '', '', '', 9, 'Sí'],
  ['EXT-OUT-10', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Fregadero limpio', 'Casilla', '', '', '', 10, 'Sí'],
  ['EXT-OUT-11', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Cubo vaciado', 'Casilla', '', '', '', 11, 'Sí'],
  ['EXT-OUT-12', 'Piscina / Jardín', 'Check-out', 'Limpieza', 'Residuos tirados', 'Casilla', '', '', '', 12, 'Sí'],
  ['EXT-OUT-13', 'Piscina / Jardín', 'Check-out', 'WC', 'WC limpio', 'Casilla', '', '', '', 13, 'Sí'],
  ['EXT-OUT-14', 'Piscina / Jardín', 'Check-out', 'WC', 'Alfombra retirada para secar', 'Casilla', '', '', '', 14, 'Sí'],
  ['EXT-OUT-15', 'Piscina / Jardín', 'Check-out', 'WC', 'Papel, jabón y toalla repuestos', 'Casilla', '', '', '', 15, 'Sí'],
  ['EXT-OUT-16', 'Piscina / Jardín', 'Check-out', 'WC', 'Bolsas de basura con stock suficiente', 'Casilla', '', '', '', 16, 'Sí'],
  ['EXT-OUT-17', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Tumbonas en su sitio', 'Casilla', '', '', '', 17, 'Sí'],
  ['EXT-OUT-18', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Sombrilla cerrada y asegurada', 'Casilla', '', '', '', 18, 'Sí'],
  ['EXT-OUT-19', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Mesa y sillas limpias y en su sitio', 'Casilla', '', '', '', 19, 'Sí'],
  ['EXT-OUT-20', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Mantel retirado o en buen estado', 'Casilla', '', '', '', 20, 'Sí'],
  ['EXT-OUT-21', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Cojines', 'Daños', '', '', '', 21, 'Sí'],
  ['EXT-OUT-22', 'Piscina / Jardín', 'Check-out', 'Mobiliario', 'Inventario completo', 'Casilla', '', '', '', 22, 'Sí'],
  ['EXT-OUT-23', 'Piscina / Jardín', 'Check-out', 'Barbacoa', 'Barbacoa limpia tras el uso', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 23, 'Sí'],
  ['EXT-OUT-24', 'Piscina / Jardín', 'Check-out', 'Barbacoa', 'Plancha desmontada y guardada', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 24, 'Sí'],
  ['EXT-OUT-25', 'Piscina / Jardín', 'Check-out', 'Barbacoa', 'Utensilios limpios y guardados', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 25, 'Sí'],
  ['EXT-OUT-26', 'Piscina / Jardín', 'Check-out', 'Barbacoa', 'Carbón sobrante recogido', 'Casilla', 'Carbón 1 Bolsa|Utensilios BBQ', '', '', 26, 'Sí'],
  ['EXT-OUT-27', 'Piscina / Jardín', 'Check-out', 'Extras', 'Capazo devuelto', 'Casilla', 'Capazo con Hielo', '', '', 27, 'Sí'],
  ['EXT-OUT-28', 'Piscina / Jardín', 'Check-out', 'Extras', 'Colchonetas guardadas', 'Casilla', 'Colchoneta', '', '', 28, 'Sí'],
  ['EXT-OUT-29', 'Piscina / Jardín', 'Check-out', 'Extras', 'Pistolas de agua guardadas', 'Casilla', 'Pistolas de agua', '', '', 29, 'Sí'],
  ['EXT-OUT-30', 'Piscina / Jardín', 'Check-out', 'Extras', 'Vajilla completa y limpia', 'Casilla', 'Vajilla 6 PAX', '', '', 30, 'Sí'],
  ['EXT-OUT-31', 'Piscina / Jardín', 'Check-out', 'Extras', 'Bolsas de hielo retiradas', 'Casilla', 'Bolsa Hielo 2 Kg', '', '', 31, 'Sí'],
  ['EXT-OUT-32', 'Piscina / Jardín', 'Check-out', 'Extras', 'Toallas retiradas', 'Casilla', 'Toalla de Piscina', '', '', 32, 'Sí'],
  ['EXT-OUT-33', 'Piscina / Jardín', 'Check-out', 'Agua', 'Skimmers limpios', 'Casilla', '', '', '', 33, 'Sí'],
  ['EXT-OUT-34', 'Piscina / Jardín', 'Check-out', 'Agua', 'Superficie del agua limpia', 'Casilla', '', '', '', 34, 'Sí'],
  ['EXT-OUT-35', 'Piscina / Jardín', 'Check-out', 'Agua', 'Presión del agua correcta', 'Casilla', '', '', '', 35, 'Sí'],
  ['EXT-OUT-36', 'Piscina / Jardín', 'Check-out', 'Agua', 'Nivel del agua correcto', 'Casilla', '', '', '', 36, 'Sí'],
  ['EXT-OUT-37', 'Piscina / Jardín', 'Check-out', 'Agua', 'Zodiac puesto', 'Casilla', '', '', '', 37, 'Sí'],
  ['EXT-OUT-38', 'Piscina / Jardín', 'Check-out', 'Instalaciones', 'Puerta del caseto 2 cerrada', 'Casilla', '', '', '', 38, 'Sí'],
  ['EXT-OUT-39', 'Piscina / Jardín', 'Check-out', 'Instalaciones', 'Puerta del WC cerrada', 'Casilla', '', '', '', 39, 'Sí'],
  ['EXT-OUT-40', 'Piscina / Jardín', 'Check-out', 'Instalaciones', 'Maquinaria cerrada', 'Casilla', '', '', '', 40, 'Sí'],
  ['EXT-OUT-41', 'Piscina / Jardín', 'Check-out', 'Instalaciones', 'Boca de riego tapada', 'Casilla', '', '', '', 41, 'Sí'],
  ['EXT-OUT-42', 'Piscina / Jardín', 'Check-out', 'Instalaciones', 'Manguera recogida', 'Casilla', '', '', '', 42, 'Sí'],
  ['INT-IN-01', 'Habitación Interior', 'Check-in', 'Habitación', 'Cama hecha con ropa limpia', 'Casilla', '', '', '', 1, 'Sí'],
  ['INT-IN-02', 'Habitación Interior', 'Check-in', 'Habitación', 'Toallas de ducha y de lavabo', 'Casilla', '', '', '', 2, 'Sí'],
  ['INT-IN-03', 'Habitación Interior', 'Check-in', 'Habitación', 'Cajones y baldas vacíos', 'Casilla', '', '', '', 3, 'Sí'],
  ['INT-IN-04', 'Habitación Interior', 'Check-in', 'Habitación', 'Ventilada y a buena temperatura', 'Casilla', '', '', '', 4, 'Sí'],
  ['INT-IN-05', 'Habitación Interior', 'Check-in', 'Habitación', 'Luces y enchufes funcionan', 'Casilla', '', '', '', 5, 'Sí'],
  ['INT-IN-06', 'Habitación Interior', 'Check-in', 'Habitación', 'TV funciona', 'Casilla', '', '', '', 6, 'Sí'],
  ['INT-IN-07', 'Habitación Interior', 'Check-in', 'Habitación', 'Internet de invitados funciona', 'Casilla', '', '', '', 7, 'Sí'],
  ['INT-IN-08', 'Habitación Interior', 'Check-in', 'Habitación', 'Persiana funciona', 'Casilla', '', '', '', 8, 'Sí'],
  ['INT-IN-09', 'Habitación Interior', 'Check-in', 'Habitación', 'Llave de la puerta en su sitio, y su copia también', 'Casilla', '', '', '', 9, 'Sí'],
  ['INT-IN-10', 'Habitación Interior', 'Check-in', 'Habitación', 'Cuadro de normas en el idioma correcto', 'Casilla', '', '', '', 10, 'Sí'],
  ['INT-IN-11', 'Habitación Interior', 'Check-in', 'Habitación', 'Wifi e instrucciones a la vista', 'Casilla', '', '', '', 11, 'Sí'],
  ['INT-IN-12', 'Habitación Interior', 'Check-in', 'WC', 'WC limpio', 'Casilla', '', '', '', 12, 'Sí'],
  ['INT-IN-13', 'Habitación Interior', 'Check-in', 'WC', 'Papel higiénico', 'Casilla', '', '', '', 13, 'Sí'],
  ['INT-IN-14', 'Habitación Interior', 'Check-in', 'WC', 'Gel, champú y jabón', 'Casilla', '', '', '', 14, 'Sí'],
  ['INT-IN-15', 'Habitación Interior', 'Check-in', 'WC', 'Alfombra de ducha', 'Casilla', '', '', '', 15, 'Sí'],
  ['INT-IN-16', 'Habitación Interior', 'Check-in', 'WC', 'Agua caliente funciona', 'Casilla', '', '', '', 16, 'Sí'],
  ['INT-IN-17', 'Habitación Interior', 'Check-in', 'Office', 'Cafetera limpia, con cápsulas y agua', 'Casilla', '', '', '', 17, 'Sí'],
  ['INT-IN-18', 'Habitación Interior', 'Check-in', 'Office', 'Vasos y menaje', 'Casilla', '', '', '', 18, 'Sí'],
  ['INT-IN-19', 'Habitación Interior', 'Check-in', 'Office', 'Heater funciona', 'Casilla', '', '', '', 19, 'Sí'],
  ['INT-IN-20', 'Habitación Interior', 'Check-in', 'Office', 'Pieza de alimento', 'Casilla', '', '', '', 20, 'Sí'],
  ['INT-IN-21', 'Habitación Interior', 'Check-in', 'Office', 'Servilletas', 'Casilla', '', '', '', 21, 'Sí'],
  ['INT-IN-22', 'Habitación Interior', 'Check-in', 'Office', 'Puerta del cuarto de música cerrada con llave', 'Casilla', '', '', '', 22, 'Sí'],
  ['INT-IN-23', 'Habitación Interior', 'Check-in', 'Terraza', 'Terraza limpia', 'Casilla', '', '', '', 23, 'Sí'],
  ['INT-IN-24', 'Habitación Interior', 'Check-in', 'Terraza', 'Cenicero limpio', 'Casilla', '', '', '', 24, 'Sí'],
  ['INT-IN-25', 'Habitación Interior', 'Check-in', 'Terraza', 'Sillas para fumar', 'Casilla', '', '', '', 25, 'Sí'],
  ['INT-IN-26', 'Habitación Interior', 'Check-in', 'Terraza', 'Tendedero portátil', 'Casilla', '', '', '', 26, 'Sí'],
  ['INT-IN-27', 'Habitación Interior', 'Check-in', 'Evidencia', 'Vídeo de inicio', 'Video', '', '', '', 27, 'Sí'],
  ['INT-IN-28', 'Habitación Interior', 'Check-in', 'Evidencia', 'Revisión visual final', 'Casilla', '', '', '', 28, 'Sí'],
  ['INT-IN-29', 'Habitación Interior', 'Check-in', 'Recepción', 'Funcionamiento de las luces', 'Casilla', '', '', '', 29, 'Sí'],
  ['INT-IN-30', 'Habitación Interior', 'Check-in', 'Recepción', 'Wifi', 'Casilla', '', '', '', 30, 'Sí'],
  ['INT-IN-31', 'Habitación Interior', 'Check-in', 'Recepción', 'Cafetera y heater', 'Casilla', '', '', '', 31, 'Sí'],
  ['INT-IN-32', 'Habitación Interior', 'Check-in', 'Recepción', 'Gestión del menaje', 'Casilla', '', '', '', 32, 'Sí'],
  ['INT-IN-33', 'Habitación Interior', 'Check-in', 'Recepción', 'Gestión de las basuras', 'Casilla', '', '', '', 33, 'Sí'],
  ['INT-IN-34', 'Habitación Interior', 'Check-in', 'Recepción', 'Llave de la habitación', 'Casilla', '', '', '', 34, 'Sí'],
  ['INT-IN-35', 'Habitación Interior', 'Check-in', 'Recepción', 'Alarma nocturna', 'Casilla', '', '', '', 35, 'Sí'],
  ['INT-IN-36', 'Habitación Interior', 'Check-in', 'Recepción', 'Dinámica de entradas y salidas de la casa', 'Casilla', '', '', '', 36, 'Sí'],
  ['INT-IN-37', 'Habitación Interior', 'Check-in', 'Recepción', 'Dinámica de uso del espacio exterior', 'Casilla', '', '', '', 37, 'Sí'],
  ['INT-OUT-01', 'Habitación Interior', 'Check-out', 'Evidencia', 'Vídeo de fin', 'Video', '', '', '', 1, 'Sí'],
  ['INT-OUT-02', 'Habitación Interior', 'Check-out', 'Evidencia', 'Fotos de desperfectos, si los hay', 'Foto', '', '', '', 2, 'Sí'],
  ['INT-OUT-03', 'Habitación Interior', 'Check-out', 'Daños', 'Habitación', 'Daños', '', '', '', 3, 'Sí'],
  ['INT-OUT-04', 'Habitación Interior', 'Check-out', 'Daños', 'Incidencias anotadas', 'Casilla', '', '', '', 4, 'Sí'],
  ['INT-OUT-05', 'Habitación Interior', 'Check-out', 'Habitación', 'Ropa de cama y toallas retiradas', 'Casilla', '', '', '', 5, 'Sí'],
  ['INT-OUT-06', 'Habitación Interior', 'Check-out', 'Habitación', 'Cajones y baldas vacíos (nada olvidado)', 'Casilla', '', '', '', 6, 'Sí'],
  ['INT-OUT-07', 'Habitación Interior', 'Check-out', 'Habitación', 'TV, persiana y luces funcionan', 'Casilla', '', '', '', 7, 'Sí'],
  ['INT-OUT-08', 'Habitación Interior', 'Check-out', 'Habitación', 'Llave de la puerta y su copia en su sitio', 'Casilla', '', '', '', 8, 'Sí'],
  ['INT-OUT-09', 'Habitación Interior', 'Check-out', 'WC', 'WC limpio', 'Fecha', '', '', '', 9, 'Sí'],
  ['INT-OUT-10', 'Habitación Interior', 'Check-out', 'WC', 'Papel, gel, champú y jabón repuestos', 'Casilla', '', '', '', 10, 'Sí'],
  ['INT-OUT-11', 'Habitación Interior', 'Check-out', 'Office', 'Cápsulas y agua repuestas', 'Casilla', '', 'Siguiente_Pronto', '', 11, 'Sí'],
  ['INT-OUT-12', 'Habitación Interior', 'Check-out', 'Office', 'Cafetera limpia', 'Casilla', '', 'Siguiente_Pronto', '', 12, 'Sí'],
  ['INT-OUT-13', 'Habitación Interior', 'Check-out', 'Office', 'Vasos y menaje completos', 'Casilla', '', 'Siguiente_Pronto', '', 13, 'Sí'],
  ['INT-OUT-14', 'Habitación Interior', 'Check-out', 'Office', 'Puerta del cuarto de música cerrada con llave', 'Casilla', '', 'Siguiente_Pronto', '', 14, 'Sí'],
  ['INT-OUT-15', 'Habitación Interior', 'Check-out', 'Office', 'Office recogido completamente', 'Casilla', '', 'Siguiente_Lejos', '', 15, 'Sí'],
  ['INT-OUT-16', 'Habitación Interior', 'Check-out', 'Office', 'Puerta del cuarto de música cerrada con llave', 'Casilla', '', 'Siguiente_Lejos', '', 16, 'Sí'],
  ['INT-OUT-17', 'Habitación Interior', 'Check-out', 'Terraza', 'Cenicero vaciado', 'Casilla', '', '', '', 17, 'Sí'],
  ['INT-OUT-18', 'Habitación Interior', 'Check-out', 'Terraza', 'Terraza recogida', 'Casilla', '', '', '', 18, 'Sí'],
  ['INT-OUT-19', 'Habitación Interior', 'Check-out', 'Terraza', 'Sillas y tendedero en su sitio', 'Casilla', '', '', '', 19, 'Sí'],
];

const ESQUEMA_HOJAS = [
  { nombre: HOJA_RESERVAS, campos: CAMPOS_RESERVA },
  { nombre: HOJA_RESERVA_SERVICIOS, campos: CAMPOS_LINEA_SERVICIO },
  {
    nombre: HOJA_CAT_ESPACIOS, campos: CAMPOS_ESPACIO,
    semilla: [['Piscina / Jardín', 'Sí', 'Dia_y_Hora', 'Exterior'], ['Habitación Interior', 'Sí', 'Rango_Dias', 'Interior']],
  },
  { nombre: HOJA_CAT_CANALES, campos: CAMPOS_CANAL },
  { nombre: HOJA_CAT_SERVICIOS, campos: CAMPOS_SERVICIO },
  {
    nombre: HOJA_CAT_CATEGORIAS_GASTO, campos: CAMPOS_CATEGORIA_GASTO,
    semilla: [
      ['Intereses y financiación', 'Intereses de hipoteca/préstamo de adquisición o mejora, comisiones bancarias', 'Sí', 'Sí', 'No'],
      ['Conservación y reparación', 'Pintura, fontanería, electricidad, reparaciones (no mejoras)', 'Sí', 'Sí', 'No'],
      ['Tributos y tasas no estatales', 'IBI, tasa de basuras, alcantarillado, vado', 'Sí', 'Sí', 'No'],
      ['Comunidad de propietarios', 'Cuotas ordinarias de comunidad', 'Sí', 'Sí', 'No'],
      ['Seguros', 'Hogar, responsabilidad civil, impago de alquiler', 'Sí', 'Sí', 'No'],
      ['Suministros', 'Agua, luz, gas, internet (si los paga el arrendador)', 'Sí', 'Sí', 'No'],
      ['Servicios y administración', 'Limpieza, jardinería, gestoría, publicidad, comisiones de plataformas', 'Sí', 'Sí', 'No'],
      ['Saldos de dudoso cobro', 'Impagos (con las condiciones legales)', 'Sí', 'Sí', 'No'],
      ['Amortización inmueble', '3% del valor de construcción, excluido el suelo', 'Sí', 'Sí', 'Sí'],
      ['Amortización muebles', 'Muebles y electrodomésticos cedidos (≈10%/año)', 'Sí', 'Sí', 'Sí'],
    ],
  },
  {
    nombre: HOJA_CONFIG, campos: CAMPOS_CONFIG,
    semilla: [
      ['Emails_Notificacion', '', 'Emails de los tres copropietarios, separados por coma (avisos, confirmaciones, informes)'],
      ['Mensaje_Solapamiento', 'Ya existe una reserva para ese espacio en esas fechas.', 'Mensaje de bloqueo por solapamiento'],
      ['Hora_CheckIn_Default', '16:00', 'Hora de entrada por defecto (modo Rango_Dias)'],
      ['Hora_CheckOut_Default', '12:00', 'Hora de salida por defecto (modo Rango_Dias)'],
      ['Tamano_Max_Contrato_MB', '15', 'Tamaño máximo de cada foto o PDF del contrato (MB; DI-10)'],
      ['Tamano_Max_Video_MB', '100', 'Tamaño máximo del vídeo de check-in/out en MB (100 MB evita cuelgues en móvil)'],
      ['Valor_Construccion', '', 'Valor de construcción del inmueble — amortización IRPF (ADR-0012)'],
      ['Proporcion_Alquilada', '', 'Proporción alquilada de la vivienda — amortización IRPF (ADR-0012)'],
      ['Carpeta_Raiz_Id', '', 'ID de la carpeta raíz del proyecto en Drive — KAF. KAF Rent (solo referencia; el código no la usa) (ADR-0014)'],
      ['Carpeta_Videos_Id', '', 'ID de la carpeta de vídeos in/out (ADR-0014)'],
      ['Carpeta_Documentos_Id', '', 'ID de la carpeta de documentos/contratos (ADR-0014)'],
      ['Carpeta_Backups_Id', '', 'ID de la carpeta de copias de seguridad del Sheet (ADR-0013)'],
      ['Backup_Diarias', '7', 'Copias diarias que se conservan: una por día (rotación abuelo-padre-hijo, ADR-0016)'],
      ['Backup_Semanales', '4', 'Copias semanales que se conservan: la última de cada semana (ADR-0016)'],
      ['Backup_Mensuales', '12', 'Copias mensuales que se conservan: la última de cada mes (ADR-0016)'],
      ['Retencion_Logs_Dias', '90', 'Días que se conservan las filas de Logs (ADR-0013)'],
      ['Retencion_Errores_Dias', '365', 'Días que se conservan las filas de Errores (ADR-0013)'],
      ['Retencion_Videos_Dias', '180', 'Días que se conservan los vídeos in/out en Drive (ADR-0014)'],
      ['Calendar_Id', '', 'ID del calendario de ocupación; vacío = calendario por defecto de quien use la app (ADR-0010, ADR-0017)'],
      ['Calendar_Url', '', 'Enlace al calendario para el botón del Inicio (ADR-0010)'],
      ['Icono_Url', '', 'Enlace público directo al icono PNG de 192 px de la cabecera (F-24); el del acceso directo del móvil es D-23'],
      ['Dias_Office_Reponer', '3', 'Checklist de salida de la Habitación: si la siguiente reserva empieza en estos días o menos, se repone el office; si no, se recoge entero (F-14)'],
      ['Sheet_Viajeros_Id', '', 'ID del Sheet de respuestas del Google Form de viajeros (ADR-0018)'],
      ['Form_Viajeros_Enlace', '', 'Enlace prerrellenado del Form de viajeros con {codigo} en el lugar del código de reserva (mensaje de WhatsApp, F-27)'],
      ['Sheet_Viajeros_Hoja', 'Respuestas de formulario 1', 'Pestaña de ese Sheet con las respuestas'],
      ['SES_Url', 'https://hospedajes.pre-ses.mir.es/hospedajes-web/ws/v1/comunicacion', 'Servicio web de SES: pruebas (pre-ses) o producción (hospedajes.ses.mir.es)'],
      ['SES_Codigo_Arrendador', '', 'Código de arrendador asignado por SES (el usuario y la contraseña van en las Propiedades del script, D-32)'],
      ['SES_Codigo_Establecimiento', '', 'Código del establecimiento (Habitación) asignado por SES'],
      ['SES_Aplicacion', 'KAF Rent', 'Nombre de la aplicación que se envía a SES'],
      ['SES_Tipo_Pago', '', 'Código de TIPO_PAGO de SES para "otras formas de pago" (Catálogo_SES)'],
      ['SES_Reintento_Minutos', '30', 'Minutos entre reintentos de una comunicación fallida (DD-02 §3.5)'],
      ['SES_Max_Intentos', '3', 'Intentos antes de pasar a comunicación manual (DD-02 §3.5)'],
      ['SES_Web_Url', 'https://hospedajes.ses.mir.es/', 'Web de SES.Hospedajes para comunicar o anular a mano (botón de los emails de aviso)'],
      ['Dias_Aviso_Ingreso', '10', 'Días tras la salida sin "Ingresado" para avisar del cobro; se repite cada tantos días (F-37)'],
      ['Horas_Aviso_Checkin', '4', 'Horas antes de la llegada desde las que se avisa de hacer el check-in si no está hecho (F-40)'],
      ['Exterior_Hora_Apertura', '09:00', 'Hora a la que abre cada día el espacio que se alquila por horas (DD-04: horas abiertas para la ocupación)'],
      ['Exterior_Hora_Cierre', '02:00', 'Hora a la que cierra; si es menor que la de apertura, es del día siguiente (DD-04)'],
      ['Anios_Retencion_Contrato', '5', 'Años, desde la salida, que se guardan las fotos del contrato firmado (F-41; art. 1964.2 del Código Civil)'],
    ],
  },
  { nombre: HOJA_USUARIOS, campos: CAMPOS_USUARIO },
  { nombre: HOJA_LOGS, campos: CAMPOS_LOG },
  { nombre: HOJA_ERRORES, campos: CAMPOS_ERROR },
  { nombre: HOJA_HISTORIAL_CAMBIOS, campos: CAMPOS_HISTORIAL },
  { nombre: HOJA_HISTORICO_INFORMES, campos: CAMPOS_INFORME },
  { nombre: HOJA_ESTADISTICAS_CACHE, campos: CAMPOS_ESTADISTICA },
  { nombre: HOJA_GASTOS, campos: CAMPOS_GASTO },
  { nombre: HOJA_RESUMEN_FISCAL, campos: CAMPOS_RESUMEN_FISCAL },
  { nombre: HOJA_CAT_CHECKLIST, campos: CAMPOS_PUNTO_CHECKLIST, semilla: SEMILLA_CHECKLIST },
  { nombre: HOJA_CHECKLISTS_RESERVA, campos: CAMPOS_CHECKLIST_RESERVA },
  { nombre: HOJA_CATALOGO_SES, campos: CAMPOS_CATALOGO_SES },
  { nombre: HOJA_MUNICIPIOS_INE, campos: CAMPOS_MUNICIPIO_INE },
  { nombre: HOJA_COMUNICACIONES_SES, campos: CAMPOS_COMUNICACION_SES },
  { nombre: HOJA_VALIDACION_VIAJEROS, campos: CAMPOS_VALIDACION_VIAJERO },
  { nombre: HOJA_DIAS_CERRADOS, campos: CAMPOS_DIA_CERRADO },
];

const definicionHoja_ = (nombre) => {
  const definicion = ESQUEMA_HOJAS.find((d) => d.nombre === nombre);
  if (!definicion) throw new Error(`La hoja "${nombre}" no está en el esquema.`);
  return definicion;
};
