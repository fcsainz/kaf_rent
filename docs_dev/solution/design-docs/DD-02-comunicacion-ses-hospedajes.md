# DD-02 — Comunicación de viajeros a SES.Hospedajes

**Estado:** aprobado (D-34, 2026-10-02) · **Fecha:** 2026-10-02 · **Sprint:** S26–S29 (Fase 2)
**Trazabilidad:** ↑ HU-35, HU-36, P-10, JTBD-10, F-27, F-28 · ↓ RF-76, RF-77, RF-78, RF-89, RF-90, RF-91 (RF-75 retirado), ADR-0018 · Registro: [mejoras_2026-10-02.md](../../../docs_work/docs_mejoras/mejoras_2026-10-02.md)

## 1. Problema y objetivo
La ley obliga a comunicar a SES.Hospedajes cada reserva de la Habitación y el parte de viajeros a su llegada (RD 933/2021, Art. 6.3). Hoy se hace a mano en la web del Ministerio y se anota a mano en el Sheet del Form de viajeros.
**Objetivo:** que, al terminar de validar en persona las identidades en el check-in, el parte se comunique solo y el resultado quede anotado en los dos Sheets y avisado por email.
**Criterio de éxito:** en una llegada real, quien hace el check-in valida y comunica en menos de 3 minutos desde el móvil, sin entrar en la web del Ministerio.

## 2. Alcance
- **Incluye:** mensaje de WhatsApp con el enlace al Form (F-27) · lectura del Form y casado por código de reserva · pantalla de validación presencial (F-28) · envío del parte (`PV`) y, si hay Form antes del día de entrada, de la reserva (`RH`) · consulta del resultado (lote) · reintentos con aviso · escritura del resultado en los dos Sheets · emails de éxito, reintento y fallo · catálogos de SES, INE e ISO.
- **No incluye:** ~~anulaciones automáticas en SES (D-31)~~ → incluidas al cancelar (ADR-0022) · fotos del documento (D-33) · Piscina/Jardín (no es hospedaje) · aviso automático a huéspedes que no rellenan el Form (se valora tras el uso real).

## 3. Diseño

### 3.1 Flujo
1. **Gestionar una reserva de Habitación** → botón **"Mensaje para el huésped"** (hecho en S28, RF-93): si la reserva tiene teléfono abre WhatsApp con el texto escrito; si no, lo copia. Texto aprobado por el usuario, sin saludo, con la fecha de llegada, el nº de personas, el enlace prerrellenado (`Config.Form_Viajeros_Enlace`, con `{codigo}`) y el código a la vista. El código es el del canal (`Ref_Canal`) o, si no hay, la referencia de KAF Rent (`15/26`).
2. **El huésped rellena el Form.** Un trigger `onFormSubmit` sobre el Sheet del Form (instalado por su propietaria) casa la respuesta con la reserva. Si es la **primera** respuesta de esa reserva y llega **antes del día de entrada**, se comunica la reserva (`RH`) con esa persona como titular.
3. **Check-in:** en Gestionar, en una reserva de Habitación, dos opciones: **Validar identidades** · **Modificar reserva**.
4. **Validar identidades** (hecho en S28, RF-94; maqueta aprobada: tarjetas por huésped, municipio elegible si no está en el INE, "Actualizar formularios", "Comprobar ahora"; solo Gestión y Admin): lista de huéspedes casados con la reserva: nombre, tipo de documento, número y nº de soporte (solo DNI y NIE; el pasaporte no tiene). Quien hace el check-in comprueba cada documento en persona y pulsa **Validar** en cada uno. Contador "2 de 3 validados"; si faltan Forms frente a Adultos + Menores, lo dice ("Falta el formulario de 1 huésped").
5. **Con todos validados** → botón **"Comunicar a SES"** (confirmación) → envío del parte (`PV`) con todos los viajeros.
6. **Resultado:** SES acepta la petición y devuelve un **lote**; el código de comunicación llega después. La tarea `procesarComunicacionesSES` (trigger cada 10 min) consulta el lote, anota el código y manda el email.
7. **Reintentos** (§3.5).

