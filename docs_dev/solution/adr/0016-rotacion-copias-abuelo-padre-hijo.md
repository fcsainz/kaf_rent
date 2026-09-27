---
status: accepted
date: 2026-09-27
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0016: Rotación abuelo-padre-hijo de las copias de seguridad del Sheet

Sustituye **solo la parte de cadencia y rotación de las copias** de [ADR-0013](0013-copias-seguridad-y-retencion-datos.md) (`Backup_Cada_Dias`, `Backup_Max_Copias`). El resto de ADR-0013 (trigger nocturno único, carpeta, purga de `Logs` y `Errores`) sigue vigente.

## Contexto y planteamiento del problema

ADR-0013 copia el Sheet cada 2 días y conserva las 15 últimas: la ventana de recuperación es de unos 30 días (riesgo **R-14**). Un error que se descubra al cabo de dos meses (una edición masiva, filas borradas, un cálculo fiscal que hay que rehacer con los datos de un mes cerrado) ya no tiene copia. ¿Cómo ampliamos la ventana a un año sin llenar Drive de copias? (P-12)

## Factores de decisión

* Ventana de recuperación larga, sobre todo para los datos de ejercicios fiscales cerrados (RNF-17, R-14).
* Pocas copias en la carpeta: se listan todas cada noche (RNF-05).
* Configurable sin código (RNF-27).
* Que una configuración errónea nunca borre todas las copias.

## Opciones consideradas

* Rotación abuelo-padre-hijo (GFS): copias diarias, semanales y mensuales
* Subir `Backup_Max_Copias` (p. ej. 180)
* Dejarlo como está (ADR-0013)

## Resultado de la decisión

Opción elegida: "Rotación abuelo-padre-hijo", aprobada por el usuario el 2026-09-27, porque cubre un año con unas 23 copias y es el estándar de copias de seguridad.

* **Copia:** cada noche en `tareasNocturnas` (03:00), si no hay ya una copia de hoy en la zona horaria del Sheet. Nombre: `BBDD_KAF_Rent — backup AAAA-MM-DD`.
* **Poda** (después de copiar), como la hacen `restic` o `borg` con `--keep-daily/--keep-weekly/--keep-monthly`: en los últimos N días, semanas (de lunes a domingo) y meses que tengan copia se conserva **la más reciente de cada uno**. Una copia puede contar en varios niveles. El resto va a la papelera de Drive, donde sigue recuperable 30 días.
* Función pura `copiasAConservar_` en `infra_mantenimiento.gs`; cada nivel vale como mínimo 1 aunque `Config` tenga un valor vacío o 0.

| Clave de `Config` | Por defecto | Uso |
|---|---|---|
| `Backup_Diarias` | 7 | Hijo: la última semana, día a día |
| `Backup_Semanales` | 4 | Padre: la última copia de cada una de las 4 últimas semanas |
| `Backup_Mensuales` | 12 | Abuelo: la última copia de cada uno de los 12 últimos meses |

`Backup_Cada_Dias` y `Backup_Max_Copias` dejan de usarse. Las filas del Sheet real se dejan donde están (solo cambios aditivos) y su descripción se marca como obsoleta.

### Consecuencias

* Buena, porque la ventana pasa de ~30 días a ~12 meses: R-14 queda mitigado para los errores que se descubren tarde.
* Buena, porque son pocas copias (≤ 23) y el Sheet ocupa KB: coste cero en Drive.
* Buena, porque la poda es una función pura con tests y no depende del nombre de los ficheros.
* Mala, porque entre copias semanales o mensuales se pierden los días intermedios: de hace tres meses solo queda la del último día de ese mes.
* Mala, porque la copia pasa a ser diaria (antes, cada 2 días): el doble de `makeCopy`, que sigue siendo muy poco frente a la cuota.
* Neutra: la copia sigue dentro de Google. La copia fuera de Google sigue pendiente (F-09).

### Confirmación

* Tests unitarios de `tocaCopia_`, `claveSemana_` y `copiasAConservar_` (un año de copias diarias → 7 + 4 + 12 como máximo; días repetidos; lista vacía).
* Test de endpoint: dos ejecuciones de `tareasNocturnas` el mismo día hacen una sola copia y podan las antiguas (RF-68).
* Revisión mensual de la carpeta Backups (DoD de release).

## Pros y contras de las opciones

### Subir `Backup_Max_Copias`

* Buena, porque no requiere código: solo cambiar un valor de `Config`.
* Mala, porque un año de copias cada 2 días son ~180 ficheros que se listan cada noche, y más allá de ese año no queda nada.

### Dejarlo como está

* Buena, porque no cuesta nada.
* Mala, porque R-14 sigue abierto: un error descubierto al cabo de un mes no tiene arreglo.

## Más información

* **Trazabilidad:** RF-68 · RNF-05, RNF-17, RNF-27 · R-14 (sin HU: requisito técnico justificado).
* **Cuestiones abiertas:** copia periódica fuera de Google y archivo de las filas purgadas (F-09, heredada de ADR-0013).
