# Próximos pasos — KAF Rent

**Actualizado:** 2026-09-27 (cierre de sesión: v2 publicada en producción; copias abuelo-padre-hijo, código de reserva del canal, ejecutar como quien accede (ADR-0017), clasp; doble revisión)  
**Framework:** Scrum adaptado a un desarrollador único: **sprints por objetivo, sin duración fija** (se trabajan en ratos libres y se cierran al cumplir el objetivo), backlog priorizado y tallas convertidas a horas ([CLAUDE.md §2.4](../CLAUDE.md))  
**Sustituye a:** `docs/discovery/09_roadmap.md`

> Documento **regenerado al cierre de cada sesión** a partir de las decisiones abiertas, los HU/RF/RNF no terminados, los defectos y la deuda, las cuestiones abiertas de los ADR y los riesgos (§4). Al retomar el trabajo, Claude muestra primero §0 y §1.

---

## §0 Decisiones pendientes del usuario

### Acciones manuales pendientes (no son decisiones)

- **ACC-02 — Configurar clasp** ([ADR-0015](../docs_dev/solution/adr/0015-despliegue-con-clasp-multicuenta.md)) — ✅ **Hecho (2026-09-27).** API de Apps Script activada; credencial `familia` = `operaciontangai@gmail.com`; `.clasp.json` creado (no se versiona). El `clasp pull` de comprobación muestra que el remoto es la v1 del commit `7290be9`, salvo: `gastos_interfaz.html` (en producción contiene una copia de la pantalla de Gestionar: **B-20**), una función de depuración `testCalendario` y `executeAs: USER_ACCESSING` (confirma B-14). Nada del remoto se pierde con el `push`.
- **ACC-03 — Desplegar la v2** — ✅ **Publicada el 2026-09-27 como versión 37** (la 36, sin la revisión de cierre) (`v2.3`, misma URL): push, reparar hojas, `Config`/catálogos/roles, eventos reconciliados (todas las reservas no canceladas tienen evento). **Falta:** smoke con las tres cuentas (T-06) y probar el icono en el móvil (D-23). Pasos seguidos: (sprint "Despliegue v2", tras ACC-02 y los tests del release). Pasos, en este orden:
  1. `clasp push` al proyecto (no cambia la versión publicada) y **prueba en `/dev`** con datos reales.
  2. **KAF Rent → Inicializar / reparar hojas** (seguro desde B-16): crea `Catálogo_Checklist` (138 puntos) y `Registro_Checklist` y añade columnas nuevas al final; no toca datos.
  3. ✅ **Hecho por Claude (2026-09-27):** `Config` += `Tamano_Max_Video_MB`, `Dias_Office_Reponer`, `Icono_Url`, `Backup_Diarias/Semanales/Mensuales` (antiguas marcadas obsoletas); `Catálogo_Canales.Requiere_Ref_Canal` (Airbnb = Sí); roles (fcsainz Admin, auralozca y esperanzavegafdez Gestión, operaciontangai Sistema). `Calendar_Url` también (derivado del ID). **Faltan:** `Carpeta_Raiz_Id` (solo referencia) y Pistolas de agua (D-22). Plan original: `Config` += `Tamano_Max_Video_MB` (100), `Carpeta_Raiz_Id`, `Calendar_Url` (enlace del calendario operativo; **arregla ya el botón del Inicio**), `Dias_Office_Reponer` (3), `Icono_Url` (`https://lh3.googleusercontent.com/d/19p3crnEA6yLJwcCi08E2dnooPBiVQC2W`, el PNG de 192 px, D-23), `Backup_Diarias` (7), `Backup_Semanales` (4), `Backup_Mensuales` (12) (ADR-0016; las filas `Backup_Cada_Dias` y `Backup_Max_Copias` se dejan, con la descripción "Obsoleta — ADR-0016"); `Catálogo_Canales` += columna `Requiere_Ref_Canal` (Airbnb → **Sí**, resto vacío; RF-88); `Catálogo_Servicios_Extra` += **Pistolas de agua**; `Usuarios_Autorizados.Rol`: fcsainz → **Admin**, auralozca y esperanzavegafdez → **Gestión**, operaciontangai → **Sistema**.
  4. Compartir (ADR-0017): calendario operativo con **"Hacer cambios en eventos"** y carpetas de vídeos y documentos con **edición** para `esperanzavegafdez` y `auralozca` (lo hace el usuario con `operaciontangai`). Después, **Gestionar implementaciones → lápiz → Nueva versión**, con "Ejecutar como" = **Usuario que accede** (nunca "Yo") y "Quién tiene acceso" = cualquier usuario con cuenta de Google. La URL no cambia.
  5. Desde el editor, `sincronizarReservasCalendario` para crear los eventos que faltan (reservas 003–009 y 011–013).
  6. Smoke (T-06) y CHANGELOG a 2.0.0.