### 3.2 Datos (solo se añade; nada se renombra ni se borra)
| Dónde | Qué | Para qué |
|---|---|---|
| `Config` | `Sheet_Viajeros_Id` = `1iHqC4F-OStxmcLLpaTFqYn_bBNUHSH1SgWPYNN2EayY` · `Sheet_Viajeros_Hoja` (`Respuestas de formulario 1`) · `SES_Url` (pruebas o producción) · `SES_Codigo_Arrendador` · `SES_Codigo_Establecimiento` · `SES_Aplicacion` (`KAF Rent`) · `SES_Tipo_Pago` (código de "otras formas de pago") · `SES_Reintento_Minutos` (30) · `SES_Max_Intentos` (3) · `SES_Web_Url` (web de SES para los botones de los emails) | Configuración sin secretos |
| Propiedades del script | `SES_USUARIO` · `SES_CONTRASENA` | Credenciales (CLAUDE.md §4.8, excepción) |
| `Validacion_Viajeros` (nueva) | ID_Reserva · Fila_Form · Marca_Temporal_Form · Validado_Por · Fecha_Hora | Quién validó a quién. Sin datos personales: apunta a la fila del Form |
| `Comunicaciones_SES` (nueva) | ID_Comunicacion · ID_Reserva · Tipo (RH/PV) · Estado (Pendiente / Enviada / Comunicada / Rechazada / Manual) · Intento · Filas_Form · Lote · Codigo_Comunicacion · Error · Usuario · Fecha_Envio · Proximo_Intento | Trazabilidad y reintentos. `Filas_Form` apunta a las filas del Sheet del Form (sin datos personales) para rehacer la solicitud en cada intento y anotar el resultado |
| `Catálogo_SES` (nueva) | Catalogo · Codigo · Descripcion | Códigos de SES (`SEXO`, `TIPO_DOCUMENTO`, `TIPO_PARENTESCO`, `TIPO_PAGO`), refrescados con la operación `catalogo`; además `PAIS` (ISO 3166-1 alfa-3, o la lista de SES si su catálogo la trae) y `PROVINCIA` (INE). De aquí salen las opciones del Form (ADR-0021) |
| ~~`Equivalencias_SES`~~ | — | **Retirada (D-37):** el Form ofrece las descripciones de `Catálogo_SES`, que se traducen a su código en la misma hoja |
| `Municipios_INE` (nueva) | Provincia · Municipio · Codigo_INE | Código de municipio obligatorio para domicilios en España (tabla pública del INE, se carga una vez) |
| `Reservas` | `Registro_Viajeros_Estado` (ya existe, RF-32): sigue la regla de ADR-0007 (RF-78), "Completado" cuando hay tantos Forms casados como Adultos + Menores | Ver de un vistazo qué reservas tienen todos los Forms |
| Sheet del Form | Columnas ya existentes, **del parte (PV)**: `Comunicados` · `Usuario` · `Tipo_Comunicación` · `Fecha` · `Código de comunicación`, más `Lote` (nueva). Nuevas, **de la reserva (RH)**: `Reserva comunicada` · `Lote reserva` · `Código comunicación reserva` · `Fecha comunicación reserva` · `Usuario comunicación reserva`; **de la anulación** (ADR-0022): `Anulación SES` · `Lote anulación` · `Fecha anulación` · `Usuario anulación` (usuario, 2026-10-02; **creadas en el Sheet real, columnas AU–BD**) | Se rellenan en cada fila de huésped comunicada |

**Lectura del Form:** por el título de cada pregunta, que tras D-37 es único (§3.6); los datos son del adulto o del menor según "¿El huésped tiene la mayoría de edad?". Un test fija los títulos y otro comprueba que el script del Form usa los mismos. Form: `1fIOSKkUI3Lev8Oy7zMQAfoSn5QI9LM30FeDxVucWljY` (propietaria `operaciontangai`).

