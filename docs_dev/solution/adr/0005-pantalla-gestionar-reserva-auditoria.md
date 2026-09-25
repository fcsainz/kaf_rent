---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0005: "Gestionar Reserva" con edición auditada campo a campo y cancelación controlada

## Contexto y planteamiento del problema

"Crear Reserva" fija los valores iniciales; "Gestionar Reserva" es donde se completan y corrigen durante la vida de la reserva (cobro, contrato, incidencias, correcciones, cancelación). Requisitos explícitos: poder editar casi cualquier dato y que **cada cambio quede registrado**. `Estado_Reserva` es calculado (ADR-0004) y no debe poder romperse. ¿Cómo diseñamos la edición y la auditoría? (P-03, P-04, JTBD-03)

## Factores de decisión

* Trazabilidad completa: qué, quién, cuándo, antes y después (RNF-22).
* Proteger la regla de estado de ADR-0004.
* Evitar cancelaciones accidentales (RNF-10).
* Separar la auditoría de negocio de los logs técnicos.
* No reabrir la validación de solapamientos en esta versión (KISS).

## Opciones consideradas

* Auditoría campo a campo en una hoja propia `Historial_Cambios` + cancelación con botón dedicado y confirmación
* Registro genérico "reserva modificada" sin detalle
* Auditoría en la hoja `Logs`
* `Estado_Reserva` editable como desplegable libre

## Resultado de la decisión

Opción elegida: "Auditoría campo a campo en `Historial_Cambios` + cancelación con botón y confirmación", porque es la única que reconstruye exactamente cada cambio y protege el ciclo de vida.

- **Campos editables:** huésped (nombre, teléfono, email), personas, importe del alquiler, % comisión, cobro, contrato, bloque de incidencias, checklists y notas.
- **Inmutables:** `ID_Reserva`, `Registrado_Por`, `Fecha_Registro`. **Calculado:** `Estado_Reserva`.
- **Solo lectura en este formulario:** Espacio, Canal y Fechas (cambiarlos exige revalidar solapamientos → HU-38). Los servicios se editan en su propio bloque (HU-24).
- **Auditoría:** al guardar se compara campo a campo; por cada cambio, una fila `Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo`, y se actualizan `Modificado_Por` y `Fecha_Última_Modificación`.
- **Cancelación:** botón dedicado → modal → `Cancelada` + auditoría + aviso de reapertura (ADR-0006) + borrado del evento (ADR-0010).
- **Contrato:** JPG/PNG/PDF hasta `Tamano_Max_Contrato_MB` (5 MB por defecto) → Drive (ADR-0014) → `Contrato_Archivo` + "Firmado".
- **Checklists y vídeos:** ver ADR-0004 y ADR-0014.

### Consecuencias

* Buena, porque se puede reconstruir exactamente qué cambió, quién y cuándo.
* Buena, porque la regla de estado no se puede saltar desde la interfaz.
* Buena, porque la cancelación está protegida contra clics accidentales.
* Mala, porque `Historial_Cambios` crece una fila por campo cambiado (irrelevante con este volumen; archivable en el futuro).
* Mala, porque comparar campo a campo añade lógica al guardado.
* *Revisión 2026-09-25 (v2, B-04):* el servidor valida los valores de dominio de los campos de estado y rechaza editar, cambiar servicios o subir archivos a reservas canceladas. La edición muestra qué falta para completar (RF-51).

### Confirmación

* Tests unitarios de `aplicarCambios` (diffs y recálculo) y `validarCambiosReserva` (RF-46 a RF-48).
* Test de integración: editar → filas nuevas en `Historial_Cambios`.
* E2E: modal de cancelación (RF-52).

## Pros y contras de las opciones

### Registro genérico

* Mala, porque no dice qué cambió.

### Auditoría en `Logs`

* Mala, porque mezcla eventos técnicos con el histórico de negocio y complica consultar ambos.

### Estado editable

* Mala, porque permite completar sin cumplir la regla o cancelar sin aviso ni confirmación.

## Más información

* **Trazabilidad:** HU-23, HU-26, HU-27, HU-28, HU-38 · RF-45 a RF-47, RF-52 a RF-54, RF-80 · RNF-22
* **Cuestiones abiertas:** HU-38 (editar espacio, canal y fechas)
