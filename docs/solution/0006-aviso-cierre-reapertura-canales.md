# ADR-0006: Notificaciones de cierre/reapertura de disponibilidad entre canales (email, no WhatsApp)

## Estado
Aceptado

## Contexto
- Cada Espacio puede tener más de un canal activo simultáneamente (p. ej. Piscina/Jardín a través de dos apps, más una vía excepcional posible).
- Sin un channel manager de pago, no existe sincronización automática de disponibilidad entre esos canales: si se reserva por uno, hay que cerrar manualmente la franja en los demás.
- Ya estaba decidido que, al registrarse una reserva con éxito en un Espacio con más de un canal activo, hay que avisar para cerrar disponibilidad en los demás canales para esa franja; y que al cancelarse una reserva (ADR-0005), hay que avisar para reabrirla.
- Se valoró si, además de email, convenía un canal instantáneo tipo WhatsApp para que el aviso llegara más rápido al móvil.
- Restricción del proyecto: coste de infraestructura cero.

## Decisión
El aviso se envía únicamente por **email** (vía `MailApp`/`GmailApp`, el mismo mecanismo ya usado para el informe trimestral), a los **tres** co-propietarios. Las direcciones se leen de `Config` (p. ej. `Email_Aviso_Canales`), de modo que la lista de destinatarios se ajusta sin tocar código.

Disparadores:
- **Al registrar con éxito una reserva** en un Espacio cuyo `Catálogo_Canales` tenga más de un canal activo: email indicando qué canales hay que cerrar para esa franja.
- **Al cancelar una reserva** (botón dedicado, ver ADR-0005) en esas mismas condiciones: email indicando que la disponibilidad se puede reabrir en esos mismos canales.

Contenido propuesto del email (ajustable desde `Config` si se quiere cambiar el texto exacto, sin tocar código):
- Espacio.
- Fecha/Hora de inicio y fin de la franja.
- Canal donde se registró o canceló la reserva.
- Lista de los demás canales activos de ese Espacio a cerrar (o reabrir).

Se descarta WhatsApp como canal de aviso, por las razones detalladas en "Alternativas consideradas".

## Alternativas consideradas
- **API oficial de WhatsApp Business**: descartada. Desde 2026, Meta está migrando esta API a un modelo de facturación por mensaje fuera de la ventana gratuita de 24h iniciada por el cliente (que aquí no aplica, porque el "destinatario" es el propio equipo, no un cliente que escribe primero). Además requiere verificación de empresa ante Meta, un número de teléfono dedicado y plantillas de mensaje pre-aprobadas. Incompatible con el requisito de coste cero y con la simplicidad buscada para algo que es, en esencia, un aviso interno.
- **Servicios no oficiales de envío por WhatsApp** (integraciones de terceros tipo webhook): descartados por falta de fiabilidad para un aviso operativo diario, y por el riesgo de que Meta bloquee el número asociado.
- **Telegram (bot propio)**: es gratuito, sin coste por mensaje y sin verificación de empresa, y técnicamente viable desde Apps Script con una simple llamada HTTP. Se descarta para esta primera versión por simplicidad (un canal menos que mantener), pero queda anotado como mejora futura si el email resultara insuficiente en la práctica.
- **No enviar ningún aviso automático**, confiando en revisión manual periódica del panel: descartado, aumenta el riesgo real de overbooking entre canales al no haber channel manager de pago.

## Consecuencias

**Positivas**
- Coste cero, sin dependencias externas más allá de la propia cuenta de Gmail.
- Reutiliza el mismo mecanismo de envío de email que ya existe para el informe trimestral, sin necesidad de nuevas integraciones ni cuentas de terceros.
- El contenido del aviso es configurable desde `Config`, sin tocar código.

**Negativas / riesgos**
- Depende de que la persona que recibe el email lo revise con la rapidez suficiente para evitar un overbooking real entre el momento de la reserva y el cierre manual en la otra plataforma; el email no es tan inmediato como una notificación push al móvil.
- Si en el futuro se detecta que el retraso en revisar el email genera problemas reales, se puede añadir Telegram como canal complementario sin rehacer esta decisión, solo ampliándola.

## Pendiente
- Redactar el texto definitivo de la plantilla del email (la propuesta de campos queda arriba, el wording exacto se puede ajustar más adelante desde `Config`).
