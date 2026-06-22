# ADR-0005: Pantalla "Gestionar Reserva" — edición con auditoría detallada y cancelación controlada

## Estado
Aceptado

## Contexto
- La pantalla "Generar Reserva" (ADR-0003) crea la reserva con sus valores iniciales; "Gestionar Reserva" es donde se completan y corrigen los datos a lo largo de la vida de la reserva: marcar el cobro como ingresado, subir el contrato, registrar incidencias, corregir un dato mal introducido, o cancelar la reserva.
- Requisito explícito: se debe poder editar casi cualquier valor de la reserva desde esta pantalla.
- Requisito explícito: cada cambio debe quedar registrado.
- `Estado_Reserva` es un campo calculado (ver ADR-0004): "Completada" nunca se marca a mano, y "Cancelada" es la única transición manual posible; conviene protegerlo de una edición libre que rompa esa regla.
- El contrato puede llegar como foto del documento en papel o como archivo digital, según el canal.

## Decisión
- **Campos editables**: todos los campos de `Reservas` excepto `ID_Reserva`, `Registrado_Por` y `Fecha_Registro` (inmutables, son el origen de la reserva), y `Estado_Reserva` (campo calculado, no editable directamente — ver más abajo).
- **Auditoría de cambios**: cada vez que se guarda una edición desde "Gestionar Reserva", el sistema compara campo a campo el valor anterior con el nuevo, y por cada campo que cambie escribe una fila en una hoja propia `Historial_Cambios` (independiente de `Logs`/`Errores`, que son para eventos del sistema, no para el histórico de datos de negocio), con: Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo. Adicionalmente, se actualizan `Modificado_Por` y `Fecha_Última_Modificación` en la propia fila de `Reservas`.
- **Cancelación**: se realiza mediante un botón dedicado "Cancelar reserva" (nunca editando `Estado_Reserva` directamente), que pide confirmación explícita antes de ejecutar la acción. Al confirmar: `Estado_Reserva` pasa a "Cancelada", el cambio se registra en `Historial_Cambios` igual que cualquier otro campo, y se dispara el aviso de reapertura de disponibilidad en los demás canales activos (ya definido en una decisión anterior).
- **Subida de contrato**: campo de tipo archivo que acepta únicamente imagen (JPG/PNG) o PDF. El archivo se codifica en el cliente y se envía al servidor, que lo guarda en una carpeta de Drive y enlaza la URL resultante en `Contrato_Archivo`, actualizando `Contrato_Estado` a "Firmado".

## Alternativas consideradas
- **Registro genérico de "reserva modificada" sin detalle de campos**: descartado, no permitiría saber qué cambió exactamente si hay una discrepancia más adelante.
- **Guardar el histórico de cambios en la misma hoja `Logs`**: descartado, mezclaría eventos de sistema (errores, accesos denegados) con el histórico de datos de negocio, dificultando consultar cualquiera de los dos por separado.
- **Permitir editar `Estado_Reserva` como un desplegable libre**: descartado, permitiría marcar "Completada" a mano sin cumplir las condiciones de ADR-0004, o cancelar sin disparar el aviso de reapertura ni pedir confirmación.
- **Aceptar cualquier formato de archivo para el contrato**: descartado por simplicidad y para evitar archivos pesados o formatos innecesarios; JPG, PNG y PDF cubren los casos reales (foto del papel firmado, o documento firmado digitalmente).

## Consecuencias

**Positivas**
- Trazabilidad completa: se puede reconstruir exactamente qué cambió, cuándo y quién lo hizo, en cualquier reserva.
- Protege la integridad de la regla de negocio de `Estado_Reserva` (ADR-0004), al no permitir editarlo libremente.
- El proceso de cancelación queda protegido contra clics accidentales, gracias a la confirmación explícita.

**Negativas / riesgos**
- `Historial_Cambios` puede crecer con rapidez si hay muchas ediciones (cada campo cambiado es una fila); con tres usuarios y el volumen de este proyecto no es un problema, pero conviene tenerlo en cuenta si en el futuro se quisiera limpiar o archivar este histórico.
- Comparar campo a campo en cada guardado añade algo de lógica adicional al código de actualización, frente a simplemente sobrescribir la fila; es la complejidad necesaria para cumplir el requisito de auditoría.

## Pendiente
- Definir el diseño visual/disposición de los campos en la pantalla "Gestionar Reserva" (agrupación, qué se ve siempre vs. qué se despliega según el estado de incidencias).
- Definir un tamaño máximo razonable para el archivo del contrato subido.
