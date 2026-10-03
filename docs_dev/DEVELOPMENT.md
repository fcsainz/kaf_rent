# Desarrollo y despliegue — KAF Rent

El código de la app vive en [`docs_dev/src/`](src/) (Google Apps Script). Se edita en VS Code, se versiona con Git y se sincroniza con Google mediante **clasp** con las credenciales locales de la cuenta operativa ([ADR-0015](solution/adr/0015-despliegue-con-clasp-multicuenta.md)). **Estado:** en uso desde la publicación de la v2 (2026-09-27, implementación v37). Copia/pega solo en emergencia.

## clasp (flujo normal, una vez configurado)

> **`npm run push` usa `--force` (decisión del usuario, 2026-10-03):** Apps Script vuelve a guardar `appsscript.json` con las claves en otro orden cada vez, y sin `--force` clasp se salta la subida en silencio ("Skipping push"). El manifiesto vive en el repo: no se toca a mano en el editor.

**Una vez por equipo** (sirve para todos tus proyectos):
1. Activa la *Google Apps Script API* en <https://script.google.com/home/usersettings> con cada cuenta.
2. `npm install -g @google/clasp`
3. `clasp login --user familia` (con `operaciontangai@gmail.com`) y `clasp login --user fcsainz` (con `fcsainz@gmail.com`). Las credenciales quedan en `~/.clasprc.json`: **nunca** se copian al repositorio ni a GitHub.

**Una vez por proyecto:** copia `.clasp.json.example` como `.clasp.json` (no se versiona) y pon el `scriptId` (editor → Configuración del proyecto → ID de secuencia de comandos). **Antes del primer `push`:** `clasp --user familia pull` en una carpeta temporal y compara con `docs_dev/src/`, porque `push` **sustituye** todo el código remoto.

**Día a día (T-08):** los lanza siempre el usuario.
```bash
npm run push                          # tests + lint y, si pasan, clasp --user familia push (sustituye lo remoto)
npm run deploy -- "v2.x Resumen"      # publica la versión en la URL de producción
```
`npm run deploy` lee el ID de la implementación de la variable de entorno `KAF_RENT_ID_IMPLEMENTACION` (Implementar → Gestionar implementaciones), para no guardarlo en el repositorio. Ponla en tu `~/.bashrc`: `export KAF_RENT_ID_IMPLEMENTACION=AKfy…`. Sin `npm`: `clasp --user familia push` y `clasp --user familia deploy -i <ID> -d "…"`.
Con clasp **no se edita en el editor web**: lo que se cambie allí se pierde en el siguiente `push`.

## Script del Form de viajeros (ADR-0021)

Proyecto aparte, ligado al Google Form de viajeros; código en `docs_dev/src_form_checkin/`. Rellena los desplegables del Form desde `Catálogo_SES` y pone las validaciones. No lleva credenciales de SES.

**Una vez** (cuenta `operaciontangai`, propietaria del Form). Proyecto `script_form_checkin_habitacion`, creado el 2026-10-02 desde el editor del Form; en otro equipo basta el paso 2.
1. Crear el proyecto ligado: Form → ⋮ → **Editor de secuencias de comandos**. No crearlo con `clasp create-script`: con `--type forms` crea un Form nuevo, y sin él crea otro proyecto ligado más (un Form admite varios y todos añadirían su menú).
2. Copia `docs_dev/src_form_checkin/.clasp.json.example` como `.clasp.json` en esa misma carpeta (no se versiona) y pon el `scriptId` (Configuración del proyecto del script).
3. `npm run push:form` (tests + lint + `clasp push --force` desde esa carpeta; `--force` porque el manifiesto del repositorio manda sobre el remoto).
4. En el editor del script: Configuración del proyecto → Propiedades del script → `BBDD_KAF_RENT_ID` = ID de `BBDD_KAF_Rent`.
5. Recarga el editor del Form: aparece el menú **KAF Rent → Actualizar listas y validaciones** (pide permisos la primera vez).

**Cuándo ejecutarlo:** tras los cambios a mano del Form (DD-02 §3.6) y cada vez que KAF Rent refresque `Catálogo_SES`. Las listas cuyo catálogo aún esté vacío no se tocan; el informe lo dice.

