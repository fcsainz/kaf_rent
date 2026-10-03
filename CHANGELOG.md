# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se versiona de forma aproximada con [SemVer](https://semver.org/lang/es/). Las primeras versiones (≤ 0.5) reflejan solo **documentación y diseño**; a partir de ahí, también el **código** desplegado en `src/`.

> **Renumeración (2026-09-25):** lo existente pasa a ser la **v1** y el trabajo que empieza ahora, la **v2**. Los commits antiguos etiquetados `v2.0 Version inicial completa` y `v2 Seguro, mejora interfaz…` corresponden a **1.0.0** y **1.1.0**.

## [Unreleased] — en curso hacia 2.0.0

### Implementación en producción y documentación (2026-10-02)
- **Implementación:** el usuario implementó la versión con S22, S23, S9 y S26–S28 tras *Reparar hojas*, `corregirHorasReservas`, `instalarTriggers` y los ajustes del Sheet (checklists, `Nombre_Corto`, `Config`). Prueba en el móvil del usuario sin fallos; falta comprobar B-14 con Esperanza y Aura (ACC-03).
- **SES.Hospedajes activo en producción.** Pre-ses respondía HTTP 502. La conexión y los catálogos (`actualizarCatalogosSES`) se comprobaron en producción, así que `SES_Url` apunta a producción. El Form tiene sus listas y validaciones con el catálogo real (D-42). La primera reserva real de la Habitación hace de verificación (S29, riesgo R-23).
- **Changed:** CLAUDE.md §2.2. Claude sube con clasp (KAF Rent y el script del Form) solo con OK en cada subida; implementar lo hace el usuario. Se distingue "subir" de "implementar".
- **Added:** `docs_work/valor_dev.md`, valoración del proyecto a precio de mercado por comparables (≈ 750–1.210 € al año en cuotas equivalentes; ≈ 1.060–1.520 € con lo previsto), registrada en CLAUDE.md §1 y §5.1.
- **Changed:** registro de mejoras `mejoras_2026-10-02.md` con la segunda sesión; PROXIMOS_PASOS regenerado (S29 verificación de SES en producción, S30 trazabilidad, B-25, B-26).

### Código — S22, S23, S9 y S26–S28 (2026-10-02)
- **Fixed:** B-14. Si el usuario no tiene el calendario operativo en su lista, la app lo suscribe oculto y sin marcar y crea el evento (`suscribirCalendarioOculto_`, D-26). Falta el smoke con Esperanza y Aura.
- **Fixed:** B-22. Las horas de `Config` que Sheets guarda como valor de hora se leen como `HH:mm` (`obtenerConfigHora_`).
- **Added:** D-28. Tarea de editor `corregirHorasReservas`, que se ejecuta una vez: pone la hora de `Config` a las reservas de la Habitación guardadas a 00:00, mueve su evento y lo anota en `Historial_Cambios`.
- **Changed:** F-23 ([ADR-0019](docs_dev/solution/adr/0019-horas-obligatorias-en-todos-los-espacios.md), sustituye la parte de horas de ADR-0003). Hora de llegada y de salida obligatorias en los dos espacios; en la Habitación llegan prerrellenas con las de `Config`. HU-10, HU-11, RF-19 y RF-20 actualizados.
- **Fixed:** B-18. Si una checklist terminada se guarda con algún punto pendiente, vuelve a sin terminar, la reserva se recalcula y queda en el historial.
- **Fixed:** B-19. Los puntos de daños son de un tipo propio, `Daños`, y se responden *Sin daños* o *Con daños*, sin "No aplica". El aviso de incidencia depende de la respuesta, no del texto del punto. Afecta a los 4 puntos de la semilla, que pasan a llamarse "Mobiliario", "Instalaciones y piscina", "Cojines" y "Habitación", y a la checklist v1.1.
- **Changed:** TD-02 ([ADR-0020](docs_dev/solution/adr/0020-una-fila-por-checklist.md)). Hoja nueva `Checklists_Reserva`, con una fila por checklist y los puntos en JSON; `Registro_Checklist` sale del esquema. Guardar escribe solo esa fila.
- **Added:** EXT-04 hecha. Claves `SES_Codigo_Arrendador` y `SES_Codigo_Establecimiento` en `Config` del Sheet; `SES_USUARIO` y `SES_CONTRASENA` en las Propiedades del script (D-32, DD-02).
- **Fixed:** B-21. Gestionar avisa en el momento si falta el código de reserva del canal cuando es obligatorio; el servidor lo sigue revalidando.
- **Changed:** S23, F-24. La cabecera muestra el icono de la app (`Config.Icono_Url`) junto a "KAF Rent".
- **Changed:** S23, F-25. Navegación inferior fija en dos pisos: Inicio · Reservas (Gestionar / Crear) · Checklists · Gastos · Estadísticas, con icono y texto. Sustituye a la fila de botones superior.
- **Changed:** S23, F-26. "Últimas reservas" muestra el espacio corto (columna nueva `Nombre_Corto` en `Catálogo_Espacios`), el código del canal, el nombre, Inicio y Fin cortos y el neto. El enlace al calendario pasa a botón "Ver calendario".
- **Added:** S26, dominio de SES ([DD-02](docs_dev/solution/design-docs/DD-02-comunicacion-ses-hospedajes.md)). `dominio_ses.gs` lee el Google Form de viajeros por cabecera, casa cada respuesta con la reserva por código, traduce a códigos de SES (INE de 5 dígitos), valida `PV` y `RH`, construye su XML y clasifica errores y reintentos. Tests en `tests/dominio/ses.test.js`.
- **Changed:** RF-75 retirado (lo sustituye el Google Form, ADR-0018). RF-76 y RF-77 reescritos; RF-89 a RF-91 nuevos; HU-35 reescrita.
- **Added:** S9, T-07. ESLint 9 como dependencia de desarrollo (`eslint.config.js`, `npm run lint`) y en la CI antes de los tests.
- **Added:** S9, T-08. `npm run push` (tests + lint + `clasp push`) y `npm run deploy` (ID de implementación en una variable de entorno).
- **Added:** S9, T-06. Checklist de smoke tras publicar en DEVELOPMENT.md.
- **Changed:** S9, TD-04. Las reglas puras de las copias pasan a `dominio_mantenimiento.gs`.
- **Changed:** RF-10. El texto de tabla vacía depende del contexto: "Todavía no hay reservas." (Inicio) y "Ninguna reserva coincide con ese nombre o fecha." (buscador).
- **Added:** [ADR-0021](docs_dev/solution/adr/0021-script-propio-del-form-de-viajeros.md). Script propio ligado al Form de viajeros, en `docs_dev/src_form_checkin/` y sin credenciales de SES. DD-02 §3.6 recoge los cambios del Form (D-37).
- **Added:** script del Form de viajeros (`docs_dev/src_form_checkin/`, ADR-0021). Rellena los desplegables desde `Catálogo_SES` conservando los saltos de sección, pone validaciones con mensaje (DNI/NIE, soporte, email, teléfono) y muestra un informe. Incluye `npm run push:form`, tests en `tests/form_checkin/` y lint. Subido el 2026-10-02 al proyecto ligado al Form (cuenta operaciontangai).
- **Changed:** D-37. KAF Rent lee el Form por título único: sin lectura por posición ni separación heurística de apellidos. Se traduce con `Catálogo_SES` (`Equivalencias_SES` retirada) y se comprueba la letra del DNI/NIE. DD-02 §3.6 trae la lista exacta de cambios a mano en el Form.
- **Added:** D-38. El menor sin teléfono ni email lleva el de su adulto responsable (`completarContactoMenores_`). D-37 (E): el segundo apellido es obligatorio en el Form con un guion si no tiene (lo pone el script del Form) y KAF Rent entiende el guion como vacío. El script del Form gana `describirFormulario` (solo lectura).
- **Added:** S27, conexión con SES (DD-02 SES-3).
  - Cliente SOAP (`infra_ses.gs`): ZIP + Base64 y HTTP Basic con las credenciales en las Propiedades del script.
  - Lectura del Sheet del Form y anotación del resultado igual que a mano, con "Automática" (`infra_formulario_viajeros.gs`).
  - Hojas `Catálogo_SES`, `Municipios_INE`, `Comunicaciones_SES` y `Validacion_Viajeros`, y claves de `Config` de SES.
  - Tareas `alEnviarFormularioViajeros` (programa la RH y actualiza `Registro_Viajeros_Estado`, RF-78), `procesarComunicacionesSES` (cada 10 min: envía, consulta el lote y reintenta) y `actualizarCatalogosSES`.
  - Tests en `tests/endpoints/ses.test.js`.
