# DD-02 — Comunicación de viajeros a SES.Hospedajes

**Estado:** borrador · **Fecha:** 2026-10-02 · **Sprint:** por asignar (Fase 2)
**Trazabilidad:** ↑ HU-35, HU-36, P-10, JTBD-10, F-27, F-28 · ↓ RF-75 a RF-78 (se reescriben al aprobar), ADR-0018 · Registro: [mejoras_2026-10-02.md](../../../docs_work/docs_mejoras/mejoras_2026-10-02.md)

## 1. Problema y objetivo
La ley obliga a comunicar a SES.Hospedajes cada reserva de la Habitación y el parte de viajeros a su llegada (RD 933/2021, Art. 6.3). Hoy se hace a mano en la web del Ministerio y se anota a mano en el Sheet del Form de viajeros.
**Objetivo:** que, al terminar de validar en persona las identidades en el check-in, el parte se comunique solo y el resultado quede anotado en los dos Sheets y avisado por email.
**Criterio de éxito:** en una llegada real, quien hace el check-in valida y comunica en menos de 3 minutos desde el móvil, sin entrar en la web del Ministerio.

## 2. Alcance
- **Incluye:** mensaje de WhatsApp con el enlace al Form (F-27) · lectura del Form y casado por código de reserva · pantalla de validación presencial (F-28) · envío del parte (`PV`) y, si hay Form antes del día de entrada, de la reserva (`RH`) · consulta del resultado (lote) · reintentos con aviso · escritura del resultado en los dos Sheets · emails de éxito, reintento y fallo · catálogos de SES, INE e ISO.
- **No incluye:** anulaciones automáticas en SES (D-31) · fotos del documento (D-33) · Piscina/Jardín (no es hospedaje) · aviso automático a huéspedes que no rellenan el Form (se valora tras el uso real).

## 3. Diseño

### 3.1 Flujo
1. **Crear o gestionar una reserva de Habitación** → botón **"Mensaje para el huésped"**: copia al portapapeles un texto con el enlace al Form, con el código de reserva ya relleno (enlace prerrellenado de Google Forms). El código es el del canal (`Ref_Canal`) o, si no hay, la referencia de KAF Rent (`15/26`).
2. **El huésped rellena el Form.** Un trigger `onFormSubmit` sobre el Sheet del Form (instalado por su propietaria) casa la respuesta con la reserva. Si es la **primera** respuesta de esa reserva y llega **antes del día de entrada**, se comunica la reserva (`RH`) con esa persona como titular.
3. **Check-in:** en Gestionar, en una reserva de Habitación, dos opciones: **Validar identidades** · **Modificar reserva**.
4. **Validar identidades:** lista de huéspedes casados con la reserva: nombre, tipo de documento, número y nº de soporte (solo DNI y NIE; el pasaporte no tiene). Quien hace el check-in comprueba cada documento en persona y pulsa **Validar** en cada uno. Contador "2 de 3 validados"; si faltan Forms frente a Adultos + Menores, lo dice ("Falta el formulario de 1 huésped").
5. **Con todos validados** → botón **"Comunicar a SES"** (confirmación) → envío del parte (`PV`) con todos los viajeros.
6. **Resultado:** SES acepta la petición y devuelve un **lote**; el código de comunicación llega después. La tarea `procesarComunicacionesSES` (trigger cada 10 min) consulta el lote, anota el código y manda el email.
7. **Reintentos** (§3.5).

