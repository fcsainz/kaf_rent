# Próximos pasos — KAF Rent

**Actualizado:** 2026-10-03, revisión previa al commit: S31–S34 (DD-03, rediseño de Reservas) implementados, subidos a `/dev` y probados por el usuario; **falta implementarlos** (producción sigue en la versión 39). Registro en [mejoras_2026-10-03.md](docs_mejoras/mejoras_2026-10-03.md); valoración en [valor_dev.md](valor_dev.md) (v1.2).  
**Framework:** Scrum adaptado a un desarrollador único: **sprints por objetivo, sin duración fija** (se trabajan en ratos libres y se cierran al cumplir el objetivo), backlog priorizado y tallas convertidas a horas ([CLAUDE.md §2.4](../CLAUDE.md))  
**Sustituye a:** el antiguo `09_roadmap.md` de discovery (ya no existe)

> Documento **regenerado al cierre de cada sesión** a partir de las decisiones abiertas, los HU/RF/RNF no terminados, los defectos y la deuda, las cuestiones abiertas de los ADR y los riesgos (§4). Al retomar el trabajo, Claude muestra primero §0 y §1.

---

## §0 Decisiones pendientes del usuario

### Acciones manuales pendientes (no son decisiones)

- **ACC-08 — URGENTE: implementar una versión nueva.** Producción está en la versión **39** ("v3.1 Mejora Interfaces"), creada con el código que tenía B-28: **Gestionar y Estadísticas no cargan** para Esperanza y Aura. El código corregido está en `/dev` y probado. `npm run deploy` o *Gestionar implementaciones → Nueva versión*.
- **ACC-09 — Smoke de DD-03 tras implementar** (DEVELOPMENT.md, apartado DD-03): sobre todo "Ver calendario" en los móviles Android (R-25) y, al día siguiente, que lleguen bien los avisos de cobro y de check-in/out. Comprueba también que `instalarTriggers` se ejecutó (en el editor, *Activadores*: deben salir `avisosDeCobro` y `avisosDeChecklist`).
- **ACC-10 — Revisar a mano el Sheet del Form de viajeros** (el usuario lo hace): fila 7 "Hmk xp9b8c" (le falta la N; no casa con Len Gibbs, HMKNXP9B8C) · filas 5–6 HMHB2NK3MR sin reserva con ese código · filas 9–10 con fecha de comunicación "02/09/2026", anterior a la reserva.
- **ACC-03 — Cerrar el despliegue de la v2:** implementada de nuevo el 2026-10-02 con S22–S28. El usuario hizo la prueba en su móvil ("todo ok"). **Falta comprobar B-14 con Esperanza y Aura:** que cada una cree una reserva de prueba de Piscina / Jardín y aparezca en el calendario. Hecho eso, el CHANGELOG pasa a 2.0.0.
- **ACC-06 — Primera reserva real de la Habitación (verificación de SES en producción, S29):**
  1. Cuando llegue el Form del huésped, debe llegar el email "✓ SES Reserva" o "✕".
  2. En el check-in: validar a cada huésped → *Comunicar parte* → email "✓ SES Huéspedes".
  3. Reenviar a Claude cualquier email ✕.

  Las dos respuestas enviadas con "DNI" antes de D-42 se comunican como NIF.

- ~~ACC-07 — Puesta al día antes de implementar DD-03~~ ✅ 2026-10-03: *Reparar hojas*, `ponerAlDiaReservas` (reservas pasadas con check-in/out hechos y "Cerrada") y `Tamano_Max_Contrato_MB` = 15, comprobados en el Sheet.

### D-13 — % de ocupación del Informe de Gestión (aplazada por el usuario, bloquea S18)
Hay que cuadrarlo con las noches **ofrecidas**, no solo con las del periodo. Para Airbnb no hace falta entrar en la cuenta: su enlace de calendario (iCal) da lo reservado y lo bloqueado y la app podría leerlo; los demás canales, a revisar uno a uno.

