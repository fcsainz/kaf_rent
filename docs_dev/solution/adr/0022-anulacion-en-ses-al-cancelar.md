---
status: accepted
date: 2026-10-02
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0022: Al cancelar una reserva ya comunicada, se anula en SES tras confirmarlo

Sustituye **solo el punto "sin anulaciones automáticas"** de [ADR-0018](0018-comunicacion-ses-hospedajes.md) (D-31). El resto de ADR-0018 sigue vigente.

## Contexto y planteamiento del problema

"Cancelada" es un estado de la reserva en KAF Rent (HU-26). En SES.Hospedajes no existe ese concepto: lo que se hace es **anular** una comunicación ya registrada, por su código (operación B, Anexo III de la especificación v3.1.3). El RD 933/2021 (Art. 6.3) pide comunicar la reserva "o su anulación". Con D-31, una reserva cancelada seguía constando en SES como válida.

## Factores de decisión

* Cumplir el Art. 6.3 sin trabajo manual.
* Evitar anular por error: una anulación en SES no se deshace.
* Coherencia con los reintentos y avisos de DD-02 §3.5.

## Opciones consideradas

* Anulación automática al cancelar, avisándolo en la confirmación
* Email para anular a mano en la web de SES
* No hacer nada (D-31)

## Resultado de la decisión

Opción elegida: "Anulación automática al cancelar, avisándolo en la confirmación" (usuario, 2026-10-02).

* La confirmación de cancelar añade, si la reserva tiene comunicaciones, el aviso: *"Esta reserva está comunicada a SES.Hospedajes (código …). Al cancelarla se anulará también en SES."*
* Al cancelar, según el estado de cada comunicación de la reserva: **Pendiente** → *Descartada* (no se envía) · **Enviada** → la anulación espera a que quede comunicada · **Comunicada** → se programa una anulación (tipo interno `AN`, columna `Anula_A` en `Comunicaciones_SES`) · Rechazada / No comunicada / Manual → nada.
* La anulación la envía la tarea de cada 10 min, con los mismos reintentos y avisos (agotados los intentos queda *Manual* y se avisa para anularla a mano). Al confirmarla SES, la original pasa a *Anulada* y se anota en el Sheet del Form: `Anulación SES` · `Lote anulación` · `Fecha anulación` · `Usuario anulación`.
* Un fallo al programar la anulación no deshace la cancelación: queda en `Errores`.

### Consecuencias

* Buena, porque una cancelación queda también reflejada en SES sin pasos manuales.
* Buena, porque la confirmación deja claro antes de cancelar que se anulará en SES.
* Mala, porque una cancelación por error anula en SES y habría que volver a comunicar.

### Confirmación

* `tests/endpoints/ses.test.js` (ADR-0022): aviso en la ficha, anulación y estados, descarte de lo pendiente, espera de lo enviado, manual tras los intentos y sin duplicados.
* Verificar en producción, con la primera cancelación de una reserva comunicada (S29), la operación B y la respuesta del lote de anulación (no verificado: la especificación no trae su respuesta detallada).

## Pros y contras de las opciones

### Email para anular a mano

* Buena, porque no hay riesgo de anular por error.
* Mala, porque añade un paso manual que se puede olvidar.

### No hacer nada

* Buena, porque no cuesta nada.
* Mala, porque SES conserva reservas que no existen (Art. 6.3).

## Más información

* **Trazabilidad:** HU-26, HU-35 · RF-52 (cancelar), RF-92 · RNF-38 · D-31, D-40 · DD-02 §3.5.
* **Cuestiones abiertas:** ninguna.
