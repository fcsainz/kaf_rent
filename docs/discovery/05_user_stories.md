# User Stories & Acceptance Criteria — KAF App Rent

**Versión:** 0.1-draft  
**Fecha:** 2026-06-22  
**Estado:** Draft — pendiente de revisión  
**Framework:** INVEST + BDD/Gherkin (Given/When/Then)  

---

## Convenciones

- **Formato de historia:** `Como [persona], quiero [acción] para [beneficio]`
- **Criterios de aceptación:** formato Gherkin (`Given / When / Then`)
- **Prioridad MoSCoW:** M = Must, S = Should, C = Could, W = Won't (Fase 1)
- **Estimación:** Talla de camiseta — XS / S / M / L / XL
- **Referencia ADR:** documento de solución que define el comportamiento

---

## Epic E-01: Autenticación y Control de Acceso

> Referencia: [ADR-0001](../solution/0001-autenticacion-google-cuentas-autorizadas.md)

---

### US-001 — Login con Google

**Prioridad:** M | **Estimación:** S

Como co-propietario, quiero acceder a la aplicación con mi cuenta Google para no tener que gestionar una contraseña adicional.

**Criterios de aceptación:**

```gherkin
Scenario: Acceso a la aplicación sin sesión activa
  Given que el usuario abre la URL de la webapp sin estar autenticado
  When la página carga
  Then el sistema solicita autenticación con Google antes de mostrar cualquier contenido

Scenario: Login exitoso
  Given que el usuario no tiene sesión activa
  When completa el flujo de login de Google correctamente
  Then el sistema recupera el email de la cuenta autenticada y lo usa en los pasos siguientes
```

---

### US-002 — Verificación de acceso por lista autorizada

**Prioridad:** M | **Estimación:** S

Como administrador, quiero que solo los correos registrados en `Usuarios_Autorizados` puedan usar la aplicación para que ninguna cuenta externa acceda a los datos de reservas.

**Criterios de aceptación:**

```gherkin
Scenario: Usuario autorizado accede correctamente
  Given que el usuario ha completado el login con Google
  And su email figura como activo en la hoja Usuarios_Autorizados
  When el sistema verifica el acceso
  Then se muestra el Dashboard principal

Scenario: Usuario no autorizado es rechazado
  Given que el usuario ha completado el login con Google
  And su email NO figura en Usuarios_Autorizados (o está inactivo)
  When el sistema verifica el acceso
  Then se muestra la pantalla de "Acceso denegado" con mensaje claro
  And el intento queda registrado en la hoja Logs con email, fecha y hora
```

---

### US-003 — Identificación automática del usuario activo

**Prioridad:** M | **Estimación:** XS

Como sistema, quiero registrar automáticamente el email del usuario autenticado en los campos `Registrado_Por` y `Modificado_Por` para no depender de que el usuario lo introduzca manualmente.

**Criterios de aceptación:**

```gherkin
Scenario: Campo Registrado_Por al crear reserva
  Given que el usuario está autenticado y crea una nueva reserva
  When la reserva se guarda
  Then el campo Registrado_Por contiene el email de la sesión activa
  And ese campo no es editable por el usuario

Scenario: Campo Modificado_Por al editar reserva
  Given que el usuario está autenticado y edita una reserva existente
  When guarda los cambios
  Then el campo Modificado_Por se actualiza al email de la sesión activa
  And Fecha_Última_Modificación se actualiza a la fecha/hora del guardado
```

---

## Epic E-02: Dashboard Principal

> Referencia: [ADR-0002](../solution/0002-estructura-interfaz-principal.md)

---

### US-004 — Ver tabla de reservas por espacio

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero ver en el dashboard una tabla por cada espacio (Piscina/Jardín y Habitación Interior) con las reservas activas para tener visibilidad inmediata al abrir la app.

**Criterios de aceptación:**

