---
status: accepted
date: 2026-10-02
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0019: Hora de llegada y de salida obligatorias en todos los espacios

Sustituye **solo la parte de horas** del punto 3 del resultado de [ADR-0003](0003-formulario-generar-reserva-catalogos.md) (en `Rango_Dias`, horas fijas de `Config`; en `Dia_y_Hora`, horas opcionales). El formulario con catálogos en cascada, los modos de fecha y el rechazo de fechas pasadas siguen vigentes.

## Contexto y planteamiento del problema

En la Habitación (`Rango_Dias`) la hora no se pedía: se tomaba de `Config.Hora_CheckIn_Default`/`Hora_CheckOut_Default`. Sheets guarda "16:00" como valor de hora y el código esperaba texto, así que todas las reservas quedaron a 00:00 (B-22). Además, la hora real de llegada varía de un huésped a otro y en Piscina/Jardín (`Dia_y_Hora`) las horas podían quedarse vacías (00:00–23:59). El usuario pide horas obligatorias en los dos espacios (F-23, 2026-10-02).

## Factores de decisión

* Que la reserva refleje la hora real de llegada y de salida (eventos de Calendar, solapamiento).
* Mínimo esfuerzo al crear una reserva de Habitación, donde casi siempre valen las horas habituales.
* Validación en dos capas (CLAUDE.md §4.7).

## Opciones consideradas

* Horas obligatorias en los dos espacios; en la Habitación, prerrellenas con las de `Config` y editables
* Horas obligatorias solo en Piscina/Jardín; en la Habitación, siempre las de `Config`
* Dejarlo como está (corrigiendo solo la lectura de `Config`)

## Resultado de la decisión

Opción elegida: "Horas obligatorias en los dos espacios, prerrellenas en la Habitación", porque recoge la hora real sin añadir trabajo en el caso habitual.

* El formulario muestra "Hora de llegada" y "Hora de salida" como obligatorias en cualquier modo.
* En `Rango_Dias`, `cargarEspaciosFormulario` devuelve `horasPorDefecto` (de `Config`, leídas como `HH:mm` aunque Sheets las guarde como hora, B-22) y el cliente las prerrellena.
* El servidor rechaza la reserva sin horas o con una hora mal formada (`validarHoras_`); `Config` ya no interviene al guardar.

### Consecuencias

* Buena, porque cada reserva guarda la hora real y el evento de Calendar la refleja.
* Buena, porque en la Habitación el caso habitual no cuesta ningún toque más.
* Mala, porque en Piscina/Jardín ya no se puede guardar una reserva sin horas.

### Confirmación

* `tests/dominio/dominio.test.js` (F-23) y `tests/endpoints/reservas.test.js` (F-23, B-22).
* E2E existentes: el journey J-1 crea una reserva de Habitación con las horas prerrellenas.

## Pros y contras de las opciones

### Horas obligatorias solo en Piscina/Jardín

* Buena, porque la Habitación no cambia para el usuario.
* Mala, porque la hora real de llegada a la Habitación no queda registrada.

### Dejarlo como está

* Buena, porque no cambia nada salvo la corrección de B-22.
* Mala, porque no cumple lo pedido (F-23).

## Más información

* **Trazabilidad:** HU-10, HU-11 · RF-19, RF-20 · B-22, F-23, D-28.
* **Cuestiones abiertas:** ninguna.
