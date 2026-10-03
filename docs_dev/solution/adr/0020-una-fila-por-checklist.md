---
status: accepted
date: 2026-10-02
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0020: Registro de checklists con una fila por checklist

Sustituye **solo la hoja `Registro_Checklist`** del diseño de datos de [DD-01 §3.1](../design-docs/DD-01-checklists-digitales.md) (checklists digitales, F-14). El catálogo `Catálogo_Checklist` y las reglas de las listas no cambian.

## Contexto y planteamiento del problema

`Registro_Checklist` guardaba una fila por punto (unas 40 por checklist). Para guardar sin dejar la hoja a medias, la app leía la hoja entera, cambiaba en memoria las filas de esa reserva y la reescribía completa (TD-02). Las demás checklists no cambiaban de valor, pero se reescribían en cada guardado, y la hoja crecía unas 80 filas por reserva.

## Factores de decisión

* Que guardar una checklist toque solo esa checklist (atomicidad, RNF-14).
* No romper la v2 publicada, que sigue escribiendo en `Registro_Checklist` hasta el siguiente despliegue.
* Sin migración: `Registro_Checklist` no tiene filas en el Sheet real (usuario, 2026-10-02).

## Opciones consideradas

* Una fila por checklist (reserva + momento) con los puntos en JSON en una celda, en una hoja nueva
* Mantener una fila por punto y escribir solo las filas de esa reserva
* Dejarlo como está

## Resultado de la decisión

Opción elegida: "Una fila por checklist en una hoja nueva" (usuario, 2026-10-02), porque guardar es añadir o actualizar una sola fila.

* Hoja **`Checklists_Reserva`**: `ID_Reserva · Momento · Puntos · Observaciones · Usuario · Fecha_Hora`.
* `Puntos` = JSON `[{ idPunto, estado, valor, usuario, fecha }]`. Un punto sin cambios conserva quién y cuándo lo marcó; `Usuario` y `Fecha_Hora` de la fila son los del último guardado.
* `Observaciones` va en su propia columna (antes, una fila `OBSERVACIONES`) para que se lea sin abrir el JSON.
* Si la celda `Puntos` no se puede leer, la app da error y no guarda encima (no se pierde lo marcado).
* `Registro_Checklist` sale del esquema. Se borra a mano del Sheet después de publicar la versión que usa la hoja nueva.

### Consecuencias

* Buena, porque cada guardado escribe una sola fila y no toca las demás checklists.
* Buena, porque la hoja crece dos filas por reserva, no unas 80.
* Mala, porque lo marcado se lee peor a mano en el Sheet (JSON en una celda).
* Neutra: el límite de 50 000 caracteres por celda queda lejos (unos 40 puntos de unos 150 caracteres).

### Confirmación

* `tests/endpoints/checklist.test.js` (TD-02): una fila por checklist, sin duplicar, sin tocar las demás, conservando el autor y sin guardar sobre una celda ilegible.

## Pros y contras de las opciones

### Una fila por punto, escribiendo solo las filas de la reserva

* Buena, porque el Sheet se lee bien a mano.
* Mala, porque las filas de una reserva no son contiguas: hay que escribirlas de una en una o reescribir la hoja.

### Dejarlo como está

* Buena, porque no hay que tocar nada.
* Mala, porque cada guardado reescribe todas las checklists.

## Más información

* **Trazabilidad:** HU-29 · RF-85 · RNF-14 · TD-02 · DD-01.
* **Cuestiones abiertas:** ninguna.
