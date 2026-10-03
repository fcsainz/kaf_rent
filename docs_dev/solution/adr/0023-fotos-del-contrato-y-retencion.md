---
status: accepted
date: 2026-10-03
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0023: El contrato de Exterior se guarda en fotos y se borra a los 5 años de la salida

Revisa la parte de contratos de [ADR-0014](0014-organizacion-drive-documentos-videos.md) (un único archivo por contrato) y de RF-55 (sin contrato si lo gestiona el canal). El resto de ADR-0014 sigue vigente.

## Contexto y planteamiento del problema

En la Piscina / Jardín (Exterior) la obligación de cada estancia es firmar el contrato, como en la Habitación lo es validar las identidades. Hoy el contrato firmado solo existe en papel. La app permitía subir un único archivo, y no en las reservas cuyo canal "gestiona el contrato". El usuario pide (2026-10-03, punto 4.4.8):

* subir las fotos del contrato desde el móvil, en una carpeta de la reserva;
* que la subida marque el contrato como firmado;
* que se borren pasado un tiempo, sin tener que acordarse.

## Factores de decisión

* Con el móvil, un contrato de varias páginas son varias fotos, no un PDF.
* Guardar datos personales solo el tiempo necesario (RGPD, minimización; EXT-02).
* Poder defenderse ante una reclamación por daños o impago durante el plazo en que se puede reclamar.
* Coste cero y sin mantenimiento manual.

## Opciones consideradas

* **Carpeta "Contrato" por reserva y borrado a los 5 años de la salida** (Q-11)
* Un único PDF por contrato, sin borrado (como hasta ahora)
* Carpeta de fotos y borrado a los 4 años

## Resultado de la decisión

Opción elegida: "Carpeta Contrato por reserva y borrado a los 5 años de la salida" (respuestas del usuario Q-10 y Q-11, y OK al ADR, 2026-10-03).

* Las fotos (o un PDF) se suben desde la función *Contrato* de la barra de Reservas a `Documentos/{Espacio}/KAF. Documentos {NN-AA} - {DDMMAA}/Contrato`. `Contrato_Archivo` guarda el enlace a la carpeta.
* La primera foto marca el contrato *Firmado* y anota quién (`Contrato_Firmado_Por`) y cuándo (`Contrato_Fecha`). Las siguientes se añaden sin volver a firmar. Es la única forma de marcarlo *Firmado*: en la ficha no se edita a mano (DI-18).
* Aplica a **todas** las reservas de Exterior, también a las de contrato "Gestionado por canal" (Q-10, DI-04 confirmada el 2026-10-03). Nunca a Interior.
* Formatos: PDF, JPG, JPEG, PNG y HEIC. Tamaño máximo por archivo: `Tamano_Max_Contrato_MB` = 15 MB (DI-10), porque las fotos del móvil pasan a menudo de 5 MB.
* La tarea nocturna manda a la papelera de Drive (recuperable 30 días) la carpeta de las reservas cuya salida tenga más de `Config.Anios_Retencion_Contrato` (5) años. Vacía `Contrato_Archivo` (el contrato sigue constando como *Firmado*) y lo anota en `Historial_Cambios`.
* **Por qué 5 años:** es el plazo general de prescripción de las acciones personales sin plazo especial (art. 1964.2 del Código Civil, desde la Ley 42/2015). Cubre también los 4 años de la prescripción tributaria (art. 66 de la Ley General Tributaria) y cumple RNF-36 (≥ 4 años). No es asesoramiento jurídico: se revisa en EXT-02 (RGPD).

### Consecuencias

* Buena, porque el contrato queda junto a la reserva y se sube en segundos desde el móvil.
* Buena, porque el borrado es automático y queda trazado: no se guardan datos personales más de lo necesario.
* Mala, porque una reclamación posterior a los 5 años ya no tendría el contrato (sí la reserva y su historial).
* Mala, porque añade una poda más en la tarea nocturna, con llamadas a Drive (pocas por noche).

### Confirmación

* `tests/endpoints/documentos_informes_gastos.test.js` (F-41): carpeta, firma con autor y fecha, varias fotos, formatos, Exterior sí / Interior no.
* `tests/endpoints/avisos_puesta_al_dia.test.js` y `tests/dominio/reservas_dd03.test.js` (F-41): caducidad a los 5 años, papelera, enlace vacío e historial.
* Smoke en `/dev`: subir una foto desde el móvil y ver la carpeta en Drive.

## Pros y contras de las opciones

### Un único PDF por contrato, sin borrado

* Buena, porque no cambia nada.
* Mala, porque obliga a escanear en PDF y conserva datos personales sin límite.

### Carpeta de fotos y borrado a los 4 años

* Buena, porque guarda menos tiempo los datos personales.
* Mala, porque deja sin contrato el quinto año, en que aún se puede reclamar por la vía civil.

## Más información

* **Trazabilidad:** HU-28, HU-41 · RF-54, RF-55, RF-102 · RNF-35, RNF-36 · F-41 · DD-03 §3.6 · Q-10, Q-11 (registro de mejoras 2026-10-03).
* **Cuestiones abiertas:**
  * EXT-02 (RGPD): incluir el contrato y su plazo de 5 años en el registro de actividades.