### 3.3 Servidor
- **Dominio** (`dominio_ses.gs`, puro; **hecho en S26**): `casarRespuestasConReserva_` · `viajeroDesdeRespuesta_` (adulto o menor) · `validarViajeroPV_` (obligatorios de la especificación v3.1.3) · `construirXmlPV_` / `construirXmlRH_` · `traducirCodigos_` · `clasificarErrorSES_` (reintentable o no) · `proximoIntento_` · `debeComunicarRH_` (primera respuesta y antes del día de entrada).
- **Infraestructura (hecha en S27):** `infra_ses.gs` (SOAP: `enviarComunicacionSES_`, `consultarLoteSES_`, `consultarCatalogoSES_`; ZIP + Base64 con `Utilities`; credenciales de `PropertiesService`) · `infra_formulario_viajeros.gs` (leer respuestas y escribir el resultado en el Sheet del Form) · `infra_repositorio_ses.gs` (Catálogo_SES, Municipios_INE, Comunicaciones_SES). Resultado en el Form: casilla `Comunicados` = TRUE, `Usuario`, `Tipo_Comunicación` = "Automática" (las manuales dicen "Manual"), `Fecha`, `Código de comunicación`. Se ignoran las filas sin marca temporal (la casilla está copiada en filas vacías).
- **API** (`api_ses.gs`): endpoints de S28: `mensajeHuesped(id)` · `cargarViajeros(id)` · `validarViajero(id, fila)` · `comunicarParte(id)`. Tareas del sistema (**hechas en S27**): `alEnviarFormularioViajeros` (trigger `onFormSubmit`), `procesarComunicacionesSES` (trigger cada 10 min), `actualizarCatalogosSES` (desde el editor). Los avisos por email de §3.5 llegan con la plantilla de F-18 (S28); hasta entonces el estado y el error quedan en `Comunicaciones_SES` y en `Errores`.

### 3.4 Reglas de negocio
- `PV` solo si todos los huéspedes casados están validados (y, si faltan Forms, avisando antes de enviar).
- `RH` solo con la primera respuesta y antes del día de entrada (D-31). Titular = quien rellenó ese Form.
- Pago: `tipoPago` = `Config.SES_Tipo_Pago` ("otras formas de pago"); fecha de contrato = fecha de creación de la reserva.
- Menores: al menos un adulto con su parentesco (lo da el Form del menor).
- **Contacto del menor (D-38, usuario, 2026-10-02):** el Form no se lo pide y SES exige teléfono o email por persona; el menor lleva el de su adulto responsable (el adulto de la reserva cuyo nombre coincide con "Nombre y Apellidos responsable del menor" o, si no, el primero con contacto). `completarContactoMenores_` se aplica antes de validar y construir el `PV`.
- **Segundo apellido (D-37, opción E):** obligatorio en el Form para todos con la indicación "Si no tiene segundo apellido, escriba un guion (-)" (lo pone el script del Form); KAF Rent entiende el guion como vacío. Con DNI, SES lo sigue exigiendo: un guion con DNI se señala en la pantalla de validación.

### 3.5 Reintentos y emails (revisado con el usuario, 2026-10-02)
Destinatarios: `Config.Emails_Notificacion` (los copropietarios). Los emails llevan qué pasó, qué hacer y los datos técnicos; su diseño con la plantilla común llega en S28 (D-35 → B).

**Asunto** (usuario, 2026-10-02): `[KAF Rent] {✓ hecho · ! atención · ✕ fallo} SES {Formulario | Reserva | Huéspedes | Anulación}: {Nº intento} · {resultado} · Reserva NN/AA`. Se avisa en **cada intento fallido** ("1º intento fallido · reintento a las 18:40") y en el resultado final.

