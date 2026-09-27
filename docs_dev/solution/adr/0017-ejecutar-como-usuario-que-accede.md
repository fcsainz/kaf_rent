---
status: accepted
date: 2026-09-27
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0017: La Web App se ejecuta como el usuario que accede y los recursos se comparten con los usuarios

Sustituye **solo la parte de ejecución** de [ADR-0001](0001-autenticacion-google-cuentas-autorizadas.md) (`USER_DEPLOYING`, "Ejecutar como: Yo"). El login de Google, la lista `Usuarios_Autorizados`, los roles y la comprobación en cada endpoint siguen vigentes.

## Contexto y planteamiento del problema

ADR-0001 (revisión del 2026-06-29) eligió "Ejecutar como: Yo" suponiendo que `Session.getActiveUser().getEmail()` seguiría devolviendo el email de quien accede. **Con cuentas personales `@gmail.com` no es así:** cuando la app se ejecuta como otra cuenta, Google devuelve el email vacío a todos salvo al propietario del script (solo lo da si la app actúa como el propio usuario o si ambos están en el mismo dominio de Google Workspace). KAF Finance, publicada así, muestra "Usuario no habilitado" a todos (2026-09-27). En KAF Rent la versión publicada se ejecuta como quien accede (comprobado con `clasp pull`), por eso identifica bien, pero la cuenta que no tiene compartido el calendario operativo no puede crear eventos (B-14).

## Factores de decisión

* Identificar a cada usuario: sin email no hay control de acceso ni auditoría (RF-02, RNF-19).
* Que todos puedan crear eventos, subir documentos y enviar avisos (B-14).
* Sin login propio ni contraseñas (ADR-0001).

## Opciones consideradas

* Ejecutar como el usuario que accede y compartir los recursos con los usuarios autorizados
* Ejecutar como la cuenta operativa ("Yo")
* Ejecutar como la cuenta operativa con una identificación propia (login, token)

## Resultado de la decisión

Opción elegida: "Ejecutar como el usuario que accede y compartir los recursos", porque es la única que identifica a cada usuario con cuentas personales sin reinventar la autenticación.

* `appsscript.json`: `"executeAs": "USER_ACCESSING"`, `"access": "ANYONE"` (cualquier cuenta de Google con sesión iniciada).
* Cada usuario autorizado necesita permiso de **edición** en el Sheet `BBDD_KAF_Rent`, en las carpetas de Drive de `Config` (vídeos, documentos) y **"Hacer cambios en eventos"** en el calendario de `Config.Calendar_Id`.
* Las tareas del sistema (inicializar, triggers, reconciliación) solo las lanza la **propietaria del Sheet** (`esEjecucionDirecta_` compara con el propietario, no con el usuario efectivo, que ahora es siempre quien navega) o un trigger del proyecto. "Reparar hojas" hay que pulsarlo con `operaciontangai`.
* Los triggers (`tareasNocturnas`, `informesProgramados`) no cambian: se ejecutan con la cuenta que los instaló (`operaciontangai`), sea cual sea el modo del despliegue.

### Consecuencias

* Buena, porque cada persona queda identificada y sus cambios se auditan con su email.
* Buena, porque un fallo de permisos afecta solo a esa cuenta y se arregla compartiendo, sin tocar código.
* Mala, porque cada alta de usuario exige compartir tres recursos además de añadirle a `Usuarios_Autorizados` (checklist en DEVELOPMENT.md).
* Mala, porque los emails de la app salen desde la cuenta de quien hace la acción, no desde un remitente único.
* Mala, porque quien tiene el Sheet compartido puede editarlo a mano (ya ocurría en la v1).
* Neutra: la primera vez, cada usuario acepta los permisos de Google (puede salir "Google no ha verificado esta app" → Configuración avanzada → Ir a…).
* Neutra: una cuenta de Google no autorizada y sin acceso al Sheet no puede leer nada; ve un error de Google en vez de la pantalla de acceso denegado.

### Confirmación

* `tests/endpoints/seguridad.test.js` comprueba que el manifiesto declara `USER_ACCESSING`.
* Smoke tras desplegar (T-06): entrar con las tres cuentas; crear una reserva con cada una y ver su evento en el calendario.
* Chequeo de salud (T-04): comprobar que el despliegue publicado se ejecuta como el usuario que accede.

## Pros y contras de las opciones

### Ejecutar como la cuenta operativa ("Yo")

* Buena, porque la app llega a todos los recursos sin compartirlos.
* Mala, porque con cuentas `@gmail.com` no identifica a nadie salvo al propietario: bloquea la app (descartada).

### Cuenta operativa con identificación propia

* Mala, porque obliga a gestionar contraseñas o tokens, que es lo que ADR-0001 quiso evitar.

## Más información

* **Trazabilidad:** RF-01, RF-02, RF-36 · RNF-19, RNF-20 · B-14, R-18.
* **Cuestiones abiertas:** ninguna.
