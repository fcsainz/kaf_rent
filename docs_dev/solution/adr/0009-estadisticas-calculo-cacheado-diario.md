---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0009: Estadísticas precalculadas una vez al día y leídas de un cache

## Contexto y planteamiento del problema

La sección Estadísticas muestra un resumen anual por espacio. Calcularlo en cada visita obliga a recorrer toda la hoja `Reservas`, lo que es lento y consume cuota, para datos que apenas cambian durante el día. Los informes por email (HU-32) son complementarios, no la sustituyen. ¿Cómo calculamos y servimos las estadísticas? (P-08, JTBD-08)

## Factores de decisión

* Carga de la pantalla < 1 s (RNF-04).
* Respetar las cuotas de Apps Script (RNF-05).
* Simplicidad; sin acoplar el guardado de reservas.
* Una vista de tendencia anual tolera cierto desfase.

## Opciones consideradas

* Trigger diario (03:00) que recalcula y sobrescribe `Estadisticas_Cache`; la pantalla solo lee
* Calcular al vuelo en cada visita
* Reutilizar `Historico_Informes` como cache
* Refrescar el cache en cada escritura de reserva

## Resultado de la decisión

Opción elegida: "Trigger diario + `Estadisticas_Cache`", porque da una carga instantánea con un único cálculo nocturno.

- **Zonas:** "Todos" + una por cada **espacio activo** del catálogo (hoy Piscina/Jardín y Habitación).
- **Métricas:** nº de reservas no canceladas con `Fecha_Hora_Inicio` en el **año natural** y suma de `Importe_Neto`.
- La pantalla muestra "Las estadísticas se actualizan cada 24 horas" y la fecha de la última actualización.
- El recálculo corre dentro de `tareasNocturnas` (ADR-0013). Recálculo manual: botón **Recalcular ahora** de la sección Estadísticas (endpoint `recalcularEstadisticas`, protegido por autorización desde v2).
- El cache (snapshot sobrescrito) es distinto de `Historico_Informes` (archivo acumulado).

### Consecuencias

* Buena, porque la pantalla carga al instante.
* Buena, porque el coste se concentra de noche.
* Buena, porque añadir métricas es ampliar el cálculo nocturno.
* Mala, porque los datos pueden tener hasta 24 h de desfase (se avisa en la interfaz).
* Mala, porque depende de que el trigger se ejecute (riesgo **R-12**): se muestra la fecha de actualización.

### Confirmación

* Test unitario de la agregación con filas de ejemplo (RF-59).
* Revisión de la fecha de actualización en la pantalla tras cada noche.

## Pros y contras de las opciones

### Al vuelo

* Buena, porque los datos están siempre al día.
* Mala, porque es lento y consume cuota en cada visita.

### `Historico_Informes` como cache

* Mala, porque mezcla un archivo acumulado con un snapshot sobrescribible.

### Refresco en cada escritura

* Buena, porque no hay desfase.
* Mala, porque acopla y ralentiza el guardado de reservas.

## Más información

* **Trazabilidad:** HU-31, HU-32 · RF-59 a RF-61, RF-71 · RNF-04, RNF-05
* **Cuestiones abiertas:** métricas adicionales por zona (backlog F-05).
