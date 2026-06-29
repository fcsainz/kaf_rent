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
- Arriba, el título de la app y los botones/categorías para elegir tarea: **Crear Reserva**, **Gestionar Reserva**, **Estadísticas**, **Gastos**.
- Bajo el rótulo "5 Últimas Reservas", una tabla con las **5 reservas más recientes** (por `Fecha_Registro`), **ordenable ascendente/descendente por cualquier columna**. Columnas: **Espacio**, **Fecha Inicio**, **Fecha Fin**, **Nombre** (= `Nombre_Huesped`), **Importe Neto**.
- **Buscar Reserva**: campo Nombre y campo Fecha (ninguno obligatorio) + botón **"Buscar"**, para comprobar si hay reservas de un huésped o una fecha. *(Decisión revisada en implementación 2026-06-29: este buscador estaba originalmente dentro de "Crear Reserva"; se traslada al Inicio porque resultaba confuso dentro del formulario de creación.)*

### Sección Crear Reserva
El **formulario de creación** (ver [ADR-0003](0003-formulario-generar-reserva-catalogos.md)). La **validación dura de solapamientos al guardar** (US-012) es la garantía autoritativa contra el overbooking; el buscador del Inicio es solo una comprobación previa opcional.

### Sección Gestionar Reserva
- **Vista estándar**: tabla con **todas las reservas modificables**, es decir, las **no canceladas** (Abiertas y Completadas, sin importar la fecha). Las **Canceladas** no se muestran porque no se editan. *(Decisión revisada en implementación 2026-06-29: antes se ocultaban las Completadas ya vencidas; ahora se muestran todas las modificables.)*
- Información en tres niveles, todo sin cambiar de pantalla:
  - **Fila (Tier 1):** Estado (con color: Abierta = azul, Completada = verde, Cancelada = gris), Ref., Canal, Entrada, Salida, Adultos, Menores, Check-in, Check-out + dos botones **"Ver más"** y **"Modificar"**.
  - **"Ver más" (Tier 2, solo lectura, se despliega bajo la fila):** ① Resumen económico, ② Documentos (contrato + vídeos in/out, con enlaces a Drive), ③ Resto de datos.
  - **"Modificar" (Tier 3, se despliega bajo la fila):** formulario con todos los campos editables + subida de contrato/vídeos + historial. Guardar/Cerrar/Cancelar pliega la fila y refresca el listado.
- Encima de la tabla, un **área de filtros**: filtro de fechas con opciones rápidas **"Próxima Semana"** y **"Próximo Mes"**, y **búsqueda por nombre de reserva** (texto libre).
- Al abrir una reserva concreta se accede a su edición y auditoría (ver [ADR-0005](0005-pantalla-gestionar-reserva-auditoria.md)). Al **guardar los cambios** se vuelve automáticamente al listado.

### Sección Estadísticas
Resumen de negocio por espacio; su diseño y mecanismo de cálculo se detallan en [ADR-0009](0009-estadisticas-calculo-cacheado-diario.md).

### Navegación
Como en ADR-0002, al no haber enrutado nativo en HTML Service, la navegación entre Inicio y las secciones se resuelve a nivel de cliente (mostrar/ocultar secciones con `navegar(...)`).

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
