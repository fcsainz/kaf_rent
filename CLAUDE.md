# CLAUDE.md — KAF Rent

Guía de estándares y convenciones para el desarrollo del proyecto. Claude debe seguir estas reglas en todas las interacciones con este repositorio.

---

## Proyecto

**KAF Rent** — Webapp de gestión de alquileres sobre Google Apps Script + Google Sheets.  
**Stack:** Google Apps Script (`.gs` = JavaScript), HTML Service, Google Sheets como base de datos, Google Drive, Gmail.  
**Desarrollador único:** co-propietario técnico. Los otros dos usuarios son no técnicos.

---

## 1. Documentación: Estándar PRD Ágil

Toda la documentación de requisitos y discovery sigue el estándar de **Product Requirements Document (PRD) ágil**, organizado en las tres capas siguientes. Los documentos viven en `docs/discovery/`.

### Capas del PRD

| Capa | Documentos | Propósito |
|---|---|---|
| **Estratégica** | Product Vision, Personas, Problem Statement | El "por qué" y "para quién" |
| **Táctica** | Story Map, User Stories, NFR | El "qué" construimos exactamente |
| **Ejecución** | Definition of Done, Risk Register, Roadmap | El "cuándo" y "con qué garantías" |

### Reglas de documentación

- Cada documento de discovery lleva frontmatter: `versión`, `fecha`, `estado`, `framework de referencia`.
- Las **User Stories** siguen el formato: `Como [persona], quiero [acción] para [beneficio]`.
- Los **criterios de aceptación** se escriben siempre en formato **Gherkin** (`Given / When / Then`).
- La **priorización** usa el método **MoSCoW** (Must / Should / Could / Won't).
- Las **personas** se definen con el template de Nielsen Norman Group.
- El **Story Map** sigue el framework de Jeff Patton (actividades → tareas → historias por release).
- Los **NFR** se organizan por las características de calidad de **ISO/IEC 25010**.
- El **Risk Register** sigue el formato **PMI/PMBOK** (probabilidad × impacto = exposición).
- El **Roadmap** usa cadencia de sprints de 2 semanas con milestones explícitos.

### Actualización de documentos

- Cuando se implementa una feature que cambia el diseño documentado en un ADR, actualizar el ADR correspondiente en `docs/solution/`.
- Cuando el alcance de un sprint cambia, actualizar `docs/discovery/09_roadmap.md`.
- El `SDD.md` en `docs/solution/` es el documento vivo del estado actual del sistema.

---

## 2. Estándar de Código: JavaScript / Google Apps Script

Aunque los ficheros tienen extensión `.gs`, el lenguaje es **JavaScript moderno (ES2019+)**. Google Apps Script ejecuta el código en el motor V8 desde 2020, por lo que se puede usar sintaxis moderna.

### 2.1 Sintaxis y estilo general

- Usar `const` por defecto. Usar `let` solo si la variable necesita reasignarse. **Nunca `var`**.
- **Arrow functions** para callbacks y funciones anónimas cortas: `const fn = (x) => x * 2`.
- **Template literals** en lugar de concatenación: `` `Hola ${nombre}` `` en vez de `'Hola ' + nombre`.
- **Destructuring** cuando se extraen múltiples propiedades de un objeto o array.
- **Default parameters** en lugar de comprobaciones manuales dentro de la función.
- **Optional chaining** (`?.`) y **nullish coalescing** (`??`) cuando el motor V8 de GAS lo soporte.
- Punto y coma al final de cada sentencia (no confiar en ASI).
- Comillas simples `'` para strings, salvo en template literals o cuando el string contiene comillas simples.

### 2.2 Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables y funciones | `camelCase` | `fechaInicio`, `obtenerReservas` |
| Constantes de módulo / config | `UPPER_SNAKE_CASE` | `NOMBRE_HOJA_RESERVAS` |
| Clases (si se usan) | `PascalCase` | `GestorReservas` |
| Archivos `.gs` | `camelCase` o `kebab-case` descriptivo | `reservas.gs`, `notificaciones.gs` |
| Sheets y rangos | Nombres exactos de la hoja entre comillas simples | `'Reservas'`, `'Config'` |
| IDs de columna | Constantes con nombre descriptivo, no números mágicos | `const COL_ESTADO = 5` |

### 2.3 Estructura de ficheros `.gs`

Organizar el código en ficheros por responsabilidad, no en un único fichero monolítico:

```
Code.gs           — doGet(), punto de entrada de la webapp
auth.gs           — verificación de usuario autorizado, logging de acceso
reservas.gs       — CRUD de reservas, validación de solapamientos
catalogo.gs       — lectura de catálogos (espacios, canales, servicios)
auditoría.gs      — escritura en Historial_Cambios y Logs
notificaciones.gs — envío de emails (cierre/apertura canales, informes)
drive.gs          — subida de contratos a Google Drive
config.gs         — lectura de parámetros desde la hoja Config
informes.gs       — generación de informes trimestrales
utils.gs          — funciones de utilidad transversales (validaciones, fechas)
```

### 2.4 Funciones

- Funciones cortas con **responsabilidad única** (una función = una cosa).
- Máximo ~30 líneas por función. Si crece más, dividir.
- Nombres de función como verbos descriptivos: `crearReserva`, `validarSolapamiento`, `enviarAvisoCierre`.
- Las funciones que acceden a Sheets deben aceptar el objeto `sheet` como parámetro (no buscarlo internamente) para facilitar pruebas.
- Separar la lógica de negocio del acceso a datos: una función que valida solapamientos no debe también escribir en la Sheet.

```javascript
// Bien: responsabilidad única, parámetros claros
const calcularImporteNeto = (importeBruto, porcentajeComision, gastosAsociados) => {
  const comision = importeBruto * (porcentajeComision / 100);
  return importeBruto - comision + gastosAsociados;
};

// Mal: mezcla lógica de negocio con acceso a datos
function calcularYGuardarImporte(idReserva) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Reservas');
  // ...hace demasiadas cosas
}
```

### 2.5 Manejo de errores

- Envolver en `try/catch` toda llamada a APIs de Google (Sheets, Drive, MailApp) — pueden fallar por cuotas o permisos.
- En el `catch`, registrar el error en la hoja `Errores` con: timestamp, función, mensaje de error, datos de contexto.
- **Nunca** silenciar un error con un `catch` vacío.
- Devolver errores al cliente con un objeto estructurado: `{ success: false, error: 'Mensaje para el usuario' }`.
- El cliente (HTML/JS) muestra siempre feedback al usuario cuando una operación falla.

```javascript
const guardarReserva = (datos) => {
  try {
    // lógica de guardado
    return { success: true, id: idGenerado };
  } catch (error) {
    registrarError('guardarReserva', error, datos);
    return { success: false, error: 'No se pudo guardar la reserva. Inténtalo de nuevo.' };
  }
};
```

### 2.6 Acceso a Google Sheets

- **Nunca** usar números de columna hardcodeados en el código. Definir constantes en la parte superior del fichero.
- Leer filas completas de una vez (`getValues()`) en lugar de celda a celda para minimizar llamadas a la API.
- Usar `LockService.getScriptLock()` en operaciones de escritura que puedan ejecutarse concurrentemente.
- Cachear la referencia al `Spreadsheet` y a los `Sheet` dentro de una ejecución; no llamar a `getSheetByName` repetidamente.

```javascript
// Constantes de columna — definir al inicio del fichero
const COL_ID_RESERVA        = 1;
const COL_ESPACIO           = 2;
const COL_ESTADO_RESERVA    = 3;
// ...

// Leer en bloque, no celda a celda
const obtenerTodasLasReservas = (sheet) => {
  const datos = sheet.getDataRange().getValues();
  return datos.slice(1); // omitir cabecera
};
```

### 2.7 Comunicación cliente-servidor (GAS HTML Service)

- Usar `google.script.run` para llamadas desde el cliente al servidor GAS.
- Siempre encadenar `.withSuccessHandler()` y `.withFailureHandler()` — nunca dejar llamadas sin manejar errores.
- El servidor devuelve siempre un objeto `{ success: boolean, data?: any, error?: string }`.
- Deshabilitar el botón de submit mientras una llamada está en vuelo para evitar dobles envíos.

```javascript
// Cliente (HTML/JS)
const guardarFormulario = () => {
  const boton = document.getElementById('btn-guardar');
  boton.disabled = true;

  google.script.run
    .withSuccessHandler((resultado) => {
      boton.disabled = false;
      if (resultado.success) {
        mostrarMensajeExito('Reserva guardada correctamente');
      } else {
        mostrarError(resultado.error);
      }
    })
    .withFailureHandler((error) => {
      boton.disabled = false;
      mostrarError('Error inesperado. Inténtalo de nuevo.');
    })
    .guardarReserva(obtenerDatosFormulario());
};
```

### 2.8 Validación

- Validar **siempre en dos capas**: cliente (inmediatez) y servidor (seguridad).
- La validación del servidor es la autoritativa — el cliente solo mejora la UX.
- Las funciones de validación devuelven `{ valido: boolean, mensaje?: string }`.
- No mezclar validación con lógica de negocio ni con acceso a datos.

### 2.9 Comentarios

- **Por defecto no escribir comentarios.** El código bien nombrado se explica solo.
- Escribir un comentario solo cuando el **POR QUÉ** es no obvio: una restricción oculta, un workaround para un bug de GAS, un invariante sutil.
- No documentar el QUÉ hace el código (eso lo dicen los nombres).
- No escribir bloques de comentarios multilínea ni JSDoc extensos — una línea máximo.

```javascript
// Bien: explica el por qué (workaround conocido de GAS)
// GAS no soporta Date en getValues(); las fechas llegan como strings 'DD/MM/YYYY HH:MM:SS'
const parsearFechaGAS = (fechaString) => new Date(fechaString);

// Mal: describe el qué (ya lo dice el nombre)
// Esta función obtiene todas las reservas de la hoja
const obtenerTodasLasReservas = (sheet) => { ... };
```

### 2.10 Seguridad

- **Nunca** hardcodear emails, IDs de hoja o claves en el código fuente. Leerlos siempre de la hoja `Config`.
- **Nunca** confiar en datos enviados desde el cliente sin revalidarlos en el servidor.
- **Siempre** verificar que el usuario está autorizado al inicio de cada función del servidor que acceda a datos sensibles.

---

## 3. Principios de Código Limpio, Claro, Robusto y Eficiente

Estos principios son transversales a todo el código del proyecto. Se apoyan en las obras de referencia del sector: *Clean Code* (Robert C. Martin), *The Pragmatic Programmer* (Hunt & Thomas) y los principios SOLID.

### 3.1 Limpio — Código que no necesita explicación

**DRY — Don't Repeat Yourself**  
Si la misma lógica aparece dos veces, extraerla a una función. Tres o más veces, es obligatorio.  
La duplicación no es solo de código: también de lógica, de intención y de conocimiento.

**KISS — Keep It Simple, Stupid**  
La solución más simple que resuelve el problema es siempre la correcta. Complejidad no solicitada = deuda técnica.

**Sin código muerto**  
Eliminar funciones sin llamar, variables no usadas, bloques comentados (`// código antiguo`) y ramas `if` inalcanzables. El historial de git conserva lo eliminado.

**Nombres que revelan intención**  
Un buen nombre elimina la necesidad de comentario. Si cuesta nombrar algo, es señal de que hace demasiadas cosas.

```javascript
// Mal
const d = new Date();
const fn = (x, y) => x > y;

// Bien
const fechaActual = new Date();
const esPosterior = (fechaA, fechaB) => fechaA > fechaB;
```

---

### 3.2 Claro — Código que se lee de arriba abajo sin sorpresas

**Guard clauses — retorno temprano**  
Validar las condiciones de error al principio de la función y salir. Evitar bloques `if/else` anidados que obligan a mantener el contexto en la cabeza.

```javascript
// Mal: lógica principal enterrada en anidamiento
const procesarReserva = (datos) => {
  if (datos) {
    if (datos.espacio) {
      if (!haysolapamiento(datos)) {
        // lógica principal aquí, muy dentro
      }
    }
  }
};

// Bien: guard clauses, lógica principal en el nivel superior
const procesarReserva = (datos) => {
  if (!datos) return { success: false, error: 'Datos requeridos' };
  if (!datos.espacio) return { success: false, error: 'Espacio requerido' };
  if (haySolapamiento(datos)) return { success: false, error: 'Solapamiento detectado' };

  // lógica principal sin anidamiento
};
```

**Un único nivel de abstracción por función**  
Una función no debe mezclar lógica de alto nivel (orquestar) con detalles de bajo nivel (leer celdas). Si lo hace, dividirla.

```javascript
// Mal: mezcla nivel alto y bajo
const crearReserva = (datos) => {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Reservas');
  const filas = sheet.getDataRange().getValues();
  // ... validaciones de bajo nivel
  // ... lógica de negocio de alto nivel mezclada
};

// Bien: nivel alto orquesta, delega los detalles
const crearReserva = (datos) => {
  const errValidacion = validarDatosReserva(datos);
  if (errValidacion) return { success: false, error: errValidacion };

  if (haySolapamiento(datos.espacio, datos.fechaInicio, datos.fechaFin)) {
    return { success: false, error: obtenerMensajeSolapamiento() };
  }

  const id = guardarReservaEnSheet(datos);
  notificarCierreCanales(datos.espacio, datos.canal);
  return { success: true, id };
};
```

**Sin números ni strings mágicos**  
Todo literal con significado de negocio debe ser una constante nombrada.

```javascript
// Mal
if (estado === 3) { ... }
if (reserva.tipo === 'P') { ... }

// Bien
const ESTADO_COMPLETADA = 'Completada';
const MODO_DIA_HORA     = 'Dia_y_Hora';

if (estado === ESTADO_COMPLETADA) { ... }
if (espacio.modofecha === MODO_DIA_HORA) { ... }
```

**Estructura predecible en todas las funciones**  
Seguir siempre el orden: validaciones → lógica → efecto secundario → retorno. El lector sabe dónde buscar cada cosa.

---

### 3.3 Robusto — Código que no se rompe en silencio

**Fail fast — fallar pronto y con claridad**  
Validar las precondiciones al inicio, no a mitad de la ejecución. Un error temprano con mensaje claro es mejor que un resultado incorrecto silencioso.

```javascript
const calcularComision = (importeBruto, porcentaje) => {
  if (typeof importeBruto !== 'number' || importeBruto < 0) {
    throw new Error(`calcularComision: importeBruto inválido (${importeBruto})`);
  }
  if (typeof porcentaje !== 'number' || porcentaje < 0 || porcentaje > 100) {
    throw new Error(`calcularComision: porcentaje inválido (${porcentaje})`);
  }
  return importeBruto * (porcentaje / 100);
};
```

**Sin efectos secundarios ocultos**  
Una función que dice calcular algo no debe también escribir en una Sheet, enviar un email o modificar un objeto externo sin que el nombre lo indique. Los efectos secundarios deben ser explícitos en el nombre y en la firma.

```javascript
// Mal: el nombre no revela el efecto secundario
const obtenerEstadoReserva = (reserva) => {
  const estado = calcularEstado(reserva);
  sheet.getRange(fila, COL_ESTADO).setValue(estado); // ¡efecto oculto!
  return estado;
};

// Bien: dos funciones con propósitos claros
const calcularEstadoReserva = (reserva) => { ... }; // pura, sin efectos
const actualizarEstadoEnSheet = (sheet, fila, estado) => { ... }; // efecto explícito
```

**Manejo explícito de casos límite**  
Siempre considerar: ¿qué pasa si el array está vacío? ¿si el valor es `null`? ¿si la Sheet no existe? Tratar estos casos explícitamente, no ignorarlos.

**Inmutabilidad siempre que sea posible**  
No mutar los parámetros de entrada de una función. Devolver nuevos valores en lugar de modificar los existentes.

```javascript
// Mal: muta el parámetro
const normalizarDatos = (datos) => {
  datos.nombre = datos.nombre.trim();
  return datos;
};

// Bien: devuelve nuevo objeto
const normalizarDatos = (datos) => ({
  ...datos,
  nombre: datos.nombre.trim(),
});
```

---

### 3.4 Eficiente — Código que no hace trabajo innecesario

**YAGNI — You Aren't Gonna Need It**  
No implementar funcionalidad para casos hipotéticos futuros. Solo lo que el requisito actual necesita. La abstracción prematura es tan costosa como la duplicación.

**Sin optimización prematura**  
Primero escribir el código correcto y legible. Optimizar solo cuando un problema de rendimiento real esté identificado y medido. En GAS, el cuello de botella casi siempre son las llamadas a la API de Sheets, no la lógica JavaScript.

**Minimizar llamadas a la API de Google**  
Cada `getValue()`, `setValue()`, `getSheetByName()` es una llamada de red. Agrupar lecturas y escrituras, nunca dentro de bucles.

```javascript
// Mal: N llamadas a la API dentro del bucle
reservas.forEach((reserva, i) => {
  sheet.getRange(i + 2, COL_ESTADO).setValue(calcularEstado(reserva)); // llamada por fila
});

// Bien: una sola escritura al final
const estados = reservas.map((reserva) => [calcularEstado(reserva)]);
sheet.getRange(2, COL_ESTADO, estados.length, 1).setValues(estados); // una llamada
```

**Cachear referencias costosas dentro de una ejecución**  
No repetir `SpreadsheetApp.getActiveSpreadsheet()` o `getSheetByName()` en cada función. Obtenerlas una vez y pasarlas como parámetro o guardarlas en una variable de módulo.

**Evitar procesamiento innecesario**  
Usar `find` en lugar de `filter` cuando solo se necesita el primer resultado. Salir del bucle con `return` o `break` en cuanto se tiene la respuesta. No recorrer arrays completos si no es necesario.

```javascript
// Mal: recorre todo aunque encuentre el resultado
const reserva = reservas.filter(r => r.id === idBuscado)[0];

// Bien: para en cuanto encuentra
const reserva = reservas.find(r => r.id === idBuscado);
```

---

### 3.5 Resumen de principios

| Principio | Regla de oro |
|---|---|
| **DRY** | Si se repite, se extrae |
| **KISS** | La solución más simple que funciona |
| **YAGNI** | Solo lo que el requisito actual pide |
| **SRP** | Una función = una responsabilidad = una razón para cambiar |
| **Guard clauses** | Errores primero, lógica principal al nivel superior |
| **Sin magia** | Ningún número ni string literal con significado de negocio |
| **Fail fast** | Validar precondiciones al inicio, no a mitad |
| **Sin efectos ocultos** | El nombre revela todos los efectos secundarios |
| **Inmutabilidad** | No mutar parámetros; devolver nuevos valores |
| **API en bloque** | Nunca llamadas a Sheets dentro de bucles |

---

## 4. Estándares de UX/UI

Estos estándares aplican a **toda interfaz** servida con HTML Service. La referencia de usuario es **Ana y Luis** (no técnicos): si ellos no lo entienden a la primera y sin formación, la interfaz está mal. Se apoyan en las **heurísticas de usabilidad de Nielsen** y en patrones de **Material Design** adaptados a la simplicidad del proyecto. El prototipo de una pantalla fija su estructura; estos estándares fijan su comportamiento, su estilo y su accesibilidad.

> **Tokens concretos:** los valores exactos de color, tipografía, espaciado, radios, sombras y componentes están en [docs/solution/design-system.md](docs/solution/design-system.md) (decisión en [ADR-0011](docs/solution/0011-sistema-diseno-visual.md)). Este §4 fija los **principios**; ese documento fija los **tokens** — al generar interfaz, usar siempre esas variables, no colores/medidas sueltas.

### 4.1 Principios UX

- **Claridad sobre densidad** — Mostrar lo justo para la tarea. Si una pantalla intenta hacer de todo, dividirla (ver el patrón hub + secciones de ADR-0008).
- **Mínimo esfuerzo** — La tarea frecuente (crear/gestionar una reserva) se completa en los menos pasos y clics posibles. Autocompletar y filtrar en cascada en lugar de pedir datos redundantes.
- **Guiar, no asumir** — El usuario no técnico debe saber siempre dónde está, qué puede hacer y cómo volver. Nada de flujos implícitos.
- **Prevención de errores** — Es mejor impedir el error que avisar después: deshabilitar lo no válido, validar en el momento, no ofrecer opciones incompatibles.
- **Confirmación en acciones destructivas** — Toda acción irreversible (cancelar reserva, borrar) exige confirmación explícita en un modal.
- **Feedback inmediato** — Cada acción del usuario produce una respuesta visible (éxito, error o progreso). Nunca un clic sin reacción.
- **Consistencia** — Mismos componentes, etiquetas, colores y posiciones para las mismas cosas en toda la app.

### 4.2 Layout y jerarquía visual

- **Patrón hub + secciones**: pantalla de Inicio con accesos claros y una sección por tarea (ADR-0008). Una tarea principal por pantalla.
- **Jerarquía visual clara**: título de la pantalla → acciones primarias → contenido → acciones secundarias. Lo importante, arriba y a la vista sin scroll.
- **Una acción primaria por pantalla**, destacada visualmente; el resto, secundarias.
- **Responsive**: usable en tablet y móvil (Ana usa móvil/tablet, Luis móvil). Nada que requiera horizontalidad de escritorio para funcionar.
- **Espacio en blanco**: agrupar lo relacionado y separar lo distinto con espaciado, no con líneas y cajas innecesarias.

### 4.3 Patrones de componentes

- **Botones**: etiqueta con verbo de acción del dominio ("Crear Reserva", "Guardar", no "Aceptar"/"OK"). Distinguir primario (relleno) de secundario (contorno). Deshabilitar el botón mientras una llamada está en vuelo (ya en §2.7) para evitar dobles envíos.
- **Tablas**: cabeceras descriptivas, columnas ordenables cuando aporte, filas legibles. Estado de carga y estado vacío explícitos.
- **Formularios**: etiqueta visible sobre cada campo (no solo placeholder), campos obligatorios marcados, agrupación lógica, validación **en línea y en dos capas** (cliente para inmediatez, servidor autoritativo — §2.8). El foco entra en el primer campo relevante.
- **Estados vacíos accionables**: cuando no hay datos, mensaje claro + acción para avanzar (p. ej. "No hay reservas registradas" + botón "Crear Reserva"). Nunca una pantalla en blanco.
- **Modales de confirmación**: para acciones irreversibles, con texto que explique la consecuencia y dos opciones claras (confirmar / volver), sin ambigüedad sobre cuál es la destructiva.

### 4.4 Sistema visual

- **Paleta semántica con roles** (primario, éxito, error, aviso, neutro), definida una vez y reutilizada. El color **nunca** es el único portador de significado (acompañar de texto o icono) — por accesibilidad.
- **Tipografía**: una sola familia, jerarquía por tamaño y peso, tamaño base legible (≥ 16 px en cuerpo).
- **Espaciado por escala** consistente (no valores arbitrarios sueltos).
- **Estados de interacción** visibles para todo elemento interactivo: `hover`, `focus` (foco visible siempre), `active`, `disabled`.
- **Iconografía** solo de apoyo y acompañada de texto; nunca un icono solo para una acción importante.

### 4.5 Accesibilidad

- **Contraste WCAG 2.1 AA** (mínimo 4.5:1 en texto normal).
- **Áreas táctiles** cómodas (objetivo ≥ 44×44 px), pensando en uso desde móvil.
- **Labels asociadas** a cada input; **navegación por teclado** completa y **foco visible**.
- Texto alternativo en imágenes con significado; no transmitir información solo por color o posición.

### 4.6 Feedback y estados del sistema

- **Carga**: indicador visible en operaciones que tarden (servidor GAS puede tardar segundos); no dejar la UI congelada sin señal.
- **Éxito / error siempre comunicados**: tras cada operación, mensaje claro. Los errores son **accionables** (qué falló y cómo resolverlo — §2.5), nunca un "Error" genérico.
- **Sin fallo silencioso**: si algo falla en el servidor, el usuario lo sabe (alineado con `withFailureHandler`, §2.7).

### 4.7 Microcopy

- **Español claro y cercano**, sin jerga técnica ni nombres internos de campos/hojas.
- **Mensajes de error**: qué ha pasado + cómo solucionarlo, en una frase. Ej.: "La fecha de salida debe ser posterior a la de entrada".
- **Etiquetas consistentes con el dominio** (Espacio, Reserva, Canal, Huésped…) y con el resto de la app.

### 4.8 Flujos UX

- Cada pantalla sigue: **entrada → acción → confirmación → retorno claro**. Siempre hay una salida visible ("Volver" / "Cancelar").
- **No perder datos** al navegar: al volver o cancelar, no se pierde lo ya guardado; avisar si hay cambios sin guardar.
- **Evitar dobles envíos** y acciones duplicadas (botón en vuelo deshabilitado).
- El flujo del usuario no técnico se valida contra los **User Journeys** del discovery ([02_personas.md](docs/discovery/02_personas.md)); si un journey no se puede completar sin ayuda, el diseño se corrige.

---

## 5. Reglas generales para Claude

- Antes de crear un fichero nuevo, verificar si ya existe uno donde encaje mejor el código.
- Preferir editar ficheros existentes antes de crear nuevos.
- No añadir funcionalidades no pedidas ni refactorizaciones no solicitadas.
- No añadir comentarios que expliquen el qué — solo el porqué cuando sea no obvio.
- Cuando se crea o modifica un documento de discovery, respetar el frontmatter y el framework de referencia indicado en la cabecera.
- Cuando se genera una User Story, incluir siempre: formato `Como/quiero/para`, criterios de aceptación Gherkin, prioridad MoSCoW y estimación en talla de camiseta.
- Cuando se identifica un riesgo nuevo durante el desarrollo, añadirlo al `08_risk_register.md`.
- Cuando una decisión de diseño cambia durante la implementación, actualizar el ADR correspondiente antes de continuar.
- Cuando se diseñe o genere cualquier interfaz o flujo de usuario, seguir los **Estándares de UX/UI** (§4); un prototipo fija la estructura, pero el estilo, el comportamiento y la accesibilidad los marca §4.