- **Added:** avisos de SES por email a `Emails_Notificacion`: Form sin reserva, datos que corregir, parte en manual y reserva no comunicada tras los reintentos. La reserva (RH) que agota los intentos queda "No comunicada", sin acción manual. El resultado de la RH va en columnas propias del Sheet del Form. Catálogos de SES automáticos el día 1 de cada mes.
- **Added:** [ADR-0022](docs_dev/solution/adr/0022-anulacion-en-ses-al-cancelar.md) (D-40). Al cancelar una reserva ya comunicada, la confirmación lo avisa y se anula en SES (operación B) con reintentos y avisos; lo pendiente se descarta. Se anota en el Form. RF-92 nuevo.
- **Removed:** D-39. La hoja `Registro_Viajeros` sale del esquema: era del diseño antiguo, que copiaba datos de huéspedes.
- **Added:** S28, F-28 (RF-94). En Gestionar, en las reservas de la Habitación, bloque "Registro de viajeros (SES)": huéspedes con formulario, validar en persona (o deshacer), elegir el municipio si no está en el INE (se corrige en el Form), comunicar el parte con todos validados, estado ante SES, "Actualizar formularios" y "Comprobar ahora". Solo Gestión y Admin.
- **Changed:** S28, F-18 (D-35 B). Todos los emails usan la plantilla común aprobada (`infra_plantilla_email.gs`): cabecera con el logo (`Config.Icono_Url`), etiqueta de estado, resumen, datos clave, "Qué hacer", botones (KAF Rent, Sheet del Form, web de SES) y datos técnicos, con versión en texto. Asuntos nuevos (`[KAF Rent] {✓ ! ✕} …`) e importes en formato español (`2.840,00 €`). Nueva clave `Config.SES_Web_Url`.
- **Added:** S28. Emails de éxito de SES: reserva comunicada, parte comunicado (con quién validó en persona) y comunicación anulada (con su código).
- **Changed:** D-42. El script del Form pone en "Tipo de documento" el catálogo de SES tal cual y asigna a cada opción la sección de su equivalente (NIF → DNI; Otro, CIF y CIF extranjero → pasaporte); si no puede, no toca la pregunta. Corrige el error "Invalid data updating form" al mezclar opciones con y sin salto. `describirFormulario` resume las listas largas.
- **Changed:** D-42. KAF Rent acepta "DNI" como NIF en las respuestas del Form enviadas antes del cambio a la lista de SES.
- **Added:** S28, F-30 (RF-96). Comprobar la conexión con SES.Hospedajes sin enviar datos: menú del Sheet *KAF Rent → Comprobar la conexión con SES* y botón en Inicio solo para Admin; dice si es correcta, si fallan las credenciales o si SES no responde, y en qué entorno.
- **Added:** S28, D-41. Los informes mensual y trimestral comparan el neto por espacio y canal con el periodo anterior y con el mismo periodo del año anterior (▲/▼ %; "—" sin datos).
- **Added:** S28, F-29 (RF-95). Ventana de "trabajando" en toda la app ("Cargando la reserva…", "Enviando el parte a SES…").
- **Fixed:** los botones desactivados no se distinguían de los activos (faltaba el estado `disabled`, CLAUDE.md §6.4).
- **Added:** S28, F-27 (RF-93). Botón "Mensaje para el huésped" en las reservas de Habitación con el texto aprobado y el enlace prerrellenado del Form (`Config.Form_Viajeros_Enlace`); abre WhatsApp si hay teléfono y, si no, copia el texto.
- **Changed:** avisos de SES con el trámite y el número de intento en el asunto (`SES Reserva: 2º intento · rechazada por SES`). Se recupera el aviso en cada intento fallido con la hora del reintento, ya aprobado en DD-02 §3.5 y que la primera versión de S27 había omitido.
- **Changed:** "Reparar hojas" añade a `Config` las claves nuevas que falten, sin tocar las existentes, para que lleguen a producción.
- **Changed:** D-34 aprobada. ADR-0018 pasa a *accepted* y DD-02 a aprobado, lo que desbloquea S26–S29.

