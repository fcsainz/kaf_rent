# Historias de usuario (HU) — KAF Rent

**Versión:** 1.0  
**Fecha:** 2026-09-25  
**Estado:** Vigente  
**Framework:** INVEST + BDD/Gherkin (Given/When/Then) + MoSCoW + User Story Mapping (Jeff Patton)  
**Sustituye a:** `04_story_map.md` y `05_user_stories.md` (v0.5)

---

## Convenciones

- **ID:** `HU-NN`, numeradas siguiendo el flujo de uso (*backbone* del story map). La columna **Antes** conserva el ID antiguo `US-0NN` para no perder el histórico (CHANGELOG y commits anteriores).
- **Formato:** `Como [persona], quiero [acción] para [beneficio]`.
- **Criterios de aceptación:** Gherkin (Given / When / Then). Cada escenario es candidato directo a un test (unitario, de integración o E2E, ver [CLAUDE.md §7](../../CLAUDE.md)).
- **Prioridad MoSCoW:** M = Must · S = Should · C = Could · W = Won't (en esta fase).
- **Estimación:** talla de camiseta — XS (≤1 h) · S (≈2 h) · M (4–6 h) · L (1–2 días) · XL (dividir).
- **Estado:** ✅ Implementada · 🟡 Parcial (hay un hueco concreto, anotado) · 🔍 Por verificar (implementada en principio, sin comprobar contra el criterio) · ⏳ Pendiente.
- **Trazabilidad en línea** (segunda línea de cada HU): **↑ Problema** y **↑ JTBD** hacia arriba ([01_problema.md](01_problema.md)); **↓ RF** ([03](03_requisitos_funcionales.md)), **↓ RNF** (la unión de los RNF de sus RF, [04](04_requisitos_no_funcionales.md)) y **↓ Sprint** en que se implementó → sprint pendiente, en **negrita** ([PROXIMOS_PASOS.md](../../docs_work/PROXIMOS_PASOS.md)) hacia abajo. Las ADR se enlazan desde los RF.

## Backbone (actividades del usuario)

```
[E-01 ACCEDER] → [E-02 INICIO] → [E-03 CREAR RESERVA] → [E-04 AVISOS Y CALENDARIO] → [E-05 GESTIONAR RESERVA]
      → [E-06 DOCUMENTOS Y EVIDENCIAS] → [E-07 ESTADÍSTICAS E INFORMES] → [E-08 GASTOS E IRPF] → [E-09 REGISTRO DE VIAJEROS (Fase 2)]
```

## Resumen

| HU | Antes | Título | Épica | ↑ Problema | MoSCoW | Talla | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| HU-01 | US-001 | Acceder con la cuenta de Google | E-01 | P-12 | M | S | S1 | ✅ |
| HU-02 | US-002 | Acceso solo para cuentas autorizadas | E-01 | P-12 | M | S | S1 | ✅ |
| HU-03 | US-003 | Identificación automática del autor de cada cambio | E-01 | P-03 | M | XS | S1 | ✅ |
| HU-04 | US-004 | Inicio con accesos y reservas de un vistazo (próximas o últimas) | E-02 | P-05 | M | M | S2 · **S23** (F-26) · **S31** (F-32) | 🔍 |
| HU-05 | US-005 | Navegar entre secciones | E-02 | P-11 | M | XS | S1–S2 · **S23** (F-24, F-25) · **S31–S32** (F-31, F-33) | 🔍 |
| HU-06 | US-022 | Buscar reservas por nombre y/o fecha | E-02 | P-01, P-05 | M | M | S2 → S8 ✔ | ✅ |
| HU-07 | US-026 (parte) | Abrir el calendario de ocupación desde el Inicio | E-02 | P-05 | M | XS | S4 · **S31** (B-27, D-44) | 🔍 |
| HU-08 | US-006 | Elegir espacio con filtrado en cascada | E-03 | P-11 | M | M | S2 | ✅ |
| HU-09 | US-007 | Elegir canal con comisión autocompletada | E-03 | P-11 | M | S | S2 | ✅ |
| HU-10 | US-008 | Fechas en modo Día + Hora | E-03 | P-11 | M | M | S3 · **S22** (F-23) | ✅ |
| HU-11 | US-009 | Fechas en modo Rango de días | E-03 | P-11 | M | M | S3 · **S22** (B-22, F-23, D-28) | 🟡 |
| HU-12 | US-010 | Personas y servicios extra | E-03 | P-11, P-08 | M | S | S2 | ✅ |
| HU-13 | US-011 | Datos de contacto del huésped | E-03 | P-11 | M | S | S2 | ✅ |
| HU-14 | *(nueva)* | Importe del alquiler y resumen económico | E-03 | P-08, P-11 | M | M | S2 | ✅ |
| HU-15 | US-012 | Bloqueo de solapamientos | E-03 | P-01 | M | L | S3 | ✅ |
| HU-16 | US-013 | Guardar con estado inicial e ID de reserva | E-03 | P-04 | M | S | S3 · **S14** (B-15) | ✅ |
| HU-17 | US-014 | Aviso de cierre de canales | E-04 | P-02 | M | M | S3 | ✅ |
| HU-18 | US-025 | Email de confirmación de reserva | E-04 | P-05 | S | S | S3 | ✅ |
| HU-19 | US-026 | Evento de ocupación en Google Calendar | E-04 | P-05 | M | L | S4 → S8 ✔ · **S14** (B-14, F-13) · **S22** (B-14 reabierto) · **S13** | 🟡 |
| HU-20 | US-020 | Aviso de reapertura de canales | E-04 | P-06 | M | S | S4 | ✅ |
| HU-21 | US-023 | Lista de reservas con filtros, en tarjetas y paginada | E-05 | P-04, P-05 | M | M | S4 · **S32** (F-34–F-36) | 🔍 |
| HU-22 | *(nueva)* | Ficha de la reserva en pantalla propia | E-05 | P-04, P-07 | S | S | S4 · **S32** (F-42) | 🔍 |
| HU-23 | US-015 | Editar una reserva con auditoría | E-05 | P-03, P-04 | M | M | S4 → S8 ✔ · **S32** (F-44) | 🔍 |
| HU-24 | US-010 (parte) | Añadir o quitar servicios a una reserva existente | E-05 | P-08 | S | M | S4 → S8 ✔ · **S32** (F-44) | 🔍 |
| HU-25 | US-016 | Ciclo de vida automático del estado | E-05 | P-04 | M | M | S4 → S8 ✔ | ✅ |
| HU-26 | US-018 | Cancelar una reserva | E-05 | P-06 | M | M | S4 · **S27** (ADR-0022) | ✅ |
| HU-27 | US-019 | Ver el historial de cambios | E-05 | P-03 | S | S | S4 | ✅ |
| HU-28 | US-017 | Firmar el contrato de Exterior con fotos en Drive | E-06 | P-07 | M | L | S4 → S8 ✔ · **S33** (F-41) | 🔍 |
| HU-29 | US-029 | Checklists digitales de check-in/check-out (F-14) | E-06 | P-07 | S | L | S4 → **S16** · **S22** (B-18, B-19, TD-02) | ✅ |
| HU-30 | US-030 | Subir vídeos de entrada/salida a Drive | E-06 | P-07 | S | M | S4 → S8 ✔ | ✅ |
| HU-31 | US-024 | Estadísticas por espacio y canal con su ocupación | E-07 | P-08 | S | L | S5 · **S36** | 🔍 |
| HU-32 | US-021 | Informes mensual y trimestral por email | E-07 | P-08 | S | L | S5 → **S36** | 🟡 |
| HU-33 | US-027 | Registrar gastos con justificante | E-08 | P-09 | S | L | S6 | ✅ |
| HU-34 | US-028 | Resumen fiscal por ejercicio a tercios | E-08 | P-09 | S | L | S6 | ✅ |
| HU-35 | *(ADR-0007, ADR-0018)* | Comunicar los viajeros de la Habitación a SES.Hospedajes | E-09 | P-10 | W (Fase 2) | XL | **S26**–S29 | 🟡 |
| HU-36 | *(ADR-0007)* | Estado del registro de viajeros en la reserva | E-09 | P-10 | W (Fase 2) | M | **S27**–**S28** | 🟡 |
| HU-37 | *(backlog)* | Recordatorio automático del cobro pendiente | E-05 | P-04 | S | M | **S34** (F-37) | 🔍 |
| HU-38 | *(ADR-0005)* | Editar canal y fechas de una reserva (sin cambiar de espacio) | E-05 | P-01, P-04 | C | L | **S13** | ⏳ |
| HU-39 | *(v2, F-21)* | Avisos que no pasan desapercibidos y envío de incidencias al administrador | E-04 | P-05, P-11 | M | M | **S14** | ✅ |
| HU-40 | *(v2, F-22)* | Código de reserva del canal (obligatorio en Airbnb) | E-03 | P-11 | M | S | 2026-09-27 | ✅ |
| HU-41 | *(DD-03, F-38/F-39/F-41)* | Tareas de la reserva desde la barra de Reservas (checklist, identidades, contrato) | E-05 | P-04, P-07 | M | L | **S33** | 🔍 |
| HU-42 | *(DD-03, F-43)* | Cobro de los servicios extra (plataforma o presencial) | E-05 | P-08 | S | M | **S33** | 🔍 |
| HU-43 | *(DD-03, F-40)* | Aviso de check-in y check-out sin hacer | E-04 | P-04, P-07 | S | M | **S34** | 🔍 |
| HU-44 | *(DD-04, F-48)* | Cerrar días de un espacio | E-07 | P-08 | S | M | **S36** | 🔍 |

