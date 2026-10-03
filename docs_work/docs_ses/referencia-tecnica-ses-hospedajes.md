# Referencia técnica — SES.Hospedajes (RD 933/2021)

**Fuentes originales** (no borrar, esto es un resumen derivado):
- [BOE-A-2021-17461-consolidado.pdf](BOE-A-2021-17461-consolidado.pdf) — Real Decreto 933/2021, texto consolidado.
- [MIR-HOSPE-DSI-WS-Servicio de Hospedajes - Comunicaciones v3.1.3.pdf](MIR-HOSPE-DSI-WS-Servicio%20de%20Hospedajes%20-%20Comunicaciones%20v3.1.3.pdf) — especificación del webservice, versión 3.1.3 (08/01/2025).

**Para qué sirve este documento:** evitar releer los PDF completos (12 y 76 páginas) cada vez que se retome la Fase 2 (Registro de viajeros, [ADR-0007](../../docs_dev/solution/adr/0007-registro-de-viajeros-para-reservas-de-habitacion.md)). Recoge solo lo aplicable a KAF Rent (alquiler de la Habitación Interior). Si algo no está aquí, está en los PDF originales.

**Nota de mantenimiento:** si el Ministerio publica una versión posterior a la 3.1.3, este documento puede quedar desactualizado — comprobar el "Control de versiones" del PDF antes de dar por buenos los campos.

---

## 1. Régimen legal aplicable a KAF Rent

El alquiler de la Habitación Interior es una actividad de hospedaje **no profesional** (Art. 2.1 RD 933/2021: se aloja a cambio de precio, sin más). Esto importa porque el RD distingue dos regímenes distintos (Anexo I):

| | A) Ejercicio profesional | B) Ejercicio no profesional (aplica a KAF Rent) |
|---|---|---|
| Registro documental propio + conservación 3 años (Art. 5) | Obligatorio | **Exento** (Art. 5.4) |
| Obligación de comunicar a SES.Hospedajes (Art. 6) | Sí | **Sí, igual** |
| Datos a comunicar | Anexo I-A | **Anexo I-B** |

Es decir: **no hace falta llevar un libro-registro propio**, pero **sí hay que comunicar cada reserva** a SES.Hospedajes.

**Plazos (Art. 6):**
- Datos del titular del inmueble/arrendador: antes de empezar a operar (alta única, no por reserva).
- Datos de la reserva/contrato y de los viajeros: **de forma inmediata y, en todo caso, en un plazo no superior a 24 horas** desde que se hace la reserva/contrato (o su anulación), y también al inicio del servicio.
- Constitucionalmente en vigor desde el 27-04-2022; las obligaciones de comunicación, desde el **2-01-2023**.

**Datos a comunicar (Anexo I-B, ejercicio no profesional):**
1. Titular del inmueble: nombre, apellidos, sexo, documento de identidad + tipo, nacionalidad, fecha de nacimiento, teléfono, correo.
2. Inmueble: dirección completa, código postal, localidad, país, nº de habitaciones, conexión a internet (sí/no).
3. Viajeros: nombre, apellidos, sexo, documento + tipo, nacionalidad, fecha de nacimiento, residencia habitual, teléfono, correo, nº de viajeros, parentesco (si hay menores).
4. Transacción: nº de referencia y fecha del contrato/reserva, firmas, fecha/hora de entrada y salida, datos de pago (tipo, medio, titular, caducidad si tarjeta, fecha de pago).

**Nota:** el RD **no pide fotos del documento de identidad**. Esa exigencia es propia de [ADR-0007](../../docs_dev/solution/adr/0007-registro-de-viajeros-para-reservas-de-habitacion.md) (evidencia interna), no un requisito de la comunicación oficial — importante de cara a la revisión RGPD (menor superficie de datos sensibles si se decide no pedir fotos, o tratarlas aparte de este envío).

---

## 2. El webservice SES.Hospedajes

**Endpoints:**
| Entorno | URL |
|---|---|
| Pruebas | `https://hospedajes.pre-ses.mir.es/hospedajes-web/ws/v1/comunicacion` |
| Producción | `https://hospedajes.ses.mir.es/hospedajes-web/ws/v1/comunicacion` |