### Documentación — diagnóstico, mejoras y diseño de SES (2026-10-02, sin cambios de código)
Registro completo de la sesión: [docs_work/docs_mejoras/mejoras_2026-10-02.md](docs_work/docs_mejoras/mejoras_2026-10-02.md).
- **Added:** [ADR-0018](docs_dev/solution/adr/0018-comunicacion-ses-hospedajes.md) (*proposed*), que propone la comunicación automática a SES.Hospedajes desde el Google Form de viajeros, con validación presencial; sustituye parte de ADR-0007.
- **Added:** [DD-02](docs_dev/solution/design-docs/DD-02-comunicacion-ses-hospedajes.md) (borrador), el diseño de esa comunicación: flujo, hojas, reintentos con aviso y emails.
- **Added:** registro de mejoras por sesión en `docs_work/docs_mejoras/` (CLAUDE.md §1 y §5.1).
- **Added:** regla de CLAUDE.md §2.1: al pedir una decisión antigua se repite su resumen.
- **Added:** riesgos R-20 (cuota de Drive de los vídeos), R-21 (reserva sin comunicar si no hay Form previo) y R-22 (estructura del Form) en arc42 §11.1; TD-01 a TD-04 en arc42 §11.2.
- **Changed:** CLAUDE.md §4.8. Excepción para las contraseñas de servicios externos: van en las Propiedades del script, no en `Config` (D-32).
- **Changed:** PROXIMOS_PASOS regenerado. Nuevos sprints S22 a S29, B-22 a B-24, F-23 a F-28, D-34 a D-36 y EXT-04; resueltas D-21, D-22 y D-26 a D-33.
- **Fixed:** referencia técnica de SES. Hay que comunicar la reserva (`RH`) **y** el parte (`PV`) (RD 933/2021, Art. 6.3), no una de las dos. Se añaden los campos obligatorios de `PV` y el certificado TLS (probado: Apps Script conecta).
- **Fixed:** B-14 reabierto. El calendario está bien compartido, pero `getCalendarById` devuelve `null` si el usuario no lo tiene en su lista. RF-36 y HU-19 pasan a 🟡.
- **Fixed:** B-22 detectado. Las horas de la Habitación se guardan a 00:00. RF-20 y HU-11 pasan a 🟡.
- **Fixed:** arc42 R-17, R-18 y TD-05 desactualizados (E2E ya hechos; "Ejecutar como" según ADR-0017).
- **Fixed:** incoherencias de PROXIMOS_PASOS: "Despliegue v2" pasa al histórico, sprints S12 y "v2-N" inexistentes, ACC-03 duplicado, nota obsoleta de F-11.

### Publicación en producción (2026-09-27)
La v2 está publicada en la URL de siempre (implementación **v37**, con clasp). El número pasa a **2.0.0** cuando se haga el smoke con las tres cuentas (T-06).

### Código y documentación — copias, código de reserva del canal, icono y clasp (2026-09-27)

#### Added
- **Código de reserva del canal (HU-40, RF-88, F-22):** campo `Ref_Canal` en la reserva (Crear, ficha y edición con auditoría); obligatorio en los canales con `Requiere_Ref_Canal` = Sí en `Catálogo_Canales` (Airbnb), opcional en el resto; al editar no se puede vaciar si el canal lo exige y ya tenía valor.
- **Icono de la app (D-23):** `Config.Icono_Url` con el PNG público de 192 px (`setFaviconUrl`); si la URL falla, la app abre igualmente y se registra el error.

#### Fixed
- **Tareas del sistema:** con "ejecutar como quien accede" cualquier usuario autorizado pasaba la comprobación de "ejecución directa"; ahora solo la propietaria del Sheet o un trigger del proyecto (ADR-0017, test de regresión).
- **Trazabilidad:** cinco relaciones HU↔RF↔RNF que solo figuraban en un extremo (HU-19, HU-29, HU-30, HU-39 con RF-50, RF-84, RF-86; RNF-20 con RF-84).
- **D-23 (icono):** `setFaviconUrl` no cambia el icono del acceso directo de Android; queda la página puente para la próxima sesión.