---

## E-01 — Acceder

### HU-01 — Acceder con la cuenta de Google
**Antes:** US-001 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-12 · **↑ JTBD:** JTBD-12 · **↓ RF:** RF-01 · **↓ RNF:** RNF-19, RNF-31 · **↓ Sprint:** S1

Como copropietario, quiero entrar con mi cuenta de Google para no gestionar otra contraseña.

```gherkin
Scenario: Acceso sin sesión de Google
  Given que el usuario abre la URL de la webapp sin sesión de Google
  When la página carga
  Then Google le pide iniciar sesión antes de mostrar ningún contenido

Scenario: Acceso con sesión de Google
  Given que el usuario ha iniciado sesión en Google
  When abre la webapp
  Then el sistema obtiene el email de la cuenta y lo usa para verificar el acceso
```

### HU-02 — Acceso solo para cuentas autorizadas
**Antes:** US-002 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-12 · **↑ JTBD:** JTBD-12 · **↓ RF:** RF-02, RF-03, RF-04, RF-05 · **↓ RNF:** RNF-09, RNF-19, RNF-20, RNF-21, RNF-22 · **↓ Sprint:** S1

Como administrador, quiero que solo las cuentas activas de `Usuarios_Autorizados` usen la aplicación para que nadie externo vea los datos.

```gherkin
Scenario: Usuario autorizado
  Given que el email de la sesión figura como activo en Usuarios_Autorizados
  When se carga la webapp
  Then se muestra el Inicio
  And el acceso queda registrado en Logs

Scenario: Usuario no autorizado, inactivo o sin email
  Given que el email no figura, está inactivo o no se puede obtener
  When se carga la webapp
  Then se muestra la pantalla "Acceso denegado" con un mensaje claro
  And el intento queda registrado en Logs con fecha, email y motivo

Scenario: Llamadas al servidor sin autorización
  Given una sesión no autorizada
  When invoca cualquier función del servidor
  Then recibe { success: false } y no obtiene ni modifica datos
```

### HU-03 — Identificación automática del autor de cada cambio
**Antes:** US-003 · **MoSCoW:** M · **Talla:** XS · **Estado:** ✅  
**↑ Problema:** P-03 · **↑ JTBD:** JTBD-03 · **↓ RF:** RF-06 · **↓ RNF:** RNF-22 · **↓ Sprint:** S1

Como copropietario, quiero que el sistema anote solo quién crea o modifica cada reserva para no depender de que alguien lo escriba.

```gherkin
Scenario: Alta de reserva
  Given un usuario autorizado
  When guarda una reserva nueva
  Then Registrado_Por = email de la sesión y Fecha_Registro = ahora
  And ninguno de los dos es editable

Scenario: Modificación de reserva
  Given un usuario autorizado que edita una reserva
  When guarda los cambios
  Then Modificado_Por = email de la sesión y Fecha_Última_Modificación = ahora
```

---

## E-02 — Inicio y navegación

