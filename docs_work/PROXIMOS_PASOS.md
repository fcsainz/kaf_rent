# Próximos pasos — KAF Rent

**Actualizado:** 2026-09-26 (cierre de sesión: referencias legales SES.Hospedajes e IRPF, recogida de funcionalidades v2-N y doble revisión)  
**Framework:** Scrum adaptado a un desarrollador único: **sprints por objetivo, sin duración fija** (se trabajan en ratos libres y se cierran al cumplir el objetivo), backlog priorizado y tallas convertidas a horas ([CLAUDE.md §2.4](CLAUDE.md))  
**Sustituye a:** `docs/discovery/09_roadmap.md`

> Documento **regenerado al cierre de cada sesión** a partir de las decisiones abiertas, los HU/RF/RNF no terminados, los defectos y la deuda, las cuestiones abiertas de los ADR y los riesgos (§4). Al retomar el trabajo, Claude muestra primero §0 y §1.

---

## §0 Decisiones pendientes del usuario

### Acciones manuales pendientes (no son decisiones)

- **ACC-01 — Borrar el repositorio git vacío exterior.** `~/Workspace/kaf_rent/.git` no tiene ningún commit y envuelve al repo real. Aprobado; la herramienta no me dejó ejecutarlo:
  ```bash
  rm -rf ~/Workspace/kaf_rent/.git
  ```
- **ACC-02 — Dar de alta clasp con tus dos cuentas** (D-02 resuelta, [ADR-0015](docs_dev/solution/adr/0015-despliegue-con-clasp-multicuenta.md)). Solo lo puedes hacer tú, porque abre el navegador para autorizar:
  1. En cada cuenta, activa la *Google Apps Script API* en <https://script.google.com/home/usersettings> (`operaciontangai@gmail.com` y `fcsainz@gmail.com`).
  2. Instala clasp una sola vez para todos tus proyectos: `npm install -g @google/clasp`.
  3. Autoriza cada cuenta con un nombre (las credenciales se guardan en `~/.clasprc.json`, en tu equipo y **fuera** de cualquier repositorio):
     ```bash
     clasp login --user operacion   # entra con operaciontangai@gmail.com
     clasp login --user fcsainz     # entra con fcsainz@gmail.com
     ```
  4. Pásame el **ID del script** de KAF Rent (editor de Apps Script → Configuración del proyecto → ID de secuencia de comandos) para preparar `.clasp.json` (T-08).

- **ACC-03 — Desplegar la v2 y hacer la prueba rápida (smoke). ⏸️ Aplazada por decisión del usuario:** la v2 se desplegará junto con las nuevas funcionalidades y mejoras (D-14). El código cambió de estructura (ficheros `api_`, `dominio_`, `infra_`). Con clasp (tras ACC-02): `clasp --user operacion push` y probar en `/dev`. **Con copia/pega hay que borrar en el editor los 15 ficheros antiguos** (lista en [DEVELOPMENT.md](docs_dev/DEVELOPMENT.md)). El Sheet no cambia. Prueba mínima: entrar con una cuenta autorizada y otra no autorizada; crear, editar (ver "Falta: …") y cancelar una reserva de prueba; comprobar evento de Calendar y emails; borrar la reserva de prueba.

### D-04 — ¿De qué año es la referencia `NN/AA` de una reserva?
**En llano:** una reserva registrada en diciembre de 2026 para enero de 2027, ¿es la `NN/26` o la `NN/27`? Hoy el código usa el **año de entrada** (sería `/27`).

| | A (recomendada): año de entrada (actual) | B: año de registro |
|---|---|---|
| Pros | No hay que cambiar nada; agrupa por temporada | Numeración en orden de registro |
| Contras | En diciembre pueden aparecer reservas del año siguiente | Cambio de código y de documentación |

Lo importante es que coincida con cómo lo hacéis a mano en Drive.

### D-05 — Autogeneración de este documento
**Recomendación:** mantener la regla manual (Claude lo regenera al cierre siguiendo §4) y valorar un script en Node cuando exista la infraestructura de tests (S9).