#### Changed
- **La Web App se ejecuta como el usuario que accede** ([ADR-0017](docs_dev/solution/adr/0017-ejecutar-como-usuario-que-accede.md), sustituye la ejecución de ADR-0001): `appsscript.json` vuelve a `USER_ACCESSING`, porque con cuentas `@gmail.com` "Ejecutar como: Yo" no identifica a nadie. B-14 se resuelve compartiendo el calendario con cada usuario.
- **Copias del Sheet con rotación abuelo-padre-hijo** ([ADR-0016](docs_dev/solution/adr/0016-rotacion-copias-abuelo-padre-hijo.md), sustituye la rotación de ADR-0013): una copia al día y se conserva la más reciente de cada uno de los últimos 7 días, 4 semanas y 12 meses (`Config`: `Backup_Diarias`, `Backup_Semanales`, `Backup_Mensuales`; mínimo 1 por nivel). La ventana de recuperación pasa de ~30 días a ~12 meses (R-14 mitigado). `Backup_Cada_Dias` y `Backup_Max_Copias` dejan de usarse. RF-68.
- **clasp:** la credencial local de `operaciontangai@gmail.com` se llama `familia` (`clasp --user familia …`); DEVELOPMENT, arc42 y ADR-0015 (revisión) actualizados.

### Código y documentación — S14, S11, S15 y S16 (2026-09-27)

#### Added
- **Checklists digitales de check-in y check-out (F-14, S16, [DD-01](docs_dev/solution/design-docs/DD-01-checklists-digitales.md)):** 4 listas (Exterior/Interior × entrada/salida) desde el catálogo `Catálogo_Checklist` (138 puntos, semilla = `docs_work/doc_check/checklists-check-in-out.md` v1.0, verificada por test); "No aplica" en cada punto; barbacoa y extras según lo contratado; office de la Habitación según la siguiente reserva (`Config.Dias_Office_Reponer`); WC con fecha; confirmación antes de terminar; vídeo desde su punto y fotos de desperfectos a Drive; registro por punto con usuario y hora (`Registro_Checklist`); editor del catálogo para Admin (pestaña "Checklists"). RF-85..RF-87.
- **Roles (F-11, S15):** Admin, Gestión, Soporte y Sistema en `Usuarios_Autorizados.Rol`; vacío o "Copropietario" = Gestión (RF-84, `dominio_roles.gs`).
- **Avisos que no pasan desapercibidos (F-21, S14):** errores y avisos en ventana modal que hay que cerrar; éxitos en mensaje centrado que se cierra solo; botón "Enviar al administrador" con el detalle técnico del error (pila incluida, sin datos del huésped). RF-81, RF-82, HU-39.
- **Invitaciones de Calendar (F-13, S14):** cada evento invita a los usuarios con permiso de gestión (RF-83).
- **Tests E2E con Playwright (T-05, S11):** servidor local que ejecuta el código real sobre dobles de Google; journeys J-1..J-6, avisos, seguridad, móvil (393 px) y áreas táctiles; en CI. Test de contraste de todos los pares de color. 153 tests unitarios y de endpoints + 29 E2E.
- **Plantilla de design doc** (`docs_dev/solution/design-docs/`, D-09: arc42 + C4 + un design doc por funcionalidad grande).

#### Changed
- **Cierre de una reserva = cobro ingresado + check-out terminado** (RF-50); check-in/check-out ya no se editan a mano (RF-56, también bloqueado en el servidor).
- **La referencia `NN/AA` lleva el año en que se crea la reserva** (B-15, D-04).
- **"Inicializar / reparar hojas" es seguro con datos reales** (B-16, D-19): solo añade al final las columnas que falten; la lectura por cabecera ya no usa la posición del esquema si falta una columna (error claro).
- Botones y enlaces con área táctil ≥ 44 px; verde de éxito `#468144` (contraste AA) (B-12).
- **Tests:** unitarios y de endpoints con cada cambio; E2E de pantallas nuevas, integración y accesibilidad antes de pasar a producción (CLAUDE.md §7.2, §8.3).

#### Fixed
- **B-14:** el evento de Calendar no se creaba cuando registraba la reserva `esperanzavegafdez` (la implementación publicada se ejecuta como quien accede); ahora el fallo se avisa al usuario y se puede enviar al admin. Pendiente en el despliegue: "Ejecutar como: Yo" y reconciliación.
- **B-17:** en móvil, las tablas del Inicio, la búsqueda y el historial ensanchaban la página; ahora se desplazan dentro de su contenedor.

#### Documentación
- Decisiones de la sesión: D-04, D-05, D-07, D-08, D-09, D-11, D-16 (exterior por horas sobre la franja 11:00–23:00), D-17 (finca 906 m²), D-19; método provisional de prorrateo IRPF (sin gestor: legislación pública) en la referencia técnica §6bis; medidas del croquis exterior resueltas (zona 1 ≈ 513 m²).
- `PROXIMOS_PASOS.md` se queda en `docs_work/` (enlaces corregidos); `docs_work/` definida como carpeta de trabajo.
- Nuevos riesgos R-18 (implementación publicada distinta del repositorio) y R-19 (cambios de estructura con datos reales).

### Documentación — referencias legales y recogida de v2-N (2026-09-26)
- **Referencia técnica SES.Hospedajes** (`docs_work/docs_ses/referencia-tecnica-ses-hospedajes.md`): RD 933/2021 y webservice de comunicación, para la Fase 2 (ADR-0007).
- **Referencia técnica IRPF** (`docs_work/doc_hacienda/referencia-tecnica-irpf-alquileres.md`): Ley y Reglamento del IRPF, Manual Práctico de Renta y consulta DGT V1643-25, verificados contra el texto oficial; datos catastrales de la finca; hallazgo pendiente de decisión sobre la fórmula de reparto de gastos de ADR-0012 (D-15).
- **v2-N recogida** (D-14): defecto de Calendar por perfil (B-14), invitación a Calendar (F-13), checklists digitales de check-in/check-out con módulo BBQ y nuevo criterio de cierre (F-14), Informe de Gestión mensual + análisis de precios (F-15), nuevo Informe Técnico con KPIs (F-16), roles de propietario soporte/gestión/admin (F-11), y ampliación de ADR-0007 con el flujo de comunicación a SES (con un hallazgo: el formulario ya en uso es un Google Form independiente, no lo decidido originalmente).

