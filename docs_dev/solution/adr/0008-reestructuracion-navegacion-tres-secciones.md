---
status: accepted
date: 2026-06-29
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0008: Navegación con Inicio (hub) y secciones por tarea (Crear, Gestionar, Estadísticas, Gastos)

> Reemplaza a [ADR-0002](0002-estructura-interfaz-principal.md).

## Contexto y planteamiento del problema

El panel único de ADR-0002 mezclaba registrar, gestionar y analizar. Con el uso real conviene separar cada tarea en su sección y tener un Inicio que oriente. Además aparece una sección de Estadísticas (ADR-0009) que no encajaba en el panel. HTML Service sigue sin enrutado nativo. Un prototipo de baja fidelidad validó la estructura. ¿Cómo organizamos la navegación? (P-05, P-11)

## Factores de decisión

* Llegar rápido a la tarea concreta (RNF-08).
* Una tarea principal por pantalla (CLAUDE.md §6).
* Sitio para Estadísticas y Gastos sin contaminar la gestión.
* Sin enrutado nativo: navegación en el cliente.

## Opciones consideradas

* Inicio (hub) + secciones por tarea, con navegación en el cliente
* Mantener el panel de ADR-0002
* Menú lateral
* Tabla de últimas reservas dentro de "Crear Reserva"

## Resultado de la decisión

Opción elegida: "Inicio (hub) + secciones por tarea", porque cada tarea gana su espacio y el Inicio da contexto inmediato.

**Inicio:** título; accesos **Crear Reserva, Gestionar Reserva, Estadísticas, Gastos**; tabla "5 Últimas Reservas" (por `Fecha_Registro`, ordenable: Espacio, Fecha Inicio, Fecha Fin, Nombre, Importe Neto); **Buscar Reserva** (nombre y/o fecha); enlace al calendario (ADR-0010).
> *Revisión 2026-06-29:* el buscador se trasladó de "Crear Reserva" al Inicio porque confundía dentro del formulario.

**Crear Reserva:** el formulario de ADR-0003. La validación de solapamientos al guardar es la garantía; el buscador es solo una comprobación previa.

**Gestionar Reserva:**
- Vista estándar: **todas las no canceladas** (Abiertas y Completadas, sin importar la fecha). *(Revisión 2026-06-29: antes se ocultaban las Completadas vencidas.)*
- Columnas: Estado (badge), ID, Canal, Entrada, Salida, Personas, Check-in, Check-out, Nombre, Ingreso (badge) + **Ver más** (ficha de solo lectura: resumen económico, documentos, resto) y **Modificar** (edición, ADR-0005). Ambas se despliegan a ancho completo bajo la tabla; en móvil la tabla tiene scroll horizontal.
- Filtros: "Próxima Semana" / "Próximo Mes" y búsqueda por nombre.

**Estadísticas:** ADR-0009. **Gastos:** ADR-0012.

**Navegación:** en el cliente, mostrando y ocultando secciones (`navegar(...)`).

### Consecuencias

* Buena, porque cada tarea tiene su espacio y el Inicio orienta.
* Buena, porque Estadísticas y Gastos tienen sitio natural.
* Mala, porque hay más vistas que mantener a mano sin enrutado nativo.
* Mala, porque las tablas del Inicio y de Gestionar leen el Sheet: hay que leer en bloque (RNF-05).

### Confirmación

* E2E de navegación (HU-05) y de la lista con filtros (HU-21).
* UAT con los journeys J-1 a J-5 (RNF-08).

## Pros y contras de las opciones

### Panel de ADR-0002

* Mala, porque mezcla tareas y no escala.

### Menú lateral

* Mala, porque es innecesario con cuatro accesos.

### Últimas reservas dentro de Crear

* Mala, porque en el Inicio sirven de resumen común a todas las tareas (validado en el prototipo).

## Más información

* **Trazabilidad:** HU-04 a HU-06, HU-21, HU-22 · RF-07 a RF-11, RF-13, RF-42 a RF-44 · RNF-08
* **Resuelto desde la v0.5:** columnas de Gestionar; criterio del buscador con los dos campos (se combinan con Y); estilo visual (ADR-0011).
