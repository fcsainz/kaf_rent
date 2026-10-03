# Valor de KAF Rent a precio de mercado

**Versión:** 1.3 · **Fecha:** 2026-10-03 · **Método:** comparables de mercado (decisión del usuario, 2026-10-02) + coste de reposición y análisis con amortización (decisión del usuario, 2026-10-03)
**Preguntas que responde:**
1. ¿Cuánto costaría cubrir lo que hace KAF Rent con las herramientas que se venden hoy? (secciones 1–3: **valor de uso**, en cuotas anuales)
2. ¿Cuánto costaría encargar la app entera a precio de mercado? (sección 4: **valor de reposición**)
3. ¿Compensa una cosa frente a la otra, amortizando el desarrollo? (sección 5)

**Cómo se ha calculado:**
- Para cada función se busca la herramienta comercial más parecida y se calcula su cuota anual para nuestro caso: dos espacios (Piscina / Jardín y Habitación Interior) y tres copropietarios.
- Precios públicos consultados el 2026-10-02 (fuentes al final), sin IVA. Los precios en dólares se pasan a euros a 0,92 € por dólar (cambio aproximado, no verificado).
- El coste de desarrollarlo (reposición) se calcula aparte en la sección 4, con tarifas de mercado consultadas el 2026-10-03; el usuario lo pidió el 2026-10-03 tras descartarlo el 2026-10-02.
- **Límite del método:** que una herramienta "cubra" una función no significa que encaje igual. La columna *Cobertura* indica cuánto se parece.

**Corte temporal:** "hasta ayer" es todo lo que está en el repositorio hasta el commit `v2.4` (c89ab4e). La sección 2 son los cambios de la sesión del 2026-10-02 (commit `v3 SES`); la 2 bis, los de la mañana del 2026-10-03 (DD-03, commit `Commit reinicio`), y la 2 ter, los de la tarde del 2026-10-03 (S35–S36, sin commit aún).

> **Revisión 1.1 (2026-10-03).** La versión 1.0 se quedaba corta por dos huecos de método, no por los precios:
> 1. **Faltaba la Piscina por horas.** Smoobu y Lodgify venden noches; para una piscina por horas haría falta además una agenda de reservas por horas (SimplyBook.me). Se suma.
> 2. **Faltaban las cuentas de los copropietarios.** Smoobu incluye una cuenta; cada cuenta más con permiso de escritura cuesta desde 12 €/mes. Con tres copropietarios son dos más. Se suma.
>
> Con eso, la cifra sube un ≈ 45 %. Sigue siendo modesta porque el software para pequeños propietarios es barato; el valor que el mercado no cobra está en el encaje (sección 1, al final).

---

## 1. La idea original y el trabajo hasta ayer (v0.5 → v2.4)

**La idea:** una sola app, gratuita y propia, para que tres copropietarios no técnicos gestionen desde el móvil dos alquileres muy distintos.
- **Piscina / Jardín:** alquiler por horas o por día, con canales como Cocopool.
- **Habitación Interior:** alquiler por noches, con canales como Airbnb.

Los datos viven en su propio Google Sheet y se reparten a tercios para el IRPF.

**Qué hacía ya:** reservas con catálogos en cascada y control de solapes; varios canales con comisión y código de reserva; calendario compartido; avisos para cerrar y reabrir canales; gestión, cancelación e historial; contratos y vídeos en Drive; checklists de entrada y salida con fotos de daños; estadísticas; informes mensuales y trimestrales; gastos deducibles y resumen fiscal a tercios con amortización; roles; copias de seguridad; avisos de incidencias. Detrás: unas 4.750 líneas de código, 18 ADR y tests automáticos con integración continua.

