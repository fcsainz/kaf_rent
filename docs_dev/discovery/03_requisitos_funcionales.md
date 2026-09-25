# Requisitos funcionales (RF) — KAF Rent

**Versión:** 1.0  
**Fecha:** 2026-09-25  
**Estado:** Vigente  
**Framework:** ISO/IEC/IEEE 29148 (redacción de requisitos: "El sistema debe…", un requisito verificable por fila)

---

## Convenciones

- **ID:** `RF-NN`, agrupados por módulo. Un RF describe un comportamiento **verificable** del sistema. Sus criterios de aceptación son los escenarios Gherkin de la HU de origen.
- **↑ Origen (HU):** la HU de la que deriva. Los RF sin HU se marcan **Sin HU directa** y llevan su **justificación**, normalmente el RNF que los exige.
- **↓ RNF:** requisitos de calidad que este RF ayuda a cumplir. Si no hay ninguno, se marca **Sin RNF directo**.
- **ADR:** decisión de diseño que fija el *cómo*, en [docs_dev/solution/adr/](../solution/adr/).
- **Implementación:** `fichero · función` en [docs_dev/src/](../src/). Si la lógica está en el cliente se indica el HTML.
- **Test:** fichero de test automático que lo verifica (en `tests/`, `npm test`): `dominio` = `tests/dominio/dominio.test.js`; `reservas`, `gestion`, `doc-inf-gastos` (documentos, informes, gastos y mantenimiento) y `seguridad` = `tests/endpoints/<nombre>.test.js`. Los `describe` citan el RF (`RF-NN · …`). Lo que solo se puede probar en el navegador o en Google real indica su sprint previsto (E2E **S11**, smoke **S11**).
- **↓ Sprint:** sprint en que se implementó → sprint en que se corrige o completa, en **negrita**.
- **Estado:** ✅ Implementado · 🟡 Parcial · 🔍 Por verificar · ⏳ Pendiente.

---

## ACC — Acceso y seguridad

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-01 | El sistema debe servir la webapp solo a usuarios con sesión de Google (despliegue "Cualquiera con cuenta de Google", ejecutándose como la cuenta operativa). | HU-01 | RNF-19, RNF-31 | 0001 | `appsscript.json` · `webapp` | Smoke **S11** (T-06) | S1 | ✅ |
| RF-02 | El sistema debe comparar, en cada carga, el email de la sesión con las filas activas de `Usuarios_Autorizados` (sin distinguir mayúsculas). | HU-02 | RNF-20, RNF-21 | 0001 | `api_seguridad.gs` · `verificarAcceso_`, `esUsuarioAutorizado_` | reservas, seguridad | S1 | ✅ |
| RF-03 | El sistema debe mostrar la pantalla "Acceso denegado" si el email no existe, está inactivo o no se puede obtener. | HU-02 | RNF-19, RNF-09 | 0001 | `api_web.gs` · `doGet`; `acceso-denegado.html` | seguridad | S1 | ✅ |
| RF-04 | El sistema debe registrar en `Logs` cada acceso concedido y denegado (fecha, tipo, email, detalle). | HU-02 | RNF-22 | 0001 | `api_seguridad.gs` · `verificarAcceso_`; `infra_comun.gs` · `registrarLog_` | seguridad | S1 | ✅ |
| RF-05 | Toda función invocable desde el cliente debe verificar la autorización antes de leer o escribir datos y responder `{ success: false }` si no la hay. | HU-02, RNF-20 | RNF-20 | 0001 | `api_seguridad.gs` · `ejecutarEndpoint_`, `ejecutarTareaDelSistema_`; todo lo interno con sufijo `_` | seguridad | S1 → S8 ✔ (B-01) | ✅ |
| RF-06 | El sistema debe rellenar `Registrado_Por`/`Fecha_Registro` al crear y `Modificado_Por`/`Fecha_Última_Modificación` al modificar, sin permitir editarlos. | HU-03, HU-23 | RNF-22 | 0001, 0005 | `dominio_reservas.gs` · `construirReservaNueva_`, `aplicarCambios_`, `aplicarServicios_`, `cancelar_` | dominio, gestion | S1–S4 | ✅ |