### Documentación — reorganización (Sprint 7, 2026-09-25)
- **CLAUDE.md reescrito:** arranque de sesión con tabla de sprints; regla de no decidir sin explicar y sin OK del usuario (con plantilla de decisión); commits solo al final de la sesión y por el usuario, tras una doble revisión (coherencia y huecos / semántica y código); principios SOLID, KISS, DRY, YAGNI, Clean Code y Clean Architecture ligera; estándares de documentación y trazabilidad; estrategia de tests gratuita (unitarios en Node, integración en un Sheet de pruebas, E2E con Playwright, smoke manual, CI en GitHub Actions, FIRST); DoR/DoD.
- **Discovery rehecho** con trazabilidad P → JTBD → HU → RF/RNF: `01_problema.md` (visión, personas y problema fusionados, con JTBD), `02_historias_usuario.md` (HU-01..38, antes US-0NN, con estado real), `03_requisitos_funcionales.md` (RF-01..80, nuevo), `04_requisitos_no_funcionales.md` (RNF-01..38, ISO/IEC 25010:2023). Eliminados los documentos fusionados (visión, personas, story map, DoD, risk register).
- **ADR migrados a MADR 4.0** en `docs/solution/adr/`, con índice, plantilla y trazabilidad a HU/RF/RNF.
- **`SDD.md` → `arc42.md`** (12 secciones), que incorpora el registro de riesgos (más R-16 funciones expuestas y R-17 sin tests) y la deuda técnica.
- **`09_roadmap.md` → `PROXIMOS_PASOS.md`**: decisiones pendientes, sprints S7–S13 y Fase 2, backlog con IDs e histórico.
- **Trazabilidad en línea en cada documento** (↑/↓): JTBD → HU; HU ↑ Problema/JTBD ↓ RF/RNF/Sprint; RF ↑ HU ↓ RNF/Sprint (+ plan de test); RNF ↑ origen ↓ RF/Sprint. Lo que no tiene relación directa queda anotado ("Sin HU directa", "Sin RNF directo", "Sin RF directo"), con su motivo en la propia fila. Sin matriz aparte: `05_trazabilidad.md` se creó y se retiró en la misma sesión.
- **ADR-0015 — clasp con credenciales locales multicuenta** (`--user operacion` / `--user fcsainz`, en `~/.clasprc.json`, nunca en GitHub); `.clasp.json.example`; DEVELOPMENT con el flujo clasp y la copia/pega como emergencia. Uso en móvil confirmado como Must (RNF-11). Sprints por objetivo, sin duración fija. Versionado: lo existente pasa a ser la v1 y el trabajo actual, la v2.
- **Reorganización de carpetas:** `docs/` → `docs_dev/`, a la que también pasan `README.md` y `DEVELOPMENT.md` (en la raíz quedan `CLAUDE.md` y `CHANGELOG.md`; `PROXIMOS_PASOS.md` vive en `docs_work/`); nueva carpeta `docs_work/docs_ses/`; el código pasa de `src/` a `docs_dev/src/` (`rootDir` de clasp) y se elimina el README; enlaces y referencias actualizados.
- **DEVELOPMENT.md y README** al día: `USER_DEPLOYING` ("Ejecutar como: Yo"), todos los HTML, `Config`, triggers y reconciliación de Calendar.

### Código v2 — alineado con CLAUDE.md (S8 + S10, 2026-09-25)

#### Changed
- **Arquitectura en capas (Clean Architecture ligera, CLAUDE.md §3.3):** los 16 `.gs` pasan a 23 con prefijo de capa y cabecera `// Capa: …`: `api_*` (endpoints y entradas del sistema), `dominio_*` (funciones puras: validaciones, importes, solapamiento, IDs, ciclo de vida, agregados, fiscalidad) e `infra_*` (esquema, repositorios por campo, Drive, Calendar, correo, mantenimiento). Sin dependencias entre ficheros al cargar.
- **Acceso al Sheet por campo, no por posición (REF-02):** el esquema define campo lógico → columna una sola vez (`infra_esquema.gs`); las columnas se localizan por cabecera.
- **Una sola fórmula de importes (REF-01)** y validaciones compartidas entre alta y edición; plantilla única de endpoint `ejecutarEndpoint_` (REF-03).
- Sin nombres de espacio en el código (B-10): colores de Calendar, carpeta de vídeos y espacios de Gastos salen del catálogo; el desplegable de espacios de Gastos se rellena desde el servidor (`cargarCategoriasGasto` devuelve `{ categorias, espacios }`). La semilla de `Carpeta_Videos_Id` queda vacía.
- `Errores` ya no guarda datos personales del huésped en el contexto.

#### Security
- **B-01 (crítico):** todo lo interno lleva sufijo `_` (no invocable con `google.script.run`); solo quedan públicos los 20 endpoints y las entradas del sistema, que se protegen con `ejecutarTareaDelSistema_` (trigger real o ejecución directa). `recalcularEstadisticas` exige autorización.
- **B-05:** el email del informe escapa todo dato; mensaje de la tabla de Gestionar sin `innerHTML`.

#### Fixed
- B-02 el buscador excluye canceladas · B-03 reescrituras atómicas (servicios, purgas, cache, resumen fiscal) · B-04 validación de dominio y bloqueo de canceladas (editar, servicios, archivos) · B-07 la poda borra carpetas de reserva vacías · B-09 el título del evento sigue al nombre del huésped · B-11 el evento de Calendar se crea tras guardar la reserva.

