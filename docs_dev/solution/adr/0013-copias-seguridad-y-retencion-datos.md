---
status: accepted; cadencia y rotación de las copias sustituidas por ADR-0016
date: 2026-06-29
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0013: Copias de seguridad del Sheet y purga de Logs y Errores en un único trigger nocturno

> **Sustituido en parte (2026-09-27):** la cadencia y la rotación de las copias (`Backup_Cada_Dias`, `Backup_Max_Copias`) las decide ahora [ADR-0016](0016-rotacion-copias-abuelo-padre-hijo.md) (abuelo-padre-hijo). El resto de este ADR sigue vigente.

## Contexto y planteamiento del problema

Toda la base de datos es un único Google Sheet (`BBDD_KAF_Rent`). Un borrado o una edición masiva errónea solo se podría deshacer con el historial de versiones de Google, que es incómodo y no se controla desde el proyecto. Además, `Logs` y `Errores` crecen sin límite y degradan las lecturas en bloque. Ya existe un trigger a las 03:00 (ADR-0009). ¿Cómo protegemos los datos y acotamos el crecimiento sin intervención manual? (P-12, JTBD-12)

## Factores de decisión

* Recuperación ante desastre con una ventana razonable (RNF-17).
* Lecturas rápidas: hojas técnicas acotadas (RNF-05).
* Automático y configurable sin código (RNF-27).
* Pocas ejecuciones programadas (cuota).

## Opciones consideradas

* Un único trigger nocturno con tareas independientes: copia del Sheet cada N días (conservando M) + purga de Logs y Errores por fecha
* Solo el historial de versiones de Google
* Exportar a CSV/XLSX
* Un trigger por tarea
* No purgar

## Resultado de la decisión

Opción elegida: "Un único trigger nocturno con tareas independientes", porque centraliza el mantenimiento, es configurable y consume poca cuota.

`tareasNocturnas` (03:00) ejecuta, cada una aislada con su propio try/catch: recálculo de estadísticas (ADR-0009) → **copia de seguridad** → **purga de Logs** → **purga de Errores** → **poda de vídeos** (ADR-0014).

| Clave de `Config` | Por defecto | Uso |
|---|---|---|
| `Carpeta_Backups_Id` | *(rellenar)* | Carpeta de las copias |
| `Backup_Cada_Dias` | 2 | Cadencia (se compara con la copia más reciente, sin segundo trigger) |
| `Backup_Max_Copias` | 15 | Copias conservadas (~30 días) |
| `Retencion_Logs_Dias` | 90 | Antigüedad máxima en `Logs` |
| `Retencion_Errores_Dias` | 365 | Antigüedad máxima en `Errores` |

La copia se llama `BBDD_KAF_Rent — backup AAAA-MM-DD`; las más antiguas se mandan a la papelera.

### Consecuencias

* Buena, porque permite recuperarse de un desastre sin coste.
* Buena, porque `Logs` y `Errores` quedan acotados.
* Buena, porque todo es configurable desde `Config`.
* Mala, porque la ventana de recuperación es de ~30 días (riesgo **R-14**; se amplía subiendo `Backup_Max_Copias`).
* Mala, porque la purga es destructiva: una retención mal configurada borra datos útiles (por eso compara por fecha y usa valores conservadores).

### Confirmación

* Tests unitarios de `tocaCopia`, `podarCopias` y `purgarHojaPorFecha` con dobles de Drive y Sheet (RF-68, RF-69).
* Revisión mensual de la carpeta Backups (DoD de release).

## Pros y contras de las opciones

### Solo el historial de versiones

* Mala, porque no se controla, no fija el número de copias y es difícil de restaurar si se borra la hoja entera.

### Exportar a CSV/XLSX

* Buena, porque permite una copia fuera de Google.
* Mala, porque se restaura peor que una copia nativa; queda como mejora.

### Un trigger por tarea

* Mala, porque multiplica los triggers y el riesgo de agotar la cuota.

### No purgar

* Mala, porque el crecimiento sin límite degrada el rendimiento.

## Más información

* **Trazabilidad:** RF-67 a RF-69, RF-71 · RNF-05, RNF-17, RNF-35 (sin HU: requisito técnico justificado)
* **Cuestiones abiertas:** exportar periódicamente fuera de Google (F-09); archivar las filas purgadas antes de borrarlas (F-09).