| Situación | Qué hace | Estado final | Email |
|---|---|---|---|
| Respuesta del Form sin reserva de Habitación con ese código (o la reserva está cancelada) | No comunica nada; lo apunta en `Logs` | — | "Form de viajeros sin reserva": código, fila del Form y nombre, con qué hacer |
| Falta un dato obligatorio (no debería pasar: el Form lo valida) | No llama a SES | Rechazada | "… no comunicado: datos que corregir", con el dato exacto que falta |
| Fallo de conexión o de SES (red, HTTP 5xx, 10999), intentos 1 y 2 | Reintenta a los `SES_Reintento_Minutos` | Pendiente | "Nº intento fallido · reintento a las HH:MM" (informativo) |
| Fallo del intento 3 — **parte (PV)** | — | **Manual** | "ENVÍO FALLIDO — comunicar a mano" |
| Fallo del intento 3 — **reserva (RH)** | — | **No comunicada** | Informativo: no hace falta comunicarla a mano; el trámite que importa es el parte |
| SES rechaza la petición o un dato | No reintenta | Rechazada | "… no comunicado: datos que corregir", con el texto de SES |
| Comunicada | Anota el resultado en el Sheet del Form: el parte en sus columnas de siempre; la reserva en las suyas (§3.6) | Comunicada | En S28: email de éxito (ID de reserva, nombre principal, fechas, nº de huéspedes, código) |

Otros errores técnicos quedan en `Errores` y deben aparecer en el **Informe Técnico mensual** (F-16, S19).

**Cancelar una reserva ya comunicada** ([ADR-0022](../adr/0022-anulacion-en-ses-al-cancelar.md)): la confirmación lo avisa; lo pendiente se descarta y lo enviado o comunicado se anula en SES (operación B) con los mismos reintentos y avisos; se anota en el Form (`Anulación SES`, `Lote anulación`, `Fecha anulación`, `Usuario anulación`).

**Catálogos de SES:** `actualizarCatalogosSES` se ejecuta solo el día 1 de cada mes (tareas nocturnas) si hay credenciales, y a mano desde el editor cuando haga falta.

### 3.6 Cambios del Form de viajeros (D-37, usuario, 2026-10-02)
El Form se adapta a lo que pide SES para no depender de traducciones frágiles. Los cambios de **estructura** los hace a mano, una vez, quien administra el Form. Las **listas y validaciones** las pone el script propio del Form ([ADR-0021](../adr/0021-script-propio-del-form-de-viajeros.md), `docs_dev/src_form_checkin/`), que las lee del Sheet de KAF Rent y no lleva credenciales de SES.

| Dato | Cambio | Quién |
|---|---|---|
| Código de reserva | Una sola pregunta "Código de reserva" (la del adulto, movida y renombrada), antes de la de mayoría de edad (el enlace prerrellenado solo rellena una) | A mano |
| Nombre | Sin cambio | — |
| Apellidos | Dos campos: `Primer Apellido` / `Segundo Apellido` y `Primer Apellido del menor de edad` / `Segundo Apellido del menor de edad` (hecho, 2026-10-02). El segundo, obligatorio con "-" si no tiene (opción E, §3.4) | A mano (campos) + script (obligatoria y descripción) |
| Tipo de documento | Desplegable con los valores de `TIPO_DOCUMENTO` **tal cual los da SES** (CIF, CIF extranjero, NIE, NIF, Otro documento extranjero, Pasaporte; D-42 → C, 2026-10-02); el del menor conserva "No tiene". Cada opción nueva salta a la sección de su equivalente antigua: NIF → la del DNI; Otro documento extranjero, CIF y CIF extranjero → la del pasaporte (número libre). Si una opción no encuentra sección, el script no cambia la pregunta | A mano (tipo) + script (opciones y saltos) |
| Nº de documento y de soporte | Sin cambio de títulos: el menor no los responde (su sección salta a la 10) y el título repetido es del adulto en las secciones de DNI y de NIE; cada fila es una persona y se lee la columna con respuesta. Validación en todas: DNI `12345678Z`, NIE `X1234567L`, soporte de 9 caracteres, con mensaje que explica el formato | Script (validación) |
| Fecha de nacimiento | Pregunta de tipo fecha | A mano |
| Sexo | Opción única con los valores de `SEXO` | A mano (tipo) + script (opciones) |
| Nacionalidad y país | Desplegable de países, España primero (lista ISO 3166-1 alfa-3; si el catálogo de SES trae una propia, esa) | Script |
| Provincia | Desplegable de las 52 provincias + "Fuera de España" (INE) | Script |
| Municipio | Sin cambio (texto). Si no coincide con el INE, se elige de una lista en la pantalla de validación (S28) | — |
| Email y teléfono | Validación de email; teléfono con prefijo internacional obligatorio (`+34 600 111 222`, usuario, 2026-10-02) | Script |
| Parentesco (menor) | Desplegable con los valores de `TIPO_PARENTESCO` (cuando haya credenciales, ACC-04) | Script |