#### Added
- RF-51: la edición muestra "Falta: …" para completar la reserva · RF-55: sin subida de contrato si lo gestiona el canal (también en servidor).
- **Tests (T-01..T-03):** `npm test` (84 tests: dominio + 20 endpoints + entradas del sistema, con dobles en memoria de los servicios de Google), cobertura ≈ 98 % de líneas, CI en GitHub Actions.

### Revisión de cierre (2026-09-25)
- **Proceso:** CLAUDE.md §2.2–§2.3 exige mostrar en el chat el informe de las dos revisiones antes de proponer el commit.
- **Trazabilidad:** RF-28 citado de vuelta por HU-08..HU-14; RF-47 por HU-27; RF-57 ⇄ RNF-22.
- **Código:** `subirVideo` audita el cambio y actualiza `Modificado_Por` (RNF-22); constantes con nombre para la espera del bloqueo, las horas de los triggers y los meses por trimestre; límites de archivo por defecto centralizados (`tamanoMaxContratoMB_`, `tamanoMaxVideoMB_`); funciones largas divididas (`construirEntradaReserva_`, `normalizarCambios_`, `enviarAvisoCierreCanales_`/`enviarConfirmacionReserva_`).
- **Interfaz:** mensajes de error sin jerga técnica (§6.7); modal de confirmación accesible con rol de diálogo, foco inicial y Escape (§6.5).
- **Tests:** el de estadísticas ya no depende del año en curso (FIRST: repetible); nuevo test de auditoría del vídeo.
- **Docs:** `Carpeta_Raiz_Id` marcada como solo referencia; despliegue de la v2 aplazado hasta incluir las nuevas funcionalidades (PROXIMOS_PASOS, D-14).

### Fixed (documentación S7)
- Comentarios obsoletos en `auth.gs` (decía `USER_ACCESSING`) y `gestion.gs` (describía la lista antigua de activas); referencias `US-0NN` del código actualizadas a `HU-NN`. Sin cambios de comportamiento.

---

## [1.1.0] - 2026-07-27

### Added
- **Coste fijo del canal en resumen de Crear Reserva:** cuando se selecciona un canal con `Coste_Fijo_Por_Reserva` (ej. seguro Cocopool 9,50 €), aparece una línea "Coste fijo del canal" en el resumen económico y se descuenta del `Importe_Neto`. La línea se oculta si el canal no tiene coste fijo. Campo rastreado en `costeFijoCanal` (variable de módulo en `cliente.html`); incluido ya en el campo `Coste_Canal_Fijo` del Sheet y en el recálculo autoritativo del servidor (ver ADR-0003).
- **Columna "Personas" en la lista de Gestionar Reserva:** muestra el total de ocupantes (`Adultos + Menores`) entre "Salida" y "Check-in revisado". Los campos `adultos` y `menores` se añadieron a la proyección `mapearReservaGestion` en `gestion.gs` (antes solo estaban en `obtenerReserva`).
- **Utilidad `sincronizarReservasCalendario` en `calendario.gs`:** función de mantenimiento (solo uso desde el editor de Apps Script, no expuesta en la UI) que recorre todas las reservas no canceladas y crea los eventos de Calendar que falten, escribiendo el `Calendar_Event_Id` de vuelta en el Sheet. Diseñada para el alta inicial del calendario y la reconciliación manual ante fallos (ver ADR-0010).

### Changed
- **`executeAs: USER_DEPLOYING`** en `appsscript.json`: la Web App pasa a ejecutarse como `operaciontangai@gmail.com` en lugar de como el usuario que accede. Esto permite que `CalendarApp.getCalendarById()` encuentre el calendario del grupo (que solo existe en la cuenta operativa) y que las operaciones de Drive y Sheets funcionen sin tener que compartir cada recurso con cada cuenta personal. La identificación del usuario para auditoría y control de acceso se mantiene mediante `Session.getActiveUser().getEmail()`, que sigue devolviendo el correo real de quien accede (ver ADR-0001 actualizado).
- **Botón "Sincronizar calendario" eliminado de la UI:** la sincronización automática ocurre al crear (en `guardarReservaConBloqueo`) y al cancelar (en `cancelarReserva`). El botón de sincronización manual se eliminó de la sección Estadísticas; la función `sincronizarReservasCalendario` sigue disponible en el editor para uso puntual de mantenimiento.

---

## [1.0.0] - 2026-06-29