### D-13 — ¿Cómo se mide el % de ocupación del Informe de Gestión? (bloquea S18)
**En llano:** el informe de gestión debe dar el % de ocupación de cada espacio.
**Propuesta (mismo criterio que el IRPF, D-16):** Habitación = noches ocupadas / noches del periodo; Piscina/Jardín = horas reservadas / horas útiles del periodo (franja 11:00–23:00, 12 h/día).
**Si no se decide:** el informe sigue sin ocupación (B-08).

### D-15 — Método de prorrateo del IRPF: validar con datos reales (bloquea S21)
Método **aceptado como provisional** (referencia técnica IRPF §6bis): dos cálculos por producto, gastos por pieza física (interior, exterior, finca 906 m²), tiempo por noches (Habitación) y horas sobre 12 h (exterior), amortización por construcción y no por suelo. **Se cierra** al calcular un ejercicio real: hacen falta los gastos reales, el valor de construcción de la casa y el coste de las instalaciones exteriores y del mobiliario (EXT-01).

### D-18 — Desglose pormenorizado de los tipos de gasto (bloquea S17)
Revisar juntos, gasto a gasto, la clasificación directo/indirecto, pieza (interior, exterior, finca) y tipo (reserva, una sola pieza, general, amortización) antes de programar el registro de gastos (F-19). Pendiente a petición del usuario.

### D-21 — ¿Se mantiene `README.md` en la raíz?
**En llano:** existe un `README.md` en la raíz, pero D-12 (2026-09-25) dejó anotado que se había eliminado. Hoy está enlazado desde otros documentos.
| | A (recomendada): mantenerlo y añadirlo al mapa de CLAUDE.md §1 | B: eliminarlo |
|---|---|---|
| Pros | GitHub lo muestra como portada; útil si algún día se enseña el proyecto (D-08) | Un fichero menos que mantener |
| Contras | Hay que tenerlo al día | Se pierde la portada; hay que retirar sus enlaces |

### D-23 — Icono del acceso directo en el móvil (para la próxima sesión)
**Resultado de la prueba (2026-09-27):** con `setFaviconUrl` (`Config.Icono_Url`, 192 px) el acceso directo de Android **sigue saliendo sin el icono**: Chrome toma el icono de la página exterior de Google, no el de la app.
**Propuesta para la próxima sesión:** página puente estática (manifest con 192/512 px y `apple-touch-icon` 180) que redirige a la app; ADR nuevo. ~2 h. Alternativa: dejarlo así.

### D-22 — Precio de las "Pistolas de agua" en el catálogo de servicios
Se añaden como servicio (F-14). Si no se indica precio, se dejan vacías (el servicio aparece con 0 €).

### D-24 — Recordatorios automáticos (HU-37, bloquea parte de S13)
**En llano:** qué reservas avisan y a quién.
**Propuesta:** cobro sin ingresar y check-out sin hacer, a los 10 y 15 días de la salida y después cada 7 días hasta cerrarse; a los usuarios con rol Gestión; sin guardar nada (se calcula por los días desde la salida).
**Si no se decide:** S13 avanza sin los recordatorios.

