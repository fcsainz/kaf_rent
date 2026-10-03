# DD-03 — Reservas: navegación, listado, ficha y funciones de gestión

**Estado:** aprobado e implementado (2026-10-03); pendiente del smoke en `/dev` y de implementar · **Fecha:** 2026-10-03 · **Sprint:** S31–S34
**Trazabilidad:** ↑ F-31 a F-45, B-27, D-24 (parte de cobro), D-43, D-44 ([mejoras_2026-10-03](../../../docs_work/docs_mejoras/mejoras_2026-10-03.md)) · HU-04, HU-05, HU-07, HU-21, HU-22, HU-23, HU-24, HU-28, HU-37, HU-41, HU-42, HU-43 · ↓ RF-07, RF-08, RF-12, RF-13, RF-42 a RF-45, RF-49, RF-50, RF-53 a RF-55, RF-79, RF-97 a RF-103 · [ADR-0023](../adr/0023-fotos-del-contrato-y-retencion.md) (aceptado)

> Diseño completo del primer bloque de mejoras de la sesión 2026-10-03. Todo lo que aquí se da por decidido sale de las respuestas del usuario en ese registro; lo que no, está en §5.

## 1. Problema y objetivo
La gestión de reservas en el móvil es incómoda:
- La tabla de Gestionar obliga a desplazarse en horizontal.
- "Ver más" y "Modificar" se abren debajo del listado.
- Los filtros no se usan (Desde/Hasta) o exigen un paso de más (*Filtrar*).
- "Ver calendario" saca al usuario de la app sin camino de vuelta.

Además, las tareas de cada reserva están repartidas por *Modificar* y no tienen un punto de entrada propio: check-in/out, validar identidades, contrato y cobro de extras. Faltan avisos de cobro y de check-in/out.

**Objetivo:** que Ana y Luis gestionen una reserva desde el móvil sin desplazarse en horizontal, con cada tarea a un toque desde una barra propia y con avisos cuando algo queda pendiente.

**Criterio de éxito:**
- En el Motorola G85, Pixel 10 y Redmi 9 se encuentra y abre una reserva en ≤ 3 toques sin scroll lateral.
- Un check-in se empieza en ≤ 2 toques desde Gestionar.

## 2. Alcance
- **Incluye:** menú Admin (F-31); Inicio con Próximas/Últimas (F-32); "Ver calendario" (B-27); barra de Reservas (F-33); filtros, orden y paginado (F-34, F-36); diseño compacto (F-35); ficha de reserva (F-42) con guardado seguro (F-44); funciones Checklist (F-38), Validar identidades (F-39), Firma de contrato (F-41) y Cobro de servicios extra (F-43); avisos de ingreso (F-37) y de check-in/out (F-40) por email; "Completada" → "Cerrada"; puesta al día de datos (F-45).
- **No incluye:**
  - Notificación push propia de la app: no es posible en Apps Script; se descartó en D-43.
  - Editar fechas y canal: es HU-38/F-01, en S13.
  - Cambios en *Crear Reserva*, salvo la marca de cobro por servicio (F-43).

## 3. Diseño

### 3.1 Navegación

```
Barra general (todos)                         Segundo piso de Admin (solo rol Admin)
┌─────────────────────────────────────────┐   ┌───────────────────────────────┐
│ Inicio  Reservas  Gastos  Estad.  Admin │   │  Checklists   Conexión SES    │
└─────────────────────────────────────────┘   └───────────────────────────────┘
  Reservas → segundo piso: Gestionar Reservas · Crear Reservas (como hoy)

Barra al entrar en Gestionar Reservas (sustituye a la general)
┌─────────────────────────────────────────────────────────┐
│ ← Inicio │ Checklist │ Identidades │ Contrato │ Extras  │
└─────────────────────────────────────────────────────────┘
```

- **F-31:** *Checklists* sale de la primera fila. *Admin* (icono de persona) solo se ve con rol Admin y abre su segundo piso: Checklists (editor del catálogo) y Conexión SES. El botón "Comprobar conexión SES" sale de Inicio.
- **F-33:** la barra de Reservas es la misma página (patrón hub + secciones, ADR-0008); solo cambia qué barra se muestra.
  - *← Inicio* vuelve a la barra general.
  - Con 5 botones en 360 px, cada uno mide ~72 px de ancho: cumple el mínimo de 44 px. Los textos van en una línea corta (Checklist · Identidades · Contrato · Extras).