### Added
- **Sprint 6 — Gastos / IRPF (ADR-0012):** `gastos.gs` con registro de gastos (con justificante en Drive, `Documentos/Gastos/{Ejercicio}/`, US-027), catálogo de categorías con deducible por defecto, y resumen fiscal por ejercicio y espacio con reparto a tercios (US-028): ingresos íntegros (de `Reservas`), gastos deducibles (comisiones + gastos registrados + amortización de `Config`), rendimiento neto y tercio por comunero; se persiste en `Resumen_Fiscal`. Nueva sección "Gastos" en la navegación (`gastos.html`). Gastos comunes repartidos 50/50 entre espacios.
- **Sprint 2 (cierre) — Inicio y Buscar:** capa de lectura de reservas en `reservas.gs` con endpoints `cargarUltimasReservas` (5 últimas, tabla ordenable por columna, US-004) y `buscarReservas` (por nombre y/o fecha, US-022). Panel "Buscar Reserva" en la sección Crear.
- **Sprint 4 — Gestionar Reserva:** `gestion.gs` (lista de activas con filtros rápidos US-023; edición con auditoría campo a campo en `Historial_Cambios` US-015; ciclo de vida automático de `Estado_Reserva` US-016; cancelación con confirmación + aviso de reapertura US-018/020; historial US-019). `drive.gs` (subida de contrato US-017 y vídeos in/out US-030 a `Documentos|Videos / Espacio / reserva`, ADR-0014). `calendario.gs` (evento de ocupación por reserva, color por espacio, US-026/ADR-0010). UI de Gestionar (lista + edición + subidas + historial + modal de cancelación) y de Estadísticas en `gestion.html`. **Alcance v1:** la edición no permite cambiar espacio/canal/fechas/servicios (esos campos son de solo lectura para no recalcular solapamientos); el resto de campos sí.
- **Sprint 5 — Estadísticas, mantenimiento e informes:** `estadisticas.gs` (recálculo diario por zona + `cargarEstadisticas`, US-024/ADR-0009); `mantenimiento.gs` (`tareasNocturnas`: backup del Sheet, purga de Logs/Errores/vídeos, ADR-0013; `instalarTriggers` para los triggers 03:00 y mensual); `informes.gs` (informe mensual y trimestral por email con KPIs por espacio/canal, archivado en `Historico_Informes`, US-021; sin gráficas Charts en esta versión). Claves `Calendar_Id`/`Calendar_Url` añadidas a `Config`.
- ADR-0010 cerrado: un único calendario con color por espacio, enlazado (no embebido).
- **Sprint 3 — Guardado de reservas (backend):** `reservas.gs` (`crearReserva`) con validación autoritativa en servidor, construcción de `Fecha_Hora_Inicio/Fin` por modo de fecha (US-008/009), validación de solapamientos con bloqueo duro y `LockService` (US-012, mitiga R-02), recálculo de importes (bruto/comisión/neto + totales y márgenes de servicios, snapshot de coste/precio releído del catálogo), generación de `ID_Reserva` correlativo anual `NN/AA` y guardado en `Reservas` + `Reserva_Servicios` (US-013). `notificaciones.gs` con el aviso de cierre de canales (US-014) y el email de confirmación a los tres (US-025). El formulario "Crear Reserva" conecta el botón Guardar al backend (botón en vuelo, toast de éxito, reset). Helpers de fecha en `utils.gs`.
- **ADR-0013 — Copias de seguridad y retención de datos:** copia automática del Sheet cada 2 días (15 copias, ~30 días de histórico) a una carpeta de Drive, y purga de `Logs` (>90 días) y `Errores` (>365 días), todo en un trigger de mantenimiento nocturno (03:00) con parámetros en `Config`.
- **ADR-0014 — Organización de Drive:** documentos y vídeos in/out organizados por `Espacio / reserva`, con convención de nombres alineada con la estructura manual existente; `ID_Reserva` como correlativo anual `NN/AA` (almacenado `AAAA-NNN`, en Drive `NN-AA`); vídeos podados a los 180 días (`Retencion_Videos_Dias`), documentos conservados (justificantes IRPF).
- **Reservas:** dos campos nuevos `Checkin_Revisado` / `Checkout_Revisado` (Pendiente/Hecho) para los checklists de check-in/check-out (ADR-0004/0005); informativos, no condicionan `Estado_Reserva`. US-029 y US-030 (subida de vídeos in/out).
- **Config:** nuevas claves de carpetas de Drive (`Carpeta_Raiz_Id`, `Carpeta_Videos_Id`, `Carpeta_Documentos_Id`, `Carpeta_Backups_Id`) y de backup/retención (`Backup_Cada_Dias`, `Backup_Max_Copias`, `Retencion_Logs_Dias`, `Retencion_Errores_Dias`, `Retencion_Videos_Dias`).
- Riesgos R-14 (ventana de copia ~30 días) y R-15 (vídeos in/out como prueba borrados a 180 días) en el Risk Register.
- **Sprint 2 (parcial) — Formulario "Crear Reserva" (Parte I):** `catalogo.gs` con la lectura de catálogos en cascada (espacios activos, canales y servicios por espacio) y los endpoints `cargarEspaciosFormulario` / `cargarOpcionesEspacio`. Formulario en la sección "Crear Reserva" (US-006/007/010/011): selección de espacio que filtra canal (con autocompletado de `%_Comisión`), servicios extra con cantidad y campos de fecha adaptados al `Modo_Fecha` del espacio; campo **Importe del alquiler** y resumen económico en vivo (bruto/comisión/neto); validación en cliente de personas, contacto e importe; feedback con toasts. Mobile-first con los tokens del design-system. Pendiente para Sprint 3: validación de fechas/solapamientos, recálculo autoritativo de importes en servidor y guardado.
- ADR-0003 ampliado: añadido el campo **Importe del alquiler** (`Importe_Alquiler`, manual, ≥ 0) y la fórmula del resumen económico (bruto = alquiler + servicios; neto = bruto − comisión − coste de servicios) que faltaban en el diseño original del formulario.
- **Sprint 1 (esqueleto):** estructura del proyecto Apps Script en `src/` (`Code.gs`, `auth.gs`, `config.gs`, `setup.gs`, `utils.gs` + HTML del shell con los tokens de diseño), función `inicializarBaseDeDatos()` que crea todas las hojas con cabeceras y siembra catálogos/Config, autenticación (ADR-0001) y pantalla de acceso denegado. `DEVELOPMENT.md`, `.gitignore` y `.clasp.json.example`.
- ADR-0001 actualizado: la Web App se ejecuta como el usuario que accede (`executeAs: USER_ACCESSING`) y los recursos se comparten con las tres cuentas, para poder identificar al usuario con cuentas personales.
- ADR-0007: registro de viajeros para reservas de Habitación (SES.Hospedajes, RD 933/2021), implementación diferida a Fase 2.
- ADR-0008: reestructuración de la navegación en tres secciones (Inicio + Crear / Gestionar / Estadísticas).
- ADR-0009: estadísticas con cálculo cacheado diario (trigger a las 03:00, hoja `Estadisticas_Cache`).
- ADR-0010: integración con Google Calendar (evento de ocupación por reserva) y campo `Calendar_Event_Id`.
- Cuenta operativa dedicada `operaciontangai@gmail.com` como propietaria de toda la infraestructura (Sheet, Drive, Calendar, email); documentada en ADR-0001 y SDD §2.
- Email de confirmación de reserva generada (US-025) e informe **mensual** además del trimestral (US-021).
- Módulo de Gastos / reparto IRPF incorporado al alcance de Fase 1 (hoja `Gastos`, epic E-06) — **pendiente de discovery detallado**.
- Servicios extra con **cantidad** por servicio; `README_solution.md` (índice de ADRs); criterio UX/UI en la Definition of Done.
- ADR-0011 y `design-system.md`: sistema de diseño visual (paleta terracota/oliva, tipografía Poppins/Inter, espaciado, radios, sombras y componentes), referenciado desde CLAUDE.md §4.
- ADR-0012: módulo de Gastos y reparto para el IRPF — **caso simple** (rendimiento del capital inmobiliario; **no** actividad económica, sin IAE/IVA/036; reparto a partes iguales 33,33 %), con el objetivo de deducir todo lo legal (gastos del art. 23 LIRPF, incluida la amortización del 3 %). Modelo de datos: `Gastos`, `Catálogo_Categorias_Gasto` (con categorías y ejemplos), `Resumen_Fiscal`; parámetros de amortización en `Config`. Incluye reglas de justificación ante AEAT y conservación de documentos (≥4 años; amortización: periodo + 4 años). US-027 y US-028.
- Campo `Incidencia_Resuelta` y modelo económico de servicios extra (hoja `Reserva_Servicios`, coste/precio snapshot, `Margen_Servicios`).
- Sección "Buscar Reserva" (por nombre y/o fecha) y pantalla de Inicio con tabla de las 5 últimas reservas.
- Sección de Estadísticas (3 zonas: Todos / Piscina-Jardín / Habitación).
- Estándares de UX/UI en `CLAUDE.md` (§4).
- Riesgos R-11 (formulario público + documentos de identidad) y R-12 (trigger diario de estadísticas).
- `README.md` y `CHANGELOG.md` en la raíz del repositorio.