Lo que una expresión regular no puede comprobar (letra del DNI/NIE, que el código de reserva exista) lo revisa KAF Rent tras el envío y se ve en la pantalla de validación. Forms no puede ejecutar código mientras el huésped rellena.

**Procedimiento para cambiar el Form en producción (cuenta `operaciontangai`), sin copia.** Google Forms aplica cada cambio al momento y no tiene historial de versiones. Las respuestas ya guardadas no se pierden: al renombrar una pregunta cambia la cabecera de su columna en el Sheet, y al borrarla su columna se queda con los datos. La versión publicada de KAF Rent **no lee el Form**, así que nada de esto la afecta; solo cambian nombres de columnas que se miran a mano al comunicar a SES. Los títulos son el contrato con KAF Rent y con el script del Form; se comparan sin distinguir mayúsculas ni acentos.

*Antes de empezar (5 min):* elegir un momento sin huéspedes que vayan a rellenar el Form en las próximas horas · en el Sheet de respuestas, Archivo → Descargar → `.xlsx` (copia de seguridad de las respuestas) · hacer capturas de cada sección del Form tal como está (es la única "versión anterior" posible).

*Fase 1 — estructura y validaciones (ya, ~45 min).* No cambia nada de lo que el huésped elige de una lista.
Estado: **fase 1 hecha** el 2026-10-02. Pasos 1 a 5 comprobados en las cabeceras del Sheet; script `script_form_checkin_habitacion` subido y ejecutado; validaciones de DNI/NIE, soporte, teléfono y email comprobadas en la vista previa. Además (usuario): `País` y `País del menor` obligatorias (SES exige el país); el segundo apellido sigue opcional (si falta con DNI, lo señala la pantalla de validación, porque SES lo exige con NIF); columnas del Sheet reordenadas a mano (KAF Rent lee por título: comprobado con las cabeceras reales). Segundo apellido obligatorio con la indicación del guion, aplicado por el script y comprobado en la vista previa (2026-10-02).

1. **Código de reserva:** mover la pregunta "Código de reserva de Airbnb" de la sección del adulto a la primera sección, antes de "¿El huésped tiene la mayoría de edad?" (arrastrándola), y renombrarla a `Código de reserva` (obligatoria). Así conserva sus respuestas en la misma columna. Después, borrar la de la sección del menor (su columna se queda en el Sheet con los datos).
2. **Apellidos del adulto:** `Primer Apellido` y `Segundo Apellido`.
3. **Apellidos del menor:** `Primer Apellido del menor de edad` y `Segundo Apellido del menor de edad`.
4. **Documento:** sin cambios (ver la tabla: el menor no responde los números).
5. **Fechas:** comprobar que `Fecha de nacimiento` y `Fecha de nacimiento del menor` son de tipo *Fecha* (si no, cambiarlas).
6. **Script del Form:** instalarlo (DEVELOPMENT, "Script del Form de viajeros") y ejecutar *KAF Rent → Actualizar listas y validaciones*. En esta fase pone las validaciones (DNI/NIE, soporte, email, teléfono con prefijo); el informe dirá que las listas aún no tienen catálogo: es lo esperado.
7. **Prueba:** abrir el Form en modo vista previa (ojo) y enviar una respuesta de adulto con DNI, otra con NIE y otra de menor, con datos inventados; comprobar los mensajes de error con un DNI mal escrito y que en el Sheet aparecen las columnas nuevas. Borrar después esas dos respuestas (en el Form, pestaña Respuestas, y su fila en el Sheet).

