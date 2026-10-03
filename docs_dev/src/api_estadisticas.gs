// Capa: API — Estadísticas por espacio y canal con su ocupación (DD-04 §3.3, F-49; HU-31), calculadas al abrir,
// y enlace al calendario (HU-07).

const ANYO_INICIO_ACTIVIDAD = 2026;

// Datos que necesita el cálculo de un espacio: reservas, cierres, canales del catálogo y horas abiertas al día.
const datosOcupacion_ = (espacio, reservas, cierres, canalesDe) => ({
  reservas, cierres, espacio, canales: canalesDe(espacio.nombre), horasDia: horasAbiertasPorDiaConfig_(),
});

// filtro: { espacio, anyo, periodo: 'anyo' | 'T1'…'T4' | 'M1'…'M12' }.
const cargarInformeOcupacion = (filtro) => ejecutarEndpoint_('cargarInformeOcupacion', { filtro }, () => {
  const espacios = obtenerEspacios_();
  const anyoActual = new Date().getFullYear();
  const anyos = Array.from({ length: anyoActual - ANYO_INICIO_ACTIVIDAD + 1 }, (_, i) => anyoActual - i);
  const espacio = espacios.find((e) => e.nombre === texto_(filtro && filtro.espacio)) || espacios[0];
  const anyo = parseInt(filtro && filtro.anyo, 10) || anyoActual;
  const periodo = periodoOcupacion_(anyo, texto_(filtro && filtro.periodo) || `M${new Date().getMonth() + 1}`);
  if (!espacio || !periodo) return { success: false, error: 'Elige un espacio y un periodo válidos.' };

  const datos = datosOcupacion_(espacio, leerReservas_().entradas.map((e) => e.reserva), leerCierres_(), nombresCanalesActivosPorEspacio_());
  return {
    success: true,
    data: {
      espacios: espacios.map((e) => ({ nombre: e.nombre, nombreCorto: e.nombreCorto })),
      anyos,
      espacio: espacio.nombre,
      metricas: metricasOcupacion_({ ...datos, periodo }),
      evolucion: evolucionMensual_(datos, anyo),
    },
  };
}, { errorUsuario: 'No se pudieron cargar las estadísticas.' });

// Enlace al calendario de ocupación para el Inicio (ADR-0010: enlazar, no embeber).
const obtenerEnlaceCalendario = () => ejecutarEndpoint_('obtenerEnlaceCalendario', {},
  () => ({ success: true, url: String(obtenerConfig_('Calendar_Url', '')) }),
  { errorUsuario: 'No se pudo obtener el enlace del calendario.' });
