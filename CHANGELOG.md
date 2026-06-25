# Changelog

Todos los cambios relevantes del proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto se versiona de forma aproximada con [SemVer](https://semver.org/lang/es/). En esta etapa las versiones reflejan el estado de la **documentación y el diseño**, no de código (aún no existe).

## [Unreleased]

### Added
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
- ADR-0002 marcado como **Superseded** por ADR-0008; etiquetas de la interfaz unificadas a "Crear Reserva / Gestionar Reserva / Estadísticas".
- Regla de cierre a `Completada`: ahora depende de `Incidencia_Resuelta` (compensada o no); `Compensación_Daños` pasa a ser informativo.
- `Importe_Neto` = `Importe_Bruto − Importe_Comisión − Servicios_Coste_Total`; la comisión de plataforma se aplica sobre el total.
- Avisos de cierre/reapertura de canales: se envían a los tres co-propietarios.
- Registro de viajeros: cuentan todos los ocupantes (0–99) para el cálculo de `Registro_Viajeros_Estado`.

### Fixed
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
