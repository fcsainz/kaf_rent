---
status: accepted
date: 2026-06-29
decision-makers: Copropietario desarrollador (PER-01)
consulted: Resto de copropietarios (PER-02, PER-03); gestor fiscal (pendiente de validar)
informed: Resto de copropietarios (PER-02, PER-03)
---

# ADR-0012: Módulo de Gastos y reparto a tercios para el IRPF (rendimiento del capital inmobiliario)

> ⚠️ Este documento sirve para capturar bien los datos; **no es asesoramiento fiscal**. Cada copropietario confirma con su gestor qué es deducible y en qué proporción.

## Contexto y planteamiento del problema

Los tres copropietarios alquilan de forma **ocasional** dos espacios de una vivienda que es su residencia habitual; ninguno se dedica profesionalmente a ello. Por tanto **no es actividad económica** (sin IAE, IVA ni modelo 036): es **rendimiento del capital inmobiliario** con **régimen de atribución de rentas**, a partes iguales (33,33 %). Cada uno declara su tercio de ingresos menos gastos deducibles. ¿Cómo organizamos gastos y justificantes para deducir todo lo legal? (P-09, JTBD-09)

## Factores de decisión

* Deducir todo lo que permite la ley (art. 23 LIRPF), incluida la amortización.
* La carga de la prueba es del arrendador: existencia, naturaleza y finalidad de cada gasto, con justificante.
* Conservación ≥ 4 años (RNF-36).
* Simplicidad: el sistema registra y agrega; no decide la deducibilidad.

## Opciones consideradas

* Hoja `Gastos` + catálogo de categorías + resumen fiscal por ejercicio y espacio a tercios
* Tratarlo como actividad económica (IAE, IVA, 036)
* Reparto por porcentajes configurables
* Omitir la amortización

## Resultado de la decisión

Opción elegida: "Hoja `Gastos` + catálogo + resumen a tercios", porque cubre el caso real con el mínimo de complejidad.

1. **`Gastos`**: `ID_Gasto` (`G{AAAA}-NNN`), Fecha, Ejercicio (calculado), Concepto, Categoría, Espacio (Piscina/Jardín \| Habitación \| Común), Importe (IVA incluido: el alquiler está exento), Deducible (Sí/No, por defecto el de la categoría), Pagado_Por, Justificante (URL), Notas.
2. **`Catálogo_Categorias_Gasto`**: intereses y financiación; conservación y reparación; tributos y tasas; comunidad; seguros; suministros; servicios y administración; saldos de dudoso cobro; amortización del inmueble (3 % del valor de construcción, sin suelo); amortización del mobiliario.
3. **Reparto:** 33,33 % por comunero.
4. **Resumen fiscal** por ejercicio y espacio (calculado al vuelo y persistido en `Resumen_Fiscal`):
   - Ingresos íntegros = Σ `Importe_Bruto` de las reservas no canceladas del ejercicio.
   - Gastos deducibles = comisiones de plataforma + gastos deducibles propios + **50 %** de los comunes + amortización / nº de espacios.
   - Amortización anual = 3 % × `Valor_Construccion` × `Proporcion_Alquilada` (de `Config`; 0 si faltan).
   - Rendimiento = ingresos − gastos; tercio = rendimiento / 3.
5. **Justificantes** en `Documentos/Gastos/{Ejercicio}/`, nunca se podan.

### Consecuencias

* Buena, porque es un módulo sencillo, sin obligaciones censales, IVA ni IAE.
* Buena, porque cada copropietario tiene su tercio listo y los justificantes localizables.
* Mala, porque una deducción indebida es responsabilidad del contribuyente, no del software.
* Mala, porque el prorrateo por tiempo en alquiler y el reparto 50/50 de gastos comunes están **pendientes de validar con el gestor**.
* Mala, porque si cambiara el uso (hospedaje con servicios, dedicación profesional) habría que revisar la calificación fiscal.

### Confirmación

* Tests unitarios de `resumenDeEspacio`, `calcularAmortizacion` y `validarGasto` con casos de ejemplo (RF-64, RF-66).
* Validación del resultado de un ejercicio real con el gestor.

## Pros y contras de las opciones

### Actividad económica

* Mala, porque no se cumplen sus supuestos (residencia habitual, alquiler ocasional, sin dedicación).

### Porcentajes configurables

* Neutral, porque sería más flexible, pero hoy el reparto es a partes iguales (YAGNI).

### Sin amortización

* Mala, porque renuncia a una deducción legal que reduce el rendimiento.

## Más información

* **Trazabilidad:** HU-33, HU-34 · RF-63 a RF-66 · RNF-36
* **Referencia técnica (2026-09-26):** [referencia-tecnica-irpf-alquileres.md](../../../docs_work/doc_hacienda/referencia-tecnica-irpf-alquileres.md) — verificada contra el texto del BOE (Ley y Reglamento IRPF), el Manual Práctico de Renta 2025 y una consulta vinculante de la DGT (V1643-25) sobre el mismo supuesto (alquiler turístico de parte de la vivienda habitual).
* **⚠️ Hallazgo pendiente de decisión:** la fórmula actual de este ADR (50 % fijo de gastos comunes + amortización entre nº de espacios) no coincide con la doctrina verificada, que exige un **doble prorrateo por superficie real y por días efectivamente alquilados** de cada espacio (ver referencia técnica §3). Antes de tocar `gastos.gs`, hay que decidir si se corrige la fórmula (esto convertiría este ADR en `superseded` o en una revisión) — pendiente de OK del usuario y de las medidas de superficie (preguntas en la referencia técnica §6).
* **Cuestiones abiertas (externas):** validar con el gestor la deducibilidad y el criterio reparación/mejora de la reforma (EXT-01 en PROXIMOS_PASOS); confirmar el mapa de superficies de cada zona (ver referencia técnica §5-6).
* **Fuentes (2026-06, ver referencia técnica para las verificadas contra el BOE):** [AEAT — Gastos deducibles del capital inmobiliario](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c04-rendimientos-capital-inmobiliario/gastos-deducibles.html) · [Art. 23 LIRPF](https://www.iberley.es/legislacion/articulo-23-ley-impuesto-sobre-renta-personas-fisicas-irpf) · [Atribución de rentas (art. 8.3 LIRPF)](https://www.supercontable.com/informacion/impuesto_renta_IRPF/Tributacion_de_las_Comunidades_de_Bienes.Regimen_de_.html)
