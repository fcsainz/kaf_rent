---
status: accepted
date: 2026-06-24
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0006: Avisos de cierre y reapertura de canales por email (no WhatsApp)

## Contexto y planteamiento del problema

Un espacio puede tener varios canales activos. Sin un *channel manager* de pago no hay sincronización automática: si se reserva por uno, hay que cerrar la franja a mano en los demás, y reabrirla si se cancela. ¿Por qué medio avisamos, sin coste? (P-02, P-06, JTBD-02, JTBD-06)

## Factores de decisión

* Coste cero (RNF-33).
* Fiabilidad del aviso para una tarea operativa diaria.
* Simplicidad de mantenimiento (un único mantenedor).
* El aviso no debe bloquear el guardado (RNF-16).

## Opciones consideradas

* Email (`MailApp`) a los tres copropietarios
* API oficial de WhatsApp Business
* Servicios no oficiales de WhatsApp
* Bot de Telegram
* Sin aviso automático

## Resultado de la decisión

Opción elegida: "Email a los tres copropietarios", porque es gratuito, fiable y ya se usa para el resto de notificaciones.

- Destinatarios: `Config.Emails_Notificacion` (separados por comas).
- **Al crear** una reserva en un espacio con otros canales activos → aviso de **cierre** (espacio, franja, canal de origen, canales a cerrar).
- **Al cancelar** en las mismas condiciones → aviso de **reapertura**.
- Además, al crear se envía la **confirmación de reserva** (HU-18).
- Si el email falla, la operación se completa y el fallo va a `Errores`.

### Consecuencias

* Buena, porque cuesta cero y no depende de terceros.
* Buena, porque reutiliza el mismo mecanismo que la confirmación y los informes.
* Mala, porque el email es menos inmediato que una notificación push; si el retraso causa problemas reales, se añadirá Telegram sin rehacer esta decisión.
* Mala, porque los emails automáticos pueden caer en spam (riesgo R-05).
* Neutral: el texto del aviso está en el código; hacerlo configurable desde `Config` queda como mejora opcional (no es necesario hoy, YAGNI).

### Confirmación

* Tests unitarios con `MailApp` simulado: se envía o no según haya otros canales; el fallo no propaga (RF-34, RF-37, RF-39).

## Pros y contras de las opciones

### WhatsApp Business API

* Buena, porque es inmediato en el móvil.
* Mala, porque en 2026 factura por mensaje fuera de la ventana de 24 h, exige verificar la empresa, un número dedicado y plantillas aprobadas.

### WhatsApp no oficial

* Mala, porque es poco fiable y conlleva riesgo de bloqueo del número.

### Telegram

* Buena, porque es gratuito, sin verificación y fácil de llamar desde Apps Script.
* Mala, porque añade un canal más que mantener; queda como mejora futura.

### Sin aviso

* Mala, porque aumenta el riesgo real de *overbooking*.

## Más información

* **Trazabilidad:** HU-17, HU-18, HU-20 · RF-34, RF-35, RF-37, RF-39 · RNF-05, RNF-16
* **Riesgos:** R-05 (spam) en [arc42 §11](../arc42.md#11-riesgos-y-deuda-técnica)