### Resueltas en esta sesión (2026-09-27)
- **D-25 →** la app se ejecuta como el usuario que accede y los recursos se comparten con cada usuario ([ADR-0017](../docs_dev/solution/adr/0017-ejecutar-como-usuario-que-accede.md)); "Ejecutar como: Yo" deja a todos sin identificar con cuentas `@gmail.com`.
- **Copias →** rotación abuelo-padre-hijo, 7/4/12 ([ADR-0016](../docs_dev/solution/adr/0016-rotacion-copias-abuelo-padre-hijo.md), hecho).
- **Código de reserva del canal →** obligatorio en los canales con `Requiere_Ref_Canal` = Sí (hoy Airbnb), opcional en el resto (HU-40, RF-88, hecho).
- **S13 / HU-38 →** el espacio de una reserva no se cambia (no va a pasar); fechas y canal se pueden editar solo mientras no haya empezado el check-in.
- **S19 / F-16 →** indicadores del Informe Técnico como propone F-16 (se irán mejorando); email propio, distinto del de gestión, con el mismo disparador mensual.
- **D-04 →** la referencia lleva el año en que se crea la reserva (B-15, hecho).
- **D-05 →** PROXIMOS_PASOS se regenera con un script temporal que no se guarda en el repo.
- **D-07 →** la app se usa con reservas reales y los tres la manejan solos (UAT de hecho: EXT-03 cerrada, hito M4 ✅).
- **D-08 →** repositorio privado. La idea de dar visibilidad a los proyectos se trata aparte, fuera de KAF Rent.
- **D-09 →** arc42 + C4 para el sistema y un design doc por funcionalidad grande (plantilla creada; DD-01 hecho).
- **D-11 →** `docs_work/` es una carpeta de trabajo, fuera del núcleo; `PROXIMOS_PASOS.md` se queda en ella.
- **D-16 →** el exterior se cuenta por horas sobre la franja útil 11:00–23:00 (12 h/día), configurable.
- **D-17 →** superficie de la finca: 906 m² (catastro).
- **D-19 →** "Reparar hojas" seguro y lectura por cabecera sin posición (B-16, hecho).
- **Sin gestor fiscal:** las dudas de IRPF se resuelven con la legislación y la doctrina públicas.
- **Tests:** unitarios y de endpoints con cada cambio; E2E de lo nuevo, integración y accesibilidad antes de pasar a producción (CLAUDE.md §7.2, §8.3).
- **T-04 (integración) →** sin entorno de pruebas duplicado: chequeo de salud de solo lectura en producción (va con F-16) + prueba en `/dev`.
- **F-17 →** scraping propio con aviso de rotura y reconstrucción, tras una prueba de viabilidad (riesgo legal explicado y asumido).
- **Roles (F-11) →** Admin (gestión + técnico), Gestión, Soporte (técnico), Sistema; fcsainz = Admin.
- **Checklists (F-14) →** contenido de las 4 listas aprobado (`docs_work/doc_check/checklists-check-in-out.md` v1.0).
- **Avisos (F-21) →** errores y avisos en ventana que hay que cerrar; éxitos centrados que se cierran solos; incidencias a las cuentas Admin.
- **F-13 →** las invitaciones de Calendar van a los usuarios con permiso de gestión.

---

## §1 Sprints pendientes

| Sprint | Objetivo | Contenido (resumen) | Estimación | Estado |
|---|---|---|---|---|
| **S9** | Preparar el despliegue y la calidad estática | Scripts npm de clasp (T-08, resto) · checklist de smoke (T-06) · ESLint (T-07) | 3–5 h | ⏳ Desbloqueado (ACC-02 hecho) |
| **S17** | Registro de gastos | F-19: formulario de tres preguntas (¿para una reserva?, ¿dónde se usa?, ¿dura años?) + clasificación por pieza y tipo; la hoja `Gastos` real está vacía, no hay que migrar | 7–9 h | ⏳ Bloqueado por D-18 |
| **S18** | Informe de Gestión y emails | F-15 (bloque mensual + análisis de precios) · B-08 y F-05 (ocupación, métricas por zona) · F-18 (rediseño de emails) | 14–16 h | ⏳ Bloqueado por D-13 |
| **S19** | Informe Técnico y chequeo de salud | F-16 (KPIs aprobados; email propio con el disparador mensual; solo Soporte/Admin) · chequeo de salud en real (T-04) · prueba de viabilidad del scraping (F-17) | ~10 h | ⏳ Listo para empezar |
| **S20** | Precios de la competencia | F-17: ADR + lectores por web + aviso de rotura + reconstrucción | 8–12 h | ⏳ Tras S19 |
| **S21** | Informe del IRPF | F-20: informe por copropietario y agregado, con casillas; valida D-15 con datos reales | 12–16 h | ⏳ Tras S17 + datos (EXT-01) |
| **Despliegue v2** | Publicar la v2 | Tests del release (E2E de las pantallas nuevas: checklists, editor, ventanas; auditoría axe; chequeo de salud) + ACC-03 | 4–6 h | ⏳ Tras S9 |
| **S13** | Mejoras "Could" | Editar fechas y canal hasta el check-in, sin cambio de espacio (HU-38, RF-80, RF-41) · recordatorios (HU-37, D-24) · reconciliación automática de Calendar (F-04) | 12–18 h | ⏳ Listo salvo recordatorios (D-24) |
| **Fase 2** | Registro de viajeros | Revisión legal (EXT-02) · formulario (HU-35) · estado (HU-36) · SES bidireccional (ADR-0007) | 4–6 semanas | ⏳ Falta el ID del Sheet del formulario |

