# Requisitos no funcionales (RNF) — KAF Rent

**Versión:** 1.0  
**Fecha:** 2026-09-25  
**Estado:** Vigente  
**Framework:** ISO/IEC 25010:2023 (modelo de calidad del producto) + ISO/IEC/IEEE 29148 (redacción verificable)  
**Sustituye a:** `06_nfr.md` (v0.5)

---

## Convenciones

- **ID:** `RNF-NN`, agrupados por característica de calidad ISO/IEC 25010.
- Cada RNF es **medible o comprobable**: la columna *Verificación* dice cómo se comprueba (test automático, medición o revisión manual).
- **↑ Origen:** el problema (P) o la historia (HU) que lo motiva. Si no hay una HU concreta se marca **Sin HU directa**, seguido del problema o de "Transversal" (afecta a todo el sistema) y su **justificación**.
- **↓ RF:** RF que lo materializan (inverso de la columna ↓ RNF de [03](03_requisitos_funcionales.md)). Si ningún RF lo materializa, se marca **Sin RF directo**: se cumple mediante reglas de CLAUDE.md, tests, configuración o revisión.
- **↓ Sprint:** sprint en que se cumplió → sprint en que se completa o se mide, en **negrita**.
- **Prioridad:** MoSCoW. **Estado:** ✅ Cumple · 🟡 Parcial · 🔍 Sin medir o verificar · ⏳ Pendiente.
- Los RNF se concretan en código a través de RF (columna *RF*) y de las reglas de [CLAUDE.md](../../CLAUDE.md).

---

## 1. Eficiencia de desempeño

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-01 | La carga inicial del Inicio debe completarse en < 3 s con conexión estándar. | Medición manual en `/dev` (DevTools) con el volumen real | M | P-05, HU-04 | RF-08, RF-11 | — | S2 · medir **S11** | 🔍 |
| RNF-02 | Guardar una reserva (con validación de solapamiento, Calendar y emails) debe tardar < 5 s. | Medición manual; tiempo de ejecución en el panel de Apps Script | M | P-11, HU-15 | RF-29, RF-30 | — | S3 · medir **S11** | 🔍 |
| RNF-03 | El formulario debe cargar los catálogos en < 2 s. | Medición manual | S | P-11, HU-08 | RF-14, RF-15 | — | S2 · medir **S11** | 🔍 |
| RNF-04 | La sección Estadísticas debe cargar en < 1 s. Desde S36 se calcula al abrir (DD-04) con una lectura en bloque de `Reservas`, `Dias_Cerrados` y los catálogos. | Medición manual | S | HU-31 | RF-107, RF-108 | 0009 | S5 · medir **S11** | 🔍 |
| RNF-05 | El sistema debe respetar las cuotas de Apps Script de una cuenta personal (6 min por ejecución, 90 min/día de triggers, 100 emails/día): lecturas y escrituras en bloque, nunca llamadas a Sheets dentro de bucles. | Revisión de código (CLAUDE.md §4.4) + panel de cuotas | M | **Sin HU directa** · Transversal — la plataforma gratuita impone estos límites (restricción de coste, P-12) | RF-08, RF-11, RF-23, RF-34, RF-35, RF-39, RF-42, RF-61, RF-67, RF-69, RF-79, RF-100, RF-104, RF-105, RF-107 | 0009, 0013 | S1–S6 | ✅ |

## 2. Compatibilidad

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-06 | La app debe funcionar en la versión actual de Chrome (escritorio y móvil); en Firefox, Edge y Safari es deseable. | Smoke test manual por navegador; E2E con Playwright (Chromium) | M (Chrome) / C (resto) | **Sin HU directa** · Transversal — dispositivos de las personas (PER-01..03) | **Sin RF directo** — se cumple con E2E y smoke | — | **S11** (T-05, T-06) | 🔍 |
| RNF-07 | Lo que la app sube a Drive debe convivir con la estructura y los nombres manuales existentes. | Revisión manual de Drive tras subir | M | P-07, HU-28, HU-30 | RF-31, RF-54, RF-57, RF-58, RF-86 | 0014 | S4 | ✅ |

