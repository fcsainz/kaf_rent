---
status: accepted
date: 2026-10-03
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0024: Copias de seguridad del Sheet del Form de viajeros como excepción a "una sola copia"

Sustituye **solo** el factor "Una sola copia de los datos personales" de [ADR-0018](0018-comunicacion-ses-hospedajes.md) en lo que toca a las **copias de seguridad**. El resto de ADR-0018 sigue vigente: KAF Rent no copia datos de huéspedes a su propio Sheet ni a ningún otro sitio de trabajo.

## Contexto y planteamiento del problema

ADR-0018 decidió que los datos de los huéspedes viven en un solo sitio, el Sheet del Form de viajeros, y que KAF Rent solo los lee. Pero ese Sheet no tenía copia de seguridad: si se borraba o se estropeaba, se perdían los datos que sostienen la comunicación a SES.Hospedajes. La revisión de las copias de la sesión del 2026-10-03 (D-49) lo detectó. ¿Cómo protegemos esos datos sin contradecir la minimización de ADR-0018? (P-12, R-08, R-11)

## Factores de decisión

* Disponibilidad: el RGPD (art. 32.1.c) pide poder restaurar la disponibilidad y el acceso a los datos personales tras un incidente.
* Minimización y limitación del plazo (art. 5.1.c y 5.1.e RGPD, RNF-34, RNF-38): las copias no pueden ser un segundo almacén sin fecha de fin.
* Coste cero y misma cuenta operativa (RNF-33, ADR-0013).
* El Sheet está vinculado al Form: copiarlo con "hacer una copia" podría duplicar también el Form (D-50).

## Opciones consideradas

* Foto `.xlsx` diaria en la carpeta de copias, con la rotación abuelo-padre-hijo de ADR-0016.
* Copia nativa con `makeCopy`, igual que el Sheet principal.
* Sin copia (mantener ADR-0018 tal cual).

## Resultado de la decisión

Opción elegida: "Foto `.xlsx` diaria con rotación", porque cubre la disponibilidad que pide el RGPD con un plazo acotado y sin riesgo de duplicar el Form (decisiones del usuario D-49 A y D-50 A, 2026-10-03).

* **Qué se copia:** el Sheet del Form completo (`Config.Sheet_Viajeros_Id`), exportado a `.xlsx`.
* **Dónde:** la carpeta de copias (`Config.Carpeta_Backups_Id`), en la cuenta operativa; mismo acceso que el Sheet original.
* **Cuánto dura:** lo que marca la rotación (7 diarias, 4 semanales, 12 mensuales): como mucho, unos 12 meses. Un dato borrado del original desaparece de las copias en ese plazo.
* **Para qué:** solo para restaurar ([DEVELOPMENT.md](../../DEVELOPMENT.md#restaurar-desde-una-copia-de-seguridad-d-49)); la app no lee las copias.

### Consecuencias

* Buena, porque un borrado o error en el Sheet del Form se puede deshacer hasta unos 12 meses atrás.
* Buena, porque la foto `.xlsx` no se puede editar desde la app ni dispara el Form.
* Mala, porque hay hasta unas 20 copias más de los datos personales, aunque en la misma cuenta y con el mismo acceso.
* Mala, porque restaurar exige importar el `.xlsx`, sin sustituir la hoja vinculada al Form.

### Confirmación

Test `RF-68 · copia también el Sheet del Form como .xlsx y lo rota aparte (D-49, D-50)` en `tests/endpoints/documentos_informes_gastos.test.js`. En real, una línea `COPIA` diaria del Form en `Logs`.

## Pros y contras de las opciones

### Foto `.xlsx` con rotación

* Buena, porque no toca el vínculo con el Form.
* Buena, porque el plazo de conservación es finito y conocido.
* Mala, porque usa la exportación de Drive (`UrlFetchApp` con el token del script), algo más de código que `makeCopy`.

### Copia nativa con `makeCopy`

* Buena, porque es el mismo mecanismo que el Sheet principal y se restaura directamente.
* Mala, porque Google podría duplicar el Form en cada copia (no verificado): un Form nuevo cada noche, fuera de la rotación.

### Sin copia

* Buena, porque mantiene una sola copia de los datos.
* Mala, porque no cumple el art. 32.1.c RGPD: un borrado del Sheet del Form sería irrecuperable pasados los 30 días de la papelera.

## Más información

* **Trazabilidad:** P-12 · RF-68 · RNF-17, RNF-34, RNF-38 · R-08, R-11 · D-49, D-50
* **Plazo de conservación:** como hospedaje no profesional, KAF Rent está **exento** del registro documental propio y de su conservación durante 3 años (RD 933/2021, art. 5.4; [referencia técnica](../../../docs_work/docs_ses/referencia-tecnica-ses-hospedajes.md)). Los datos ya constan en SES.Hospedajes. Estas copias son para la disponibilidad, no para conservar con fines de investigación. Cuánto se guarda el propio Sheet del Form es la revisión RGPD pendiente (EXT-02).
* **Cuestiones abiertas:** EXT-02 (registro de actividades y plazo de conservación del Sheet del Form).
* **Relacionados:** ADR-0013, ADR-0016, ADR-0018