- **B-27 (D-44 B):** "Ver calendario" abre la app de Google Calendar en el móvil; se vuelve con Atrás. En el ordenador sigue en otra pestaña.

### 3.2 Inicio — "Reservas de un vistazo" (F-32)
- Selector bajo el título: **Próximas** (por defecto: 5 reservas desde ahora, por fecha de entrada, sin canceladas) / **Últimas registradas** (5, por `Fecha_Registro`, como hoy).
- Mismas columnas que hoy (F-26).

### 3.3 Gestionar Reservas: filtros y listado (F-34, F-35, F-36)

```
┌ Gestionar Reservas ───────────────────┐
│ [Nombre………………]  [Espacio ▾]          │
│ [Estado ▾]  [Cobro ▾]                 │
│ (Próxima semana) (Próximo mes)        │
├───────────────────────────────────────┤
│ 15/26 · Oliver Fried                  │
│ Interior · 16/10/26 16:00 → 18/10 12:00│
│ [Abierta] [No ingresada]              │
├───────────────────────────────────────┤
│ …                                     │
│        ‹ 1 2 3 … ›  (5 por página)    │
└───────────────────────────────────────┘
```

- **Filtros:** cada cambio actualiza el listado al momento; no hay botón *Filtrar*.
  - *Nombre*: texto.
  - *Espacio*: Todos / Interior / Exterior (`Nombre_Corto`).
  - *Estado*: Todas sin canceladas (por defecto) / Abierta / Cerrada / Cancelada.
  - *Cobro*: Todos / Ingresada / No ingresada.
  - *Próxima semana* y *Próximo mes* se marcan y desmarcan.
- **Orden (Q-16):** primero las próximas, de la más cercana a la más lejana; después las pasadas, de la más reciente a la más antigua. Igual con filtros.
- **Tarjeta** sin scroll lateral. Cada tarjeta muestra:
  - ID y Nombre.
  - Espacio, entrada y salida.
  - Etiquetas de Estado y Cobro. El color nunca va solo: lleva el texto.
- **Al tocar la tarjeta** se abre la ficha (§3.4).
- **Fuera del listado:** check-in/out y resumen económico.
- **Paginado** de 5 en 5.
- **Compacto:** menos aire en la cabecera y entre filtros y lista; tokens del design-system (estilo de Inicio y la barra, S23).
- **Servidor:** `listarReservasActivas` se sustituye por `listarReservasGestion(filtro)`. Hoy solo devuelve las modificables, y ahora hacen falta Cerradas y Canceladas. Filtra y ordena en el servidor y devuelve la página pedida y el total.

### 3.4 Ficha de la reserva (F-42, F-44)
Pantalla propia (no debajo del listado). **Consultar y Modificar son la misma pantalla**; *Modificar* (arriba) activa la edición si la reserva es modificable.

| Sección | Contenido |
|---|---|
| Cabecera | Reserva 15/26 — Espacio · *Modificar* · *← Volver* · *Mensaje para el huésped* (solo Interior) |
| **Datos Reserva** | Id · Espacio · Nombre · Canal · Entrada · Salida · Código de reserva del canal · Estado · Cobro · Total PAX (adultos + menores) · Adultos · Menores · Incidencias (Incidencias, Comunicado, Compensación, Resuelta) |
| **Datos del cliente** | Teléfono · Email ("—" si vacío) |
| **Checklist** | IN y OUT: Hecho/Pendiente, fecha y responsable (de `Checklists_Reserva`: `Fecha_Hora`, `Usuario`) |
| **Documentación** | Interior: Validación de identidad (sí/no) · SES (sí/no, lote). Exterior: Contrato firmado (sí/no, fecha, responsable). Ambos: Vídeo IN · Vídeo OUT |
| **Resumen económico** | Sin cambios |
| **Servicios extra** | Por servicio: nombre, cantidad, precio, cobro (por la app / aparte: pendiente o cobrado). "NA (No aplica)" si no hay ninguno. En Modificar: activar o quitar |
| **Notas** | Como hoy |
| **Historial de cambios** | Como hoy |