**Protocolo:** SOAP sobre HTTPS (TLS obligatorio, hay que importar el certificado del servicio en el almacén de confianza del cliente). Autenticación **HTTP Basic** (`Authorization: Basic base64(usuario:contraseña)`).

**Comprobado en producción (2026-10-02):** con las credenciales del registro, la consulta de catálogo responde bien en producción; pre-ses respondió HTTP 502 (también al repetir). Catálogos reales: `TIPO_DOCUMENTO` = CIF, CIF_E, NIE, NIF, OTRO, PAS; `TIPO_PAGO` incluye `OTRO` (otros medios de pago).

**Certificado TLS (comprobado el 2026-10-02 con `openssl s_client`):** pruebas y producción usan certificados de la FNMT (`AC Componentes Informáticos`, raíz `AC RAIZ FNMT-RCM`) y **el servidor no envía el certificado intermedio** (`Verify return code: 21`). Por eso el PDF pide importar el certificado en el almacén de confianza del cliente. Apps Script (`UrlFetchApp`) no permite importar certificados: si Google no completa la cadena por su cuenta, la llamada falla, y la única salida dentro de Apps Script es `validateHttpsCertificates: false` (no verifica el servidor). **Probado el 2026-10-02 (SES-0):** `UrlFetchApp` contra pre-ses conecta **validando el certificado** (HTTP 401 sin credenciales, lo esperado). No hace falta desactivar la validación.

**Cómo se obtienen las credenciales:** registrándose primero como sujeto obligado en el formulario de la Sede Electrónica del Ministerio del Interior (fuera del webservice; es un trámite administrativo previo, no una llamada API). **Pendiente de investigar:** si ese alta exige algún tipo de certificación como "proveedor de software" o basta con el registro estándar de particular/no profesional — no está claro en el PDF (cuestión abierta de ADR-0007).

**Formato de los datos:** el contenido de cada solicitud va en un fichero **XML comprimido en ZIP y codificado en Base64**, dentro de la etiqueta `solicitud` del sobre SOAP. Apps Script puede generarlo con `XmlService` + `Utilities.zip()` + `Utilities.base64Encode()` (servicios nativos, sin dependencias — compatible con coste cero).

**Operaciones disponibles:**
| Operación | Sync/Async | Uso previsto en KAF Rent |
|---|---|---|
| `comunicacion` (tipoOperacion `A`) | Asíncrona (por lotes) | **La principal**: alta de reservas de hospedaje |
| `comunicacion` (tipoOperacion `B`) | Asíncrona | Anular una reserva comunicada (p. ej. si se cancela) |
| `comunicacion` (tipoOperacion `C`) | Asíncrona | Consultar el resultado de un lote enviado |
| `consultaLote` | Síncrona | Alternativa más simple a `comunicacion` tipo C |
| `consultaComunicacion` | Síncrona | Consultar el detalle de una comunicación ya creada |
| `anulacionLote` | Síncrona | Anular todas las comunicaciones de un lote de una vez |
| `catalogo` | Síncrona | Obtener los códigos válidos de las tablas maestras (ver §4) |

**Límites configurables por el servicio (valores actuales, pueden cambiar):** máx. 100 comunicaciones por petición de alta; máx. 10 lotes o 10 comunicaciones por consulta.

**Flujo típico de alta:** enviar `comunicacion` (tipoOperacion A, tipoComunicacion RH) → el servicio devuelve `codigo=0` + un `lote` (UUID) si la petición es sintácticamente válida → un proceso asíncrono del Ministerio la valida de verdad → hay que consultar el lote (`consultaLote` o `comunicacion` tipo C) para saber si realmente se creó cada comunicación o dio error. **Importante:** un `codigo=0` en la respuesta inmediata **no significa que la reserva ya esté comunicada**, solo que la petición se ha aceptado para procesar.

---

## 3. Campos para el alta de una reserva de hospedaje (tipo `RH`)

**Corrección (2026-10-02, tras releer el Art. 6.3 del RD y el PDF):** no es "RH o PV". El Art. 6.3 fija **dos momentos**, cada uno con plazo de 24 h: (a) al hacer la reserva o su anulación → **`RH`** (reserva de hospedaje); (b) al inicio del servicio (llegada) → **`PV`** (parte de viajeros). KAF Rent necesita las dos. El Art. 6.4 permite a quien ejerce de forma no profesional comunicar por medios no telemáticos (p. ej. el formulario web de la Sede), así que la automatización es una comodidad, no una obligación.

