---
status: accepted
date: 2026-10-02
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0021: Script propio ligado al Form de viajeros, sin credenciales de SES

Completa [ADR-0018](0018-comunicacion-ses-hospedajes.md) (comunicación a SES desde el Google Form de viajeros). No sustituye nada.

## Contexto y planteamiento del problema

Para que los datos del Form lleguen a SES sin traducciones frágiles, el Form pasa a usar desplegables con los valores de SES (sexo, tipo de documento, parentesco), países y provincias, y validaciones de formato (DNI/NIE, soporte, email, teléfono) (D-37, [DD-02 §3.6](../design-docs/DD-02-comunicacion-ses-hospedajes.md)). Escribir unas 300 opciones a mano y repetirlo cuando cambien los catálogos no es viable: hace falta un script con `FormApp`.

`FormApp` pide el permiso "ver y gestionar tus formularios". KAF Rent se ejecuta como el usuario que accede ([ADR-0017](0017-ejecutar-como-usuario-que-accede.md)), así que, si el script estuviera en KAF Rent, los tres usuarios tendrían que aceptar un permiso que no usan. Además, los catálogos de SES solo se obtienen con las credenciales del servicio web, que viven en las Propiedades del script de KAF Rent (D-32).

## Factores de decisión

* Mínimo privilegio: que KAF Rent no pida permisos nuevos a todos los usuarios.
* Un solo sitio para la contraseña de SES y un solo cliente SOAP (DRY).
* Que las listas del Form se puedan regenerar sin trabajo manual.

## Opciones consideradas

* Proyecto de Apps Script propio, ligado al Form; los catálogos los pide KAF Rent y el Form los lee de su Sheet
* Proyecto propio ligado al Form que pide él mismo los catálogos a SES (con su copia de las credenciales)
* Funciones dentro de KAF Rent
* Configurar el Form a mano

## Resultado de la decisión

Opción elegida: "Proyecto propio ligado al Form, que lee los catálogos del Sheet de KAF Rent" (usuario, 2026-10-02), porque no amplía los permisos de KAF Rent ni duplica la contraseña.

* **Código** en `docs_dev/src_form_checkin/`, separado de `docs_dev/src/` para no mezclar proyectos (usuario, 2026-10-02). Su propio `appsscript.json` y su propio `scriptId` en clasp. La documentación sigue siendo la del proyecto (discovery, arc42, ADR, DD-02).
* **Qué hace:** solo configura el Form: rellena los desplegables desde las hojas de catálogo de `BBDD_KAF_Rent` y pone las validaciones con un mensaje que explica el formato correcto. Se ejecuta desde su editor y, si se quiere, con un activador semanal.
* **Qué no hace:** no habla con SES ni reacciona a los envíos. Comunicar la reserva (`RH`) al llegar un Form, comprobar la letra del DNI/NIE o casar con la reserva sigue en KAF Rent (DD-02 §3.3).
* **Sin credenciales de SES.** KAF Rent (`actualizarCatalogosSES`) guarda los catálogos en su Sheet; el script del Form solo los lee. El ID de `BBDD_KAF_Rent` va en las Propiedades del script del Form, no en el código (CLAUDE.md §4.8).
* La cuenta propietaria del Form crea el proyecto ligado y necesita permiso de lectura en `BBDD_KAF_Rent`.

### Consecuencias

* Buena, porque los usuarios de KAF Rent no aceptan ningún permiso nuevo.
* Buena, porque la contraseña de SES y el cliente SOAP siguen en un solo sitio.
* Buena, porque las listas del Form se regeneran con un clic cuando cambian los catálogos.
* Mala, porque hay un segundo proyecto que desplegar (otro `scriptId`) y refrescar las listas lleva dos pasos: catálogos en KAF Rent y luego el script del Form.
* Neutra: Forms valida al rellenar cada campo; lo que una expresión regular no puede comprobar (letra del DNI/NIE) se revisa en KAF Rent tras el envío y se ve en la pantalla de validación.

### Confirmación

* Tests unitarios de las funciones puras del script del Form (listas y expresiones de validación) con el mismo cargador `vm`.
* Prueba manual: tras ejecutar el script, el Form muestra las listas y rechaza un DNI mal formado con el mensaje previsto.

## Pros y contras de las opciones

### Proyecto del Form con sus propias credenciales

* Buena, porque refrescar las listas es un solo paso.
* Mala, porque duplica la contraseña de SES y el cliente SOAP.

### Dentro de KAF Rent

* Buena, porque hay un solo proyecto.
* Mala, porque los tres usuarios tendrían que aceptar el permiso de formularios.

### A mano

* Buena, porque no hay código.
* Mala, porque son unas 300 opciones que repetir si cambian los catálogos.

## Más información

* **Trazabilidad:** HU-35 · RF-77 · RNF-20, RNF-38 · D-32, D-37 · DD-02 §3.6.
* **Cuestiones abiertas:** ninguna. Propietaria del Form: `operaciontangai` (2026-10-02). Al ser un script ligado, encuentra el Form solo (`FormApp.getActiveForm()`): su ID no va en el código.
