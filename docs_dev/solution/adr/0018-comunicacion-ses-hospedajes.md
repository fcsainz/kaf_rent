---
status: accepted; "sin anulaciones automáticas" (D-31) sustituido por ADR-0022; "una sola copia" en las copias de seguridad sustituido por ADR-0024
date: 2026-10-02
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0018: Comunicación automática a SES.Hospedajes desde el Google Form de viajeros, con validación presencial

Sustituye **parte** de [ADR-0007](0007-registro-de-viajeros-para-reservas-de-habitacion.md): el formulario (segundo despliegue → Google Form ya en uso), el casado con la reserva (nombre y fechas → código de reserva), las fotos del documento (se retiran) y el envío (manual → automático por servicio web). Siguen vigentes de ADR-0007: solo aplica a la **Habitación**, varios viajeros por reserva y el estado del registro en la reserva.

## Contexto y planteamiento del problema

El RD 933/2021 (Art. 6.3) obliga a comunicar a SES.Hospedajes la reserva (`RH`) en las 24 h siguientes a hacerla y el parte de viajeros (`PV`) en las 24 h siguientes a la llegada ([referencia técnica](../../../docs_work/docs_ses/referencia-tecnica-ses-hospedajes.md)). Hoy se hace a mano en la web del Ministerio y se anota a mano en el Sheet del Google Form de viajeros. Los huéspedes ya rellenan ese Form antes de llegar, y un copropietario comprueba su documento en persona. ¿Cómo automatizamos la comunicación sin duplicar datos sensibles ni añadir trabajo? (P-10, JTBD-10)

## Factores de decisión

* Que el huésped no cambie nada: el Form ya funciona.
* Una sola copia de los datos personales (RGPD, RNF-34, RNF-38). Excepción: las copias de seguridad ([ADR-0024](0024-copias-de-seguridad-del-form-de-viajeros.md)).
* Nada se comunica sin que una persona haya visto el documento (verificación presencial).
* Coste cero y todo dentro de Apps Script (RNF-33).
* Fallos visibles: nunca un parte sin comunicar sin que nadie lo sepa.

## Opciones consideradas

* **Datos:** leer el Sheet del Form sin copiar · copiar las respuestas al Sheet de KAF Rent · formulario propio (ADR-0007)
* **Envío:** servicio web automático · envío manual con los datos preparados por la app
* **Credenciales:** Propiedades del script · hoja `Config`

## Resultado de la decisión

Opciones elegidas (decisiones del usuario D-30 a D-33, 2026-10-02):

1. **Datos:** KAF Rent **lee** el Sheet del Form (`Config.Sheet_Viajeros_Id`) cuando los necesita y **no copia** datos personales. En su propio Sheet solo guarda referencias (reserva, fila del Form), quién validó y cuándo, y el resultado de cada comunicación. El resultado se escribe también en las columnas del Form que el usuario rellenaba a mano (`Comunicados`, `Usuario`, `Tipo_Comunicación`, `Fecha`, `Código de comunicación`).
2. **Casado:** por el **código de reserva** del Form frente al código de reserva del canal de KAF Rent (RF-88). El enlace que se manda al huésped lleva ese código ya relleno.
3. **Sin fotos** del documento: ni el RD ni SES las piden; la comprobación es presencial.
4. **Envío automático por el servicio web** (SOAP, HTTP Basic) con `UrlFetchApp`. Probado el 2026-10-02: conecta validando el certificado de la FNMT.
   * **Parte (`PV`):** siempre, cuando quien hace el check-in ha validado en persona todas las identidades.
   * **Reserva (`RH`):** solo si llega al menos un Form **antes del día de entrada**; si no, no se envía (D-31).
   * **Sin anulaciones automáticas** (D-31).
5. **Reintentos:** hasta 3 intentos; cada fallo avisa por email a los usuarios con el nº de intento y la hora del siguiente en el asunto; el 3.º fallido pide comunicarlo a mano.
6. **Credenciales** del servicio web en las **Propiedades del script**, no en el Sheet (excepción en CLAUDE.md §4.8).

### Consecuencias

* Buena, porque los DNI, domicilios y fechas de nacimiento solo existen en el Sheet del Form.
* Buena, porque el parte se comunica en el mismo momento del check-in, sin pasos a mano.
* Buena, porque cada comunicación queda trazada en los dos Sheets.
* Mala, porque KAF Rent depende de la estructura del Form: las preguntas repetidas (adulto/menor) se leen por orden y, si se reordenan, la lectura se rompe (riesgo en arc42 §11.1; un test de cabeceras lo detecta).
* Mala, porque si ningún huésped rellena el Form antes del día de entrada, la reserva (`RH`) no se comunica y no se cumple el Art. 6.3 a). **Riesgo aceptado por el usuario** (D-31).
* Mala, porque añade un permiso nuevo de Google ("conectarse a un servicio externo") que cada usuario acepta una vez.
* Neutra: los códigos de SES (sexo, tipo de documento, parentesco, pago) y los de municipio (INE) y país (ISO) se guardan en hojas de catálogo; no van en el código.

### Confirmación

* Tests unitarios de la validación y del XML de `RH` y `PV` frente a los campos obligatorios de la especificación v3.1.3.
* Tests de endpoints con dobles de `UrlFetchApp` y del Sheet del Form: éxito, rechazo de SES, fallo de red, 3 reintentos.
* ~~Prueba real contra el entorno de pruebas (`pre-ses`) antes de producción~~ → pre-ses respondió HTTP 502 el 2026-10-02; la conexión y el catálogo se comprobaron en producción y SES se activó allí (usuario, 2026-10-02). Queda verificar el alta y la consulta del lote con la primera reserva real (S29) y la revisión RGPD (EXT-02).

## Pros y contras de las opciones

### Copiar las respuestas al Sheet de KAF Rent
* Buena, porque todo estaría en un Sheet.
* Mala, porque duplica datos sensibles y exige sincronizar en los dos sentidos.

### Formulario propio (ADR-0007)
* Buena, porque controlaría los campos.
* Mala, porque obliga a sustituir el Form que ya usan los huéspedes (~10 h más).

### Envío manual con los datos preparados
* Buena, porque no depende del servicio web.
* Mala, porque mantiene el trabajo a mano en cada reserva y cada llegada.

### Credenciales en `Config`
* Mala, porque cualquiera con acceso al Sheet vería la contraseña.

## Más información

* **Diseño:** [DD-02](../design-docs/DD-02-comunicacion-ses-hospedajes.md).
* **Trazabilidad:** HU-35, HU-36 · RF-76, RF-77, RF-78, RF-89, RF-90, RF-91 (RF-75 retirado) · RNF-34, RNF-38 · registro de la sesión: [mejoras_2026-10-02.md](../../../docs_work/docs_mejoras/mejoras_2026-10-02.md).
* **Cuestiones abiertas:** credenciales del servicio web (el usuario las localiza o las vuelve a pedir); revisión RGPD (EXT-02) antes de producción; preguntas abiertas de DD-02 §5.