### D-15 — Método de prorrateo del IRPF: validar con datos reales (bloquea S21)
Método **aceptado como provisional** (referencia técnica IRPF §6bis). **Se cierra** al calcular un ejercicio real con los datos de EXT-01.

### D-18 — Desglose pormenorizado de los tipos de gasto (aplazada, bloquea S17)
Revisar juntos, gasto a gasto, la clasificación antes de programar el registro de gastos (F-19). A coordinar con KAF Finance.

### D-23 — Icono del acceso directo en el móvil
Con `setFaviconUrl` el acceso directo de Android sigue sin icono (Chrome toma el de la página exterior de Google). **Propuesta:** página puente estática con manifest (192/512 px) y `apple-touch-icon` que redirige a la app; ADR nuevo; ~2 h. Alternativa: dejarlo así. (El icono **dentro** de la app, en la cabecera, es F-24 y ya está aprobado.)

### D-46 — Número de versión del CHANGELOG
**Qué hay que decidir (en llano):** el CHANGELOG sigue diciendo "en curso hacia 2.0.0", pero los commits se llaman "v3 SES" y la implementación de producción "v3.1 Mejora Interfaces".
**Por qué ahora:** al commitear conviene que el CHANGELOG y los nombres coincidan (ACC-03 decía que el CHANGELOG pasaría a 2.0.0).

