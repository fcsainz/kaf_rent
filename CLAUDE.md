# CLAUDE.md — KAF Rent

Reglas de trabajo, estándares y convenciones del proyecto. **Claude las sigue en todas las interacciones con este repositorio.** Si una regla choca con una petición concreta del usuario, se señala el conflicto y se pide instrucción; no se elige por él.

**Índice:** §0 Arranque de sesión · §1 Proyecto y mapa · §2 Colaboración con Claude (decisiones, commits, revisiones, próximos pasos) · §3 Principios de diseño · §4 Estándar de código · §5 Documentación y trazabilidad · §6 UX/UI · §7 Tests · §8 Definition of Ready / Done

---

## 0. Arranque de cada sesión (obligatorio)

Al retomar el trabajo, **antes de nada**, Claude:

1. Lee [PROXIMOS_PASOS.md](PROXIMOS_PASOS.md).
2. Muestra al usuario:
   - **§0 Decisiones pendientes del usuario** (si las hay), primero.
   - La **tabla de sprints pendientes**: nº, objetivo, resumen corto de su contenido, estimación en horas y estado.
3. Señala cualquier cosa del repo que contradiga ese documento (cambios sin commitear, ficheros nuevos…).
4. Espera a que el usuario elija qué se hace. No empieza trabajo por su cuenta.

---

## 1. Proyecto y mapa del repositorio

**KAF Rent** — webapp de gestión de alquileres (Piscina/Jardín y Habitación Interior de Calle 16) sobre **Google Apps Script + Sheets + Drive + Calendar + Gmail**, con **coste cero**.  
**Equipo:** un copropietario desarrollador (único mantenedor) y dos copropietarios no técnicos (la referencia de usabilidad).

```
.
├── CLAUDE.md               # Este documento: reglas de trabajo y estándares
├── PROXIMOS_PASOS.md       # Decisiones pendientes, sprints, backlog e histórico (se regenera cada sesión)
├── CHANGELOG.md            # Keep a Changelog + SemVer
├── .clasp.json.example     # Plantilla de configuración de clasp (ADR-0015)
├── package.json            # Solo herramientas de desarrollo (npm test); nada se despliega
├── .github/workflows/      # CI gratuita: tests en cada push
├── tests/                  # Tests: soporte/ (cargador vm + dobles de Google), dominio/, endpoints/
├── docs_dev/               # Desarrollo del producto: código y su documentación
│   ├── src/                # Código Apps Script (.gs + HTML Service); rootDir de clasp
│   ├── DEVELOPMENT.md      # Puesta en marcha, clasp, despliegue y día a día
│   ├── discovery/          # QUÉ y POR QUÉ: problema+JTBD, HU, RF, RNF (trazabilidad ↑/↓ en cada uno)
│   └── solution/           # CÓMO: arc42.md, adr/ (MADR), design-system.md
└── docs_work/
    ├── docs_ses/           # Apoyo técnico: SES.Hospedajes
    ├── doc_hacienda/       # Apoyo técnico: IRPF y gastos deducibles
    ├── doc_check/          # Apoyo técnico: checklists físicas de check-in/check-out (Piscina/Jardín)
    └── (resto del propósito de docs_work por definir, ver PROXIMOS_PASOS D-11)
```

---

## 2. Reglas de colaboración con Claude

### 2.1 Ninguna decisión sin explicarla y sin OK del usuario

Claude **no toma decisiones por su cuenta**. Cuando algo admite más de una opción razonable, lo explica y **espera un OK explícito** ("ok", "adelante", "opción B"…). El silencio o un "vale" a otra cosa no cuentan como aprobación, y la aprobación de una decisión no se extiende a otras.

**Qué es una decisión (requiere OK):**
- Arquitectura, patrones, estructura de ficheros o capas.
- Añadir, quitar o cambiar dependencias, herramientas o servicios.
- Cambios en el modelo de datos (hojas, columnas, IDs), en reglas de negocio o en el comportamiento visible.
- Alcance, prioridades, renombrados, borrados o movimientos de ficheros.
- Crear o cambiar un ADR, una regla de este documento o el formato de un documento.
- Cualquier refactorización.

**Qué NO es una decisión (se hace sin preguntar, informando después):**
- Corregir erratas, enlaces rotos o documentación que no refleja lo implementado.
- Aplicar una regla ya aprobada en este documento.
- Corregir un defecto cuando el comportamiento correcto ya está fijado sin ambigüedad en una HU, un RF o un ADR aprobados. Si hay ambigüedad, es decisión.

**Cómo se presenta una decisión** (de lo más sencillo a lo más técnico):