| Función | Comparable de mercado | Precio público | Coste anual para KAF | Cobertura |
|---|---|---|---|---|
| Reservas, calendario, canales, avisos, estadísticas e informes | **Smoobu** Professional (PMS + channel manager) | 35 €/mes la 1.ª unidad + 12 €/mes cada una más; −10 % pagando al año | **510–565 €** (2 unidades) | Alta para la Habitación; **baja para la Piscina por horas** (orientado a noches; no verificado a fondo) |
| Igual, alternativa | **Lodgify** Professional | ≈ 42 $/mes por propiedad | **≈ 930 €** | Igual que Smoobu |
| Checklists de entrada y salida con fotos | **Breezeway** Host Essentials | 1.ª propiedad gratis; 19,99 $/mes por unidad | **≈ 220 €** (1 unidad de pago) | Alta (más completo: tareas de limpieza y mantenimiento) |
| Gastos, resumen fiscal y documentos | **Rentger** | Gratis hasta 9 inmuebles | **0 €** | Media: pensado para alquiler de larga duración; sin reparto a tercios ni amortización como la nuestra (no verificado) |
| Reservas por horas de la Piscina / Jardín *(revisión 1.1)* | **SimplyBook.me** Basic (agenda de reservas por horas, 100 reservas al mes) | 11,90 €/mes pagando al año; 13,90 € al mes | **≈ 145–170 €** | Alta para reservar por horas; sin canales ni comisiones como los nuestros |
| Tres copropietarios con acceso *(revisión 1.1)* | **Smoobu**: cuentas adicionales con permiso de escritura | desde 12 €/mes cada una | **≈ 260–290 €** (2 cuentas más; con o sin el 10 % anual) | Alta |
| Copias, roles, incidencias | Incluido en los anteriores | — | 0 € | Media |

**Valor de mercado hasta ayer: ≈ 1.135–1.610 € al año** en cuotas que no se pagan (PMS, reservas por horas, cuentas y operaciones). *(Versión 1.0: 730–1.150 €.)*

**Lo que el mercado no da, y es el valor real de la idea:**
- **Un solo sitio para dos negocios distintos.** Ninguna de las herramientas consultadas está pensada para alquilar una piscina por horas junto a una habitación por noches. Con el mercado haría falta combinar 2 o 3 herramientas, con 2 o 3 accesos y datos duplicados.
- **Reparto a tercios entre copropietarios** y gastos deducibles con amortización según la normativa del IRPF de alquileres.
- **Sin comisiones por reserva.** Smoobu Flex cobra un 0,9 % y Lodgify Starter un 1,9 % de cada reserva; KAF Rent, nada.
- **Datos propios** en su Google Sheet, sin depender de que un proveedor suba precios o cierre.

---

## 2. Lo hecho hoy (2026-10-02)

| Bloque | Qué se ha hecho |
|---|---|
| S22 y S23 | Calendar fiable con varias cuentas, horas obligatorias, corrección de reservas a 00:00, checklists con tipo "Daños", interfaz móvil (logo, navegación en dos pisos, últimas reservas) |
| S9 | ESLint, checklist de prueba tras implementar, scripts de clasp |
| S26–S28: SES.Hospedajes | Comunicación automática de la reserva y del parte de viajeros, reintentos y avisos, anulación al cancelar, catálogos oficiales mensuales, validación presencial en el móvil, mensaje de WhatsApp con el Form prerrellenado, Form adaptado con su propio script, comprobación de conexión; **activo en producción** |
| Emails (D-35, D-41) | Plantilla común con logo, botones y datos técnicos; avisos de SES de éxito y de fallo; informes con comparativa frente al periodo anterior y al mismo periodo del año anterior |
| Tamaño | De ≈ 4.750 a ≈ 7.200 líneas de código, de ≈ 2.350 a ≈ 3.800 líneas de tests (286 unitarios y 31 E2E), 4 ADR nuevos (22 en total), 96 requisitos funcionales trazados |

| Función nueva | Comparable de mercado | Precio público | Coste anual para KAF | Cobertura |
|---|---|---|---|---|
| Registro de viajeros en SES.Hospedajes | **Chekin** Basic | 3,95 €/mes por propiedad pagando al año (4,95 € al mes; mínimo 3 unidades en pago mensual); 10 % de comisión en ventas adicionales | **≈ 47 €** (1 propiedad, anual) | Alta. Chekin añade escaneo del documento; KAF Rent añade comunicar también la reserva (RH), anular al cancelar y validar en persona desde la ficha |
| Igual, alternativa | **Partee** | Desde ≈ 1,49–1,69 €/mes | **≈ 20 €** | Alta para el parte; menos integrado con las reservas |
| Emails con plantilla, informes comparativos, móvil, fiabilidad | Incluido en los PMS de la sección 1 | — | 0 € adicional | — |

