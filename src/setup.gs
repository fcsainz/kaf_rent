// Creación idempotente de la base de datos (todas las hojas con sus cabeceras y semillas).
// Ejecutar una vez desde el editor (inicializarBaseDeDatos) o desde el menú "KAF Rent".

// Nombres de hoja — fuente única de verdad, usada en todo el proyecto.
const HOJA_RESERVAS            = 'Reservas';
const HOJA_RESERVA_SERVICIOS   = 'Reserva_Servicios';
const HOJA_CAT_ESPACIOS        = 'Catálogo_Espacios';
const HOJA_CAT_CANALES         = 'Catálogo_Canales';
const HOJA_CAT_SERVICIOS       = 'Catálogo_Servicios_Extra';
const HOJA_CAT_CATEGORIAS_GASTO = 'Catálogo_Categorias_Gasto';
const HOJA_CONFIG              = 'Config';
const HOJA_USUARIOS            = 'Usuarios_Autorizados';
const HOJA_LOGS               = 'Logs';
const HOJA_ERRORES            = 'Errores';
const HOJA_HISTORIAL_CAMBIOS  = 'Historial_Cambios';
const HOJA_HISTORICO_INFORMES = 'Historico_Informes';
const HOJA_ESTADISTICAS_CACHE = 'Estadisticas_Cache';
const HOJA_GASTOS             = 'Gastos';
const HOJA_RESUMEN_FISCAL     = 'Resumen_Fiscal';
const HOJA_REGISTRO_VIAJEROS  = 'Registro_Viajeros';

// Esquema de la base de datos: una entrada por hoja, con sus cabeceras y semilla opcional.
const ESQUEMA_HOJAS = [
  {
    nombre: HOJA_RESERVAS,
    cabeceras: ['ID_Reserva', 'Espacio', 'Canal', 'Fecha_Hora_Inicio', 'Fecha_Hora_Fin',
      'Nombre_Huesped', 'Telefono_Huesped', 'Email_Huesped', 'Adultos', 'Menores',
      'Servicios_Extra', 'Importe_Alquiler', 'Servicios_Precio_Total', 'Servicios_Coste_Total',
      'Importe_Bruto', '%_Comisión', 'Importe_Comisión', 'Margen_Servicios', 'Importe_Neto',
      'Estado_Cobro', 'Contrato_Estado', 'Contrato_Archivo', 'Incidencias', 'Incidente_Comunicado',
      'Compensación_Daños', 'Incidencia_Resuelta', 'Estado_Reserva', 'Registro_Viajeros_Estado',
      'Calendar_Event_Id', 'Notas', 'Registrado_Por', 'Fecha_Registro', 'Modificado_Por',
      'Fecha_Última_Modificación'],
  },
  {
    nombre: HOJA_RESERVA_SERVICIOS,
    cabeceras: ['ID_Reserva', 'Nombre_Servicio', 'Cantidad', 'Coste_Unitario_Snapshot', 'Precio_Unitario_Snapshot'],
  },
  {
    nombre: HOJA_CAT_ESPACIOS,
    cabeceras: ['Nombre_Espacio', 'Activo', 'Modo_Fecha'],
    semilla: [
      ['Piscina / Jardín', 'Sí', 'Dia_y_Hora'],
      ['Habitación Interior', 'Sí', 'Rango_Dias'],
    ],
  },
  {
    nombre: HOJA_CAT_CANALES,
    cabeceras: ['Espacio', 'Nombre_Canal', 'Activo', '%_Comisión_Default', 'Gestión_Contrato'],
  },
  {
    nombre: HOJA_CAT_SERVICIOS,
    cabeceras: ['Espacio', 'Nombre_Servicio', 'Activo', 'Coste_Unitario', 'Precio_Unitario'],
  },
  {
    nombre: HOJA_CAT_CATEGORIAS_GASTO,
    cabeceras: ['Nombre_Categoria', 'Descripcion', 'Activo', 'Deducible_Default', 'Es_Amortizacion'],
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
    nombre: HOJA_CONFIG,
    cabeceras: ['Clave', 'Valor', 'Descripcion'],
    semilla: [
      ['Emails_Notificacion', '', 'Emails de los tres copropietarios, separados por coma (avisos, confirmaciones, informes)'],
      ['Mensaje_Solapamiento', 'Ya existe una reserva para ese espacio en esas fechas.', 'Mensaje de bloqueo por solapamiento'],
      ['Hora_CheckIn_Default', '16:00', 'Hora de entrada por defecto (modo Rango_Dias)'],
      ['Hora_CheckOut_Default', '12:00', 'Hora de salida por defecto (modo Rango_Dias)'],
      ['Tamano_Max_Contrato_MB', '5', 'Tamaño máximo del archivo de contrato (MB)'],
      ['Valor_Construccion', '', 'Valor de construcción del inmueble — amortización IRPF (ADR-0012)'],
      ['Proporcion_Alquilada', '', 'Proporción alquilada de la vivienda — amortización IRPF (ADR-0012)'],
    ],
  },
  {
    nombre: HOJA_USUARIOS,
    cabeceras: ['Email', 'Activo', 'Rol'],
  },
  {
    nombre: HOJA_LOGS,
    cabeceras: ['Fecha_Hora', 'Tipo', 'Email', 'Detalle'],
  },
  {
    nombre: HOJA_ERRORES,
    cabeceras: ['Fecha_Hora', 'Funcion', 'Mensaje', 'Contexto'],
  },
  {
    nombre: HOJA_HISTORIAL_CAMBIOS,
    cabeceras: ['Fecha_Hora', 'Usuario', 'ID_Reserva', 'Campo', 'Valor_Anterior', 'Valor_Nuevo'],
  },
  {
    nombre: HOJA_HISTORICO_INFORMES,
    cabeceras: ['Periodo', 'Tipo', 'Espacio', 'Canal', 'Num_Reservas', 'Ingresos_Brutos', 'Comisiones', 'Ingresos_Netos', 'Ocupacion'],
  },
  {
    nombre: HOJA_ESTADISTICAS_CACHE,
    cabeceras: ['Zona', 'Total_Reservas_Anyo', 'Ingresos_Netos', 'Fecha_Actualizacion'],
  },
  {
    nombre: HOJA_GASTOS,
    cabeceras: ['ID_Gasto', 'Fecha', 'Ejercicio', 'Concepto', 'Categoria', 'Espacio', 'Importe', 'Deducible', 'Pagado_Por', 'Justificante', 'Notas'],
  },
  {
    nombre: HOJA_RESUMEN_FISCAL,
    cabeceras: ['Ejercicio', 'Espacio', 'Ingresos_Integros', 'Gastos_Deducibles', 'Rendimiento_Neto', 'Tercio_Comunero'],
  },
  {
    nombre: HOJA_REGISTRO_VIAJEROS,
    cabeceras: ['ID_Reserva', 'Nombre_Completo', 'Tipo_Documento', 'Num_Documento', 'Num_Soporte',
      'Nacionalidad', 'Fecha_Nacimiento', 'Direccion', 'Telefono', 'Email', 'Parentesco', 'Foto_Anverso', 'Foto_Reverso'],
  },
];

