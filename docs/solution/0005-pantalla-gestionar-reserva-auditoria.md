# ADR-0005: Pantalla "Gestionar Reserva" — edición con auditoría detallada y cancelación controlada

## Estado
Aceptado

## Contexto
- La pantalla "Crear Reserva" (ADR-0003) crea la reserva con sus valores iniciales; "Gestionar Reserva" es donde se completan y corrigen los datos a lo largo de la vida de la reserva: marcar el cobro como ingresado, subir el contrato, registrar incidencias, corregir un dato mal introducido, o cancelar la reserva.
- Requisito explícito: se debe poder editar casi cualquier valor de la reserva desde esta pantalla.
- Requisito explícito: cada cambio debe quedar registrado.
- `Estado_Reserva` es un campo calculado (ver ADR-0004): "Completada" nunca se marca a mano, y "Cancelada" es la única transición manual posible; conviene protegerlo de una edición libre que rompa esa regla.
- El contrato puede llegar como foto del documento en papel o como archivo digital, según el canal.

## Decisión
- **Acceso a la edición**: cada fila del listado tiene un botón **"Modificar"** que abre la reserva.
- **Datos de la reserva en solo lectura**: arriba de la edición se muestran **Espacio, Canal, Fechas y Servicios extra** (no editables en esta versión, para no rehacer la validación de solapamientos; ver Pendiente).
- **Campos editables**: en esta versión se editan huésped (nombre/teléfono/email), personas, importe del alquiler, % comisión, estado de cobro, estado del contrato, bloque de incidencias, checklists de check-in/out y notas. `ID_Reserva`, `Registrado_Por` y `Fecha_Registro` son inmutables; `Estado_Reserva` es calculado (no editable); Espacio/Canal/Fechas/Servicios quedan de solo lectura por ahora.
- **Auditoría de cambios**: cada vez que se guarda una edición desde "Gestionar Reserva", el sistema compara campo a campo el valor anterior con el nuevo, y por cada campo que cambie escribe una fila en una hoja propia `Historial_Cambios` (independiente de `Logs`/`Errores`, que son para eventos del sistema, no para el histórico de datos de negocio), con: Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo. Adicionalmente, se actualizan `Modificado_Por` y `Fecha_Última_Modificación` en la propia fila de `Reservas`.
- **Cancelación**: se realiza mediante un botón dedicado "Cancelar reserva" (nunca editando `Estado_Reserva` directamente), que pide confirmación explícita antes de ejecutar la acción. Al confirmar: `Estado_Reserva` pasa a "Cancelada", el cambio se registra en `Historial_Cambios` igual que cualquier otro campo, y se dispara el aviso de reapertura de disponibilidad en los demás canales activos (ya definido en una decisión anterior).
- **Subida de contrato**: campo de tipo archivo que acepta únicamente imagen (JPG/PNG) o PDF. El archivo se codifica en el cliente y se envía al servidor, que lo guarda en la carpeta de documentos de la reserva en Drive (estructura y nombres en ADR-0014) y enlaza la URL resultante en `Contrato_Archivo`, actualizando `Contrato_Estado` a "Firmado". El tamaño máximo del archivo se controla con `Tamano_Max_Contrato_MB` (`Config`).
- **Checklists de check-in/check-out**: dos campos `Checkin_Revisado` y `Checkout_Revisado` (Pendiente/Hecho) que el usuario marca tras repasar el checklist físico de preparación y de salida; informativos, no condicionan el estado (ver ADR-0004).
- **Vídeos in/out**: subida del vídeo grabado al terminar el check-in y antes del check-out, archivados en la carpeta de vídeos de la reserva en Drive (ADR-0014). Se podan automáticamente a los 180 días, por lo que no se enlazan en `Reservas`.

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
- ~~Definir un tamaño máximo razonable para el archivo del contrato subido.~~ Resuelto: `Tamano_Max_Contrato_MB` en `Config` (5 MB por defecto).