**Tareas externas en paralelo:** EXT-01 reunir los valores de amortización · EXT-02 revisión RGPD.

---

## §2 Backlog

**Prioridad:** 1 seguridad/datos · 2 defectos Must · 3 habilitadores de calidad · 4 Must/Should pendientes · 5 deuda · 6 Could · 7 fases futuras.

### Defectos (B)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| B-01 | Funciones internas, de mantenimiento y de administración invocables con `google.script.run` sin autorización, con los privilegios de la cuenta operativa | RF-05, RNF-20, R-16 | 1 | M | ✅ S8 |
| B-02 | "Buscar Reserva" devuelve también las canceladas (`coincideBusqueda`) | HU-06, RF-11 | 2 | XS | ✅ S8 |
| B-03 | `reescribirServiciosDeReserva` hace `clearContents()` y reescribe toda la hoja: un fallo intermedio pierde datos | HU-24, RF-49, RNF-14 | 1 | S | ✅ S8 |
| B-04 | `actualizarReserva` no valida los valores de dominio (cobro, contrato, incidencias, checklists) ni impide editar reservas canceladas | HU-23, RF-46, RNF-24 | 2 | S | ✅ S8 |
| B-05 | Posible XSS: datos del huésped insertados como HTML en el cliente y en el email del informe (sin auditar) | RNF-26 | 1 | M | ✅ S8 |
| B-06 | Comentarios obsoletos en `auth.gs` (`USER_ACCESSING`) y `gestion.gs` (lista de activas) | CLAUDE.md §4.9 | — | XS | ✅ Corregido en S7 |
| B-07 | La poda de vídeos no borra las carpetas de reserva vacías | HU-30, RF-70 | 4 | S | ✅ S8 |
| B-08 | Informes sin % de ocupación ni completadas frente a canceladas (columna `Ocupacion` siempre vacía) | HU-32, RF-62 | 4 | M | S12 (tras D-13) |
| B-09 | El evento de Calendar no se actualiza al editar el nombre del huésped | HU-19, RF-41 | 4 | S | ✅ S8 |
| B-10 | Nombres de espacio en el código (`drive.gs` `PALABRAS_ESPACIO`, `calendario.gs` colores, `gastos.gs` listas) e ID de carpeta de vídeos en la semilla de `setup.gs` | RNF-23, RNF-27 | 5 | M | ✅ S8 |
| B-11 | El evento de Calendar se crea antes de escribir la reserva: si falla la escritura, queda un evento huérfano | RF-36, RNF-14 | 2 | XS | ✅ S8 |
| B-13 | El cliente fija en 100 MB el máximo de vídeo en vez de leer `Tamano_Max_Video_MB` de Config (el servidor sí lo valida bien) | RNF-27 | 6 | XS | Backlog |
| B-12 | Contrastes WCAG AA sin auditar. **Hecho:** test de contraste de todos los pares de color (el verde de éxito no llegaba: 4,07 → `#468144`, 4,68) y áreas táctiles ≥ 44 px (botones 42 px, "Ver más"/"Modificar" 30 px, enlace al calendario 20 px → corregidos). Queda la auditoría axe completa | HU-25, HU-28, RNF-12 | 4 | S | ✅ S11 (axe: backlog) |
| B-17 | En móvil, con al menos una reserva, la tabla "Últimas reservas" (y la de búsqueda y el historial) ensanchaba la página a 548 px en un móvil de 393: el navegador la alejaba o obligaba a desplazarse de lado. Detectado por los E2E; corregido con el contenedor `tabla-scroll` ya usado en Gestionar | RNF-11 | 2 | XS | ✅ S11 |
| B-14 | El evento de Calendar no se creaba cuando la reserva la registraba `esperanzavegafdez` (10 fallos entre 30/06 y 26/09, reservas 003–009 y 011–013); con `fcsainz` sí. Causa (confianza alta): la implementación publicada se ejecuta como quien accede, y esa cuenta no llega al calendario operativo (`getCalendarById` → `null`). Además, el fallo era silencioso para el usuario. **Corregido en código:** aviso modal + incidencia al admin (F-21). **Pendiente en el despliegue:** compartir el calendario con cada usuario (ADR-0017; "Ejecutar como: Yo" queda descartado porque no identifica a nadie) + reconciliación (ACC-03) | RF-36, RF-82, ADR-0001 | 1 | S | **S14** ✔ código · despliegue |
| B-15 | La referencia `NN/AA` usaba el año de entrada; debe ser el año en que se crea la reserva (D-04) | RF-31, ADR-0014 | 2 | XS | ✅ S14 |
| B-16 | "Inicializar / reparar hojas" reescribía las cabeceras de hojas existentes en el orden del esquema (renombraba columnas con datos) y, si faltaba una cabecera, la app leía y escribía en la columna de su posición en el esquema: riesgo de corromper datos reales | RF-72, R-19, D-19 | 1 | S | ✅ S14 |
| B-18 | Si se edita una checklist ya terminada y queda un punto pendiente, sigue marcada "Hecho" | RF-85 | 5 | XS | Backlog |
| B-19 | La detección de daños al terminar el check-out se basa en que el punto empiece por "Sin daños": si el admin cambia ese texto, deja de avisar | RF-85 | 6 | XS | Backlog |
| B-20 | En producción (v1), `gastos_interfaz.html` contiene una copia de la pantalla de Gestionar (error de copia/pega detectado en el `clasp pull` del 2026-09-27); la pestaña Gastos publicada puede no funcionar. Se corrige con el `push` de la v2 | HU-33 | 2 | XS | ✅ Despliegue v2 (2026-09-27) |
| B-21 | En Gestionar, el código de reserva del canal solo se valida en el servidor: si se vacía en una reserva de Airbnb que lo tenía, el aviso llega al guardar, no en línea (CLAUDE.md §4.7) | RF-88 | 6 | XS | Backlog |