**Valor de mercado de lo de hoy: ≈ 20–60 € al año más.**

Su valor práctico es mayor que su precio. Cumple una **obligación legal** (RD 933/2021) sin trabajo manual en cada reserva de la Habitación y sin una herramienta más que pagar y aprender. Además, lo hecho hoy deja la app fiable y usable en el móvil, que es el 90 % del uso real.

---

## 2 bis. Lo hecho el 2026-10-03 (DD-03, S31–S34; pendiente de validar e implementar)

| Bloque | Qué se ha hecho |
|---|---|
| Navegación | Menú Admin, barra propia de Reservas, Inicio con próximas o últimas, calendario que se abre en la app del móvil |
| Gestionar | Lista en tarjetas sin scroll lateral, filtros al momento, paginación; ficha en pantalla propia para consultar y modificar, con aviso de cambios sin guardar |
| Tareas de la reserva | Checklist (IN/OUT), validar identidades, firma del contrato con fotos (borrado a los 5 años) y cobro de servicios aparte, cada una con la reserva propuesta |
| Avisos | Email de cobro pendiente cada 10 días con "Sí, se ha ingresado" desde el propio email; avisos de check-in y check-out sin hacer |
| Datos | Puesta al día de check-in/out pasados, códigos del canal desde el Form y "Completada" → "Cerrada" |
| Tamaño | ≈ 8.000 líneas de código y ≈ 4.700 de tests (349 unitarios y 59 E2E), 1 ADR nuevo (23), 103 requisitos funcionales trazados |

| Función nueva | Comparable de mercado | Coste anual para KAF | Cobertura |
|---|---|---|---|
| Recordatorios de cobro y de check-in/out, tareas por reserva | Incluido en Smoobu (mensajes automáticos) y Breezeway (tareas), ya contados | 0 € adicional | Media: no preguntan "¿se ha ingresado?" ni marcan desde el email |
| Fotos del contrato con borrado automático | Sin comparable consultado (los PMS guardan documentos sin política de borrado) | Sin cifra | — |
| Cobro de servicios aparte | Incluido en los PMS (extras de la reserva) | 0 € adicional | Media |

**Valor de mercado de lo del 2026-10-03: ≈ 0 € al año más.** Es trabajo de **usabilidad y encaje**, no de funciones nuevas que el mercado cobre aparte. Su valor está en el uso diario: una reserva se abre en 3 toques sin desplazarse de lado en el móvil (90 % del uso), y la app recuerda lo que antes dependía de la memoria.

## 2 ter. Lo hecho el 2026-10-03 por la tarde (S35 y S36; subido a `/dev`, pendiente de implementar)

| Bloque | Qué se ha hecho |
|---|---|
| Copias (D-49, D-50, ADR-0024) | La copia nocturna guarda también las respuestas del Form de viajeros (foto `.xlsx`), cada origen con su rotación; cada copia queda en `Logs`; procedimiento de restauración escrito |
| Cerrar días (F-48, D-13) | Días en que un espacio no se alquila: bloquean reservas, salen en gris en Calendar y no cuentan como abiertos |
| Estadísticas por canal (F-49) | Ocupación por espacio y canal en su unidad (noches o horas), ingreso por unidad abierta, evolución de 12 meses; el email mensual añade la ocupación y reparte las noches entre meses |
| Errores y diseño | B-30 (fuera el error del icono en cada apertura) y DD-04, que diseña también tarifas, análisis de precios y experimentos (S37) |
| Tamaño | ≈ 8.700 líneas de código y ≈ 5.230 de tests (389 unitarios y 61 E2E), 1 ADR nuevo (24), 1 design doc nuevo (4), 44 HU y 108 RF trazados (medido el 2026-10-03) |

