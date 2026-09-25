---
status: accepted
date: 2026-06-24
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0004: Estado único y calculado de la reserva (`Estado_Reserva`) con cobro, contrato e incidencias

## Contexto y planteamiento del problema

Después de crearse, una reserva pasa por el cobro (manual, cada canal tiene sus plazos), la gestión del contrato (unos canales lo gestionan y otros exigen subir un documento firmado) y posibles incidencias con compensación. Existía un campo `Estado` (Confirmada/Cancelada/Pendiente) y se necesitaba además Abierta/Completada, con riesgo de que dos estados se contradijeran. Requisito explícito: **no se puede completar una reserva con el cobro pendiente o con una incidencia sin resolver**. ¿Cómo modelamos el estado? (P-04, JTBD-04)

## Factores de decisión

* Una única fuente de verdad del estado.
* La regla de cierre no debe depender de la memoria humana.
* La obligación de contrato depende del **canal**, no del espacio (confirmado).
* Ver qué falta para completar (HU-25).

## Opciones consideradas

* Un único `Estado_Reserva` (Abierta / Completada / Cancelada), con Completada **calculada**
* Dos campos (`Estado` + `Estado_Reserva`)
* "Completada" marcada a mano
* Gestión de contrato ligada al espacio

## Resultado de la decisión

Opción elegida: "Un único `Estado_Reserva` calculado", porque elimina contradicciones y protege la regla de cierre.

- **Abierta**: valor al crear.
- **Completada**: nunca a mano. El sistema la calcula cuando `Estado_Cobro = "Ingresado"` y (`Incidencias = "Sin incidentes"` o `Incidencia_Resuelta = "Sí"`). `Compensación_Daños` es **informativa**.
- **Cancelada**: única transición manual, con botón dedicado (ADR-0005). El cálculo nunca cambia una reserva cancelada.

| Campo | Valor inicial | Quién y cuándo lo cambia |
|---|---|---|
| `Estado_Cobro` | No ingresado | A mano, al comprobar el pago |
| `Contrato_Estado` | "Gestionado por canal" (canal `Automática`) / "Pendiente" (canal `Manual`) | Al subir el documento pasa a "Firmado" |
| `Incidencias` | Sin incidentes | A mano, si ocurre algo |
| `Incidente_Comunicado` | — | Sí/No, solo con incidencias |
| `Compensación_Daños` | No recibida | Informativo |
| `Incidencia_Resuelta` | No | Condición de cierre (compensada o no) |
| `Checkin_Revisado` / `Checkout_Revisado` | Pendiente | A mano (Hecho); informativos, no condicionan el estado |

### Consecuencias

* Buena, porque no hay dos indicadores que puedan contradecirse.
* Buena, porque el cierre queda protegido por una regla automática.
* Buena, porque el contrato se adapta a la política de cada canal sin intervención.
* Mala, porque si un dato se introduce mal la reserva puede quedar "atascada" en Abierta sin causa evidente; la pantalla debe decir qué falta (RF-51, por verificar).
* Mala, porque añadir condiciones de cierre obliga a tocar la función de cálculo; está centralizada en `calcularEstadoReserva`.

### Confirmación

* Test unitario tabular de `calcularEstadoReserva` con los casos de HU-25 (RF-50).
* Revisión: el estado no es editable en el formulario ni en el servidor.

## Pros y contras de las opciones

### Dos campos de estado

* Mala, porque pueden contradecirse (p. ej. "Cancelada" y "Completada").

### "Completada" manual

* Mala, porque permite cerrar con el cobro pendiente, contra el requisito explícito.

### Contrato por espacio

* Mala, porque la obligación depende de la política de cada canal, no del espacio físico.

## Más información

* **Trazabilidad:** HU-16, HU-25, HU-29 · RF-18, RF-32, RF-50, RF-51, RF-55, RF-56
* **Relacionados:** ADR-0005 (edición y cancelación), ADR-0014 (carpetas del contrato)
* **Cuestiones abiertas:** B-12 (verificar el indicador "qué falta" y que la subida se oculte si el contrato lo gestiona el canal)