### Tests (T)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| T-01 | Arnés unitario: `package.json` (solo dev), cargador `vm` de los `.gs`, dobles de servicios de Google | RNF-29 | 3 | M | ✅ S8 |
| T-02 | Tests unitarios del dominio: solapamiento, importes, fechas, validaciones, estado, IDs, resumen fiscal, amortización, validación de archivos, purgas | RNF-29 | 3 | L | ✅ S8 |
| T-03 | GitHub Actions: lint + unitarios (+ E2E cuando exista) en cada push | RNF-29, RNF-33 | 3 | S | ✅ S8 |
| T-04 | Integración contra Google: **chequeo de salud de solo lectura en producción** (calendario, carpetas, columnas, Config, admins, cuota de email, "Ejecutar como") en las tareas nocturnas y a demanda, con aviso; sin entorno duplicado | RNF-29 | 3 | M | S19 |
| T-05 | E2E con Playwright: servidor local que resuelve `include` y simula `google.script.run`; journeys J-1 a J-6; viewport móvil | RNF-08, RNF-11 | 3 | L | ✅ S11 (29 E2E en escritorio y móvil, en CI) |
| T-06 | Checklist de smoke post-despliegue en DEVELOPMENT.md | RNF-19, RNF-20 | 3 | XS | S9 |
| T-07 | ESLint con globals de Apps Script y reglas propias (`no-var`, patrones prohibidos) | RNF-28 | 3 | S | S9 |
| T-08 | Configurar clasp: `.clasp.json` (desde `.clasp.json.example` con el ID del script), `clasp pull` a una carpeta temporal y comparar con `docs_dev/src/` **antes** del primer `push`, scripts `npm run push` / `deploy` con `--user familia` | ADR-0015, RNF-27 | 3 | S | S9 — `.clasp.json` y comparación hechos (2026-09-27); faltan los scripts npm |

### Deuda técnica (REF / TD) — detalle en [arc42 §11.2](../docs_dev/solution/arc42.md#112-deuda-técnica)

