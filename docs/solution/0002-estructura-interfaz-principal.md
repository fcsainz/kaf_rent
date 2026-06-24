# ADR-0002: Estructura de la interfaz principal (panel con zonas + pantallas dedicadas)

## Estado
Superseded por [ADR-0008](0008-reestructuracion-navegacion-tres-secciones.md)

> El diseño vigente de la navegación es el de ADR-0008 (pantalla de Inicio + tres secciones: Generar / Gestionar / Estadísticas). Este ADR se conserva como registro histórico de la decisión original (panel con dos tablas por espacio).

## Contexto
- Requisito original del proyecto: una sola interfaz para gestionar todo, en vez de procesos dispersos.
- Hay dos tipos de alquiler (Piscina/Jardín y Habitación Interior) que conviene poder ver de un vistazo.
- Hay acciones de alto uso diario (crear una reserva, gestionar/editar una existente) que necesitan su propio espacio de trabajo sin saturar la vista principal.
- Tres personas con el mismo nivel de acceso usarán la interfaz de forma habitual.

## Decisión
La pantalla principal de la webapp funciona como un panel/dashboard, dividido en tres zonas:

1. **Zona de acciones rápidas**: dos botones, "Generar Reserva" y "Gestionar Reserva", que llevan a pantallas dedicadas (su contenido detallado se definirá más adelante: formulario de creación y vista de edición/gestión respectivamente).
2. **Zona Piscina/Jardín**: tabla visual con las reservas de ese espacio (columnas a definir en una iteración posterior).
3. **Zona Habitación Interior**: tabla visual con las reservas de ese espacio (columnas a definir en una iteración posterior).

Cada tabla de espacio admite una **consulta por fecha única**: al introducir un día, la tabla muestra las reservas activas que ocupan esa fecha. Si no hay ninguna, se muestra el mensaje "No hay reservas registradas" y un botón "Crear Reserva" que lleva al formulario de creación en blanco. Esto convierte el panel en la herramienta de comprobación rápida de disponibilidad antes de registrar una reserva.

Esta separación es puramente de presentación: a nivel de datos, ambos siguen viviendo en la misma tabla `Reservas`, diferenciados por la columna `Espacio`; aquí solo se decide cómo se organiza visualmente la pantalla principal, no el modelo de datos.

Nota técnica para la fase de construcción: Apps Script HTML Service no tiene un sistema de rutas nativo como un framework SPA, así que la navegación entre estas "pantallas" dentro de una misma Web App se resolverá a nivel de cliente (mostrar/ocultar secciones o cargar plantillas HTML mediante `google.script.run`). Se concretará al diseñar el detalle de cada pantalla.

## Alternativas consideradas
- **Todo en una sola pantalla larga**, con el formulario de creación y la tabla de gestión siempre visibles: descartado, sería visualmente sobrecargado con tres personas usándolo a diario.
- **Menú lateral de navegación con varias secciones** (Inicio, Piscina, Habitación, Informes...): descartado por ahora, se prioriza algo más simple tipo panel único con accesos directos; revisable si el proyecto crece.
- **Páginas completamente independientes** (una URL por función): descartado, contradice el requisito original de una única interfaz de gestión.

## Consecuencias

**Positivas**
- Vista resumen del estado de ambos tipos de alquiler en cuanto se abre la app, sin necesidad de navegar.
- Las acciones de mayor uso (crear, gestionar) quedan accesibles en un clic.
- Mantiene el requisito original de una sola interfaz, aunque internamente tenga varias vistas.

**Negativas / riesgos**
- Al no haber enrutado nativo en Apps Script, la navegación entre vistas hay que implementarla a mano; es una complejidad adicional a resolver en la fase de construcción.
- Cuantas más tablas y datos se muestren en el panel principal, más peso tendrá la carga inicial (cada tabla implica una lectura del Sheet); habrá que vigilar el rendimiento si el volumen de reservas crece con el tiempo.

## Pendiente
- Definir las columnas exactas de las tablas de Piscina/Jardín y Habitación Interior.
- Definir el contenido y comportamiento de las pantallas "Generar Reserva" y "Gestionar Reserva".
- Definir el control de entrada de fecha de la consulta (selector de calendario, formato DD/MM/AAAA) y si por defecto la tabla muestra todas las reservas activas o exige una fecha.
