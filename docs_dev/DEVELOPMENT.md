# Desarrollo y despliegue — KAF Rent

El código de la app vive en [`docs_dev/src/`](src/) (Google Apps Script). Se edita en VS Code, se versiona con Git y se sincroniza con Google mediante **clasp** con las credenciales locales de la cuenta operativa ([ADR-0015](solution/adr/0015-despliegue-con-clasp-multicuenta.md)). **Estado:** en uso desde la publicación de la v2 (2026-09-27, implementación v37). Copia/pega solo en emergencia.

## clasp (flujo normal, una vez configurado)

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
├── api_reservas.gs                 API: crear reserva, últimas reservas, buscador
├── api_gestion.gs                  API: lista, ficha, edición auditada, servicios, cancelación, historial
├── api_documentos.gs               API: contrato y vídeos a Drive
├── api_estadisticas.gs             API: estadísticas (y su recálculo) y enlace al calendario
├── api_gastos.gs                   API: gastos y resumen fiscal
├── api_sistema.gs                  API: triggers, menú del Sheet y utilidades de editor (protegidas)
│
├── dominio_reservas.gs             DOMINIO (puro): validaciones, importes, solapamiento, IDs, ciclo de vida
├── dominio_informes.gs             DOMINIO (puro): agregados de estadísticas e informes
├── dominio_fiscal.gs               DOMINIO (puro): gastos, amortización, resumen a tercios
│
├── infra_esquema.gs                INFRA: hojas y campos (fuente única), semillas
├── infra_comun.gs                  INFRA: tablas por campo, fechas, formato, escape HTML, logs
├── infra_config.gs                 INFRA: hoja Config
├── infra_catalogo.gs               INFRA: catálogos
├── infra_repositorio_reservas.gs   INFRA: Reservas, líneas de servicio, historial
├── infra_repositorio_gastos.gs     INFRA: Gastos y Resumen_Fiscal
├── infra_repositorio_informes.gs   INFRA: Estadisticas_Cache e Historico_Informes
├── infra_drive.gs                  INFRA: carpetas y archivos en Drive
├── infra_calendario.gs             INFRA: eventos de Calendar
├── infra_correo.gs                 INFRA: emails (avisos, confirmación, informes)
├── infra_mantenimiento.gs          INFRA: copias, purgas, poda de vídeos
│
├── index.html                      PRESENTACIÓN: shell de la app
├── estilos.html                    PRESENTACIÓN: tokens del sistema de diseño (ADR-0011)
├── cliente.html                    PRESENTACIÓN: navegación, Crear Reserva, Inicio, Buscar
├── gestion_interfaz.html           PRESENTACIÓN: Gestionar Reserva, Estadísticas, calendario
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
- Crea una **nueva versión de implementación** solo cuando quieras publicar a los usuarios (`npm run deploy -- "…"` o `Gestionar implementaciones → Editar → Nueva versión`). La URL de producción no cambia.
- Tras publicar, haz el **smoke test** (abajo). Claude lo recuerda en cada publicación.

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
