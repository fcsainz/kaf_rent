# ADR-0007: Registro de viajeros para reservas de Habitación (SES.Hospedajes)
 
## Estado
Aceptado (documentado; implementación diferida a una fase posterior del proyecto)
 
## Contexto
- El Real Decreto 933/2021 obliga a los alojamientos turísticos a registrar y comunicar los datos de identidad de sus huéspedes a las autoridades de seguridad.
- El registro a través de las antiguas Hospederías de la Guardia Civil dejó de estar operativo el 2 de diciembre de 2024, sustituido por **SES.Hospedajes**, la plataforma del Ministerio del Interior (Cataluña y País Vasco usan sus propios sistemas, gestionados por Mossos d'Esquadra y Ertzaintza).
- Esta obligación aplica solo a las reservas de Habitación Interior, no a Piscina/Jardín.
- Los datos los debe aportar el propio huésped (incluyendo fotos de su documento de identidad, anverso y reverso), no el anfitrión, por lo que se necesita una vía de acceso distinta a la webapp interna, que exige login con cuenta de Google de las tres personas autorizadas (ADR-0001).
- Se ha decidido priorizar la sencillez de uso para el huésped por encima de un control de acceso más estricto: en vez de un enlace único e intransferible por reserva, habrá un único formulario público abierto.

## Decisión
- Se añade una nueva pestaña al mismo Google Sheet del proyecto, `Registro_Viajeros` — no se crea un Sheet separado, para mantener una única base de datos y poder enlazar fácilmente con `Reservas`.
- Se despliega una segunda implementación (deployment) de la Web App de Apps Script, de acceso público (sin login), independiente de la que usan las tres personas autorizadas. Sirve únicamente el formulario de registro de viajeros.
- **Identificación de la reserva**: en vez de pedir al huésped un ID de reserva (descartado por ser propenso a errores de transcripción y difícil de recordar), el formulario le pide su Nombre y las fechas de entrada **y** salida de su estancia. El servidor busca en `Reservas` una reserva **activa** (`Estado_Reserva != "Cancelada"`) de Espacio = Habitación cuyas fechas de entrada y salida coincidan **exactamente con ambas**. Es necesario casar las dos fechas, no solo una: como el check-out de una reserva y el check-in de la siguiente pueden caer el mismo día sin que eso constituya solapamiento (las horas de check-in/check-out por defecto de `Config` los separan), dos reservas consecutivas comparten un día frontera y una sola fecha no las distingue. El nombre se usa como confirmación adicional, no como clave estricta.
- **Varios viajeros por reserva**: el formulario permite añadir tantos viajeros como sea necesario en el mismo envío (botón "Añadir otro viajero"), ya que normalmente es la persona que reservó quien rellena los datos de toda la estancia, incluidos los acompañantes.
- **Campos a capturar por viajero** (a confirmar/verificar contra la especificación oficial vigente de SES.Hospedajes antes de implementar): nombre completo, tipo y número de documento, número de soporte del documento (caracteres del reverso del DNI), nacionalidad, fecha de nacimiento, dirección completa, teléfono, email, parentesco con el titular de la reserva (si aplica), y fotos del documento de identidad (anverso y reverso).
- **Campo en `Reservas`**: se añade `Registro_Viajeros_Estado` (Pendiente / Completado), que solo aplica a reservas de Habitación. Es un campo calculado, no editable manualmente (mismo principio que `Estado_Reserva`, ver ADR-0004). A diferencia de `Estado_Reserva` —que se recalcula al guardar desde la webapp interna "Gestionar Reserva"—, este estado depende de envíos hechos desde el **formulario público** (otro deployment), que no pasa por ese flujo. Por tanto el recálculo se dispara **al recibir cada envío del formulario público** (y, como red de seguridad, al cargar el Inicio): pasa a "Completado" cuando el número de viajeros registrados en `Registro_Viajeros` para esa reserva alcanza el total esperado.
- **Conteo de viajeros esperados**: cuentan **todos** los ocupantes (de 0 a 99 años), por lo que el total esperado es `Adultos + Menores` sin excepción. Cada persona alojada debe quedar registrada para que el estado pase a "Completado".
- **Alcance de esta primera fase**: el sistema solo organiza y centraliza los datos; el envío a SES.Hospedajes se hace manualmente por una de las tres personas, copiando los datos desde `Registro_Viajeros` al portal oficial. La automatización vía la API de SES.Hospedajes se deja como línea de investigación futura — esa integración suele estar pensada para proveedores de software certificados ante el Ministerio del Interior, y no hay garantía de que sea viable para un proyecto personal sin más investigación.

## Alternativas consideradas
- **Sheet completamente separado para el registro de viajeros**: descartado, añadiría complejidad de sincronización entre dos archivos sin beneficio real para este volumen.
- **Enlace único e intransferible por reserva (token o ID)**: descartado por privilegiar la sencillez de uso del huésped; se acepta como riesgo que el formulario público pueda recibir envíos no vinculados a una reserva real, mitigado por la validación de fechas contra reservas existentes.
- **Pedir un ID de reserva en vez de nombre + fechas**: descartado por el mismo motivo — más propenso a errores de transcripción por parte del huésped que unas fechas y un nombre, que recuerda con más facilidad.
- **Automatizar el envío a SES.Hospedajes vía API desde el primer momento**: descartado para esta fase; la integración suele requerir certificación como proveedor de software, lo que excede el alcance de un proyecto personal sin más investigación previa.

## Consecuencias
 
**Positivas**
- Centraliza en un único sitio (el mismo Sheet del proyecto) todos los datos necesarios para el trámite, evitando depender de WhatsApp, email o papel para recopilarlos.
- El huésped no necesita cuenta de Google ni recordar ningún identificador complejo, solo su nombre y las fechas de su estancia.
- Deja preparado el terreno (datos estructurados y completos) para una futura automatización vía API, si se confirma que es viable.

**Negativas / riesgos**
- Al ser un formulario público sin enlace único, cualquiera podría intentar enviar datos; la validación por nombre + fechas reduce el riesgo de que se mezclen con una reserva real, pero no impide envíos espurios que no encuentren coincidencia (habrá que decidir qué hacer con esos casos: descartarlos, o guardarlos en algún sitio para revisión manual).
- Se van a almacenar fotos de documentos de identidad y datos personales de terceros (los huéspedes), que no son usuarios habituales de la webapp — esto tiene implicaciones de protección de datos (RGPD) que deben revisarse con un profesional: cuánto tiempo se conservan, quién tiene acceso, y si hace falta un aviso de privacidad en el propio formulario. Esta decisión técnica no sustituye esa revisión legal. Este riesgo (formulario público sin autenticación + almacenamiento de fotos de documentos de identidad de terceros) queda registrado como **R-11** en [08_risk_register.md](../discovery/08_risk_register.md).
- La lista de campos propuesta debe verificarse contra la especificación oficial vigente de SES.Hospedajes antes de construir el formulario real, ya que estos requisitos han cambiado varias veces desde 2021 y pueden volver a cambiar.

## Pendiente
- Confirmar la lista exacta y definitiva de campos exigidos por SES.Hospedajes en el momento de implementar.
- Investigar los requisitos reales de acceso a la API de SES.Hospedajes, para decidir si la automatización es viable en una fase futura.
- Definir la política de conservación y acceso a las fotos de documentos de identidad (consulta legal/RGPD pendiente).
- Definir qué hacer con envíos del formulario público que no encuentren ninguna reserva coincidente.
- Esta funcionalidad queda fuera del alcance de la primera versión funcional del proyecto; se construirá en una fase posterior.