# ADR-0012: Módulo de Gastos y reparto para el IRPF (caso simple)

## Estado
Aceptado (diseño)

> ⚠️ **Aviso:** este documento sirve para capturar los datos correctos, **no es asesoramiento fiscal**. Conviene que cada copropietario confirme con su gestor qué gastos son deducibles y en qué proporción.

## Contexto
- Los tres copropietarios de Calle 16 alquilan de forma **ocasional** dos espacios (Piscina/Jardín y Habitación Interior) que forman parte de una **vivienda que es su residencia habitual**. **Ninguno** de los tres se dedica profesionalmente a esto: tienen trabajos ajenos al alquiler.
- Por tanto **no es una actividad económica**: es **rendimiento del capital inmobiliario** que cada uno declara en su IRPF ordinario. **No** hay IAE, **ni** IVA, **ni** alta censal (modelo 036/037), ni los requisitos de la actividad de hospedaje.
- Al ser una **copropiedad de tres**, en el IRPF se aplica el **régimen de atribución de rentas**: la propiedad se reparte **a partes iguales, 33,33 % cada uno**, y cada comunero declara su tercio del rendimiento neto (ingresos − gastos deducibles).
- Lo que se necesita es una **hoja de Gastos** que, junto con los ingresos ya registrados en `Reservas`, permita a cada propietario desgravar su parte. Sin la maquinaria de la actividad económica (IAE/IVA/036).
- **Objetivo:** registrar **todos los gastos legalmente deducibles** del capital inmobiliario para minimizar, **dentro de la ley**, el IRPF de cada copropietario. Eso incluye la **amortización** (un gasto deducible que reduce el rendimiento neto), aunque su cálculo exija algún dato extra.

## Decisión
El sistema **registra y agrega**; la deducibilidad concreta la confirma el gestor.

### 1. Hoja `Gastos`
Una fila por gasto (ver SDD §3.13): `ID_Gasto`, `Fecha`, `Ejercicio` (calculado), `Concepto`, `Categoria` (de `Catálogo_Categorias_Gasto`), `Espacio` (Piscina/Jardín | Habitación | Común), `Importe`, `Deducible` (Sí/No), `Pagado_Por`, `Justificante` (URL en Drive), `Notas`. El IVA no se separa: al ser alquiler exento de IVA, el IVA soportado forma parte del importe deducible.

### 2. Catálogo de categorías (`Catálogo_Categorias_Gasto`)
Para deducir **todo lo posible dentro de la ley** (art. 23 LIRPF), el catálogo cubre el conjunto de gastos deducibles del capital inmobiliario:
- Intereses y gastos de financiación *(junto con conservación/reparación, no pueden superar los ingresos íntegros; el exceso se deduce en los 4 años siguientes)*
- Conservación y reparación *(no mejoras)*
- Tributos y tasas no estatales (IBI, basuras…)
- Comunidad de propietarios
- Seguros (hogar, responsabilidad civil, impago…)
- Suministros (agua, luz, gas) si los paga el arrendador
- Servicios y otros (limpieza, jardinería, gestoría/administración…)
- Saldos de dudoso cobro
- **Amortización** (≈3 % del valor de construcción, excluido el suelo — ver §6)

Campos del catálogo: Nombre_Categoria, Activo, Deducible_Default, Es_Amortizacion.

### 3. Reparto entre comuneros
**A partes iguales: 33,33 % para cada uno de los tres.** El sistema calcula el rendimiento neto (ingresos − gastos deducibles) por ejercicio y lo divide en tres tercios iguales — la cifra que cada copropietario lleva a su IRPF.

### 4. Salida: resumen fiscal por ejercicio
Informe (o hoja `Resumen_Fiscal`) que, por **ejercicio** y **espacio**, agregue ingresos íntegros, gastos deducibles por categoría y **rendimiento neto**, mostrando el **tercio** correspondiente a cada comunero.

### 5. Reglas de captura
- Imputar cada gasto a un `Espacio`; los **comunes** se reparten entre ambos espacios (criterio sencillo, p. ej. por ingresos o al 50 %).
- Solo es deducible la parte del gasto que corresponde a lo realmente alquilado (proporción de la vivienda y del tiempo en alquiler); ese ajuste lo valida el gestor — el sistema guarda el gasto y un campo `Deducible`.
- Adjuntar siempre el **justificante** (factura/recibo) en Drive.

### 6. Datos para la amortización
La amortización anual deducible es ≈**3 % del valor de construcción** del inmueble (el mayor de coste de adquisición o valor catastral, **excluido el suelo**), aplicada solo a la **parte alquilada** de la vivienda y al **tiempo** en alquiler. Para poder calcularla, se guardan como parámetros (en `Config` o `Catálogo_Espacios`): `Valor_Construccion` (o valor catastral de construcción), y la **proporción alquilada** (superficie y/o tiempo). El sistema puede generar el gasto de amortización del ejercicio automáticamente; la proporción y el valor los confirma el gestor. Si esos datos no se rellenan, el módulo funciona igual sin amortización.