## 3. Capacidad de interacción (usabilidad)

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-08 | Ana y Luis deben completar los journeys J-1 a J-5 sin formación ni ayuda. | UAT con guion de journeys ([01_problema.md, Anexo A](01_problema.md#anexo-a--user-journeys-validación-de-usabilidad)) | M | **Sin HU directa** · P-11, JTBD-11 | RF-07, RF-09, RF-13, RF-16, RF-43, RF-55, RF-93, RF-94, RF-98 | 0008 | **S11** (T-05) + EXT-03 | 🔍 (sin UAT registrado, D-07) |
| RNF-09 | Toda acción debe dar feedback visible (carga, éxito, error); los errores dicen qué falló y cómo arreglarlo; los formatos se validan al introducirlos. | E2E + revisión con CLAUDE.md §6 | M | **Sin HU directa** · P-11 | RF-03, RF-10, RF-26, RF-33, RF-51, RF-81, RF-82, RF-94, RF-95, RF-96, RF-97 | — | S2–S4 | ✅ |
| RNF-10 | Las acciones irreversibles deben pedir confirmación explícita. | E2E (modal de cancelación) | M | HU-26 | RF-52, RF-97, RF-101 | — | S4 | ✅ |
| RNF-11 | La interfaz debe ser usable en móvil y tablet (mobile-first, sin necesitar pantalla ancha). | E2E con viewport móvil (`tests/e2e/movil.spec.js`, 393 px) + prueba manual en móvil | M *(confirmado 2026-09-25; antes Could)* | **Sin HU directa** · PER-02, PER-03 (usan móvil) | RF-07, RF-09, RF-11, RF-13, RF-42, RF-85, RF-44, RF-98, RF-104, RF-108 | 0011 | S2 · **S11** ✔ (B-17) | ✅ |
| RNF-12 | La interfaz debe cumplir WCAG 2.1 AA: contraste ≥ 4.5:1, foco visible, etiquetas asociadas, áreas táctiles ≥ 44 px, color nunca como único portador de significado. | `tests/interfaz/contraste.test.js` (contraste de los tokens) + `tests/e2e/accesibilidad.spec.js` (áreas táctiles) + E2E de foco y teclado en ventanas (`avisos.spec.js`); auditoría Lighthouse/axe + revisión manual | S | **Sin HU directa** · Transversal — personas no técnicas; Directiva UE 2016/2102 como referencia | RF-07 (barra inferior con icono y texto, áreas táctiles) · RF-81 (ventanas modales accesibles) · resto sin RF directo — tokens de diseño + auditoría Lighthouse/axe | 0011 | **S11** ✔ contraste, áreas táctiles y ventanas (B-12) · pendiente: auditoría axe completa | 🟡 |

## 4. Fiabilidad

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-13 | Ningún error puede ser silencioso: todo error de servidor se registra en `Errores` y el usuario recibe un mensaje claro. | Tests unitarios de los endpoints (camino de error) + revisión | M | **Sin HU directa** · Transversal — sin monitorización de pago, `Errores` es la única fuente de diagnóstico (R-06) | RF-37, RF-67, RF-73 | — | S1 | ✅ |
| RNF-14 | Una operación que falle a medias no debe dejar datos inconsistentes. | Tests de integración con fallos inyectados | M | **Sin HU directa** · P-12 | RF-48, RF-49, RF-50, RF-85, RF-99, RF-103 | — | S8 ✔ (B-03, B-11) | ✅ |
| RNF-15 | Las escrituras concurrentes críticas (crear, editar, cancelar, servicios, gastos) deben serializarse con `LockService`. | Revisión de código + test de integración | M | **Sin HU directa** · P-01 (R-02) | RF-30, RF-49, RF-80, RF-99 | 0003 | S3–S4 | ✅ |
| RNF-16 | Los fallos de Calendar y del email no deben bloquear la operación principal y deben poder reconciliarse después. | Tests unitarios con dobles que fallan | M | HU-17 a HU-20 | RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41, RF-82, RF-83, RF-90, RF-79, RF-100, RF-104, RF-106 | 0006, 0010, 0018 | S3–S4 | ✅ |
| RNF-17 | Debe existir copia de seguridad del Sheet con una ventana de recuperación ≥ 30 días, configurable. | Revisión mensual de la carpeta Backups | M | **Sin HU directa** · P-12 (R-08, R-14) | RF-68 | 0013, 0016 | S5 | ✅ |
| RNF-18 | La disponibilidad es la de Google Apps Script (> 99 %); no se añade infraestructura propia. | — (heredado) | M | **Sin HU directa** · Transversal — restricción de coste | **Sin RF directo** — heredado de Google | — | — | ✅ |

## 5. Seguridad

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-19 | Ningún contenido debe ser accesible sin autenticarse con Google; no hay contraseñas ni sesiones propias. | Smoke test en ventana privada | M | P-12, HU-01 | RF-01, RF-03 | 0001 | S1 | ✅ |
| RNF-20 | **Toda** función invocable desde el cliente (`google.script.run`) debe comprobar la autorización. Las funciones internas, de mantenimiento o de administración no deben poder invocarse desde el cliente. | `tests/endpoints/seguridad.test.js`: recorre los identificadores globales y exige que todo lo no listado termine en `_`; prueba de tareas del sistema desde la web | M | P-12, HU-02 | RF-02, RF-05, RF-84, RF-87, RF-101 | 0001 | S8 ✔ (B-01) | ✅ Sufijo `_` en lo interno + `ejecutarTareaDelSistema_` en triggers, menú y editor |
| RNF-21 | Desactivar una fila de `Usuarios_Autorizados` debe revocar el acceso en la siguiente petición, sin tocar código. | Test de integración | M | HU-02 | RF-02 | 0001 | S1 | ✅ |
| RNF-22 | Todo acceso (concedido o denegado) y todo cambio de negocio deben quedar trazados con usuario y fecha. | Tests de integración (Logs, Historial_Cambios) | M | **Sin HU directa** · P-03, P-12 | RF-04, RF-06, RF-45, RF-47, RF-52, RF-53, RF-56, RF-57, RF-85, RF-86, RF-99, RF-103 | 0005 | S1, S4 | ✅ |
| RNF-23 | El código no debe contener emails, IDs de hojas, carpetas o calendarios ni credenciales; se leen de `Config`. | Revisión + lint (búsqueda de patrones) | M | **Sin HU directa** · Transversal — seguridad y configurabilidad (CLAUDE.md §4.8) | RF-74 | — | S8 ✔ (B-10) | ✅ Sin nombres de espacio ni IDs en el código |
| RNF-24 | El servidor debe revalidar toda entrada del cliente (tipos, rangos, valores de dominio y existencia en catálogos). | Tests unitarios de validación | M | **Sin HU directa** · Transversal — el cliente no es de confianza | RF-17, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-27, RF-28, RF-46, RF-64, RF-88, RF-43, RF-98, RF-99, RF-101 | — | S3 → S8 ✔ (B-04) | ✅ |
| RNF-25 | Sheet, Drive y Calendar deben ser privados de la cuenta operativa y compartirse solo con las tres cuentas personales. | Revisión de permisos en Drive | M | **Sin HU directa** · P-12 | **Sin RF directo** — configuración manual de permisos + revisión | 0001 | S1 · revisar **S11** (T-06) | 🔍 |
| RNF-26 | Todo dato de usuario que se pinte en HTML (cliente o emails) debe escaparse para evitar inyección (XSS). | Escape en servidor (`escaparHtml_`, test) + `textContent` en cliente; E2E con nombres maliciosos en **S11** | M | **Sin HU directa** · Transversal — los datos del huésped vienen de fuera (plataformas) | RF-44 | — | S8 ✔ (B-05) · E2E **S11** | ✅ (E2E pendiente) |

## 6. Mantenibilidad

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-27 | Espacios, canales, servicios, categorías, usuarios, emails, mensajes, horas, carpetas y retenciones deben configurarse desde el Sheet, sin tocar código. | Revisión + RNF-23 | M | **Sin HU directa** · Transversal — un único mantenedor (R-06); requisito explícito de ADR-0003 | RF-14, RF-15, RF-16, RF-17, RF-18, RF-20, RF-29, RF-63, RF-71, RF-72, RF-74, RF-88 | 0003 | S1–S6 → S8 ✔ (B-10) | ✅ |
| RNF-28 | El código debe seguir los principios de CLAUDE.md §3–§4 (SOLID aplicado, KISS, DRY, YAGNI, Clean Code, arquitectura en capas ligera). | Capas por prefijo de fichero (`dominio_`, `infra_`, `api_`) + doble revisión de cierre; lint en **S9** (T-07) | M | **Sin HU directa** · Transversal — mantenibilidad por una sola persona | **Sin RF directo** — reglas de CLAUDE.md §3–§4 + revisión de cierre | — | S8 ✔ (REF-01..04) · lint **S9** | ✅ |
| RNF-29 | La lógica de dominio debe ser pura y tener tests unitarios automáticos que se ejecuten en local y en CI en cada push (objetivo: ≥ 80 % de líneas del dominio). | `npm test` (84 tests) y cobertura con `npm run test:cobertura` (≈ 98 % de líneas; dominio 100 %); CI en GitHub Actions | M | **Sin HU directa** · Transversal — evitar regresiones sin QA dedicado | **Sin RF directo** — infraestructura de tests T-01 a T-07 | — | S8 ✔ unitarios + endpoints + CI · **S11** E2E e integración | 🟡 Faltan E2E e integración (S11) |
| RNF-30 | Documentación, ADR y trazabilidad P→HU→RF/RNF→código→test deben estar al día al cerrar cada sesión. | Revisión 1 de fin de sesión (CLAUDE.md §2.3) | M | **Sin HU directa** · Transversal — riesgo R-06 | **Sin RF directo** — revisión de cierre | — | S7 | ✅ (tras esta reorganización) |

## 7. Flexibilidad (portabilidad)

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-31 | La app no requiere instalar nada: basta un navegador con cuenta de Google. | — | M | **Sin HU directa** · P-11 | RF-01 | — | S1 | ✅ |
| RNF-32 | Los datos deben residir en formatos exportables del ecosistema Google (Sheets, Drive) para poder migrar si Apps Script se depreca. | — | M | **Sin HU directa** · Transversal — riesgo R-07 | **Sin RF directo** — consecuencia de usar Sheets y Drive | 0013 | S1 | ✅ |

## 8. Restricciones de coste

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-33 | Coste cero: sin servicios de pago ni dependencias de ejecución; las herramientas de desarrollo (tests, CI, lint) deben ser gratuitas y no desplegarse en Apps Script. | Revisión de `package.json` y de los workflows | M | **Sin HU directa** · Restricción del proyecto (01_problema.md §9) | **Sin RF directo** — restricción sobre las herramientas | — | S7 · **S8–S9** (herramientas) | ✅ |

## 9. Cumplimiento legal (seguridad de uso / *safety*)

| ID | Requisito | Verificación | Prioridad | ↑ Origen | ↓ RF | ADR | ↓ Sprint | Estado |
|---|---|---|---|---|---|---|---|---|
| RNF-34 | Los datos de huéspedes se tratan con base legal contractual (art. 6.1.b RGPD) y minimización: solo nombre, teléfono y email opcionales. | Revisión del modelo de datos | M | **Sin HU directa** · P-12 (R-03) | RF-24, RF-77, RF-82 | — | S3 | ✅ |
| RNF-35 | Debe existir y aplicarse una política de retención: Logs 90 días, Errores 365 días, vídeos 180 días, fotos del contrato 5 años desde la salida (ADR-0023), documentos y reservas sin borrado dentro de los plazos legales. | Revisión de `Config` + tests de las purgas | M | **Sin HU directa** · P-12, P-07 | RF-57, RF-69, RF-70, RF-102 | 0013, 0014 | S5 · EXT-02 | 🟡 Falta la política RGPD formal de datos de huéspedes |
| RNF-36 | Justificantes, gastos y reservas deben conservarse ≥ 4 años (amortización: periodo + 4 años). | Revisión: la única purga de `Documentos` es la de las fotos del contrato, a 5 años (≥ 4; RF-102, ADR-0023) | M | **Sin HU directa** · P-09 | RF-54, RF-64, RF-65, RF-66, RF-102 | 0012 | S4, S6 | ✅ |
| RNF-37 | Registro de actividades de tratamiento (RGPD art. 30). | Documento legal | S | **Sin HU directa** · P-12 | **Sin RF directo** — documento legal (EXT-02) | — | EXT-02 | ⏳ |
| RNF-38 | Registro de viajeros conforme al RD 933/2021 (SES.Hospedajes). | Revisión legal + E2E del formulario | M (Fase 2) | **Sin HU directa** · P-10 | RF-76, RF-77, RF-78, RF-89, RF-90, RF-91, RF-92, RF-93, RF-94, RF-96 | 0007, 0018, 0022 | **Fase 2** (S26–S29) | 🟡 |

---

## Límites de la plataforma (referencia para el diseño)

| Límite de Apps Script (cuenta personal) | Valor | Impacto |
|---|---|---|
| Tiempo por ejecución | 6 min | Ninguna operación puede superarlo; dividir si crece |
| Tiempo total de triggers | 90 min/día | El mantenimiento nocturno es breve; vigilar si crece el volumen |
| Emails enviados | 100/día | Cada reserva envía 1–2 emails a 3 destinatarios |
| Triggers por script | 20 | Se usan 2 |
| `CalendarApp` | Dentro de la cuota diaria | La sincronización no debe bloquear (RNF-16) |