- **F-44:** en Modificar, *Guardar cambios* arriba y abajo. Si el usuario sale con cambios sin guardar (Volver, barra, otra sección), una ventana le pide **Guardar** o **Descartar**.
- *Cancelar reserva* se queda en Modificar, abajo, con su confirmación (CLAUDE.md §6.1).
- **Servidor:** `obtenerFichaReserva(id)` devuelve en una sola llamada:
  - la reserva;
  - sus servicios;
  - el estado de cada checklist (con fecha y usuario);
  - SES (validación y lote);
  - el historial.

  Se sustituyen las cuatro llamadas actuales (`obtenerReserva`, `cargarServiciosReserva`, `obtenerHistorial` y la de SES): menos esperas en el móvil.

### 3.5 Funciones de la barra de Reservas (F-38, F-39, F-41, F-43)
Las cuatro comparten un **selector de reserva**:

```
┌ Checklist ──────────────────────┐
│ ( IN )  ( OUT )                 │   ← solo en Checklist
│ Propuesta: 15/26 Oliver Fried   │   ← la más cercana a hoy
│   Interior · hoy 16:00   [Empezar]
│ [Espacio ▾] [Buscar nombre……]   │
│ [Siguientes 5 por fecha ▾]      │
└─────────────────────────────────┘
```

| Función | Reservas que ofrece | Propuesta | Al elegir |
|---|---|---|---|
| **Checklist** (F-38) | Todas las abiertas; filtro Interior/Exterior | IN: próxima entrada; OUT: última salida sin check-out | Checklist como hoy (`checklist_interfaz.html`) |
| **Validar identidades** (F-39) | Solo Interior | Próxima entrada sin parte comunicado | Validación y comunicación a SES como hoy (`ses_interfaz.html`) + *Mensaje para el huésped* |
| **Firma de contrato** (F-41) | Solo Exterior, todas (Q-10) | Próxima entrada sin contrato firmado | Subir una o varias fotos → *Firmado* con fecha y responsable |
| **Cobro de servicios extra** (F-43) | Todas (para poder añadir servicios) | La más antigua con cobros pendientes; si no hay, la siguiente | Por servicio: *Cobrar* (pregunta: vía plataforma o presencial) o *Quitar* (el cliente lo rechazó); *Añadir servicio* del catálogo del espacio |

- **Servidor:** un endpoint común, `buscarReservasPara(funcion, filtro)`. Cada función es una regla pura en `dominio_reservas.gs` (qué reservas entran y cuál se propone). Así se amplía por datos, no con `if` nuevos (CLAUDE.md §3.1, O).

### 3.6 Datos (solo se añade; nada se renombra ni se borra)

| Hoja | Cambio | Para qué |
|---|---|---|
| `Reserva_Servicios` | + `Cobro_Estado` (Pendiente/Cobrado; vacío en las anteriores = cobrado) · + `Cobro_Forma` (Plataforma/Presencial) | F-43: cobro por servicio (Q-14, DI-11) |
| `Reservas` | + `Contrato_Firmado_Por` · + `Contrato_Fecha` | F-41: fecha y responsable en la ficha |
| `Reservas` | + `Aviso_Checkin_Enviado` · + `Aviso_Checkout_Enviado` (fecha y hora) | F-40: no avisar dos veces |
| `Reservas` | `Estado_Reserva`: valor `Completada` → `Cerrada` (valor, no columna) | Q-07; migración en F-45 |
| `Config` | + `Dias_Aviso_Ingreso` (10) · + `Horas_Aviso_Checkin` (4) · + `Anios_Retencion_Contrato` (5); `Tamano_Max_Contrato_MB` pasa a 15 | Sin números mágicos (CLAUDE.md §3.2) |

- **Contrato (F-41):** subcarpeta `Contrato` dentro de la carpeta de documentos de la reserva (`carpetaDocumentosReserva_`). `Contrato_Archivo` pasa a guardar el enlace a esa carpeta.
  - Las fotos se suben de una en una para respetar el límite de Apps Script, y la reserva se marca *Firmado* al subir la primera.
  - La tarea nocturna borra las subcarpetas `Contrato` de reservas cuya salida tenga más de `Anios_Retencion_Contrato` años.
  - Va a la papelera de Drive, recuperable 30 días; el borrado queda en `Logs`.
  - **ADR nuevo** (carpeta, retención de 5 años por el art. 1964.2 del Código Civil y borrado) y nota en EXT-02 (RGPD).
