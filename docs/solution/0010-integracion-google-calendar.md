# ADR-0010: Integración con Google Calendar (calendario de ocupación)

## Estado
Aceptado

## Contexto
- Se quiere un **calendario visual de ocupación** en Fase 1, para ver de un vistazo qué días/horas están ocupados en cada espacio.
- La cuenta operativa (`operaciontangai@gmail.com`, ver ADR-0001) dispone de **Google Calendar** sin coste, con apps web y móviles ya hechas, vista por día/semana/mes, colores y notificaciones nativas.
- Cada reserva ocupa una franja (`Fecha_Hora_Inicio` / `Fecha_Hora_Fin`), dato que ya existe en el modelo.
- Restricción del proyecto: coste de infraestructura cero y mantener la simplicidad de desarrollo.

## Decisión
- Al **crear** una reserva, KAF Rent crea automáticamente un **evento** en el Google Calendar de la cuenta operativa con: título `Espacio — Nombre_Huesped`, inicio/fin = `Fecha_Hora_Inicio`/`Fecha_Hora_Fin`, y descripción con canal, nº de personas y estado. El identificador del evento se guarda en el campo `Calendar_Event_Id` de la reserva.
- Al **editar** una reserva en datos que afectan al evento (fechas, espacio, huésped) → se **actualiza** el evento correspondiente.
- Al **cancelar** una reserva → se **elimina** el evento (libera visualmente la franja).
- El **calendario de ocupación** que pide la Fase 1 **es** este Google Calendar: se consulta directamente en Calendar (web/móvil) y, opcionalmente, se **embebe** en la app como vista de solo lectura.
- **Robustez**: la sincronización con Calendar **no bloquea** el guardado de la reserva. El Sheet `Reservas` es la **fuente de verdad**; si la llamada a Calendar falla, la reserva se guarda igual, el fallo se registra en `Errores` y el evento se reconcilia después. La validación de solapamientos sigue haciéndose contra el Sheet (ADR-0003), nunca contra Calendar.

## Alternativas consideradas
- **Construir un calendario visual propio en HTML**: descartado; reinventa lo que Google Calendar ya ofrece gratis, con apps móviles y mantenimiento cero.
- **No integrar Calendar y dejar solo las tablas**: descartado; se pierde la vista de ocupación pedida para Fase 1.
- **Usar el Calendar personal de cada usuario**: descartado; los datos deben vivir en la cuenta operativa, no dispersos en las cuentas personales.
- **Que Calendar sea la fuente de verdad de la disponibilidad**: descartado; el Sheet es la base de datos y donde se valida el solapamiento; Calendar es una proyección visual.

## Consecuencias

**Positivas**
- Vista de ocupación inmediata, gratis, compartible y con app móvil; sin desarrollar UI de calendario.
- Desacopla la vista visual del desarrollo del front de la app.
- Recordatorios/avisos nativos de Calendar disponibles si se quieren.

**Negativas / riesgos**
- Doble representación (Sheet + Calendar) que hay que mantener sincronizada; mitigado guardando `Calendar_Event_Id` y reconciliando ante fallo.
- Suma uso de `CalendarApp` a la cuota diaria de Apps Script (ver NFR-01.2).
- Una edición manual del evento en Calendar **no** se refleja en el Sheet (el Sheet manda); conviene no editar eventos a mano.

## Pendiente
- Decidir si se usa **un único calendario con un color por espacio** o **un calendario por espacio**.
- Decidir si la vista se **embebe** en la app (iframe de solo lectura) o solo se **enlaza** al Calendar.
- Definir la política ante fallo de sincronización (reintentos / reconciliación periódica).
- Definir el contenido exacto y el formato del título/descripción del evento.