*Fase 2 — listas (cuando `Catálogo_SES` tenga datos: países y provincias tras S27; sexo, tipo de documento y parentesco tras ACC-04).* Hacer **cada cambio de tipo justo antes de ejecutar el script**, para que ninguna lista quede con una sola opción.
8. Cambiar a *Desplegable* `Nacionalidad`, `País`, `Provincia` y sus versiones del menor; ejecutar el script y comprobar que tienen la lista completa.
9. Cuando haya catálogos de SES: `Sexo` y `Sexo del menor` a *Opción única*; `Tipo de documento`, `Tipo de documento del menor` y la pregunta de parentesco a *Desplegable*; ejecutar el script. En "Tipo de documento", comprobar después que cada opción sigue llevando a su sección (el informe avisa si alguna perdió el salto).
10. Repetir la prueba del paso 7.

"¿Motivo de su hospedaje?" se mantiene (usuario, 2026-10-02).

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
- ~~**Pregunta:** título de la pregunta del código de reserva~~ → una sola pregunta "Código de reserva" (D-37, §3.6).
- ~~Teléfono con prefijo · "¿Motivo de su hospedaje?"~~ → prefijo obligatorio; la pregunta del motivo se mantiene (usuario, 2026-10-02).
- ~~Cuenta propietaria e ID del Form~~ → `operaciontangai`, ID en §3.2.
- **No verificado:** si `RH` admite solo el titular sin el resto de viajeros (se comprueba con la primera reserva real, S29).
- ~~**No verificado:** formato del código de municipio~~ → **5 dígitos INE** (§4.1 de la especificación v3.1.3, el bloque común manda; comprobado al implementar S26).
- **No verificado:** espacio de nombres del XML de `RH` (la especificación solo trae el ejemplo de `PV`); se usa `altaReservaHospedaje` por analogía y se comprueba con la primera reserva real (S29).
- ~~No verificado: códigos de `TIPO_DOCUMENTO`~~ → comprobados en el catálogo de producción el 2026-10-02 (`NIF`, `NIE`, `PAS`, `OTRO`, `CIF`, `CIF_E`).
- **Externo:** credenciales del servicio web (pruebas y producción) y revisión RGPD (EXT-02).

## 6. Plan
| Paso | Qué | Talla | Tests |
|---|---|---|---|
| SES-2 | Dominio: casado, viajero, validación, XML `RH`/`PV`, traducción de códigos, clasificación de errores, reintentos | L (6–8 h) | Unitarios por regla y por campo obligatorio |
| SES-3 | Adaptador SOAP + Sheet del Form + hojas nuevas + `procesarComunicacionesSES` | L (6–8 h) | Endpoints con dobles de `UrlFetchApp` y del Form |
| SES-4 | Pantallas: mensaje de WhatsApp, validar identidades, comunicar; emails (plantilla F-18) | L (8–10 h) | Endpoints; E2E en el release |
| SES-5 | Catálogos reales (`actualizarCatalogosSES`, INE), credenciales, paso a producción (hecho el 2026-10-02; pre-ses respondía 502) y verificación con la primera reserva real | M (3–4 h) | Primera reserva real (S29) |