### 3.2 Datos (solo se añade; nada se renombra ni se borra)
| Dónde | Qué | Para qué |
|---|---|---|
| `Config` | `Sheet_Viajeros_Id` = `1iHqC4F-OStxmcLLpaTFqYn_bBNUHSH1SgWPYNN2EayY` · `SES_Url` (pruebas o producción) · `SES_Codigo_Arrendador` · `SES_Codigo_Establecimiento` · `SES_Aplicacion` (`KAF Rent`) · `SES_Tipo_Pago` (código de "otras formas de pago") · `SES_Reintento_Minutos` (30) · `SES_Max_Intentos` (3) | Configuración sin secretos |
| Propiedades del script | `SES_USUARIO` · `SES_CONTRASENA` | Credenciales (CLAUDE.md §4.8, excepción) |
| `Validacion_Viajeros` (nueva) | ID_Reserva · Fila_Form · Marca_Temporal_Form · Validado_Por · Fecha_Hora | Quién validó a quién. Sin datos personales: apunta a la fila del Form |
| `Comunicaciones_SES` (nueva) | ID_Reserva · Tipo (RH/PV) · Estado (Pendiente / Enviada / Comunicada / Rechazada / Manual) · Intento · Lote · Codigo_Comunicacion · Error · Usuario · Fecha_Envio · Proximo_Intento | Trazabilidad y reintentos |
| `Catálogo_SES` (nueva) | Catalogo · Codigo · Descripcion | Códigos de SES (`SEXO`, `TIPO_DOCUMENTO`, `TIPO_PARENTESCO`, `TIPO_PAGO`), refrescados con la operación `catalogo` |
| `Equivalencias_SES` (nueva) | Campo · Texto_Form · Codigo | Del texto del Form al código (sexo, tipo de documento, parentesco, país ISO alfa-3) |
| `Municipios_INE` (nueva) | Provincia · Municipio · Codigo_INE | Código de municipio obligatorio para domicilios en España (tabla pública del INE, se carga una vez) |
| `Reservas` | `Registro_Viajeros_Estado` (ya existe, RF-32): sigue la regla de ADR-0007 (RF-78), "Completado" cuando hay tantos Forms casados como Adultos + Menores | Ver de un vistazo qué reservas tienen todos los Forms |
| Sheet del Form | Columnas ya existentes: `Comunicados` · `Usuario` · `Tipo_Comunicación` · `Fecha` · `Código de comunicación` | Se rellenan en cada fila de huésped comunicada |

**Lectura del Form:** por cabecera; las preguntas repetidas (código de reserva, nº de documento, nº de soporte, nº de pasaporte) se leen por orden de aparición: la 1.ª es del adulto y la 2.ª del menor, según "¿El huésped tiene la mayoría de edad?". Un test fija las cabeceras esperadas.

### 3.3 Servidor
- **Dominio** (`dominio_ses.gs`, puro): `casarRespuestasConReserva_` · `viajeroDesdeRespuesta_` (adulto o menor) · `validarViajeroPV_` (obligatorios de la especificación v3.1.3) · `construirXmlPV_` / `construirXmlRH_` · `traducirCodigos_` · `clasificarErrorSES_` (reintentable o no) · `proximoIntento_` · `debeComunicarRH_` (primera respuesta y antes del día de entrada).
- **Infraestructura:** `infra_ses.gs` (SOAP: `enviarComunicacionSES_`, `consultarLoteSES_`, `consultarCatalogoSES_`; ZIP + Base64 con `Utilities`; credenciales de `PropertiesService`) · `infra_formulario_viajeros.gs` (leer respuestas y escribir el resultado en el Sheet del Form) · repositorio de las hojas nuevas.
- **API** (`api_ses.gs`): `mensajeHuesped(id)` · `cargarViajeros(id)` · `validarViajero(id, fila)` · `comunicarParte(id)`. Tareas del sistema: `alEnviarFormularioViajeros` (trigger `onFormSubmit`), `procesarComunicacionesSES` (trigger cada 10 min), `actualizarCatalogosSES` (desde el editor).

### 3.4 Reglas de negocio
- `PV` solo si todos los huéspedes casados están validados (y, si faltan Forms, avisando antes de enviar).
- `RH` solo con la primera respuesta y antes del día de entrada (D-31). Titular = quien rellenó ese Form.
- Pago: `tipoPago` = `Config.SES_Tipo_Pago` ("otras formas de pago"); fecha de contrato = fecha de creación de la reserva.
- Menores: al menos un adulto con su parentesco (lo da el Form del menor).