### 7. Justificación ante AEAT y conservación de documentos
La carga de la prueba es del **arrendador**: ante un requerimiento debe acreditar la **existencia**, la **naturaleza** y la **finalidad** (vínculo con el alquiler) de cada gasto. Por eso el módulo exige y conserva la documentación:
- **Por cada gasto:** factura o recibo que cumpla los requisitos (emisor, destinatario, concepto, importe, fecha) **y**, recomendablemente, el **justificante de pago** (cargo bancario). Ambos se guardan en Drive y se enlazan en el campo `Justificante` de `Gastos`.
- **Prueba del prorrateo:** cuando el gasto se imputa por la parte alquilada / el tiempo en alquiler, conservar el cálculo y su base (m² alquilados y días en alquiler — estos últimos derivables de `Reservas`).
- **Ingresos:** los datos de `Reservas` (y los contratos en Drive) respaldan los ingresos declarados.
- **Plazo de conservación:** mínimo **4 años** (prescripción del IRPF) desde el fin del plazo de declaración del ejercicio. Para los gastos con **amortización**, conservar las facturas de adquisición durante **todo el periodo de amortización + 4 años**. La prescripción se **reinicia** ante cualquier requerimiento de Hacienda o declaración complementaria.
- **Implicación de diseño:** los justificantes viven en la carpeta de Drive de la cuenta operativa; **no** se deben borrar reservas, gastos ni sus documentos dentro del plazo de conservación.

## Alternativas consideradas
- **Tratarlo como actividad económica** (IAE 685, IVA, modelo 036, amortización, etc.): descartado; no es la actividad de los propietarios, el inmueble es su residencia habitual y el alquiler es ocasional → no se cumplen los supuestos de actividad económica.
- **Reparto por porcentajes configurables**: descartado por simplicidad; los tres participan a partes iguales (33,33 %).
- **Omitir la amortización**: descartado. Aunque exige un dato extra (valor de construcción), es una deducción legal que reduce el rendimiento neto, y el objetivo es deducir todo lo posible dentro de la ley; se incluye.

## Consecuencias

**Positivas**
- Módulo sencillo: una hoja de gastos con justificantes y un reparto a tercios. Sin obligaciones censales, IVA ni IAE.
- Cada copropietario tiene su tercio de rendimiento neto listo para el IRPF, con los justificantes localizables.

**Negativas / riesgos**
- El sistema no decide la deducibilidad: una deducción indebida es responsabilidad del contribuyente, no del software.
- Si en el futuro cambiara el uso (servicios de hospedaje, dedicación profesional, etc.), habría que revisar la calificación fiscal y ampliar el módulo.

## Pendiente
- Confirmar con el gestor qué gastos son deducibles y la proporción aplicable (parte alquilada de la vivienda y tiempo en alquiler).
- ~~Criterio de reparto de gastos comunes entre los dos espacios.~~ Implementado: los gastos imputados a "Común" se reparten **50/50** entre los dos espacios (revisable con el gestor).
- ~~Resumen al vuelo o almacenado.~~ Implementado: se calcula al vuelo **y** se persiste en `Resumen_Fiscal` (se reescriben las filas del ejercicio).

## Notas de implementación (Sprint 6)
- **Ingresos íntegros** por espacio = suma de `Importe_Bruto` de las reservas no canceladas del ejercicio.
- **Gastos deducibles** = comisiones de plataforma (de `Reservas.Importe_Comisión`, deducibles automáticamente) + gastos de `Gastos` con `Deducible = Sí` (propios del espacio + mitad de los comunes) + amortización anual / nº de espacios.
- **Amortización anual** = 3 % × `Valor_Construccion` × `Proporcion_Alquilada` (de `Config`; 0 si faltan datos). El ajuste por tiempo en alquiler queda para validar con el gestor.
- **Rendimiento neto** = ingresos íntegros − gastos deducibles; **tercio** = rendimiento / 3.
- Justificantes en Drive: `Documentos/Gastos/{Ejercicio}/` (no se podan, conservación ≥ 4 años).

## Fuentes consultadas (2026-06)
- AEAT — Gastos deducibles del capital inmobiliario (Manual IRPF): https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c04-rendimientos-capital-inmobiliario/gastos-deducibles.html
- Art. 23 LIRPF (gastos deducibles y reducciones): https://www.iberley.es/legislacion/articulo-23-ley-impuesto-sobre-renta-personas-fisicas-irpf
- Régimen de atribución de rentas / comunidad de bienes (art. 8.3 LIRPF): https://www.supercontable.com/informacion/impuesto_renta_IRPF/Tributacion_de_las_Comunidades_de_Bienes.Regimen_de_.html
