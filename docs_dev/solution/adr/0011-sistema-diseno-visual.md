---
status: accepted
date: 2026-06-24
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0011: Sistema de diseño visual propio (terracota y oliva, Poppins e Inter, tokens CSS)

## Contexto y planteamiento del problema

Los estándares de UX/UI ([CLAUDE.md §6](../../../CLAUDE.md)) fijan principios pero no valores concretos. Antes de generar interfaz conviene fijar un sistema visual único para que todas las pantallas sean coherentes. Los usuarios no son técnicos: la estética debe ser cálida y muy legible. ¿Qué sistema visual adoptamos? (P-11)

## Factores de decisión

* Coherencia entre pantallas.
* Legibilidad y accesibilidad WCAG 2.1 AA (RNF-12).
* Rendimiento en HTML Service, sin frameworks pesados.
* Tono cálido de hospitalidad.

## Opciones consideradas

* Paleta cálida terracota/oliva + Poppins/Inter + tokens CSS propios
* Paleta "Mediterráneo" (teal + arena)
* Paleta "Índigo profesional"
* Framework CSS (Bootstrap/Tailwind)
* Tipografía del sistema o muy redondeada (Quicksand/Open Sans)

## Resultado de la decisión

Opción elegida: "Terracota/oliva + Poppins/Inter + tokens CSS propios", porque encaja con el tono del negocio y es ligera.

- **Color:** terracota como primario (marca), oliva como acento, neutros de gris cálido.
- **Tipografía:** Poppins (títulos) e Inter (cuerpo), desde Google Fonts con `display=swap` y fuentes del sistema como alternativa. Radio por defecto 10 px.
- **Semántica:** verde = completada/éxito, ámbar = abierta/aviso, gris = cancelada, rojo = error/destructivo; oliva = Piscina/Jardín, terracota = Habitación.
- **Fuente de verdad:** [design-system.md](../design-system.md) (tokens, escala, espaciado base 4 px, sombras, componentes); en código, `estilos.html`.
- **Accesibilidad:** contraste AA obligatorio; el color nunca es el único portador de significado.

### Consecuencias

* Buena, porque garantiza coherencia con un único origen de tokens.
* Buena, porque el desarrollo es más rápido y predecible.
* Mala, porque Google Fonts añade una dependencia de red al arrancar (mitigada con `swap` y la alternativa del sistema).
* Mala, porque mantener sincronizados `design-system.md` y `estilos.html` exige disciplina.

### Confirmación

* Auditoría de contraste con Lighthouse/axe (RNF-12).
* Revisión: el HTML usa variables CSS, no colores ni medidas sueltos.

## Pros y contras de las opciones

### Otras paletas

* Neutral, porque ambas eran válidas; se prefirió la cálida por el tono de hospitalidad.

### Framework CSS

* Buena, porque ofrece componentes hechos.
* Mala, porque pesa más de lo necesario y añade una dependencia externa.

### Tipografía del sistema o muy redondeada

* Mala, porque tiene menos personalidad o peor legibilidad.

## Más información

* **Trazabilidad:** todas las HU con interfaz · RNF-11, RNF-12
* **Cuestiones abiertas:** logotipo, iconos y maquetas de alta fidelidad (design-system.md §9); validar contrastes finales (B-12)