### 3.5 Reintentos y emails
| Situación | Qué hace | Asunto del email (a los usuarios con permiso de gestión) |
|---|---|---|
| Fallo de conexión o de SES (red, HTTP 5xx, código 10999), intento 1 o 2 | Programa el siguiente en `SES_Reintento_Minutos` | `[KAF Rent] SES · Intento 1 de 3 fallido — reintento a las 18:40 · Reserva 15/26` |
| Fallo del intento 3 | Estado *Manual* | `[KAF Rent] SES · ENVÍO FALLIDO — comunicar a mano · Reserva 15/26` |
| SES rechaza un dato (p. ej. 10121, 10130, 10131) | No reintenta: repetir daría el mismo error | `[KAF Rent] SES · Datos rechazados — corregir y comunicar a mano · Reserva 15/26` |
| Comunicada (en cualquier intento) | Escribe el código en los dos Sheets | `[KAF Rent] SES · Comunicado ✔ · Reserva 15/26 · Código XXXXX` |

**Email de éxito:** ID de reserva, nombre principal, fecha de inicio, fecha de fin, nº de huéspedes, nº de comunicación. **Emails de fallo:** qué pasó, qué hacer y bloque técnico completo (código y texto de SES, lote, intento, hora, usuario). Usan la plantilla común de F-18.

## 4. Alternativas descartadas
| Alternativa | Por qué se descarta |
|---|---|
| Copiar las respuestas del Form a KAF Rent | Duplica datos sensibles y obliga a sincronizar (ADR-0018) |
| Formulario propio (ADR-0007) | Obliga a cambiar el Form que ya usan los huéspedes |
| Casar por nombre y fechas (ADR-0007) | El código de reserva va prerrellenado en el enlace: más fiable |
| Comunicar la reserva al crearla en KAF Rent | Más gestión (D-31) |
| Reintentar también los rechazos de datos | Repetir un dato erróneo da el mismo error y retrasa el aviso |
| Intermediario fuera de Apps Script | Innecesario: `UrlFetchApp` conecta validando el certificado (SES-0) |

## 5. Riesgos y preguntas abiertas
- **Riesgo:** si se reordenan las preguntas del Form, la lectura se rompe (mitigación: test de cabeceras y error claro en pantalla).
- **Riesgo aceptado:** sin Form antes del día de entrada no se comunica la reserva (`RH`) (D-31).
- **Pregunta:** ¿qué valores tiene hoy el desplegable `Tipo_Comunicación` del Form? Se usarán los mismos.
- **Pregunta:** ¿las preguntas de nacionalidad, país, sexo y tipo de documento del Form son desplegables o texto libre? Si son texto libre, conviene pasarlas a desplegable (el usuario lo permite) para que la traducción a códigos no falle.
- **Pregunta:** reservas de Habitación que no vienen de Airbnb: el enlace prerrellena la referencia de KAF Rent en la pregunta "Código de reserva de Airbnb". ¿Se cambia el título de esa pregunta a "Código de reserva"?
- **No verificado:** si `RH` admite solo el titular sin el resto de viajeros (se comprueba en pre-ses).
- **No verificado:** formato del código de municipio (5 o 6 dígitos; la especificación se contradice). Se comprueba en pre-ses.
- **Externo:** credenciales del servicio web (pruebas y producción) y revisión RGPD (EXT-02).

## 6. Plan
| Paso | Qué | Talla | Tests |
|---|---|---|---|
| SES-2 | Dominio: casado, viajero, validación, XML `RH`/`PV`, traducción de códigos, clasificación de errores, reintentos | L (6–8 h) | Unitarios por regla y por campo obligatorio |
| SES-3 | Adaptador SOAP + Sheet del Form + hojas nuevas + `procesarComunicacionesSES` | L (6–8 h) | Endpoints con dobles de `UrlFetchApp` y del Form |
| SES-4 | Pantallas: mensaje de WhatsApp, validar identidades, comunicar; emails (plantilla F-18) | L (8–10 h) | Endpoints; E2E en el release |
| SES-5 | Catálogos reales (`actualizarCatalogosSES`, INE), prueba en pre-ses, credenciales, paso a producción | M (3–4 h) | Prueba real en pre-ses |