```gherkin
Scenario: Dashboard carga con datos actualizados
  Given que el usuario está autenticado y autorizado
  When se carga el Dashboard
  Then se muestran dos tablas: una para Piscina/Jardín y otra para Habitación Interior
  And cada tabla muestra las reservas en estado "Abierta" con sus datos principales
  And las reservas "Cancelada" o "Completada" no aparecen en el dashboard (o están filtradas/diferenciadas visualmente)

Scenario: Sin reservas activas
  Given que no hay reservas activas para un espacio
  When se carga el Dashboard
  Then la tabla de ese espacio muestra un mensaje de "Sin reservas activas"
```

---

### US-005 — Navegar a las acciones principales

**Prioridad:** M | **Estimación:** XS

Como co-propietario, quiero tener botones claros de "Generar Reserva" y "Gestionar Reserva" en el dashboard para acceder rápidamente a las acciones más frecuentes.

**Criterios de aceptación:**

```gherkin
Scenario: Navegar al formulario de creación
  Given que el usuario está en el Dashboard
  When hace click en "Generar Reserva"
  Then se muestra el formulario de creación de reservas

Scenario: Navegar a gestión de reserva
  Given que el usuario está en el Dashboard
  When hace click en "Gestionar Reserva"
  Then se muestra la pantalla de búsqueda/selección de reserva

Scenario: Volver al Dashboard desde cualquier pantalla
  Given que el usuario está en cualquier pantalla de la app
  When pulsa el botón o enlace de "Volver" / "Cancelar"
  Then regresa al Dashboard sin perder los datos guardados
```

---

## Epic E-03: Crear Reserva

> Referencia: [ADR-0003](../solution/0003-formulario-generar-reserva-catalogos.md)

---

### US-006 — Seleccionar espacio con filtrado en cascada

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero que al seleccionar un espacio se filtren automáticamente los canales y los servicios extra disponibles para ese espacio, para no tener que elegir entre opciones que no son compatibles.

**Criterios de aceptación:**

```gherkin
Scenario: Carga inicial del formulario
  Given que el usuario abre el formulario de "Generar Reserva"
  When el formulario carga
  Then el dropdown de Espacio muestra solo los espacios marcados como activos en Catálogo_Espacios
  And los campos de Canal, Servicios y Fecha están deshabilitados o vacíos hasta seleccionar espacio

Scenario: Selección de espacio filtra canal y servicios
  Given que el usuario selecciona un espacio del dropdown
  When el espacio es seleccionado
  Then el dropdown de Canal muestra solo los canales activos para ese espacio (de Catálogo_Canales)
  And los checkboxes de Servicios Extra muestran solo los servicios activos para ese espacio (de Catálogo_Servicios_Extra)
  And el modo de fecha se adapta al Modo_Fecha del espacio seleccionado

Scenario: Cambiar espacio resetea campos dependientes
  Given que el usuario ha seleccionado un espacio y rellenado canal, fechas y servicios
  When cambia el espacio seleccionado
  Then se resetean los campos de Canal, Servicios y Fecha para evitar datos inconsistentes
```

---

### US-007 — Seleccionar canal y autocomplete de comisión

**Prioridad:** M | **Estimación:** S

Como co-propietario, quiero que al seleccionar un canal se rellene automáticamente el porcentaje de comisión por defecto para ahorrar tiempo y reducir errores de entrada.

**Criterios de aceptación:**

```gherkin
Scenario: Selección de canal autocompleta comisión
  Given que el usuario ha seleccionado un espacio y despliega el selector de canal
  When selecciona un canal de la lista
  Then el campo %_Comisión se rellena con el valor de Catálogo_Canales para ese canal
  And el campo %_Comisión permanece editable por si el usuario necesita ajustarlo

Scenario: Canal con gestión de contrato automática
  Given que el usuario selecciona un canal con Gestión_Contrato = "Automática"
  When la reserva se guarda
  Then el campo Contrato_Estado se inicializa a "Gestionado por canal"

Scenario: Canal con gestión de contrato manual
  Given que el usuario selecciona un canal con Gestión_Contrato = "Manual"
  When la reserva se guarda
  Then el campo Contrato_Estado se inicializa a "Pendiente"
```

---

### US-008 — Introducir fechas en modo Día + Hora (Piscina/Jardín)

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero poder introducir la fecha de la reserva y los horarios de entrada y salida para el espacio de Piscina/Jardín para reflejar el modo de alquiler por franjas horarias.