| ID | Descripción | Prio | Talla | Sprint |
|---|---|---|---|---|
| REF-01 | Importes y validaciones de reserva en un único sitio (dominio puro) | 5 | M | ✅ S8 |
| REF-02 | Mapa de columnas derivado de `ESQUEMA_HOJAS` | 5 | M | ✅ S8 |
| REF-03 | Envoltorio común de endpoint (autorización + try/catch + lock) | 5 | S | ✅ S8 |
| REF-04 | Dividir funciones > 30 líneas | 5 | M | ✅ S8 |
| TD-01 | `registrarLog_` y `registrarError_` escriben con `appendRow` en el orden del esquema: si se reordenan las columnas de `Logs` o `Errores`, los registros nuevos quedan desalineados (no afecta a otras hojas) | 5 | XS | Backlog |
| TD-02 | `Registro_Checklist` se reescribe entera en cada guardado (atómico, pero crece con cada reserva: ~40 filas por lista); valorar escribir solo las filas de la reserva si se nota lentitud | 6 | S | Backlog |
| TD-03 | `Config.Calendar_Url` repite lo que ya dice `Calendar_Id`: derivar el enlace del ID en el código y retirar la clave (hoy relleno a mano, 2026-09-27) | 6 | XS | Backlog |
| TD-04 | Las funciones puras de las copias (`tocaCopia_`, `claveSemana_`, `copiasAConservar_`) viven en `infra_mantenimiento.gs`; por §3.3 irían en un `dominio_mantenimiento.gs` (fichero nuevo: requiere OK) | 5 | XS | Backlog |

### Funcionalidades (F / HU)