```markdown
### D-NN — {Título}
**Qué hay que decidir (en llano):** una o dos frases sin jerga.
**Por qué ahora:** qué lo provoca y qué bloquea.

| | Opción A (recomendada) | Opción B | … |
|---|---|---|---|
| En llano | qué supone para el usuario | … | |
| Técnico | qué cambia en el código o la documentación | … | |
| Pros | … | … | |
| Contras / riesgos | … | … | |
| Esfuerzo | horas estimadas | … | |
| Reversibilidad | fácil / costosa / irreversible | … | |

**Recomendación:** opción y motivo.
**Si no se decide:** qué queda bloqueado.
```

Las decisiones que no se resuelven en la sesión se anotan en **PROXIMOS_PASOS §0**. Las aprobadas que sean de arquitectura se registran como ADR (§5.5).

### 2.2 Commits: solo al final de la sesión y los hace el usuario

- **Claude nunca hace `git commit` ni `git push`.** Puede usar `git mv` / `git rm` para reorganizar si el usuario lo aprueba, pero el commit es siempre del usuario.
- **Cierre de sesión**, siempre en este orden:
  1. El usuario pide la **revisión de cierre**.
  2. Claude ejecuta la **Revisión 1** y la **Revisión 2** (§2.3) sobre **todo el repositorio**, no solo sobre lo tocado.
  3. Claude **corrige** lo que no dependa de una decisión del usuario (§2.1) y lo informa.
  4. Claude **muestra en el chat el informe de las dos revisiones** (formato abajo), con todos los hallazgos, corregidos o no. El informe es obligatorio: sin él no hay propuesta de commit.
  5. Lo que dependa de una decisión se anota **en la primera sección (§0) de PROXIMOS_PASOS.md**, con el formato de §2.1.
  6. Claude **regenera PROXIMOS_PASOS.md** (§2.4) y actualiza `CHANGELOG.md` → `[Unreleased]`.
  7. Claude **propone un mensaje de commit corto**: una línea de ≤ 72 caracteres con la convención del histórico (`vX.Y Resumen en imperativo`) y, si hace falta, 2–4 viñetas de cuerpo.
  8. El usuario revisa y hace el commit.

### 2.3 Doble revisión de cierre

**Informe en el chat** (paso 4): para cada revisión, (1) qué se ha comprobado y cómo (comprobaciones automáticas y manuales), (2) una tabla `# | Severidad (Crítica/Alta/Media/Baja) | Tipo | Ubicación (fichero:línea) | Hallazgo | Acción (corregido / decisión D-NN / backlog B-NN)` y (3) un resumen con el recuento por severidad y por acción. Al final, el resultado de los tests (`npm test`) tal cual, sin maquillar.

**Revisión 1 — Coherencia, huecos y relaciones**
- Cada documento refleja el estado real del código: DEVELOPMENT, arc42 (modelo de datos, `Config`, módulos), ADR y estados de HU, RF y RNF.
- Trazabilidad completa (§5.4): ningún P sin HU, HU sin RF, RF sin origen ni justificación, o RNF sin origen ni justificación. IDs únicos y referencias cruzadas válidas.
- Enlaces internos rotos, secciones citadas que no existen (p. ej. "CLAUDE.md §X").
- Cuestiones abiertas de los ADR reflejadas en PROXIMOS_PASOS; riesgos nuevos en arc42 §11.
- Coherencia técnica entre ficheros: constantes `COL_*` y `ESQUEMA_HOJAS`, claves de `Config` usadas frente a sembradas, endpoints llamados desde el cliente frente a los existentes, nombres de HTML frente a los `include`.
- Lo que falta: requisitos implícitos sin documentar, casos límite sin HU, decisiones tomadas en el código sin ADR.

**Revisión 2 — Semántica y código**
- Principios (§3) y estándar de código (§4): SRP, DRY, KISS, YAGNI, niveles de abstracción, nombres, números mágicos, código muerto, comentarios obsoletos.
- Corrección: bugs, casos límite (vacíos, `null`, fechas, zonas horarias, concurrencia), coherencia entre cliente y servidor.
- Seguridad: autorización en toda función expuesta (sufijo `_` en las internas), validación en servidor, escape de HTML (XSS), secretos o IDs en el código.
- Fiabilidad: errores registrados, sin fallos silenciosos, atomicidad, locks.
- Rendimiento: llamadas a Sheets, Drive o Calendar dentro de bucles.
- UX/UI (§6) y accesibilidad.
- Tests: se ejecutan (`npm test` cuando exista) y cubren lo tocado; se informa del resultado real, sin maquillarlo.

### 2.4 PROXIMOS_PASOS.md: sprints autogenerados