**Criterios de aceptación:**

```gherkin
Scenario: Mostrar campos de fecha en modo Día+Hora
  Given que el usuario ha seleccionado el espacio "Piscina/Jardín" (Modo_Fecha = "Dia_y_Hora")
  When el formulario se actualiza
  Then se muestran tres campos: "Fecha", "Hora de llegada" y "Hora de salida"
  And el campo "Fecha" permite seleccionar con date picker o escribir en formato DD/MM/AAAA
  And no se pueden seleccionar fechas pasadas

Scenario: Validación de hora de salida posterior a llegada
  Given que el usuario introduce una hora de llegada
  When introduce una hora de salida anterior o igual a la de llegada
  Then se muestra un error: "La hora de salida debe ser posterior a la de llegada"
  And el formulario no puede enviarse hasta corregirlo
```

---

### US-009 — Introducir fechas en modo Rango de Días (Habitación Interior)

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero poder introducir fechas de check-in y check-out para la Habitación Interior para reflejar el modo de alquiler por estancias de múltiples días.

**Criterios de aceptación:**

```gherkin
Scenario: Mostrar campos de fecha en modo Rango_Días
  Given que el usuario ha seleccionado el espacio "Habitación Interior" (Modo_Fecha = "Rango_Dias")
  When el formulario se actualiza
  Then se muestran dos campos: "Fecha de entrada" y "Fecha de salida"
  And ambos permiten date picker o entrada manual en formato DD/MM/AAAA
  And no se pueden seleccionar fechas pasadas

Scenario: Validación de fecha de salida posterior a entrada
  Given que el usuario introduce una fecha de entrada
  When introduce una fecha de salida igual o anterior a la de entrada
  Then se muestra un error: "La fecha de salida debe ser posterior a la de entrada"
  And el formulario no puede enviarse hasta corregirlo

Scenario: Construcción automática de timestamp
  Given que el usuario introduce una fecha de entrada y una fecha de salida
  When la reserva se guarda
  Then Fecha_Hora_Inicio = Fecha_Entrada + hora de check-in por defecto (de Config)
  And Fecha_Hora_Fin = Fecha_Salida + hora de check-out por defecto (de Config)
```

---

### US-010 — Introducir datos de personas y servicios

**Prioridad:** M | **Estimación:** S

Como co-propietario, quiero indicar el número de adultos y menores y los servicios extra seleccionados para completar la información de la reserva.

**Criterios de aceptación:**

```gherkin
Scenario: Número de adultos obligatorio y ≥ 1
  Given que el usuario está en el formulario de creación
  When intenta guardar con el campo Adultos vacío o con valor 0
  Then se muestra un error: "Debe haber al menos 1 adulto"

Scenario: Número de menores opcional
  Given que el usuario deja el campo Menores vacío
  When guarda la reserva
  Then el campo Menores se guarda como 0 sin error

Scenario: Selección de servicios extra opcionales
  Given que hay servicios extra activos para el espacio seleccionado
  When el usuario marca uno o varios checkboxes
  Then esos servicios se guardan en el campo Servicios_Extra de la reserva
  And si no se selecciona ninguno, el campo queda vacío sin error
```

---

### US-011 — Introducir datos de contacto del huésped

**Prioridad:** M | **Estimación:** S

Como co-propietario, quiero registrar el nombre, teléfono y email del huésped para poder identificarlo y contactarle si es necesario.

**Criterios de aceptación:**

```gherkin
Scenario: Nombre del huésped obligatorio
  Given que el usuario está en el formulario de creación
  When intenta guardar sin introducir el nombre del huésped
  Then se muestra un error: "El nombre del huésped es obligatorio"

Scenario: Teléfono con validación de formato (opcional)
  Given que el usuario introduce un teléfono
  When el valor no sigue el formato de 9 dígitos sin prefijo internacional
  Then se muestra un error de validación de formato
  And si el campo está vacío, no se muestra error (es opcional)

Scenario: Email con validación de formato (opcional)
  Given que el usuario introduce un email
  When el valor no contiene "@" o tiene formato incorrecto
  Then se muestra un error de validación de formato
  And si el campo está vacío, no se muestra error (es opcional)
```

