---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0003: Formulario "Crear Reserva" personalizado con catálogos configurables en cascada

## Contexto y planteamiento del problema

Hay varios espacios (Piscina/Jardín, Habitación Interior y quizá más en el futuro), cada uno con sus canales, servicios extra y forma de indicar fechas (día + franja horaria, o rango de noches). Hay que poder añadir o desactivar espacios, canales y servicios **sin tocar código**, y dar a usuarios no técnicos un formulario que les guíe y calcule los importes. ¿Cómo construimos el formulario de alta? (P-11, P-08, JTBD-11)

## Factores de decisión

* Configurable sin código (RNF-27).
* Usabilidad para no técnicos: campos dependientes, validación inmediata, solo opciones válidas (RNF-08, RNF-09).
* Un único modelo de fechas para validar solapamientos e informar (P-01).
* Importes coherentes y no manipulables desde el cliente (RNF-24).
* Coste cero.

## Opciones consideradas

* Formulario HTML propio servido por Apps Script + tres catálogos en cascada en el Sheet
* Google Forms
* Formulario propio con espacios, canales y servicios fijos en el código
* Un único modo de fecha para todos los espacios

## Resultado de la decisión

Opción elegida: "Formulario HTML propio + catálogos en cascada", porque es la única que combina configuración sin código con una experiencia guiada y validación en dos capas.

**Catálogos** (editables en el Sheet):

| Hoja | Columnas |
|---|---|
| `Catálogo_Espacios` | Nombre_Espacio, Activo, Modo_Fecha (`Dia_y_Hora` \| `Rango_Dias`) |
| `Catálogo_Canales` | Espacio, Nombre_Canal, Activo, %_Comisión_Default, Gestión_Contrato (`Automática` \| `Manual`), Coste_Fijo_Por_Reserva |
| `Catálogo_Servicios_Extra` | Espacio, Nombre_Servicio, Activo, Coste_Unitario, Precio_Unitario |

**Campos y comportamiento:**
1. **Espacio**: solo activos. Al cambiarlo se vacían canal, servicios y fechas.
2. **Canal**: filtrado por espacio; autocompleta `%_Comisión` (editable, 0–100).
3. **Fechas** según `Modo_Fecha`: `Dia_y_Hora` → fecha + hora de llegada + hora de salida; `Rango_Dias` → entrada + salida. No se admiten fechas pasadas. Siempre se guarda `Fecha_Hora_Inicio`/`Fin` completos (en `Rango_Dias`, con las horas de check-in y check-out de `Config`).
4. **Personas**: adultos ≥ 1, menores ≥ 0.
5. **Servicios extra** con cantidad ≥ 1, en la hoja `Reserva_Servicios` (una fila por servicio) con **snapshot** del coste y el precio unitarios, para que un cambio de tarifa no altere reservas pasadas.
6. **Huésped**: nombre obligatorio; teléfono (9 cifras) y email opcionales, validados en cliente y servidor.
7. **Importe del alquiler** (manual, ≥ 0) y **resumen económico en vivo**; el servidor recalcula de forma autoritativa ([arc42 §8.2](../arc42.md#82-modelo-de-importes)):
   - Bruto = alquiler + Σ(cantidad × precio)
   - Comisión = bruto × % / 100 (también sobre los servicios)
   - Margen de servicios = Σ(cantidad × (precio − coste))
   - Neto = bruto − comisión − Σ(cantidad × coste) − coste fijo del canal (snapshot)
8. **Servicios añadidos después** (HU-24): se recalculan servicios, bruto, margen y neto, pero **no la comisión** (acuerdo directo con el huésped, sin el canal) ni el coste fijo del canal.

### Consecuencias

* Buena, porque añadir un canal, un servicio o un espacio es editar una fila.
* Buena, porque la experiencia es mejor que la de un formulario genérico (validación inmediata, campos que se adaptan).
* Buena, porque hay un único modelo de fechas para solapamientos, calendario e informes.
* Mala, porque es más código que Google Forms: campos dependientes y llamadas a los catálogos.
* Mala, porque editar a mano un catálogo con columnas mal puestas rompe el formulario; la convención de columnas debe estar documentada (arc42 §8.1).
* *Revisión 2026-09-25 (v2, B-10):* ya no hay nombres de espacio en el código: Drive, Calendar y Gastos los toman del catálogo; la fórmula de importes vive en un único sitio (`calcularImportes_`).

### Confirmación

* Tests unitarios de `calcularImportesReserva`, `construirFechas`, `validarDatosReserva` y `resolverLineasServicio` (RF-19 a RF-27).
* E2E del formulario con `google.script.run` simulado (cascada, validaciones, resumen en vivo).

## Pros y contras de las opciones

### Google Forms

* Buena, porque no hay que programarlo.
* Mala, porque no permite campos dependientes de datos del Sheet ni el nivel de validación buscado.

### Valores fijos en el código

* Buena, porque es lo más simple de programar.
* Mala, porque obliga a cambiar el código para cada canal o servicio nuevo.

### Un único modo de fecha

* Mala, porque perjudica a uno de los dos espacios (franja horaria frente a rango de noches).

## Más información

* **Trazabilidad:** HU-08 a HU-15, HU-24 · RF-14 a RF-30, RF-48, RF-49 · RNF-24, RNF-27
* **Relacionados:** ADR-0004 (estado inicial), ADR-0008 (ubicación en la navegación)
* **Cuestiones abiertas:** ninguna
