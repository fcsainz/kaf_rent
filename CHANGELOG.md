# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se versiona de forma aproximada con [SemVer](https://semver.org/lang/es/). Las primeras versiones (≤ 0.5) reflejan solo **documentación y diseño**; a partir de ahí, también el **código** desplegado en `src/`.

## [Unreleased]

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

[Unreleased]: estado de trabajo actual, pendiente de consolidar en una versión.
[0.5.0]: línea base de documentación de discovery y diseño.
