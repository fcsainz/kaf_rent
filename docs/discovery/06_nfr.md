# Non-Functional Requirements (NFR) — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** ISO/IEC 25010 — Software Quality Model  

---

## Resumen ejecutivo

Los requisitos no funcionales definen **cómo** debe comportarse el sistema, más allá de las funcionalidades. Se organizan según las características de calidad de la norma ISO 25010.

---

## NFR-01: Eficiencia de Rendimiento

### NFR-01.1 — Tiempo de respuesta de la interfaz

| Requisito | Valor objetivo | Prioridad |
|---|---|---|
| Carga inicial de la webapp (Inicio) | < 3 segundos en conexión estándar | Must |
| Guardado de una nueva reserva (incluye validación de solapamientos) | < 5 segundos | Must |
| Carga del formulario de creación con catálogos | < 2 segundos | Should |
| Envío de email de notificación (proceso en servidor) | < 30 segundos (asíncrono, no bloquea la UI) | Should |
| Carga del historial de cambios de una reserva | < 3 segundos | Should |
| Carga de la sección Estadísticas (lee de `Estadisticas_Cache`, sin recalcular) | < 1 segundo | Should |

### NFR-01.2 — Límites de cuota de Google Apps Script

Google Apps Script impone cuotas de ejecución que condicionan el diseño del sistema:

| Límite | Valor | Impacto en diseño |
|---|---|---|
| Tiempo máximo de ejecución por función | 6 minutos | Ninguna operación puede superar este límite; dividir si es necesario |
| Tiempo total de ejecución diario (cuenta personal) | 90 minutos/día | El volumen de operaciones diarias debe estar muy por debajo de este límite |
| Emails enviados por día (cuenta personal) | 100 emails/día | Suficiente para el volumen esperado; monitorizar si se escala |
| Triggers temporales por script | ~20 triggers | Los triggers diario (estadísticas, 03:00), mensual y trimestral (informes) caben de sobra; su ejecución cuenta dentro del tiempo total diario |
| Llamadas a `CalendarApp` | Sujetas al tiempo total diario | La sincronización con Google Calendar (crear/actualizar/eliminar evento por reserva) añade carga; agrupar y no bloquear el guardado de la reserva (ver ADR-0010) |
| Tamaño máximo de respuesta HTML | 32 MB | No aplica para el volumen de datos de este proyecto |
| Accesos a Spreadsheet por iteración | Sin límite documentado, pero latencia por llamada | Minimizar llamadas individuales; leer en bloque cuando sea posible |

---

## NFR-02: Seguridad

### NFR-02.1 — Autenticación

| Requisito | Descripción | Prioridad |
|---|---|---|
| Autenticación obligatoria | Ningún contenido de la app es accesible sin estar autenticado con Google | Must |
| Sin gestión de contraseñas propias | El sistema delega completamente la autenticación en Google OAuth | Must |
| Sesión vinculada a cuenta Google | La sesión expira cuando expira el token de Google; no se implementa sesión propia | Must |

### NFR-02.2 — Autorización

| Requisito | Descripción | Prioridad |
|---|---|---|
| Lista de acceso autorizada | Solo los emails activos en `Usuarios_Autorizados` pueden acceder | Must |
| Registro de intentos fallidos | Cada intento de acceso de un email no autorizado se registra en la hoja `Logs` | Must |
| Revocación de acceso inmediata | Desactivar a un usuario en `Usuarios_Autorizados` bloquea el acceso sin cambiar código | Must |

### NFR-02.3 — Protección de datos

| Requisito | Descripción | Prioridad |
|---|---|---|
| Acceso a datos solo en sesión autenticada | Los datos de la hoja Google Sheets no son accesibles públicamente | Must |
| Archivos de contrato protegidos | Los archivos subidos a Drive solo son accesibles desde la cuenta del propietario de Drive | Must |
| Sin almacenamiento de credenciales | El sistema no almacena tokens, contraseñas ni datos de sesión | Must |
| RGPD — base legal | Los datos de huéspedes se tratan bajo base legal de gestión contractual (art. 6.1.b RGPD) | Must |
| RGPD — minimización de datos | Solo se recogen los datos estrictamente necesarios para la gestión de la reserva | Must |
| RGPD — retención de datos | Definir política de retención (mínimo 5 años para datos contractuales en España) | Should |

---

## NFR-03: Usabilidad

### NFR-03.1 — Facilidad de uso

| Requisito | Descripción | Prioridad |
|---|---|---|
| Sin formación previa requerida | Los usuarios no técnicos (Ana, Luis) deben poder crear una reserva sin instrucciones adicionales | Must |
| Validación en tiempo real | Los errores de formato (teléfono, email, fechas) se muestran en el momento de introducir el dato | Should |
| Mensajes de error accionables | Cada mensaje de error indica qué falló y cómo corregirlo (no solo "Error") | Must |
| Campos obligatorios claramente marcados | Los campos requeridos están visualmente diferenciados de los opcionales | Must |
| Confirmación antes de acciones destructivas | Las acciones irreversibles (cancelar reserva) requieren confirmación explícita del usuario | Must |