| ID | Descripción | Ref. | Prio | Talla | Sprint |
|---|---|---|---|---|---|
| F-01 | Editar canal y fechas hasta el check-in (sin cambio de espacio) con revalidación de solapamiento | HU-38, RF-80, ADR-0005 | 6 | L | S13 |
| F-02 | Recordatorios automáticos si una reserva no se cierra: email a los copropietarios a los 10 y 15 días, y luego cada 7 días hasta que se cierre — requiere diseño y ADR | HU-37, RF-79 | 6 | L | S13 |
| F-03 | Flujo de incidencias y mantenimiento no ligado a una reserva — requiere discovery | antiguo SDD §5.7 | 6 | ? | Backlog |
| F-04 | Reconciliación automática periódica de Calendar | ADR-0010 | 6 | S | S13 |
| F-05 | Métricas adicionales por zona (el botón de recálculo manual ya existe) | ADR-0009 | 4 | M | S12 |
| F-06 | Exportar a CSV o Excel para declaraciones | Backlog v0.5 | 7 | M | Futuro |
| F-07 | Vista de informes históricos en la app | Backlog v0.5 | 7 | M | Futuro |
| F-08 | Bot de Telegram como canal de aviso | ADR-0006 | 7 | M | Futuro |
| F-09 | Copia externa periódica y archivo de las filas purgadas | ADR-0013, R-14 | 7 | M | Futuro |
| F-10 | Catálogo de tipos de documento (contrato, dni…) | ADR-0014 | 6 | S | Backlog |
| F-11 | Roles de propietario: **soporte, gestión y admin** (admin = soporte + gestión; lo que ve soporte también lo ve gestión, no al revés). Hoy nadie tiene "soporte" asignado — falta decidir quién. Requiere nueva columna en `Usuarios_Autorizados` | ADR-0001 | 6 | M | ✅ S15 (RF-84; valores del Sheet pendientes del conector de Google Sheets) |
| F-12 | Logotipo, iconos y maquetas de alta fidelidad | design-system §9 | 6 | M | Backlog |
| F-13 | El evento de Calendar debe invitar a los usuarios autorizados para que acepten (el propio Calendar les envía la invitación) | ADR-0010 | 4 | S | ✅ S14 (RF-83) |
| F-14 | Checklists digitales de check-in y check-out, distintas para Piscina/Jardín y Habitación; módulo BBQ condicional (solo si el servicio extra está en la reserva); cerrar una reserva pasa a exigir **cobrado + checkout realizado** (antes solo cobrado). Plantilla actual de Piscina/Jardín en [Checklist_Piscina_Jardin.pdf](doc_check/Checklist_Piscina_Jardin.pdf) (a mejorar con la experiencia de uso); la de Habitación se diseña de cero, digital | HU-24 (checklists ya existentes), nuevo RF | 4 | L | ✅ S16 (RF-85..RF-87, DD-01; E2E de las pantallas nuevas en el release) |
| F-15 | Informe de Gestión: mantener el bloque actual + nuevo bloque de agregado **mensual** (mismas métricas que el total) + nuevo módulo de análisis de precios (nº de reservas y precio medio/más frecuente por persona y espacio), pensado para alimentar a futuro un sistema de recomendación de subir/bajar precios según el flujo de reservas | HU-32, ADR-0009 | 4 | M | v2-N |
| F-16 | Informe Técnico nuevo (visible en pestaña + email, solo roles soporte/admin): KPIs de salud del sistema — propuesta de Claude a validar: errores recientes (`Logs`/`Errores`), última ejecución y resultado de las tareas nocturnas y de la copia de seguridad (ADR-0013), tamaño de las hojas (nº filas, para prever purgas), cuota de Apps Script usada (`MailApp.getRemainingDailyQuota()`, tiempo de ejecución de triggers), vídeos pendientes de poda, accesos denegados recientes, y (cuando exista) estado de las comunicaciones SES pendientes/erróneas | F-11 (rol) | 4 | M | v2-N |
| F-17 | Precios y fichas de la competencia (Airbnb, Cocopool) por scraping propio: sin sesión de anfitrión, solo datos no personales, frecuencia baja, detección de roturas con aviso y lectores reconstruibles; empieza por una prueba de viabilidad (Apps Script frente a GitHub Actions + Playwright) | F-15 | 6 | S + M/L | S19–S20 |
| F-18 | Rediseño estético e informativo de todos los emails (confirmación, cierre de canales, informes, incidencias, Informe Técnico) con plantilla común | ADR-0006 | 5 | M | S18 |
| F-19 | Registro de gastos: directos (de una reserva) e indirectos (por pieza: interior, exterior, finca), inversiones amortizables; formulario de tres preguntas en llano | ADR-0012, D-18 | 4 | M | S17 |
| F-20 | Informe del IRPF por copropietario y agregado, con importes por casilla y explicación del cálculo; comprobar si aplica modelo 184 / atribución de rentas | ADR-0012, D-15 | 4 | L | S21 |
| F-21 | Avisos y errores en ventana modal que el usuario debe cerrar (éxitos: mensaje centrado que se cierra solo) + botón "Enviar al administrador" que manda a las cuentas `Rol = Admin` el detalle técnico del error. **Nota:** usa ya la columna `Rol`; al diseñar F-11, "Admin" debe encajar con los roles soporte/gestión/admin | HU-39, RF-81, RF-82 | 1 | M | ✅ S14 (E2E en S11) |
| F-22 | Código de reserva de la plataforma en la reserva: obligatorio en Airbnb (columna `Requiere_Ref_Canal` del catálogo), opcional en el resto; editable con auditoría | HU-40, RF-88 | 4 | S | ✅ 2026-09-27 |
| — | Registro de viajeros — ver [referencia-tecnica-ses-hospedajes.md](docs_ses/referencia-tecnica-ses-hospedajes.md) (campos, webservice, catálogos). Ampliado: el formulario de huéspedes es un **Google Form con su propio Sheet**, distinto del de KAF Rent; hace falta sincronizar datos en ambos sentidos, un paso de **verificación presencial del DNI/NIE/Pasaporte** por un copropietario que dispara la comunicación a SES, y un email a los copropietarios con el resultado — ver ADR-0007 ampliado. **Falta el ID/URL de ese Sheet de Formulario** para diseñar la sincronización | HU-35, HU-36, ADR-0007 | 7 | XL | Fase 2 |

### Tareas externas (EXT)

| ID | Descripción | Ref. |
|---|---|---|
| EXT-01 | Reunir los datos para validar el IRPF (no hay gestor, D-15): valor de construcción de la casa (escritura o recibo del IBI), coste de las instalaciones exteriores (piscina, pérgola, BBQ, WC) y del mobiliario, y los gastos reales del ejercicio | ADR-0012, D-15 |
| EXT-02 | Revisión RGPD: registro de actividades (art. 30), política de retención de huéspedes y viajeros (fotos de documentos) | RNF-35, RNF-37, R-03, R-11 |
| EXT-03 | ~~UAT de los journeys~~ → hecho de facto: la app se usa con reservas reales y los tres copropietarios la manejan solos (D-07, 2026-09-27) | RNF-08, R-10 |

