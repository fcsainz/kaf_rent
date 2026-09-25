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
const HOJA_REGISTRO_VIAJEROS    = 'Registro_Viajeros';

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
  videoOutUrl: 'Video_Out_Url', costeFijoCanal: 'Coste_Canal_Fijo',
};
const CAMPOS_LINEA_SERVICIO = { idReserva: 'ID_Reserva', nombre: 'Nombre_Servicio', cantidad: 'Cantidad', coste: 'Coste_Unitario_Snapshot', precio: 'Precio_Unitario_Snapshot' };
const CAMPOS_ESPACIO = { nombre: 'Nombre_Espacio', activo: 'Activo', modoFecha: 'Modo_Fecha' };
const CAMPOS_CANAL = { espacio: 'Espacio', nombre: 'Nombre_Canal', activo: 'Activo', comision: '%_Comisión_Default', gestionContrato: 'Gestión_Contrato', costeFijo: 'Coste_Fijo_Por_Reserva' };
const CAMPOS_SERVICIO = { espacio: 'Espacio', nombre: 'Nombre_Servicio', activo: 'Activo', coste: 'Coste_Unitario', precio: 'Precio_Unitario' };
const CAMPOS_CATEGORIA_GASTO = { nombre: 'Nombre_Categoria', descripcion: 'Descripcion', activo: 'Activo', deducibleDefault: 'Deducible_Default', esAmortizacion: 'Es_Amortizacion' };
const CAMPOS_CONFIG = { clave: 'Clave', valor: 'Valor', descripcion: 'Descripcion' };
const CAMPOS_USUARIO = { email: 'Email', activo: 'Activo', rol: 'Rol' };
const CAMPOS_LOG = { fecha: 'Fecha_Hora', tipo: 'Tipo', email: 'Email', detalle: 'Detalle' };
const CAMPOS_ERROR = { fecha: 'Fecha_Hora', funcion: 'Funcion', mensaje: 'Mensaje', contexto: 'Contexto' };
const CAMPOS_HISTORIAL = { fecha: 'Fecha_Hora', usuario: 'Usuario', idReserva: 'ID_Reserva', campo: 'Campo', anterior: 'Valor_Anterior', nuevo: 'Valor_Nuevo' };
const CAMPOS_INFORME = { periodo: 'Periodo', tipo: 'Tipo', espacio: 'Espacio', canal: 'Canal', numReservas: 'Num_Reservas', brutos: 'Ingresos_Brutos', comisiones: 'Comisiones', netos: 'Ingresos_Netos', ocupacion: 'Ocupacion' };
const CAMPOS_ESTADISTICA = { zona: 'Zona', totalReservas: 'Total_Reservas_Anyo', ingresosNetos: 'Ingresos_Netos', actualizado: 'Fecha_Actualizacion' };
const CAMPOS_GASTO = { id: 'ID_Gasto', fecha: 'Fecha', ejercicio: 'Ejercicio', concepto: 'Concepto', categoria: 'Categoria', espacio: 'Espacio', importe: 'Importe', deducible: 'Deducible', pagadoPor: 'Pagado_Por', justificante: 'Justificante', notas: 'Notas' };
const CAMPOS_RESUMEN_FISCAL = { ejercicio: 'Ejercicio', espacio: 'Espacio', ingresos: 'Ingresos_Integros', gastosDeducibles: 'Gastos_Deducibles', rendimiento: 'Rendimiento_Neto', tercio: 'Tercio_Comunero' };
const CAMPOS_VIAJERO = {
  idReserva: 'ID_Reserva', nombre: 'Nombre_Completo', tipoDocumento: 'Tipo_Documento', numDocumento: 'Num_Documento', numSoporte: 'Num_Soporte',
  nacionalidad: 'Nacionalidad', fechaNacimiento: 'Fecha_Nacimiento', direccion: 'Direccion', telefono: 'Telefono', email: 'Email',
  parentesco: 'Parentesco', fotoAnverso: 'Foto_Anverso', fotoReverso: 'Foto_Reverso',
};

const ESQUEMA_HOJAS = [
  { nombre: HOJA_RESERVAS, campos: CAMPOS_RESERVA },
  { nombre: HOJA_RESERVA_SERVICIOS, campos: CAMPOS_LINEA_SERVICIO },
  {
    nombre: HOJA_CAT_ESPACIOS, campos: CAMPOS_ESPACIO,
    semilla: [['Piscina / Jardín', 'Sí', 'Dia_y_Hora'], ['Habitación Interior', 'Sí', 'Rango_Dias']],
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
      ['Tamano_Max_Contrato_MB', '5', 'Tamaño máximo del archivo de contrato (MB)'],
      ['Tamano_Max_Video_MB', '100', 'Tamaño máximo del vídeo de check-in/out en MB (100 MB evita cuelgues en móvil)'],
      ['Valor_Construccion', '', 'Valor de construcción del inmueble — amortización IRPF (ADR-0012)'],
      ['Proporcion_Alquilada', '', 'Proporción alquilada de la vivienda — amortización IRPF (ADR-0012)'],
      ['Carpeta_Raiz_Id', '', 'ID de la carpeta raíz del proyecto en Drive — KAF. KAF Rent (solo referencia; el código no la usa) (ADR-0014)'],
      ['Carpeta_Videos_Id', '', 'ID de la carpeta de vídeos in/out (ADR-0014)'],
      ['Carpeta_Documentos_Id', '', 'ID de la carpeta de documentos/contratos (ADR-0014)'],
      ['Carpeta_Backups_Id', '', 'ID de la carpeta de copias de seguridad del Sheet (ADR-0013)'],
      ['Backup_Cada_Dias', '2', 'Cada cuántos días se copia el Sheet (ADR-0013)'],
      ['Backup_Max_Copias', '15', 'Número máximo de copias de seguridad a conservar (ADR-0013)'],
      ['Retencion_Logs_Dias', '90', 'Días que se conservan las filas de Logs (ADR-0013)'],
      ['Retencion_Errores_Dias', '365', 'Días que se conservan las filas de Errores (ADR-0013)'],
      ['Retencion_Videos_Dias', '180', 'Días que se conservan los vídeos in/out en Drive (ADR-0014)'],
      ['Calendar_Id', '', 'ID del calendario de ocupación; vacío = calendario por defecto de la cuenta operativa (ADR-0010)'],
      ['Calendar_Url', '', 'Enlace al calendario para el botón del Inicio (ADR-0010)'],
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
  { nombre: HOJA_REGISTRO_VIAJEROS, campos: CAMPOS_VIAJERO },
];

const definicionHoja_ = (nombre) => {
  const definicion = ESQUEMA_HOJAS.find((d) => d.nombre === nombre);
  if (!definicion) throw new Error(`La hoja "${nombre}" no está en el esquema.`);
  return definicion;
};