| | A — Cerrar 2.0.0 y abrir 3.x (recomendada) | B — Seguir llamándolo 2.0.0 |
|---|---|---|
| En llano | Lo publicado hasta el 2026-10-02 queda como **2.0.0** y lo de SES + DD-03 como **3.0.0**/**3.1.0**, como ya lo nombras tú | Todo sigue "hacia 2.0.0" |
| Pros | El CHANGELOG coincide con commits e implementaciones | Nada que cambiar |
| Contras | Reordenar las secciones del CHANGELOG (≈ 0,5 h) | Los nombres seguirán sin cuadrar |

**Recomendación:** A.

### Resueltas el 2026-10-03
D-24 (recordatorios → F-37 y F-40), D-43 (avisos solo por email), D-44 (calendario en la app de Android), D-45 (la ficha lee lo comunicado a SES a mano), Q-01 a Q-16, DI-01 a DI-26, DD-03 aprobado y ADR-0023 aceptado: detalle en [mejoras_2026-10-03.md](docs_mejoras/mejoras_2026-10-03.md).

### Resueltas el 2026-10-02
D-21, D-22, D-26 a D-35 y D-37 a D-42, más la activación de SES en producción y D-36 (aprobada como T-09): detalle en [mejoras_2026-10-02.md](docs_mejoras/mejoras_2026-10-02.md) y en el [CHANGELOG](../CHANGELOG.md).

---

## §1 Sprints pendientes

Orden propuesto: implementar y probar DD-03 (ACC-08, ACC-09), seguir con los puntos 2 a 5 pedidos el 2026-10-03 (S35), verificar SES en uso real (S29), calidad (S30) y el resto por prioridad.

| Sprint | Objetivo | Contenido (resumen) | Estimación | Estado |
|---|---|---|---|---|
| **S35** | Mejoras pedidas el 2026-10-03, puntos 2 a 5 | 2 · orden de los ficheros del repo · 3 · hojas del Sheet · 4 · copias de seguridad · 5 · informes. Cada uno: diagnóstico → decisiones → implementación | Por estimar tras el diagnóstico | ⏳ Siguiente, tras ACC-08 |
| **S29** | SES: verificación en producción | ACC-06: comprobar con la primera reserva real la comunicación de la reserva (RH), el parte (PV) y la consulta del lote; la anulación, en la primera cancelación · B-26 (mensaje de los errores 5xx) · corregir lo que salga | 2–3 h | ⏳ Con la primera reserva real de la Habitación |
| **S30** | Calidad: trazabilidad y E2E pendientes | T-09 (script de verificación en `npm test`; en la revisión del 2026-10-03 se hizo a mano y salió un descuadre) · T-10 (E2E de F-27, F-29 y F-30; F-28 ya cubierto por los de DD-03) · B-25 (`describirFormulario` y las fechas obligatorias) · TD-05 (funciones largas del cliente) | 8–11 h | ⏳ Listo para empezar (aprobado; TD-05 pendiente de OK) |
| **S24** | Vídeos grandes | D-27: ADR + subida reanudable directa a Drive + parámetro de tamaño (mín. 500 MB) | 5–6 h | ⏳ Listo para empezar |
| **S19** | Informe Técnico y chequeo de salud | F-16 · chequeo de salud en real (T-04) · prueba de viabilidad del scraping (F-17) | ~10 h | ⏳ Listo para empezar |
| **S20** | Precios de la competencia | F-17: ADR + lectores por web + aviso de rotura + reconstrucción | 8–12 h | ⏳ Tras S19 |
| **S17** | Registro de gastos | F-19: formulario de tres preguntas + clasificación por pieza y tipo | 7–9 h | ⏳ Bloqueado por D-18 |
| **S18** | Informe de Gestión | F-15 (bloque mensual + análisis de precios) · B-08 y F-05 (ocupación, métricas por zona) | 12–14 h | ⏳ Bloqueado por D-13 |
| **S21** | Informe del IRPF | F-20: informe por copropietario y agregado, con casillas; valida D-15 | 12–16 h | ⏳ Tras S17 + EXT-01 |
| **S13** | Mejoras "Could" | HU-38/RF-80 (editar fechas y canal hasta el check-in) · reconciliación automática de Calendar (F-04); los recordatorios pasan a S34 (F-37, F-40) | 8–12 h | ⏳ Listo para empezar |

**Tareas externas en paralelo:** EXT-01 valores de amortización · EXT-02 revisión RGPD (SES ya está activo: comunicar es una obligación legal, art. 6.1.c RGPD; queda revisar el registro de actividades y la retención).

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
| B-14 | **Reabierto (2026-10-02).** "Calendar_Id no encontrado" al crear reservas con Esperanza y Aura (incidencia del 28/09, reserva 15/26). El calendario está bien compartido; `getCalendarById` devuelve `null` si el usuario no lo tiene en su lista. Corrección (D-26): suscribir al usuario oculto y sin marcar y reintentar. **Hecho en código (2026-10-02, `suscribirCalendarioOculto_`); falta el smoke con Esperanza y Aura** | RF-36, RF-82, ADR-0017 | 1 | S | ✅ S22 (falta comprobarlo con Esperanza y Aura, ACC-03) |
| B-15 | La referencia usaba el año de entrada | RF-31, ADR-0014 | 2 | XS | ✅ S14 |
| B-16 | "Reparar hojas" reescribía cabeceras existentes | RF-72, R-19, D-19 | 1 | S | ✅ S14 |
| B-17 | Tablas que ensanchaban la página en móvil | RNF-11 | 2 | XS | ✅ S11 |
| B-18 | Si se edita una checklist terminada y queda un punto pendiente, sigue "Hecho"; debe volver a "sin terminar". **Hecho (2026-10-02)** | RF-85 | 5 | XS | ✅ S22 |
| B-19 | El aviso de daños depende de que el punto empiece por "Sin daños" ("Cojines sin daños" no avisa). Corrección aprobada: tipo de punto **"Daños"** con dos opciones (Sin daños / Con daños) en los 4 puntos. **Hecho (2026-10-02); `Tipo` y textos de los 4 puntos cambiados en el Sheet al implementar** | RF-85 | 5 | S | ✅ S22 |
| B-20 | En producción v1, `gastos_interfaz.html` era una copia de Gestionar | HU-33 | 2 | XS | ✅ Despliegue v2 |
| B-21 | En Gestionar, el código de reserva del canal solo se valida en el servidor. **Hecho (2026-10-02)** | RF-88 | 6 | XS | ✅ S22 |
| B-22 | Las horas de la Habitación se guardan a 00:00: Sheets convierte "16:00" de `Config` en un valor de hora y `combinarFechaHora_` espera texto. Afecta a pantalla, eventos y solapamiento. Incluye corregir las reservas guardadas (D-28). **Hecho (2026-10-02): `obtenerConfigHora_` + tarea `corregirHorasReservas`, ejecutada al implementar** | HU-11, RF-20, ADR-0003, ADR-0019 | 2 | S | ✅ S22 |
| B-23 | Eventos duplicados dentro del mismo calendario (causa sin investigar) | RF-36, RF-40 | 4 | S | Backlog (aparcado por el usuario) |
| B-24 | Los otros usuarios no ven las modificaciones del último día; hipótesis: el usuario entra por `/dev` y ellos por la v37 | ADR-0015 | 4 | XS | Backlog (aparcado por el usuario) |
| B-25 | `describirFormulario` (script del Form) no marca con `*` las preguntas obligatorias de tipo fecha; el informe parece decir que no lo son | ADR-0021 | 6 | XS | S30 |
| B-27 | "Ver calendario" sacaba de la app sin forma de volver (D-44: app de Calendar en Android) | RF-12, HU-07 | 4 | XS | ✅ S31 (falta el smoke en Android, ACC-09) |
| B-28 | En Apps Script, Gestionar y Estadísticas no cargaban: Google quita como comentario lo que sigue a `//` dentro de las cadenas con comillas invertidas y el enlace `intent://` rompía el script. Corregido + test de plantillas + la ventana de "trabajando" ya no se queda abierta si una llamada falla | RF-12, RNF-13 | 1 | S | ✅ 2026-10-03 (en `/dev`; producción tras ACC-08) |
| B-26 | La comprobación de conexión con SES dice "respuesta inesperada" ante un error 5xx; debería decir que SES está fallando y que no es cosa de las credenciales, y guardar en `Logs` el inicio de la respuesta | RF-96 | 5 | XS | S29 |

### Tests (T)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| T-01 | Arnés unitario | RNF-29 | 3 | M | ✅ S8 |
| T-02 | Tests unitarios del dominio | RNF-29 | 3 | L | ✅ S8 |
| T-03 | GitHub Actions | RNF-29, RNF-33 | 3 | S | ✅ S8 |
| T-04 | Integración: chequeo de salud de solo lectura en producción | RNF-29 | 3 | M | S19 |
| T-05 | E2E con Playwright | RNF-08, RNF-11 | 3 | L | ✅ S11 |
| T-06 | Checklist de smoke post-despliegue en DEVELOPMENT.md; Claude la recuerda en cada publicación. **Hecho (2026-10-02)** | RNF-19, RNF-20 | 3 | XS | **S9** ✅ |
| T-07 | ESLint (aprobado 2026-10-02): `devDependency`, `eslint.config.js`, `npm run lint`, en la CI; apartado en DEVELOPMENT.md. **Hecho (2026-10-02)**; no analiza el JS de los `.html` | RNF-28 | 3 | S | **S9** ✅ |
| T-08 | clasp: `.clasp.json` y comparación hechos (2026-09-27); scripts `npm run push` (tests + lint + push) y `npm run deploy` (ID en `KAF_RENT_ID_IMPLEMENTACION`). **Hecho (2026-10-02)** | ADR-0015, RNF-27 | 3 | S | **S9** ✅ |
| T-09 | Script de verificación de trazabilidad (regla global; referencia `kaf_finance/docs_work/scripts/verificar_trazabilidad.mjs`): reciprocidad HU↔RF↔RNF, huérfanos, estados sin decisión, enlaces y anclas rotos; dentro de `npm test`. **Aprobado (2026-10-02, antes D-36)** | Revisión de cierre 2026-10-02 | 3 | S | S30 |
| T-10 | E2E de las pantallas nuevas de la v2 (DoD de release, CLAUDE.md §8.3): registro de viajeros (F-28), mensaje al huésped (F-27), ventana de "trabajando" (F-29) y comprobar conexión (F-30). Se implementó sin ellos (revisión de cierre 2026-10-02); el escenario `/__test/viajeros` del servidor E2E ya existe | RNF-29, CLAUDE.md §8.3 | 3 | M | S30 |

### Deuda técnica (REF / TD) — detalle en [arc42 §11.2](../docs_dev/solution/arc42.md#112-deuda-técnica)

| ID | Descripción | Prio | Talla | Sprint |
|---|---|---|---|---|
| REF-01 a REF-04 | Importes únicos, columnas por esquema, envoltorio de endpoint, funciones cortas | 5 | — | ✅ S8 |
| TD-01 | `registrarLog_`/`registrarError_` escriben en el orden del esquema | 5 | XS | Aceptada (2026-10-02) |
| TD-02 | `Registro_Checklist` se reescribe entera; pasa a **una fila por checklist** en hoja nueva (la actual no tiene filas: sin migración). **Hecho (2026-10-02, ADR-0020): hoja `Checklists_Reserva`; `Registro_Checklist` borrada al implementar** | 5 | S | ✅ S22 |
| TD-03 | `Config.Calendar_Url` repite `Calendar_Id` | 6 | XS | Backlog |
| TD-04 | Funciones puras de las copias a `dominio_mantenimiento.gs` (aprobado). **Hecho (2026-10-02)** | 5 | XS | **S9** ✅ |
| TD-05 | Funciones del cliente de más de ~30 líneas (CLAUDE.md §4.5), anteriores a esta sesión: `renderChecklist`, `filaPunto`, `controlArchivo`, `renderEditor` (checklist), `crearItemServicio`, `validarFormulario`, `crearDialogo` (cliente). Dividirlas es una refactorización: **pendiente de OK** | 5 | S | S30 (si se aprueba) |

### Funcionalidades (F / HU)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| F-01 | Editar canal y fechas hasta el check-in (sin cambio de espacio) | HU-38, RF-80, ADR-0005 | 6 | L | S13 |
| F-02 | Recordatorios automáticos de reservas sin cerrar. **Sustituido por F-37 y F-40 (2026-10-03)** | HU-37, RF-79 | 6 | L | → **S34** |
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
| F-16 | Informe Técnico (KPIs de salud, solo Soporte/Admin). Debe incluir los errores técnicos del mes de la hoja `Errores`, incluidos los de SES no avisados por email (usuario, 2026-10-02) | F-11, DD-02 §3.5 | 4 | M | S19 |
| F-17 | Precios de la competencia por scraping propio, tras prueba de viabilidad | F-15 | 6 | S + M/L | S19–S20 |
| F-18 | Rediseño de los emails: plantilla común con color y logo; errores con datos técnicos completos; informes con totales por periodo y comparativas. **Plantilla aplicada a todos los emails, con comparativa en los informes (D-41) y "Validado por" en el parte comunicado (2026-10-02, S28)** | ADR-0006 | 5 | M | **S28** ✅ + S18 (D-35) |
| F-19 | Registro de gastos | ADR-0012, D-18 | 4 | M | S17 |
| F-20 | Informe del IRPF por copropietario | ADR-0012, D-15 | 4 | L | S21 |
| F-21 | Avisos y errores en ventana modal + "Enviar al administrador" | HU-39, RF-81, RF-82 | 1 | M | ✅ S14 |
| F-22 | Código de reserva del canal | HU-40, RF-88 | 4 | S | ✅ 2026-09-27 |
| F-23 | Hora de llegada y de salida obligatorias en los dos espacios (Habitación, prerrellenas con `Config`). **Hecho (2026-10-02, ADR-0019)** | HU-10, HU-11, RF-19, RF-20, ADR-0019 | 4 | M | ✅ S22 |
| F-24 | Icono de la app en la cabecera, como KAF Finance | design-system | 6 | XS | **S23** ✅ |
| F-25 | Navegación inferior en dos pisos: Inicio · Reservas · Checklists · Gastos · Estadísticas; Reservas abre Gestionar / Crear | HU-05, ADR-0008, design-system | 6 | M | **S23** ✅ |
| F-26 | "Últimas reservas": Espacio corto (`Nombre_Corto` en `Catálogo_Espacios`) · Código de reserva del canal · Nombre · Inicio y Fin `dd/mm/aa hh:mm` · Importe Neto; botón "Ver calendario" | HU-04 | 6 | S | **S23** ✅ |
| F-27 | Botón "Mensaje para el huésped" (WhatsApp) con el enlace al Form prerrellenado. **Hecho (2026-10-02, RF-93)** | ADR-0018, DD-02 | 4 | S | ✅ S28 |
| F-28 | Validación presencial de identidades en Gestionar (Habitación) → comunicación a SES. **Hecho (2026-10-02, RF-94)** | ADR-0018, DD-02, HU-35, HU-36 | 4 | L | ✅ S28 (verificación en producción: S29) |
| F-29 | Ventana de "trabajando" en toda la app mientras espera al servidor (usuario, 2026-10-02). **Hecho (RF-95)** | RNF-09 | 4 | S | **S28** ✅ |
| F-30 | Comprobar la conexión con SES (solo lectura): menú del Sheet + botón de Inicio solo para Admin (usuario, 2026-10-02). **Hecho (RF-96)**; desde S31, en el menú Admin | ADR-0018 | 4 | S | **S28** ✅ |
| F-31 a F-45 | Rediseño de Reservas (DD-03): menú Admin, Inicio "de un vistazo", barra de Reservas, filtros y tarjetas paginadas, ficha propia, funciones Checklist / Identidades / Contrato / Extras, avisos de cobro y de check-in/out, contrato en fotos (ADR-0023), cobro de servicios (plataforma o presencial), puesta al día. Detalle en [mejoras_2026-10-03](docs_mejoras/mejoras_2026-10-03.md) | DD-03, HU-41 a HU-43, RF-97 a RF-103 | 4 | L×4 | ✅ S31–S34 (producción tras ACC-08) |

### Tareas externas (EXT)

| ID | Descripción | Ref. |
|---|---|---|
| EXT-01 | Datos para validar el IRPF: valor de construcción, instalaciones exteriores, mobiliario, gastos reales | ADR-0012, D-15 |
| EXT-02 | Revisión RGPD: registro de actividades (art. 30), retención de datos de huéspedes y viajeros; antes de S29 | RNF-35, RNF-37, R-03, R-11 |
| EXT-03 | ~~UAT de los journeys~~ → hecho de facto (D-07) | RNF-08, R-10 |
| EXT-04 | ~~Credenciales del servicio web de SES.Hospedajes (ACC-04)~~ ✅ 2026-10-02 | ADR-0018 |

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
| S22 | Calendar, horas y checklists fiables (B-14, B-18, B-19, B-21, B-22 + D-28, F-23, TD-02; ADR-0019, ADR-0020) | 2.0.0 (implementada 2026-10-02) | — |
| S23 | Interfaz móvil como KAF Finance (F-24, F-25, F-26) | 2.0.0 (implementada 2026-10-02) | — |
| S9 | Calidad estática y despliegue (T-06, T-07 ESLint, T-08 scripts de clasp, TD-04) | 2.0.0 (implementada 2026-10-02) | — |
| S26–S28 | SES.Hospedajes: dominio, conexión, Form con script propio (ADR-0021), anulación al cancelar (ADR-0022), validación presencial (F-28), WhatsApp (F-27), ventana de "trabajando" (F-29), comprobar conexión (F-30), emails con plantilla (D-35, D-41) | 2.0.0 (implementada 2026-10-02; SES activo en producción) | M5 ✅ |
| S31–S34 | Rediseño de Reservas (DD-03): navegación y menú Admin, Inicio, Gestionar en tarjetas, ficha, funciones de la barra, avisos, contrato en fotos, cobro de servicios, puesta al día; B-27, B-28, D-45; `npm run demo` | 3.x (subido a `/dev` y probado el 2026-10-03; implementación pendiente, ACC-08) | — |

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
