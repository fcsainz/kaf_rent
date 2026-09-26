# Referencia técnica — IRPF y gastos deducibles del alquiler (Piscina/Jardín y Habitación)

**Fuentes originales** (`docs_work/doc_hacienda/`, no borrar — este documento es un resumen derivado y verificado contra ellas):
- `BOE-A-2006-20764-consolidado.pdf` — Ley 35/2006 del IRPF (texto consolidado).
- `BOE-A-2007-6820-consolidado.pdf` — RD 439/2007, Reglamento del IRPF (texto consolidado).
- `Manual_práctico_de_Renta_2025._Parte_1.pdf` — AEAT, Capítulo 4 "Rendimientos del capital inmobiliario" (páginas 267-293 del PDF).
- `V1643-2025.pdf` — Consulta vinculante de la DGT (15-09-2025), sobre alquiler turístico de una habitación en la vivienda habitual del contribuyente.
- `Croquis_Medidas_Interior_2026.jpg` / `Croquis_Medidas_Exterior_2026.jpg` — medidas de los espacios (ver §5, con preguntas pendientes).

**Aviso:** información recopilada de fuentes oficiales, no asesoramiento fiscal. Pendiente de validar con el gestor (**EXT-01**, PROXIMOS_PASOS).

---

## 1. Marco legal confirmado (texto verbatim contra el BOE)

**Art. 22 LIRPF — rendimientos íntegros:** "todos los [rendimientos] que se deriven del arrendamiento o de la constitución o cesión de derechos o facultades de uso o disfrute" sobre el inmueble.

**Art. 23.1 LIRPF + Art. 13 Reglamento — gastos deducibles**, entre otros: intereses y gastos de financiación; gastos de reparación y conservación; tributos y tasas no sancionadores (IBI); cantidades a terceros por servicios personales (administración, portería, **cuidado de jardines**); gastos de formalización del contrato y defensa jurídica; saldos de dudoso cobro; primas de seguro; **servicios y suministros**; amortización.

**Art. 14 Reglamento — amortización:**
- Inmueble: 3 %/año sobre el mayor de (coste de adquisición sin suelo, valor catastral sin suelo).
- **Mobiliario, instalaciones y enseres cedidos con el inmueble**: hasta 10 %/año (tabla simplificada, Orden de 27-03-1998) — no al 3 %. Aplica al mobiliario de la habitación y del office (el heater, la cafetera de cápsulas, muebles).

**Art. 11.3 LIRPF — individualización (confirma lo que preguntabas):** el rendimiento se atribuye a quien **tenga la titularidad real** del inmueble, en proporción a su participación — cada cotitular declara su % de titularidad, no quien gestione. **La cuenta `operaciontangai@gmail.com` no es sujeto pasivo ni titular a efectos fiscales**: es solo un buzón operativo. Los tres copropietarios declaran cada uno el 33,33 % del rendimiento neto total, tal como ya reflejaba ADR-0012.

---

## 2. Reparación/conservación vs. mejora — el criterio que decide cada partida de la reforma

No hay una lista cerrada en la ley. El Reglamento (art. 13.a) da la regla general y el Manual Práctico añade la definición de "mejora" tomada de la Resolución del ICAC de 1-03-2013:

| | Reparación y conservación | Mejora / ampliación |
|---|---|---|
| Definición | Mantener el uso normal: pintar, revocar, arreglar instalaciones, sustituir elementos (calefacción, puertas...) | Aumenta la **capacidad o habitabilidad**, o **alarga la vida útil** |
| Tratamiento fiscal | Deducible 100 % en el ejercicio del pago | No es gasto; mayor valor de adquisición → amortizable 3 %/año (o 10 %/año si es mobiliario/instalación no estructural) |
| Límite | No puede superar el ingreso íntegro de esa zona ese año; el exceso se traslada 4 años | — |