### NFR-03.2 — Compatibilidad de navegador y dispositivo

| Requisito | Descripción | Prioridad |
|---|---|---|
| Compatibilidad con Chrome | El sistema debe funcionar correctamente en Google Chrome (versión actual) | Must |
| Compatibilidad con Firefox y Edge | Deseable compatibilidad con otros navegadores modernos | Could |
| Diseño responsive básico | La interfaz debe ser usable en tablet; soporte móvil completo es deseable pero no crítico en Fase 1 | Could |

---

## NFR-04: Fiabilidad

### NFR-04.1 — Disponibilidad

| Requisito | Descripción | Prioridad |
|---|---|---|
| Disponibilidad de la plataforma | Google Apps Script tiene un SLA de > 99.9% de uptime; el sistema hereda esta disponibilidad | Must (heredado) |
| Sin mantenimiento propio | No se requiere mantenimiento de infraestructura por parte del desarrollador | Must |

### NFR-04.2 — Tolerancia a fallos

| Requisito | Descripción | Prioridad |
|---|---|---|
| Gestión de errores inesperados | Los errores no controlados en GAS se capturan y registran en la hoja `Errores` | Must |
| Sin pérdida de datos en caso de error | Si una operación falla a mitad, los datos no quedan en estado inconsistente | Must |
| Feedback al usuario ante error del sistema | Si una operación falla (ej. al guardar), el usuario recibe un mensaje claro en lugar de un fallo silencioso | Must |
| Integridad de solapamientos | La validación de solapamientos debe ser robusta ante concurrencia (LockService de GAS) | Must |

---

## NFR-05: Mantenibilidad

### NFR-05.1 — Configurabilidad sin código

| Requisito | Descripción | Prioridad |
|---|---|---|
| Catálogos configurables en Sheets | Espacios, canales y servicios se gestionan desde la hoja sin tocar código | Must |
| Parámetros de sistema en Config | Emails de notificación, horas por defecto, mensajes de aviso — todos en la hoja `Config` | Must |
| Lista de usuarios gestionable en Sheets | Añadir o revocar usuarios editando la hoja `Usuarios_Autorizados` | Must |

### NFR-05.2 — Estructura del código

| Requisito | Descripción | Prioridad |
|---|---|---|
| Código versionado y desplegable | El código vive en VS Code/Git y se despliega en GAS por copia/pega manual en el editor (clasp descartado, ver DEVELOPMENT.md) | Must |
| Separación de responsabilidades | Backend (GAS .gs) separado de frontend (HTML/CSS/JS) | Should |
| Funciones con responsabilidad única | Cada función del backend hace una sola cosa; facilita pruebas y cambios | Should |
| Sin dependencias externas de coste | Solo librerías nativas de GAS y Google APIs; sin npm ni servicios de pago | Must |

---

## NFR-06: Portabilidad

| Requisito | Descripción | Prioridad |
|---|---|---|
| Acceso desde cualquier navegador con Google | La app funciona en cualquier dispositivo con acceso a Chrome y cuenta Google | Must |
| Sin instalación requerida | Es una webapp; no requiere instalar software adicional en el dispositivo del usuario | Must |
| Datos en ecosistema Google | Todos los datos residen en Google (Sheets, Drive, Gmail); sin dependencias externas | Must |

---

## NFR-07: Compliance Legal

| Requisito | Normativa | Estado | Prioridad |
|---|---|---|---|
| Protección de datos de huéspedes (nombre, teléfono, email) | RGPD / LOPDGDD | En scope Fase 1 | Must |
| Registro de actividades de tratamiento | RGPD Art. 30 | Pendiente de definición | Should |
| Retención de datos contractuales (5 años mínimo) | Código Civil / Ley de Contratos | Pendiente de política | Should |
| Registro de viajeros (SES.Hospedajes) | Real Decreto 933/2021 | **Diferido a Fase 2** | Must (Fase 2) |
| Accesibilidad web básica (WCAG 2.1 AA) | Directiva UE 2016/2102 | Deseable pero no crítico para uso interno | Could |

---

## Resumen de prioridades NFR

| Categoría | Must | Should | Could |
|---|---|---|---|
| Rendimiento | Tiempos de respuesta, respetar cuotas GAS | Carga de catálogos < 2s | |
| Seguridad | Auth Google, ACL, protección datos, RGPD base legal | Política de retención RGPD | |
| Usabilidad | Sin formación, errores accionables, confirmaciones | Validación en tiempo real | Responsive móvil |
| Fiabilidad | Disponibilidad GAS, gestión errores, integridad datos | | |
| Mantenibilidad | Catálogos en Sheets, Config en Sheets, clasp | Separación front/back | |
| Compliance | RGPD datos huéspedes | Registro actividades tratamiento | WCAG 2.1 |