## SES.Hospedajes: puesta en marcha (hecha el 2026-10-02, en producción)

Pasos seguidos el 2026-10-02, con la versión implementada (cuenta `operaciontangai`). Sirven para rehacerlo en otra instalación:
1. *Reparar hojas*: crea `Catálogo_SES`, `Municipios_INE`, `Comunicaciones_SES` y `Validacion_Viajeros` y añade a `Config` las claves de SES (sin tocar las existentes).
2. `Config`: `Sheet_Viajeros_Id` (ID del Sheet de respuestas del Form; con él, cada respuesta del Form programa la comunicación de la reserva: ponlo cuando las credenciales y `SES_Url` estén comprobados), `SES_Codigo_Arrendador`, `SES_Codigo_Establecimiento`. `SES_Url`: producción (`https://hospedajes.ses.mir.es/hospedajes-web/ws/v1/comunicacion`). Pre-ses respondía HTTP 502 el 2026-10-02; si vuelve a funcionar y aceptas sus credenciales, sirve para probar.
3. Editor de KAF Rent → Configuración del proyecto → **Propiedades del script**: `SES_USUARIO` y `SES_CONTRASENA` (las del servicio web, ACC-04). Nunca en el Sheet ni en el código (D-32).
4. **Comprueba la conexión:** menú del Sheet **KAF Rent → Comprobar la conexión con SES** (o, como Admin, Inicio → *Comprobar conexión*). Es de solo lectura: no envía datos de huéspedes. Si dice que SES rechaza las credenciales, revisa que sean del entorno al que apunta `SES_Url`.
   Después ejecuta `actualizarCatalogosSES` desde el editor y apunta en `SES_Tipo_Pago` el código de "otras formas de pago" que aparezca en `Catálogo_SES` (`OTRO`).
5. Listas en el Sheet de KAF Rent (decisión del usuario, 2026-10-02): `Catálogo_SES` ya tiene `PAIS` (249, ISO 3166-1 alfa-3) y `PROVINCIA` (52), cargadas el 2026-10-02. `Municipios_INE` se importa desde `docs_work/docs_ses/municipios_ine_2025.csv` (INE a 1-1-2025): pestaña `Municipios_INE` → Archivo → Importar → Subir → *Reemplazar la hoja actual*, separador coma y **sin** "Convertir texto en números" (los códigos llevan ceros a la izquierda). Para renovarla, se repite con la lista del año que publique el INE.
6. **Enlace del mensaje para el huésped (F-27):** en el Form (modo edición) → ⋮ → **Obtener enlace prerrellenado** → escribe `CODIGO` en "Código de reserva" → *Obtener enlace* → *Copiar enlace*. Pégalo en `Config.Form_Viajeros_Enlace` cambiando `CODIGO` por `{codigo}`.
7. Vuelve a ejecutar `instalarTriggers`: añade `procesarComunicacionesSES` (cada 10 min) y `alEnviarFormularioViajeros` (al enviar el Form).
8. Script del Form: propiedad `BBDD_KAF_RENT_ID` y fase 2 del Form (DD-02 §3.6).

Seguimiento: cada comunicación queda en `Comunicaciones_SES` con su estado (Pendiente → Enviada → Comunicada; o Rechazada / Manual con el motivo en `Error`). Al comunicarse, se marca en el Sheet del Form igual que a mano, con `Tipo_Comunicación` = "Automática".

## Restaurar desde una copia de seguridad (D-49)

Las copias están en `KAF. KAF Rent/KAF. Backup - KAF Rent` (`Config.Carpeta_Backups_Id`), en la cuenta operativa: `BBDD_KAF_Rent — backup AAAA-MM-DD` (Sheet) y `{Sheet del Form} — backup AAAA-MM-DD.xlsx` (respuestas del Form de viajeros). Cada copia hecha queda en `Logs` con tipo `COPIA`; un fallo, en `Errores` (`tarea:copiaSeguridadSheet`). Rotación: RF-68, ADR-0016.