### Cabecera de la petición (común a toda operación)
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `codigoArrendador` | String(10) | Sí | Asignado al registrarse como sujeto obligado |
| `aplicacion` | String(50) | Sí | Nombre libre del sistema origen (p. ej. "KAF Rent") |
| `tipoOperacion` | String(1) | Sí | `A` alta / `C` consulta / `B` anulación |
| `tipoComunicacion` | String(2) | Solo en alta | `RH` para KAF Rent |
| `solicitud` | Base64 | Sí | XML comprimido en ZIP, ver §2 |

### Bloque `establecimiento`
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `codigo` | String(10) | uno de los dos | Código de establecimiento si ya está dado de alta |
| `datosEstablecimiento.tipo` | String(10) | si no hay código | Catálogo `TIPO_ESTABLECIMIENTO` |
| `datosEstablecimiento.nombre` | String(50) | si no hay código | |
| `datosEstablecimiento.direccion` | bloque dirección | si no hay código | ver §3.3 |

### Bloque `contrato`
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `referencia` | String(50) | Sí | Nº de referencia — candidato natural: `Id_Reserva` de KAF Rent |
| `fechaContrato` | Fecha `AAAA-MM-DD` | Sí | Fecha de la reserva |
| `fechaEntrada` | `AAAA-MM-DDThh:mm:ss` | Sí | Check-in |
| `fechaSalida` | `AAAA-MM-DDThh:mm:ss` | Sí | Check-out |
| `numPersonas` | Numérico | Sí | `Adultos + Menores` |
| `numHabitaciones` | Numérico | No | 1 (solo hay una Habitación) |
| `internet` | Booleano | No | |
| `pago` | bloque pago | Sí | ver §3.4 |

### Bloque `persona` (se repite: 1 titular `TI` + N viajeros `VI`)
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `rol` | String(2) | Sí | `TI` titular del contrato / `VI` viajero |
| `nombre` | String(50) | Sí | |
| `apellido1` | String(50) | Sí | |
| `apellido2` | String(50) | No | |
| `tipoDocumento` | String(5) | No | Catálogo `TIPO_DOCUMENTO` |
| `numeroDocumento` | String(15) | No | |
| `fechaNacimiento` | Fecha | No | |
| `nacionalidad` | String(3) | No | ISO 3166-1 alfa-3 (p. ej. `ESP`) |
| `sexo` | String(1) | No | Catálogo `SEXO` |
| `direccion` | bloque dirección | No | |
| `telefono` / `telefono2` / `correo` | String | **al menos uno de los tres** | |

### Diferencias del parte de viajeros (`PV`) frente a `RH` (§3.1.1.1 del PDF)
- Cabecera de la solicitud con `codigoEstablecimiento` (obligatorio, asignado en el registro) en lugar del bloque `establecimiento`.
- `persona.rol` siempre `VI`.
- **Más campos obligatorios por persona:** `fechaNacimiento` y `direccion` (domicilio) siempre; `tipoDocumento` y `numeroDocumento` si es mayor de edad; `soporteDocumento` si es NIF o NIE; `apellido2` si es NIF; `parentesco` si es menor (al menos un adulto debe indicar su relación con cada menor). Uno de `telefono`, `telefono2` o `correo`.

### 3.3 Bloque `direccion` (común, §4.1 del PDF)
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `direccion` | String(100) | Sí | Calle, número, piso... |
| `direccionComplementaria` | String(100) | No | |
| `codigoMunicipio` | String(5) | si país = España | Código INE de **5 dígitos**: lo fija el bloque común §4.1 de la especificación v3.1.3 (en otro apartado decía 6; manda §4.1, revisado 2026-10-02) |
| `nombreMunicipio` | String(100) | si país ≠ España | |
| `codigoPostal` | String(20) | Sí | |
| `pais` | String(3) | Sí | ISO 3166-1 alfa-3 |

### 3.4 Bloque `pago` (§4.2 del PDF)
| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `tipoPago` | String(5) | Sí | Catálogo `TIPO_PAGO` |
| `fechaPago` | Fecha | No | |
| `medioPago` | String(50) | No | Tipo de tarjeta+nº, IBAN, etc. |
| `titular` | String(100) | No | |
| `caducidadTarjeta` | String(7) | No | Formato `MM/AAAA` |

