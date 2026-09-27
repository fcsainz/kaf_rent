---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0001: Autenticación con cuenta de Google y lista de cuentas autorizadas en el Sheet

## Contexto y planteamiento del problema

La webapp la usan tres personas, cada una con su **cuenta personal de Google** y los mismos permisos. Toda la infraestructura (proyecto de Apps Script, Sheet, Drive, Calendar y buzón de envío) pertenece a una **cuenta operativa dedicada** (`operaciontangai@gmail.com`). Al ser Gmail personal y no Google Workspace, no existe la opción de "compartir solo con mi dominio".

¿Cómo restringimos el acceso a esas tres personas, sabiendo quién hace cada cambio, sin coste y sin gestionar contraseñas? (P-12, JTBD-12)

## Factores de decisión

* Solo las tres personas autorizadas pueden acceder (RNF-19, RNF-20).
* Cada creación y modificación debe atribuirse a su autor (P-03, RNF-22).
* Coste cero (RNF-33).
* Cero gestión de contraseñas; altas y bajas sin tocar código (RNF-21, RNF-27).
* Calendar, Drive y Sheets deben funcionar sin permisos individuales frágiles.

## Opciones consideradas

* Login de Google + lista `Usuarios_Autorizados` + ejecución como la cuenta operativa (`USER_DEPLOYING`)
* Login de Google + lista `Usuarios_Autorizados` + ejecución como el usuario que accede (`USER_ACCESSING`)
* Acceso "Cualquiera, incluso anónimo"
* Acceso "Solo yo"
* Login propio con usuario y contraseña en el Sheet
* Google Workspace con restricción de dominio

## Resultado de la decisión

Opción elegida: "Login de Google + lista `Usuarios_Autorizados` + ejecución como la cuenta operativa (`USER_DEPLOYING`)", porque es la única que da control de acceso, trazabilidad, coste cero y acceso fiable a los recursos del grupo (Calendar incluido).

- Despliegue con acceso **"Cualquiera con cuenta de Google"** (Google exige login) y **"Ejecutar como: Yo"** (la cuenta operativa).
- En cada `doGet`, `Session.getActiveUser().getEmail()` obtiene el email real de quien accede y se compara con las filas activas de `Usuarios_Autorizados` (Email, Activo, Rol reservado para el futuro).
- Si no está autorizado: pantalla de acceso denegado y registro en `Logs`. Si lo está: se carga la app y ese email alimenta `Registrado_Por` y `Modificado_Por`.
- Cada endpoint vuelve a comprobar la autorización (`sesionAutorizada()`).

> *Revisión 2026-06-29:* inicialmente se eligió `USER_ACCESSING`; se cambió a `USER_DEPLOYING` porque `CalendarApp.getCalendarById()` no encontraba el calendario del grupo desde las cuentas personales. `getActiveUser()` sigue devolviendo el email real de quien accede.

> *Revisión 2026-09-27 (v2, F-11, decisión del usuario):* la columna `Rol` deja de estar reservada. Roles: **Admin** (gestión + técnico), **Gestión**, **Soporte** (técnico) y **Sistema** (cuenta de la app, sin avisos ni invitaciones). Vacío o `Copropietario` = Gestión, por compatibilidad. Hoy el rol decide quién recibe las invitaciones de Calendar (gestión) y las incidencias (técnico); el acceso a la app sigue dependiendo solo de `Activo` (RF-84, `dominio_roles.gs`).

### Consecuencias

* Buena, porque cuesta cero y reutiliza el login de Google, sin contraseñas que custodiar.
* Buena, porque dar o quitar acceso es editar una fila del Sheet.
* Buena, porque la trazabilidad sale "gratis" del email de la sesión.
* Buena, porque todos los emails salen de un remitente único (la cuenta operativa).
* Mala, porque al ejecutarse con los permisos de la cuenta operativa, cualquier función global invocable desde el cliente corre con todos los privilegios. *Revisión 2026-09-25 (v2, B-01):* todo lo interno lleva sufijo `_` (no invocable); las entradas públicas del sistema pasan por `ejecutarTareaDelSistema_` y los endpoints por `ejecutarEndpoint_` (RNF-20).
* Mala, porque si una persona pierde su cuenta de Google pierde el acceso (la recuperación depende de Google).
* Mala, porque la cuenta operativa concentra todo el sistema (riesgo R-13).

### Confirmación

* Smoke test tras cada despliegue: cuenta autorizada → Inicio; cuenta no autorizada → acceso denegado + fila en `Logs`.
* Test de integración de `verificarAcceso` y `esUsuarioAutorizado` (RF-02 a RF-04).
* Test automático que compruebe que ninguna función interna es invocable desde el cliente (RNF-20).

## Pros y contras de las opciones

### Ejecución como la cuenta operativa (`USER_DEPLOYING`)

* Buena, porque Calendar, Drive y Sheets funcionan sin compartir cada recurso con cada cuenta.
* Buena, porque el email de quien accede sigue disponible para auditar.
* Mala, porque eleva el impacto de una función expuesta por error.

### Ejecución como el usuario que accede (`USER_ACCESSING`)

* Buena, porque cada usuario solo puede hacer lo que sus permisos de Google le permiten.
* Mala, porque cada recurso debe compartirse con cada cuenta, y el calendario del grupo no aparecía en las cuentas personales (probado y descartado).

### Acceso anónimo o "Solo yo"

* Mala, porque el anónimo no restringe a nadie y "Solo yo" deja fuera a dos de los tres usuarios.

### Login propio

* Mala, porque reinventa la autenticación de forma menos segura y obliga a gestionar altas, bajas y recuperación de contraseñas.

### Google Workspace

* Buena, porque ofrece control nativo por dominio.
* Mala, porque tiene coste mensual (incumple RNF-33).

## Más información

* **Trazabilidad:** HU-01, HU-02, HU-03 · RF-01 a RF-06 · RNF-19 a RNF-22, RNF-25
* **Cuestiones abiertas:** ninguna (B-01 resuelto en v2; lo verifica `tests/endpoints/seguridad.test.js`)
* **Riesgos:** R-09, R-13 ([arc42 §11](../arc42.md#11-riesgos-y-deuda-técnica))