**Framework:** Scrum adaptado a un desarrollador único: **sprints por objetivo, sin duración fija** (se trabajan en ratos libres y se cierran cuando se cumple su objetivo), *product backlog* priorizado y estimación en tallas convertidas a horas (XS ≤ 1 h · S ≈ 2 h · M ≈ 4–6 h · L ≈ 8–16 h · XL: dividir).

**Estructura fija del documento:**
- §0 Decisiones pendientes del usuario (siempre la primera).
- §1 Tabla de sprints pendientes: sprint, objetivo, contenido resumido, estimación y estado.
- §2 Backlog completo con IDs.
- §3 Histórico de sprints completados.
- §4 Cómo se regenera.

**Regeneración al final de cada sesión**, a partir de estas fuentes (sin inventar tareas):
1. Decisiones abiertas (§2.1).
2. HU, RF y RNF con estado distinto de ✅.
3. Defectos (`B-NN`) y deuda técnica (`REF-NN`, `TD-NN`) de la revisión y de arc42 §11.2.
4. "Cuestiones abiertas" de cada ADR.
5. Riesgos abiertos que requieran acción.
6. Tareas externas (`EXT-NN`: gestor, legal…).

**Orden de prioridad para agrupar en sprints:** (1) seguridad y pérdida de datos → (2) defectos de requisitos Must → (3) habilitadores de calidad (tests, CI) → (4) Must/Should pendientes → (5) deuda técnica → (6) Could → (7) fases futuras. Cada sprint tiene un objetivo único y un tamaño manejable (orientativo ≤ 20 h).

### 2.5 Reglas generales

- Antes de crear un fichero, comprobar si ya existe uno donde encaje. Preferir editar a crear.
- No añadir funcionalidades ni refactorizaciones no pedidas (y, si se ven necesarias, proponerlas como decisión, §2.1).
- Informar con fidelidad: si algo falla o no se ha verificado, se dice.
- Idioma: español en documentación, UI, commits y nombres de dominio.
- Riesgo nuevo detectado → arc42 §11.1. Decisión de diseño que cambia → ADR (§5.5) **antes** de seguir.

---

## 3. Principios de diseño

Referencias: *Clean Code* y *Clean Architecture* (R. C. Martin), *The Pragmatic Programmer* (Hunt & Thomas).

### 3.1 SOLID, adaptado a Apps Script (JavaScript funcional, sin clases)

| Principio | Cómo se aplica aquí |
|---|---|
| **S** — Responsabilidad única | Una función = una razón para cambiar. Un fichero `.gs` = un módulo de negocio. Validar, calcular, persistir y notificar son funciones distintas. |
| **O** — Abierto/cerrado | Ampliar por datos, no por código: espacios, canales y servicios nuevos son filas de catálogo, no `if` nuevos. Las tablas de dominio (p. ej. colores por espacio) se leen de configuración. |
| **L** — Sustitución de Liskov | Los dobles de test (Sheets, Drive, Calendar falsos) cumplen el mismo contrato que el servicio real; si no, el test no vale. |
| **I** — Segregación de interfaces | Los endpoints devuelven proyecciones mínimas por pantalla (`mapearReservaListado`, `mapearReservaGestion`), no la fila entera. |
| **D** — Inversión de dependencias | El dominio no llama a `SpreadsheetApp`, `DriveApp`… Recibe datos o funciones como parámetros; solo los adaptadores tocan servicios de Google (§3.3). |

### 3.2 KISS · DRY · YAGNI · otros

| Principio | Regla |
|---|---|
| **KISS** | La solución más simple que cumple el requisito. Nada de capas o abstracciones "por si acaso". |
| **DRY** | Una regla de negocio vive en un solo sitio. Dos repeticiones → valorar extraer; tres → obligatorio. También aplica al conocimiento en documentos: se enlaza, no se copia. |
| **YAGNI** | Solo lo que pide una HU, un RF o un RNF actual. |
| **Guard clauses / fail fast** | Errores primero y retorno temprano; la lógica principal, sin anidar. |
| **Sin efectos ocultos** | El nombre revela los efectos (`guardar…`, `enviar…`, `registrar…`); las funciones `calcular…`, `validar…` y `es…` son puras. |
| **Inmutabilidad** | No mutar parámetros; devolver valores nuevos (`slice()`, spread). |
| **Sin magia** | Todo literal con significado de negocio es una constante con nombre. |
| **Ley de Demeter** | Pedir lo que se necesita, no navegar cadenas de objetos ajenos. |

### 3.3 Clean Architecture ligera (implantada en v2)

Una Clean Architecture completa (entidades, casos de uso, puertos, adaptadores, inyección de dependencias) sería desproporcionada en Apps Script e iría contra KISS y YAGNI. Se aplica una versión de **tres capas** con dependencias hacia dentro:

