# Valor de KAF Rent a precio de mercado

**Versión:** 1.0 · **Fecha:** 2026-10-02 · **Método:** comparables de mercado (decisión del usuario, 2026-10-02)
**Pregunta que responde:** ¿cuánto costaría cubrir lo que hace KAF Rent con las herramientas que se venden hoy?

**Cómo se ha calculado:**
- Para cada función se busca la herramienta comercial más parecida y se calcula su cuota anual para nuestro caso: dos espacios (Piscina / Jardín y Habitación Interior) y tres copropietarios.
- Precios públicos consultados el 2026-10-02 (fuentes al final), sin IVA. Los precios en dólares se pasan a euros a 0,92 € por dólar (cambio aproximado, no verificado).
- No se valora el coste de desarrollarlo (método de reposición, descartado por el usuario), solo lo que el mercado cobra por algo equivalente.
- **Límite del método:** que una herramienta "cubra" una función no significa que encaje igual. La columna *Cobertura* indica cuánto se parece.

**Corte temporal:** "hasta ayer" es todo lo que está en el repositorio hasta el commit `v2.4` (c89ab4e). "Hoy" son los cambios de la sesión del 2026-10-02, aún sin commit.

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
| Copias, roles, incidencias, varias cuentas | Incluido en los anteriores (Smoobu cobra más por el plan con varias cuentas: Teams Pro+ desde 55 €/mes) | — | 0 € (o más, si se necesita el plan de equipo) | Media |

**Valor de mercado hasta ayer: ≈ 730–1.150 € al año** en cuotas que no se pagan (PMS + operaciones).

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

## 3. Suma y lo que vendrá

| Bloque | Valor de mercado anual |
|---|---|
| Idea y trabajo hasta ayer | 730–1.150 € |
| Hoy | 20–60 € |
| **Total actual** | **≈ 750–1.210 € al año** (≈ 3.750–6.050 € en 5 años, a precios de hoy) |

**Lo que vendrá** (sprints pendientes en [PROXIMOS_PASOS](PROXIMOS_PASOS.md)):

| Sprint | Función | Comparable | Valor anual |
|---|---|---|---|
| S20 (+ S19) | Precios de la competencia | Precios dinámicos de Smoobu: 12,99 €/mes por propiedad | ≈ 310 € (2 propiedades). Cobertura parcial: KAF Rent leerá precios, no los fijará solo |
| S18 | Informe de gestión: ocupación y métricas por zona | Incluido en los PMS | 0 € adicional |
| S17 | Registro de gastos más rápido | Rentger (gratis) | 0 € |
| S21 | Informe del IRPF por copropietario, con casillas | Sin comparable consultado: es trabajo de gestoría | Sin cifra (no buscado) |
| S24, S13 | Vídeos grandes, recordatorios, edición de reservas | Incluido en PMS y herramientas de operaciones | 0 € adicional |

**Total con lo que vendrá: ≈ 1.060–1.520 € al año** (≈ 5.300–7.600 € en 5 años), más el informe del IRPF, que no tiene precio comparable.

**Conclusión:**
- A precio de mercado, KAF Rent sustituye ≈ 1.000–1.500 € al año de suscripciones. No es una cifra grande, porque el software para pequeños propietarios es barato.
- Su valor diferencial no está en el precio sino en el **encaje**: un solo sitio para dos alquileres muy distintos, pensado para tres copropietarios, con la obligación de SES automatizada, sin comisiones y con los datos en casa.
- Ese encaje ninguna herramienta consultada lo ofrece, y combinarlas costaría tiempo, accesos y datos duplicados.

---

## Fuentes (consultadas el 2026-10-02)
- Smoobu: [precios oficiales](https://www.smoobu.com/en/pricing/) · [explicación de planes](https://support.smoobu.com/hc/en-us/articles/360003170680-How-much-does-Smoobu-cost-Plans-and-pricing-explained) · [precios dinámicos](https://www.smoobu.com/en/smoobu-dynamic-pricing/)
- Lodgify: [análisis de precios 2026](https://comparatifchannelmanager.fr/en/lodgify-pricing/) · [comisiones del plan Starter](https://www.roommaster.com/blog/lodgify-pricing)
- Breezeway: [precios oficiales](https://www.breezeway.io/breezeway-pricing)
- Rentger: [precios oficiales](https://www.rentger.com/precios)
- Chekin y Partee: [comparativa de apps de registro de viajeros 2026](https://bookcheckin.com/blog/mejores-apps-registro-viajeros-ses-2026) · [Partee](https://partee.es/) · [comparativa Chekin, Partee y Gotocheck](https://gotocheck.pro/blog/comparativa-chekin-partee-gotocheck-2026.html)