| Función nueva | Comparable de mercado | Coste anual para KAF | Cobertura |
|---|---|---|---|
| Ocupación por canal y días cerrados | Incluido en los PMS de la sección 1 (Smoobu y Lodgify traen informes de ocupación y bloqueo de fechas), ya contados | 0 € adicional | Media: venden noches; no miden por horas la Piscina ni reparten por tramos |
| Copia del Form de viajeros | Incluido en Chekin/Partee (guardan los partes), ya contado | 0 € adicional | — |

**Valor de mercado de lo de esta tarde: ≈ 0 € al año más.** Adelanta parte del Informe de Gestión (S18), que ya se contaba a 0 €. Su valor es poder decidir precios y canales con datos propios.

## 3. Suma y lo que vendrá

| Bloque | Valor de mercado anual |
|---|---|
| Idea y trabajo hasta v2.4 (revisión 1.1) | 1.135–1.610 € |
| 2026-10-02: SES.Hospedajes | 20–60 € |
| 2026-10-03: DD-03 | 0 € (usabilidad y encaje) |
| 2026-10-03 tarde: copias, cerrar días y ocupación (S35–S36) | 0 € (incluido en los PMS) |
| **Total actual** | **≈ 1.155–1.670 € al año** (≈ 5.775–8.350 € en 5 años, a precios de hoy). *Versión 1.0: 750–1.210 €.* |

**Lo que vendrá** (sprints pendientes en [PROXIMOS_PASOS](PROXIMOS_PASOS.md)):

| Sprint | Función | Comparable | Valor anual |
|---|---|---|---|
| S20 (+ S19) y S37 | Precios de la competencia, historial de tarifas, análisis de precios y experimentos (DD-04) | Precios dinámicos de Smoobu: 12,99 €/mes por propiedad | ≈ 310 € (2 propiedades). Cobertura parcial: KAF Rent leerá precios y medirá experimentos, no los fijará solo |
| S18 | Informe de gestión: el resto (canceladas en el email, análisis de precios) | Incluido en los PMS | 0 € adicional |
| S17 | Registro de gastos más rápido | Rentger (gratis) | 0 € |
| S21 | Informe del IRPF por copropietario, con casillas | Sin comparable consultado: es trabajo de gestoría | Sin cifra (no buscado) |
| S24, S13 | Vídeos grandes, edición de reservas, reconciliación de Calendar | Incluido en PMS y herramientas de operaciones | 0 € adicional |

**Total con lo que vendrá: ≈ 1.465–1.980 € al año** (≈ 7.325–9.900 € en 5 años), más el informe del IRPF, que no tiene precio comparable.

**Conclusión:**
- A precio de mercado, KAF Rent sustituye ≈ 1.150–1.700 € al año de suscripciones (≈ 1.450–2.000 € con lo que vendrá). No es una cifra grande, porque el software para pequeños propietarios es barato.
- Su valor diferencial no está en el precio sino en el **encaje**: un solo sitio para dos alquileres muy distintos, pensado para tres copropietarios, con la obligación de SES automatizada, sin comisiones y con los datos en casa.
- Ese encaje ninguna herramienta consultada lo ofrece, y combinarlas costaría tiempo, accesos y datos duplicados.

---

## 4. Cuánto costaría encargar la app entera (valor de reposición)

**Pregunta:** si hubiera que encargar hoy a un profesional una app como KAF Rent, con su documentación y sus tests, ¿cuánto costaría?

**Método (estimación por módulos, contrastada con el tamaño real):**
1. Horas por módulo para un perfil con experiencia, incluyendo análisis, diseño, código, tests y documentación (tabla de abajo).
2. Contraste con el tamaño del repositorio (medido el 2026-10-03, tras S36): ≈ 8.700 líneas de código, ≈ 5.230 de tests (389 unitarios y 61 E2E) y ≈ 5.230 de documentación (44 HU, 108 RF, 38 RNF, arc42, 24 ADR, 4 design docs). Las horas resultantes salen a ≈ 10–15 líneas de código y test por hora, un ritmo normal en un proyecto pequeño, documentado y con tests (orden de magnitud, no medido).
3. Tarifas de mercado en España en 2026, sin IVA (fuentes al final).

