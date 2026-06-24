# User Stories & Acceptance Criteria — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
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
  Then se muestra la pantalla de Inicio

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

## Epic E-02: Inicio (Hub) y Navegación

> Referencia: [ADR-0008](../solution/0008-reestructuracion-navegacion-tres-secciones.md)

---

### US-004 — Pantalla de Inicio con las últimas 5 reservas

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero que al entrar la app me muestre los tres accesos principales y una tabla con las últimas reservas para orientarme de un vistazo y elegir tarea.

**Criterios de aceptación:**

```gherkin
Scenario: Inicio carga con accesos y últimas reservas
  Given que el usuario está autenticado y autorizado
  When se carga el Inicio
  Then se muestran tres botones: "Crear Reserva", "Gestionar Reserva" y "Estadísticas"
  And debajo, bajo el rótulo "5 Últimas Reservas", una tabla con las 5 reservas más recientes (por Fecha_Registro)
  And la tabla muestra las columnas: Espacio, Fecha Inicio, Fecha Fin, Nombre, Importe Neto

Scenario: Ordenar la tabla de últimas reservas
  Given que el Inicio muestra la tabla de últimas 5 reservas
  When el usuario hace click en la cabecera de una columna
  Then la tabla se reordena por esa columna, alternando ascendente y descendente

Scenario: Sin reservas registradas
  Given que no existe ninguna reserva
  When se carga el Inicio
  Then la tabla muestra el mensaje "No hay reservas registradas"
```

---

### US-005 — Navegar entre las tres secciones

**Prioridad:** M | **Estimación:** XS

Como co-propietario, quiero botones claros de "Crear Reserva", "Gestionar Reserva" y "Estadísticas" para acceder rápidamente a cada tarea.

**Criterios de aceptación:**

```gherkin
Scenario: Navegar a Crear Reserva
  Given que el usuario está en el Inicio
  When hace click en "Crear Reserva"
  Then se muestra la sección Crear Reserva (Buscar Reserva + formulario de creación)

Scenario: Navegar a Gestionar Reserva
  Given que el usuario está en el Inicio
  When hace click en "Gestionar Reserva"
  Then se muestra la lista de reservas activas con sus filtros

Scenario: Navegar a Estadísticas
  Given que el usuario está en el Inicio
  When hace click en "Estadísticas"
  Then se muestra la sección de estadísticas por zona

Scenario: Volver al Inicio desde cualquier sección
  Given que el usuario está en cualquier sección de la app
  When pulsa el botón o enlace de "Volver" / "Cancelar"
  Then regresa al Inicio sin perder los datos guardados
```

---

## Epic E-03: Crear Reserva

> Referencia: [ADR-0003](../solution/0003-formulario-generar-reserva-catalogos.md) | [ADR-0008](../solution/0008-reestructuracion-navegacion-tres-secciones.md)

---

### US-022 — Buscar Reserva por nombre y/o fecha

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero buscar reservas por nombre y/o fecha desde la sección Crear Reserva para comprobar la disponibilidad antes de registrar una nueva.

**Criterios de aceptación:**

```gherkin
Scenario: Búsqueda con resultados
  Given que el usuario está en la subsección "Buscar Reserva"
  When introduce un nombre y/o una fecha y pulsa "Buscar"
  Then se muestran las reservas activas que coinciden por nombre y/o que ocupan la fecha indicada
       (Fecha_Hora_Inicio <= fecha <= Fecha_Hora_Fin)
  And las reservas en estado "Cancelada" no se incluyen

Scenario: Búsqueda con un solo campo
  Given que el usuario rellena solo el nombre o solo la fecha
  When pulsa "Buscar"
  Then la búsqueda se ejecuta con el campo informado (ninguno de los dos es obligatorio)

Scenario: Búsqueda sin resultados
  Given que ninguna reserva activa coincide con los criterios
  When el usuario pulsa "Buscar"
  Then se muestra el mensaje "No hay reservas registradas"
```

---

### US-006 — Seleccionar espacio con filtrado en cascada

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero que al seleccionar un espacio se filtren automáticamente los canales y los servicios extra disponibles para ese espacio, para no tener que elegir entre opciones que no son compatibles.

**Criterios de aceptación:**

