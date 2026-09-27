# Desarrollo y despliegue — KAF Rent

El código de la app vive en [`docs_dev/src/`](src/) (Google Apps Script). Se edita en VS Code, se versiona con Git y se sincroniza con Google mediante **clasp** con las credenciales locales de la cuenta operativa ([ADR-0015](solution/adr/0015-despliegue-con-clasp-multicuenta.md)). **Estado:** en implantación. Hasta completar ACC-02 y T-08 ([PROXIMOS_PASOS.md](../docs_work/PROXIMOS_PASOS.md)), se sigue copiando y pegando (ver "Emergencia").

## clasp (flujo normal, una vez configurado)

**Una vez por equipo** (sirve para todos tus proyectos):
1. Activa la *Google Apps Script API* en <https://script.google.com/home/usersettings> con cada cuenta.
2. `npm install -g @google/clasp`
3. `clasp login --user operacion` (con `operaciontangai@gmail.com`) y `clasp login --user fcsainz` (con `fcsainz@gmail.com`). Las credenciales quedan en `~/.clasprc.json`: **nunca** se copian al repositorio ni a GitHub.

**Una vez por proyecto:** copia `.clasp.json.example` como `.clasp.json` (no se versiona) y pon el `scriptId` (editor → Configuración del proyecto → ID de secuencia de comandos). **Antes del primer `push`:** `clasp --user operacion pull` en una carpeta temporal y compara con `docs_dev/src/`, porque `push` **sustituye** todo el código remoto.

**Día a día:**
```bash
clasp --user operacion push            # sube docs_dev/src/ al proyecto (sustituye lo remoto)
clasp --user operacion deploy -i <ID_IMPLEMENTACION> -d "v2.x ..."   # publica en la URL de producción
```
Con clasp **no se edita en el editor web**: lo que se cambie allí se pierde en el siguiente `push`.

## Emergencia: copia/pega manual

Si clasp no está disponible, se pega cada fichero de `docs_dev/src/` en el editor de Apps Script como en la v1 (pasos 3–4 de la puesta en marcha).

Arquitectura, modelo de datos y claves de `Config`: [docs_dev/solution/arc42.md](solution/arc42.md). Reglas de trabajo, estándares y tests: [CLAUDE.md](../CLAUDE.md).

## Estructura del código

```
docs_dev/src/                       Capa (ver CLAUDE.md §3.3 y arc42 §5.2)
├── appsscript.json                 Manifiesto: Europe/Madrid, V8, Web App (USER_DEPLOYING, ANYONE)
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
5. **Inicializar las hojas:** en el Sheet, menú **KAF Rent → Inicializar / reparar hojas** (o ejecuta `inicializarBaseDeDatos` desde el editor). Crea todas las hojas con sus cabeceras y siembra `Config`, `Catálogo_Espacios` y `Catálogo_Categorias_Gasto`. Es idempotente y **seguro con datos reales** (desde v2, B-16): en las hojas existentes solo añade al final las columnas que falten, sin renombrar ni mover las demás. Úsalo **tras cada despliegue** que cambie el esquema. Puedes mover columnas o añadir las tuyas; lo que no debes hacer es **renombrar una cabecera** del esquema: la app daría un error claro y "reparar" añadiría una columna nueva vacía con el nombre correcto.
6. **Rellenar `Config`:** como mínimo `Emails_Notificacion` (los tres, separados por comas), `Carpeta_Videos_Id`, `Carpeta_Documentos_Id`, `Carpeta_Backups_Id`, `Calendar_Id` (vacío = calendario por defecto) y `Calendar_Url`. Lista completa en [arc42 §8.7](solution/arc42.md#87-configuración-config). (`Carpeta_Raiz_Id` es solo de referencia.)
7. **Catálogos:** rellena `Catálogo_Canales` y `Catálogo_Servicios_Extra` (y revisa `Catálogo_Espacios`).
8. **Usuarios:** en `Usuarios_Autorizados`, añade las tres cuentas personales (Email, Activo = `Sí`).
9. **Compartir (opcional, recomendado):** comparte el Sheet, la carpeta de Drive y el Calendar con las tres cuentas personales. **La Web App no lo necesita** (se ejecuta como la cuenta operativa), pero así cada persona puede consultarlos directamente en Drive, Sheets o Calendar.
10. **Desplegar la Web App:** `Implementar → Nueva implementación → Aplicación web`:
    - **"Ejecutar como" → Yo** (`operaciontangai@gmail.com`, equivale a `USER_DEPLOYING`). El valor del diálogo **manda sobre** `appsscript.json`: compruébalo siempre.
    - **"Quién tiene acceso" → Cualquier usuario con cuenta de Google.**
    - Comparte la URL con los tres.
11. **Triggers:** ejecuta **una vez** `instalarTriggers` desde el editor (crea `tareasNocturnas` diario a las 03:00 e `informesProgramados` el día 1 a las 07:00). Acepta los permisos que pida.
12. **Calendario existente:** si ya había reservas, ejecuta una vez `sincronizarReservasCalendario` desde el editor para crear los eventos que falten.

## Día a día

- Tras cambiar un `.gs` o un HTML en VS Code: `clasp --user operacion push` (o, en emergencia, vuelve a pegar ese fichero en el editor).
- Prueba en la URL **`/dev`** (`Implementar → Probar implementaciones`), que usa el último código guardado; recárgala tras pegar.
- Crea una **nueva versión de implementación** solo cuando quieras publicar a los usuarios (`Gestionar implementaciones → Editar → Nueva versión`). La URL de producción no cambia.
- Tras publicar, haz el **smoke test** (checklist pendiente de redactar, tarea T-06 en [PROXIMOS_PASOS.md](../docs_work/PROXIMOS_PASOS.md)). Como mínimo: una cuenta autorizada entra y una no autorizada ve "Acceso denegado"; crear, editar y cancelar una reserva de prueba (Calendar y emails incluidos) y borrarla después.

## Tests

Requisito: Node ≥ 22. Para los E2E, una vez: `npm ci` y `npx playwright install --with-deps chromium` (el `--with-deps` instala librerías del sistema y pide `sudo`).

```bash
npm test                 # dominio + endpoints + contrastes (con dobles en memoria de Sheets, Drive, Calendar, Mail…)
npm run test:cobertura   # igual, con informe de cobertura por fichero .gs
npm run test:e2e         # interfaz en Chromium, escritorio y móvil (393 px), contra tests/e2e/servidor.js
```

- Los tests cargan los `.gs` de `docs_dev/src/` como lo hace Apps Script (un único ámbito global) y simulan los servicios de Google (`tests/soporte/`). Nada de `tests/` ni `package.json` se sube a Apps Script (clasp solo sube `docs_dev/src`).
- GitHub Actions (`.github/workflows/ci.yml`) lanza la batería en cada push, sin credenciales.
- Los E2E arrancan solos `tests/e2e/servidor.js`: sirve las plantillas reales (resolviendo `include`) y responde a `google.script.run` ejecutando el código real del servidor sobre los dobles. Las rutas `/__test/*` solo existen ahí para preparar escenarios.
- Pendientes (PROXIMOS_PASOS): integración contra un Sheet de pruebas (T-04) y ESLint (T-07). Estrategia completa en [CLAUDE.md §7](../CLAUDE.md).

> `.gitignore` excluye `.clasp.json` (local, con el `scriptId`; se versiona `.clasp.json.example`), `.clasprc.json` y `node_modules/`.