// Crea las hojas que falten, fija sus cabeceras y siembra los datos iniciales si la hoja está vacía.
// Idempotente: re-ejecutarla no duplica ni borra datos existentes.
const inicializarBaseDeDatos = () => {
  const ss = obtenerSpreadsheet();
  const resultado = { creadas: [], existentes: [] };

  ESQUEMA_HOJAS.forEach((definicion) => {
    let hoja = ss.getSheetByName(definicion.nombre);
    const esNueva = !hoja;
    if (esNueva) hoja = ss.insertSheet(definicion.nombre);

    escribirCabecera(hoja, definicion.cabeceras);
    if (definicion.semilla && hoja.getLastRow() < 2) {
      hoja.getRange(2, 1, definicion.semilla.length, definicion.cabeceras.length).setValues(definicion.semilla);
    }
    resultado[esNueva ? 'creadas' : 'existentes'].push(definicion.nombre);
  });

  eliminarHojaPorDefecto(ss);
  return resultado;
};

const escribirCabecera = (hoja, cabeceras) => {
  const rango = hoja.getRange(1, 1, 1, cabeceras.length);
  rango.setValues([cabeceras]).setFontWeight('bold');
  hoja.setFrozenRows(1);
};

// Elimina la hoja "Hoja 1"/"Sheet1" vacía que crea Google al nacer el documento.
const eliminarHojaPorDefecto = (ss) => {
  const nombresEsquema = ESQUEMA_HOJAS.map((d) => d.nombre);
  ss.getSheets().forEach((hoja) => {
    const nombre = hoja.getName();
    const esResidual = (nombre === 'Hoja 1' || nombre === 'Sheet1' || nombre === 'Hoja1');
    if (esResidual && nombresEsquema.indexOf(nombre) === -1 && ss.getSheets().length > 1) {
      ss.deleteSheet(hoja);
    }
  });
};

// Menú en la propia hoja para lanzar la inicialización sin abrir el editor.
const onOpen = () => {
  SpreadsheetApp.getUi()
    .createMenu('KAF Rent')
    .addItem('Inicializar / reparar hojas', 'inicializarBaseDeDatos')
    .addToUi();
};