---

### US-012 — Validación de solapamiento de reservas

**Prioridad:** M | **Estimación:** L

Como co-propietario, quiero que el sistema me impida crear una reserva si el espacio ya está ocupado en esas fechas para eliminar el riesgo de reservas dobles.

**Criterios de aceptación:**

```gherkin
Scenario: Crear reserva sin solapamiento
  Given que el usuario rellena el formulario con un espacio y fechas disponibles
  When hace click en "Guardar"
  Then el sistema verifica que no existe ninguna reserva activa (estado != "Cancelada") 
       para el mismo espacio con fechas solapadas
  And si no hay solapamiento, la reserva se crea correctamente

Scenario: Crear reserva con solapamiento — bloqueo duro
  Given que ya existe una reserva activa para el mismo espacio en las mismas fechas
  When el usuario intenta guardar una nueva reserva para ese espacio y fechas
  Then el sistema rechaza el guardado
  And muestra el mensaje de error configurado en la hoja Config (campo de aviso de solapamiento)
  And la nueva reserva NO se crea

Scenario: Reservas canceladas no bloquean
  Given que existe una reserva en estado "Cancelada" para el mismo espacio y fechas
  When el usuario intenta crear una nueva reserva para ese espacio y fechas
  Then la reserva cancelada no cuenta como solapamiento
  And la nueva reserva se crea si no hay otros bloqueos
```

---

### US-013 — Guardar reserva con estado inicial automático

**Prioridad:** M | **Estimación:** S

Como sistema, quiero inicializar automáticamente los campos de estado al crear una reserva para garantizar consistencia sin depender del usuario.

**Criterios de aceptación:**

```gherkin
Scenario: Estado inicial al guardar nueva reserva
  Given que el usuario ha completado correctamente el formulario y no hay solapamiento
  When hace click en "Guardar"
  Then la reserva se crea con:
    | Campo                    | Valor inicial                                       |
    | Estado_Reserva           | "Abierta"                                           |
    | Estado_Cobro             | "No ingresado"                                      |
    | Incidencias              | "Sin incidentes"                                    |
    | Contrato_Estado          | "Gestionado por canal" o "Pendiente" según el canal |
    | Registrado_Por           | email del usuario autenticado                       |
    | Fecha_Registro           | fecha y hora actuales                               |
  And se genera un ID_Reserva único e inmutable
```

---

### US-014 — Notificación de cierre de canales al crear reserva

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero recibir un email automático indicando qué canales debo cerrar cuando registro una nueva reserva, para no olvidar bloquear la disponibilidad manualmente.

**Criterios de aceptación:**

```gherkin
Scenario: Notificación enviada con múltiples canales activos
  Given que el espacio de la nueva reserva tiene 2 o más canales activos en Catálogo_Canales
  When la reserva se guarda correctamente
  Then el sistema envía un email automático a los destinatarios configurados en Config
  And el email indica: espacio, fechas bloqueadas, canal desde el que se registró la reserva
  And el email lista los canales que se deben cerrar manualmente (todos los activos excepto el de la reserva)

Scenario: Sin notificación con un solo canal activo
  Given que el espacio de la nueva reserva tiene solo 1 canal activo
  When la reserva se guarda
  Then no se envía email de cierre de canales (no hay nada que sincronizar)
```

---

## Epic E-04: Gestionar Reserva y Auditoría

> Referencia: [ADR-0004](../solution/0004-ciclo-vida-estado-reserva.md) | [ADR-0005](../solution/0005-pantalla-gestionar-reserva-auditoria.md)

---

### US-015 — Editar campos de una reserva existente

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero poder editar cualquier campo de una reserva existente (excepto los inmutables) para corregir errores o actualizar información.

**Criterios de aceptación:**