## INI — Inicio y navegación

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-07 | El Inicio debe mostrar accesos a Crear Reserva, Gestionar Reserva, Estadísticas y Gastos. | HU-04, HU-05 | RNF-08, RNF-11 | 0008 | `index.html` | E2E **S11** (T-05) | S2 | ✅ |
| RF-08 | El sistema debe devolver las 5 reservas más recientes por `Fecha_Registro` con Espacio, Fecha Inicio, Fecha Fin, Nombre e Importe Neto. | HU-04 | RNF-01, RNF-05 | 0008 | `api_reservas.gs` · `cargarUltimasReservas`, `proyeccionListado_` | reservas | S2 | ✅ |
| RF-09 | La tabla del Inicio debe ordenarse por cualquier columna, alternando ascendente y descendente (fechas por valor, no por texto). | HU-04 | RNF-08 | 0008 | `cliente.html` · `ordenarUltimas` | E2E **S11** (T-05) | S2 | ✅ |
| RF-10 | Las tablas y búsquedas sin resultados deben mostrar "No hay reservas registradas". | HU-04, HU-06 | RNF-09 | 0008 | `cliente.html` · `pintarFilas` | E2E **S11** (T-05) | S2 | ✅ |
| RF-11 | El sistema debe buscar reservas no canceladas por nombre (subcadena, sin distinguir mayúsculas) y/o por fecha ocupada, sin ningún campo obligatorio. | HU-06 | RNF-01, RNF-05 | 0008 | `api_reservas.gs` · `buscarReservas`; `dominio_reservas.gs` · `coincideBusqueda_`, `esModificable_` | dominio, reservas | S2 → S8 ✔ (B-02) | ✅ |
| RF-12 | El Inicio debe enlazar al calendario de ocupación usando `Config.Calendar_Url`. | HU-07 | **Sin RNF directo** — enlace de navegación, sin exigencia de calidad propia | 0010 | `api_estadisticas.gs` · `obtenerEnlaceCalendario` | E2E **S11** (T-05) | S4 | ✅ |
| RF-13 | La navegación debe mostrar u ocultar secciones en el cliente y ofrecer siempre la vuelta al Inicio. | HU-05 | RNF-08, RNF-11 | 0008 | `cliente.html` · `navegar` | E2E **S11** (T-05) | S1–S2 | ✅ |