| Módulo | Horas |
|---|---|
| Descubrimiento, requisitos y arquitectura (problema y JTBD, 44 HU, 108 RF, 38 RNF, arc42, 24 ADR, 4 design docs) | 85–125 |
| Base: Apps Script en capas, esquema del Sheet, autorización y roles, `Config`, registro de errores | 60–90 |
| Crear reserva: catálogos en cascada, importes, solapes, Calendar, avisos de canales | 60–90 |
| Gestionar: listado, filtros, ficha, edición auditada, cancelación, historial, servicios y cobros | 70–100 |
| Documentos y vídeos en Drive, contrato en fotos, retención | 30–45 |
| Checklists digitales con editor para Admin | 50–70 |
| Estadísticas por canal con ocupación, cerrar días, informes con comparativa y plantilla de emails (20 maquetas) | 75–105 |
| Gastos y resumen fiscal a tercios con amortización | 30–45 |
| SES.Hospedajes: Form con script propio, XML de reserva y parte, reintentos, anulación, validación presencial, catálogos oficiales | 120–180 |
| Avisos automáticos, triggers, copias abuelo-padre-hijo (Sheet y Form) y purgas | 45–65 |
| Interfaz móvil, sistema de diseño y accesibilidad | 50–80 |
| Tests y calidad: dobles de Google, servidor E2E, 389 + 61 tests, integración continua, lint | 105–155 |
| Gestión del proyecto, despliegues y soporte a la prueba con usuarios (≈ 10 %) | 80–120 |
| **Total** | **≈ 860–1.270 h** (central: ≈ 1.040 h; antes de S35–S36: 820–1.220 h) |

| Quién lo hace | Tarifa (2026) | Coste (860–1.270 h) | Escenario central (1.040 h) |
|---|---|---|---|
| Freelance de nivel medio | 35–55 €/h | 30.100–69.850 € | ≈ 47.000 € (45 €/h) |
| Freelance sénior | 55–90 €/h | 47.300–114.300 € | ≈ 73.000 € (70 €/h) |
| Empresa de desarrollo | 55–95 €/h | 47.300–120.650 € | ≈ 78.000 € (75 €/h) |

**Valor de reposición de KAF Rent: ≈ 47.000–78.000 €** (escenario central; ≈ 62.000 € como cifra de referencia), sin IVA. Lo de la tarde del 2026-10-03 añade ≈ 40 h (≈ 2.000 € en el escenario central).
**Mantenimiento si fuera un encargo:** ≈ 15–20 % del desarrollo al año (regla habitual del sector, no verificada con fuentes): ≈ 9.300–12.400 € al año sobre 62.000 €.

---

## 5. Análisis: el desarrollo amortizado frente a las cuotas del mercado

**Amortización del desarrollo.** Un programa informático se amortiza, a efectos fiscales, con un coeficiente máximo del 33 % anual, es decir, en 3 años como mínimo (tabla de coeficientes de la Ley 27/2014 del Impuesto sobre Sociedades, aplicable también a los rendimientos de actividades en el IRPF). Como vida útil razonable se toman 3 y 5 años. No es asesoramiento fiscal: solo sirve para repartir el coste en años y compararlo.

| Sobre 62.000 € de desarrollo | Amortización anual | + Mantenimiento (15 %) | Coste anual de tenerla | Frente a las cuotas del mercado (≈ 1.155–1.670 €/año) |
|---|---|---|---|---|
| Vida útil 3 años | ≈ 20.700 € | 9.300 € | **≈ 30.000 €** | ≈ 18–26 veces más cara |
| Vida útil 5 años | 12.400 € | 9.300 € | **≈ 21.700 €** | ≈ 13–19 veces más cara |

**Periodo de recuperación** (lo que tarda el ahorro en cuotas en pagar el desarrollo):
- Con lo que hace hoy (≈ 1.410 €/año, punto medio): 62.000 / 1.410 ≈ **44 años**.
- Con lo que vendrá (≈ 1.720 €/año): ≈ **36 años**.
- Para recuperarse en 5 años, las cuotas sustituidas tendrían que valer ≈ 12.400 € al año, unas 9 veces más de lo que valen.