```gherkin
Scenario: Campos editables en gestión de reserva
  Given que el usuario abre una reserva existente en "Gestionar Reserva"
  When visualiza el formulario
  Then todos los campos son editables excepto: ID_Reserva, Registrado_Por, Fecha_Registro
  And el campo Estado_Reserva no es editable directamente (es calculado)

Scenario: Guardar cambios registra auditoría
  Given que el usuario ha modificado uno o más campos de la reserva
  When hace click en "Guardar"
  Then por cada campo modificado se crea una fila en Historial_Cambios con:
    | Campo            | Valor                     |
    | Fecha_Hora       | timestamp del guardado    |
    | Usuario          | email del usuario activo  |
    | ID_Reserva       | ID de la reserva editada  |
    | Campo            | nombre del campo cambiado |
    | Valor_Anterior   | valor antes del cambio    |
    | Valor_Nuevo      | valor después del cambio  |
  And los campos Modificado_Por y Fecha_Última_Modificación se actualizan automáticamente
```

---

### US-016 — Ciclo de vida automático del estado de reserva

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero que el estado de la reserva se calcule automáticamente según el cobro, el contrato y las incidencias para no tener que gestionarlo manualmente y evitar inconsistencias.

**Criterios de aceptación:**

```gherkin
Scenario: Reserva pasa a "Completada" sin incidencias
  Given que una reserva tiene Estado_Cobro = "Ingresado"
  And Incidencias = "Sin incidentes"
  When el usuario guarda los cambios
  Then Estado_Reserva se calcula automáticamente como "Completada"

Scenario: Reserva pasa a "Completada" con incidencias compensadas
  Given que una reserva tiene Estado_Cobro = "Ingresado"
  And Incidencias = "Con incidentes"
  And Compensación_Daños = "Recibida"
  When el usuario guarda los cambios
  Then Estado_Reserva se calcula automáticamente como "Completada"

Scenario: Reserva permanece "Abierta" con cobro pendiente
  Given que una reserva tiene Estado_Cobro = "No ingresado"
  When el usuario guarda los cambios
  Then Estado_Reserva permanece como "Abierta"

Scenario: Reserva permanece "Abierta" con incidencia sin compensar
  Given que una reserva tiene Estado_Cobro = "Ingresado"
  And Incidencias = "Con incidentes"
  And Compensación_Daños = "No recibida"
  When el usuario guarda los cambios
  Then Estado_Reserva permanece como "Abierta"

Scenario: El estado calculado se muestra con información de qué falta
  Given que una reserva está en estado "Abierta"
  When el usuario visualiza la reserva en "Gestionar Reserva"
  Then el sistema muestra qué condición falta para llegar a "Completada"
  (ej. "Pendiente de cobro" o "Pendiente de compensación por daños")
```

---

### US-017 — Subir contrato a Google Drive

**Prioridad:** M | **Estimación:** L

Como co-propietario, quiero poder subir el contrato firmado (PDF, JPG o PNG) desde la pantalla de gestión de la reserva para tenerlo vinculado a la reserva y almacenado en Drive.

**Criterios de aceptación:**

```gherkin
Scenario: Subida de contrato válida
  Given que el usuario está en "Gestionar Reserva" y la reserva tiene Contrato_Estado = "Pendiente"
  When selecciona un archivo en formato JPG, PNG o PDF y lo sube
  Then el archivo se almacena en Google Drive en la carpeta correspondiente
  And el campo Contrato_Archivo se actualiza con la URL del archivo en Drive
  And el campo Contrato_Estado cambia automáticamente a "Firmado"
  And este cambio queda registrado en Historial_Cambios

Scenario: Tipo de archivo no permitido
  Given que el usuario intenta subir un archivo en formato no permitido (ej. .docx, .xlsx)
  When selecciona el archivo
  Then el sistema rechaza el archivo con mensaje: "Solo se permiten archivos JPG, PNG o PDF"
  And el contrato no se sube ni se modifica el estado

Scenario: Contratos gestionados por canal no requieren subida
  Given que la reserva tiene Contrato_Estado = "Gestionado por canal"
  When el usuario visualiza la reserva
  Then el campo de subida de contrato está deshabilitado o no visible para ese caso
```

---