- **Valor `Cerrada`:** el código acepta `Completada` y `Cerrada` como equivalentes hasta que se ejecute la migración. Así la versión en uso no se rompe entre subir el código y migrar.

### 3.7 Avisos (F-37, F-40), solo por email (D-43 D)
- **Ingreso (F-37):** en la tarea nocturna. Reserva no cancelada, *No ingresado* y con `días desde la salida ≥ Dias_Aviso_Ingreso` y múltiplo de 10 (10, 20, 30…).
  - Envía un email a los roles Admin y Gestión. Esta regla no necesita guardar estado.
  - Botón del email *Sí, se ha ingresado* → enlace a la app (`?accion=ingreso&id=15-26`) → la app abre la ficha con una ventana de confirmación → `marcarIngresado(id)`.
  - Si el usuario no está autorizado, ve la página de acceso denegado como hoy.
  - `doGet` pasa a leer el parámetro `accion` y solo admite valores de una lista cerrada.
- **Check-in / check-out (F-40):** trigger cada 15 min.
  - Avisa a Admin y Gestión desde `Horas_Aviso_Checkin` antes de la entrada hasta la hora de entrada, o desde la hora de salida hasta 24 h después (DI-07).
  - Solo si el check-in o el check-out no está hecho y el aviso no se envió ya (`Aviso_*_Enviado`).
  - El email enlaza a la función Checklist con la reserva elegida.
- Plantilla de email común (F-18/D-35).

### 3.8 Puesta al día (F-45): tarea de editor de un solo uso
1. **Códigos del canal:** las respuestas del Form de viajeros cuya pregunta "Código de reserva" ya casa con una reserva de Interior **sin** `Ref_Canal` le ponen ese código.
   - Si no casa sin ambigüedad con una sola reserva, no se escribe y se lista en el resultado para revisarla a mano.
   - No verificado: si el Form tiene fecha de entrada para casar por fechas; se comprueba al implementar.
2. **Check-in/out pasados:** las reservas ya terminadas y no canceladas con check-in o check-out *Pendiente* pasan a *Hecho*.
   - Fila en `Checklists_Reserva` con usuario "Puesta al día (2026-10-03)" y fecha = entrada o salida.
3. **Completada → Cerrada** en todas las reservas.
4. Todo queda en `Historial_Cambios`. La tarea se puede repetir: lo ya hecho no se toca.

## 4. Alternativas descartadas
| Alternativa | Por qué se descarta |
|---|---|
| Mantener la tabla con scroll lateral y ocultar columnas | Sigue habiendo scroll y las columnas útiles no caben en 360 px (petición 4.4) |
| Ficha debajo del listado (como hoy) | Pide el usuario pantalla propia (5.1); en móvil pierde el contexto |
| Notificación push propia | No es posible en Apps Script (D-43); Telegram/ntfy descartados por el usuario |
| Calendario incrustado en la app | El usuario elige abrir la app de Calendar (D-44 B) |
| Guardar la fecha del último aviso de ingreso | La regla "múltiplo de 10 días" no necesita estado (KISS) |
| Marcar el cobro por reserva, o una casilla "se cobra por la app" al crear | Un servicio puede pedirse con la reserva empezada (Q-14) y el usuario no debe marcar nada al crearla (DI-11) |

## 5. Riesgos y preguntas abiertas
- **Contrato en reservas "Gestionado por canal":**
  - El usuario dijo "en principio, a todas las de Exterior" (Q-10), pero hoy `subirContrato` lo rechaza en esas (RF-55).
  - **Propuesta:** se ofrecen en Firma de contrato y subir fotos las pasa a *Firmado*; RF-55 se revisa.
  - A confirmar al aprobar este DD.
