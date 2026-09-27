# Arquitectura — KAF Rent (arc42)

**Versión:** 1.0  
**Fecha:** 2026-09-25  
**Estado:** Documento vivo; refleja el sistema implementado (v1.1 + cambios de la v2 en curso)  
**Plantilla:** [arc42](https://arc42.org) v8 (12 secciones)  
**Sustituye a:** `SDD.md` y `docs/discovery/08_risk_register.md`

> Qué y por qué: [docs_dev/discovery/](../discovery/). Decisiones: [adr/](adr/). Estilo visual: [design-system.md](design-system.md). Reglas de trabajo: [CLAUDE.md](../../CLAUDE.md).

---

## 1. Introducción y objetivos

### 1.1 Resumen de requisitos
Webapp única para gestionar el alquiler de **Piscina/Jardín** (por franjas horarias) y **Habitación Interior** (por noches) de Calle 16, vendidos por varios canales: alta guiada con bloqueo de solapamientos, ciclo de vida auditado, avisos de sincronización de canales, calendario de ocupación, evidencias en Drive, estadísticas, informes y gastos/IRPF. Detalle: [01_problema.md](../discovery/01_problema.md), [02_historias_usuario.md](../discovery/02_historias_usuario.md), [03_requisitos_funcionales.md](../discovery/03_requisitos_funcionales.md).

### 1.2 Objetivos de calidad (por prioridad)

| # | Objetivo | Motivación | RNF |
|---|---|---|---|
| 1 | **Seguridad** — solo tres personas acceden; toda función protegida | Datos personales de huéspedes (RGPD) | RNF-19 a RNF-26 |
| 2 | **Integridad y fiabilidad** — cero reservas dobles, sin datos inconsistentes, copias de seguridad | P-01, P-12 | RNF-13 a RNF-17 |
| 3 | **Usabilidad** — Ana y Luis sin formación, en móvil | P-11 | RNF-08 a RNF-12 |
| 4 | **Mantenibilidad** — una persona mantiene todo; configurable sin código; con tests | R-06 | RNF-27 a RNF-30 |
| 5 | **Coste cero** | Restricción del proyecto | RNF-33 |

### 1.3 Partes interesadas

| Rol | Quién | Expectativa |
|---|---|---|
| Copropietario desarrollador | PER-01 | Sistema fiable, simple de mantener y bien documentado |
| Copropietarios usuarios | PER-02, PER-03 | Interfaz muy sencilla en móvil |
| Huésped | — | Sus datos protegidos; en Fase 2, formulario de viajeros sencillo |
| Gestor fiscal | Externo | Datos y justificantes correctos por ejercicio |
| AEAT, Ministerio del Interior, AEPD | Autoridades | Cumplimiento fiscal, registro de viajeros y RGPD |

---

## 2. Restricciones

| Tipo | Restricción |
|---|---|
| Técnica | Google Apps Script (V8, JavaScript ES2019+), HTML Service, Google Sheets como base de datos, Drive, Calendar y MailApp. Sin servidores ni bases de datos propias. |
| Técnica | Cuotas de una cuenta Gmail personal: 6 min por ejecución, 90 min/día de triggers, 100 emails/día (RNF-05). |
| Técnica | Todas las funciones globales de los `.gs` comparten ámbito, y cualquiera sin sufijo `_` es invocable desde el cliente con `google.script.run` (→ RNF-20, B-01). |
| Técnica | Un fichero HTML no puede llamarse igual que un `.gs` (de ahí `gestion_interfaz`, `gastos_interfaz`). |
| Organizativa | Un único desarrollador y mantenedor (R-06). Coste cero también en herramientas: tests y CI gratuitos (RNF-33). |
| Organizativa | Despliegue con **clasp** y credenciales locales con nombre (`--user operacion`); ninguna credencial en GitHub; copia/pega manual solo como emergencia ([ADR-0015](adr/0015-despliegue-con-clasp-multicuenta.md), [DEVELOPMENT.md](../DEVELOPMENT.md)). |
| Convenciones | Estándares de código, documentación, UX/UI, tests y proceso en [CLAUDE.md](../../CLAUDE.md). |

---

## 3. Contexto y alcance

```
                  ┌──────────────────────── Cuenta operativa operaciontangai@gmail.com ───────────────────────┐
 Copropietarios   │                                                                                             │
 (3 cuentas  ───► │  Web App (HTML Service)  ──google.script.run──►  Servidor Apps Script (.gs)                │
 personales)      │   index/cliente/…html                             │      │        │         │       │       │
  navegador       │                                                   ▼      ▼        ▼         ▼       ▼       │
                  │                                               Sheets   Drive   Calendar   MailApp  Triggers │
                  │                                            (BBDD_KAF_Rent) (docs/vídeos/backups)     (03:00, día 1)│
                  └─────────────────────────────────────────────────────────────────────────────────────────────┘
       ▲                                                                              │ emails
       │ login (Google Identity)                                                      ▼
   Google Accounts                                                     Buzones de los 3 copropietarios

 Fuera del sistema (manual): plataformas de alquiler (Airbnb, Booking, Cocopool…) ← avisos de cierre/reapertura
                             gestor fiscal ← resumen fiscal · SES.Hospedajes (Fase 2)
```

| Socio | Entrada | Salida |
|---|---|---|
| Copropietarios | Reservas, cambios, gastos, archivos | Pantallas, emails |
| Google Accounts | Identidad (email de la sesión) | — |
| Plataformas de alquiler | *(ninguna integración)* | Cierre/reapertura manual guiada por email |
| Gestor fiscal | Validación de criterios | Resumen fiscal y justificantes |

---

## 4. Estrategia de solución

| Objetivo | Estrategia | ADR |
|---|---|---|
| Coste cero y mínimo mantenimiento | Todo en el ecosistema Google de una cuenta operativa | 0001 |
| Seguridad | Login de Google + lista `Usuarios_Autorizados` + autorización en cada endpoint | 0001 |
| Cero reservas dobles | Validación en servidor con `LockService`; el Sheet es la fuente de verdad | 0003, 0010 |
| Estado coherente | Un único `Estado_Reserva` calculado | 0004 |
| Trazabilidad | Auditoría campo a campo en `Historial_Cambios` | 0005 |
| Usabilidad | Formulario guiado por catálogos; hub + secciones; sistema de diseño propio mobile-first | 0003, 0008, 0011 |
| Rendimiento | Lecturas en bloque; estadísticas cacheadas; mantenimiento nocturno | 0009, 0013 |
| Configurabilidad | Catálogos y `Config` en el Sheet | 0003 |
| Evidencias | Drive por espacio/reserva, convivencia con la estructura manual | 0014 |

---

## 5. Vista de bloques

### 5.1 Nivel 1

| Bloque | Responsabilidad | Tecnología |
|---|---|---|
| **Cliente** | Pantallas, navegación, validación inmediata, resumen económico en vivo | `index.html`, `cliente.html`, `gestion_interfaz.html`, `gastos_interfaz.html`, `estilos.html`, `acceso-denegado.html` |
| **Servidor** | Autorización, reglas de negocio, validación autoritativa, persistencia, integraciones | `.gs` (V8) |
| **Almacenamiento** | Datos (Sheet), archivos (Drive), ocupación (Calendar) | Google Workspace personal |

### 5.2 Nivel 2 — Capas y ficheros del servidor (Clean Architecture ligera)

Tres capas con dependencias solo hacia dentro ([CLAUDE.md §3.3](../../CLAUDE.md)). **La capa se ve en el nombre del fichero** (`api_`, `dominio_`, `infra_`) y en su primera línea (`// Capa: …`).

```
 api_*.gs      Endpoints y entradas del sistema: autorización, try/catch, bloqueo, forma {success,data,error}
    │ usa                  ▼ usa
 dominio_*.gs  Funciones PURAS: validaciones, importes, estado, solapamiento, IDs, agregados, fiscalidad
    ▲ datos de             (no llama a servicios de Google ni lee la hora: la recibe)
 infra_*.gs    Repositorios y adaptadores: Sheets (por campo, no por posición), Drive, Calendar, Mail, Config
```

| Capa | Fichero | Responsabilidad | Endpoints / entradas públicas | ADR |
|---|---|---|---|---|
| API | `api_web.gs` | `doGet`, plantillas | `doGet`, `include` | 0001, 0008 |
| API | `api_seguridad.gs` | Identidad, autorización, `ejecutarEndpoint_` (plantilla de endpoint), `ejecutarTareaDelSistema_` (triggers/editor) | — | 0001 |
| API | `api_catalogo.gs` | Catálogos del formulario | `cargarEspaciosFormulario`, `cargarOpcionesEspacio` | 0003 |
| API | `api_reservas.gs` | Crear reserva; Inicio y buscador | `crearReserva`, `cargarUltimasReservas`, `buscarReservas` | 0003, 0014 |
| API | `api_gestion.gs` | Lista, ficha, edición auditada, servicios, cancelación, historial | `listarReservasActivas`, `obtenerReserva`, `actualizarReserva`, `cargarServiciosReserva`, `actualizarServiciosReserva`, `cancelarReserva`, `obtenerHistorial` | 0004, 0005 |
| API | `api_documentos.gs` | Contrato y vídeos | `subirContrato`, `subirVideo` | 0014 |
| API | `api_checklist.gs` | Checklists por reserva, fotos de desperfectos y editor del catálogo (Admin) | `cargarChecklist`, `guardarChecklist`, `confirmarChecklist`, `subirFotoDesperfecto`, `cargarCatalogoChecklist`, `guardarPuntoChecklist` | — |
| API | `api_estadisticas.gs` | Estadísticas y enlace al calendario | `cargarEstadisticas`, `recalcularEstadisticas`, `obtenerEnlaceCalendario` | 0009, 0010 |
| API | `api_gastos.gs` | Gastos y resumen fiscal | `cargarCategoriasGasto`, `registrarGasto`, `calcularResumenFiscal` | 0012 |
| API | `api_sistema.gs` | Triggers, menú y utilidades de editor (protegidas) | `tareasNocturnas`, `informesProgramados`, `instalarTriggers`, `sincronizarReservasCalendario`, `inicializarBaseDeDatos`, `onOpen` | 0009, 0013 |
| Dominio | `dominio_reservas.gs` | Validaciones, fechas, importes (fórmula única), solapamiento, IDs, ciclo de vida, edición, filtros | — | 0003–0005, 0014 |
| Dominio | `dominio_informes.gs` | Agregados de estadísticas e informes, periodos | — | 0009 |
| Dominio | `dominio_fiscal.gs` | Validación e ID de gastos, amortización, resumen a tercios | — | 0012 |
| Dominio | `dominio_roles.gs` | Roles (Admin, Gestión, Soporte, Sistema) y sus permisos; rol vacío o antiguo = Gestión (F-11) | — | 0001 |
| Infra | `infra_esquema.gs` | Hojas y campos lógico → columna (fuente única), semillas | — | — |
| Infra | `infra_comun.gs` | Tablas por campo (lectura/escritura en bloque, reescritura atómica), fechas, formato, escape HTML, logs/errores | — | 0013 |
| Infra | `infra_config.gs` | `Config` cacheada | — | — |
| Infra | `infra_repositorio_reservas.gs` | Reservas, líneas de servicio, historial | — | 0005 |
| Infra | `infra_repositorio_checklist.gs` | Catálogo y registro de checklists (escritura en bloque) | — | — |
| Dominio | `dominio_checklist.gs` | Puntos aplicables, lista resuelta, días hasta la siguiente reserva, validación del editor (F-14) | — | — |
| Infra | `infra_repositorio_gastos.gs` · `infra_repositorio_informes.gs` | Gastos y resumen fiscal · cache de estadísticas e histórico de informes | — | 0009, 0012 |
| Infra | `infra_catalogo.gs` | Catálogos (espacios, canales, servicios, categorías) | — | 0003 |
| Infra | `infra_drive.gs` · `infra_calendario.gs` · `infra_correo.gs` | Adaptadores de Drive, Calendar y correo (no bloquean la operación principal) | — | 0006, 0010, 0014 |
| Infra | `infra_mantenimiento.gs` | Copias, purgas y poda de vídeos | — | 0013, 0014 |

**Reglas de la capa API (RNF-20):** toda función interna termina en `_` (Apps Script no la expone a `google.script.run`); solo quedan públicos los 20 endpoints de la interfaz y las entradas del sistema, que se protegen con `ejecutarTareaDelSistema_` (solo trigger real del proyecto o ejecución directa desde editor/menú). Lo verifica `tests/endpoints/seguridad.test.js`.

**Sin dependencias entre ficheros al cargar:** Apps Script no garantiza el orden de carga, así que ninguna constante de nivel superior usa otra de otro fichero (probado cargando en orden inverso).

---

## 6. Vista de ejecución

### 6.1 Carga de la app
1. `doGet` → `obtenerEmailSesion_` → `verificarAcceso_` (lee `Usuarios_Autorizados`, escribe en `Logs`).
2. Autorizado → plantilla `index` (incluye estilos y JS); si no → `acceso-denegado`.
3. El cliente pide `cargarUltimasReservas`, `obtenerEnlaceCalendario`, `cargarEstadisticas`, `listarReservasActivas`, `cargarEspaciosFormulario` y `cargarCategoriasGasto`.

### 6.2 Crear reserva (HU-15, HU-16)
```
Cliente ──crearReserva(datos)──► ejecutarEndpoint_ (autorización, try/catch)
            prepararReserva_: catálogos (infra) → construirFechas_ → validarDatosReserva_
                              → resolverLineasServicio_ (snapshot) → calcularImportes_          [dominio]
            conBloqueo_ → guardarReservaNueva_:
               ├─ leerReservas_ → haySolapamiento_? → {success:false, Mensaje_Solapamiento}
               ├─ generarIdReserva_ → construirReservaNueva_                                  [dominio]
               ├─ anadirReserva_ + anadirLineasServicio_                                      [infra]
               ├─ crearEventoReserva_(invitados = usuarios activos, F-13) → guarda Calendar_Event_Id (fallo → '' + Errores; B-11)
               └─ notificarReservaCreada_ (cierre de canales + confirmación; fallos → Errores)
            → {success:true, id:'NN/AA'}  ·  sin evento: + {aviso, incidencia: ID}  (B-14)
  [cliente] aviso → ventana modal → "Enviar al administrador" → notificarIncidencia(ID)
            → erroresDeReserva_ (hoja Errores) → enviarIncidenciaAdmin_ → cuentas con Rol = Admin  (F-21)
```

### 6.3 Editar reserva (HU-23, HU-25)
`actualizarReserva` → `validarCambiosReserva_` (incl. dominios) → bloqueo → `reservaModificable_` (existe y no está cancelada) → `aplicarCambios_` (importes, estado, diffs; pura) → `guardarReserva_` → `registrarHistorial_` → si cambió el nombre, `actualizarTituloEvento_`.

### 6.4 Cancelar reserva (HU-26)
`cancelarReserva` → bloqueo → `cancelar_` (pura) → `guardarReserva_` → `registrarHistorial_` → `eliminarEventoReserva_` → `notificarReaperturaCanales_`.

### 6.5 Mantenimiento nocturno (03:00)
`tareasNocturnas(e)` → `ejecutarTareaDelSistema_` (valida `e.triggerUid`) → `ejecutarTarea_` × {`recalcularEstadisticas_`, `copiaSeguridadSheet_`, `purgarPorAntiguedad_` (Logs, Errores), `purgarVideosAntiguos_`}; cada fallo va a `Errores` sin detener las demás.

### 6.6 Informes (día 1, 07:00)
`informesProgramados(e)` → `periodoMensual_` (y `periodoTrimestral_` si `esInicioDeTrimestre_`) → `reservasDelPeriodo_` → `agregarPorEspacioCanal_` → `archivarInforme_` + `enviarInforme_` (HTML escapado).

---

## 7. Vista de despliegue

| Elemento | Detalle |
|---|---|
| Cuenta | `operaciontangai@gmail.com`: propietaria del Sheet, el proyecto de script (vinculado al Sheet), Drive y Calendar |
| Web App | "Ejecutar como: **Yo**" (`USER_DEPLOYING`) · acceso "**Cualquiera con cuenta de Google**" |
| Versiones | `/dev` para probar; nueva implementación solo para publicar |
| Triggers | `tareasNocturnas` (diario 03:00) e `informesProgramados` (día 1, 07:00), instalados con `instalarTriggers()` |
| Entornos | Hoy solo producción. Para los tests de integración se usará un **Sheet de pruebas** separado (CLAUDE.md §7) |
| Código fuente | Git + GitHub; se sube con `clasp --user operacion push` desde el equipo (ADR-0015); copia/pega como emergencia |

---

## 8. Conceptos transversales

### 8.1 Modelo de datos (hojas del Sheet `BBDD_KAF_Rent`)

Hojas y campos se definen una sola vez en `infra_esquema.gs` (campo lógico → nombre de columna). El código accede **por campo**: localiza cada columna por su cabecera y, si no la encuentra, usa su posición en el esquema (REF-02 resuelto). Añadir o reordenar columnas no rompe nada.

#### `Reservas` (orden real de columnas, índice desde 0)

| # | Campo | Tipo | Notas |
|---|---|---|---|
| 0 | ID_Reserva | Texto | `AAAA-NNN`; se muestra `NN/AA` (ADR-0014) |
| 1 | Espacio | Texto | De `Catálogo_Espacios` |
| 2 | Canal | Texto | De `Catálogo_Canales`, filtrado por espacio |
| 3 | Fecha_Hora_Inicio | Fecha+hora | Según el modo del espacio (ADR-0003) |
| 4 | Fecha_Hora_Fin | Fecha+hora | Ídem |
| 5 | Nombre_Huesped | Texto | Obligatorio |
| 6 | Telefono_Huesped | Texto | Opcional, 9 cifras |
| 7 | Email_Huesped | Texto | Opcional, formato básico |
| 8 | Adultos | Entero | ≥ 1 |
| 9 | Menores | Entero | ≥ 0 |
| 10 | Servicios_Extra | Texto | Resumen legible ("Hielo x2, BBQ x1") |
| 11 | Importe_Alquiler | Número | Manual, ≥ 0 |
| 12 | Servicios_Precio_Total | Número | Σ cantidad × precio snapshot |
| 13 | Servicios_Coste_Total | Número | Σ cantidad × coste snapshot |
| 14 | Importe_Bruto | Número | Calculado |
| 15 | %_Comisión | Número | 0–100 |
| 16 | Importe_Comisión | Número | Calculado |
| 17 | Margen_Servicios | Número | Calculado |
| 18 | Importe_Neto | Número | Calculado |
| 19 | Estado_Cobro | Texto | No ingresado / Ingresado |
| 20 | Contrato_Estado | Texto | Gestionado por canal / Pendiente / Firmado |
| 21 | Contrato_Archivo | URL | Drive |
| 22 | Incidencias | Texto | Sin incidentes / Con incidentes |
| 23 | Incidente_Comunicado | Texto | Sí / No |
| 24 | Compensación_Daños | Texto | No recibida / Recibida (informativo) |
| 25 | Incidencia_Resuelta | Texto | Sí / No (condición de cierre) |
| 26 | Estado_Reserva | Texto | Abierta / Completada / Cancelada (calculado) |
| 27 | Registro_Viajeros_Estado | Texto | Pendiente / Completado (solo `Rango_Dias`, Fase 2) |
| 28 | Checkin_Revisado | Texto | Pendiente / Hecho |
| 29 | Checkout_Revisado | Texto | Pendiente / Hecho |
| 30 | Calendar_Event_Id | Texto | Vacío si falló Calendar |
| 31 | Notas | Texto | |
| 32 | Registrado_Por | Email | Automático |
| 33 | Fecha_Registro | Fecha+hora | Automático |
| 34 | Modificado_Por | Email | Automático |
| 35 | Fecha_Última_Modificación | Fecha+hora | Automático |
| 36 | Video_In_Url | URL | Subida o pegado a mano |
| 37 | Video_Out_Url | URL | Ídem |
| 38 | Coste_Canal_Fijo | Número | Snapshot de `Coste_Fijo_Por_Reserva` del canal |

#### Otras hojas

| Hoja | Columnas | Propósito | ADR |
|---|---|---|---|
| `Reserva_Servicios` | ID_Reserva, Nombre_Servicio, Cantidad, Coste_Unitario_Snapshot, Precio_Unitario_Snapshot | Líneas de servicios extra | 0003 |
| `Catálogo_Espacios` | Nombre_Espacio, Activo, Modo_Fecha | Espacios y modo de fecha | 0003 |
| `Catálogo_Canales` | Espacio, Nombre_Canal, Activo, %_Comisión_Default, Gestión_Contrato, Coste_Fijo_Por_Reserva | Canales por espacio | 0003, 0004 |
| `Catálogo_Servicios_Extra` | Espacio, Nombre_Servicio, Activo, Coste_Unitario, Precio_Unitario | Servicios por espacio | 0003 |
| `Catálogo_Categorias_Gasto` | Nombre_Categoria, Descripcion, Activo, Deducible_Default, Es_Amortizacion | Categorías fiscales (sembradas) | 0012 |
| `Config` | Clave, Valor, Descripcion | Parámetros (§8.7) | — |
| `Usuarios_Autorizados` | Email, Activo, Rol (`Admin` = gestión + técnico · `Gestión` · `Soporte` = técnico · `Sistema` = cuenta de la app; vacío o `Copropietario` = Gestión; RF-84) | Control de acceso | 0001 |
| `Logs` | Fecha_Hora, Tipo, Email, Detalle | Accesos (90 días) | 0001, 0013 |
| `Errores` | Fecha_Hora, Funcion, Mensaje, Contexto (JSON; incluye `pila` técnica desde v2) | Errores (365 días) | 0013 |
| `Historial_Cambios` | Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo | Auditoría de negocio | 0005 |
| `Historico_Informes` | Periodo, Tipo, Espacio, Canal, Num_Reservas, Ingresos_Brutos, Comisiones, Ingresos_Netos, Ocupacion | Archivo de informes (append-only; `Ocupacion` vacía, B-08) | 0009 |
| `Estadisticas_Cache` | Zona, Total_Reservas_Anyo, Ingresos_Netos, Fecha_Actualizacion | Snapshot diario | 0009 |
| `Gastos` | ID_Gasto, Fecha, Ejercicio, Concepto, Categoria, Espacio, Importe, Deducible, Pagado_Por, Justificante, Notas | Gastos | 0012 |
| `Resumen_Fiscal` | Ejercicio, Espacio, Ingresos_Integros, Gastos_Deducibles, Rendimiento_Neto, Tercio_Comunero | Resumen persistido | 0012 |
| `Registro_Viajeros` | ID_Reserva, Nombre_Completo, Tipo_Documento, Num_Documento, Num_Soporte, Nacionalidad, Fecha_Nacimiento, Direccion, Telefono, Email, Parentesco, Foto_Anverso, Foto_Reverso | Fase 2 (creada, sin uso) | 0007 |
| `Catálogo_Checklist` | ID_Punto, Espacio, Momento, Bloque, Punto, Tipo (Casilla/Fecha/Video/Foto), Servicios_Requeridos, Condicion, Punto_Pareja, Orden, Activo | Puntos de las checklists; semilla = [checklists-check-in-out.md](../../docs_work/doc_check/checklists-check-in-out.md) | DD-01 |
| `Registro_Checklist` | ID_Reserva, Momento, ID_Punto, Estado, Valor, Usuario, Fecha_Hora | Lo marcado en cada reserva (fila `OBSERVACIONES` para el texto libre) | DD-01 |

### 8.2 Modelo de importes

- `Importe_Bruto = Importe_Alquiler + Servicios_Precio_Total` (lo que paga el huésped).
- `Importe_Comisión = Importe_Bruto × %_Comisión / 100` (también sobre los servicios; puede ser 0).
- `Margen_Servicios = Servicios_Precio_Total − Servicios_Coste_Total`.
- `Importe_Neto = Importe_Bruto − Importe_Comisión − Servicios_Coste_Total − Coste_Canal_Fijo`.
- Al **añadir servicios a una reserva existente**, la comisión y el coste fijo **no** se recalculan (ADR-0003).
- La fórmula vive en un único sitio: `calcularImportes_` (`dominio_reservas.gs`), con `comisionFija` para los servicios añadidos después (REF-01 resuelto).

### 8.3 Identificadores y referencias
- Reserva: `AAAA-NNN` → `NN/AA` (pantalla) → `NN-AA` (Drive). El año es el **de creación de la reserva** (D-04, B-15); hasta v2 era el de `Fecha_Hora_Inicio`, y las referencias ya emitidas no cambian.
- Gasto: `G{AAAA}-NNN`.

### 8.4 Fechas y zona horaria
- Zona `Europe/Madrid` (`appsscript.json`). El cliente envía fechas `YYYY-MM-DD` y horas `HH:MM`; el servidor las combina en hora local (`combinarFechaHora`).
- Solapamiento: rangos semiabiertos (los extremos que se tocan no solapan).

### 8.5 Seguridad
- Autenticación de Google y autorización por lista en `doGet` y en cada endpoint (`ejecutarEndpoint_` → `sesionAutorizada_`).
- **Regla de exposición (RNF-20, implantada en v2):** toda función global sin sufijo `_` es invocable desde el cliente y se ejecuta con los permisos de la cuenta operativa; por eso todo lo interno termina en `_`. Las entradas que Google necesita públicas (triggers, menú, utilidades de editor) pasan por `ejecutarTareaDelSistema_`: solo se ejecutan desde un trigger real del proyecto (`e.triggerUid`) o de forma directa (usuario activo = usuario efectivo); los intentos desde la web quedan en `Logs` como `SISTEMA_DENEGADO`.
- Validación autoritativa en el servidor, incluidos los valores de dominio; el cliente solo mejora la UX (RNF-24).
- Salida HTML escapada: `escaparHtml_` en el servidor y `textContent` en el cliente (RNF-26).
- `Errores` no guarda datos personales del huésped en el contexto (RNF-34).

### 8.6 Errores y registro
- Todo endpoint: `try/catch` → `registrarError(funcion, error, contexto)` → `{ success: false, error: 'mensaje para el usuario' }`.
- Integraciones (Calendar, Mail) capturan sus propios errores y no propagan (RNF-16).
- Acceso a hojas **por cabecera**: columnas en cualquier orden y columnas propias toleradas; si falta una del esquema, error claro (B-16). Excepción: `registrarLog_`/`registrarError_` escriben con `appendRow` en el orden del esquema (TD-01).
- `registrarLog`/`registrarError` nunca relanzan. `registrarError_` guarda en `Contexto` la pila técnica del error.
- Un fallo secundario que el usuario debe conocer vuelve en la respuesta como `aviso` (y, si procede, `incidencia`); el cliente lo muestra en ventana modal con opción de enviarlo a las cuentas `Admin` (F-21, RF-82).

### 8.7 Configuración (`Config`)
Claves sembradas por `infra_esquema.gs`: `Dias_Office_Reponer` (F-14), `Emails_Notificacion`, `Mensaje_Solapamiento`, `Hora_CheckIn_Default`, `Hora_CheckOut_Default`, `Tamano_Max_Contrato_MB`, `Tamano_Max_Video_MB`, `Valor_Construccion`, `Proporcion_Alquilada`, `Carpeta_Raiz_Id`, `Carpeta_Videos_Id`, `Carpeta_Documentos_Id`, `Carpeta_Backups_Id`, `Backup_Cada_Dias`, `Backup_Max_Copias`, `Retencion_Logs_Dias`, `Retencion_Errores_Dias`, `Retencion_Videos_Dias`, `Calendar_Id`, `Calendar_Url`. Se leen una vez por ejecución (`leerConfig`).

### 8.8 Concurrencia
`LockService.getScriptLock()` (espera de 20 s) en crear, editar, cancelar, servicios y gastos.

### 8.9 Contrato cliente-servidor
Respuesta siempre `{ success: boolean, data?, error? }` (algunos endpoints usan claves propias: `id`, `url`, `estado`). Cliente: `withSuccessHandler` + `withFailureHandler`, botón deshabilitado durante la llamada.

### 8.10 Interfaz
Hub + secciones (ADR-0008), mobile-first, tokens de [design-system.md](design-system.md) (ADR-0011), estándares de UX de CLAUDE.md §6.

### 8.11 Almacenamiento en Drive
`KAF. KAF Rent/` → `Documentos/{Espacio}/{reserva}/` (sin borrado), `Documentos/Gastos/{Ejercicio}/`, vídeos `{Espacio}/{reserva}/` (180 días), `Backups/` (15 copias). ADR-0013, ADR-0014.

### 8.12 Testabilidad
Ver CLAUDE.md §7. **Implantado en v2:** `npm test` carga los `.gs` en un contexto `vm` (un ámbito global, como Apps Script) con dobles en memoria de Sheets, Drive, Calendar, Mail, Lock, Session y ScriptApp (`tests/soporte/`). Hay tests unitarios del dominio y tests de los 20 endpoints y de las entradas del sistema; cobertura ≈ 98 % de líneas; CI en GitHub Actions. Pendiente (S11): E2E de la interfaz con Playwright e integración contra un Sheet de pruebas.

---

## 9. Decisiones de arquitectura

Índice y estado en [adr/README.md](adr/README.md) (formato MADR 4.0).

---

## 10. Requisitos de calidad

### 10.1 Árbol de calidad
Seguridad (RNF-19 a RNF-26) · Fiabilidad (RNF-13 a RNF-18) · Usabilidad (RNF-08 a RNF-12) · Mantenibilidad (RNF-27 a RNF-30) · Rendimiento (RNF-01 a RNF-05) · Coste (RNF-33) · Legal (RNF-34 a RNF-38). Detalle en [04_requisitos_no_funcionales.md](../discovery/04_requisitos_no_funcionales.md).

### 10.2 Escenarios de calidad

| ID | Escenario | Respuesta esperada | RNF |
|---|---|---|---|
| QS-01 | Dos usuarios guardan a la vez la misma franja | Solo una se guarda; la otra ve el mensaje de solapamiento | RNF-15 |
| QS-02 | Una cuenta Google ajena abre la URL y llama a funciones desde la consola | Pantalla de acceso denegado; toda llamada responde `success:false` sin tocar datos | RNF-20 |
| QS-03 | Calendar no responde al guardar | La reserva se guarda en < 5 s; el fallo queda en `Errores`; se reconcilia después | RNF-16 |
| QS-04 | Se borra por error la hoja `Reservas` | Se restaura desde la copia de ≤ 2 días | RNF-17 |
| QS-05 | Luis registra una reserva desde el móvil sin ayuda | La completa en < 5 min | RNF-08, RNF-11 |
| QS-06 | Se añade un canal nuevo | Basta una fila en `Catálogo_Canales` | RNF-27 |
| QS-07 | Un huésped se llama `<img src=x onerror=alert(1)>` | Se muestra como texto, sin ejecutarse | RNF-26 |

---

## 11. Riesgos y deuda técnica

### 11.1 Registro de riesgos (PMI/PMBOK: probabilidad × impacto)

| ID | Riesgo | P | I | Exposición | Mitigación | Estado |
|---|---|---|---|---|---|---|
| R-01 | Superar las cuotas de Apps Script | B | M | Baja | Lecturas en bloque; un solo trigger; vigilar el panel de cuotas | Abierto |
| R-02 | Escritura concurrente que elude el solapamiento | B | M | Baja | `LockService` (RF-30) | Mitigado |
| R-03 | Incumplimiento RGPD con datos de huéspedes | M | A | **Media** | Base legal contractual, minimización, política de retención, capacidad de localizar y borrar datos | Abierto (RNF-37 pendiente) |
| R-04 | Contrato demasiado grande para subir | B | B | Baja | `Tamano_Max_Contrato_MB` en `Config` | Mitigado |
| R-05 | Emails automáticos en spam | M | B | Baja | Añadir el remitente a contactos; asuntos consistentes | Abierto |
| R-06 | Único desarrollador (punto único de fallo) | A | A | **Alta** | Documentación, trazabilidad, arquitectura simple, tests; emergencia: usar el Sheet directamente | Aceptado |
| R-07 | Google depreca funciones de Apps Script | B | A | **Media** | Código modular; datos exportables (RNF-32) | Abierto |
| R-08 | Pérdida o corrupción de datos del Sheet | B | A | **Media** | Copias automáticas (ADR-0013) + historial de versiones | Mitigado |
| R-09 | Compromiso de una cuenta autorizada | B | A | **Media** | 2FA; revocación inmediata en `Usuarios_Autorizados`; revisión de `Logs` | Abierto |
| R-10 | Baja adopción por usuarios no técnicos | M | M | **Media** | UAT con journeys; simplicidad; recoger feedback | Abierto (UAT sin registrar, D-07) |
| R-11 | Formulario público de viajeros con documentos de identidad | M | A | **Alta** | Casar con reserva real, política de borrado, acceso restringido, aviso de privacidad, revisión legal previa | Abierto (Fase 2) |
| R-12 | El trigger nocturno no se ejecuta | B | B | Baja | Fecha de actualización visible; fallos en `Errores`; recálculo manual | Abierto |
| R-13 | Cuenta operativa única comprometida o perdida | B | A | **Media** | 2FA, custodia de credenciales y códigos de recuperación, copias | Abierto |
| R-14 | Ventana de copia limitada (~30 días) | B | M | Baja | Ampliar `Backup_Max_Copias`; exportación externa (F-09) | Abierto |
| R-15 | Borrado de vídeos elimina la prueba ante daños | B | M | Baja | `Retencion_Videos_Dias` configurable; conservar a mano los vídeos con incidencia | Abierto |
| R-16 | Funciones internas invocables desde el cliente con privilegios de la cuenta operativa | B | A | Media | Sufijo `_` en todo lo interno + `ejecutarTareaDelSistema_` en las entradas públicas; test automático (RNF-20) | **Mitigado en v2** (B-01) |
| R-17 | Regresiones al tocar código sin tests automáticos | M | M | Media | Tests unitarios y de endpoints + CI (v2); faltan E2E e integración (S11) | **En mitigación** |
| R-18 | La implementación publicada no coincide con el repositorio (versión o "Ejecutar como"): fallos que dependen de quién usa la app (B-14: sin evento de Calendar para una cuenta durante 3 meses) | M | A | **Alta** | Checklist de despliegue (ACC-03, T-06) que verifica "Ejecutar como: Yo" y la versión; avisos modales e incidencias al admin (F-21); Informe Técnico (F-16) | **En mitigación** |
| R-19 | Cambios de estructura en hojas con datos reales (la app ya se usa, D-07) | M | A | **Alta** | D-19 (opción A): "Inicializar / reparar hojas" solo añade columnas al final y nunca toca las existentes; lectura por cabecera sin recurrir a la posición (error claro si falta); rellenos de datos antiguos con funciones puntuales y probadas; copia de seguridad antes. Queda: `registrarLog_`/`registrarError_` escriben por posición (TD-01) | **En mitigación** |

*P/I:* A = alta · M = media · B = baja.

### 11.2 Deuda técnica

| ID | Deuda | Estado |
|---|---|---|
| REF-01 | Fórmula de importes triplicada; validaciones duplicadas | ✔ Resuelta en v2: `calcularImportes_` y validaciones únicas en `dominio_reservas.gs` |
| REF-02 | Índices de columna por posición repartidos entre ficheros | ✔ Resuelta en v2: acceso por campo con `infra_esquema.gs` + `leerTabla_` |
| REF-03 | Plantilla repetida en cada endpoint | ✔ Resuelta en v2: `ejecutarEndpoint_` y `ejecutarTareaDelSistema_` |
| REF-04 | Funciones largas que mezclaban niveles | ✔ Resuelta en v2: capas `api_`/`dominio_`/`infra_` |
| TD-05 | Sin tests automáticos | 🟡 Unitarios + endpoints + CI en v2; faltan E2E e integración (S11) |
| TD-06 | Sin linter | Pendiente (T-07, S9) |

Los defectos funcionales (B-xx) están en [PROXIMOS_PASOS.md](../../docs_work/PROXIMOS_PASOS.md).

---

## 12. Glosario

| Término | Definición |
|---|---|
| Espacio | Lo que se alquila: Piscina/Jardín o Habitación Interior |
| Canal | Vía de venta (plataforma o directa) de un espacio |
| Modo de fecha | `Dia_y_Hora` (franja en un día) o `Rango_Dias` (noches) |
| Solapamiento | Dos reservas no canceladas del mismo espacio cuyos rangos se cruzan |
| Snapshot | Copia del coste o precio vigente en el momento de añadir un servicio o crear la reserva |
| Bruto / Neto | Lo que paga el huésped / lo que queda tras comisión, costes de servicios y coste fijo del canal |
| Cuenta operativa | `operaciontangai@gmail.com`, propietaria de toda la infraestructura |
| Comunero | Cada uno de los tres copropietarios a efectos del IRPF (33,33 %) |
| Endpoint | Función del servidor invocada desde el cliente con `google.script.run` |
| `/dev` | URL de pruebas de la Web App con el código guardado más reciente |