### US-018 — Cancelar una reserva

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero poder cancelar una reserva con confirmación explícita para evitar cancelaciones accidentales y que el sistema avise de que los canales deben reabrirse.

**Criterios de aceptación:**

```gherkin
Scenario: Proceso de cancelación con confirmación
  Given que el usuario está en "Gestionar Reserva" con una reserva en estado "Abierta"
  When hace click en "Cancelar Reserva"
  Then aparece un modal de confirmación: "¿Confirmas la cancelación de esta reserva? Esta acción no se puede deshacer."
  And el usuario debe confirmar explícitamente

Scenario: Cancelación confirmada
  Given que el usuario ha confirmado la cancelación
  When el sistema procesa la cancelación
  Then Estado_Reserva cambia a "Cancelada"
  And el cambio queda registrado en Historial_Cambios (campo, valor anterior "Abierta", valor nuevo "Cancelada")
  And si el espacio tiene 2+ canales activos, se envía email automático de reapertura de canales

Scenario: Cancelación abortada
  Given que aparece el modal de confirmación de cancelación
  When el usuario hace click en "No, volver"
  Then el modal se cierra y la reserva no se modifica
```

---

### US-019 — Ver historial de cambios de una reserva

**Prioridad:** S | **Estimación:** S

Como co-propietario, quiero ver el historial completo de cambios de una reserva para saber quién modificó qué y cuándo.

**Criterios de aceptación:**

```gherkin
Scenario: Ver historial en la pantalla de gestión
  Given que el usuario abre una reserva que ha tenido modificaciones
  When navega a la sección "Historial de cambios" dentro de la pantalla de gestión
  Then se muestra una tabla con las filas de Historial_Cambios para esa reserva
  And cada fila muestra: Fecha/Hora, Usuario, Campo, Valor Anterior, Valor Nuevo
  And las filas están ordenadas de más reciente a más antigua

Scenario: Reserva sin cambios
  Given que una reserva nunca ha sido modificada desde su creación
  When el usuario consulta el historial
  Then se muestra el mensaje: "Sin cambios registrados"
```

---

### US-020 — Notificación de reapertura de canales al cancelar

**Prioridad:** M | **Estimación:** S

> Referencia: [ADR-0006](../solution/0006-aviso-cierre-reapertura-canales.md)

Como co-propietario, quiero recibir un email automático cuando cancelo una reserva indicando qué canales debo reabrir para no perder oportunidades de alquiler.

**Criterios de aceptación:**

```gherkin
Scenario: Email de reapertura al cancelar con múltiples canales
  Given que una reserva en un espacio con 2+ canales activos es cancelada
  When la cancelación se confirma
  Then el sistema envía un email a los destinatarios configurados en Config
  And el email indica: espacio, fechas liberadas, canal desde el que se canceló
  And el email lista los canales que se deben reabrir manualmente

Scenario: Sin notificación si solo hay un canal
  Given que el espacio de la reserva cancelada tiene solo 1 canal activo
  When la cancelación se confirma
  Then no se envía email de reapertura
```

---

## Epic E-05: Informes y Reportes

---

### US-021 — Informe trimestral automático por email

**Prioridad:** S | **Estimación:** L

Como co-propietario, quiero recibir automáticamente un informe trimestral por email con el resumen de reservas, ingresos y ocupación por espacio y canal para tener visibilidad del rendimiento sin tener que generarlo manualmente.

**Criterios de aceptación:**

```gherkin
Scenario: Envío automático del informe trimestral
  Given que ha finalizado un trimestre natural
  When se ejecuta el trigger programado de Google Apps Script
  Then el sistema genera un resumen con: número de reservas, importe bruto, comisiones, importe neto y % ocupación por espacio y canal
  And envía el informe por email a los destinatarios configurados en Config
  And guarda el resumen en la hoja Histórico_Informes

Scenario: Contenido mínimo del informe
  Given que el informe trimestral se genera
  Then incluye al menos:
    - Periodo del informe (trimestre y año)
    - Resumen por espacio y canal
    - Totales: reservas, ingresos brutos, comisiones, ingresos netos
    - Reservas completadas vs canceladas
```