---

## §3 Histórico de sprints completados

| Sprint | Contenido | Versión | Hito |
|---|---|---|---|
| S0 | Discovery y diseño (PRD ágil, SDD, ADR-0001 a 0006) | 0.5.0 (2026-06-22) | — |
| S1 | Infraestructura, autenticación, shell, esquema del Sheet | 1.0.0 | M1 ✅ acceso con Google funcionando |
| S2 | Inicio (últimas 5, buscador) y formulario Crear Reserva (parte I) | 0.9 → 1.0.0 | — |
| S3 | Fechas por modo, solapamientos, importes, guardado, avisos y confirmación | 1.0.0 | M2 ✅ primera reserva de principio a fin |
| S4 | Gestionar Reserva: lista, edición auditada, ciclo de vida, contrato, vídeos, checklists, cancelación, Calendar | 1.0.0 | M3 ✅ ciclo de vida completo |
| S5 | Estadísticas, mantenimiento nocturno, informes | 1.0.0 (2026-06-29) | M4 ❓ uso real y prueba con usuarios (D-07) |
| S6 | Gastos e IRPF | 1.0.0 | — |
| S7 | Reorganización documental: CLAUDE.md, discovery con trazabilidad, MADR, arc42, próximos pasos | 2.0.0 (en curso) | — |
| S8 + S10 | Código alineado: capas, seguridad, defectos, tests y CI (84 tests, ≈ 98 % de cobertura) + doble revisión de cierre | 2.0.0 (en curso, sin desplegar) | — |
| S14 | Calendar y reservas fiables: B-14 (aviso + incidencia), B-15 (año de la referencia), B-16 (reparar hojas seguro), F-13 (invitaciones), F-21 (avisos en ventana) | 2.0.0 (sin desplegar) | — |
| S11 | Tests de interfaz: servidor E2E + Playwright (29 E2E, escritorio y móvil), contrastes y áreas táctiles (B-12), B-17 (tablas en móvil); T-04 pasa al release | 2.0.0 (sin desplegar) | — |
| S15 | Roles (F-11, RF-84) y plantilla de design doc (D-09) | 2.0.0 (sin desplegar) | — |
| S16 | Checklists digitales (F-14, DD-01, RF-85..87): 4 listas, "No aplica", confirmación, vídeo y fotos, editor del admin, cierre = cobro + check-out | 2.0.0 (sin desplegar) | — |
| Despliegue v2 (parcial) | clasp (ACC-02), copias abuelo-padre-hijo (ADR-0016), código de reserva del canal (F-22, RF-88), ejecutar como quien accede (ADR-0017), Sheet preparado y eventos reconciliados; v2 publicada. Falta smoke T-06 e icono del móvil (D-23) | 2.0.0 (publicada 2026-09-27, implementación v37) | M4 ✅ |
| v1.1 | Coste fijo del canal, columna Personas, `USER_DEPLOYING`, reconciliación de Calendar | 1.1.0 (2026-07-27) | — |

---

## §4 Cómo se regenera este documento

Lo hace Claude al cierre de cada sesión, después de la doble revisión ([CLAUDE.md §2.2–§2.4](../CLAUDE.md)):

1. **§0:** decisiones abiertas con el formato de CLAUDE.md §2.1; se quitan las resueltas (la resolución queda en el CHANGELOG o en un ADR).
2. **§2:** se recorren las fuentes y se añade o cierra cada ítem con su ID estable:
   - HU con estado distinto de ✅ ([02](../docs_dev/discovery/02_historias_usuario.md)); RF y RNF con estado distinto de ✅ ([03](../docs_dev/discovery/03_requisitos_funcionales.md), [04](../docs_dev/discovery/04_requisitos_no_funcionales.md)).
   - Hallazgos de la revisión (B-NN) y deuda de arc42 §11.2.
   - "Cuestiones abiertas" de cada ADR.
   - Riesgos abiertos con acción (arc42 §11.1) y tareas externas.
3. **§1:** se reagrupa el backlog en sprints por orden de prioridad, con un objetivo por sprint y un tamaño manejable (orientativo ≤ 20 h), sin fecha fija.
4. **§3:** los sprints terminados pasan al histórico con su versión.
