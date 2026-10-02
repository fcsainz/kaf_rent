# Próximos pasos — KAF Rent

**Actualizado:** 2026-10-02 (cierre de sesión sin código: diagnóstico de Calendar (B-14 reabierto) y de horas (B-22), mejoras de interfaz, diseño de la comunicación a SES (ADR-0018, DD-02); registro en [mejoras_2026-10-02.md](docs_mejoras/mejoras_2026-10-02.md))  
**Framework:** Scrum adaptado a un desarrollador único: **sprints por objetivo, sin duración fija** (se trabajan en ratos libres y se cierran al cumplir el objetivo), backlog priorizado y tallas convertidas a horas ([CLAUDE.md §2.4](../CLAUDE.md))  
**Sustituye a:** `docs/discovery/09_roadmap.md`

> Documento **regenerado al cierre de cada sesión** a partir de las decisiones abiertas, los HU/RF/RNF no terminados, los defectos y la deuda, las cuestiones abiertas de los ADR y los riesgos (§4). Al retomar el trabajo, Claude muestra primero §0 y §1.

---

## §0 Decisiones pendientes del usuario

### Acciones manuales pendientes (no son decisiones)

- **ACC-03 — Cerrar el despliegue de la v2:** publicada el 2026-09-27 (implementación v37). **Falta el smoke con las tres cuentas** (T-06, la checklist se escribe en S9). El CHANGELOG pasa a 2.0.0 cuando se haga. El fallo de Calendar de Esperanza y Aura (B-14) se corrige en S22.
- **ACC-04 — Credenciales del servicio web de SES.Hospedajes** (EXT-04): localizar o volver a pedir el usuario y la contraseña del servicio web, el código de arrendador y el de establecimiento (y los del entorno de pruebas, si los dan). Se guardarán en las *Propiedades del script* (D-32). Bloquea la prueba real (S29).
- **ACC-05 — Responder las preguntas de [DD-02 §5](../docs_dev/solution/design-docs/DD-02-comunicacion-ses-hospedajes.md#5-riesgos-y-preguntas-abiertas):** valores del desplegable `Tipo_Comunicación` del Form; si nacionalidad, país, sexo y tipo de documento son desplegables o texto libre; si la pregunta "Código de reserva de Airbnb" pasa a llamarse "Código de reserva".

### D-34 — Aprobar el diseño de SES (ADR-0018 y DD-02) (bloquea S26–S29)
**Qué hay que decidir (en llano):** si el diseño de la comunicación a SES recoge lo que pediste, para empezar a programarlo.
**Por qué ahora:** sin OK, el ADR sigue *proposed* y no se programa (CLAUDE.md §5.5).

| | A (recomendada): aprobar tal cual | B: aprobar con cambios |
|---|---|---|
| En llano | Se programa según [DD-02](../docs_dev/solution/design-docs/DD-02-comunicacion-ses-hospedajes.md) | Indicas qué cambiar y se corrige antes |
| Pros | Se puede empezar ya por el dominio (S26), que no necesita credenciales | El diseño queda a tu gusto antes de escribir código |
| Contras | Cambios posteriores cuestan más | Retrasa el inicio |

**Si no se decide:** la Fase 2 no empieza.

### D-35 — ¿Cuándo se rediseñan los emails? (F-18)
**Qué hay que decidir:** el diseño ya está acordado (cabecera con color y logo; errores con datos técnicos completos; informes con totales por periodo y comparativas). Falta el calendario.

| | A (recomendada): plantilla común + emails de SES e incidencias en S28; informes con comparativas en S18 | B: todos los emails a la vez en S28 |
|---|---|---|
| Pros | Las comparativas van con el rediseño del informe (F-15) y la ocupación (D-13), que tocan los mismos datos | Todo igual de una vez |
| Contras | Convivirán dos estilos hasta S18 | +4–5 h en S28 y adelanta trabajo de datos que depende de D-13 |

### D-36 — Script de verificación de la trazabilidad (hallazgo de la revisión de cierre)
**Qué hay que decidir:** las reglas generales del usuario piden, en los repos con requisitos trazados, un script que compruebe la reciprocidad ↑/↓, los huérfanos, los estados sin decisión y los enlaces y anclas rotos (referencia: `kaf_finance/docs_work/scripts/verificar_trazabilidad.mjs`). KAF Rent no lo tiene.

| | A (recomendada): adaptarlo del de KAF Finance y meterlo en `npm test` y la CI | B: seguir revisando a mano |
|---|---|---|
| Pros | La revisión 2 deja de depender de la vista; detecta enlaces rotos en cada push | Sin esfuerzo |
| Contras | ~2–3 h; los documentos de KAF Rent tienen otro formato (tablas con ↑/↓), hay que adaptar el analizador | Los fallos de trazabilidad se escapan |

### D-13 — % de ocupación del Informe de Gestión (aplazada por el usuario, bloquea S18)
Hay que cuadrarlo con las noches **ofrecidas**, no solo con las del periodo. Para Airbnb no hace falta entrar en la cuenta: su enlace de calendario (iCal) da lo reservado y lo bloqueado y la app podría leerlo; los demás canales, a revisar uno a uno.

### D-15 — Método de prorrateo del IRPF: validar con datos reales (bloquea S21)
Método **aceptado como provisional** (referencia técnica IRPF §6bis). **Se cierra** al calcular un ejercicio real con los datos de EXT-01.

### D-18 — Desglose pormenorizado de los tipos de gasto (aplazada, bloquea S17)
Revisar juntos, gasto a gasto, la clasificación antes de programar el registro de gastos (F-19). A coordinar con KAF Finance.

### D-23 — Icono del acceso directo en el móvil
Con `setFaviconUrl` el acceso directo de Android sigue sin icono (Chrome toma el de la página exterior de Google). **Propuesta:** página puente estática con manifest (192/512 px) y `apple-touch-icon` que redirige a la app; ADR nuevo; ~2 h. Alternativa: dejarlo así. (El icono **dentro** de la app, en la cabecera, es F-24 y ya está aprobado.)

### D-24 — Recordatorios automáticos (HU-37, bloquea parte de S13)
**Propuesta:** cobro sin ingresar y check-out sin hacer, a los 10 y 15 días de la salida y después cada 7 días hasta cerrarse; a los usuarios con rol Gestión; sin guardar nada.

### Resueltas en esta sesión (2026-10-02) — detalle en [mejoras_2026-10-02.md](docs_mejoras/mejoras_2026-10-02.md)
- **D-21 →** `README.md` se mantiene y entra en el mapa de CLAUDE.md §1.
- **D-22 →** Pistolas de agua sin precio mientras nadie las pida.
- **D-26 →** Calendar: la app suscribe al usuario al calendario operativo, **oculto y sin marcar**, y reintenta; se mantienen las invitaciones (B-14).
- **D-27 →** vídeos grandes: subida directa del navegador a Drive (ADR nuevo en S24); sustituye a B-13.
- **D-28 →** se corrigen las reservas guardadas a 00:00 (B-22).
- **D-29 →** espacio de Drive para vídeos: se deja como está (riesgo R-20 aceptado).
- **D-30 →** KAF Rent lee el Sheet del Google Form de viajeros sin copiar los datos (ADR-0018).
- **D-31 →** la reserva (`RH`) se comunica solo si llega un Form antes del día de entrada; el parte (`PV`) siempre, tras validar; sin anulaciones automáticas (riesgo R-21 aceptado).
- **D-32 →** credenciales de SES en las Propiedades del script (excepción en CLAUDE.md §4.8).
- **D-33 →** sin fotos del documento.
- **TD-01 →** se deja como está. **TD-02 →** una fila por checklist. **B-18, B-19, F-23 a F-28 →** aprobados (§2).
- **Regla nueva:** al pedir una decisión que no estaba en la intervención anterior, Claude vuelve a mostrar su resumen (CLAUDE.md §2.1). **Registro de mejoras por sesión** en `docs_work/docs_mejoras/` (CLAUDE.md §5.1).

---

## §1 Sprints pendientes

Orden propuesto: primero lo que falla en uso real (S22), luego SES (prioridad del usuario), interfaz, calidad y el resto.

| Sprint | Objetivo | Contenido (resumen) | Estimación | Estado |
|---|---|---|---|---|
| **S22** | Calendar, horas y checklists fiables | B-14 (suscripción oculta al calendario) · B-22 + D-28 (horas a 00:00 y corrección de reservas) · F-23 (hora de llegada y salida obligatorias) · B-18 · B-19 (tipo de punto "Daños") · B-21 · TD-02 (una fila por checklist) | 12–14 h | ⏳ Listo para empezar |
| **S26** | SES: dominio | SES-2 de DD-02: casado, viajero, validación, XML `RH`/`PV`, traducción de códigos, clasificación de errores, reintentos; tests unitarios | 6–8 h | ⏳ Tras D-34 |
| **S27** | SES: conexión y datos | SES-3: adaptador SOAP, lectura y escritura del Sheet del Form, hojas nuevas, `procesarComunicacionesSES` | 6–8 h | ⏳ Tras S26 |
| **S28** | SES: pantallas y emails | SES-4: mensaje de WhatsApp (F-27), validar identidades y comunicar (F-28), emails con plantilla común (F-18, según D-35) | 8–10 h | ⏳ Tras S27 + ACC-05 |
| **S29** | SES: prueba real y producción | SES-5: catálogos reales e INE, prueba en pre-ses, paso a producción | 3–4 h | ⏳ Tras S28 + ACC-04 + EXT-02 |
| **S23** | Interfaz móvil como KAF Finance | F-24 (icono en la cabecera) · F-25 (navegación inferior en dos pisos) · F-26 (tabla "Últimas reservas") | 6–8 h | ⏳ Listo para empezar |
| **S9** | Calidad estática y despliegue | T-06 (checklist de smoke) · T-07 (ESLint) · T-08 (scripts npm de clasp) · TD-04 (`dominio_mantenimiento.gs`) · D-36 si se aprueba | 5–7 h | ⏳ Listo para empezar |
| **S24** | Vídeos grandes | D-27: ADR + subida reanudable directa a Drive + parámetro de tamaño (mín. 500 MB) | 5–6 h | ⏳ Listo para empezar |
| **S17** | Registro de gastos | F-19: formulario de tres preguntas + clasificación por pieza y tipo | 7–9 h | ⏳ Bloqueado por D-18 |
| **S18** | Informe de Gestión y emails | F-15 (bloque mensual + análisis de precios) · B-08 y F-05 (ocupación, métricas por zona) · F-18 (informes con totales y comparativas) | 14–16 h | ⏳ Bloqueado por D-13 |
| **S19** | Informe Técnico y chequeo de salud | F-16 · chequeo de salud en real (T-04) · prueba de viabilidad del scraping (F-17) | ~10 h | ⏳ Listo para empezar |
| **S20** | Precios de la competencia | F-17: ADR + lectores por web + aviso de rotura + reconstrucción | 8–12 h | ⏳ Tras S19 |
| **S21** | Informe del IRPF | F-20: informe por copropietario y agregado, con casillas; valida D-15 | 12–16 h | ⏳ Tras S17 + EXT-01 |
| **S13** | Mejoras "Could" | HU-38/RF-80 (editar fechas y canal hasta el check-in) · recordatorios (HU-37, D-24) · reconciliación automática de Calendar (F-04) | 12–18 h | ⏳ Listo salvo recordatorios (D-24) |

**Tareas externas en paralelo:** EXT-01 valores de amortización · EXT-02 revisión RGPD (antes de S29) · EXT-04 credenciales de SES.

---

## §2 Backlog

**Prioridad:** 1 seguridad/datos · 2 defectos Must · 3 habilitadores de calidad · 4 Must/Should pendientes · 5 deuda · 6 Could · 7 fases futuras.

### Defectos (B)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| B-01 | Funciones internas invocables con `google.script.run` sin autorización | RF-05, RNF-20, R-16 | 1 | M | ✅ S8 |
| B-02 | "Buscar Reserva" devolvía también las canceladas | HU-06, RF-11 | 2 | XS | ✅ S8 |
| B-03 | `reescribirServiciosDeReserva` podía perder datos con un fallo intermedio | HU-24, RF-49, RNF-14 | 1 | S | ✅ S8 |
| B-04 | `actualizarReserva` no validaba valores de dominio ni impedía editar canceladas | HU-23, RF-46, RNF-24 | 2 | S | ✅ S8 |
| B-05 | Posible XSS con datos del huésped | RNF-26 | 1 | M | ✅ S8 |
| B-06 | Comentarios obsoletos en `auth.gs` y `gestion.gs` | CLAUDE.md §4.9 | — | XS | ✅ S7 |
| B-07 | La poda de vídeos no borraba las carpetas de reserva vacías | HU-30, RF-70 | 4 | S | ✅ S8 |
| B-08 | Informes sin % de ocupación ni completadas frente a canceladas | HU-32, RF-62 | 4 | M | S18 (tras D-13) |
| B-09 | El evento de Calendar no se actualizaba al editar el nombre del huésped | HU-19, RF-41 | 4 | S | ✅ S8 |
| B-10 | Nombres de espacio e IDs en el código | RNF-23, RNF-27 | 5 | M | ✅ S8 |
| B-11 | Evento de Calendar huérfano si fallaba la escritura | RF-36, RNF-14 | 2 | XS | ✅ S8 |
| B-12 | Contrastes WCAG AA y áreas táctiles (queda la auditoría axe) | HU-25, HU-28, RNF-12 | 4 | S | ✅ S11 (axe: backlog) |
| B-13 | El cliente fija en 100 MB el máximo de vídeo. **Sustituido por D-27:** con vídeos de ≥ 300 MB el límite real es el de Apps Script (~50 MB por envío), no la cifra | RNF-27 | 6 | XS | → S24 |
| B-14 | **Reabierto (2026-10-02).** "Calendar_Id no encontrado" al crear reservas con Esperanza y Aura (incidencia del 28/09, reserva 15/26). El calendario está bien compartido; `getCalendarById` devuelve `null` si el usuario no lo tiene en su lista. Corrección (D-26): suscribir al usuario oculto y sin marcar y reintentar | RF-36, RF-82, ADR-0017 | 1 | S | **S22** |
| B-15 | La referencia usaba el año de entrada | RF-31, ADR-0014 | 2 | XS | ✅ S14 |
| B-16 | "Reparar hojas" reescribía cabeceras existentes | RF-72, R-19, D-19 | 1 | S | ✅ S14 |
| B-17 | Tablas que ensanchaban la página en móvil | RNF-11 | 2 | XS | ✅ S11 |
| B-18 | Si se edita una checklist terminada y queda un punto pendiente, sigue "Hecho"; debe volver a "sin terminar" | RF-85 | 5 | XS | **S22** |
| B-19 | El aviso de daños depende de que el punto empiece por "Sin daños" ("Cojines sin daños" no avisa). Corrección aprobada: tipo de punto **"Daños"** con dos opciones (Sin daños / Con daños) en los 4 puntos | RF-85 | 5 | S | **S22** |
| B-20 | En producción v1, `gastos_interfaz.html` era una copia de Gestionar | HU-33 | 2 | XS | ✅ Despliegue v2 |
| B-21 | En Gestionar, el código de reserva del canal solo se valida en el servidor | RF-88 | 6 | XS | **S22** |
| B-22 | Las horas de la Habitación se guardan a 00:00: Sheets convierte "16:00" de `Config` en un valor de hora y `combinarFechaHora_` espera texto. Afecta a pantalla, eventos y solapamiento. Incluye corregir las reservas guardadas (D-28) | HU-11, RF-20, ADR-0003 | 2 | S | **S22** |
| B-23 | Eventos duplicados dentro del mismo calendario (causa sin investigar) | RF-36, RF-40 | 4 | S | Backlog (aparcado por el usuario) |
| B-24 | Los otros usuarios no ven las modificaciones del último día; hipótesis: el usuario entra por `/dev` y ellos por la v37 | ADR-0015 | 4 | XS | Backlog (aparcado por el usuario) |

### Tests (T)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| T-01 | Arnés unitario | RNF-29 | 3 | M | ✅ S8 |
| T-02 | Tests unitarios del dominio | RNF-29 | 3 | L | ✅ S8 |
| T-03 | GitHub Actions | RNF-29, RNF-33 | 3 | S | ✅ S8 |
| T-04 | Integración: chequeo de salud de solo lectura en producción | RNF-29 | 3 | M | S19 |
| T-05 | E2E con Playwright | RNF-08, RNF-11 | 3 | L | ✅ S11 |
| T-06 | Checklist de smoke post-despliegue en DEVELOPMENT.md; Claude la recuerda en cada publicación | RNF-19, RNF-20 | 3 | XS | S9 |
| T-07 | ESLint (aprobado 2026-10-02): `devDependency`, `eslint.config.js`, `npm run lint`, en la CI; apartado en DEVELOPMENT.md | RNF-28 | 3 | S | S9 |
| T-08 | clasp: `.clasp.json` y comparación hechos (2026-09-27); faltan los scripts `npm run push` / `deploy` con `--user familia` (los lanza el usuario) | ADR-0015, RNF-27 | 3 | S | S9 |

### Deuda técnica (REF / TD) — detalle en [arc42 §11.2](../docs_dev/solution/arc42.md#112-deuda-técnica)

| ID | Descripción | Prio | Talla | Sprint |
|---|---|---|---|---|
| REF-01 a REF-04 | Importes únicos, columnas por esquema, envoltorio de endpoint, funciones cortas | 5 | — | ✅ S8 |
| TD-01 | `registrarLog_`/`registrarError_` escriben en el orden del esquema | 5 | XS | Aceptada (2026-10-02) |
| TD-02 | `Registro_Checklist` se reescribe entera; pasa a **una fila por checklist** en hoja nueva (la actual no tiene filas: sin migración) | 5 | S | **S22** |
| TD-03 | `Config.Calendar_Url` repite `Calendar_Id` | 6 | XS | Backlog |
| TD-04 | Funciones puras de las copias a `dominio_mantenimiento.gs` (aprobado) | 5 | XS | S9 |

### Funcionalidades (F / HU)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| F-01 | Editar canal y fechas hasta el check-in (sin cambio de espacio) | HU-38, RF-80, ADR-0005 | 6 | L | S13 |
| F-02 | Recordatorios automáticos de reservas sin cerrar | HU-37, RF-79 | 6 | L | S13 (D-24) |
| F-03 | Incidencias y mantenimiento no ligados a una reserva — requiere discovery | antiguo SDD §5.7 | 6 | ? | Backlog |
| F-04 | Reconciliación automática periódica de Calendar | ADR-0010 | 6 | S | S13 |
| F-05 | Métricas adicionales por zona | ADR-0009 | 4 | M | S18 |
| F-06 | Exportar a CSV o Excel | Backlog v0.5 | 7 | M | Futuro |
| F-07 | Vista de informes históricos en la app | Backlog v0.5 | 7 | M | Futuro |
| F-08 | Bot de Telegram como canal de aviso | ADR-0006 | 7 | M | Futuro |
| F-09 | Copia externa periódica y archivo de filas purgadas | ADR-0013, R-14 | 7 | M | Futuro |
| F-10 | Catálogo de tipos de documento | ADR-0014 | 6 | S | Backlog |
| F-11 | Roles Admin, Gestión, Soporte, Sistema | ADR-0001 | 6 | M | ✅ S15 (RF-84); roles asignados en el Sheet el 2026-09-27 (ACC-03) |
| F-12 | Logotipo, iconos y maquetas de alta fidelidad | design-system §9 | 6 | M | Backlog |
| F-13 | Invitaciones de Calendar a los usuarios con permiso de gestión | ADR-0010 | 4 | S | ✅ S14 (RF-83); se mantienen (D-26) |
| F-14 | Checklists digitales | HU-24 | 4 | L | ✅ S16 |
| F-15 | Informe de Gestión: bloque mensual + análisis de precios | HU-32, ADR-0009 | 4 | M | S18 |
| F-16 | Informe Técnico (KPIs de salud, solo Soporte/Admin) | F-11 | 4 | M | S19 |
| F-17 | Precios de la competencia por scraping propio, tras prueba de viabilidad | F-15 | 6 | S + M/L | S19–S20 |
| F-18 | Rediseño de los emails: plantilla común con color y logo; errores con datos técnicos completos; informes con totales por periodo y comparativas | ADR-0006 | 5 | M | S28 + S18 (D-35) |
| F-19 | Registro de gastos | ADR-0012, D-18 | 4 | M | S17 |
| F-20 | Informe del IRPF por copropietario | ADR-0012, D-15 | 4 | L | S21 |
| F-21 | Avisos y errores en ventana modal + "Enviar al administrador" | HU-39, RF-81, RF-82 | 1 | M | ✅ S14 |
| F-22 | Código de reserva del canal | HU-40, RF-88 | 4 | S | ✅ 2026-09-27 |
| F-23 | Hora de llegada y de salida obligatorias en los dos espacios (Habitación, prerrellenas con `Config`) | HU-11, RF-20, ADR-0003 | 4 | M | **S22** |
| F-24 | Icono de la app en la cabecera, como KAF Finance | design-system | 6 | XS | S23 |
| F-25 | Navegación inferior en dos pisos: Inicio · Reservas · Checklists · Gastos · Estadísticas; Reservas abre Gestionar / Crear | HU-05, ADR-0008, design-system | 6 | M | S23 |
| F-26 | "Últimas reservas": Espacio corto (`Nombre_Corto` en `Catálogo_Espacios`) · Código de reserva del canal · Nombre · Inicio y Fin `dd/mm/aa hh:mm` · Importe Neto; botón "Ver calendario" | HU-04 | 6 | S | S23 |
| F-27 | Botón "Mensaje para el huésped" (WhatsApp) con el enlace al Form prerrellenado | ADR-0018, DD-02 | 4 | S | S28 |
| F-28 | Validación presencial de identidades en Gestionar (Habitación) → comunicación a SES | ADR-0018, DD-02, HU-35, HU-36 | 4 | L | S26–S29 |

### Tareas externas (EXT)

| ID | Descripción | Ref. |
|---|---|---|
| EXT-01 | Datos para validar el IRPF: valor de construcción, instalaciones exteriores, mobiliario, gastos reales | ADR-0012, D-15 |
| EXT-02 | Revisión RGPD: registro de actividades (art. 30), retención de datos de huéspedes y viajeros; antes de S29 | RNF-35, RNF-37, R-03, R-11 |
| EXT-03 | ~~UAT de los journeys~~ → hecho de facto (D-07) | RNF-08, R-10 |
| EXT-04 | Credenciales del servicio web de SES.Hospedajes (ACC-04) | ADR-0018 |

---

## §3 Histórico de sprints completados

| Sprint | Contenido | Versión | Hito |
|---|---|---|---|
| S0 | Discovery y diseño (PRD ágil, SDD, ADR-0001 a 0006) | 0.5.0 (2026-06-22) | — |
| S1 | Infraestructura, autenticación, shell, esquema del Sheet | 1.0.0 | M1 ✅ |
| S2 | Inicio y formulario Crear Reserva (parte I) | 0.9 → 1.0.0 | — |
| S3 | Fechas, solapamientos, importes, guardado, avisos | 1.0.0 | M2 ✅ |
| S4 | Gestionar Reserva | 1.0.0 | M3 ✅ |
| S5 | Estadísticas, mantenimiento nocturno, informes | 1.0.0 (2026-06-29) | — |
| S6 | Gastos e IRPF | 1.0.0 | — |
| v1.1 | Coste fijo del canal, Personas, `USER_DEPLOYING`, reconciliación de Calendar | 1.1.0 (2026-07-27) | — |
| S7 | Reorganización documental | 2.0.0 (en curso) | — |
| S8 + S10 | Código en capas, seguridad, defectos, tests y CI + revisión de cierre | 2.0.0 (en curso) | — |
| S14 | Calendar y reservas fiables (B-14 código, B-15, B-16, F-13, F-21) | 2.0.0 | — |
| S11 | Tests de interfaz: E2E con Playwright, contrastes y áreas táctiles | 2.0.0 | — |
| S15 | Roles (F-11) y plantilla de design doc | 2.0.0 | — |
| S16 | Checklists digitales (F-14, DD-01) | 2.0.0 | — |
| Despliegue v2 | clasp, copias abuelo-padre-hijo, código de reserva del canal, ejecutar como quien accede; v2 publicada (implementación v37). El smoke (T-06) pasa a S9 | 2.0.0 (publicada 2026-09-27) | M4 ✅ |
| SES-0 + SES-1 | Prueba de conexión a SES desde Apps Script (conecta validando el certificado); referencia técnica corregida (`RH` **y** `PV`); ADR-0018 (*proposed*) y DD-02 (borrador) | — (solo documentación, 2026-10-02) | — |

---

## §4 Cómo se regenera este documento

Lo hace Claude al cierre de cada sesión, después de la doble revisión ([CLAUDE.md §2.2–§2.4](../CLAUDE.md)):

1. **§0:** decisiones abiertas con el formato de CLAUDE.md §2.1; se quitan las resueltas (la resolución queda en el CHANGELOG, en un ADR o en el registro de mejoras de la sesión).
2. **§2:** se recorren las fuentes y se añade o cierra cada ítem con su ID estable:
   - HU con estado distinto de ✅ ([02](../docs_dev/discovery/02_historias_usuario.md)); RF y RNF con estado distinto de ✅ ([03](../docs_dev/discovery/03_requisitos_funcionales.md), [04](../docs_dev/discovery/04_requisitos_no_funcionales.md)).
   - Hallazgos de la revisión (B-NN) y deuda de arc42 §11.2.
   - "Cuestiones abiertas" de cada ADR.
   - Riesgos abiertos con acción (arc42 §11.1) y tareas externas.
   - El registro de mejoras de la sesión ([docs_mejoras/](docs_mejoras/)).
3. **§1:** se reagrupa el backlog en sprints por orden de prioridad, con un objetivo por sprint y un tamaño manejable (orientativo ≤ 20 h), sin fecha fija.
4. **§3:** los sprints terminados pasan al histórico con su versión.
