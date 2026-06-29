# Risk Register — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
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
| **Mitigación** | Copia de seguridad automática del Sheet cada 2 días a una carpeta de Drive, conservando las últimas 15 (ADR-0013). Historial de versiones de Google Drive (disponible automáticamente). Evitar edición manual directa de la Sheet en producción; usar la app para todas las modificaciones. |
| **Contingencia** | Restaurar desde la última copia de seguridad automática (carpeta `Backups`) o desde el historial de versiones de Google Drive. |
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

### R-11 — Formulario público de registro de viajeros: datos sensibles sin autenticación

| Campo | Valor |
|---|---|
| **Categoría** | Legal / Compliance — Seguridad |
| **Descripción** | El registro de viajeros (ADR-0007, Fase 2) expone un formulario **público sin login** que almacena datos personales de terceros (huéspedes) y **fotos de sus documentos de identidad** en el mismo Google Sheet del proyecto. Al no haber enlace único por reserva, cualquiera puede enviar datos (envíos espurios), y la categoría de datos (documentos de identidad) es más sensible que la del resto del sistema. |
| **Probabilidad** | M — Un formulario público recibe inevitablemente envíos no deseados; el tratamiento de documentos de identidad es intrínseco a la funcionalidad |
| **Impacto** | A — Brecha de datos especialmente protegidos (documentos de identidad) con exposición RGPD elevada, más allá de la del resto de datos de huéspedes (R-03) |
| **Exposición** | **Alta** |
| **Mitigación** | Validar cada envío contra una reserva activa real (nombre + ambas fechas) y descartar/aislar los que no casen. Definir política de conservación y borrado de las fotos de documento. Restringir el acceso a la hoja `Registro_Viajeros` y a la carpeta de Drive de los documentos. Incluir aviso de privacidad en el formulario. Revisión legal/RGPD antes de implementar (consulta profesional). |
| **Contingencia** | Si se detecta acceso indebido o envío masivo espurio, despublicar el deployment público del formulario y revisar/limpiar los datos recibidos. |
| **Estado** | Abierto (funcionalidad diferida a Fase 2) |

---

### R-12 — El trigger diario de estadísticas no se ejecuta

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Plataforma |
| **Descripción** | La sección Estadísticas (ADR-0009) lee de un cache que recalcula un trigger temporal a las 03:00. Si el trigger falla o no se dispara (cuota, error, desactivación accidental), las estadísticas quedan desactualizadas sin que sea evidente. |
| **Probabilidad** | B |
| **Impacto** | B — Solo afecta a la vista de estadísticas (informativa); el resto del sistema funciona |
| **Exposición** | Baja |
| **Mitigación** | Mostrar en la pantalla la marca de tiempo de la última actualización efectiva. Ofrecer un recálculo manual. Capturar y registrar en `Errores` cualquier fallo de la ejecución programada. |
| **Contingencia** | Lanzar el recálculo manualmente desde el editor de Apps Script o desde un botón, hasta restablecer el trigger. |
| **Estado** | Abierto |

---

### R-13 — Cuenta operativa única como punto central

| Campo | Valor |
|---|---|
| **Categoría** | Seguridad / Operativo |
| **Descripción** | Toda la infraestructura (proyecto Apps Script, Sheet, Drive, Calendar, envío de email) reside en una única cuenta de Gmail operativa (`operaciontangai@gmail.com`, ADR-0001). Si esa cuenta se compromete o se pierde el acceso, queda afectado **todo** el sistema y los datos. Al ser una cuenta compartida operativamente, la credencial puede acabar siendo conocida por varias personas. |
| **Probabilidad** | B |
| **Impacto** | A — Compromiso o pérdida = acceso total a datos personales y parada del sistema |
| **Exposición** | Media |
| **Mitigación** | Activar verificación en dos pasos (2FA) en la cuenta operativa y custodiar bien la credencial y los códigos de recuperación. No compartir la contraseña por canales inseguros. Revisar periódicamente la actividad de la cuenta. Mantener copias de seguridad de la Sheet (ver R-08). |
| **Contingencia** | Si se sospecha compromiso, cambiar la contraseña y revisar accesos/permisos de Drive y del despliegue de la Web App. |
| **Estado** | Abierto |

---

### R-14 — Ventana de copia de seguridad limitada (~30 días)

| Campo | Valor |
|---|---|
| **Categoría** | Técnico — Datos |
| **Descripción** | La copia automática del Sheet (ADR-0013) conserva 15 copias con cadencia de 2 días, es decir ~30 días de histórico. Una corrupción o borrado de datos que pase desapercibido más de 30 días no tendría copia de la que restaurar el estado correcto. |
| **Probabilidad** | B |
| **Impacto** | M — Pérdida de datos anteriores a la ventana de copias |
| **Exposición** | Baja |
| **Mitigación** | `Backup_Max_Copias` y `Backup_Cada_Dias` son configurables en `Config`: ampliar el número de copias o la frecuencia si se necesita una ventana mayor. Revisar periódicamente que las copias se están generando. Valorar una exportación periódica fuera de Google (ADR-0013, Pendiente). |
| **Contingencia** | Si se detecta una corrupción fuera de la ventana, recuperar lo posible del historial de versiones de Drive y reconstruir manualmente el resto. |
| **Estado** | Abierto |

---

### R-15 — Borrado de vídeos in/out elimina prueba ante daños

| Campo | Valor |
|---|---|
| **Categoría** | Operativo / Legal |
| **Descripción** | Los vídeos de check-in/check-out (ADR-0014) son la evidencia del estado del espacio antes y después de la estancia. Se borran automáticamente a los 180 días para acotar el almacenamiento; una reclamación de daños posterior a ese plazo se quedaría sin la prueba grabada. |
| **Probabilidad** | B — Las reclamaciones de daños suelen surgir poco después de la estancia |
| **Impacto** | M — Imposibilidad de probar el estado del espacio en una disputa tardía |
| **Exposición** | Baja |
| **Mitigación** | `Retencion_Videos_Dias` es configurable en `Config` (180 por defecto): ampliar el periodo si un caso lo requiere. Conservar manualmente fuera de la carpeta podada los vídeos de una reserva con incidencia abierta. |
| **Contingencia** | Si se prevé una reclamación, mover el vídeo de esa reserva a una carpeta no sujeta a poda antes de que cumpla 180 días. |
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
| R-11 | Form público viajeros + documentos identidad | **Alta** | Abierto (Fase 2) |
| R-12 | Trigger diario de estadísticas no se ejecuta | Baja | Abierto |
| R-13 | Cuenta operativa única (compromiso/pérdida) | **Media** | Abierto |
| R-14 | Ventana de copia de seguridad limitada (~30 días) | Baja | Abierto |
| R-15 | Borrado de vídeos in/out elimina prueba ante daños | Baja | Abierto |
