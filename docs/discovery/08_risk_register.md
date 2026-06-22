# Risk Register — KAF App Rent

**Versión:** 0.1-draft  
**Fecha:** 2026-06-22  
**Estado:** Draft — pendiente de revisión  
**Framework:** PMI/PMBOK — Risk Register  

---

## Convenciones

- **Probabilidad:** A = Alta | M = Media | B = Baja
- **Impacto:** A = Alto | M = Medio | B = Bajo
- **Exposición (Prob × Impacto):** AA/AM/MA = Alta | MM/AB/BA = Media | BB = Baja
- **Estado:** Abierto | En mitigación | Cerrado | Aceptado

---

## Registro de Riesgos

### R-01 — Superación de cuotas de Google Apps Script

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Plataforma |
| **Descripción** | Google Apps Script impone límites de ejecución (6 min/función, 90 min/día en cuentas personales, 100 emails/día). Si el volumen de operaciones crece o una función es ineficiente, puede alcanzarse el límite. |
| **Probabilidad** | B |
| **Impacto** | M — La app deja de funcionar durante el resto del día |
| **Exposición** | Baja |
| **Mitigación** | Diseñar funciones eficientes que lean de Sheets en bloque (no fila a fila). Monitorizar el panel de cuotas de GAS. Dividir operaciones largas si es necesario. |
| **Contingencia** | Si se alcanza el límite, los usuarios deben esperar hasta el día siguiente o hasta que se restablezca la cuota. |
| **Estado** | Abierto |

---

### R-02 — Conflicto de escritura concurrente en Google Sheets

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Datos |
| **Descripción** | Si dos usuarios guardan cambios al mismo tiempo sobre la misma reserva o crean dos reservas para el mismo espacio y fechas simultáneamente, puede haber una condición de carrera que eluda la validación de solapamientos. |
| **Probabilidad** | B — Equipo de 3 personas con uso no concurrente habitual |
| **Impacto** | M — Podría crear una reserva doble puntualmente |
| **Exposición** | Baja |
| **Mitigación** | Usar `LockService` de GAS en las operaciones de escritura críticas (guardar reserva, validar solapamientos) para serializar el acceso. |
| **Contingencia** | Si ocurre una reserva doble, cancelar manualmente la duplicada y notificar al huésped afectado. |
| **Estado** | Abierto |

---

### R-03 — Incumplimiento del RGPD por gestión de datos de huéspedes

| Campo | Valor |
|---|---|
| **Categoría** | Legal / Compliance |
| **Descripción** | Los datos personales de huéspedes (nombre, teléfono, email) se almacenan en Google Sheets. Si no se establece correctamente la base legal, los periodos de retención y los derechos de los interesados, puede haber incumplimiento del RGPD/LOPDGDD. |
| **Probabilidad** | M — Es habitual que proyectos internos no formalicen el cumplimiento RGPD |
| **Impacto** | A — Multas de hasta 20M€ o el 4% del volumen de negocio global |
| **Exposición** | Media |
| **Mitigación** | Documentar la base legal de tratamiento (gestión contractual, art. 6.1.b). Definir política de retención (mínimo 5 años). No recoger datos innecesarios. Considerar consultar con asesor legal si el volumen de huéspedes crece. |
| **Contingencia** | Si se recibe una solicitud de derechos RGPD (acceso, supresión), tener capacidad de localizar y eliminar datos de un huésped concreto en la Sheet. |
| **Estado** | Abierto |

---

### R-04 — Archivo de contrato demasiado grande para subir

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Integración |
| **Descripción** | Google Apps Script tiene limitaciones en el tamaño de los datos que puede procesar en memoria durante la subida de archivos. Archivos de contrato muy grandes (fotos de alta resolución) podrían fallar. |
| **Probabilidad** | B |
| **Impacto** | B — Solo afecta al flujo de subida de contrato; el resto de la reserva funciona |
| **Exposición** | Baja |
| **Mitigación** | Validar el tamaño del archivo en el cliente antes de enviarlo al servidor. Definir un límite máximo (ej. 5 MB) y comunicarlo al usuario con un mensaje claro. Documentar el límite en `Config`. |
| **Contingencia** | El usuario reduce el tamaño del archivo (compresión) y vuelve a intentarlo. |
| **Estado** | Abierto |

---

### R-05 — Emails de notificación clasificados como spam

| Campo | Valor |
|---|---|
| **Categoría** | Operativo |
| **Descripción** | Los emails enviados automáticamente por GAS (notificaciones de canal, informes) podrían caer en la carpeta de spam de los destinatarios y no verse. |
| **Probabilidad** | M — Los emails automáticos desde GAS tienen historial de acabar en spam |
| **Impacto** | B — El usuario no recibe el aviso, pero puede consultarlo en la app |
| **Exposición** | Baja |
| **Mitigación** | Pedir a los usuarios que añadan la dirección remitente a sus contactos o marquen el primer email como "No es spam". Usar asuntos descriptivos y consistentes. |
| **Contingencia** | El usuario revisa la carpeta de spam periódicamente hasta confirmar que los emails llegan a la bandeja de entrada. |
| **Estado** | Abierto |

---

### R-06 — Único desarrollador: single point of failure

