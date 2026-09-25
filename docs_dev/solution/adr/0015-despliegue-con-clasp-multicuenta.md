---
status: accepted
date: 2026-09-25
decision-makers: Copropietario desarrollador (PER-01)
consulted: —
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0015: Despliegue con clasp y credenciales locales multicuenta (`operacion` / `fcsainz`)

## Contexto y planteamiento del problema

Hasta la v1, el código se sincronizaba copiando y pegando cada fichero en el editor de Apps Script. clasp se descartó por la fricción de `clasp login` con varias cuentas de Google. Copiar y pegar es lento, propenso a olvidos (un fichero sin actualizar) e impide automatizar despliegues y pruebas. El desarrollador usa sobre todo dos cuentas en sus proyectos: `operaciontangai@gmail.com` (dueña de KAF Rent) y `fcsainz@gmail.com`. ¿Cómo sincronizamos el código con Apps Script de forma fiable sin exponer credenciales? (RNF-27, RNF-29, riesgo R-06)

## Factores de decisión

* Menos errores manuales al desplegar.
* Credenciales de dos cuentas a mano, reutilizables en otros proyectos.
* Ninguna credencial en el repositorio ni en GitHub (RNF-23, riesgo R-13).
* Coste cero (RNF-33).

## Opciones consideradas

* clasp con credenciales **con nombre** guardadas solo en el equipo (`clasp login --user …`)
* Seguir con copia/pega manual
* clasp con credenciales guardadas como secretos de GitHub (despliegue desde CI)

## Resultado de la decisión

Opción elegida: "clasp con credenciales con nombre en el equipo", porque clasp (≥ 3) admite varias cuentas con `--user` y guarda las credenciales en `~/.clasprc.json`, fuera de cualquier repositorio.

- Credenciales: `clasp login --user operacion` (operaciontangai@gmail.com) y `clasp login --user fcsainz` (fcsainz@gmail.com), una vez por equipo, válidas para todos los proyectos.
- **KAF Rent usa siempre `--user operacion`.**
- `.clasp.json` (con `scriptId` y `rootDir: "docs_dev/src"`) es local y no se versiona; se versiona `.clasp.json.example` como plantilla.
- Instalación global (`npm install -g @google/clasp`) para reutilizarla en todos los proyectos.
- **GitHub nunca recibe credenciales:** en CI solo corren lint, tests unitarios y E2E simulados.
- La copia/pega manual queda como procedimiento de emergencia.

### Consecuencias

* Buena, porque un comando sube todos los ficheros y desaparece el "se me olvidó pegar uno".
* Buena, porque habilita scripts de despliegue (`push`, `deploy`) y, en el futuro, ejecutar funciones de prueba desde el equipo.
* Buena, porque las credenciales quedan en el equipo del desarrollador, no en el repositorio.
* Mala, porque `clasp push` **sustituye** el código del proyecto remoto por el local: si alguien edita en el editor web, se pierde. Mitigación: la primera vez, `clasp pull` a una carpeta temporal y comparar con `docs_dev/src/` antes del primer `push` (T-08); a partir de ahí, no editar en el editor web.
* Mala, porque `~/.clasprc.json` es un secreto: quien lo obtenga puede actuar como esas cuentas. Hay que proteger el equipo y revocar el acceso en la cuenta de Google si se pierde.
* Neutral: hay que activar la *Apps Script API* en cada cuenta (ajustes de usuario de script.google.com).

### Confirmación

* `clasp --user operacion show-file-status` (o `status`) sin diferencias tras el primer `push`.
* Smoke test tras cada `deploy` (T-06).

## Pros y contras de las opciones

### Copia/pega manual

* Buena, porque no requiere configuración.
* Mala, porque es lento, propenso a errores y no automatizable.

### Credenciales en GitHub (CI)

* Buena, porque permitiría desplegar y lanzar la integración desde CI.
* Mala, porque un token de la cuenta operativa en GitHub da acceso a toda la infraestructura si se filtra.

## Más información

* **Trazabilidad:** RNF-23, RNF-27, RNF-29, RNF-33 · tareas T-08 (configuración) y T-04 (integración) · acción ACC-02
* **Cuestiones abiertas:** ejecutar la suite de integración con `clasp run-function` exige asociar el script a un proyecto estándar de Google Cloud y usar un cliente OAuth propio (`--creds`); es gratuito, pero se decidirá al llegar a T-04 (S11).
* **Supersede parcialmente:** la decisión de "sin clasp" recogida en DEVELOPMENT.md y en el CHANGELOG 1.0.0.
* **Fuente:** [README de clasp](https://github.com/google/clasp), "Multiple user support" y opción global `--user` (consultado 2026-09-25).
