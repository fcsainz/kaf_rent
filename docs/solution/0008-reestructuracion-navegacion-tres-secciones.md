# ADR-0008: Reestructuración de la navegación en tres secciones (Inicio + Crear / Gestionar / Estadísticas)

## Estado
Aceptado — supersede a [ADR-0002](0002-estructura-interfaz-principal.md)

## Contexto
- ADR-0002 definió la pantalla principal como un panel único con dos tablas (una por espacio) y dos botones de acción. Con el uso real se observa que conviene separar las tres grandes tareas del negocio —registrar, gestionar y analizar— en secciones propias, y ofrecer una pantalla de inicio que actúe de punto de entrada.
- Las tres personas usan la herramienta con el mismo nivel de acceso; necesitan llegar rápido a la tarea concreta que vienen a hacer.
- Aparece la necesidad de una vista de estadísticas de negocio (ver [ADR-0009](0009-estadisticas-calculo-cacheado-diario.md)), que no encaja en el panel de reservas original.
- Apps Script HTML Service sigue sin enrutado nativo (misma restricción que en ADR-0002).
- Existe un prototipo de baja fidelidad de la pantalla de Inicio que valida esta estructura (título + tres botones + tabla de últimas reservas).

## Decisión
La interfaz se organiza en una **pantalla de Inicio** que actúa de hub y **tres secciones** dedicadas.

### Pantalla de Inicio (hub)
- Arriba, el título de la app y tres botones/categorías para elegir tarea: **Crear Reserva**, **Gestionar Reserva**, **Estadísticas**.
- Debajo, bajo el rótulo "5 Últimas Reservas", una tabla con las **5 reservas más recientes** (por `Fecha_Registro`), **ordenable ascendente/descendente por cualquier columna**. Columnas: **Espacio**, **Fecha Inicio**, **Fecha Fin**, **Nombre** (= `Nombre_Huesped`), **Importe Neto**.

### Sección Crear Reserva
Presenta dos acciones (ver también [ADR-0003](0003-formulario-generar-reserva-catalogos.md)):
- **Buscar Reserva**: formulario con campo Nombre y campo Fecha (ninguno obligatorio) y un botón **"Buscar"** que ejecuta la consulta. Devuelve las reservas que coincidan, para comprobar disponibilidad antes de crear.
- **Crear Reserva**: el formulario de creación. Su primer paso es comprobar que no haya reservas incompatibles (vía Buscar Reserva); en todo caso, la **validación dura de solapamientos al guardar** (US-012) sigue siendo la garantía autoritativa contra el overbooking.

### Sección Gestionar Reserva
- **Vista estándar**: tabla con las reservas **Abiertas** (todas, aunque su fecha de fin esté vencida — siguen requiriendo gestión) y las **Completadas cuya fecha de fin no haya vencido** (`Fecha_Hora_Fin >= ahora`). Nunca se muestran las **Canceladas**.
- Encima de la tabla, un **área de filtros**: filtro de fechas con opciones rápidas **"Próxima Semana"** y **"Próximo Mes"**, y **búsqueda por nombre de reserva** (texto libre).
- Al abrir una reserva concreta se accede a su edición y auditoría (ver [ADR-0005](0005-pantalla-gestionar-reserva-auditoria.md)).

### Sección Estadísticas
Resumen de negocio por espacio; su diseño y mecanismo de cálculo se detallan en [ADR-0009](0009-estadisticas-calculo-cacheado-diario.md).

### Navegación
Como en ADR-0002, al no haber enrutado nativo en HTML Service, la navegación entre Inicio y las tres secciones (y entre las acciones de Crear Reserva) se resuelve a nivel de cliente (mostrar/ocultar secciones o cargar plantillas con `google.script.run`).

## Alternativas consideradas
- **Mantener el panel de dos tablas por espacio (ADR-0002)**: descartado; mezcla registrar/gestionar/analizar en una sola vista y no escala a medida que crece el uso. El desglose por espacio se conserva, pero como zonas de la sección Estadísticas (agregados), no como listados operativos.
- **Menú lateral de navegación**: descartado por simplicidad, igual que en ADR-0002; tres botones en el inicio bastan.
- **Tabla de últimas reservas dentro de "Crear Reserva"** en lugar del Inicio: descartado; en el Inicio funciona como resumen inmediato común a las tres tareas (validado en el prototipo).

## Consecuencias

**Positivas**
- Cada tarea principal (registrar, gestionar, analizar) tiene su propio espacio, sin saturar una vista única.
- El Inicio da contexto inmediato al entrar (las 5 reservas más recientes, con su importe neto) y reparte hacia la tarea concreta.
- Deja sitio natural para Estadísticas sin contaminar la gestión de reservas.

**Negativas / riesgos**
- Más vistas que mantener a mano al no haber enrutado nativo; complejidad de cliente algo mayor que un panel único.
- La tabla de últimas 5 y la de Gestionar implican lecturas del Sheet; conviene leer en bloque y cachear referencias para no penalizar la carga.

## Pendiente
- Definir las columnas exactas y el orden por defecto de la tabla de Gestionar Reserva.
- Definir el criterio de "Buscar Reserva" cuando se rellenan ambos campos (Nombre AND Fecha) frente a solo uno.
- Definir el estilo visual (color, tipografía, espaciado) conforme a los estándares de UX/UI; el prototipo solo fija la estructura.