| Capa (prefijo de fichero) | Contiene | Puede usar | Nunca |
|---|---|---|---|
| **API** (`api_*.gs`) | Endpoints de `google.script.run` y entradas del sistema (triggers, menú, editor), siempre a través de `ejecutarEndpoint_` / `ejecutarTareaDelSistema_` | Dominio e infraestructura | Reglas de negocio |
| **Dominio** (`dominio_*.gs`) | Funciones **puras**: validaciones, importes, estado, solapamiento, IDs, agregados, fiscalidad | Otras funciones de dominio y utilidades puras (fechas, `texto_`, `numero_`) | Servicios de Google, `new Date()` implícito (la fecha "ahora" se pasa como parámetro) |
| **Infraestructura** (`infra_*.gs`) | Esquema, repositorios (Sheets por campo) y adaptadores (Drive, Calendar, Mail, Config), utilidades comunes | Servicios de Google | Reglas de negocio |
| **Presentación** (`*.html`) | Interfaz: plantillas y JS de cliente | Solo los endpoints | Reglas autoritativas (el servidor revalida) |

- **La capa se ve en el nombre del fichero** (`api_`, `dominio_`, `infra_`) **y en su primera línea** (`// Capa: DOMINIO — …`). Un fichero pertenece a una sola capa.
- **Sin dependencias entre ficheros al cargar:** Apps Script no garantiza el orden de carga; ninguna constante de nivel superior puede usar otra de otro fichero (un test carga los ficheros en orden inverso).
- Mapa completo de ficheros: [arc42 §5.2](docs_dev/solution/arc42.md#52-nivel-2--capas-y-ficheros-del-servidor-clean-architecture-ligera).

### 3.4 Código limpio, claro, robusto y eficiente — resumen

| | Regla de oro |
|---|---|
| Limpio | Nombres que revelan la intención; sin código muerto ni bloques comentados |
| Claro | Un nivel de abstracción por función; orden: validar → calcular → efecto → retorno |
| Robusto | Casos límite explícitos (vacío, `null`, hoja inexistente); nunca un `catch` vacío salvo en el propio logger |
| Eficiente | Llamadas a la API de Google en bloque, nunca en bucles; `find` antes que `filter()[0]`; sin optimizar sin medir |

---

## 4. Estándar de código: JavaScript / Google Apps Script

Los `.gs` son **JavaScript moderno (V8, ES2019+)**.

### 4.1 Sintaxis
- `const` por defecto, `let` si se reasigna, **nunca `var`**.
- Arrow functions, template literals, destructuring, parámetros por defecto, `?.` y `??`.
- Punto y coma siempre; comillas simples salvo en template literals.

### 4.2 Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | `camelCase`, verbo en funciones | `obtenerReservas`, `calcularImportesReserva` |
| **Todo lo interno del servidor** (funciones y variables) | **sufijo `_`** (Apps Script no expone a `google.script.run` lo que termina en `_`) | `haySolapamiento_`, `cacheConfig_` |
| Constantes | `UPPER_SNAKE_CASE` | `HOJA_RESERVAS`, `ESTADO_RESERVA` |
| Ficheros `.gs` | `<capa>_<módulo>.gs` | `api_reservas.gs`, `dominio_reservas.gs`, `infra_drive.gs` |
| HTML que comparte nombre con un `.gs` | sufijo `_interfaz` | `gestion_interfaz.html` |
| Hojas | Nombre exacto, en constante de `infra_esquema.gs` | `HOJA_RESERVAS = 'Reservas'` |
| Columnas | Campo lógico del esquema, nunca un número de columna | `reserva.estado` ↔ `Estado_Reserva` (`CAMPOS_RESERVA`) |

### 4.3 Estructura de ficheros
Un fichero por capa y módulo (`<capa>_<módulo>.gs`), tal como describe [arc42 §5.2](docs_dev/solution/arc42.md#52-nivel-2--capas-y-ficheros-del-servidor-clean-architecture-ligera), que es la fuente de verdad de la lista de ficheros. Al añadir, renombrar o borrar un fichero con clasp basta `push`; con copia/pega hay que borrar también el fichero antiguo en el editor (dos definiciones de la misma constante rompen la app).

### 4.4 Acceso a Sheets y eficiencia
- Leer en bloque (`getValues()` del rango completo) y escribir en bloque (`setValues()`); nunca `getValue` o `setValue` dentro de bucles.
- Cachear `Spreadsheet` y `Config` dentro de una ejecución (`obtenerSpreadsheet_`, `leerConfig_`).
- Acceder siempre **por campo** con las utilidades de tabla de `infra_comun.gs` (`leerTabla_`, `anadirRegistro_`, `actualizarRegistro_`, `reescribirFilas_`), nunca por número de columna.
- `LockService.getScriptLock()` en toda escritura que pueda ser concurrente.
- Operaciones de reescritura **atómicas**: calcular todo en memoria y escribir en una sola operación; nunca `clearContents()` seguido de otra escritura que pueda fallar.

### 4.5 Funciones
- Responsabilidad única; ~30 líneas como máximo; si crece, dividir.
- Separar la lógica de negocio del acceso a datos (§3.3).

### 4.6 Manejo de errores
- `try/catch` en todo endpoint y en toda llamada a servicios de Google que pueda fallar.
- En el `catch`: `registrarError_(funcion, error, contexto)` (el contexto sin datos personales del huésped) y devolver `{ success: false, error: 'Mensaje para el usuario' }` (qué pasó y qué hacer).
- Integraciones secundarias (Calendar, Mail) capturan su propio error y **no** bloquean la operación principal.
- Nunca un `catch` vacío (excepción única: dentro de `registrarLog_`/`registrarError_`, con comentario).

### 4.7 Comunicación cliente-servidor y validación
- Respuesta siempre `{ success: boolean, data?: any, error?: string }`.
- Cliente: `.withSuccessHandler()` **y** `.withFailureHandler()` siempre; botón deshabilitado durante la llamada.
- Validación **en dos capas**: cliente (inmediatez) y servidor (autoritativa). Las funciones de validación devuelven `{ valido, error? }` y son puras.

### 4.8 Seguridad
- **Todo endpoint pasa por `ejecutarEndpoint_`** (autorización + errores + bloqueo opcional). Todo lo no pensado para el cliente lleva sufijo `_`. Las entradas que Google necesita públicas (triggers, menú, editor) pasan por `ejecutarTareaDelSistema_`. Un test impide que aparezcan funciones públicas nuevas sin estar en la lista permitida.
- Nada de emails, IDs de hoja, carpeta o calendario ni credenciales en el código: van en `Config`.
- Nunca confiar en datos del cliente: revalidar tipos, rangos, valores de dominio y existencia en catálogos.
- Escapar todo dato de usuario antes de insertarlo como HTML (`textContent` o una función de escape); nunca `innerHTML` con datos sin escapar.

### 4.9 Comentarios
- Por defecto, ninguno: el código bien nombrado se explica solo.
- Un comentario de una línea solo para el **porqué** no obvio (restricción de Apps Script, invariante, referencia a un ADR o RF).
- Los comentarios que hablan de comportamiento (p. ej. "USER_ACCESSING") se revisan en la Revisión 2; uno obsoleto es un defecto.
- En el código, las referencias a requisitos usan los IDs vigentes (`HU-NN`, `RF-NN`, `ADR-NNNN`).

---

## 5. Documentación y trazabilidad

### 5.1 Documentos y estándares

| Documento | Estándar |
|---|---|
| [01_problema.md](docs_dev/discovery/01_problema.md) | Lean UX Problem Statement + **JTBD** (*job stories*: "Cuando… quiero… para…") + Personas NN/g + Vision Board |
| [02_historias_usuario.md](docs_dev/discovery/02_historias_usuario.md) | INVEST, `Como/quiero/para`, **Gherkin**, **MoSCoW**, talla de camiseta, estado; épicas en el orden del *backbone* (Jeff Patton) |
| [03_requisitos_funcionales.md](docs_dev/discovery/03_requisitos_funcionales.md) | ISO/IEC/IEEE 29148: "El sistema debe…", verificable, con origen, ADR, implementación, test y estado |
| [04_requisitos_no_funcionales.md](docs_dev/discovery/04_requisitos_no_funcionales.md) | **ISO/IEC 25010:2023**, medible, con verificación, origen o justificación y estado |
| [arc42.md](docs_dev/solution/arc42.md) | **arc42** (12 secciones); §11 = riesgos (PMI/PMBOK) y deuda técnica |
| [adr/](docs_dev/solution/adr/README.md) | **MADR 4.0** |
| [design-system.md](docs_dev/solution/design-system.md) | Tokens de diseño |
| [CHANGELOG.md](CHANGELOG.md) | Keep a Changelog + SemVer |
| [PROXIMOS_PASOS.md](PROXIMOS_PASOS.md) | Scrum para un desarrollador único (§2.4) |

Cada documento de discovery lleva una cabecera con `Versión`, `Fecha`, `Estado` y `Framework`.

Además, `docs_work/docs_ses/`, `docs_work/doc_hacienda/` y `docs_work/doc_check/` guardan documentación de referencia externa (no sigue el estándar de discovery/solution, es material de apoyo técnico):
- [referencia-tecnica-ses-hospedajes.md](docs_work/docs_ses/referencia-tecnica-ses-hospedajes.md) resume el RD 933/2021 y el webservice SES.Hospedajes para cuando se aborde la Fase 2 (Registro de viajeros, [ADR-0007](docs_dev/solution/adr/0007-registro-de-viajeros-para-reservas-de-habitacion.md)).
- [referencia-tecnica-irpf-alquileres.md](docs_work/doc_hacienda/referencia-tecnica-irpf-alquileres.md) resume el marco legal del IRPF (gastos deducibles, amortización, prorrateo) para el módulo de Gastos ([ADR-0012](docs_dev/solution/adr/0012-modulo-gastos-irpf.md)).
- `docs_work/doc_check/` guarda las checklists físicas de check-in/check-out (hoy solo Piscina/Jardín) que sirven de base para digitalizarlas (F-14 en PROXIMOS_PASOS).

### 5.2 Identificadores (estables, nunca se reutilizan)

| Prefijo | Qué | Dónde |
|---|---|---|
| `P-NN` / `JTBD-NN` | Problema / Job To Be Done | 01_problema |
| `PER-NN` | Persona | 01_problema |
| `HU-NN` (antes `US-0NN`) | Historia de usuario | 02 |
| `E-NN` | Épica | 02 |
| `RF-NN` / `RNF-NN` | Requisito funcional / no funcional | 03 / 04 |
| `ADR-NNNN` | Decisión de arquitectura | adr/ |
| `R-NN` / `REF-NN`, `TD-NN` / `QS-NN` | Riesgo / deuda técnica / escenario de calidad | arc42 §10–§11 |
| `D-NN` / `B-NN` / `F-NN` / `T-NN` / `EXT-NN` | Decisión pendiente / defecto / funcionalidad / tarea de test / tarea externa | PROXIMOS_PASOS |

### 5.3 Reglas de trazabilidad
- **Cadena:** P → JTBD → HU → RF/RNF → ADR → código → test → sprint, navegable en ambos sentidos.
- **La trazabilidad vive en cada documento**, con flechas ↑ (hacia arriba) y ↓ (hacia abajo). No hay matriz aparte: cada documento es la fuente de sus propias relaciones, y las dos direcciones deben coincidir (HU ↔ RF, RF ↔ RNF):
  - **JTBD:** ↑ Problema · ↓ HU.
  - **HU:** ↑ Problema, JTBD · ↓ RF, RNF (unión de los de sus RF), Sprint.
  - **RF:** ↑ HU · ↓ RNF, Sprint (+ ADR, implementación y test).
  - **RNF:** ↑ Problema/HU · ↓ RF, Sprint.
- **Sin relación directa se anota, nunca se deja en blanco:** "**Sin HU directa**" + justificación; "**Sin RNF directo**"; "**Sin RF directo**" + cómo se cumple.
- Sprint: `Sn` donde se implementó → **`Sn`** en negrita donde se corrige o completa (PROXIMOS_PASOS).
- Todo RF indica `fichero · función` de implementación y, cuando exista, su test.
- Los tests nombran el RF que verifican (`describe('RF-29 · …')`).
- Un elemento sin enlace hacia arriba ni justificación es un defecto de documentación (Revisión 1).

### 5.4 Qué se actualiza y cuándo

| Cambio | Actualizar |
|---|---|
| Nueva necesidad o cambio de alcance | P/JTBD (si aplica) → HU → RF/RNF (con sus ↑/↓ en ambos extremos) → PROXIMOS_PASOS |
| Implementar o cambiar código | Estado y columna *Implementación* del RF; HU; arc42 (bloques, datos, `Config`) si cambia |
| Decisión de diseño | ADR nuevo o *Revisión* del existente → arc42 §4/§9 |
| Riesgo nuevo | arc42 §11.1 |
| Cierre de sesión | CHANGELOG `[Unreleased]` + PROXIMOS_PASOS (§2.2) |

### 5.5 ADR (MADR 4.0)
- Plantilla: [docs_dev/solution/adr/plantilla-madr.md](docs_dev/solution/adr/plantilla-madr.md). Front matter `status`, `date`, `decision-makers`, `consulted`, `informed`; secciones Contexto, Factores, Opciones, Resultado (Consecuencias, Confirmación), Pros y contras, Más información (trazabilidad y cuestiones abiertas).
- Claude crea un ADR como `proposed`; pasa a `accepted` solo con el OK del usuario (§2.1).
- No se reescribe la historia: una decisión sustituida pasa a `superseded by ADR-NNNN`.

### 5.6 arc42
Documento vivo del sistema. Se actualiza cuando cambia el modelo de datos, un módulo, un flujo, el despliegue, un concepto transversal, un riesgo o la deuda técnica.

---

## 6. Estándares de UX/UI

La referencia de usuario son **Ana y Luis** (no técnicos, móvil). Se apoyan en las heurísticas de Nielsen y en patrones de Material Design simplificados. **Tokens concretos:** [design-system.md](docs_dev/solution/design-system.md) (ADR-0011); aquí van los principios.

### 6.1 Principios
- **Claridad sobre densidad**; una tarea principal por pantalla (patrón hub + secciones, ADR-0008).
- **Mínimo esfuerzo**: cascadas y autocompletado en lugar de datos redundantes.
- **Guiar, no asumir**: el usuario sabe dónde está, qué puede hacer y cómo volver.
- **Prevenir errores**: deshabilitar lo no válido, validar al momento, no ofrecer opciones incompatibles.
- **Confirmación** en toda acción irreversible (modal).
- **Feedback inmediato** en cada acción.
- **Consistencia**: mismos componentes, etiquetas y colores para lo mismo.

### 6.2 Layout
Título → acción primaria → contenido → acciones secundarias. Una acción primaria destacada por pantalla. **Mobile-first**; nada que exija una pantalla ancha. Agrupar con espacio en blanco, no con cajas.

### 6.3 Componentes
- **Botones** con verbo del dominio ("Crear Reserva", "Guardar"); primario relleno y secundario con contorno; deshabilitado durante la llamada.
- **Tablas** con cabeceras claras, orden por columna cuando aporte, y estados de carga y vacío explícitos.
- **Formularios** con etiqueta visible, obligatorios marcados, validación en línea y en dos capas, y foco en el primer campo.
- **Estados vacíos accionables** (mensaje + acción).
- **Modales de confirmación** que explican la consecuencia y dejan claro cuál es la opción destructiva.

### 6.4 Sistema visual
Paleta semántica con roles; el color **nunca** es el único portador de significado. Una familia tipográfica por uso, cuerpo ≥ 16 px. Espaciado en escala. Estados `hover`, `focus` visible, `active` y `disabled`. Iconos siempre acompañados de texto.

### 6.5 Accesibilidad
WCAG 2.1 AA (contraste ≥ 4.5:1), áreas táctiles ≥ 44×44 px, etiquetas asociadas, navegación por teclado, foco visible, texto alternativo.

### 6.6 Feedback
Indicador de carga en operaciones lentas. Éxito y error siempre comunicados; errores accionables. Nunca un fallo silencioso.

### 6.7 Microcopy
Español claro y cercano, sin jerga ni nombres internos de hojas o campos. Errores: qué pasó y cómo solucionarlo en una frase. Etiquetas del dominio (Espacio, Reserva, Canal, Huésped).

### 6.8 Flujos
Entrada → acción → confirmación → retorno claro; siempre hay salida visible. No perder datos al navegar; avisar de cambios sin guardar. Los flujos se validan contra los journeys de [01_problema.md, Anexo A](docs_dev/discovery/01_problema.md).

---

## 7. Tests

**Objetivo:** que ningún cambio rompa en silencio lo que funcionaba (RNF-29, riesgo R-17), **sin coste** (RNF-33). Las herramientas de test son de desarrollo: **nunca se copian a Apps Script**.

> **Estado actual (v2):** unitarios del dominio, tests de los 20 endpoints y de las entradas del sistema, y CI en GitHub Actions **funcionando** (`npm test`, cobertura ≈ 98 % de líneas). Pendientes: E2E con Playwright, integración contra Google y ESLint (PROXIMOS_PASOS, S9/S11).

### 7.1 Pirámide y dónde se ejecuta cada nivel

| Nivel | Qué prueba | Herramienta (gratuita) | Dónde se ejecuta | Quién lo lanza |
|---|---|---|---|---|
| **Unitario y de endpoints** ✅ | Dominio puro; endpoints y entradas del sistema con dobles de Google | Node ≥ 22: `node:test` + `node:assert` (sin dependencias). Los `.gs` se cargan en un contexto `vm` con dobles de `SpreadsheetApp`, `DriveApp`, `CalendarApp`, `MailApp`, `LockService`, `Session`, `Utilities` | Local (**Claude puede lanzarlos**) y **GitHub Actions** en cada push | Claude / CI |
| **Integración** | Adaptadores reales: lectura y escritura en Sheets, Drive, Calendar y Mail | Suite propia en Apps Script (`pruebas_integracion.gs`) sobre un **Sheet de pruebas** separado con su propio proyecto de script | Editor de Apps Script del proyecto de pruebas | Usuario (Claude la prepara y lee el resultado que se le pegue) |
| **E2E (interfaz)** | Flujos completos del cliente: navegación, formularios, validaciones, cascadas, modales, XSS, viewport móvil | **Playwright** + servidor local que resuelve los `include` y simula `google.script.run` con datos de prueba | Local (**Claude puede lanzarlos**) y GitHub Actions | Claude / CI |
| **Smoke en producción** | Lo que solo existe en Google real: login, autorización, Calendar, emails, Drive, triggers | Checklist manual en DEVELOPMENT.md | URL `/dev` y producción tras desplegar | Usuario |
| **Estático** | Estilo, variables no usadas, globals, patrones prohibidos (`var`, `innerHTML` sin escapar, IDs en el código) | ESLint (+ reglas propias) | Local y CI | Claude / CI |

**Por qué no hay E2E automático contra la app real:** Google bloquea los inicios de sesión automatizados (2FA y detección de bots), y las credenciales de clasp solo viven en el equipo del desarrollador, nunca en GitHub ([ADR-0015](docs_dev/solution/adr/0015-despliegue-con-clasp-multicuenta.md)). La integración podrá lanzarse desde el equipo con `clasp run-function` (se decide al llegar a T-04). Por eso lo exclusivamente "Google real" se cubre con integración manual y smoke.

**Coste de CI:** GitHub Actions es gratis en repositorios públicos y tiene 2 000 min/mes gratis en privados; la suite prevista usa pocos minutos por ejecución.

### 7.2 Principios FIRST
- **Fast:** los unitarios, en segundos; sin red ni servicios reales.
- **Independent:** cada test prepara sus datos; sin orden ni estado compartido.
- **Repeatable:** misma salida siempre; la fecha "ahora" y los IDs se inyectan (nada de `new Date()` sin controlar).
- **Self-validating:** pasa o falla con aserciones; nada de mirar logs a mano.
- **Timely:** el test se escribe con el cambio (antes si es un defecto: primero el test que lo reproduce).

### 7.3 Convenciones
- Estructura: `tests/dominio/*.test.js` (funciones puras), `tests/endpoints/*.test.js` (API con dobles), `tests/e2e/<flujo>.spec.js` (S11), `tests/soporte/` (cargador `gas.js` y dobles `dobles.js`).
- Nombre: `describe('RF-NN · qué')` + `it('debe … cuando …')`. Un escenario Gherkin ≈ un test.
- Patrón AAA (Arrange, Act, Assert) y un único comportamiento por test.
- Cobertura objetivo: ≥ 80 % de líneas en dominio; 100 % de las reglas de dinero, estado y solapamiento.
- Comandos: `npm test` y `npm run test:cobertura` (disponibles); `npm run test:e2e` y `npm run lint` (previstos). Las respuestas de los endpoints se serializan en los tests como hace `google.script.run`.
- Un defecto corregido lleva siempre su test de regresión.

---

## 8. Definition of Ready y Definition of Done

### 8.1 Definition of Ready (antes de empezar una HU o tarea)
- [ ] Tiene JTBD, criterios Gherkin verificables, MoSCoW y talla.
- [ ] RF y RNF afectados identificados; ADR de referencia si aplica.
- [ ] Decisiones abiertas resueltas (§2.1).
- [ ] Cabe en un sprint (si no, dividirla).

### 8.2 Definition of Done — HU o tarea
- [ ] Código conforme a §3 y §4; sin comentarios ni código muerto.
- [ ] Tests unitarios (y E2E si hay interfaz) escritos y **en verde**; test de regresión si era un defecto.
- [ ] Criterios Gherkin verificados; camino feliz y de error.
- [ ] UX/UI conforme a §6; usable en móvil.
- [ ] Seguridad: autorización, validación en servidor, escape de HTML.
- [ ] Trazabilidad actualizada: estado de la HU y el RF, *Implementación*, *Test*, matriz.
- [ ] ADR y arc42 actualizados si cambió el diseño.
- [ ] Desplegado en `/dev` y *smoke* hecho (por el usuario) si toca Google real.

### 8.3 Definition of Done — Release
- [ ] Todo Must del release terminado; los Should terminados o diferidos explícitamente.
- [ ] Suite completa en verde en CI; integración y smoke ejecutados.
- [ ] UAT de los journeys con Ana y Luis sin bloqueantes.
- [ ] `Config`, catálogos y `Usuarios_Autorizados` con datos reales; sin datos de prueba.
- [ ] Copia de seguridad reciente comprobada; triggers instalados.
- [ ] CHANGELOG con la versión; documentación coherente (Revisión 1 sin hallazgos abiertos de severidad Alta o Crítica).