### Changed
- **Gestionar Reserva (refinado en pruebas):** la lista pasa a columnas Estado · ID Reserva · Canal · Entrada · Salida · Check-in revisado · Check-out revisado · Nombre · Ingreso, con **badges de color** en Estado (Abierta/Completada/Cancelada) e Ingreso (Ingresado/No ingresado) y **scroll horizontal solo en móvil**. Cada fila tiene **dos botones**: **Ver más** (ficha de solo lectura en bloques: Resumen económico · Documentos · Resto de datos) y **Modificar** (formulario de edición), que se despliegan **a ancho completo bajo la tabla**. El "Buscar Reserva" se trasladó de Crear Reserva al Inicio.
- **Vídeos in/out enlazados por URL:** se añaden las columnas `Video_In_Url` / `Video_Out_Url` a `Reservas`. La subida desde la app guarda el enlace ahí (y el archivo en Drive); también se pueden pegar a mano para reservas ya existentes. "Ver más" muestra los enlaces desde esas columnas (sustituye a la búsqueda por nombre de carpeta). Revisa ADR-0014.
- **Acceso:** el log `ACCESO` se registra solo al entrar a la app (`doGet`); los endpoints de catálogo usan un check silencioso (`sesionAutorizada()`) para no inflar `Logs` ni releer `Usuarios_Autorizados` en cada interacción del formulario.
- **Config cacheada:** `leerConfig()` se lee una vez por ejecución (antes releía toda la hoja `Config` en cada `obtenerConfig`).
- **Despliegue documentado como copia/pega manual** (clasp descartado por la fricción con tres cuentas Google) en README, DEVELOPMENT.md, SDD §2, Definition of Done y NFR-05.2.
- ADR-0002 marcado como **Superseded** por ADR-0008; etiquetas de la interfaz unificadas a "Crear Reserva / Gestionar Reserva / Estadísticas".
- Regla de cierre a `Completada`: ahora depende de `Incidencia_Resuelta` (compensada o no); `Compensación_Daños` pasa a ser informativo.
- `Importe_Neto` = `Importe_Bruto − Importe_Comisión − Servicios_Coste_Total`; la comisión de plataforma se aplica sobre el total.
- Avisos de cierre/reapertura de canales: se envían a los tres co-propietarios.
- Registro de viajeros: cuentan todos los ocupantes (0–99) para el cálculo de `Registro_Viajeros_Estado`.

### Fixed
- `navegar()` migrada a arrow function sin `var` (CLAUDE.md §2.1), manteniéndola global para los `onclick` inline.
- Fecha mínima de los selectores del formulario calculada en hora local en vez de UTC (evitaba el día equivocado de madrugada).
- Toast de feedback con `role="status"`/`aria-live="polite"` para que lo anuncien los lectores de pantalla (§4.5).
- Ruta de los ADR en el SDD (`docs/adr/` → `docs/solution/`).
- Columna `Tipo` unificada a `Espacio` (concepto único).
- Eliminado el residuo `*.Zone.Identifier` y los términos obsoletos "Dashboard" y "Generar Reserva".

## [0.5.0] - 2026-06-22

### Added
- Documentación de discovery completa (PRD ágil): visión, personas, problem statement, story map, user stories, NFR, definition of done, risk register y roadmap.
- Documentos de solución iniciales: SDD y ADR-0001 a ADR-0006.
- `CLAUDE.md` con los estándares de código, documentación y principios de calidad del proyecto.

[Unreleased]: reorganización documental y cambios hacia la v2.0.0.
[1.1.0]: seguridad, mejoras de interfaz y correcciones (commit `v2 Seguro…`).
[1.0.0]: versión inicial completa — toda la funcionalidad de Fase 1 (commit `v2.0 Version inicial completa`).
[0.5.0]: línea base de documentación de discovery y diseño.
