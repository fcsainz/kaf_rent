---
status: proposed
date: 2026-10-03
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0025: Estadísticas por canal calculadas al abrir, sin el cache diario

Sustituye **solo la parte del cache** de [ADR-0009](0009-estadisticas-calculo-cacheado-diario.md): el recálculo nocturno en `Estadisticas_Cache` y la pantalla que solo lee de ahí. Siguen vigentes de ADR-0009 los informes por email del día 1 y su archivo en `Historico_Informes`.

## Contexto y planteamiento del problema

ADR-0009 precalculaba cada noche un único resumen anual por espacio (reservas y neto) para que la pantalla cargara al instante. DD-04 (D-13, aprobado el 2026-10-03) pide algo que ese cache no puede dar: elegir espacio, año y periodo (mes, trimestre o año), ver cada canal con su ocupación sobre los días abiertos (descontando los cerrados) y la evolución de 12 meses. Precalcular todas las combinaciones sería un cache grande para muy pocas reservas (≈ 15 al año). ¿Seguimos con el cache o calculamos al abrir? (P-08, HU-31)

## Factores de decisión

* Filtros libres por espacio, año y periodo (DD-04 §3.3).
* Datos al día: un cierre o una reserva de hoy deben verse ya.
* Cuotas de Apps Script (RNF-05): lecturas en bloque, nada en bucle.
* Carga de la pantalla (RNF-04, < 1 s; sin medir en real).

## Opciones consideradas

* Calcular al abrir, con una lectura en bloque de `Reservas`, `Dias_Cerrados` y los catálogos.
* Ampliar el cache nocturno a todas las combinaciones de espacio, año y periodo.
* Mantener el cache para el resumen anual y calcular al abrir solo el resto.

## Resultado de la decisión

Opción elegida: "Calcular al abrir", porque con el volumen real (decenas de reservas) el cálculo es inmediato, cubre cualquier filtro y no tiene desfase. Se implementó en S36 (2026-10-03) siguiendo DD-04; este ADR lo registra.

### Consecuencias

* Buena, porque los datos están siempre al día y no dependen del trigger nocturno (desaparece el riesgo R-12 para Estadísticas).
* Buena, porque no hay que mantener un cache ni su botón "Recalcular ahora".
* Mala, porque cada visita lee las hojas; con muchos años de reservas habría que medir (RNF-04) y, si hiciera falta, volver a un cache.
* Neutral: `Estadisticas_Cache` queda sin uso y se conserva (solo cambios aditivos); RF-59 y RF-60 pasan a ⛔.

### Confirmación

* Tests `RF-107` y `RF-108` en `tests/dominio/ocupacion.test.js` y `tests/endpoints/ocupacion.test.js`.
* Medir el tiempo de carga de Estadísticas en producción (RNF-04, smoke).

## Pros y contras de las opciones

### Calcular al abrir

* Buena, porque admite cualquier filtro y no tiene desfase.
* Mala, porque el tiempo crece con el número de reservas (hoy despreciable).

### Cache de todas las combinaciones

* Buena, porque la carga sería constante.
* Mala, porque es un cache grande y con desfase para unas pocas reservas al año.

### Cache solo para el resumen anual

* Mala, porque mantiene dos caminos para lo mismo y el desfase en una parte de la pantalla.

## Más información

* **Trazabilidad:** HU-31 · RF-107, RF-108 (sustituyen a RF-59 y RF-60) · RNF-04, RNF-05 · DD-04 §3.3
* **Cuestiones abiertas:** medir RNF-04 en real (S11); D-54 (aceptar este ADR).
* **Relacionados:** ADR-0009, ADR-0013
