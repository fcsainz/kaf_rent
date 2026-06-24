# ADR-0009: Estadísticas con cálculo cacheado diario

## Estado
Aceptado

## Contexto
- La nueva navegación ([ADR-0008](0008-reestructuracion-navegacion-tres-secciones.md)) incorpora una sección **Estadísticas** con un resumen de negocio por espacio.
- Calcular los agregados al vuelo en cada visita obligaría a recorrer toda la hoja `Reservas` en cada carga, lo que penaliza el rendimiento y consume cuota de Apps Script innecesariamente, siendo datos que apenas cambian a lo largo del día.
- Ya existen informes mensual y trimestral por email (US-021) que agregan ingresos por espacio y canal; la sección Estadísticas es una vista **anual y en pantalla**, complementaria (no sustituye a esos informes).
- Restricción del proyecto: coste de infraestructura cero; respetar las cuotas de Apps Script.

## Decisión
Las estadísticas se **precalculan una vez al día y se almacenan en cache**; la pantalla solo **lee** el cache, nunca recalcula en vivo.

### Contenido de la pantalla
Tres zonas:
1. **Todos los alquileres** (agregado de ambos espacios).
2. **Alquiler Piscina / Jardín**.
3. **Alquiler Habitación**.

Métricas por zona (ampliables en el futuro — el diseño se concibe extensible):
- **Total de reservas en el último año**.
- **Total de ingresos netos** (suma de `Importe_Neto`).

Criterios de cálculo:
- **"Último año" = año natural** (del 1 de enero al 31 de diciembre del año en curso).
- Se consideran las reservas **no canceladas** cuya `Fecha_Hora_Inicio` cae dentro del año natural.
- "Ingresos netos" usa `Importe_Neto` (`Importe_Bruto − Importe_Comisión − Servicios_Coste_Total`, ver SDD §4).

La pantalla muestra de forma fija el texto **"Las estadísticas se actualizan cada 24 horas"**, junto con la marca de tiempo de la última actualización efectiva.

### Mecanismo de cálculo y almacenamiento
- Un **trigger temporal de Apps Script** se ejecuta **diariamente a las 03:00**, recalcula los agregados de las tres zonas y los escribe en una hoja de cache `Estadisticas_Cache` (sobrescribiendo el snapshot anterior; no es un histórico).
- La sección Estadísticas lee únicamente de `Estadisticas_Cache`.
- Se mantiene separada de `Historico_Informes` (que es el archivo append-only de los informes trimestrales): distinta cadencia (diaria vs trimestral) y distinta naturaleza (snapshot sobrescrito vs histórico acumulado).

## Alternativas consideradas
- **Calcular al vuelo en cada visita**: descartado; recorrer toda la hoja `Reservas` en cada carga es lento y gasta cuota, para datos que cambian poco intradía.
- **Reutilizar `Historico_Informes` como cache**: descartado; mezclaría un archivo histórico trimestral (append-only) con un snapshot diario sobrescribible, dificultando consultar cualquiera de los dos.
- **Refrescar el cache en cada escritura de reserva** en lugar de una vez al día: descartado para esta versión; añade complejidad y acoplamiento al guardado, y un refresco diario es suficiente para una vista de tendencia anual.

## Consecuencias

**Positivas**
- La pantalla de Estadísticas carga instantáneamente (solo lee unos pocos valores cacheados).
- El coste de cómputo se concentra en una única ejecución nocturna, fuera del horario de uso.
- Diseño extensible: añadir nuevas métricas es ampliar el cálculo del trigger y el cache, sin tocar el rendimiento de la pantalla.

**Negativas / riesgos**
- Los datos pueden tener hasta 24 h de desfase (aceptable para una vista de tendencia; comunicado explícitamente en la UI).
- Depende de que el trigger temporal se ejecute con fiabilidad; si falla, las estadísticas quedan desactualizadas (riesgo **R-12** en [08_risk_register.md](../discovery/08_risk_register.md)). Mitigación: mostrar la marca de tiempo de la última actualización y permitir un recálculo manual.
- Suma una ejecución programada a la cuota diaria de Apps Script (ver NFR-01.2).

## Pendiente
- Definir las métricas adicionales con las que se ampliará cada zona.
- Definir si se ofrece un botón de recálculo manual además del trigger diario.
- Confirmar qué fecha de la reserva determina su pertenencia al año (se asume `Fecha_Hora_Inicio`).