- **Ingreso desde el email:** el enlace no da permisos por sí mismo: abre la app con la sesión de Google del usuario y pide confirmación. Un email reenviado no permite marcar nada a quien no esté en `Usuarios_Autorizados`.
- **Trigger cada 15 min:** se suma al de SES (cada N min). La cuota gratuita de Apps Script (90 min/día de triggers) da de sobra para una lectura de `Reservas` por ejecución. No medido: se comprueba en `/dev`.
- **Migración a "Cerrada":** afecta a informes, estadísticas, emails y tests. Se cubre con la doble lectura (§3.6) y tests de regresión.
- **ADR-0008:** el patrón hub + secciones no cambia. La barra contextual se documenta en design-system §6 (no hace falta ADR).

## 5 bis. Cambios frente al borrador al implementar (decisiones DI-NN, pendientes del OK del usuario)

Detalle y alternativas en el [registro de la sesión](../../../docs_work/docs_mejoras/mejoras_2026-10-03.md#decisiones-tomadas-al-implementar-pendientes-de-tu-ok).

- **Paginación en el servidor** (como decía §3.3), con espera de 0,4 s al escribir el nombre para no llamar en cada letra.
- **Aviso de cobro a las 9:00** en un trigger diario propio (`avisosDeCobro`), no en la tarea nocturna de las 03:00: un email de madrugada sonaría en el móvil (DI-06).
- **Ventanas de los avisos (DI-07, decidido por el usuario):** check-in desde 4 h antes hasta la hora de llegada; check-out desde la hora de salida hasta 24 h después (sin los 30 min previstos). El aviso se anota solo si el email sale.
- **Funciones:** botón "← Reservas" para volver a la lista desde una función (la barra no tiene botón de lista) (DI-17).
- **Guardado único:** `actualizarReserva` recibe también los servicios; desaparecen `obtenerReserva`, `cargarServiciosReserva`, `actualizarServiciosReserva`, `obtenerHistorial`, `listarReservasActivas` y `cargarUltimasReservas` (DI-02).
- **Tamaño de las fotos del contrato:** 15 MB (`Tamano_Max_Contrato_MB`, DI-10, decidido por el usuario).
- **Sin scroll lateral en ninguna pantalla del móvil (DI-22, decidido por el usuario):** el Inicio (vistazo y buscador) también pasa a tarjetas con "Ordenar por"; el resumen fiscal de Gastos, a bloques; el editor de checklists, a textos que se parten en líneas.
- **Móvil más compacto en toda la app:** menos márgenes en paneles y cabecera ≤ 600 px, no solo en Gestionar (DI-16).

## 6. Plan
Orden propuesto en cuatro sprints. Los tests unitarios y de endpoints se escriben con cada paso; los E2E de las pantallas nuevas van al release (CLAUDE.md §8.3).

| Sprint | Contenido | Talla | Tests unitarios / endpoints (hechos el 2026-10-03) |
|---|---|---|---|
| **S31** Navegación e Inicio | F-31 menú Admin · F-32 Próximas/Últimas · B-27 calendario | ~4 h | `cargarReservasVistazo` (próximas/últimas), visibilidad de Admin por rol |
| **S32** Gestionar y ficha | F-33 barra · F-34 filtros y orden · F-35 compacto · F-36 tarjetas y paginado · F-42 ficha · F-44 guardar/descartar · valor `Cerrada` con doble lectura | ~16 h | Orden Q-16, filtros, paginado, `obtenerFichaReserva`, equivalencia Completada/Cerrada |
| **S33** Funciones de la barra | F-38 Checklist · F-39 Identidades · F-41 Contrato (+ ADR, retención) · F-43 Cobro de extras (columnas nuevas) | ~16 h | Reglas de selección y propuesta por función, cobro por servicio y recálculo, poda de contratos a 5 años |
| **S34** Avisos y datos | F-37 ingreso + `doGet` con acción · F-40 avisos de check-in/out · F-45 puesta al día + migración a `Cerrada` | ~8 h | Regla de días múltiplo de 10, ventanas de aviso, no duplicar, emparejado Form↔reserva, idempotencia |

**Documentación al aprobar:** HU y RF nuevos o revisados (HU-04, HU-05, HU-06, HU-23, HU-37, RF-11, RF-54/55, RF-79 y nuevos), design-system §6 (barra contextual, tarjetas), arc42 (datos, `Config`, triggers) y PROXIMOS_PASOS (S31–S34, D-24 cerrada).
