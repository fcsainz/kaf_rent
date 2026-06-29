# ADR-0004: Ciclo de vida y estado de la reserva (Estado_Reserva, Cobro, Contrato, Incidencias)

## Estado
Aceptado

## Contexto
- Una reserva pasa por varias fases después de creada: cobro del importe (gestionado manualmente, porque cada canal tiene sus propios tiempos y formas de pago), gestión documental del contrato (algunos canales lo gestionan ellos mismos, otros requieren subir un documento firmado a mano), y posibles incidencias/roturas durante la estancia que pueden implicar una compensación económica pendiente de recibir.
- Ya existía un campo `Estado` pensado para Confirmada/Cancelada/Pendiente, ligado a la validación de solapamientos. Al necesitarse ahora un estado de "Abierta/Completada", surgía el riesgo de tener dos campos de estado que pudieran contradecirse entre sí.
- Requisito explícito: una reserva no puede darse por completada si el cobro no está ingresado, o si hay una incidencia cuya compensación no se ha recibido todavía.
- Confirmado: la necesidad de gestión manual de contrato depende del Canal (cada app/vía tiene su propia política), no del Espacio.

## Decisión
Se unifica todo en un único campo `Estado_Reserva`, con tres valores posibles:

- **Abierta**: valor por defecto al crear la reserva.
- **Completada**: nunca se marca a mano; el sistema la calcula automáticamente cuando se cumplen a la vez: `Estado_Cobro = "Ingresado"` y (`Incidencias = "Sin incidentes"` o `Incidencia_Resuelta = "Sí"`). La incidencia se considera cerrada cuando se marca como resuelta, **se haya compensado o no**; `Compensación_Daños` pasa a ser un dato informativo (si se recibió o no compensación) y deja de ser condición de cierre.
- **Cancelada**: se marca manualmente desde "Gestionar Reserva"; al cancelarse dispara el aviso de reapertura de disponibilidad en los demás canales (ya definido para espacios con más de un canal activo).

Campos asociados, todos gestionados después de la creación —no en el formulario "Crear Reserva", que solo fija sus valores iniciales por defecto—:

| Campo | Valor inicial | Quién/cuándo lo cambia |
|---|---|---|
| `Estado_Cobro` | No ingresado | Manualmente, al comprobar que ha entrado el pago de ese canal |
| `Contrato_Estado` | "Gestionado por canal" si `Gestión_Contrato` del canal es Automática; "Pendiente" si es Manual | Manualmente, subiendo el documento (foto o archivo digital) a una carpeta de Drive desde "Gestionar Reserva" |
| `Incidencias` | Sin incidentes | Manualmente, si ocurre algo durante la estancia |
| `Incidente_Comunicado` | (solo aplica si Incidencias = Con incidentes) | Sí/No, manual |
| `Compensación_Daños` | No recibida (solo aplica si Incidencias = Con incidentes) | Manualmente, cuando se recibe — informativo, no condiciona el cierre |
| `Incidencia_Resuelta` | No (solo aplica si Incidencias = Con incidentes) | Manualmente, al dar por cerrada la incidencia (compensada o no); es la condición que permite completar la reserva |
| `Checkin_Revisado` | Pendiente | Manualmente, al revisar el checklist de check-in (preparación del espacio) |
| `Checkout_Revisado` | Pendiente | Manualmente, al revisar el checklist de check-out (estado del espacio tras la estancia) |

Los dos campos de revisión (`Checkin_Revisado` / `Checkout_Revisado`) reflejan el repaso del checklist físico de preparación/salida; son informativos y **no condicionan** el cálculo de `Estado_Reserva`.

## Alternativas consideradas
- **Mantener `Estado` (Confirmada/Cancelada/Pendiente) y `Estado_Reserva` (Abierta/Completada) como campos separados**: descartado, dos campos de estado pueden acabar contradiciéndose (p. ej. "Cancelada" en uno y "Completada" en otro) y complica la lógica sin necesidad real.
- **Permitir marcar "Completada" manualmente**: descartado, contradice el requisito explícito de que no se pueda completar con cobro pendiente o incidencias sin resolver; dejarlo automático evita errores humanos.
- **Que la gestión de contrato dependa del Espacio en vez del Canal**: descartado; según lo confirmado, la obligación de contrato depende de la política de cada canal/app, no del espacio físico.

## Consecuencias

**Positivas**
- Un único campo de estado, sin ambigüedad ni riesgo de contradicción entre dos indicadores distintos.
- El cierre de una reserva queda protegido por una regla de negocio automática, no depende de que alguien se acuerde de comprobarlo a mano.
- La gestión documental del contrato se adapta automáticamente a la política de cada canal, sin intervención manual cuando el canal ya lo gestiona.

**Negativas / riesgos**
- Si en el futuro aparecen más condiciones para "Completada" (por ejemplo, una firma de conformidad del huésped), hay que tocar la función que calcula este estado; conviene centralizarla bien en el código para no repetir la regla en varios sitios.
- Al ser un estado calculado y no editable a mano, si algún dato se introduce mal (p. ej. `Estado_Cobro` mal marcado), la reserva puede quedar "atascada" en Abierta sin que sea evidente por qué; "Gestionar Reserva" deberá mostrar claramente qué condición falta para completarse.

## Pendiente
- Diseñar el detalle de la pantalla "Gestionar Reserva" donde se editan estos campos.
- ~~Definir la estructura de carpetas en Drive donde se archivan los contratos subidos manualmente.~~ Resuelto en ADR-0014.
