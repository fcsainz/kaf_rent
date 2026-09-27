---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0014: Organización de Drive por espacio y reserva, y referencia de reserva `NN/AA`

## Contexto y planteamiento del problema

El sistema sube a Drive **documentos** (contrato firmado, foto del papel) y **vídeos de entrada y salida** (prueba del estado del espacio). Ya existe una estructura manual en Drive, con una carpeta por reserva y la referencia manual `NN/AA` (correlativo anual) más el nombre y la fecha `DDMMAA`. Lo automático debe convivir con lo manual y los ficheros deben localizarse por referencia y tipo. ¿Cómo organizamos Drive y qué forma tiene el `ID_Reserva`? (P-07, JTBD-07)

## Factores de decisión

* Convivir con la estructura y los nombres existentes (RNF-07).
* Localizar cualquier fichero por su referencia.
* Conservar los justificantes (RNF-36) y acotar el almacenamiento de los vídeos (RNF-35).
* `/` no es válido en nombres de Drive.

## Opciones consideradas

* Correlativo anual global (`AAAA-NNN` almacenado, `NN/AA` mostrado, `NN-AA` en Drive) + carpetas `{Tipo}/{Espacio}/{reserva}` con buscar-o-crear
* ID global sin reinicio anual (`R-0001`)
* Correlativo anual por espacio
* Carpeta plana sin subcarpeta por reserva

## Resultado de la decisión

Opción elegida: "Correlativo anual global + carpetas por espacio y reserva", porque respeta la operativa existente con un único contador.

- **`ID_Reserva`:** correlativo anual global; almacenado `AAAA-NNN` (ordenable), mostrado `NN/AA`, en Drive `NN-AA`. La conversión está centralizada (`referenciaMostrada`, `referenciaDrive`).
- **Carpetas** (las crea el código si no existen): `KAF. Documentos - KAF Rent/{Espacio}/KAF. Documentos {NN-AA} - {DDMMAA}/` y la carpeta de vídeos existente (se localiza la del espacio por texto parcial para respetar sus nombres manuales). Justificantes de gastos en `Documentos/Gastos/{Ejercicio}/` (ADR-0012). Copias en `Backups` (ADR-0013).
- **Nombres:** vídeos `Video In|Out {NN-AA} {Nombre} {DDMMAA}.ext`; documentos `{NN-AA} - {tipo} - {DDMMAA}.ext`.
- **Enlaces:** `Contrato_Archivo`, y `Video_In_Url` / `Video_Out_Url` en `Reservas` (*revisión 2026-06-29:* antes no se enlazaban los vídeos; ahora sí, también pegables a mano).
- **Retención:** documentos **nunca** se borran; vídeos a la papelera a los `Retencion_Videos_Dias` (180) días, en el trigger nocturno. Si la carpeta de la reserva queda vacía por la poda, se elimina (*revisión 2026-09-25, v2, B-07*).

| Clave de `Config` | Uso |
|---|---|
| `Carpeta_Raiz_Id` | Raíz del proyecto |
| `Carpeta_Videos_Id` | Carpeta de vídeos (ya existente) |
| `Carpeta_Documentos_Id` | Carpeta de documentos |
| `Retencion_Videos_Dias` | 180 por defecto |

### Consecuencias

* Buena, porque lo automático encaja con lo que ya había.
* Buena, porque cualquier fichero se localiza por su `NN-AA`.
* Buena, porque la poda acota el almacenamiento sin tocar justificantes.
* Mala, porque hay tres formas de la referencia; se centraliza la conversión.
* Mala, porque al borrar un vídeo a los 180 días su enlace queda roto y se pierde la prueba ante una reclamación tardía (riesgo **R-15**; el plazo es configurable).
* *Revisión 2026-09-25 (v2, B-10):* la carpeta de vídeos del espacio se reconoce por la primera palabra de su nombre (sin mapa fijo en el código).

### Confirmación

* Tests unitarios de `generarIdReserva`, `referenciaMostrada`, `referenciaDrive` y `validarArchivo` (RF-31, RF-54, RF-57).
* Test de integración contra una carpeta de pruebas de Drive (RF-58).

## Pros y contras de las opciones

### ID global sin reinicio

* Mala, porque rompe la referencia `NN/AA` que el equipo ya usa.

### Correlativo por espacio

* Mala, porque exige dos contadores; la separación por espacio ya la dan las carpetas.

### Carpeta plana

* Mala, porque el equipo ya agrupa todo lo de una reserva en su carpeta.

## Más información

* **Trazabilidad:** HU-16, HU-28, HU-30 · RF-31, RF-54, RF-57, RF-58, RF-65, RF-70 · RNF-07, RNF-35, RNF-36
* **Cuestiones abiertas:** catálogo de `{tipo}` de documento (F-10); ~~año del correlativo~~ → resuelto (D-04, 2026-09-27): año en que se crea la reserva (B-15); las referencias ya emitidas no cambian.
