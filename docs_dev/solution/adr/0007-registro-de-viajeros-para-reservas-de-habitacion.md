---
status: accepted
date: 2026-06-24
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0007: Registro de viajeros de la Habitación con formulario público y hoja en el mismo Sheet (Fase 2)

> **Decisión aceptada; implementación diferida a la Fase 2.**

## Contexto y planteamiento del problema

El RD 933/2021 obliga a registrar y comunicar los datos de identidad de los huéspedes. Desde el 2-12-2024 se hace en **SES.Hospedajes** (Ministerio del Interior). Solo aplica a la **Habitación**. Los datos (incluidas las fotos del documento) los aporta el huésped, que no tiene acceso a la webapp interna. ¿Cómo recogemos esos datos de forma sencilla para el huésped? (P-10, JTBD-10)

## Factores de decisión

* Sencillez para el huésped (sin cuenta, sin identificadores difíciles).
* Una única base de datos, enlazable con `Reservas`.
* Datos especialmente sensibles (documentos de identidad): RGPD (RNF-34, RNF-38).
* Coste cero.

## Opciones consideradas

* Formulario público (segundo despliegue sin login) + hoja `Registro_Viajeros` en el mismo Sheet + reserva identificada por nombre y ambas fechas
* Sheet separado
* Enlace único por reserva (token)
* Pedir el ID de reserva al huésped
* Envío automático a SES.Hospedajes por API desde el inicio

## Resultado de la decisión

Opción elegida: "Formulario público + hoja en el mismo Sheet + nombre y ambas fechas", porque prioriza la sencillez del huésped manteniendo una única base de datos.

- **Casado de la reserva:** reserva activa de Habitación cuyas fechas de entrada **y** salida coincidan exactamente (el día frontera entre dos reservas consecutivas hace que una sola fecha no baste); el nombre solo confirma.
- **Varios viajeros por envío** ("Añadir otro viajero").
- **Campos por viajero** (a verificar contra la especificación vigente de SES.Hospedajes): nombre completo, tipo y nº de documento, nº de soporte, nacionalidad, fecha de nacimiento, dirección, teléfono, email, parentesco con el titular y fotos del documento (anverso y reverso).
- **`Registro_Viajeros_Estado`** (Pendiente/Completado) en `Reservas`, calculado: "Completado" cuando hay tantos viajeros como `Adultos + Menores` (cuentan todos los ocupantes). Se recalcula al recibir cada envío y, como red de seguridad, al cargar el Inicio.
- **Primera fase:** el envío a SES.Hospedajes es **manual**; la API se investigará (suele exigir certificación como proveedor de software).

### Consecuencias

* Buena, porque centraliza en un sitio todo lo necesario para el trámite.
* Buena, porque el huésped solo necesita su nombre y sus fechas.
* Buena, porque deja los datos listos para una futura automatización.
* Mala, porque un formulario público puede recibir envíos espurios; falta decidir qué hacer con los que no casan.
* Mala, porque almacenar fotos de documentos de identidad de terceros exige una revisión RGPD profesional (riesgo **R-11**, exposición alta).

### Confirmación

* Revisión legal y RGPD **antes** de implementar.
* Tests unitarios del casado de reservas (RF-76) y del recálculo del estado (RF-78); E2E del formulario público.

## Pros y contras de las opciones

### Sheet separado

* Mala, porque obliga a sincronizar dos ficheros sin beneficio con este volumen.

### Enlace único por reserva

* Buena, porque controla mejor quién envía.
* Mala, porque es más complejo para el huésped (se prioriza la sencillez).

### Pedir el ID de reserva

* Mala, porque el huésped se equivoca al transcribirlo más que con su nombre y sus fechas.

### API de SES.Hospedajes desde el inicio

* Mala, porque probablemente exige certificación como proveedor; excede el alcance sin investigarlo antes.

## Más información

* **Trazabilidad:** HU-35, HU-36 · RF-32, RF-75 a RF-78 · RNF-34, RNF-38
* **Cuestiones abiertas (PROXIMOS_PASOS, Fase 2):** lista definitiva de campos de SES.Hospedajes; viabilidad de la API; política de conservación y acceso a las fotos (consulta legal); tratamiento de envíos sin reserva coincidente.
