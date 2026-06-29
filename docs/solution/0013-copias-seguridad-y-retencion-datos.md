# ADR-0013: Copias de seguridad del Sheet y retención de datos (Logs, Errores, vídeos)

## Estado
Aceptado

## Contexto
- Toda la base de datos vive en un único Google Sheet (`BBDD_KAF_Rent`). Un borrado accidental, una edición masiva errónea o una corrupción de datos no tendría vuelta atrás más allá del historial de versiones nativo de Google, que no es cómodo de restaurar ni se controla desde el proyecto.
- Las hojas `Logs` y `Errores` crecen indefinidamente (una fila por acceso, por error registrado). Sin una política de retención acaban degradando el rendimiento de las lecturas en bloque y dificultando la consulta.
- El proyecto corre en una cuenta de Google personal, con cuotas limitadas; conviene que el mantenimiento sea automático y barato, sin intervención manual.
- Ya existe un trigger temporal nocturno a las 03:00 para recalcular `Estadisticas_Cache` (ADR-0009): es el sitio natural donde colgar el resto de tareas de mantenimiento programado.

## Decisión
Se centraliza todo el mantenimiento programado en un **trigger temporal nocturno** (alineado con el de estadísticas, 03:00) que ejecuta, en orden, tres tareas independientes y tolerantes a fallo (si una falla, se registra en `Errores` y las demás continúan):

1. **Copia de seguridad del Sheet** — cada `Backup_Cada_Dias` (por defecto **2**), se copia el fichero del Sheet (`DriveApp.getFileById(...).makeCopy(...)`) a la carpeta `Carpeta_Backups_Id` de Drive, con nombre `BBDD_KAF_Rent — backup AAAA-MM-DD`. Tras copiar, se **podan las copias más antiguas dejando las últimas `Backup_Max_Copias`** (por defecto **15** → ~30 días de histórico con cadencia de 2 días).
2. **Purga de `Logs`** — se eliminan las filas con `Fecha_Hora` anterior a `Retencion_Logs_Dias` (por defecto **90**) días.
3. **Purga de `Errores`** — se eliminan las filas con `Fecha_Hora` anterior a `Retencion_Errores_Dias` (por defecto **365**) días.

La **retención de los vídeos in/out** (180 días) se ejecuta en este mismo trigger pero su lógica y parámetro (`Retencion_Videos_Dias`) se definen en **ADR-0014**, por pertenecer al almacenamiento de Drive.

Todos los parámetros viven en `Config` (nunca hardcodeados, CLAUDE.md §2.10):

| Clave | Valor por defecto | Propósito |
|---|---|---|
| `Carpeta_Backups_Id` | *(vacío, se rellena tras crear la carpeta)* | Carpeta de Drive donde se guardan las copias del Sheet |
| `Backup_Cada_Dias` | `2` | Cada cuántos días se hace copia |
| `Backup_Max_Copias` | `15` | Cuántas copias se conservan (se podan las más antiguas) |
| `Retencion_Logs_Dias` | `90` | Días que se conservan las filas de `Logs` |
| `Retencion_Errores_Dias` | `365` | Días que se conservan las filas de `Errores` |

La cadencia "cada 2 días" se controla en código comparando la fecha actual con la de la última copia existente en la carpeta (no con un segundo trigger), de modo que el trigger nocturno es uno solo y la frecuencia es un parámetro de `Config`.

## Alternativas consideradas
- **Confiar solo en el historial de versiones de Google Sheets**: descartado; no se controla desde el proyecto, no permite fijar una política de número de copias ni restaurar un fichero independiente, y un borrado de la hoja completa lo complica.
- **Exportar a CSV/XLSX en vez de copiar el Sheet**: descartado para la primera versión; una copia nativa del Sheet se restaura con un clic y conserva fórmulas/formato. Se puede añadir export más adelante si se quiere una copia fuera de Google.
- **Un trigger distinto por tarea (backup, purga logs, purga errores)**: descartado; multiplica los triggers a mantener y el riesgo de tocar cuotas, sin ganancia. Un único trigger nocturno orquesta todo.
- **No purgar `Logs`/`Errores`**: descartado; el crecimiento ilimitado degrada las lecturas en bloque (el cuello de botella real en GAS) y dificulta la consulta.

## Consecuencias

**Positivas**
- Recuperación ante desastre real y controlada desde el proyecto, sin coste de infraestructura.
- `Logs` y `Errores` acotados, manteniendo las lecturas en bloque rápidas.
- Todo configurable desde `Config` sin tocar código (cambiar cadencia o retención es editar una celda).

**Negativas / riesgos**
- La ventana de recuperación es de ~30 días (2 días × 15 copias); una corrupción no detectada en ese plazo no tendría copia. Mitigable subiendo `Backup_Max_Copias` (ver Risk Register R-13).
- La purga de `Logs`/`Errores` es destructiva: un periodo de retención mal configurado borraría datos útiles. Por eso son parámetros de `Config` con valores conservadores y la purga compara contra `Fecha_Hora`, no contra el orden de filas.
- Las tareas de mantenimiento consumen cuota de Apps Script/Drive; al ser nocturnas y de bajo volumen, el impacto es despreciable.

## Pendiente
- Confirmar el formato exacto del nombre de la copia y si se quiere, además, una exportación periódica fuera de Google (p. ej. a otra cuenta).
- Decidir si la purga de `Logs`/`Errores` archiva las filas borradas en algún sitio antes de eliminarlas (hoy se eliminan sin archivar).