## CRE — Crear reserva

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-14 | El sistema debe ofrecer solo los espacios activos de `Catálogo_Espacios`. | HU-08 | RNF-03, RNF-27 | 0003 | `infra_catalogo.gs` · `obtenerEspacios_`; `api_catalogo.gs` · `cargarEspaciosFormulario` | reservas | S2 | ✅ |
| RF-15 | Al elegir espacio, el sistema debe ofrecer solo sus canales y servicios activos y vaciar los campos dependientes al cambiarlo. | HU-08 | RNF-03, RNF-27 | 0003 | `api_catalogo.gs` · `cargarOpcionesEspacio`; `infra_catalogo.gs`; `cliente.html` · `alCambiarEspacio` | reservas + E2E **S11** (T-05) | S2 | ✅ |
| RF-16 | Los campos de fecha deben adaptarse al `Modo_Fecha` del espacio (`Dia_y_Hora` / `Rango_Dias`). | HU-08, HU-10, HU-11 | RNF-08, RNF-27 | 0003 | `cliente.html` · `mostrarCamposFecha` | E2E **S11** (T-05) | S2 | ✅ |
| RF-17 | El sistema debe autocompletar `%_Comisión` con la comisión por defecto del canal, editable y limitada a 0–100. | HU-09 | RNF-24, RNF-27 | 0003 | `cliente.html` · `alCambiarCanal`; `dominio_reservas.gs` · `validarImportes_` | dominio | S2 | ✅ |
| RF-18 | El sistema debe inicializar `Contrato_Estado` a "Gestionado por canal" si el canal es `Automática` y a "Pendiente" si es `Manual`. | HU-09, HU-16 | RNF-27 | 0004 | `dominio_reservas.gs` · `estadoInicialContrato_` | dominio, reservas | S3 | ✅ |
| RF-19 | En modo `Dia_y_Hora`, inicio = fecha + hora de llegada y fin = fecha + hora de salida, con salida > llegada. | HU-10 | RNF-24 | 0003 | `dominio_reservas.gs` · `construirFechas_`, `validarRangoFechas_` | dominio | S3 | ✅ |
| RF-20 | En modo `Rango_Dias`, inicio = entrada + `Hora_CheckIn_Default` y fin = salida + `Hora_CheckOut_Default` (de `Config`), con fin > inicio. | HU-11 | RNF-24, RNF-27 | 0003 | `dominio_reservas.gs` · `construirFechas_` | dominio, reservas | S3 | ✅ |
| RF-21 | El sistema debe rechazar reservas que empiecen antes de hoy (medianoche local). | HU-10, HU-11 | RNF-24 | 0003 | `dominio_reservas.gs` · `validarRangoFechas_`; `api_reservas.gs` · `prepararReserva_` | dominio, reservas | S3 | ✅ |
| RF-22 | El sistema debe exigir adultos entero ≥ 1 y aceptar menores ≥ 0 (vacío = 0). | HU-12 | RNF-24 | 0003 | `dominio_reservas.gs` · `validarHuesped_` | dominio, reservas | S2 | ✅ |
| RF-23 | El sistema debe guardar cada servicio extra (cantidad ≥ 1) en `Reserva_Servicios` con coste y precio unitarios releídos del catálogo en el servidor (snapshot). | HU-12 | RNF-24, RNF-05 | 0003 | `dominio_reservas.gs` · `resolverLineasServicio_`; `infra_repositorio_reservas.gs` · `anadirLineasServicio_` | dominio, reservas | S2 | ✅ |
| RF-24 | El sistema debe exigir el nombre del huésped y validar, si se informan, teléfono (exactamente 9 cifras) y email (formato básico). | HU-13 | RNF-24, RNF-34 | 0003 | `dominio_reservas.gs` · `validarHuesped_`; `cliente.html` · `validarFormulario` | dominio, reservas | S2 | ✅ |
| RF-25 | El sistema debe exigir un importe del alquiler numérico ≥ 0. | HU-14 | RNF-24 | 0003 | `dominio_reservas.gs` · `validarImportes_` | dominio, reservas | S2 | ✅ |
| RF-26 | El formulario debe mostrar en vivo bruto, comisión, coste fijo del canal y neto (orientativo). | HU-14 | RNF-09 | 0003 | `cliente.html` · `recalcularImportes` | E2E **S11** (T-05) | S2 (+ v1.1) | ✅ |
| RF-27 | El servidor debe recalcular de forma autoritativa servicios (precio, coste), bruto, comisión, margen, coste fijo del canal (snapshot) y neto, con las fórmulas de [arc42 §8.2](../solution/arc42.md#82-modelo-de-importes). | HU-14 | RNF-24 | 0003 | `dominio_reservas.gs` · `calcularImportes_` (fórmula única, REF-01) | dominio, reservas | S3 → S8 ✔ (REF-01) | ✅ |
| RF-28 | El servidor debe revalidar todos los datos recibidos: espacio activo, canal activo de ese espacio, fechas, personas, contacto e importes. | HU-08 a HU-15, RNF-24 | RNF-24 | 0003 | `api_reservas.gs` · `prepararReserva_`; `dominio_reservas.gs` · `validarDatosReserva_` | reservas | S3 | ✅ |
| RF-29 | El sistema debe rechazar una reserva si otra no cancelada del mismo espacio se cruza con su rango (los extremos que se tocan no cuentan), con el mensaje `Config.Mensaje_Solapamiento`. | HU-15 | RNF-02, RNF-27 | 0003, 0008 | `dominio_reservas.gs` · `haySolapamiento_`; `api_reservas.gs` · `guardarReservaNueva_` | dominio, reservas | S3 | ✅ |
| RF-30 | El sistema debe serializar con `LockService` la comprobación de solapamiento y la escritura de la reserva. | HU-15, RNF-15 | RNF-15, RNF-02 | 0003 | `api_seguridad.gs` · `conBloqueo_`; `api_reservas.gs` · `crearReserva` | reservas | S3 | ✅ |
| RF-31 | El sistema debe generar `ID_Reserva` como correlativo anual `AAAA-NNN`, mostrarlo como `NN/AA` y usar `NN-AA` en Drive. | HU-16 | RNF-07 | 0014 | `dominio_reservas.gs` · `generarIdReserva_`, `referenciaMostrada_`, `referenciaDrive_` | dominio, reservas | S3 | ✅ (año de referencia: ver D-04) |
| RF-32 | El sistema debe crear la reserva con: Abierta, No ingresado, Sin incidentes, checklists Pendiente y `Registro_Viajeros_Estado` Pendiente solo en `Rango_Dias`. | HU-16 | **Sin RNF directo** — regla de negocio pura (ADR-0004) | 0004, 0007 | `dominio_reservas.gs` · `construirReservaNueva_` | reservas | S3 | ✅ |
| RF-33 | El cliente debe deshabilitar el botón durante la llamada, informar del éxito o error y reiniciar el formulario tras guardar. | HU-16, RNF-09 | RNF-09 | — | `cliente.html` · `enviarReserva` | E2E **S11** (T-05) | S3 | ✅ |

## NOT — Avisos y calendario

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-34 | Al crear una reserva, si el espacio tiene otros canales activos, el sistema debe enviar a `Config.Emails_Notificacion` el aviso de cierre (espacio, franja, canal de origen, canales a cerrar). | HU-17 | RNF-05, RNF-16 | 0006 | `infra_correo.gs` · `enviarAvisoCierreCanales_` | reservas | S3 | ✅ |
| RF-35 | Al crear una reserva, el sistema debe enviar un email de confirmación con referencia, espacio, canal, fechas, huésped, personas, bruto y neto. | HU-18 | RNF-05, RNF-16 | 0006 | `infra_correo.gs` · `enviarConfirmacionReserva_` | reservas | S3 | ✅ |
| RF-36 | Al crear una reserva, el sistema debe crear un evento "NN/AA · Espacio — Huésped" en `Config.Calendar_Id` (o el calendario por defecto) con el color del espacio y guardar `Calendar_Event_Id`. | HU-19 | RNF-16 | 0010 | `infra_calendario.gs` · `crearEventoReserva_`, `colorDelEspacio_`; `api_reservas.gs` · `guardarReservaNueva_` (evento tras guardar) | reservas | S4 → S8 ✔ (B-11) | ✅ |
| RF-37 | Un fallo de Calendar o del email no debe impedir la operación sobre la reserva; debe quedar registrado en `Errores`. | HU-17 a HU-20, RNF-16 | RNF-16, RNF-13 | 0006, 0010 | `infra_calendario.gs`, `infra_correo.gs` (capturan y registran sus errores) | reservas | S3–S4 | ✅ |
| RF-38 | Al cancelar una reserva, el sistema debe eliminar su evento de Calendar. | HU-19, HU-26 | RNF-16 | 0010 | `infra_calendario.gs` · `eliminarEventoReserva_` | gestion | S4 | ✅ |
| RF-39 | Al cancelar una reserva, si el espacio tiene otros canales activos, el sistema debe enviar el aviso de reapertura. | HU-20, HU-26 | RNF-05, RNF-16 | 0006 | `infra_correo.gs` · `notificarReaperturaCanales_` | gestion | S4 | ✅ |
| RF-40 | El sistema debe ofrecer una utilidad, solo desde el editor, que cree los eventos que falten para las reservas no canceladas. | HU-19 · *Justificación:* reconciliación ante fallos de Calendar (RNF-16) | RNF-16 | 0010 | `api_sistema.gs` · `sincronizarReservasCalendario` (protegida) | doc-inf-gastos | v1.1 → S8 ✔ (B-01) | ✅ |
| RF-41 | Al editar huésped, fechas o espacio, el sistema debe actualizar el evento de Calendar. | HU-19, HU-38 | RNF-16 | 0010 | `infra_calendario.gs` · `actualizarTituloEvento_` (nombre); fechas y espacio con HU-38 | gestion | S8 ✔ nombre (B-09) · **S13** fechas | 🟡 Nombre ✔; fechas y espacio al habilitar HU-38 |

## GES — Gestionar reserva

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-42 | El sistema debe listar todas las reservas no canceladas con Estado, ID, Canal, Entrada, Salida, Personas, Check-in, Check-out, Nombre e Ingreso. | HU-21 | RNF-11, RNF-05 | 0008 | `api_gestion.gs` · `listarReservasActivas`, `proyeccionGestion_`; `gestion_interfaz.html` | gestion | S4 | ✅ |
| RF-43 | El sistema debe filtrar la lista por "Próxima Semana" / "Próximo Mes" (rango que se cruza) y por nombre. | HU-21 | RNF-08 | 0008 | `dominio_reservas.gs` · `coincideFiltroGestion_` | dominio, gestion | S4 | ✅ |
| RF-44 | "Ver más" debe mostrar una ficha de solo lectura con resumen económico, documentos y resto de datos. | HU-22 | RNF-26 | 0008 | `api_gestion.gs` · `obtenerReserva`, `proyeccionFicha_`; `gestion_interfaz.html` · `construirFicha` | gestion | S4 | ✅ |
| RF-45 | "Modificar" debe permitir editar huésped, personas, importe, % comisión, cobro, contrato, incidencias, checklists y notas; ID, autor y fecha de registro son inmutables; el estado es calculado. | HU-23 | RNF-22 | 0005 | `dominio_reservas.gs` · `aplicarCambios_`; `api_gestion.gs` · `actualizarReserva` | dominio, gestion | S4 | ✅ |
| RF-46 | El servidor debe revalidar los cambios (nombre, adultos, importe, comisión, teléfono, email **y valores de dominio de los campos de estado**) y rechazar la edición de reservas canceladas. | HU-23, RNF-24 | RNF-24 | 0005 | `dominio_reservas.gs` · `validarCambiosReserva_`, `validarDominios_`; `api_gestion.gs` · `reservaModificable_` | dominio, gestion | S4 → S8 ✔ (B-04) | ✅ |
| RF-47 | Por cada campo cambiado, el sistema debe añadir una fila a `Historial_Cambios` (Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo). | HU-23, HU-27 | RNF-22 | 0005 | `dominio_reservas.gs` · `aplicarCambios_`; `infra_repositorio_reservas.gs` · `registrarHistorial_` | gestion | S4 | ✅ |
| RF-48 | Tras editar, el sistema debe recalcular bruto, comisión, margen y neto. | HU-23 | RNF-14 | 0003 | `dominio_reservas.gs` · `calcularImportes_` | dominio, gestion | S4 | ✅ |
| RF-49 | El sistema debe sustituir los servicios de una reserva existente con snapshot del catálogo, recalcular totales, bruto, margen y neto sin recalcular la comisión, y auditar "Servicios extra" e "Importe neto", de forma atómica. | HU-24 | RNF-14, RNF-15 | 0003 | `dominio_reservas.gs` · `aplicarServicios_`; `infra_repositorio_reservas.gs` · `reemplazarLineasServicio_`; `infra_comun.gs` · `reescribirFilas_` | dominio, gestion | S4 → S8 ✔ (B-03) | ✅ |
| RF-50 | El sistema debe calcular `Estado_Reserva`: "Completada" si el cobro es "Ingresado" y (sin incidentes o incidencia resuelta "Sí"); si no, "Abierta"; nunca modifica una "Cancelada". | HU-25 | RNF-14 | 0004 | `dominio_reservas.gs` · `calcularEstadoReserva_` | dominio, gestion | S4 | ✅ |
| RF-51 | La edición debe indicar qué condición falta para completar la reserva. | HU-25 | RNF-09 | 0004 | `dominio_reservas.gs` · `motivosPendientes_`; `api_gestion.gs` · `proyeccionFicha_`; `gestion_interfaz.html` · `rellenarEdicion` | dominio, gestion + E2E **S11** (T-05) | S8 ✔ | ✅ |
| RF-52 | La cancelación debe pedir confirmación en un modal, pasar el estado a "Cancelada", auditarlo y rechazar una segunda cancelación. | HU-26 | RNF-10, RNF-22 | 0005 | `dominio_reservas.gs` · `cancelar_`; `api_gestion.gs` · `cancelarReserva`; `gestion_interfaz.html` · `confirmarAccion` | gestion | S4 | ✅ |
| RF-53 | El sistema debe devolver el historial de una reserva de más reciente a más antiguo y mostrar "Sin cambios registrados" si está vacío. | HU-27 | RNF-22 | 0005 | `api_gestion.gs` · `obtenerHistorial`; `infra_repositorio_reservas.gs` · `leerHistorial_` | gestion | S4 | ✅ |

## DOC — Documentos y evidencias

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-54 | El sistema debe aceptar contratos PDF/JPG/JPEG/PNG de hasta `Tamano_Max_Contrato_MB`, guardarlos en `Documentos/{Espacio}/{reserva}` con el nombre de la convención, enlazar `Contrato_Archivo`, poner "Firmado" y auditar. | HU-28 | RNF-07, RNF-36 | 0005, 0014 | `api_documentos.gs` · `subirContrato`; `infra_drive.gs` · `validarArchivo_`, `carpetaDocumentosReserva_` | dominio, doc-inf-gastos | S4 | ✅ |
| RF-55 | La subida de contrato no debe ofrecerse si el contrato está "Gestionado por canal". | HU-28 | RNF-08 | 0004 | `api_documentos.gs` · `subirContrato`; `gestion_interfaz.html` · `rellenarEdicion` | doc-inf-gastos + E2E **S11** (T-05) | S8 ✔ | ✅ |
| RF-56 | El sistema debe permitir marcar `Checkin_Revisado` y `Checkout_Revisado` (Pendiente/Hecho) con auditoría, sin influir en el estado. | HU-29 | RNF-22 | 0004, 0005 | `dominio_reservas.gs` · `aplicarCambios_` | dominio, gestion | S4 | ✅ |
| RF-57 | El sistema debe aceptar vídeos MP4/MOV/M4V de hasta `Tamano_Max_Video_MB`, guardarlos en la carpeta de vídeos del espacio y la reserva con el nombre de la convención y guardar la URL en `Video_In_Url`/`Video_Out_Url`, auditando el cambio. | HU-30 | RNF-07, RNF-22, RNF-35 | 0014 | `api_documentos.gs` · `subirVideo`; `infra_drive.gs` · `carpetaVideosReserva_` | doc-inf-gastos | S4 | ✅ |
| RF-58 | El sistema debe buscar o crear las carpetas de espacio y de reserva, respetando la estructura manual existente en Drive. | HU-28, HU-30, RNF-07 | RNF-07 | 0014 | `infra_drive.gs` · `buscarOcrearSubcarpeta_`, `buscarSubcarpetaPorTexto_`, `palabraEspacio_` | doc-inf-gastos | S4 → S8 ✔ (B-10) | ✅ |

## EST — Estadísticas e informes

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-59 | Cada noche, el sistema debe recalcular, para "Todos" y cada espacio activo, el nº de reservas no canceladas con inicio en el año natural y la suma de su neto, y sobrescribir `Estadisticas_Cache` con la marca de tiempo. | HU-31 | RNF-04, RNF-05 | 0009 | `api_estadisticas.gs` · `recalcularEstadisticas_`; `dominio_informes.gs` · `agregadosEstadisticas_` | dominio, doc-inf-gastos | S5 | ✅ |
| RF-60 | La pantalla de Estadísticas debe leer solo del cache y mostrar "Las estadísticas se actualizan cada 24 horas" y la fecha de actualización. | HU-31 | RNF-04 | 0009 | `api_estadisticas.gs` · `cargarEstadisticas`, `recalcularEstadisticas` (botón); `gestion_interfaz.html` | doc-inf-gastos | S5 | ✅ |
| RF-61 | El día 1 de cada mes, el sistema debe generar el informe del mes anterior (y el del trimestre anterior al empezar trimestre) por espacio y canal (nº reservas, brutos, comisiones, netos y totales), enviarlo en HTML y archivarlo en `Historico_Informes`. | HU-32 | RNF-05 | 0009 | `api_sistema.gs` · `informesProgramados`, `generarInforme_`; `dominio_informes.gs`; `infra_correo.gs` · `htmlInforme_` (escapado, B-05) | dominio, doc-inf-gastos | S5 | ✅ |
| RF-62 | Los informes deben incluir el % de ocupación y las reservas completadas frente a las canceladas. | HU-32 | **Sin RNF directo** — contenido de informe, requisito solo funcional | — | — | Con su sprint | **S12** (B-08) | ⏳ (B-08) |

## GAS — Gastos e IRPF

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-63 | El sistema debe ofrecer las categorías activas de `Catálogo_Categorias_Gasto` con su deducible por defecto. | HU-33 | RNF-27 | 0012 | `infra_catalogo.gs` · `obtenerCategoriasGastoActivas_`; `api_gastos.gs` · `cargarCategoriasGasto` | doc-inf-gastos | S6 | ✅ |
| RF-64 | El sistema debe validar y registrar un gasto (fecha, concepto, categoría, espacio ∈ {Piscina/Jardín, Habitación, Común}, importe > 0) con ID `G{AAAA}-NNN` y ejercicio calculado. | HU-33 | RNF-24, RNF-36 | 0012 | `dominio_fiscal.gs` · `validarGasto_`, `generarIdGasto_`; `api_gastos.gs` · `registrarGasto` | dominio, doc-inf-gastos | S6 | ✅ |
| RF-65 | El sistema debe guardar el justificante opcional en `Documentos/Gastos/{Ejercicio}` y enlazarlo. | HU-33 | RNF-36 | 0012, 0014 | `api_gastos.gs` · `registrarGasto`; `infra_drive.gs` · `carpetaJustificantesGasto_` | doc-inf-gastos | S6 | ✅ |
| RF-66 | El sistema debe calcular por ejercicio y espacio ingresos íntegros, comisiones, gastos deducibles (propios + 50 % comunes), amortización (3 % × valor × proporción, repartida), rendimiento, tercio por comunero y desglose por categoría, y persistirlo en `Resumen_Fiscal`. | HU-34 | RNF-36 | 0012 | `dominio_fiscal.gs` · `calcularResumenEjercicio_`, `resumenDeEspacio_`, `calcularAmortizacion_`; `infra_repositorio_gastos.gs` · `guardarResumenFiscal_` | dominio, doc-inf-gastos | S6 | ✅ |

## MNT — Mantenimiento y soporte técnico (sin HU directa)

Estos RF no nacen de una historia de usuario: sostienen requisitos no funcionales (fiabilidad, mantenibilidad, legal). Cada uno lleva su justificación.

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-67 | Un único trigger nocturno (03:00) debe ejecutar tareas independientes; el fallo de una se registra y no detiene las demás. | **Sin HU directa** · RNF-13, RNF-05 (un solo trigger ahorra cuota) | RNF-13, RNF-05 | 0013 | `api_sistema.gs` · `tareasNocturnas`, `ejecutarTarea_` | doc-inf-gastos, seguridad | S5 | ✅ |
| RF-68 | El sistema debe copiar el Sheet cada `Backup_Cada_Dias` a `Carpeta_Backups_Id` y conservar las últimas `Backup_Max_Copias`. | **Sin HU directa** · RNF-17 (recuperación ante desastre) | RNF-17 | 0013 | `infra_mantenimiento.gs` · `copiaSeguridadSheet_`, `tocaCopia_` | dominio, doc-inf-gastos | S5 | ✅ |
| RF-69 | El sistema debe purgar las filas de `Logs` y `Errores` más antiguas que `Retencion_Logs_Dias` / `Retencion_Errores_Dias`. | **Sin HU directa** · RNF-05 (lecturas en bloque rápidas), RNF-35 (retención) | RNF-05, RNF-35 | 0013 | `infra_mantenimiento.gs` · `purgarPorAntiguedad_` | doc-inf-gastos | S5 | ✅ |
| RF-70 | El sistema debe mandar a la papelera los vídeos más antiguos que `Retencion_Videos_Dias` y eliminar las carpetas de reserva que queden vacías. | HU-30, RNF-35 | RNF-35 | 0014 | `infra_mantenimiento.gs` · `purgarVideosAntiguos_`, `podarCarpeta_` | doc-inf-gastos | S5 → S8 ✔ (B-07) | ✅ |
| RF-71 | El sistema debe ofrecer una función, solo desde el editor, que instale los triggers (03:00 diario y día 1 a las 07:00). | **Sin HU directa** · RNF-27 (operación reproducible) | RNF-27 | 0009, 0013 | `api_sistema.gs` · `instalarTriggers` (protegida) | seguridad | S5 → S8 ✔ (B-01) | ✅ |
| RF-72 | El sistema debe crear o reparar, de forma idempotente, todas las hojas con sus cabeceras y semillas, también desde un menú del Sheet. | **Sin HU directa** · RNF-27 (puesta en marcha y reparación sin tocar código) | RNF-27 | — | `api_sistema.gs` · `inicializarBaseDeDatos`, `onOpen`; `infra_esquema.gs` · `ESQUEMA_HOJAS` | Todos (preparan el entorno) | S1 | ✅ |
| RF-73 | Todo error capturado debe registrarse en `Errores` (fecha, función, mensaje, contexto) sin que el propio registro pueda fallar en cascada. | **Sin HU directa** · RNF-13 | RNF-13 | — | `infra_comun.gs` · `registrarError_` | reservas | S1 | ✅ |
| RF-74 | Los parámetros de negocio y técnicos deben leerse de `Config` (clave-valor), una vez por ejecución. | **Sin HU directa** · RNF-23, RNF-27 | RNF-23, RNF-27 | — | `infra_config.gs` · `leerConfig_`, `obtenerConfig_` | Todos | S1 | ✅ |

## VIA — Registro de viajeros (Fase 2)

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-75 | El sistema debe ofrecer un formulario público (segundo despliegue, sin login) para registrar viajeros. | HU-35 | RNF-38, RNF-34 | 0007 | — | Con su sprint | **Fase 2** | ⏳ |
| RF-76 | El sistema debe asociar cada envío a una reserva activa de Habitación cuyas fechas de entrada **y** salida coincidan exactamente; el nombre solo confirma. | HU-35 | RNF-38 | 0007 | — | Con su sprint | **Fase 2** | ⏳ |
| RF-77 | El formulario debe permitir varios viajeros por envío con los campos exigidos por SES.Hospedajes. | HU-35 | RNF-38 | 0007 | — | Con su sprint | **Fase 2** | ⏳ |
| RF-78 | El sistema debe recalcular `Registro_Viajeros_Estado` al recibir cada envío: "Completado" si hay tantos viajeros como Adultos + Menores. | HU-36 | RNF-38 | 0007 | — | Con su sprint | **Fase 2** | ⏳ |

## BKL — Backlog (Could)

| ID | Requisito | ↑ Origen (HU) | ↓ RNF | ADR | Implementación | Test (plan) | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RF-79 | Una tarea programada debe enviar recordatorios de reservas con cobro, contrato o revisión pendientes tras N días (`Config`). | HU-37 | RNF-05 | *(pendiente de diseño)* | — | Con su sprint | **S13** | ⏳ |
| RF-80 | El sistema debe permitir cambiar espacio, canal y fechas de una reserva existente, revalidando el solapamiento (excluyendo la propia reserva) y actualizando el evento. | HU-38 | RNF-15 | 0005 | — | Con su sprint | **S13** | ⏳ |