1. **Primero, el historial de versiones** (*Archivo → Historial de versiones*) del Sheet afectado: para un cambio reciente es más fino que una copia de un día.
2. **Una hoja de `BBDD_KAF_Rent` borrada o estropeada:** abre la copia del día que quieras, clic derecho en la pestaña → *Copiar en → Hoja de cálculo existente* → `BBDD_KAF_Rent`. En el original, borra la hoja dañada y renombra la copiada con el nombre exacto (sin "Copia de"). Lo registrado después de esa copia se pierde: revisa `Historial_Cambios` y `Logs` de esos días para rehacerlo.
3. **Respuestas del Form de viajeros:** en el Sheet del Form, *Archivo → Importar → Subir* el `.xlsx` → *Insertar hojas nuevas*, y copia las filas que falten a `Respuestas de formulario 1`. **No sustituyas** esa hoja: es la vinculada al Form.
4. **`BBDD_KAF_Rent` perdido entero** (no probado): la copia lleva dentro su propio proyecto de Apps Script, pero con otro ID. Haz una copia de la copia, llámala `BBDD_KAF_Rent`, pon su `scriptId` en `.clasp.json`, `npm run push`, vuelve a poner las Propiedades del script (contraseña de SES), `instalarTriggers` y una implementación nueva; la URL de la app cambia y hay que avisar a todos.

## Emergencia: copia/pega manual

Si clasp no está disponible, se pega cada fichero de `docs_dev/src/` en el editor de Apps Script como en la v1 (pasos 3–4 de la puesta en marcha).

Arquitectura, modelo de datos y claves de `Config`: [docs_dev/solution/arc42.md](solution/arc42.md). Reglas de trabajo, estándares y tests: [CLAUDE.md](../CLAUDE.md).

## Estructura del código

```
docs_dev/src/                       Capa (ver CLAUDE.md §3.3 y arc42 §5.2)
├── appsscript.json                 Manifiesto: Europe/Madrid, V8, Web App (USER_ACCESSING, ANYONE; ADR-0017)
│
├── api_web.gs                      API: doGet() e include() de plantillas
├── api_seguridad.gs                API: identidad, autorización, ejecutarEndpoint_, ejecutarTareaDelSistema_
├── api_catalogo.gs                 API: catálogos del formulario
├── api_reservas.gs                 API: crear reserva, reservas de un vistazo, buscador
├── api_gestion.gs                  API: lista paginada, ficha, edición auditada, cobro, cancelación, funciones de la barra de Reservas (DD-03)
├── api_documentos.gs               API: contrato y vídeos a Drive
├── api_estadisticas.gs             API: estadísticas por canal con su ocupación (DD-04) y enlace al calendario
├── api_cierres.gs                  API: Cerrar días (DD-04)
├── api_gastos.gs                   API: gastos y resumen fiscal
├── api_sistema.gs                  API: triggers, menú del Sheet y utilidades de editor (protegidas)
│
├── dominio_reservas.gs             DOMINIO (puro): validaciones, importes, solapamiento, IDs, ciclo de vida
├── dominio_informes.gs             DOMINIO (puro): agregados del informe por email
├── dominio_ocupacion.gs            DOMINIO (puro): días cerrados, reparto por noches y métricas de ocupación (DD-04)
├── dominio_fiscal.gs               DOMINIO (puro): gastos, amortización, resumen a tercios
│
├── infra_esquema.gs                INFRA: hojas y campos (fuente única), semillas
├── infra_comun.gs                  INFRA: tablas por campo, fechas, formato, escape HTML, logs
├── infra_config.gs                 INFRA: hoja Config
├── infra_catalogo.gs               INFRA: catálogos
├── infra_repositorio_reservas.gs   INFRA: Reservas, líneas de servicio, historial
├── infra_repositorio_gastos.gs     INFRA: Gastos y Resumen_Fiscal
├── infra_repositorio_informes.gs   INFRA: Historico_Informes
├── infra_repositorio_cierres.gs    INFRA: Dias_Cerrados (DD-04)
├── infra_drive.gs                  INFRA: carpetas y archivos en Drive
├── infra_calendario.gs             INFRA: eventos de Calendar
├── infra_correo.gs                 INFRA: emails (avisos, confirmación, informes)
├── infra_mantenimiento.gs          INFRA: copias, purgas, poda de vídeos
│
├── index.html                      PRESENTACIÓN: shell de la app
├── estilos.html                    PRESENTACIÓN: tokens del sistema de diseño (ADR-0011)
├── cliente.html                    PRESENTACIÓN: navegación, Crear Reserva, Inicio, Buscar
├── gestion_interfaz.html           PRESENTACIÓN: Gestionar (tarjetas), ficha, funciones de la barra de Reservas, calendario
├── ocupacion_interfaz.html         PRESENTACIÓN: Cerrar días y Estadísticas por canal (DD-04)
├── gastos_interfaz.html            PRESENTACIÓN: Gastos y resumen fiscal
└── acceso-denegado.html            PRESENTACIÓN: pantalla de acceso denegado
```