### HU-04 — Inicio con accesos y reservas de un vistazo (próximas o últimas)
**Antes:** US-004 · **MoSCoW:** M · **Talla:** M · **Estado:** 🔍 (F-32 implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-05 · **↑ JTBD:** JTBD-05 · **↓ RF:** RF-07, RF-08, RF-09, RF-10 · **↓ RNF:** RNF-01, RNF-05, RNF-08, RNF-09, RNF-11 · **↓ Sprint:** S2 · **S23** (F-26) · **S31** (F-32)

> **DD-03 (2026-10-03, F-32):** la sección se llama **"Reservas de un vistazo"** y un selector cambia entre las **5 próximas** por fecha de entrada (por defecto; incluye la que está en curso, sin canceladas) y las **5 últimas registradas**. Se muestran en **tarjetas** sin scroll lateral, ordenables con "Ordenar por", que abren la ficha al tocarlas (DI-22).

```gherkin
Scenario: Próximas o últimas registradas (F-32)
  Given hay reservas futuras y pasadas
  When abro el Inicio
  Then veo las 5 siguientes por fecha de entrada, sin canceladas
  When elijo "5 últimas registradas"
  Then veo las 5 últimas que se registraron
```

Como copropietario, quiero que al entrar la app me muestre los accesos principales y las últimas reservas para orientarme de un vistazo.

```gherkin
Scenario: Carga del Inicio
  Given un usuario autorizado
  When se carga el Inicio
  Then ve la barra inferior con "Inicio", "Reservas", "Gastos" y "Estadísticas" (y "Checklists" si tiene permiso)
  And bajo "5 Últimas Reservas" una tabla con las 5 más recientes por Fecha_Registro
  And las columnas Espacio (nombre corto: Interior / Exterior), Código de reserva del canal ("—" si no hay), Nombre, Inicio y Fin (dd/mm/aa hh:mm) e Importe Neto
  And un botón "Ver calendario"

Scenario: Ordenar la tabla
  When pulsa la cabecera de una columna
  Then la tabla se ordena por esa columna, alternando ascendente y descendente

Scenario: Sin reservas
  Given que no existe ninguna reserva
  Then la tabla muestra "Todavía no hay reservas."
```

### HU-05 — Navegar entre secciones
**Antes:** US-005 · **MoSCoW:** M · **Talla:** XS · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-07, RF-13 · **↓ RNF:** RNF-08, RNF-11, RNF-12 · **↓ Sprint:** S1–S2 · **S23** (F-24, F-25) · **S31–S32** (F-31, F-33)

> **DD-03 (2026-10-03):** **Admin** (icono de persona, solo rol Admin) abre un segundo piso con *Checklists* y *Conexión SES* (F-31). Al entrar en Gestionar Reservas, la barra general se cambia por la **barra de Reservas**: ← Inicio · Checklist · Identidades · Contrato · Extras (F-33).

```gherkin
Scenario: Menú Admin (F-31)
  Given soy Admin
  When pulso "Admin"
  Then aparece un segundo piso con "Checklists" y "Conexión SES"
  And quien no es Admin no ve el botón

Scenario: Barra de Reservas (F-33)
  When entro en Gestionar Reservas
  Then la barra muestra "Inicio", "Checklist", "Identidades", "Contrato" y "Extras"
  When pulso "Inicio"
  Then vuelvo al Inicio con la barra general
```

Como copropietario, quiero botones claros para ir a cada sección y volver al Inicio para no perderme.

```gherkin
Scenario Outline: Ir a una sección desde la barra inferior (F-25)
  Given que el usuario está en cualquier sección
  When pulsa "<boton>" en la barra inferior
  Then se muestra la sección <seccion> y su botón queda marcado
  Examples:
    | boton        | seccion                                  |
    | Inicio       | Inicio                                   |
    | Gastos       | registro de gastos y resumen fiscal      |
    | Estadísticas | estadísticas por zona                    |

Scenario: Segundo piso de Reservas (F-25)
  When pulsa "Reservas"
  Then aparece encima de la barra un segundo piso con "Gestionar Reservas" y "Crear Reservas"
  And al ir a otra sección de la barra, el segundo piso se cierra

Scenario: Cabecera (F-24)
  Then arriba ve el icono de la app y "KAF Rent" a la izquierda, y su usuario a la derecha

Scenario: Volver al Inicio
  Given que el usuario está en cualquier sección
  When pulsa "Volver"
  Then regresa al Inicio sin perder lo ya guardado
```

### HU-06 — Buscar reservas por nombre y/o fecha
**Antes:** US-022 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-01, P-05 · **↑ JTBD:** JTBD-01, JTBD-05 · **↓ RF:** RF-10, RF-11 · **↓ RNF:** RNF-01, RNF-05, RNF-09, RNF-11 · **↓ Sprint:** S2 → S8 ✔ · **S31** (DI-22)

> **DI-22 (2026-10-03):** los resultados se muestran en tarjetas (sin scroll lateral en el móvil) que abren la ficha al tocarlas.

Como copropietario, quiero buscar reservas por nombre y/o fecha desde el Inicio para comprobar la disponibilidad antes de registrar una nueva.

> Ubicación revisada en implementación (ADR-0008): el buscador está en el **Inicio**, no en Crear Reserva.  
> ✔ **Corregido en v2 (S8, B-02):** la búsqueda ya excluye las canceladas.

```gherkin
Scenario: Búsqueda con resultados
  When introduce un nombre y/o una fecha y pulsa "Buscar"
  Then ve las reservas cuyo nombre contiene el texto (sin distinguir mayúsculas)
  And/o que ocupan ese día (Fecha_Hora_Inicio < fin del día y Fecha_Hora_Fin > inicio del día)
  And las reservas "Cancelada" no aparecen

Scenario: Un solo campo
  When rellena solo el nombre o solo la fecha
  Then la búsqueda se hace con ese campo (ninguno es obligatorio)

Scenario: Sin resultados
  Then se muestra "Ninguna reserva coincide con ese nombre o fecha."
```

### HU-07 — Abrir el calendario de ocupación desde el Inicio
**Antes:** US-026 (parte) · **MoSCoW:** M · **Talla:** XS · **Estado:** ✅  
**↑ Problema:** P-05 · **↑ JTBD:** JTBD-05 · **↓ RF:** RF-12 · **↓ RNF:** *sin RNF directo* · **↓ Sprint:** S4 · **S31** (B-27, D-44)

> **D-44 (2026-10-03):** en Android "Ver calendario" abre la app de Google Calendar (se vuelve a KAF Rent con Atrás); en el resto, otra pestaña.

Como copropietario, quiero un enlace al calendario de ocupación desde el Inicio para ver de un vistazo qué días están ocupados.

```gherkin
Scenario: Enlace configurado
  Given que Config.Calendar_Url tiene valor
  When pulsa "Calendario de ocupación"
  Then se abre el Google Calendar de la cuenta operativa (enlazado, no embebido)
```

---

## E-03 — Crear reserva

### HU-08 — Elegir espacio con filtrado en cascada
**Antes:** US-006 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-14, RF-15, RF-16, RF-28 · **↓ RNF:** RNF-03, RNF-08, RNF-24, RNF-27 · **↓ Sprint:** S2

Como copropietario, quiero que al elegir el espacio solo se ofrezcan sus canales y servicios para no elegir opciones incompatibles.

```gherkin
Scenario: Carga del formulario
  When se abre "Crear Reserva"
  Then el desplegable Espacio solo muestra los espacios activos de Catálogo_Espacios
  And canal, servicios y fechas están deshabilitados hasta elegir espacio

Scenario: Elegir espacio
  When elige un espacio
  Then Canal muestra solo los canales activos de ese espacio
  And Servicios Extra muestra solo sus servicios activos
  And los campos de fecha se adaptan a su Modo_Fecha

Scenario: Cambiar de espacio
  Given canal, fechas y servicios ya rellenos
  When cambia el espacio
  Then se vacían canal, servicios y fechas
```

### HU-09 — Elegir canal con comisión autocompletada
**Antes:** US-007 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-17, RF-18, RF-28 · **↓ RNF:** RNF-24, RNF-27 · **↓ Sprint:** S2

Como copropietario, quiero que al elegir el canal se rellene su comisión por defecto para ahorrar tiempo y errores.

```gherkin
Scenario: Autocompletar comisión
  When elige un canal
  Then %_Comisión toma el valor de Catálogo_Canales y sigue siendo editable (0–100)

Scenario Outline: Estado inicial del contrato según el canal
  Given un canal con Gestión_Contrato = "<gestion>"
  When la reserva se guarda
  Then Contrato_Estado = "<estado>"
  Examples:
    | gestion    | estado               |
    | Automática | Gestionado por canal |
    | Manual     | Pendiente            |
```

### HU-10 — Fechas en modo Día + Hora
**Antes:** US-008 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-16, RF-19, RF-21, RF-28 · **↓ RNF:** RNF-08, RNF-24, RNF-27 · **↓ Sprint:** S3 · **S22** (F-23)

Como copropietario, quiero indicar el día y las horas de llegada y salida en Piscina/Jardín para reflejar el alquiler por franjas.

```gherkin
Scenario: Campos del modo Dia_y_Hora
  Given un espacio con Modo_Fecha = "Dia_y_Hora"
  Then se muestran "Fecha", "Hora de llegada" y "Hora de salida", todas obligatorias
  And no se pueden elegir fechas pasadas

Scenario: Salida anterior a la llegada
  When la hora de salida es igual o anterior a la de llegada
  Then se muestra "La fecha/hora de salida debe ser posterior a la de entrada"
  And no se puede guardar
```

### HU-11 — Fechas en modo Rango de días
**Antes:** US-009 · **MoSCoW:** M · **Talla:** M · **Estado:** 🟡 (B-22 corregido en código; falta corregir las reservas guardadas en real, D-28, y el smoke)  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-16, RF-20, RF-21, RF-28 · **↓ RNF:** RNF-08, RNF-24, RNF-27 · **↓ Sprint:** S3 · **S22**

Como copropietario, quiero indicar las fechas de entrada y salida en la Habitación para reflejar las estancias de varias noches.

```gherkin
Scenario: Campos del modo Rango_Dias
  Given un espacio con Modo_Fecha = "Rango_Dias"
  Then se muestran "Fecha de entrada" y "Fecha de salida", sin fechas pasadas
  And "Hora de llegada" y "Hora de salida", obligatorias

Scenario: Salida no posterior a la entrada
  When la salida es igual o anterior a la entrada
  Then se muestra un error y no se puede guardar

Scenario: Horas prerrellenas y editables (F-23, ADR-0019)
  When se elige el espacio
  Then "Hora de llegada" = Config.Hora_CheckIn_Default y "Hora de salida" = Config.Hora_CheckOut_Default
  And se pueden cambiar

Scenario: Horas guardadas
  When la reserva se guarda
  Then Fecha_Hora_Inicio = entrada + hora de llegada
  And Fecha_Hora_Fin = salida + hora de salida
```

### HU-12 — Personas y servicios extra
**Antes:** US-010 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-11, P-08 · **↑ JTBD:** JTBD-11, JTBD-08 · **↓ RF:** RF-22, RF-23, RF-28 · **↓ RNF:** RNF-05, RNF-24 · **↓ Sprint:** S2

Como copropietario, quiero indicar adultos, menores y servicios extra con su cantidad para completar la reserva y conocer su margen.

```gherkin
Scenario: Adultos obligatorios
  When intenta guardar con Adultos vacío o 0
  Then ve "Debe haber al menos 1 adulto"

Scenario: Menores opcionales
  When deja Menores vacío
  Then se guarda 0 sin error

Scenario: Servicios con cantidad y snapshot
  When elige servicios activos del espacio con cantidad entera ≥ 1
  Then se crea una línea por servicio en Reserva_Servicios con Cantidad y coste/precio unitarios vigentes del catálogo
  And Servicios_Precio_Total, Servicios_Coste_Total y Margen_Servicios se calculan en el servidor
  And sin servicios, esos totales quedan a 0
```

### HU-13 — Datos de contacto del huésped
**Antes:** US-011 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-24, RF-28 · **↓ RNF:** RNF-24, RNF-34 · **↓ Sprint:** S2

Como copropietario, quiero registrar nombre, teléfono y email del huésped para identificarle y contactarle.

```gherkin
Scenario: Nombre obligatorio
  When guarda sin nombre
  Then ve "El nombre del huésped es obligatorio"

Scenario: Teléfono opcional con formato
  When introduce un teléfono que no son exactamente 9 cifras
  Then ve un error de formato; vacío no da error

Scenario: Email opcional con formato
  When introduce un email sin formato usuario@dominio.algo
  Then ve un error de formato; vacío no da error
```

### HU-14 — Importe del alquiler y resumen económico
**Antes:** *(nueva: faltaba en v0.5; el campo se añadió a ADR-0003 en el Sprint 2)* · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-08, P-11 · **↑ JTBD:** JTBD-08, JTBD-11 · **↓ RF:** RF-25, RF-26, RF-27, RF-28 · **↓ RNF:** RNF-09, RNF-24 · **↓ Sprint:** S2

Como copropietario, quiero introducir el importe del alquiler y ver al momento el bruto, la comisión y el neto para saber lo que realmente gano con la reserva.

```gherkin
Scenario: Importe obligatorio
  When el importe del alquiler está vacío o es negativo
  Then no se puede guardar y se indica el motivo

Scenario: Resumen en vivo
  Given importe, comisión y servicios informados
  Then se muestran Importe bruto, Comisión, Coste fijo del canal (si lo hay) e Importe neto
  And bruto = alquiler + Σ(cantidad × precio); comisión = bruto × % / 100
  And neto = bruto − comisión − Σ(cantidad × coste) − coste fijo del canal

Scenario: Cálculo autoritativo en el servidor
  When la reserva se guarda
  Then el servidor recalcula todos los importes con los precios del catálogo, ignorando los del cliente
```

### HU-15 — Bloqueo de solapamientos
**Antes:** US-012 · **MoSCoW:** M · **Talla:** L · **Estado:** ✅  
**↑ Problema:** P-01 · **↑ JTBD:** JTBD-01 · **↓ RF:** RF-28, RF-29, RF-30 · **↓ RNF:** RNF-02, RNF-15, RNF-24, RNF-27 · **↓ Sprint:** S3

Como copropietario, quiero que el sistema me impida crear una reserva si el espacio ya está ocupado para eliminar las reservas dobles.

```gherkin
Scenario: Sin solapamiento
  Given que no hay otra reserva no cancelada del mismo espacio cuyo rango se cruce
  When guarda
  Then la reserva se crea

Scenario: Con solapamiento (bloqueo duro)
  Given una reserva no cancelada del mismo espacio con rango que se cruza
  When intenta guardar
  Then se rechaza con el mensaje de Config.Mensaje_Solapamiento y no se crea nada

Scenario: Límites que se tocan
  Given una reserva que termina justo cuando empieza la nueva
  Then no cuenta como solapamiento

Scenario: Canceladas no bloquean
  Given una reserva "Cancelada" en las mismas fechas
  Then no cuenta como solapamiento

Scenario: Guardados simultáneos
  Given dos usuarios que guardan a la vez la misma franja
  Then solo una de las dos reservas se crea
```

### HU-16 — Guardar con estado inicial e ID de reserva
**Antes:** US-013 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-04 · **↑ JTBD:** JTBD-04 · **↓ RF:** RF-18, RF-31, RF-32, RF-33 · **↓ RNF:** RNF-07, RNF-09, RNF-27 · **↓ Sprint:** S3 · **S14** (B-15: año de creación)

Como copropietario, quiero que la reserva se cree con su estado inicial y una referencia correlativa para no rellenarlos a mano.

```gherkin
Scenario: Estado inicial
  When se guarda una reserva válida
  Then Estado_Reserva = "Abierta", Estado_Cobro = "No ingresado", Incidencias = "Sin incidentes"
  And Checkin_Revisado = Checkout_Revisado = "Pendiente"
  And Contrato_Estado según el canal (HU-09)
  And Registro_Viajeros_Estado = "Pendiente" solo si el espacio es de modo Rango_Dias

Scenario: Referencia correlativa anual
  Given que la última reserva del año 2026 es 2026-004
  When se guarda otra reserva de 2026
  Then ID_Reserva = "2026-005" y el usuario ve la referencia "05/26"

Scenario: Feedback
  Then el botón Guardar se deshabilita durante el guardado
  And se muestra un aviso de éxito con la referencia y el formulario se reinicia
```

---

### HU-40 — Código de reserva del canal
**Antes:** *(nueva, 2026-09-27)* · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-11 · **↑ JTBD:** JTBD-11 · **↓ RF:** RF-88 · **↓ RNF:** RNF-24, RNF-27 · **↓ Sprint:** sin sprint (petición directa, 2026-09-27)

Como copropietario, quiero anotar en la reserva el código que le da la plataforma (p. ej. el de Airbnb) para encontrarla allí y cuadrar cobros sin buscar por nombre y fechas.

```gherkin
Scenario: Canal que exige el código
  Given el canal tiene Requiere_Ref_Canal = "Sí" en Catálogo_Canales (hoy: Airbnb)
  When guarda la reserva sin código
  Then ve "El código de reserva de Airbnb es obligatorio" y no se guarda nada

Scenario: Resto de canales
  When guarda sin código en un canal que no lo exige
  Then se guarda sin error

Scenario: Editar el código
  When cambia el código en Gestionar
  Then se guarda y queda en el historial de cambios
  And no puede dejarlo vacío si el canal lo exige y ya tenía uno (las reservas anteriores sin código se siguen editando)
```

## E-04 — Avisos y calendario

### HU-17 — Aviso de cierre de canales
**Antes:** US-014 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-02 · **↑ JTBD:** JTBD-02 · **↓ RF:** RF-34, RF-37 · **↓ RNF:** RNF-05, RNF-13, RNF-16 · **↓ Sprint:** S3

Como copropietario, quiero un email que me diga qué canales cerrar al registrar una reserva para no olvidar bloquear la disponibilidad.

```gherkin
Scenario: Espacio con varios canales activos
  Given que el espacio tiene otros canales activos además del de la reserva
  When la reserva se guarda
  Then se envía un email a Config.Emails_Notificacion con espacio, franja, canal de origen y lista de canales a cerrar

Scenario: Un solo canal activo
  Then no se envía aviso de cierre

Scenario: Fallo del email
  When el envío falla
  Then la reserva se guarda igualmente y el fallo queda en Errores
```

### HU-18 — Email de confirmación de reserva
**Antes:** US-025 · **MoSCoW:** S · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-05 · **↑ JTBD:** JTBD-05 · **↓ RF:** RF-35, RF-37 · **↓ RNF:** RNF-05, RNF-13, RNF-16 · **↓ Sprint:** S3

Como copropietario, quiero recibir un email cada vez que se registra una reserva para estar al tanto aunque no la haya creado yo.

```gherkin
Scenario: Confirmación
  When una reserva se guarda
  Then los tres reciben un email con referencia, espacio, canal, fechas, huésped, personas, importe bruto e importe neto
```

### HU-19 — Evento de ocupación en Google Calendar
**Antes:** US-026 · **MoSCoW:** M · **Talla:** L · **Estado:** 🟡  
**↑ Problema:** P-05 · **↑ JTBD:** JTBD-05 · **↓ RF:** RF-36, RF-37, RF-38, RF-40, RF-41, RF-82, RF-83, RF-84 · **↓ RNF:** RNF-09, RNF-13, RNF-16, RNF-34 · **↓ Sprint:** S4 → S8 ✔ · **S14** (B-14, F-13) · **S22** (B-14 reabierto) · **S13**

Como copropietario, quiero que cada reserva aparezca en un calendario de ocupación para ver de un vistazo qué está ocupado.

> 🟡 **Hueco:** actualizar el evento al cambiar fechas o espacio depende de HU-38. *(El cambio de nombre ya se refleja desde v2, B-09.)*

```gherkin
Scenario: Crear evento
  When una reserva se guarda
  Then se crea un evento "NN/AA · Espacio — Huésped" en el calendario Config.Calendar_Id (o el de por defecto), con el color del espacio
  And su ID se guarda en Calendar_Event_Id
  And los usuarios autorizados activos reciben la invitación de Calendar (F-13)

Scenario: Actualizar evento
  When se editan el huésped, las fechas o el espacio de la reserva
  Then el evento se actualiza

Scenario: Eliminar evento
  When la reserva se cancela
  Then su evento se elimina

Scenario: Calendar falla
  When la llamada a Calendar falla
  Then la reserva se guarda o cancela igualmente, Calendar_Event_Id queda vacío y el fallo va a Errores
  And al crearla, el usuario ve un aviso que debe cerrar (HU-39)
```

### HU-20 — Aviso de reapertura de canales
**Antes:** US-020 · **MoSCoW:** M · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-06 · **↑ JTBD:** JTBD-06 · **↓ RF:** RF-37, RF-39 · **↓ RNF:** RNF-05, RNF-13, RNF-16 · **↓ Sprint:** S4

Como copropietario, quiero un email al cancelar que me diga qué canales reabrir para no perder oportunidades de alquiler.

```gherkin
Scenario: Cancelación en espacio con varios canales
  When se confirma la cancelación
  Then se envía un email con espacio, franja liberada, canal de origen y canales a reabrir

Scenario: Un solo canal
  Then no se envía aviso de reapertura
```

### HU-39 — Avisos que no pasan desapercibidos y envío de incidencias al administrador
**Antes:** — (v2, F-21) · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-05, P-11 · **↑ JTBD:** JTBD-05, JTBD-11 · **↓ RF:** RF-81, RF-82, RF-84 · **↓ RNF:** RNF-09, RNF-12, RNF-16, RNF-20, RNF-34 · **↓ Sprint:** **S14**

Como copropietario, quiero que los errores y avisos de la app me obliguen a leerlos y que pueda mandar al administrador el detalle técnico con un botón, para que ningún fallo pase desapercibido ni dependa de que yo sepa explicarlo.

```gherkin
Scenario: Éxito
  When una operación termina bien
  Then se muestra un mensaje centrado que se cierra solo

Scenario: Error o aviso
  When una operación falla o termina con un aviso
  Then se abre una ventana con el mensaje que solo se cierra al pulsar "Entendido" o Escape

Scenario: Reserva guardada sin evento de Calendar
  Given Calendar falla al crear el evento
  When la reserva se guarda
  Then la ventana de aviso ofrece "Enviar al administrador"

Scenario: Enviar la incidencia
  Given hay cuentas activas con Rol "Admin"
  When pulsa "Enviar al administrador"
  Then las cuentas Admin reciben un email con los errores registrados de esa reserva (fecha, función, mensaje y pila técnica), sin datos del huésped
  And el usuario ve "Incidencia enviada al administrador."

Scenario: Sin administrador configurado
  Given no hay ninguna cuenta activa con Rol "Admin"
  When pulsa "Enviar al administrador"
  Then ve un error que le indica avisar a un copropietario y no se envía nada
```

---

## E-05 — Gestionar reserva

### HU-21 — Lista de reservas con filtros, en tarjetas y paginada
**Antes:** US-023 · **MoSCoW:** M · **Talla:** M · **Estado:** 🔍 (DD-03 implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-04, P-05 · **↑ JTBD:** JTBD-04, JTBD-05 · **↓ RF:** RF-42, RF-43 · **↓ RNF:** RNF-05, RNF-08, RNF-11, RNF-24 · **↓ Sprint:** S4 · **S32** (F-34, F-35, F-36)

> **DD-03 (2026-10-03):** filtros Nombre, Espacio (Interior/Exterior), Estado (sin canceladas por defecto · Abierta · Cerrada · Cancelada) y Cobro (Ingresada/No ingresada), más *Próxima semana* y *Próximo mes*; todos actúan al momento (sin botón *Filtrar*). Cada reserva es una **tarjeta** sin scroll lateral (ID · Nombre, Espacio y fechas, Estado y Cobro) que se toca para abrirla; **5 por página**. Orden: primero las que no han terminado, de la más cercana a la más lejana; después las pasadas, de la más reciente a la más antigua (Q-16).

```gherkin
Scenario: Filtros al momento y canceladas aparte (F-34)
  When cambio cualquier filtro
  Then la lista se actualiza sin pulsar ningún botón
  And las canceladas solo aparecen al elegir Estado = "Cancelada"

Scenario: Tarjetas paginadas (F-36)
  Given hay 7 reservas que cumplen los filtros
  Then veo 5 tarjetas y "Página 1 de 2", sin desplazarme en horizontal en el móvil
```

Como copropietario, quiero ver las reservas que siguen siendo modificables y filtrarlas para encontrar rápido la que busco.

> Revisado en implementación (ADR-0008, 2026-06-29): se muestran **todas las no canceladas** (Abiertas y Completadas, sin importar la fecha).

```gherkin
Scenario: Vista estándar
  When entra en "Gestionar Reserva"
  Then ve todas las reservas no canceladas
  And las columnas Estado (badge), ID, Canal, Entrada, Salida, Personas, Check-in, Check-out, Nombre, Ingreso (badge) y los botones "Ver más" y "Modificar"

Scenario: Filtro rápido
  When elige "Próxima Semana" o "Próximo Mes"
  Then solo ve las reservas cuyo rango se cruza con ese periodo

Scenario: Búsqueda por nombre
  When escribe un texto
  Then solo ve las reservas cuyo nombre lo contiene
```

### HU-22 — Ficha de la reserva en pantalla propia
**Antes:** *(nueva; ADR-0008, nivel 2)* · **MoSCoW:** S · **Talla:** S · **Estado:** 🔍 (DD-03 implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-04, P-07 · **↑ JTBD:** JTBD-04, JTBD-07 · **↓ RF:** RF-44 · **↓ RNF:** RNF-11, RNF-26 · **↓ Sprint:** S4 · **S32** (F-42)

> **DD-03 (2026-10-03, F-42):** ya no hay "Ver más": la ficha se abre al tocar la reserva, en su propia pantalla, y es la misma para consultar y para modificar. Secciones: *Datos reserva*, *Datos del cliente*, *Checklist* (IN/OUT con fecha y responsable), *Documentación* (Interior: identidades y SES; Exterior: contrato), *Resumen económico*, *Servicios extra* ("NA (No aplica)" si no hay), *Notas* e *Historial de cambios*. *Mensaje para el huésped* solo en Interior.

Como copropietario, quiero consultar todos los datos de una reserva sin riesgo de modificarlos para revisarla con tranquilidad.

```gherkin
Scenario: Ver más
  When pulsa "Ver más" en una fila
  Then se despliega bajo la tabla una ficha de solo lectura con Resumen económico, Documentos (contrato y vídeos enlazados) y Resto de datos
```

### HU-23 — Editar una reserva con auditoría
**Antes:** US-015 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-03, P-04 · **↑ JTBD:** JTBD-03, JTBD-04 · **↓ RF:** RF-06, RF-45, RF-46, RF-47, RF-48, RF-97 · **↓ RNF:** RNF-09, RNF-14, RNF-22, RNF-24 · **↓ Sprint:** S4 → S8 ✔ · **S32** (F-44)

> **DD-03 (2026-10-03, F-44):** "Modificar" pone la ficha en edición en la misma pantalla; *Guardar cambios* arriba y abajo guarda a la vez datos y servicios; al salir con cambios sin guardar se pregunta *Seguir editando / Descartar / Guardar*.

```gherkin
Scenario: Salir con cambios sin guardar (F-44)
  Given estoy modificando una reserva y he cambiado las notas
  When pulso "← Volver" o un botón de la barra
  Then se me pregunta si sigo editando, descarto o guardo
  When elijo "Guardar"
  Then se guardan los cambios y sigo a donde iba
```

Como copropietario, quiero editar los datos de gestión de una reserva y que cada cambio quede registrado para corregir errores con trazabilidad.

> Alcance vigente (ADR-0005): Espacio, Canal, Fechas y Servicios son de solo lectura en este formulario (fechas y espacio → HU-38; servicios → HU-24).  
> ✔ **Corregido en v2 (S8, B-04):** el servidor valida los valores de dominio y rechaza editar reservas canceladas.

```gherkin
Scenario: Campos editables
  When pulsa "Modificar"
  Then puede editar huésped, personas, importe del alquiler, % comisión, cobro, contrato, incidencias, checklists y notas
  And ID_Reserva, Registrado_Por y Fecha_Registro son inmutables
  And Estado_Reserva no es editable (se calcula)

Scenario: Auditoría campo a campo
  When guarda con uno o más campos cambiados
  Then por cada campo cambiado se añade a Historial_Cambios: Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo
  And se recalculan bruto, comisión, margen y neto

Scenario: Valores fuera de dominio
  When el cliente envía un valor no permitido para un campo de estado
  Then el servidor rechaza el cambio con un mensaje claro

Scenario: Reserva cancelada
  Given una reserva "Cancelada"
  When se intenta editar
  Then el servidor lo rechaza
```

### HU-24 — Añadir o quitar servicios a una reserva existente
**Antes:** US-010 (escenario 4) · **MoSCoW:** S · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-08 · **↑ JTBD:** JTBD-08 · **↓ RF:** RF-49 · **↓ RNF:** RNF-14, RNF-15 · **↓ Sprint:** S4 → S8 ✔ · **S32** (F-44)

> **DD-03 (2026-10-03):** los servicios se editan en la sección *Servicios extra* de la ficha y se guardan con el mismo *Guardar cambios* (ya no hay "Guardar servicios"). Su cobro se registra en la función *Extras* (HU-42).

Como copropietario, quiero modificar los servicios extra de una reserva ya creada para reflejar lo que el huésped contrata después.

> ✔ **Corregido en v2 (S8, B-03):** la reescritura escribe primero y limpia después; un fallo ya no vacía la hoja.

```gherkin
Scenario: Modificar servicios
  When cambia servicios o cantidades y guarda
  Then las líneas de la reserva se sustituyen con el snapshot actual del catálogo
  And se recalculan totales de servicios, bruto, margen y neto
  And la comisión NO se recalcula (acuerdo directo con el huésped, ADR-0003)
  And se auditan "Servicios extra" e "Importe neto"
```

### HU-25 — Ciclo de vida automático del estado
**Antes:** US-016 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-04 · **↑ JTBD:** JTBD-04 · **↓ RF:** RF-50, RF-51 · **↓ RNF:** RNF-09, RNF-14 · **↓ Sprint:** S4 → S8 ✔

Como copropietario, quiero que el estado de la reserva se calcule solo a partir del cobro y las incidencias para evitar incoherencias.

> ✔ **Implementado en v2 (S8):** la edición muestra "Falta: …" junto al estado (RF-51). Pendiente de verificar en E2E (S11).

```gherkin
Scenario Outline: Cálculo del estado
  Given Estado_Cobro = "<cobro>", Incidencias = "<incid>" e Incidencia_Resuelta = "<resuelta>"
  When se guardan cambios
  Then Estado_Reserva = "<estado>"
  Examples:
    | cobro        | incid          | resuelta | estado     |
    | Ingresado    | Sin incidentes |          | Completada |
    | Ingresado    | Con incidentes | Sí       | Completada |
    | Ingresado    | Con incidentes | No       | Abierta    |
    | No ingresado | Sin incidentes |          | Abierta    |

Scenario: Compensación informativa
  Then Compensación_Daños no influye en el estado

Scenario: Canceladas intocables
  Given una reserva "Cancelada"
  Then el cálculo nunca cambia su estado

Scenario: Qué falta
  Given una reserva "Abierta"
  Then la pantalla indica qué falta ("Pendiente de cobro" / "Incidencia sin resolver")
```

### HU-26 — Cancelar una reserva
**Antes:** US-018 · **MoSCoW:** M · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-06 · **↑ JTBD:** JTBD-06 · **↓ RF:** RF-38, RF-39, RF-52, RF-92 · **↓ RNF:** RNF-05, RNF-10, RNF-16, RNF-22, RNF-38 · **↓ Sprint:** S4 · **S27** (ADR-0022)

Como copropietario, quiero cancelar una reserva con una confirmación explícita para evitar cancelaciones accidentales.

```gherkin
Scenario: Confirmación
  When pulsa "Cancelar reserva"
  Then aparece un modal que explica que la acción no se puede deshacer, con "Confirmar" y "No, volver"

Scenario: Cancelación confirmada
  When confirma
  Then Estado_Reserva = "Cancelada", se audita el cambio, se borra el evento de Calendar y se envía el aviso de reapertura (HU-20)

Scenario: Cancelación abortada
  When pulsa "No, volver"
  Then la reserva no cambia

Scenario: Ya cancelada
  Then el servidor responde "La reserva ya está cancelada."
```

### HU-27 — Ver el historial de cambios
**Antes:** US-019 · **MoSCoW:** S · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-03 · **↑ JTBD:** JTBD-03 · **↓ RF:** RF-47, RF-53 · **↓ RNF:** RNF-22 · **↓ Sprint:** S4

Como copropietario, quiero ver el historial de cambios de una reserva para saber quién modificó qué y cuándo.

```gherkin
Scenario: Historial con cambios
  Then se muestran Fecha/Hora, Usuario, Campo, Valor anterior y Valor nuevo, del más reciente al más antiguo

Scenario: Sin cambios
  Then se muestra "Sin cambios registrados"
```

### HU-37 — Recordatorio automático del cobro pendiente
**Antes:** *(backlog v0.5, "Could")* · **MoSCoW:** S · **Talla:** M · **Estado:** 🔍 (F-37 implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-04 · **↑ JTBD:** JTBD-04 · **↓ RF:** RF-79, RF-101 · **↓ RNF:** RNF-05, RNF-10, RNF-16, RNF-20 · **↓ Sprint:** **S34** (F-37)

Como copropietario, quiero que la app me pregunte si una reserva ya se ha ingresado para no dejarla abierta por olvido.

> **Alcance (2026-10-03, Q-08; sustituye la parte de cobro de D-24):** a los **10 días de la salida** sin "Ingresado" y después cada 10 días, email a los roles Admin y Gestión con el botón *Sí, se ha ingresado*, que abre la app y pide confirmación. Los contratos y las revisiones pendientes los cubren HU-41 y HU-43.

```gherkin
Scenario: Cobro pendiente tras la estancia
  Given una reserva no cancelada con Estado_Cobro = "No ingresado" cuya salida fue hace 10 días (Config.Dias_Aviso_Ingreso)
  When se ejecuta el aviso diario (9:00)
  Then Admin y Gestión reciben un email con la referencia, la estancia y el neto esperado
  And se repite a los 20, 30… días hasta que se marque como ingresada

Scenario: Marcarla desde el email
  When pulso "Sí, se ha ingresado" en el email
  Then la app abre la ficha y me pide confirmar
  When confirmo
  Then la reserva queda "Ingresado", con auditoría, y se recalcula su estado
```

### HU-38 — Editar canal y fechas de una reserva
**Antes:** *(Pendiente de ADR-0005)* · **MoSCoW:** C · **Talla:** L · **Estado:** ⏳  
**↑ Problema:** P-01, P-04 · **↑ JTBD:** JTBD-01, JTBD-04 · **↓ RF:** RF-41, RF-80 · **↓ RNF:** RNF-15, RNF-16 · **↓ Sprint:** **S13**

Como copropietario, quiero cambiar las fechas o el canal de una reserva existente para no tener que cancelarla y crearla de nuevo.

> **Alcance (decisión del usuario, 2026-09-27):** el espacio no se cambia (no se da el caso); fechas y canal solo mientras no haya empezado el check-in.

```gherkin
Scenario: Cambio de fechas sin solapamiento
  When cambia las fechas y guarda
  Then se revalida el solapamiento (excluyendo la propia reserva), se audita y se actualiza el evento de Calendar

Scenario: Cambio con solapamiento
  Then se rechaza con el mensaje de solapamiento

Scenario: Check-in ya empezado
  Given la checklist de check-in tiene algún punto registrado
  Then fechas y canal se muestran de solo lectura
```

### HU-41 — Tareas de la reserva desde la barra de Reservas
**Antes:** *(DD-03; F-38, F-39, F-41)* · **MoSCoW:** M · **Talla:** L · **Estado:** 🔍 (implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-04, P-07, P-10 · **↑ JTBD:** JTBD-04, JTBD-07 · **↓ RF:** RF-98 · **↓ RNF:** RNF-08, RNF-11, RNF-12 · **↓ Sprint:** **S33**

Como copropietario, quiero ir directo a la tarea que toca (check-in, check-out, identidades o contrato) y que la app me proponga la reserva más cercana para no tener que buscarla en la lista.

```gherkin
Scenario: Checklist con IN u OUT (F-38)
  When pulso "Checklist" en la barra de Reservas
  Then elijo "IN · Check-in" u "OUT · Check-out"
  And la app me propone la reserva más cercana a hoy con esa checklist pendiente
  And puedo buscar otra por espacio y nombre o elegirla entre las 5 siguientes

Scenario: Validar identidades solo en Interior (F-39)
  When pulso "Identidades"
  Then solo se ofrecen reservas de la Habitación
  And tengo a mano el "Mensaje para el huésped"

Scenario: Contrato solo en Exterior (F-41)
  When pulso "Contrato"
  Then solo se ofrecen reservas de Exterior y la foto del contrato lo marca firmado
```

### HU-42 — Cobro de los servicios extra (plataforma o presencial)
**Antes:** *(DD-03, F-43)* · **MoSCoW:** S · **Talla:** M · **Estado:** 🔍 (implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-08 · **↑ JTBD:** JTBD-08 · **↓ RF:** RF-98, RF-99 · **↓ RNF:** RNF-14, RNF-15, RNF-22, RNF-24 · **↓ Sprint:** **S33**

Como copropietario, quiero registrar el cobro de cada servicio extra (vía plataforma o presencial), añadir los que pidan durante la estancia y quitar los que rechacen, para que el neto refleje lo que de verdad se cobró.

> **DI-11 (resuelta por el usuario, 2026-10-03):** nadie marca nada al crear la reserva: todo servicio nace *Pendiente*; al cobrarlo en *Extras* la app pregunta si fue **vía plataforma o presencial**. En *Extras* también se añaden servicios.

```gherkin
Scenario: Cobrar un servicio (Q-14, DI-11)
  Given una reserva con un servicio "Pendiente" de cobro
  When en "Extras" pulso "Cobrar"
  Then la app pregunta si se cobró vía plataforma o presencial
  When elijo una
  Then queda "Cobrado" con esa forma, con auditoría, y la reserva deja de proponerse en "Extras"

Scenario: Añadir un servicio durante la estancia
  When en "Extras" elijo un servicio del catálogo del espacio y sus unidades y pulso "Añadir servicio"
  Then se añade "Pendiente" de cobro y se recalculan los importes sin tocar la comisión

Scenario: El cliente lo rechaza
  When pulso "Quitar" y confirmo
  Then el servicio sale de la reserva y se recalculan los importes
```

### HU-43 — Aviso de check-in y check-out sin hacer
**Antes:** *(DD-03, F-40)* · **MoSCoW:** S · **Talla:** M · **Estado:** 🔍 (implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-04, P-07 · **↑ JTBD:** JTBD-04, JTBD-07 · **↓ RF:** RF-100, RF-101 · **↓ RNF:** RNF-05, RNF-16 · **↓ Sprint:** **S34**

Como copropietario, quiero un aviso antes de que lleguen los huéspedes y después de que se vayan si la checklist no está hecha para no olvidarla.

> **D-43 (2026-10-03):** solo por email (llega al móvil como notificación de Gmail). Una notificación push propia de la app no es posible en Apps Script.

```gherkin
Scenario: Check-in sin hacer
  Given faltan 4 h o menos (Config.Horas_Aviso_Checkin) para la llegada y el check-in no está hecho
  When se ejecuta el aviso (cada 15 min)
  Then Admin y Gestión reciben un email con el botón "Hacer el check-in", una sola vez y antes de la hora de llegada

Scenario: Check-out sin hacer (DI-07)
  Given ha llegado la hora de salida y el check-out no está hecho
  Then reciben el aviso una sola vez, en las 24 h siguientes a la salida; después ya no se avisa
```

---

## E-06 — Documentos y evidencias

### HU-28 — Firmar el contrato de Exterior con fotos en Drive
**Antes:** US-017 · **MoSCoW:** M · **Talla:** L · **Estado:** 🔍 (F-41 implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-07 · **↑ JTBD:** JTBD-07 · **↓ RF:** RF-54, RF-55, RF-58, RF-102 · **↓ RNF:** RNF-07, RNF-08, RNF-35, RNF-36 · **↓ Sprint:** S4 → S8 ✔ · **S33** (F-41)

> **DD-03 (2026-10-03, F-41, Q-10, Q-11):** el contrato se firma en papel y se sube en **fotos** desde la función *Contrato* de la barra de Reservas, en **todas** las reservas de Exterior; la primera foto lo marca *Firmado* con fecha y responsable. Las fotos se guardan en la carpeta `Contrato` de la reserva y se borran a los **5 años** de la salida ([ADR-0023](../solution/adr/0023-fotos-del-contrato-y-retencion.md)).

Como copropietario, quiero subir el contrato firmado desde la reserva para tenerlo vinculado y guardado en Drive.

> ✔ **Implementado en v2 (S8):** la subida se oculta y el servidor la rechaza si el contrato lo gestiona el canal (RF-55).

```gherkin
Scenario: Subida válida
  Given una reserva con Contrato_Estado = "Pendiente"
  When sube un JPG, PNG o PDF de hasta Config.Tamano_Max_Contrato_MB
  Then se guarda en Documentos/{Espacio}/{reserva} como "{NN-AA} - contrato - {DDMMAA}.ext"
  And Contrato_Archivo = URL, Contrato_Estado = "Firmado" y el cambio se audita

Scenario: Formato o tamaño no permitido
  Then se rechaza con un mensaje que indica los formatos o el tamaño máximo y nada cambia

Scenario: Contrato gestionado por el canal
  Given Contrato_Estado = "Gestionado por canal"
  Then la subida no está disponible
```

### HU-29 — Marcar los checklists de check-in/check-out
**Antes:** US-029 · **MoSCoW:** S · **Talla:** S · **Estado:** ✅  
**↑ Problema:** P-07 · **↑ JTBD:** JTBD-07 · **↓ RF:** RF-50, RF-56, RF-85, RF-86, RF-87 · **↓ RNF:** RNF-11, RNF-14, RNF-22 · **↓ Sprint:** S4 → **S16** (F-14, [DD-01](../solution/design-docs/DD-01-checklists-digitales.md)) · **S22** (B-18, B-19, TD-02)

Como copropietario, quiero hacer el check-in y el check-out punto por punto desde el móvil, dejando constancia de quién y cuándo, para no depender del papel y no cerrar una reserva sin revisar el espacio.

```gherkin
Scenario: Lista según la reserva
  When abre la checklist de una reserva
  Then ve los puntos de su espacio y momento; la barbacoa y los extras solo si están contratados;
       en el check-out de la Habitación, "reponer office" o "recoger office" según la siguiente reserva

Scenario: Marcar o "No aplica"
  When marca un punto o pulsa "No aplica" y guarda
  Then queda registrado con su usuario y fecha; un bloque entero "No aplica" en el check-in no sale en el check-out

Scenario: Terminar con confirmación
  Given todos los puntos están resueltos (y el WC del check-out de la Habitación tiene fecha)
  When pulsa "Dar el check-out por terminado" y confirma
  Then Checkout_Revisado pasa a "Hecho" y se audita

Scenario: Editar una checklist terminada (B-18)
  Given la checklist está terminada
  When deja un punto pendiente y guarda
  Then la checklist vuelve a "sin terminar", la reserva se recalcula y se audita

Scenario: Daños (B-19)
  When llega a un punto de daños
  Then elige "Sin daños" o "Con daños" (no hay "No aplica")
  And si eligió "Con daños", al terminar la app le lleva a registrar la incidencia

Scenario: Vídeo y fotos
  When sube el vídeo desde su punto o añade una foto de desperfectos
  Then el archivo va a Drive y el punto se marca solo

Scenario: Cierre
  Then una reserva solo pasa a "Completada" con cobro ingresado y check-out hecho
```

### HU-30 — Subir vídeos de entrada/salida a Drive
**Antes:** US-030 · **MoSCoW:** S · **Talla:** M · **Estado:** ✅  
**↑ Problema:** P-07 · **↑ JTBD:** JTBD-07 · **↓ RF:** RF-57, RF-58, RF-70, RF-86 · **↓ RNF:** RNF-07, RNF-22, RNF-35 · **↓ Sprint:** S4 → S8 ✔

Como copropietario, quiero subir los vídeos de entrada y salida organizados por espacio y reserva para tener pruebas sin llenar el almacenamiento indefinidamente.

> ✔ **Corregido en v2 (S8, B-07):** la poda elimina también la carpeta de reserva que queda vacía.

```gherkin
Scenario: Subida de vídeo
  When sube el vídeo In u Out (mp4, mov o m4v, hasta Config.Tamano_Max_Video_MB)
  Then se guarda en la carpeta de vídeos del espacio y la reserva como "Video In|Out {NN-AA} {Nombre} {DDMMAA}.ext"
  And su URL queda en Video_In_Url o Video_Out_Url

Scenario: Poda a los 180 días
  Given vídeos con más de Config.Retencion_Videos_Dias días
  When se ejecuta el mantenimiento nocturno
  Then se mandan a la papelera
  And la carpeta de reserva se elimina si queda vacía
```

---

## E-07 — Estadísticas e informes

### HU-31 — Estadísticas por espacio y canal con su ocupación
**Antes:** US-024 · **MoSCoW:** S · **Talla:** L · **Estado:** 🔍 (rehecha en S36 según [DD-04](../solution/design-docs/DD-04-ocupacion-tarifas-y-experimentos.md), pendiente de validar)  
**↑ Problema:** P-08 · **↑ JTBD:** JTBD-08 · **↓ RF:** RF-107, RF-108 (antes RF-59, RF-60, retirados) · **↓ RNF:** RNF-04, RNF-05, RNF-11 · **↓ Sprint:** S5 · **S36**

Como copropietario, quiero ver por espacio y canal los días abiertos frente a los ocupados y lo que deja cada unidad abierta para decidir precios y canales con datos.

> **Revisión 2026-10-03 (DD-04, D-13):** sustituye el resumen anual por zonas leído de `Estadisticas_Cache`. Cada espacio se mide como se cobra: por noches (Interior) o por horas (Exterior).

```gherkin
Scenario: Ocupación por canal
  Given un espacio y un periodo (mes, trimestre o año)
  When entra en "Estadísticas"
  Then ve una tarjeta de total y una por canal con reservas, canceladas, neto, cobrado por unidad e ingreso por unidad abierta
  And los días cerrados (HU-44) no cuentan como abiertos

Scenario: Lo primero que se ve
  Then en Interior ve la ocupación de noches y el € por noche
  And en Exterior ve los días con reserva frente a los abiertos y el € por hora, con las horas abiertas de Config (09:00–02:00)

Scenario: Reserva que cruza de mes
  Given una reserva de Interior con noches en dos meses
  Then cada noche cuenta en su mes y el importe se reparte en proporción a las noches

Scenario: Evolución
  Then ve los 12 meses del año con su ocupación y su ingreso por unidad abierta, con la cifra escrita junto a la barra
```

### HU-44 — Cerrar días de un espacio
**Antes:** *(DD-04, F-48, D-13)* · **MoSCoW:** S · **Talla:** M · **Estado:** 🔍 (implementado el 2026-10-03, pendiente de validar)  
**↑ Problema:** P-08 · **↑ JTBD:** JTBD-08 · **↓ RF:** RF-104, RF-105, RF-106 · **↓ RNF:** RNF-05, RNF-11, RNF-16 · **↓ Sprint:** **S36**

Como copropietario, quiero apuntar los días en que un espacio no se alquila para que nadie lo reserve esos días y la ocupación se calcule sobre los días abiertos de verdad.

> Las plataformas no dejan leer sus bloqueos (D-13 D descartada): el cierre se apunta en la plataforma y en la app.

```gherkin
Scenario: Cerrar días
  Given Reservas → Cerrar días
  When indica espacio, desde, hasta (incluido) y motivo
  Then el cierre se guarda y aparece en el calendario como evento gris "Cerrado · {espacio} · {motivo}"

Scenario: No pisar reservas ni otros cierres
  Given ya hay una reserva no cancelada o un cierre del mismo espacio en esas fechas
  Then el cierre se rechaza con un mensaje que dice cuál es

Scenario: No se reserva un día cerrado
  Given un día cerrado
  When se crea una reserva que lo ocupa (una noche en Interior; el día de inicio en Exterior)
  Then se rechaza explicando el motivo y que se quite el cierre si hay que abrir

Scenario: Quitar un cierre
  When pulsa "Quitar" y lo confirma
  Then el cierre y su evento desaparecen y esos días se pueden reservar
```

### HU-32 — Informes mensual y trimestral por email
**Antes:** US-021 · **MoSCoW:** S · **Talla:** L · **Estado:** 🟡  
**↑ Problema:** P-08 · **↑ JTBD:** JTBD-08 · **↓ RF:** RF-61, RF-62 · **↓ RNF:** RNF-05 · **↓ Sprint:** S5 → **S36**

Como copropietario, quiero recibir informes mensuales y trimestrales automáticos para seguir el rendimiento sin elaborarlos.

> 🟡 **Hueco:** desde S36 (DD-04) el email lleva la ocupación de cada espacio · canal y reparte las noches entre meses; las canceladas se ven en Estadísticas, pero aún no en el email (B-08).

```gherkin
Scenario: Informe mensual
  Given que empieza un mes
  When se ejecuta el trigger del día 1
  Then se genera el informe del mes anterior por espacio y canal (nº reservas, brutos, comisiones, netos y totales)
  And se envía en HTML a los tres y se archiva en Historico_Informes

Scenario: Informe trimestral
  Given que empieza un trimestre (enero, abril, julio, octubre)
  Then se genera también el informe del trimestre anterior

Scenario: Contenido completo
  Then el informe incluye además el % de ocupación y las reservas completadas frente a las canceladas
```

---

## E-08 — Gastos e IRPF

> ⚠️ El sistema registra y agrega; la deducibilidad la confirma el gestor (ADR-0012).

### HU-33 — Registrar gastos con justificante
**Antes:** US-027 · **MoSCoW:** S · **Talla:** L · **Estado:** ✅  
**↑ Problema:** P-09 · **↑ JTBD:** JTBD-09 · **↓ RF:** RF-63, RF-64, RF-65 · **↓ RNF:** RNF-24, RNF-27, RNF-36 · **↓ Sprint:** S6

Como copropietario, quiero registrar cada gasto con su justificante para tener centralizado todo lo deducible.

```gherkin
Scenario: Registrar gasto
  When introduce fecha, concepto, categoría, espacio (Piscina/Jardín, Habitación o Común), importe > 0, quién pagó y el justificante
  Then se guarda en Gastos con ID "G{AAAA}-NNN", su ejercicio y el enlace al justificante en Documentos/Gastos/{Ejercicio}
  And Deducible toma el valor por defecto de la categoría y es editable

Scenario: Datos incompletos
  Then se indica qué falta y no se guarda
```

### HU-34 — Resumen fiscal por ejercicio a tercios
**Antes:** US-028 · **MoSCoW:** S · **Talla:** L · **Estado:** ✅  
**↑ Problema:** P-09 · **↑ JTBD:** JTBD-09 · **↓ RF:** RF-66 · **↓ RNF:** RNF-36 · **↓ Sprint:** S6

Como copropietario, quiero un resumen anual repartido a partes iguales para llevar cada uno su tercio al IRPF.

```gherkin
Scenario: Resumen del ejercicio
  When consulta un ejercicio
  Then ve por espacio: ingresos íntegros, comisiones, gastos deducibles (propios + 50 % de los comunes), amortización, rendimiento neto y tercio por copropietario
  And el desglose de gastos deducibles por categoría
  And el resultado se guarda en Resumen_Fiscal

Scenario: Amortización
  Given Config.Valor_Construccion y Config.Proporcion_Alquilada informados
  Then la amortización anual = 3 % × valor × proporción, repartida entre los espacios; sin datos = 0
```

---

## E-09 — Registro de viajeros (Fase 2)

### HU-35 — Comunicar los viajeros de la Habitación a SES.Hospedajes
**Antes:** *(ADR-0007; reescrita con ADR-0018 y [DD-02](../solution/design-docs/DD-02-comunicacion-ses-hospedajes.md), D-34)* · **MoSCoW:** W (Fase 2) · **Talla:** XL (dividida en S26–S29) · **Estado:** 🟡 (S26–S28 hechos; SES activo en producción desde el 2026-10-02; falta verificarlo con la primera reserva real, S29)  
**↑ Problema:** P-10 · **↑ JTBD:** JTBD-10 · **↓ RF:** RF-76, RF-77, RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-96 (RF-75 retirado) · **↓ RNF:** RNF-09, RNF-16, RNF-34, RNF-38 · **↓ Sprint:** **S26** (dominio) → S27 → S28 → S29

Como copropietario, quiero que los datos que los huéspedes dejan en el Google Form se comuniquen solos a SES.Hospedajes tras comprobar su identidad en persona, para cumplir el RD 933/2021 sin entrar en la web del Ministerio.

```gherkin
Scenario: Casado con la reserva
  Given una respuesta del Form con el código de reserva "HMTEST1234" (o "15/26")
  Then se asocia a la reserva de Habitación con ese Ref_Canal (o esa referencia), sin distinguir mayúsculas ni espacios

Scenario: Reserva comunicada con el primer Form (D-31)
  When llega la primera respuesta de una reserva antes del día de entrada
  Then se comunica la reserva (RH) con esa persona como titular

Scenario: Datos incompletos
  Given un huésped adulto con DNI sin número de soporte
  Then no se puede comunicar el parte y se indica qué falta y de quién

Scenario: Parte de viajeros
  Given todos los huéspedes casados están validados en persona
  When pulsa "Comunicar a SES" y confirma
  Then se envía el parte (PV) y, cuando SES responde, se anota el código en los dos Sheets y se avisa por email

Scenario: Fallo de conexión
  When SES no responde
  Then se reintenta hasta 3 veces cada 30 minutos, avisando de cada intento, y tras el último queda "Manual"

Scenario: Datos rechazados por SES
  Then no se reintenta y se avisa para corregir y comunicar a mano
```

### HU-36 — Estado del registro de viajeros en la reserva
**Antes:** *(ADR-0007)* · **MoSCoW:** W (Fase 2) · **Talla:** M · **Estado:** 🟡 (hecho e implementado; falta verificarlo con la primera reserva real, S29)  
**↑ Problema:** P-10 · **↑ JTBD:** JTBD-10 · **↓ RF:** RF-78, RF-94 · **↓ RNF:** RNF-08, RNF-09, RNF-38 · **↓ Sprint:** **S27** (estado al recibir el Form) · **S28** (bloque de la reserva, F-28)

Como copropietario, quiero ver si una reserva de Habitación tiene completo el registro de viajeros para saber si debo reclamarlo.

```gherkin
Scenario: Registro completo
  Given una reserva con Adultos + Menores = N
  When hay N viajeros registrados para ella
  Then Registro_Viajeros_Estado = "Completado"
```