### D-07 — ¿Se usa ya la app de verdad y la han probado los otros dos copropietarios?
En la documentación, a los otros dos copropietarios se les llama **"Ana" y "Luis"** (nombres ficticios de las *personas*; "Carlos" eres tú). Te pregunto dos cosas para saber si la v1 está validada:
1. ¿La app **se está usando ya para reservas reales**, o todavía no?
2. ¿Los otros dos copropietarios la han usado **ellos solos**, sin tu ayuda, para crear y gestionar una reserva? Eso es el **UAT** (*User Acceptance Testing*, prueba de aceptación por los usuarios). Si no se ha hecho, se planifica (EXT-03) con los journeys de [01_problema.md, Anexo A](docs_dev/discovery/01_problema.md#anexo-a--user-journeys-validación-de-usabilidad).

### D-08 — ¿El repositorio de GitHub es público o privado?
Solo afecta a los minutos gratuitos de GitHub Actions (ilimitados en público, 2 000 min/mes en privado). Recomendación: **privado**, porque la documentación describe la infraestructura.

### D-09 — ¿Hace falta un SDD en `docs_dev/solution/`?
**Qué hay que decidir (en llano):** el antiguo `SDD.md` se convirtió en `arc42.md`, que responde a las mismas preguntas y añade riesgos y calidad; los ADR explican el porqué y `design-system.md`, el estilo. Lo **único** que no está documentado es el **contrato de cada endpoint**: los parámetros y la respuesta de las 20 funciones que llama la interfaz.

| | A (recomendada): sin SDD + contratos en arc42 | B: SDD corto como "puerta de entrada" | C: SDD completo (IEEE 1016) |
|---|---|---|---|
| En llano | arc42 es el SDD; se le añade una tabla con lo que recibe y devuelve cada función | Una página que dice dónde está cada respuesta de diseño | Un documento de diseño detallado por módulo |
| Pros | Un único documento vivo (DRY); cubre el único hueco real | Quien busque "SDD" lo encuentra | Máximo detalle |
| Contras | Desaparece el nombre "SDD" | Otro fichero que solapa con `README_solution.md` | Duplica arc42 y se desfasa del código (R-06) |
| Esfuerzo | 1–2 h | 0,5 h | 8–12 h |

### D-11 — ¿Para qué sirven `docs_work/` y `docs_work/docs_ses/`?
Las he creado vacías, con un `.gitkeep` para que git las conserve. Para fijar en CLAUDE.md qué va en cada una (y si Claude debe escribir en ellas al cerrar cada sesión), necesito saber su propósito. Por el nombre supongo *documentos de trabajo* y *documentos de sesión* (p. ej. un acta por sesión con lo hecho, las decisiones y las revisiones). ¿Es así?

### D-15 — ¿Se corrige la fórmula de reparto de gastos de ADR-0012?
**En llano:** el resumen fiscal reparte hoy los gastos comunes al 50/50 fijo entre Piscina/Jardín y Habitación, y divide la amortización entre el número de espacios. La normativa verificada (ver [referencia-tecnica-irpf-alquileres.md](doc_hacienda/referencia-tecnica-irpf-alquileres.md)) exige un **doble prorrateo real: por superficie de cada zona y por días efectivamente alquilados**, no un reparto plano.

| | A (recomendada): doble prorrateo por superficie + días | B: mantener el reparto actual (50/50 + entre nº espacios) |
|---|---|---|
| En llano | El gasto de cada espacio se calcula según cuánto ocupa y cuántos días estuvo alquilado | Cada espacio se lleva la mitad de los gastos comunes, se alquile lo que se alquile |
| Técnico | Nuevo cálculo en `gastos.gs`/dominio con `Proporcion_Alquilada` por espacio (superficie real) y días alquilados del ejercicio | Sin cambios de código |
| Pros | Se ajusta a la ley; defendible ante una inspección | Ya está hecho |
| Contras | Hay que completar antes las medidas de superficie (faltan m² de 1A/1C/1D/1E del croquis exterior, ver EXT-01) y decidir cómo contar "días alquilados" cuando ambos espacios se solapan en el calendario | Puede estar deduciendo de más o de menos en alguno de los dos espacios |
| Esfuerzo | M (tras tener las medidas) | 0 |

**Recomendación:** A, con confianza alta en la lectura de la ley; pendiente de las medidas de superficie para poder implementarlo.
**Si no se decide:** ADR-0012 sigue con la fórmula actual, señalada como "hallazgo pendiente" en el propio documento.

### D-13 — ¿Cómo se mide el % de ocupación de los informes? (bloquea B-08)
**En llano:** el informe debe mostrar la ocupación, pero no está definida. En la Habitación lo natural son **noches ocupadas / noches del periodo**; en Piscina/Jardín, **días con reserva / días del periodo** (o horas, si se quiere afinar).

| | A (recomendada): noches (Habitación) y días (Piscina) | B: horas en ambos |
|---|---|---|
| Pros | Es como se piensa el negocio; simple | Más precisa para Piscina |
| Contras | Una reserva de 2 h en Piscina cuenta como un día entero | Poco intuitiva para la Habitación |

### Resueltas en esta sesión (2026-09-26)
- **D-14 → recogidas** las funcionalidades y mejoras de la v2: M-1/B-14 (defecto Calendar), F-13 a F-16, roles de propietario (F-11 ampliado), checklists de check-in/check-out (F-14), informes de gestión y técnico (F-15/F-16), comunicación SES (ampliación de ADR-0007). **Pendiente** (no bloquea, es planificación): tallar y agrupar estos IDs en sprints concretos en §1 (hoy siguen en "v2-N, pendiente de tallar").

### Resueltas en esta sesión (2026-09-25)
- **D-01 → sufijo `_` en todo lo interno** (opción A recomendada), aplicado al alinear el código con tu autorización para aplicar mejoras. Las entradas públicas del sistema (triggers, menú, editor) quedan protegidas con `ejecutarTareaDelSistema_`. Reversible; lo verifica `tests/endpoints/seguridad.test.js`.
- **D-02 → clasp con credenciales locales multicuenta** (`operacion` para este proyecto, `fcsainz` para otros); nada de credenciales en GitHub. [ADR-0015](docs_dev/solution/adr/0015-despliegue-con-clasp-multicuenta.md).
- **D-03 → el uso en móvil es Must** (RNF-11), más aún con las nuevas funcionalidades.
- **D-06 → sprints por objetivo, sin duración fija**, trabajados en ratos libres; cada sprint se cierra al cumplir su objetivo.
- **D-07 (versiones) → lo existente es la v1** (1.0.0 y 1.1.0 en el CHANGELOG); **el trabajo actual es la v2**.
- **D-12 → sin README:** lo eliminaste tú; la presentación del proyecto sigue en el historial de git (commit anterior) por si se quiere recuperar. El código pasa a `docs_dev/src/` (`rootDir` de clasp actualizado).
- **D-10 → eliminada la matriz `05_trazabilidad.md`**; la trazabilidad vive en cada documento.

---

## §1 Sprints pendientes

| Sprint | Objetivo | Contenido (resumen) | Estimación | Estado |
|---|---|---|---|---|
| **S7** | Reorganizar la documentación y fijar las reglas de trabajo | CLAUDE.md; discovery con trazabilidad ↑/↓; ADR en MADR; arc42; este documento | ~10 h | ✅ Hecho · pendiente de revisión de cierre y commit |
| **S8 + S10** | Seguridad, consistencia de datos y arquitectura en capas (adelantado) | Arnés y 84 tests + CI · funciones internas cerradas · B-02..B-05, B-07, B-09..B-11 · RF-51, RF-55 · capas `api_`/`dominio_`/`infra_` · REF-01..04 | ~16 h | ✅ Hecho · pendiente de desplegar (ACC-03) |
| **S9** | **Preparar el despliegue y cerrar la calidad estática** | Configurar clasp (T-08, tras ACC-02) · checklist de smoke en DEVELOPMENT (T-06) · ESLint (T-07) | 4–6 h | ⏳ Bloqueado por ACC-02 |
| **v2-N** | **Nuevas funcionalidades y mejoras de la v2** | Recogido (D-14): B-14 (defecto Calendar) · F-13 (Calendar invita a autorizados) · F-14 (checklists digitales check-in/check-out + módulo BBQ + cierre cobrado+checkout) · F-15 (Informe de Gestión: bloque mensual + módulo de precios) · F-16 (Informe Técnico, KPIs de sistema) · F-11 ampliado (roles soporte/gestión/admin) · ADR-0007 ampliado (comunicación SES bidireccional). Falta tallar y agrupar en sprint(s) concretos | Por estimar | ⏳ Recogido, pendiente de tallar |
| **S11** | Tests de interfaz e integración | E2E con Playwright de los journeys y XSS (T-05) · integración con Sheet de pruebas (T-04) · contrastes AA (B-12) | 12–16 h | ⏳ |
| **S12** | Informes completos y métricas | Ocupación y completadas/canceladas en informes (B-08, tras D-13) · métricas extra por zona (F-05) | 6–10 h | ⏳ Bloqueado por D-13 |
| **S13** | Mejoras "Could" | Editar espacio, canal y fechas con revalidación y evento (HU-38, RF-80, RF-41) · diseñar recordatorios (HU-37, nuevo ADR) · reconciliación automática de Calendar (F-04) | 16–24 h | ⏳ (requiere decisiones de diseño) |
| **Despliegue v2** | Publicar la v2 completa | `clasp push` + smoke en `/dev` + publicar (ACC-03) · actualizar CHANGELOG a 2.0.0 | 1–2 h | ⏸️ Tras v2-N |
| **Fase 2** | Registro de viajeros | Revisión legal previa (EXT-02) · formulario público (HU-35) · estado del registro (HU-36) · investigar la API de SES.Hospedajes | 4–6 semanas | ⏳ Tras estabilizar la Fase 1 |

**Tareas externas en paralelo:** EXT-01 validar Gastos/IRPF con el gestor · EXT-02 revisión RGPD (registro de actividades RNF-37, política de retención de huéspedes, viajeros) · EXT-03 prueba de aceptación con los otros dos copropietarios (si no se hizo, D-07).

---

## §2 Backlog

**Prioridad:** 1 seguridad/datos · 2 defectos Must · 3 habilitadores de calidad · 4 Must/Should pendientes · 5 deuda · 6 Could · 7 fases futuras.

### Defectos (B)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| B-01 | Funciones internas, de mantenimiento y de administración invocables con `google.script.run` sin autorización, con los privilegios de la cuenta operativa | RF-05, RNF-20, R-16 | 1 | M | ✅ S8 |
| B-02 | "Buscar Reserva" devuelve también las canceladas (`coincideBusqueda`) | HU-06, RF-11 | 2 | XS | ✅ S8 |
| B-03 | `reescribirServiciosDeReserva` hace `clearContents()` y reescribe toda la hoja: un fallo intermedio pierde datos | HU-24, RF-49, RNF-14 | 1 | S | ✅ S8 |
| B-04 | `actualizarReserva` no valida los valores de dominio (cobro, contrato, incidencias, checklists) ni impide editar reservas canceladas | HU-23, RF-46, RNF-24 | 2 | S | ✅ S8 |
| B-05 | Posible XSS: datos del huésped insertados como HTML en el cliente y en el email del informe (sin auditar) | RNF-26 | 1 | M | ✅ S8 |
| B-06 | Comentarios obsoletos en `auth.gs` (`USER_ACCESSING`) y `gestion.gs` (lista de activas) | CLAUDE.md §4.9 | — | XS | ✅ Corregido en S7 |
| B-07 | La poda de vídeos no borra las carpetas de reserva vacías | HU-30, RF-70 | 4 | S | ✅ S8 |
| B-08 | Informes sin % de ocupación ni completadas frente a canceladas (columna `Ocupacion` siempre vacía) | HU-32, RF-62 | 4 | M | S12 (tras D-13) |
| B-09 | El evento de Calendar no se actualiza al editar el nombre del huésped | HU-19, RF-41 | 4 | S | ✅ S8 |
| B-10 | Nombres de espacio en el código (`drive.gs` `PALABRAS_ESPACIO`, `calendario.gs` colores, `gastos.gs` listas) e ID de carpeta de vídeos en la semilla de `setup.gs` | RNF-23, RNF-27 | 5 | M | ✅ S8 |
| B-11 | El evento de Calendar se crea antes de escribir la reserva: si falla la escritura, queda un evento huérfano | RF-36, RNF-14 | 2 | XS | ✅ S8 |
| B-13 | El cliente fija en 100 MB el máximo de vídeo en vez de leer `Tamano_Max_Video_MB` de Config (el servidor sí lo valida bien) | RNF-27 | 6 | XS | Backlog |
| B-12 | Contrastes WCAG AA sin auditar (RF-51 y RF-55 ya implementados en v2; verificación visual en E2E) | HU-25, HU-28, RNF-12 | 4 | S | S11 |
| B-14 | El evento de Calendar no siempre se genera al crear una reserva: ocurre con la cuenta `fcsainz`, no con `esperanzavega`. Hipótesis a verificar: permisos de edición del calendario compartido `operaciontangai` para esa cuenta (Apps Script ejecuta como el usuario que accede, ADR-0001); revisar también si el error queda registrado en `Logs`/`Errores` o falla en silencio | RF-36, ADR-0010 | 1 | S | v2-N |

### Tests (T)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| T-01 | Arnés unitario: `package.json` (solo dev), cargador `vm` de los `.gs`, dobles de servicios de Google | RNF-29 | 3 | M | ✅ S8 |
| T-02 | Tests unitarios del dominio: solapamiento, importes, fechas, validaciones, estado, IDs, resumen fiscal, amortización, validación de archivos, purgas | RNF-29 | 3 | L | ✅ S8 |
| T-03 | GitHub Actions: lint + unitarios (+ E2E cuando exista) en cada push | RNF-29, RNF-33 | 3 | S | ✅ S8 |
| T-04 | Suite de integración en un Sheet de pruebas con su propio proyecto de script | RNF-29 | 3 | M | S11 |
| T-05 | E2E con Playwright: servidor local que resuelve `include` y simula `google.script.run`; journeys J-1 a J-6; viewport móvil | RNF-08, RNF-11 | 3 | L | S11 |
| T-06 | Checklist de smoke post-despliegue en DEVELOPMENT.md | RNF-19, RNF-20 | 3 | XS | S9 |
| T-07 | ESLint con globals de Apps Script y reglas propias (`no-var`, patrones prohibidos) | RNF-28 | 3 | S | S9 |
| T-08 | Configurar clasp: `.clasp.json` (desde `.clasp.json.example` con el ID del script), `clasp pull` a una carpeta temporal y comparar con `docs_dev/src/` **antes** del primer `push`, scripts `npm run push` / `deploy` con `--user operacion` | ADR-0015, RNF-27 | 3 | S | S9 (tras ACC-02) |

### Deuda técnica (REF / TD) — detalle en [arc42 §11.2](docs_dev/solution/arc42.md#112-deuda-técnica)

| ID | Descripción | Prio | Talla | Sprint |
|---|---|---|---|---|
| REF-01 | Importes y validaciones de reserva en un único sitio (dominio puro) | 5 | M | ✅ S8 |
| REF-02 | Mapa de columnas derivado de `ESQUEMA_HOJAS` | 5 | M | ✅ S8 |
| REF-03 | Envoltorio común de endpoint (autorización + try/catch + lock) | 5 | S | ✅ S8 |
| REF-04 | Dividir funciones > 30 líneas | 5 | M | ✅ S8 |

### Funcionalidades (F / HU)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| F-01 | Editar espacio, canal y fechas con revalidación de solapamiento | HU-38, RF-80, ADR-0005 | 6 | L | S13 |
| F-02 | Recordatorios automáticos si una reserva no se cierra: email a los copropietarios a los 10 y 15 días, y luego cada 7 días hasta que se cierre — requiere diseño y ADR | HU-37, RF-79 | 6 | L | S13 |
| F-03 | Flujo de incidencias y mantenimiento no ligado a una reserva — requiere discovery | antiguo SDD §5.7 | 6 | ? | Backlog |
| F-04 | Reconciliación automática periódica de Calendar | ADR-0010 | 6 | S | S13 |
| F-05 | Métricas adicionales por zona (el botón de recálculo manual ya existe) | ADR-0009 | 4 | M | S12 |
| F-06 | Exportar a CSV o Excel para declaraciones | Backlog v0.5 | 7 | M | Futuro |
| F-07 | Vista de informes históricos en la app | Backlog v0.5 | 7 | M | Futuro |
| F-08 | Bot de Telegram como canal de aviso | ADR-0006 | 7 | M | Futuro |
| F-09 | Copia externa periódica y archivo de las filas purgadas | ADR-0013, R-14 | 7 | M | Futuro |
| F-10 | Catálogo de tipos de documento (contrato, dni…) | ADR-0014 | 6 | S | Backlog |
| F-11 | Roles de propietario: **soporte, gestión y admin** (admin = soporte + gestión; lo que ve soporte también lo ve gestión, no al revés). Hoy nadie tiene "soporte" asignado — falta decidir quién. Requiere nueva columna en `Usuarios_Autorizados` | ADR-0001 | 6 | M | v2-N |
| F-12 | Logotipo, iconos y maquetas de alta fidelidad | design-system §9 | 6 | M | Backlog |
| F-13 | El evento de Calendar debe invitar a los usuarios autorizados para que acepten (el propio Calendar les envía la invitación) | ADR-0010 | 4 | S | v2-N |
| F-14 | Checklists digitales de check-in y check-out, distintas para Piscina/Jardín y Habitación; módulo BBQ condicional (solo si el servicio extra está en la reserva); cerrar una reserva pasa a exigir **cobrado + checkout realizado** (antes solo cobrado). Plantilla actual de Piscina/Jardín en [Checklist_Piscina_Jardin.pdf](doc_check/Checklist_Piscina_Jardin.pdf) (a mejorar con la experiencia de uso); la de Habitación se diseña de cero, digital | HU-24 (checklists ya existentes), nuevo RF | 4 | L | v2-N |
| F-15 | Informe de Gestión: mantener el bloque actual + nuevo bloque de agregado **mensual** (mismas métricas que el total) + nuevo módulo de análisis de precios (nº de reservas y precio medio/más frecuente por persona y espacio), pensado para alimentar a futuro un sistema de recomendación de subir/bajar precios según el flujo de reservas | HU-32, ADR-0009 | 4 | M | v2-N |
| F-16 | Informe Técnico nuevo (visible en pestaña + email, solo roles soporte/admin): KPIs de salud del sistema — propuesta de Claude a validar: errores recientes (`Logs`/`Errores`), última ejecución y resultado de las tareas nocturnas y de la copia de seguridad (ADR-0013), tamaño de las hojas (nº filas, para prever purgas), cuota de Apps Script usada (`MailApp.getRemainingDailyQuota()`, tiempo de ejecución de triggers), vídeos pendientes de poda, accesos denegados recientes, y (cuando exista) estado de las comunicaciones SES pendientes/erróneas | F-11 (rol) | 4 | M | v2-N |
| — | Registro de viajeros — ver [referencia-tecnica-ses-hospedajes.md](docs_ses/referencia-tecnica-ses-hospedajes.md) (campos, webservice, catálogos). Ampliado: el formulario de huéspedes es un **Google Form con su propio Sheet**, distinto del de KAF Rent; hace falta sincronizar datos en ambos sentidos, un paso de **verificación presencial del DNI/NIE/Pasaporte** por un copropietario que dispara la comunicación a SES, y un email a los copropietarios con el resultado — ver ADR-0007 ampliado. **Falta el ID/URL de ese Sheet de Formulario** para diseñar la sincronización | HU-35, HU-36, ADR-0007 | 7 | XL | Fase 2 |

### Tareas externas (EXT)

| ID | Descripción | Ref. |
|---|---|---|
| EXT-01 | Validar con el gestor la deducibilidad, la proporción alquilada, el prorrateo temporal y el reparto de gastos comunes — ver [referencia-tecnica-irpf-alquileres.md](doc_hacienda/referencia-tecnica-irpf-alquileres.md) (doctrina ya verificada contra el BOE y datos catastrales guardados; **falta** el m² individual de las zonas 1A/1C/1D/1E del exterior y aclarar la diferencia entre el plano a mano (~513 m²) y el terreno catastral (906 m²)) | ADR-0012, D-15 |
| EXT-02 | Revisión RGPD: registro de actividades (art. 30), política de retención de huéspedes y viajeros (fotos de documentos) | RNF-35, RNF-37, R-03, R-11 |
| EXT-03 | UAT de los journeys con Ana y Luis | RNF-08, R-10 |

---

## §3 Histórico de sprints completados

| Sprint | Contenido | Versión | Hito |
|---|---|---|---|
| S0 | Discovery y diseño (PRD ágil, SDD, ADR-0001 a 0006) | 0.5.0 (2026-06-22) | — |
| S1 | Infraestructura, autenticación, shell, esquema del Sheet | 1.0.0 | M1 ✅ acceso con Google funcionando |
| S2 | Inicio (últimas 5, buscador) y formulario Crear Reserva (parte I) | 0.9 → 1.0.0 | — |
| S3 | Fechas por modo, solapamientos, importes, guardado, avisos y confirmación | 1.0.0 | M2 ✅ primera reserva de principio a fin |
| S4 | Gestionar Reserva: lista, edición auditada, ciclo de vida, contrato, vídeos, checklists, cancelación, Calendar | 1.0.0 | M3 ✅ ciclo de vida completo |
| S5 | Estadísticas, mantenimiento nocturno, informes | 1.0.0 (2026-06-29) | M4 ❓ uso real y prueba con usuarios (D-07) |
| S6 | Gastos e IRPF | 1.0.0 | — |
| S7 | Reorganización documental: CLAUDE.md, discovery con trazabilidad, MADR, arc42, próximos pasos | 2.0.0 (en curso) | — |
| S8 + S10 | Código alineado: capas, seguridad, defectos, tests y CI (84 tests, ≈ 98 % de cobertura) + doble revisión de cierre | 2.0.0 (en curso, sin desplegar) | — |
| v1.1 | Coste fijo del canal, columna Personas, `USER_DEPLOYING`, reconciliación de Calendar | 1.1.0 (2026-07-27) | — |

---

## §4 Cómo se regenera este documento

Lo hace Claude al cierre de cada sesión, después de la doble revisión ([CLAUDE.md §2.2–§2.4](CLAUDE.md)):

1. **§0:** decisiones abiertas con el formato de CLAUDE.md §2.1; se quitan las resueltas (la resolución queda en el CHANGELOG o en un ADR).
2. **§2:** se recorren las fuentes y se añade o cierra cada ítem con su ID estable:
   - HU con estado distinto de ✅ ([02](docs_dev/discovery/02_historias_usuario.md)); RF y RNF con estado distinto de ✅ ([03](docs_dev/discovery/03_requisitos_funcionales.md), [04](docs_dev/discovery/04_requisitos_no_funcionales.md)).
   - Hallazgos de la revisión (B-NN) y deuda de arc42 §11.2.
   - "Cuestiones abiertas" de cada ADR.
   - Riesgos abiertos con acción (arc42 §11.1) y tareas externas.
3. **§1:** se reagrupa el backlog en sprints por orden de prioridad, con un objetivo por sprint y un tamaño manejable (orientativo ≤ 20 h), sin fecha fija.
4. **§3:** los sprints terminados pasan al histórico con su versión.
