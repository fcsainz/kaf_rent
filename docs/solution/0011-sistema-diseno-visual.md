# ADR-0011: Sistema de diseño visual (paleta, tipografía y componentes)

## Estado
Aceptado

## Contexto
- Los estándares de UX/UI ([CLAUDE.md](../../CLAUDE.md) §4) fijan los principios (claridad, accesibilidad, estados, microcopy) pero no los valores concretos (colores, fuentes, espaciado).
- Antes de generar código de interfaz conviene cerrar un sistema visual único, para que todas las pantallas (Inicio, Crear, Gestionar, Estadísticas, Gastos) sean coherentes y el desarrollo no improvise estilos.
- El producto es una herramienta operativa usada por personas no técnicas; la dirección debe ser cálida, cercana y muy legible.
- Restricción: coste cero y buen rendimiento en Apps Script HTML Service (sin frameworks pesados).

## Decisión
- **Dirección visual:** cálida y de hospitalidad — **terracota** como color de marca (primario) y **oliva** como acento (secundario), sobre neutros de gris cálido.
- **Tipografía:** **Poppins** para títulos (geométrica redondeada, con personalidad) e **Inter** para cuerpo e interfaz, cargadas desde Google Fonts; fallback a fuentes del sistema. Formas **redondeadas** (radio por defecto 10px).
- **Tokens y guía:** todos los valores (paleta con tints/shades, escala tipográfica, espaciado base 4px, radios, sombras, estados y componentes) viven en [design-system.md](design-system.md), incluido un bloque de CSS custom properties listo para el proyecto.
- **Estados y semántica:** verde = completada/éxito, ámbar = abierta/aviso, gris = cancelada, rojo = error/destructivo; oliva = Piscina/Jardín, terracota = Habitación (badges y eventos de Calendar).
- **Accesibilidad:** contraste WCAG 2.1 AA obligatorio; el color nunca es el único portador de significado.

## Alternativas consideradas
- **Paleta "Mediterráneo" (teal + arena)** y **paleta "Índigo profesional"**: descartadas frente a la cálida (terracota/oliva), que encaja mejor con el tono de hospitalidad/alojamiento del negocio.
- **Tipografía del sistema sobria** o **muy redondeada (Quicksand/Open Sans)**: descartadas; Poppins + Inter da personalidad sin perder legibilidad ni rendimiento.
- **Framework CSS (Bootstrap/Tailwind)**: descartado para esta fase; un conjunto de tokens y CSS propio es más ligero y suficiente para el alcance, sin dependencias.

## Consecuencias

**Positivas**
- Coherencia visual garantizada: un único origen de tokens para todas las pantallas.
- Desarrollo más rápido y predecible (los estilos no se improvisan).
- Identidad cálida alineada con el negocio, manteniendo accesibilidad y rendimiento.

**Negativas / riesgos**
- Cargar fuentes de Google Fonts añade una dependencia de red en el arranque; mitigado con `display=swap` y fallback de sistema.
- Mantener los tokens sincronizados entre el documento y el código exige disciplina; el `design-system.md` es la fuente de verdad.

## Pendiente
- Logotipo/wordmark, set de iconos definitivo y maquetas de alta fidelidad (ver design-system.md §9).
- Validar los contrastes finales de cada par texto/fondo al maquetar.
