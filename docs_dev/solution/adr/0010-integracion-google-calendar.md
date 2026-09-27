---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0010: Calendario de ocupación en Google Calendar (un evento por reserva, Sheet como fuente de verdad)

## Contexto y planteamiento del problema

Se quiere un calendario visual de ocupación en la Fase 1. La cuenta operativa tiene Google Calendar gratis, con apps web y móviles, vistas por día, semana y mes, y colores. Cada reserva ya tiene su franja (`Fecha_Hora_Inicio`/`Fin`). ¿Construimos un calendario propio o nos apoyamos en Google Calendar? (P-05, JTBD-05)

## Factores de decisión

* Coste cero y mínimo desarrollo.
* Vista cómoda en móvil.
* El Sheet sigue siendo la fuente de verdad y el sitio donde se validan los solapamientos.
* La sincronización no puede bloquear el guardado (RNF-16).

## Opciones consideradas

* Google Calendar de la cuenta operativa, un evento por reserva, enlazado desde la app
* Calendario visual propio en HTML
* Sin calendario (solo tablas)
* Calendario personal de cada usuario
* Calendar como fuente de verdad de la disponibilidad

## Resultado de la decisión

Opción elegida: "Google Calendar de la cuenta operativa, enlazado", porque da la vista de ocupación gratis y sin desarrollar interfaz.

- **Crear** reserva → evento `NN/AA · Espacio — Huésped`, descripción con canal y referencia; **color por espacio**; `Calendar_Event_Id` en la reserva.
- **Cancelar** → se elimina el evento.
- **Editar** huésped → se actualiza el título del evento (*revisión 2026-09-25, v2, B-09*). Fechas y espacio → pendiente de HU-38 (hoy no se editan).
- *Revisión 2026-09-25 (v2, B-11):* el evento se crea **después** de guardar la reserva, para no dejar eventos huérfanos si falla el guardado.
- *Revisión 2026-09-27 (v2, F-13, decisión del usuario):* el evento invita a todos los usuarios activos de `Usuarios_Autorizados`, que reciben la invitación de Calendar y pueden aceptarla (RF-83). La reconciliación (RF-40) también invita.
- **Un único calendario** (`Config.Calendar_Id`, vacío = por defecto) enlazado desde el Inicio con `Config.Calendar_Url` (no embebido).
- **Robustez:** si Calendar falla, la reserva se guarda igual, `Calendar_Event_Id` queda vacío y el fallo va a `Errores`. La utilidad `sincronizarReservasCalendario` (editor) crea los eventos que falten.
- Requiere ejecutar como la cuenta operativa (ADR-0001).

### Consecuencias

* Buena, porque la vista de ocupación es inmediata, gratis y con app móvil.
* Buena, porque desacopla la vista del desarrollo de la interfaz.
* Mala, porque hay una doble representación (Sheet + Calendar) que mantener sincronizada; se mitiga con `Calendar_Event_Id` y la reconciliación.
* Mala, porque editar un evento a mano en Calendar no se refleja en el Sheet (el Sheet manda).
* Mala, porque suma uso de `CalendarApp` a la cuota diaria.

### Confirmación

* Tests unitarios con `CalendarApp` simulado: creación, borrado y fallo no bloqueante (RF-36 a RF-38).
* Test de integración contra un calendario de pruebas.

## Pros y contras de las opciones

### Calendario propio

* Mala, porque reinventa lo que Google ofrece gratis.

### Sin calendario

* Mala, porque se pierde la vista de ocupación pedida.

### Calendario personal de cada usuario

* Mala, porque dispersa los datos fuera de la cuenta operativa.

### Calendar como fuente de verdad

* Mala, porque el Sheet es la base de datos y el lugar de la validación.

## Más información

* **Trazabilidad:** HU-07, HU-19 · RF-12, RF-36 a RF-38, RF-40, RF-41 · RNF-16
* **Cuestiones abiertas:** actualizar fechas/espacio del evento con HU-38; F-04 (reconciliación automática periódica)