> **Trampa de Apps Script:** un fichero no puede llamarse igual que otro aunque sean de tipo distinto. Por eso los HTML que comparten nombre con un `.gs` llevan el sufijo `_interfaz`, y los `include(...)` de `index.html` usan ese mismo nombre.

> ⚠️ **Al desplegar la v2 por primera vez** (cambió la estructura de ficheros): con clasp, `push` sustituye el proyecto entero y no hay que hacer nada más. **Con copia/pega hay que BORRAR en el editor los ficheros antiguos** (`Code`, `auth`, `config`, `setup`, `utils`, `catalogo`, `reservas`, `gestion`, `drive`, `calendario`, `notificaciones`, `estadisticas`, `informes`, `mantenimiento`, `gastos`) y crear los nuevos: si conviven, las constantes duplicadas impiden arrancar la app. El Sheet **no** necesita cambios (mismas hojas y columnas). Los triggers siguen llamando a `tareasNocturnas` e `informesProgramados`, que conservan el nombre.

## Puesta en marcha (una sola vez)

1. **Cuenta operativa:** inicia sesión con `operaciontangai@gmail.com`. El Sheet, Drive, Calendar y el proyecto de script serán suyos.
2. **Base de datos:** crea un Google Sheet en blanco (`BBDD_KAF_Rent`) dentro de la carpeta raíz `KAF. KAF Rent`.
3. **Proyecto de script:** en ese Sheet, `Extensiones → Apps Script`.
4. **Pegar el código:** crea en el editor cada fichero de `docs_dev/src/` y pega su contenido.
   - Los `.gs`, como tipo **Script** (mismo nombre, sin extensión).
   - Los HTML, como tipo **HTML**, con el **nombre exacto sin extensión**: `index`, `estilos`, `cliente`, `gestion_interfaz`, `gastos_interfaz`, `acceso-denegado`.
   - El manifiesto `appsscript.json` se edita tras activar "Mostrar el archivo de manifiesto" en `Configuración del proyecto`.