**Qué significa:**
- **Como compra, no compensaría.** Encargar KAF Rent a precio de mercado equivale a unos 40 años de las suscripciones equivalentes. Ningún pequeño propietario lo haría solo por ahorrarse cuotas.
- **Como desarrollo propio, sí.** El coste en dinero ha sido ≈ 0 € (Google y las herramientas son gratuitas): el trabajo ha sido propio, no pagado a un tercero. Por eso el ahorro de ≈ 1.150–1.700 € al año es neto desde el primer año.
- **Lo que el mercado no vende sigue fuera de las dos cifras:** un solo sitio para la Piscina por horas y la Habitación por noches, SES automatizado, reparto a tercios, sin comisiones y con los datos propios (sección 1). Con herramientas comerciales habría que combinar 3 o 4 y aun así no encajarían.
- **Para qué sirve el valor de reposición:** dice cuánto vale el trabajo hecho (≈ 62.000 € a precio de mercado) y cuánto costaría rehacerlo si se perdiera. Por eso importan las copias, los tests y la documentación: protegen ese valor.

| Cifra | Qué mide | Valor |
|---|---|---|
| Valor de uso | Cuotas anuales que no se pagan | ≈ 1.155–1.670 €/año (≈ 1.465–1.980 € con lo que vendrá) |
| Valor de reposición | Lo que costaría encargarla hoy | ≈ 47.000–78.000 € (referencia: 62.000 €) |
| Coste anual si se hubiera encargado | Amortización + mantenimiento | ≈ 21.700–30.000 €/año |
| Coste real en dinero | Lo pagado | ≈ 0 € (trabajo propio) |

---

## Fuentes (consultadas el 2026-10-02; SimplyBook.me, las cuentas de Smoobu y las tarifas de desarrollo, el 2026-10-03)
- Smoobu: [precios oficiales](https://www.smoobu.com/en/pricing/) (preguntas frecuentes: cuentas adicionales con escritura desde 12 €/mes) · [explicación de planes](https://support.smoobu.com/hc/en-us/articles/360003170680-How-much-does-Smoobu-cost-Plans-and-pricing-explained) · [precios dinámicos](https://www.smoobu.com/en/smoobu-dynamic-pricing/)
- Lodgify: [análisis de precios 2026](https://comparatifchannelmanager.fr/en/lodgify-pricing/) · [comisiones del plan Starter](https://www.roommaster.com/blog/lodgify-pricing)
- Breezeway: [precios oficiales](https://www.breezeway.io/breezeway-pricing)
- Rentger: [precios oficiales](https://www.rentger.com/precios)
- Chekin y Partee: [comparativa de apps de registro de viajeros 2026](https://bookcheckin.com/blog/mejores-apps-registro-viajeros-ses-2026) · [Partee](https://partee.es/) · [comparativa Chekin, Partee y Gotocheck](https://gotocheck.pro/blog/comparativa-chekin-partee-gotocheck-2026.html)
- SimplyBook.me: [precios oficiales](https://simplybook.me/en/pricing) (Basic: 11,90 €/mes pagando al año, 13,90 € al mes; 100 reservas al mes)
- Tarifas de desarrollo en España (2026): [barómetro de tarifas de Malt, fullstack](https://www.malt.es/t/barometro-tarifas/tech/desarrollador-backend/desarrollador-fullstack) · [tarifa por hora fullstack](https://tarifaautonomo.com/blog/tarifa-hora-fullstack-espana) · [sueldo y tarifas freelance](https://www.udit.es/sueldo-de-desarrollador-web-full-stack-en-espana-2026-junior-mid-senior-freelance-y-ciudades/) · [cuánto cobra una empresa de software](https://yeeply.com/cuanto-cuesta/cuanto-cobra-empresa-desarrollo-software-espana-2026/) · [cuánto cuesta un software a medida](https://www.internetwebsolutions.es/blog/cuanto-cuesta-desarrollar-un-software-a-medida-en-2026/611)
- Amortización de programas informáticos: tabla de coeficientes del art. 12 de la Ley 27/2014 (coeficiente máximo del 33 %; no verificado contra el texto vigente en esta sesión)