**Aviso:** en el bloque de **respuesta** (consulta), estos mismos campos se llaman `tipo`/`fecha` en vez de `tipoPago`/`fechaPago` — asimetría del propio spec, no un error de transcripción.

---

## 4. Catálogos (valores controlados)

Los códigos de `tipoDocumento`, `sexo`, `nacionalidad` (parcialmente, es ISO), `tipoPago`, `tipoEstablecimiento`, etc. **no vienen fijados en el PDF**: hay que pedirlos en tiempo de "configuración" con la operación `catalogo` (parámetro `catalogo` = nombre de la tabla: `SEXO`, `TIPO_DOCUMENTO`, `TIPO_ESTABLECIMIENTO`, `TIPO_PAGO`, `TIPO_PARENTESCO`, `TIPO_COLOR`, `TIPO_MARCA_VEHICULO`, `TIPO_PERMISO_CONDUCIR`, `TIPO_VEHICULO` — los últimos tres no aplican a KAF Rent, son para alquiler de vehículos).

**Implicación de diseño (para cuando se implemente):** no hardcodear estos códigos en el código; guardarlos en `Config` o en una hoja de catálogo, con un proceso (manual o programado) que los refresque de vez en cuando contra la operación `catalogo`, igual que ya se hace con otras tablas de dominio (CLAUDE.md §3.1, principio Abierto/Cerrado).

---

## 5. Códigos de error del servicio (tabla completa)

| Código | Descripción |
|---|---|
| 0 | Ok |
| 10100 | No ha informado el código de arrendador |
| 10101 | No ha informado el código de aplicación |
| 10103 | El código de arrendador no existe en el sistema |
| 10107 | Usuario incorrecto |
| 10108 | No ha informado la petición |
| 10109 | No ha informado la cabecera |
| 10110 | No ha informado la solicitud |
| 10111 | Formato de solicitud incorrecto (no es XML UTF-8 comprimido ZIP + Base64) |
| 10112 | No ha informado el código de la operación |
| 10113 | El código de comunicación no existe en el sistema |
| 10116 | No ha informado el tipo de la comunicación |
| 10117 | La operación solo puede ser 'A', 'C' o 'B' |
| 10118 | Error en el formato del fichero XML |
| 10119 | El arrendador no puede realizar ese tipo de comunicaciones |
| 10120 | El arrendador no tiene habilitado el servicio web |
| 10121 | Error de validación |
| 10122 | Tipo de comunicación no válido (`PV`, `RH`, `AV`, `RV`) |
| 10128 | El usuario no está indicado en la cabecera |
| 10130 | Valor incorrecto para el campo `$NOMBRE_CAMPO` |
| 10131 | Es obligatorio indicar un valor en el campo `$NOMBRE_CAMPO` |
| 10136 | Se ha superado el número máximo de comunicaciones a consultar |
| 10140 | Solicitud no informada |
| 10150 | Se ha superado el número máximo de caracteres de la aplicación |
| 10159 | El tipo de comunicación informado no es válido |
| 10160 | No ha informado el código de la comunicación |
| 10180 | El formato del código de comunicación no es válido |
| 10999 | Error no controlado |

---

## 6. Cuestiones que siguen abiertas (no resueltas por estos PDF)

- **Alta como sujeto obligado:** ¿el registro previo en la Sede Electrónica exige certificación de software, o basta con darse de alta como particular no profesional? No lo dice este documento.
- **Fotos del documento de identidad:** no las pide el RD ni el webservice; su necesidad (o no) es una decisión de producto/legal de ADR-0007, no de esta especificación.
- **Envío automático vs. manual:** ADR-0007 fijó que la primera fase será manual. Con este documento ya hay base técnica para valorar la automatización (llamada SOAP desde `infra_` con `UrlFetchApp`), pero sigue siendo una decisión de alcance pendiente (§2.1) cuándo se aborde.
- **Entorno de pruebas:** antes de integrar de verdad, probar contra `hospedajes.pre-ses.mir.es` (§2.1 del manual). El manual no dice si las credenciales del registro valen también en pruebas: se comprueba con *Comprobar la conexión con SES* (F-30).
