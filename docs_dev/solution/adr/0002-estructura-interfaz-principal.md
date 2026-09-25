---
status: superseded by ADR-0008
date: 2026-06-22
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0002: Estructura de la interfaz principal (panel con zonas por espacio)

> **Reemplazado por [ADR-0008](0008-reestructuracion-navegacion-tres-secciones.md).** Se conserva como registro histórico de la decisión original.

## Contexto y planteamiento del problema

Se quería una única interfaz para sustituir procesos dispersos, con dos tipos de alquiler visibles de un vistazo y acciones de uso diario (crear y gestionar) con su propio espacio de trabajo. ¿Cómo se organiza la pantalla principal? (P-05)

## Factores de decisión

* Una sola interfaz para todo.
* Ver ambos espacios de un vistazo.
* Las acciones frecuentes, a un clic.
* HTML Service no tiene enrutado nativo.

## Opciones consideradas

* Panel con tres zonas: acciones rápidas + tabla Piscina/Jardín + tabla Habitación
* Todo en una sola pantalla larga
* Menú lateral con varias secciones
* Páginas independientes (una URL por función)

## Resultado de la decisión

Opción elegida: "Panel con tres zonas", porque ofrecía una vista resumen inmediata y accesos directos sin navegación compleja. Cada tabla de espacio admitía una consulta por fecha, con estado vacío "No hay reservas registradas" y un botón "Crear Reserva".

### Consecuencias

* Buena, porque daba una vista resumen inmediata de ambos espacios.
* Mala, porque mezclaba registrar, gestionar y analizar en una sola vista y no escalaba (motivo del reemplazo por ADR-0008).
* Mala, porque obligaba a implementar a mano la navegación entre vistas.

## Pros y contras de las opciones

### Pantalla larga única

* Mala, porque resultaba sobrecargada para el uso diario.

### Menú lateral

* Mala, porque era más complejo de lo necesario en ese momento.

### Páginas independientes

* Mala, porque contradecía el requisito de una única interfaz.

## Más información

* **Trazabilidad histórica:** US-004/US-005 de la v0.5 (hoy HU-04, HU-05)
* **Cuestiones que quedaron abiertas y resolvió ADR-0008:** columnas de las tablas, contenido de Crear y Gestionar, control de fecha de la consulta.
