# ADR-0014: Organización de Drive — documentos, vídeos in/out y referencia de reserva

## Estado
Aceptado

## Contexto
- El sistema sube a Drive dos tipos de archivo asociados a una reserva: **documentos** (contrato firmado, foto del documento en papel — ver ADR-0005) y **vídeos in/out** (se graba un vídeo al terminar el check-in y otro antes del check-out, como prueba del estado del espacio).
- Ya existe una estructura manual en Drive que conviene respetar para que lo subido a mano y lo automático convivan:
  ```
  Mi unidad / KAF. KAF Rent /                         ← raíz del proyecto
    ├── BBDD_KAF_Rent                                  ← el Sheet (base de datos)
    └── KAF. Videos - KAF Rent /                       ← id 1vWWE2MDiOD5aUeQ2Ac6jhFcGV0NcsGBU
        ├── KAF. VIdeos in-out - Habitacion /
        └── KAF. VIdeos in-out - Piscina /
            └── KAF. Videos 01/26 - 270626 /           ← una carpeta por reserva
                ├── Video In 01/26 M Angeles 270626.mp4
                └── Video Out 01/26 M Angeles 270626.mp4
  ```
- La referencia que el equipo usa a mano para una reserva es un **correlativo anual `NN/AA`** (`01/26`), acompañado del nombre del huésped y la fecha (`270626`, DDMMAA). Esto condiciona el formato del `ID_Reserva` que genera la app.
- Requisito explícito: los archivos deben localizarse por la referencia de la reserva y por el tipo de documento que son.

## Decisión

### Referencia de reserva (`ID_Reserva`)
- El `ID_Reserva` es un **correlativo anual global** que reinicia cada año: la primera reserva de 2026 es la `01/26`, la segunda `02/26`, etc. (un único contador para todos los espacios).
- Se **almacena** en la hoja `Reservas` en forma ordenable `AAAA-NNN` (`2026-001`) para que ordene y no dependa del separador.
- Se **muestra** al usuario como `NN/AA` (`01/26`).
- En **nombres de carpeta y fichero de Drive** se usa la forma segura `NN-AA` (`01-26`), evitando el `/`.

### Estructura de carpetas
Cuelga toda de la raíz del proyecto. Tanto vídeos como documentos se organizan **por Espacio → reserva** (simétrico):

```
KAF. KAF Rent /                                  ← Carpeta_Raiz_Id
  ├── KAF. Videos - KAF Rent /                   ← Carpeta_Videos_Id (ya existe)
  │   └── {Espacio} / {reserva} / Video In|Out…
  ├── KAF. Documentos - KAF Rent /               ← Carpeta_Documentos_Id (a crear)
  │   └── {Espacio} / {reserva} / documentos…
  └── KAF. Backups - KAF Rent /                  ← Carpeta_Backups_Id (ADR-0013)
```

El código **busca-o-crea** la subcarpeta de Espacio y la de reserva si no existen, de modo que añadir un espacio nuevo o una reserva no requiere preparar carpetas a mano.

### Convención de nombres (coherente con lo ya existente)
- Carpeta de reserva: `KAF. {tipo} {NN-AA} - {DDMMAA}` (p. ej. `KAF. Videos 01-26 - 270626`).
- Vídeos: `Video In {NN-AA} {Nombre} {DDMMAA}.mp4` / `Video Out {NN-AA} {Nombre} {DDMMAA}.mp4`.
- Documentos: `{NN-AA} - {tipo} - {DDMMAA}.{ext}` (p. ej. `01-26 - contrato - 270626.pdf`). El `{tipo}` identifica qué documento es (contrato, dni, etc.).

### Retención
- **Documentos: no se borran.** Son justificantes (contratos) que deben conservarse; coherente con la conservación ≥ 4 años del módulo IRPF (ADR-0012).
- **Vídeos in/out: se borran a los `Retencion_Videos_Dias` días** (por defecto **180**), por el peso de almacenamiento. La poda la ejecuta el trigger de mantenimiento nocturno de ADR-0013, recorriendo las carpetas de reserva bajo `Carpeta_Videos_Id` y eliminando los ficheros (y la carpeta de reserva si queda vacía) con antigüedad mayor al umbral.

### Parámetros en `Config`
| Clave | Valor por defecto | Propósito |
|---|---|---|
| `Carpeta_Raiz_Id` | *(vacío)* | Carpeta raíz del proyecto (`KAF. KAF Rent`) |
| `Carpeta_Videos_Id` | `1vWWE2MDiOD5aUeQ2Ac6jhFcGV0NcsGBU` | Carpeta de vídeos in/out (ya existe) |
| `Carpeta_Documentos_Id` | *(vacío, a crear)* | Carpeta de documentos/contratos |
| `Retencion_Videos_Dias` | `180` | Días que se conservan los vídeos antes de borrarlos |

(`Carpeta_Backups_Id` y los parámetros de copia/retención de datos están en ADR-0013.)

## Alternativas consideradas
- **`ID_Reserva` único global `R-0001`** (sin reinicio anual): descartado; rompería con la referencia `NN/AA` que el equipo ya usa a mano en Drive y en su operativa.
- **Correlativo anual por espacio** (cada espacio empieza en `01` cada año): descartado por mantener dos contadores; el correlativo global es más simple y la separación por espacio ya la da la estructura de carpetas.
- **Carpeta plana con nombre por reserva** (sin subcarpeta por reserva): descartado; el equipo ya agrupa por carpeta de reserva y facilita ver de un vistazo todo lo de una reserva (vídeo in, vídeo out, documentos).
- ~~**Guardar la URL del vídeo en una columna de `Reservas`**~~: **revisado en implementación (2026-06-29):** se guardan los enlaces en `Video_In_Url` / `Video_Out_Url` de `Reservas`. Es más fiable que adivinar la carpeta/nombre, permite **enlazar a mano** los vídeos ya existentes (editando la celda) y la subida desde la app rellena la celda sola. Contrapartida: si el vídeo se borra a los 180 días, el enlace queda roto (asumido). La subida sigue archivando el fichero en `Videos/{Espacio}/{reserva}` con la convención de nombres.
- **Borrar también los documentos por antigüedad**: descartado; son justificantes con obligación de conservación (ADR-0012).

## Consecuencias

**Positivas**
- Lo automático encaja con lo que ya hay en Drive; no hay dos sistemas de nombres conviviendo.
- Localizar cualquier archivo de una reserva es trivial por su referencia `NN-AA`.
- El borrado de vídeos acota el almacenamiento sin tocar los justificantes legales.

**Negativas / riesgos**
- El `/` de la referencia obliga a mantener tres formas (almacenada `2026-001`, mostrada `01/26`, Drive `01-26`); se centraliza la conversión en una utilidad para no repetir la regla.
- Borrar los vídeos a 180 días elimina una posible prueba ante una reclamación de daños posterior a ese plazo; el periodo es configurable en `Config` (ver Risk Register R-14).
- `buscar-o-crear` carpetas añade lecturas a Drive por subida; con el volumen del proyecto es irrelevante, pero conviene cachear los IDs de carpeta dentro de una ejecución.

## Pendiente
- Confirmar el catálogo de `{tipo}` de documento (contrato, dni, otros) y si alguno tiene tratamiento especial.
- Confirmar el mapeo exacto entre el valor de `Espacio` (`Piscina / Jardín`, `Habitación Interior`) y el nombre de su subcarpeta ya existente, o si el código las renombra/normaliza.