```gherkin
Scenario: Carga inicial del formulario
  Given que el usuario abre el formulario de "Crear Reserva"
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

Scenario: Selección de servicios extra con cantidad, coste y precio
  Given que hay servicios extra activos para el espacio seleccionado (cada uno con coste y precio unitarios en Catálogo_Servicios_Extra)
  When el usuario selecciona uno o varios servicios e indica una cantidad (entero ≥ 1) para cada uno
  Then por cada servicio se crea una línea en Reserva_Servicios con su Cantidad y el coste y el precio unitarios vigentes (snapshot)
  And se actualizan los totales de la reserva: Servicios_Precio_Total y Servicios_Coste_Total como suma de (Cantidad × unitario), y Margen_Servicios
  And si no se selecciona ninguno, esos totales quedan a 0 sin error

Scenario: Servicios extra añadidos durante la gestión
  Given que la reserva ya existe y se gestiona desde "Gestionar Reserva"
  When el usuario añade un servicio extra con su cantidad
  Then se crea su línea en Reserva_Servicios con la Cantidad y el snapshot de coste/precio del momento
  And los totales de la reserva se recalculan
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

### US-025 — Email de confirmación de reserva generada

**Prioridad:** S | **Estimación:** S

> Referencia: [ADR-0006](../solution/0006-aviso-cierre-reapertura-canales.md)

Como co-propietario, quiero recibir un email cuando se registra una reserva en el sistema para estar al tanto de la actividad aunque no la haya creado yo.

**Criterios de aceptación:**

```gherkin
Scenario: Email al crear una reserva
  Given que una reserva se guarda correctamente
  When termina el registro
  Then el sistema envía un email a los tres co-propietarios (Config)
  And el email resume: espacio, fechas, canal, huésped e importe de la reserva
```

---

### US-026 — Evento de Google Calendar y calendario de ocupación

**Prioridad:** M | **Estimación:** L

> Referencia: [ADR-0010](../solution/0010-integracion-google-calendar.md)

Como co-propietario, quiero que cada reserva aparezca como evento en un calendario de ocupación para ver de un vistazo qué está ocupado y cuándo.

**Criterios de aceptación:**

```gherkin
Scenario: Crear evento al registrar la reserva
  Given que una reserva se guarda correctamente
  When termina el registro
  Then se crea un evento en el Google Calendar de la cuenta operativa con el espacio, las fechas y el huésped
  And el ID del evento se guarda en Calendar_Event_Id de la reserva

Scenario: Actualizar el evento al editar la reserva
  Given que se editan las fechas, el espacio o el huésped de una reserva
  When se guardan los cambios
  Then el evento de Calendar asociado se actualiza en consecuencia

Scenario: Eliminar el evento al cancelar
  Given que una reserva se cancela
  When se confirma la cancelación
  Then el evento de Calendar asociado se elimina

Scenario: La sincronización no bloquea el guardado
  Given que la llamada a Google Calendar falla
  When se guarda/edita/cancela una reserva
  Then la operación sobre la reserva se completa igualmente
  And el fallo se registra en la hoja Errores para reconciliar después
```

---

## Epic E-04: Gestionar Reserva y Auditoría

> Referencia: [ADR-0004](../solution/0004-ciclo-vida-estado-reserva.md) | [ADR-0005](../solution/0005-pantalla-gestionar-reserva-auditoria.md) | [ADR-0008](../solution/0008-reestructuracion-navegacion-tres-secciones.md) | [ADR-0010](../solution/0010-integracion-google-calendar.md)

---

### US-023 — Lista de reservas activas con filtros

**Prioridad:** M | **Estimación:** M

Como co-propietario, quiero que la sección Gestionar Reserva muestre las reservas que requieren seguimiento y poder filtrarlas, para localizar rápido la que necesito.

**Criterios de aceptación:**

```gherkin
Scenario: Vista estándar de reservas activas
  Given que el usuario entra en "Gestionar Reserva"
  When se carga la lista
  Then se muestran las reservas en estado "Abierta" (todas, aunque su fecha de fin esté vencida)
  And las reservas "Completada" cuya Fecha_Hora_Fin no haya vencido (Fecha_Hora_Fin >= ahora)
  And nunca se muestran las reservas "Cancelada"

Scenario: Filtro rápido por fecha
  Given que el usuario está en la lista de Gestionar Reserva
  When selecciona la opción "Próxima Semana" o "Próximo Mes"
  Then la lista se acota a las reservas cuyas fechas caen en ese rango

Scenario: Búsqueda por nombre
  Given que el usuario está en la lista de Gestionar Reserva
  When escribe un texto en el campo de búsqueda por nombre
  Then la lista se acota a las reservas cuyo Nombre_Huesped coincide con el texto
```

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

Scenario: Reserva pasa a "Completada" con incidencia resuelta
  Given que una reserva tiene Estado_Cobro = "Ingresado"
  And Incidencias = "Con incidentes"
  And Incidencia_Resuelta = "Sí"
  When el usuario guarda los cambios
  Then Estado_Reserva se calcula automáticamente como "Completada"
  And la reserva se completa con independencia de si Compensación_Daños es "Recibida" o "No recibida"

Scenario: Reserva permanece "Abierta" con cobro pendiente
  Given que una reserva tiene Estado_Cobro = "No ingresado"
  When el usuario guarda los cambios
  Then Estado_Reserva permanece como "Abierta"

Scenario: Reserva permanece "Abierta" con incidencia sin resolver
  Given que una reserva tiene Estado_Cobro = "Ingresado"
  And Incidencias = "Con incidentes"
  And Incidencia_Resuelta = "No"
  When el usuario guarda los cambios
  Then Estado_Reserva permanece como "Abierta"

Scenario: El estado calculado se muestra con información de qué falta
  Given que una reserva está en estado "Abierta"
  When el usuario visualiza la reserva en "Gestionar Reserva"
  Then el sistema muestra qué condición falta para llegar a "Completada"
  (ej. "Pendiente de cobro" o "Pendiente de resolver la incidencia")
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

## Epic E-05: Informes y Estadísticas

> Referencia: [ADR-0009](../solution/0009-estadisticas-calculo-cacheado-diario.md)

---

### US-024 — Ver estadísticas por espacio

**Prioridad:** S | **Estimación:** L

Como co-propietario, quiero ver en la sección Estadísticas un resumen anual por espacio para conocer el rendimiento del negocio sin generar nada manualmente.

**Criterios de aceptación:**

```gherkin
Scenario: Tres zonas de estadísticas
  Given que el usuario entra en la sección "Estadísticas"
  When se carga la pantalla
  Then se muestran tres zonas: "Todos los alquileres", "Piscina/Jardín" y "Habitación"
  And cada zona muestra el total de reservas del año natural y los ingresos netos