5. **Inicializar las hojas:** en el Sheet, **con la cuenta propietaria (`operaciontangai`)**, menú **KAF Rent → Inicializar / reparar hojas** (o ejecuta `inicializarBaseDeDatos` desde el editor). Crea todas las hojas con sus cabeceras y siembra `Config`, `Catálogo_Espacios` y `Catálogo_Categorias_Gasto`. Es idempotente y **seguro con datos reales** (desde v2, B-16): en las hojas existentes solo añade al final las columnas que falten, sin renombrar ni mover las demás. Úsalo **tras cada despliegue** que cambie el esquema. Puedes mover columnas o añadir las tuyas; lo que no debes hacer es **renombrar una cabecera** del esquema: la app daría un error claro y "reparar" añadiría una columna nueva vacía con el nombre correcto.
6. **Rellenar `Config`:** como mínimo `Emails_Notificacion` (los tres, separados por comas), `Carpeta_Videos_Id`, `Carpeta_Documentos_Id`, `Carpeta_Backups_Id`, `Calendar_Id` (vacío = calendario por defecto) y `Calendar_Url`. Lista completa en [arc42 §8.7](solution/arc42.md#87-configuración-config). (`Carpeta_Raiz_Id` es solo de referencia.)
7. **Catálogos:** rellena `Catálogo_Canales` y `Catálogo_Servicios_Extra` (y revisa `Catálogo_Espacios`).
8. **Usuarios:** en `Usuarios_Autorizados`, añade las tres cuentas personales (Email, Activo = `Sí`).
9. **Compartir (obligatorio, [ADR-0017](solution/adr/0017-ejecutar-como-usuario-que-accede.md)):** la Web App se ejecuta como quien accede, así que cada usuario de `Usuarios_Autorizados` necesita permiso de **edición** en el Sheet y en las carpetas de vídeos y documentos, y **"Hacer cambios en eventos"** en el calendario de `Calendar_Id`. Sin eso, a esa persona le fallará lo que no tenga compartido (B-14). Cada alta de usuario repite este paso. No hace falta que cada usuario añada el calendario a su lista: si no lo tiene, la app lo suscribe oculto y sin marcar la primera vez que crea un evento (B-14, S22).
10. **Desplegar la Web App:** `Implementar → Nueva implementación → Aplicación web`:
    - **"Ejecutar como" → Usuario que accede a la aplicación web** (`USER_ACCESSING`). **Nunca "Yo":** con cuentas `@gmail.com` la app no sabría quién entra y bloquearía a todos (ADR-0017). El valor del diálogo **manda sobre** `appsscript.json`: compruébalo siempre.
    - **"Quién tiene acceso" → Cualquier usuario con cuenta de Google.**
    - Comparte la URL con los tres.
11. **Triggers:** ejecuta **una vez** `instalarTriggers` desde el editor (crea `tareasNocturnas` diario a las 03:00 e `informesProgramados` el día 1 a las 07:00). Acepta los permisos que pida.
12. **Calendario existente:** si ya había reservas, ejecuta una vez `sincronizarReservasCalendario` desde el editor para crear los eventos que falten.
13. **Horas a 00:00 (una vez, al desplegar S22):** ejecuta `corregirHorasReservas` desde el editor. Pone la hora de `Config` a las reservas de la Habitación guardadas a 00:00, mueve su evento y lo anota en el historial (B-22, D-28). Devuelve los IDs corregidos; repetirla no cambia nada.
14. **Checklists (al desplegar S22):** pulsa *Reparar hojas* para crear `Checklists_Reserva` (ADR-0020) y, ya publicada la versión nueva, borra la hoja `Registro_Checklist`. En `Catálogo_Checklist`, los puntos EXT-OUT-03, EXT-OUT-04, EXT-OUT-21 e INT-OUT-03 pasan a `Tipo` = `Daños` y a los textos "Mobiliario", "Instalaciones y piscina", "Cojines" y "Habitación" (B-19); antes de publicar, no, porque la versión anterior no conoce ese tipo.
15. **Nombre corto de los espacios (al desplegar S23):** *Reparar hojas* añade la columna `Nombre_Corto` a `Catálogo_Espacios`; rellénala con `Exterior` (Piscina / Jardín) e `Interior` (Habitación Interior). Vacía, la tabla del Inicio muestra el nombre completo.

## Día a día

- Tras cambiar un `.gs` o un HTML en VS Code: `npm run push` (o, en emergencia, vuelve a pegar ese fichero en el editor).
- Prueba en la URL **`/dev`** (`Implementar → Probar implementaciones`), que usa el último código guardado; recárgala tras pegar.
- **Ojo (B-28, 2026-10-03):** copia la URL de pruebas de *Implementar → Probar implementaciones* (implementación `@HEAD`). Añadir `/dev` a la URL de producción **no** sirve: con ese identificador se sigue viendo la versión implementada.
- Crea una **nueva versión de implementación** solo cuando quieras publicar a los usuarios (`npm run deploy -- "…"` o `Gestionar implementaciones → Editar → Nueva versión`). La URL de producción no cambia.
- Tras publicar, haz el **smoke test** (abajo). Claude lo recuerda en cada publicación.

## Despliegue de DD-03 (Reservas: navegación, listado, ficha y funciones; 2026-10-03)

Pasos, en este orden, al publicar la versión con S31–S34:

1. `npm run push` (con OK del usuario) y probar en `/dev`.
2. Sheet → **KAF Rent → Inicializar / reparar hojas**: añade a `Reservas` las columnas `Contrato_Firmado_Por`, `Contrato_Fecha`, `Aviso_Checkin_Enviado`, `Aviso_Checkout_Enviado`; a `Reserva_Servicios`, `Cobro_Estado` y `Cobro_Forma`; y a `Config`, `Dias_Aviso_Ingreso`, `Horas_Aviso_Checkin` y `Anios_Retencion_Contrato`. **Sin este paso la app falla al leer las reservas** ("Falta la columna…"). En `Config`, cambia a mano `Tamano_Max_Contrato_MB` de 5 a **15** (DI-10; *Reparar hojas* no cambia valores existentes).
3. Editor → ejecutar **`instalarTriggers`**: añade `avisosDeCobro` (9:00 diario) y `avisosDeChecklist` (cada 15 min).
4. Editor → ejecutar **`ponerAlDiaReservas`** (F-45; **obligatorio antes de implementar**, DI-03) y revisar su resultado: reservas cambiadas, códigos del canal asignados y filas del Form para revisar a mano. Hacerlo **antes** de que pase el primer `avisosDeCobro`, para no avisar de reservas antiguas ya cobradas que constan como "No ingresado" (ver DI-08).
5. Publicar (`npm run deploy`) y hacer el smoke (abajo, apartado DD-03).

## Despliegue de DD-04 S36 (Cerrar días y Estadísticas por canal; 2026-10-03)

1. `npm run push` (con OK del usuario) y probar en `/dev`.
2. Sheet → **KAF Rent → Inicializar / reparar hojas**: crea la hoja `Dias_Cerrados` y añade a `Config` `Exterior_Hora_Apertura` (09:00) y `Exterior_Hora_Cierre` (02:00). **Sin este paso fallan Cerrar días, Estadísticas, el informe mensual y Crear Reserva** ("Falta la hoja…").
3. Cerrar en la app la temporada baja de Exterior (p. ej. del 1/10 al 30/04, motivo "Fuera de temporada") y los días ya bloqueados en las plataformas.
4. `Estadisticas_Cache` deja de usarse: se puede ocultar; no se borra (solo cambios aditivos).
5. Publicar (`npm run deploy`) y comprobar en el smoke: cerrar y quitar un día (aparece y desaparece en Calendar), que Crear Reserva rechaza ese día y que Estadísticas carga en los dos espacios.

## Demo local para validar la interfaz

`npm run demo` arranca la app real con datos inventados (sin Google) en `http://localhost:4180/demo`: panel para entrar como Admin o como Gestión, abrir los enlaces de los emails, lanzar los avisos y la puesta al día y ver los emails que se envían. Para verla como en el móvil: F12 → modo dispositivo (360–393 px). `Ctrl+C` la para. Es el mismo servidor de los E2E (`tests/e2e/servidor.js`, modo `DEMO=1`); nada se despliega.

## Smoke test tras publicar (T-06)

Lo que solo se puede comprobar en Google real. Unos 15 minutos; marca cada punto y apunta lo que falle en `Errores` o en PROXIMOS_PASOS.

**Antes de publicar**
- [ ] `npm run push` en verde (tests + lint) y la CI del último commit en verde.
- [ ] Si la versión trae pasos de despliegue (puesta en marcha, pasos 13 en adelante), hechos en este orden: *Reparar hojas* → datos del Sheet → publicar.

**Implementación**
- [ ] *Gestionar implementaciones*: "Ejecutar como" = **usuario que accede** y acceso = **cualquier usuario con cuenta de Google** (ADR-0017).
- [ ] La versión publicada es la nueva (número y descripción).

**Acceso (las tres cuentas en su móvil)**
- [ ] Cada cuenta autorizada entra y ve su email en la cabecera.
- [ ] Una cuenta no autorizada ve "Acceso denegado".

**Reservas**
- [ ] Con **cada** cuenta: crear una reserva de prueba de Habitación (horas prerrellenas) → aviso de éxito, evento en el calendario operativo a la hora correcta, invitación y emails recibidos.
- [ ] Crear una de Piscina/Jardín con horas → evento con su color.
- [ ] Gestionar: editar un campo (queda en el historial) y cancelar (aviso de reabrir canales; el evento desaparece).

**Checklists y archivos**
- [ ] Marcar un punto del check-in, guardar y volver a abrir: sigue marcado.
- [ ] Subir un vídeo corto y una foto de desperfectos: llegan a su carpeta de Drive.

**Emails, mensaje al huésped e interfaz (S23, S28)**
- [ ] El email de una reserva nueva llega con la plantilla nueva (logo, botones) y el botón **Abrir la reserva en KAF Rent** abre la URL de **producción** (`/exec`), no la de pruebas (`/dev`); si abre `/dev`, apúntalo (la URL sale de `ScriptApp.getService().getUrl()`).
- [ ] En una reserva de Habitación, **Mensaje para el huésped** abre WhatsApp con el texto y el enlace del Form con el código puesto (o lo copia si no hay teléfono).
- [ ] La ventana de "trabajando" aparece al abrir una reserva y se va sola; la barra inferior abre el segundo piso de Reservas.

**Reservas DD-03 (S31–S34)**
- [ ] Inicio: el selector cambia entre "5 próximas" y "5 últimas registradas".
- [ ] "Ver calendario" en cada móvil Android abre la app de Google Calendar y Atrás vuelve a KAF Rent (R-25).
- [ ] Gestionar: tarjetas sin scroll lateral, filtros al momento, paginación; la barra cambia a la de Reservas e "Inicio" vuelve.
- [ ] Ficha: Modificar → cambiar algo → "← Volver" pregunta Guardar / Descartar.
- [ ] Contrato: subir una foto desde el móvil a una reserva de Exterior → carpeta `Contrato` en Drive y "Firmado" a tu nombre.
- [ ] Admin (solo rol Admin): Checklists y Conexión SES.
- [ ] Al día siguiente: comprobar en `Logs`/`Errores` y en el correo que `avisosDeCobro` y `avisosDeChecklist` funcionan, y que el botón del email abre `/exec` con la confirmación.

**Cierre**
- [ ] Borrar del Sheet las reservas de prueba (y sus eventos) o cancelarlas.
- [ ] Hoja `Errores` sin entradas nuevas inesperadas.

## Tests

Requisito: Node ≥ 22. Para los E2E, una vez: `npm ci` y `npx playwright install --with-deps chromium` (el `--with-deps` instala librerías del sistema y pide `sudo`).

```bash
npm test                 # dominio + endpoints + contrastes (con dobles en memoria de Sheets, Drive, Calendar, Mail…)
npm run test:cobertura   # igual, con informe de cobertura por fichero .gs
npm run test:e2e         # interfaz en Chromium, escritorio y móvil (393 px), contra tests/e2e/servidor.js
npm run lint             # ESLint sobre los .gs (T-07): var, const, ==, variables sin usar o sin declarar, getValue/setValue en bucles, IDs de Google
```

- Los tests cargan los `.gs` de `docs_dev/src/` como lo hace Apps Script (un único ámbito global) y simulan los servicios de Google (`tests/soporte/`). Nada de `tests/` ni `package.json` se sube a Apps Script (clasp solo sube `docs_dev/src`).
- GitHub Actions (`.github/workflows/ci.yml`) lanza la batería en cada push, sin credenciales.
- Los E2E arrancan solos `tests/e2e/servidor.js`: sirve las plantillas reales (resolviendo `include`) y responde a `google.script.run` ejecutando el código real del servidor sobre los dobles. Las rutas `/__test/*` solo existen ahí para preparar escenarios.
- **ESLint** (`eslint.config.js`) trata los `.gs` como Apps Script: un único ámbito global, así que lo que declara un fichero es global en los demás. No analiza el JavaScript de los `.html`. La CI lo lanza antes de los tests.
- Pendiente (PROXIMOS_PASOS): integración contra un Sheet de pruebas (T-04). Estrategia completa en [CLAUDE.md §7](../CLAUDE.md).

> `.gitignore` excluye `.clasp.json` (local, con el `scriptId`; se versiona `.clasp.json.example`), `.clasprc.json` y `node_modules/`.