| Campo | Valor |
|---|---|
| **Categoría** | Negocio / Operativo |
| **Descripción** | El co-propietario desarrollador es el único responsable técnico del sistema. Si no está disponible (enfermedad, viaje, salida del proyecto), nadie más puede mantener, reparar o actualizar la app. |
| **Probabilidad** | A — Es estructuralmente inevitable con un equipo de un solo técnico |
| **Impacto** | A — Un fallo sin el desarrollador disponible podría dejar la app inoperativa indefinidamente |
| **Exposición** | Alta |
| **Mitigación** | Documentar exhaustivamente el código y los ADRs. Mantener la arquitectura simple y legible. Documentar el proceso de despliegue (clasp) paso a paso. Mantener los documentos de discovery actualizados. Considerar a largo plazo formar a un segundo técnico o usar un servicio gestionado. |
| **Contingencia** | Si el desarrollador no está disponible, los usuarios continúan usando Google Sheets directamente como solución de emergencia hasta que se restaure la app. |
| **Estado** | Aceptado (riesgo conocido e inherente al modelo) |

---

### R-07 — Google depreca funcionalidades de Apps Script

| Campo | Valor |
|---|---|
| **Categoría** | Plataforma — Estratégico |
| **Descripción** | Google podría modificar, limitar o deprecar funcionalidades de GAS o HTML Service en el futuro, requiriendo migración a otra plataforma. |
| **Probabilidad** | B — GAS tiene soporte activo y es parte del ecosistema Google Workspace |
| **Impacto** | A — Requeriría reconstruir la app en otra plataforma |
| **Exposición** | Media |
| **Mitigación** | Mantener el código modular y sin dependencias propietarias más allá de GAS. Monitorizar los anuncios del Google Workspace blog. Los datos en Google Sheets son exportables independientemente de la app. |
| **Contingencia** | Si GAS es deprecado, evaluar migración a Firebase + Google Cloud Functions o similar. Los datos en Sheets migran fácilmente. |
| **Estado** | Abierto |

---

### R-08 — Pérdida o corrupción de datos en Google Sheets

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Datos |
| **Descripción** | Un error en el código, una edición manual accidental o un problema de Google podría corromper o eliminar datos de la hoja de Sheets. |
| **Probabilidad** | B |
| **Impacto** | A — Pérdida irreversible de datos de reservas, historial y configuración |
| **Exposición** | Media |
| **Mitigación** | Activar el historial de versiones de Google Drive en la hoja (disponible automáticamente). Realizar copias periódicas manuales de la Sheet (.xlsx) en una carpeta separada de Drive. Evitar edición manual directa de la Sheet en producción; usar la app para todas las modificaciones. |
| **Contingencia** | Restaurar desde el historial de versiones de Google Drive (disponible hasta 30 días en cuentas personales) o desde la última copia manual. |
| **Estado** | Abierto |

---

### R-09 — Compromiso de una cuenta Google autorizada

| Campo | Valor |
|---|---|
| **Categoría** | Seguridad |
| **Descripción** | Si una de las tres cuentas Google autorizadas es comprometida (phishing, password leak), un atacante podría acceder a todos los datos de reservas y huéspedes. |
| **Probabilidad** | B |
| **Impacto** | A — Acceso no autorizado a datos personales de huéspedes (impacto RGPD) |
| **Exposición** | Media |
| **Mitigación** | Recomendar a todos los usuarios activar la verificación en dos pasos (2FA) en su cuenta Google. La lista `Usuarios_Autorizados` permite revocar el acceso inmediatamente si se detecta compromiso. Registrar en `Logs` todos los accesos para detectar anomalías. |
| **Contingencia** | Si se sospecha compromiso, desactivar el usuario en `Usuarios_Autorizados` inmediatamente y revocar el acceso a la hoja de Sheets desde Drive. |
| **Estado** | Abierto |

---

### R-10 — Baja adopción por parte de los usuarios no técnicos

| Campo | Valor |
|---|---|
| **Categoría** | Negocio / Operativo |
| **Descripción** | Los usuarios no técnicos (Ana y Luis) podrían resistirse a adoptar el sistema y continuar gestionando reservas por métodos anteriores, vaciando de valor la herramienta. |
| **Probabilidad** | M — Es un riesgo habitual en herramientas internas para usuarios no técnicos |
| **Impacto** | M — El sistema existe pero los datos son incompletos; la validación de solapamientos pierde efectividad |
| **Exposición** | Media |
| **Mitigación** | Involucrar a los usuarios en la revisión de cada documento de discovery y en las sesiones de UAT. No añadir complejidad innecesaria. Hacer el flujo principal (crear reserva) lo más simple posible. Recoger feedback temprano y actuar sobre él. |
| **Contingencia** | Identificar los puntos de fricción específicos y simplificar el flujo. Considerar tutoriales o guías de uso integradas si es necesario. |
| **Estado** | Abierto |

---

## Resumen de exposición

| ID | Riesgo | Exposición | Estado |
|---|---|---|---|
| R-01 | Cuotas GAS | Baja | Abierto |
| R-02 | Concurrencia en Sheets | Baja | Abierto |
| R-03 | RGPD datos huéspedes | **Media** | Abierto |
| R-04 | Tamaño archivos contrato | Baja | Abierto |
| R-05 | Spam emails notificación | Baja | Abierto |
| R-06 | Único desarrollador | **Alta** | Aceptado |
| R-07 | Deprecación GAS | **Media** | Abierto |
| R-08 | Pérdida datos Sheets | **Media** | Abierto |
| R-09 | Compromiso cuenta Google | **Media** | Abierto |
| R-10 | Baja adopción usuarios | **Media** | Abierto |