**Aplicado a vuestra reforma:** no puedo clasificar cada partida sin ver las facturas desglosadas, pero como referencia: renovar el vaso de una piscina existente o repintar la habitación → reparación; construir la piscina desde cero, ampliar el jardín o abrir el WC exterior nuevo → mejora. **Conviene pedir la factura desglosada por partidas** para poder defender la calificación de cada una ante Hacienda.

---

## 3. El doble prorrateo cuando solo se alquila una parte de la vivienda habitual

Esto es lo más relevante para KAF Rent y está confirmado **directamente** por la consulta DGT V1643-25 (mismo supuesto: alquiler turístico de una parte de la vivienda habitual del contribuyente):

> "Únicamente los gastos proporcionales incurridos correspondientes a esa parte de la propiedad que está alquilada serían considerados deducibles. En los gastos generales incurridos que no sean susceptibles de individualización, será necesario prorratear los gastos totales teniendo en cuenta cuáles corresponden a la parte de la casa que está alquilada."

Y además, **por tiempo** (Manual Práctico, cap. 4): "única y exclusivamente serán deducibles los gastos correspondientes al **período de tiempo en que el inmueble esté alquilado** y genere rentas". Los días en que una zona no está alquilada (aunque esté disponible) no generan gasto deducible ese día (STS 270/2021).

**Con dos productos con calendarios de ocupación distintos (Habitación y Piscina/Jardín), el prorrateo debe hacerse por separado para cada uno:**

```
Gasto deducible de la zona X en el ejercicio =
  Gasto general del inmueble
  × (superficie de la zona X / superficie total del inmueble)
  × (días alquilados de la zona X en el ejercicio / días del ejercicio)
```

**⚠️ Esto probablemente no es lo que hace hoy el código.** ADR-0012 dice literalmente: *"Gastos deducibles = comisiones de plataforma + gastos deducibles propios + **50 %** de los comunes + amortización **/ nº de espacios**"* — es decir, reparte los gastos comunes al 50/50 fijo entre los dos productos y divide la amortización a partes iguales, **sin usar superficie real ni días alquilados**. Esto coincide con lo que ya sospechabas hace meses ("el resumen fiscal no está del todo bien") — ahora tenemos el motivo concreto y la referencia legal para corregirlo, aunque **cambiar la fórmula es una decisión (ADR-0012 pasaría a revisión), no la toco sin tu OK**.

---

## 4. Reducciones de vivienda — no aplican aquí

El art. 23.2 LIRPF permite reducir el rendimiento neto (50-90 %) en arrendamientos de vivienda, pero **solo cuando el destino es la vivienda permanente del arrendatario**. La DGT V1643-25 lo dice de forma expresa para el alquiler turístico de habitación: *"la reducción... no aplica en este caso [...] la habitación no se destina a residencia habitual del inquilino."* Ni la Habitación ni la Piscina/Jardín califican para ninguna reducción — no deis por hecho un 50-60 % de reducción en el simulador.

---

## 5. Medidas de los espacios (de los croquis) — confirmado por el usuario (2026-09-26)

### Interior (`Croquis_Medidas_Interior_2026.jpg`)

| Zona | m² | ¿Entra en el alquiler de la Habitación? |
|---|---|---|
| 1 · Habitación | 18,7 | Sí |
| 2 · WC | 5,5 | Sí (uso exclusivo del huésped) |
| 3 · Office | 3,9 | Sí (heater + cafetera de cápsulas) |
| 4 · Pasillo | ≈ 4,5 (calculado por diferencia, no rotulado) | Sí (acceso) |
| 5 · Terraza | 13,8 | **Sí** — no muy cómoda, pero utilizable; declarada zona para fumar |
| **Total "producto Habitación"** | **46,4** | |

### Exterior (`Croquis_Medidas_Exterior_2026.jpg`)

Confirmado: **toda la zona "1"** (y sus subzonas 1A-1E) es lo que se alquila como Piscina/Jardín. Las zonas **2 y 3 no se alquilan**.