Scenario: Origen de los datos cacheados
  Given que el usuario visualiza las estadísticas
  Then los valores se leen de Estadisticas_Cache (no se recalculan al vuelo)
  And la pantalla muestra el texto "Las estadísticas se actualizan cada 24 horas" y la fecha de última actualización

Scenario: Recálculo diario automático
  Given que es la hora programada (03:00)
  When se ejecuta el trigger temporal de Apps Script
  Then se recalculan los agregados de las tres zonas (reservas no canceladas con Fecha_Hora_Inicio dentro del año natural)
  And se sobrescriben en Estadisticas_Cache con la marca de tiempo de la actualización
```

---

### US-021 — Informes mensual y trimestral automáticos por email

**Prioridad:** S | **Estimación:** L

Como co-propietario, quiero recibir automáticamente informes **mensuales y trimestrales** por email con el resumen de reservas, ingresos y ocupación por espacio y canal para tener visibilidad del rendimiento sin generarlos manualmente.

**Criterios de aceptación:**

```gherkin
Scenario: Envío automático del informe mensual
  Given que ha finalizado un mes natural
  When se ejecuta el trigger programado mensual de Google Apps Script
  Then el sistema genera un resumen con: número de reservas, importe bruto, comisiones, importe neto y % ocupación por espacio y canal
  And envía el informe por email a los tres co-propietarios (Config)
  And guarda el resumen en la hoja Histórico_Informes

Scenario: Envío automático del informe trimestral
  Given que ha finalizado un trimestre natural
  When se ejecuta el trigger programado trimestral
  Then se genera y envía el informe trimestral a los tres y se archiva en Histórico_Informes

Scenario: Contenido mínimo de cada informe
  Given que un informe (mensual o trimestral) se genera
  Then incluye al menos:
    - Periodo del informe (mes/trimestre y año)
    - Resumen por espacio y canal
    - Totales: reservas, ingresos brutos, comisiones, ingresos netos
    - Reservas completadas vs canceladas
```

---

## Epic E-06: Gestión de Gastos y Reparto (IRPF)

> Referencia: [ADR-0012](../solution/0012-modulo-gastos-irpf.md). **En scope Fase 1.** El marco fiscal y el modelo de datos están definidos; **los detalles fiscales concretos (régimen de la renta, IAE, IVA, amortización y prorrateo) quedan pendientes de validar con un asesor** antes de implementar el cálculo.

---

### US-027 — Registrar gastos del negocio

**Prioridad:** S | **Estimación:** L

Como co-propietario, quiero registrar los gastos del negocio con su justificante para tener centralizado todo lo necesario para desgravar.

**Criterios de aceptación:**

```gherkin
Scenario: Registrar un gasto con justificante
  Given que el usuario está en la pantalla de Gastos
  When introduce fecha, concepto, categoría (de Catálogo_Categorias_Gasto), espacio, importe, quién lo pagó y adjunta el justificante
  Then el gasto se guarda en la hoja Gastos con el enlace al documento en Drive
  And se marca como Deducible según la categoría (editable)
```

---

### US-028 — Resumen fiscal por ejercicio (reparto a tercios)

**Prioridad:** S | **Estimación:** L

Como co-propietario, quiero un resumen anual que reparta ingresos y gastos a partes iguales entre los tres para llevar cada uno su tercio al IRPF, deduciendo todo lo posible dentro de la ley.

**Criterios de aceptación:**

```gherkin
Scenario: Resumen fiscal de un ejercicio
  Given que existen reservas y gastos de un ejercicio
  When el usuario consulta el resumen fiscal de ese año
  Then el sistema agrega por espacio: ingresos íntegros, gastos deducibles por categoría (incluida la amortización) y rendimiento neto
  And muestra el tercio (33,33 %) que corresponde a cada copropietario

Scenario: Amortización deducible disponible
  Given que en Config están los datos de amortización (valor de construcción y proporción alquilada)
  When se calcula el resumen fiscal
  Then se incluye la amortización (≈3 %) como gasto deducible para reducir el rendimiento neto

# Nota: qué gastos son deducibles y en qué proporción lo confirma el gestor (ADR-0012); el sistema solo registra y agrega.
```