| Subzona | Nombre | m² |
|---|---|---|
| 1 (general, parte inferior) | Jardín | 84 |
| 1A | Zona chillout | *(sin rotular en el croquis)* |
| 1B | Piscina | ≈ 29,9 (rotulado "299", leído como 29,9) |
| 1C | WC exterior | *(sin rotular)* |
| 1D | BBQ | *(sin rotular; hay un "24,8" cerca, sin confirmar a qué subzona corresponde)* |
| 1E | Pérgola | *(sin rotular)* |
| **Total "producto Piscina/Jardín"** | | **Incompleto** — faltan los m² de 1A, 1C, 1D y 1E individuales |

**Sigue pendiente:** los m² de 1A, 1C, 1D y 1E no se pueden leer con claridad en el croquis (solo hay un "24,8" y un "83,3" sueltos, sin saber a qué subzona/subtotal corresponden). Sin esto no puedo cerrar el total de "producto Piscina/Jardín".

---

## 6. Datos catastrales de la finca (guardados a petición del usuario, 2026-09-26)

| Dato | Valor |
|---|---|
| Superficie construida | 223,35 m² |
| Superficie útil | 172,84 m² |
| Terreno (catastro) | 906 m² |
| Referencia catastral | 7178417VK7677N0001TQ |
| Linderos | Norte: Calle Número 16, 45 · Sur: Calle Número 16, 49 · Este: Ronda Hispanoamericana, 291 · Oeste: Calle Número 16, 47 |

**⚠️ Discrepancia sin resolver:** el croquis exterior suma **≈ 513 m²** de parcela dibujada, pero el catastro dice **906 m²** de terreno. Puede que el croquis solo mida la zona próxima a la casa (jardín + instalaciones) y el resto de la parcela (906 − 513 ≈ 393 m²) sea terreno no relevante para el alquiler (acceso, otras zonas no cedidas) — pero esto es una suposición mía, no un hecho confirmado. Antes de calcular ningún porcentaje real conviene aclarar qué parte del terreno catastral corresponde al plano dibujado.

**Régimen fiscal aplicable, ya confirmado:** la vivienda **es la residencia habitual de los tres copropietarios** (lo dice también ADR-0012), que alquilan partes de ella de forma ocasional. Esto encaja de forma casi directa con el supuesto de la consulta DGT V1643-25 (§3), no solo por analogía. En los días en que el jardín/piscina no están alquilados, los copropietarios lo usan personalmente — es simplemente su vivienda habitual, así que **no aplica imputación de renta inmobiliaria** en esos días (esa imputación es para segundas residencias sin uso, no para la vivienda habitual). Lo que sí sigue aplicando es el prorrateo por días: solo los días efectivamente alquilados de cada zona generan gasto deducible.

---

## 7. Preguntas que siguen abiertas

1. M² individuales de las subzonas 1A, 1C, 1D y 1E del exterior (falta para cerrar el total del producto Piscina/Jardín).
2. A qué corresponde el "83,3" y a qué subzona el "24,8" del croquis exterior.
3. Relación entre el plano a mano (~513 m²) y el terreno catastral (906 m²).
4. Facturas desglosadas de la reforma por partidas, para clasificar cada una como reparación o mejora (§2) — el usuario indica que esto se afronta más adelante, no ahora.

---

## 8. Fuentes

- Ley 35/2006 IRPF (BOE): https://www.boe.es/buscar/doc.php?id=BOE-A-2006-20764 — arts. 22, 23, 11.3 verificados contra el PDF local.
- RD 439/2007 Reglamento IRPF (BOE): https://www.boe.es/buscar/act.php?id=BOE-A-2007-6820 — arts. 13, 14 verificados contra el PDF local.
- Manual Práctico Renta 2025, Cap. 4 (AEAT) — PDF local, páginas 267-293.
- DGT, consulta vinculante V1643-25 (15-09-2025) — PDF local.
