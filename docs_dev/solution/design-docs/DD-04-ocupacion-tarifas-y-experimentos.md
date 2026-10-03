# DD-04 — Ocupación por canal, tarifas publicadas y experimentos de precio

**Estado:** aprobado (2026-10-03: D-53 y DI-27 resueltos). S36 implementado y validado en la demo por el usuario el 2026-10-03 (sin subir); S37 pendiente · **Fecha:** 2026-10-03 · **Sprint:** S36 (§3.2–§3.3) y S37 (§3.4–§3.6)
**Trazabilidad:** ↑ D-13, D-52, B-08, F-05, F-15 (parte de ocupación y precios), F-48 a F-52 ([mejoras_2026-10-03](../../../docs_work/docs_mejoras/mejoras_2026-10-03.md), punto 5) · HU-31, HU-32 · RF-59, RF-62 · ↓ HU-31 (revisada), HU-44 · RF-61, RF-62, RF-104 a RF-108 (RF-59 y RF-60 retirados) · S36

> Todo lo que aquí se da por decidido sale de las respuestas del usuario del 2026-10-03 en el registro de mejoras; lo que no, está en §5.

## 1. Problema y objetivo
Hoy los informes solo cuentan reservas y neto, sin ocupación (B-08). La app no sabe qué días estaba cerrado cada espacio ni qué precio estaba publicado en cada plataforma. Por eso no puede responder a la pregunta del negocio: **¿el precio frena o no las reservas?** Ejemplo real: el 7/08/2026 se subieron las tarifas de Cocopool (entre un +19 % y un +80 % según el tramo) y en agosto bajaron las reservas, sin forma de saber si fue por el precio o por la temporada.

**Objetivo:** que los copropietarios vean, por espacio y canal, los días abiertos frente a los ocupados y el ingreso por unidad abierta, y que puedan probar cambios de tarifa y contrastar el resultado.

**Criterio de éxito:**
- El informe de un mes da la ocupación por canal sin cálculos a mano.
- El experimento de agosto de 2026 se puede consultar en la app con su comparación antes/durante.

## 2. Alcance
- **Incluye:**
  - *Cerrar días* (F-48, D-13).
  - Informe por canal con ocupación, en Estadísticas y en el email (F-49, B-08, F-05).
  - Historial de tarifas publicadas con un modelo por canal (F-50).
  - Pestaña *Precios* con el análisis (F-51) y los experimentos (F-52).
- **No incluye:**
  - Precios de la competencia por scraping (F-17, D-52): va aparte, tras su prueba de viabilidad. Aquí solo se deja el hueco de la columna "competencia".
  - Leer cierres o tarifas de las plataformas: no tienen API para anfitriones y entrar en las cuentas se descartó (D-13 D).
  - Frases automáticas de conclusión: con tan pocos datos engañarían.
  - Comparación con el año anterior: no hay reservas antes de 2026. La columna existe y se llena sola desde 2027.
  - Informe del IRPF (S21).

## 3. Diseño

### 3.1 Unidades: cada espacio se mide como se cobra
| | Interior (Airbnb, Sin plataforma) | Exterior (Cocopool, Swimmy, Sin plataforma) |
|---|---|---|
| Unidad | Noche (pernocta) | Hora |
| Unidades abiertas de un día | 1 noche | `Exterior_Hora_Cierre` − `Exterior_Hora_Apertura` (09:00 → 02:00 = 17 h) |
| Ocupación | Noches ocupadas ÷ noches abiertas | Lo primero que se ve: días con reserva ÷ días abiertos. Además: horas vendidas ÷ horas abiertas |
| Lo primero que se ve | Ocupación y € por noche | Días con reserva y € por hora |

- Un día cerrado (§3.2) aporta 0 unidades abiertas.
- Una reserva de Exterior que pasa de medianoche cuenta en el día en que empieza.
- **Reparto entre meses:** cada noche cuenta en su mes y el importe se reparte en proporción a las noches. El email mensual adopta la misma regla; hoy asigna la reserva entera al mes en que empieza.

### 3.2 Cerrar días (F-48)
- **Entrada:** botón *Cerrar días* en el segundo piso de Reservas, junto a Gestionar y Crear. Lo usan los mismos roles que *Crear Reservas*.
- **Pantalla:** formulario con espacio, desde, hasta y motivo (obligatorio, p. ej. "Fuera de temporada", "Uso familiar"). Debajo, la lista de cierres de hoy en adelante con *Quitar*, y un enlace "ver anteriores".
- **Reglas** (en el servidor, y en el cliente para dar el aviso al momento):
  - No se puede cerrar un día que ya tiene una reserva no cancelada. El mensaje dice cuál es.
  - *Crear Reserva* no admite fechas cerradas. Usa la misma regla que el solapamiento: el mensaje dice el motivo del cierre y que se quite el cierre si hay que abrir.
  - La temporada de la piscina es un cierre más (p. ej. Exterior del 1/10 al 30/04).
- **Calendar:** cada cierre crea un evento gris "Cerrado · {Nombre_Corto} · {motivo}". Si Calendar falla, el cierre se guarda igual, como en las reservas (§4.6).
- **Datos:** hoja `Dias_Cerrados` (§3.7).

### 3.3 Informe por canal (F-49)
**Pantalla Estadísticas (rehecha).** Filtros: espacio (Exterior / Interior) y periodo (mes, trimestre o año). Por cada canal, una tarjeta, más una de total:

| Métrica | Cálculo |
|---|---|
| Unidades abiertas | Días del periodo − cerrados, en la unidad del espacio (§3.1) |
| Ocupación | Ocupadas ÷ abiertas. La suma de los canales da la ocupación total |
| Reservas / canceladas | Número de cada y % de canceladas (B-08) |
| Neto | Como hoy |
| € cobrado por unidad | Importe del alquiler ÷ noches u horas vendidas (sin extras). Es un dato secundario: la tarifa que cuenta es la publicada (§3.4) |
| Ingreso por unidad abierta | Neto ÷ unidades abiertas: la métrica que resume precio y ocupación |

Debajo, la evolución de los 12 meses: ocupación e ingreso por unidad abierta, en barras. Sin tablas anchas: en el móvil va en tarjetas (§6.2 de CLAUDE.md).

**Email mensual y trimestral:** a la tabla actual se añaden la ocupación y el ingreso por unidad abierta de cada espacio. Se rellena la columna `Ocupacion` de `Historico_Informes`, que ya existe y está vacía.

### 3.4 Tarifas publicadas, con un modelo por canal (F-50)
La variable que explica la demanda es **la tarifa publicada**, no lo cobrado (corrección del usuario). Cada canal tiene su modelo, en `Catálogo_Canales.Modelo_Tarifa`:

| Modelo | Canal | Datos de cada versión | Tarifa que se aplica a una reserva |
|---|---|---|---|
| `Tramos_Personas` | Cocopool | € por hora para 1–5, 6–10, 11–15 y 16–20 personas | Tramo de adultos + menores, por las horas |
| `Persona_Hora` | Swimmy | € por persona y hora, mínimo de horas y mínimo de importe | max(personas × horas × precio, mínimo) |
| `Noche_Dia_Semana` | Airbnb | € por noche de lunes a jueves y de viernes a domingo | Suma de sus noches según el día |
| — | Sin plataforma | Sin tarifa publicada | No entra en el análisis de precios |

- **Versiones:** una versión de tarifa son las filas de un canal con el mismo `Vigente_Desde`, y rige hasta la siguiente versión. Pantalla *Precios → Tarifas*: la tarifa vigente de cada canal y su historial, con *Nueva versión*. El formulario cambia según el modelo y se rellena con la versión vigente.
- **Datos iniciales** (los da el usuario, 2026-10-03):

| Canal | Vigente desde | Tarifa |
|---|---|---|
| Cocopool | 1/05/2026 | 1–5: 20 · 6–10: 30 · 11–15: 43 · 16–20: 53 €/h |
| Cocopool | 7/08/2026 | 1–5: 36 · 6–10: 42 · 11–15: 54 · 16–20: 63 €/h |
| Swimmy | 1/05/2026 | 10 €/persona·h, sin mínimo |
| Swimmy | 7/08/2026 | 10 €/persona·h, mínimo 4 h y 200 € (para que nadie bloquee un día por poco dinero) |
| Airbnb | 19/09/2026 (aprox.: alta hace dos semanas) | L–J 35 €; V–D 38,50 € (+10 %) |

### 3.5 Análisis de precios (F-51): pestaña *Precios*
Por espacio y año, con la unidad de §3.1 y la tarifa de §3.4:

| Corte | Qué se compara | Cómo se lee |
|---|---|---|
| Por mes | Tarifa vigente de cada canal frente a la ocupación y el ingreso por unidad abierta (los meses sin reservas también salen) | Si con la tarifa alta la ocupación aguanta, hay margen; si cae, el precio frena |
| Por día de la semana | Ocupación y tarifa de lunes a domingo | Dónde tiene sentido un precio distinto (Airbnb ya diferencia L–J y V–D) |
| Por canal | Tarifa aplicable frente a lo cobrado, y neto por unidad tras comisión | Descuentos o extras reales y qué canal deja más |
| Por antelación | Reservas creadas con < 7, 7–30 y > 30 días, y su tarifa | Si se llena tarde, la tarifa inicial puede estar alta |

- **Antelación:** días entre `Fecha_Registro` y el inicio. Se excluyen las reservas con `Fecha_Registro` ≥ inicio, porque se apuntaron después de ocurrir (p. ej. 2026-001, 002 y 009). Hábito ya vigente: la reserva se crea en la app al llegar.
- **Pocos datos:** una celda con menos de 3 reservas se muestra como "pocos datos", sin lectura.
- **Hueco para la competencia:** columna "mediana de la competencia" en el corte por mes, vacía hasta que exista F-17.

### 3.6 Experimentos de precio (F-52): *Precios → Experimentos*
1. **Crear:** espacio y **un canal** (DI-27), la nueva versión de su tarifa (el formulario de su modelo, rellenado con la vigente), fecha de inicio, duración (mínimo 4 semanas) e hipótesis. Al guardar se crea la versión de tarifa (§3.4); no hay que apuntarla dos veces. La app muestra el % de cambio por tramo o tipo de día y su media.
2. **Recordatorio:** el día de inicio llega un email ("cambia la tarifa en {canal}"), porque la app no puede tocar las plataformas.
3. **Durante:** tarjeta con el día en curso y la comparación con la línea base: el mismo número de días justo antes.
4. **Al terminar:** email y pantalla de resultado. Columnas: *Antes* · *Durante* · *Año anterior* (vacía hasta 2027) · *Competencia* (vacía hasta F-17). Filas: tarifa, reservas, ocupación, unidades vendidas, ingreso por unidad abierta, todo **solo del canal del experimento** (su ocupación = sus días con reserva ÷ días abiertos del espacio).
5. **Cerrar:** *Mantener la nueva tarifa* · *Volver a la anterior* (crea la versión de vuelta y avisa de cambiarla en la plataforma) · *Repetir*, con una línea de conclusión.

- **Reglas:** un solo experimento activo por canal (DI-27). Si en esas fechas hubo otro cambio de tarifa en el mismo espacio (otro canal), el resultado lo avisa, porque los canales compiten por los mismos días. "Orientativo, pocos datos" si en cualquiera de los dos periodos hay menos de 3 reservas. Sin veredicto automático.
- **Experimentos pasados:** se dan de alta con fechas pasadas y sin recordatorios. **Semilla:** "Subida de agosto 2026", Exterior · Cocopool, desde el 7/08/2026. Resultado previo: 3 reservas del 10/07 al 6/08 frente a 1 (más 1 cancelada) del 7/08 al 3/09. Saldrá "orientativo": final de temporada, una reserva que pudo hacerse antes del cambio y, ese mismo día, el mínimo de Swimmy (que entra como versión de tarifa sin experimento: Swimmy no tuvo reservas con las que comparar).
- **Avisos:** van en la tarea diaria de las 9:00 que ya existe (`avisosDeCobro`), sin activador nuevo.

### 3.7 Datos (solo se añade; nada se renombra ni se borra)
| Dónde | Qué |
|---|---|
| Hoja nueva `Dias_Cerrados` (S36) | `ID_Cierre`, `Espacio`, `Desde`, `Hasta`, `Motivo`, `Calendar_Event_Id`, `Registrado_Por`, `Fecha_Registro` |
| Hoja nueva `Tarifas` | `Canal`, `Espacio`, `Vigente_Desde`, `Tramo` (1–5… / L–J, V–D / vacío), `Precio`, `Minimo_Horas`, `Minimo_Importe`, `ID_Experimento`, `Registrado_Por`, `Fecha_Registro` |
| Hoja nueva `Experimentos_Precio` | `ID_Experimento`, `Espacio`, `Canales`, `Desde`, `Hasta`, `Hipotesis`, `Estado` (Activo / Terminado / Cerrado), `Decision`, `Conclusion`, `Registrado_Por`, `Fecha_Registro` |
| `Catálogo_Canales` | Columna `Modelo_Tarifa` |
| `Config` | `Exterior_Hora_Apertura` (09:00), `Exterior_Hora_Cierre` (02:00) |
| `Historico_Informes` | Se rellena `Ocupacion` (ya existe) |

El Sheet pasa de 21 a 24 hojas. *Reparar hojas* las crea y las semillas de §3.4 y §3.6 se cargan con una tarea de editor de un solo uso, como F-45.

**Código (orientativo; S36 hecho):** `dominio_ocupacion.gs` (unidades, reparto y métricas), `api_cierres.gs` e `infra_repositorio_cierres.gs` (Cerrar días), `dominio_tarifas.gs` (modelos y tarifa aplicable), `dominio_experimentos.gs` (periodos y comparación), sus `infra_repositorio_*` y `api_estadisticas.gs` / `api_precios.gs`. Las funciones de dominio son puras y reciben "ahora" (§3.3 de CLAUDE.md). Los cálculos se hacen al abrir la pantalla, porque son pocas filas y una lectura en bloque por hoja (registrado en [ADR-0025](../adr/0025-estadisticas-calculadas-al-abrir.md), *proposed*, D-54).

## 4. Alternativas descartadas
| Alternativa | Por qué no |
|---|---|
| Leer cierres y tarifas entrando en las cuentas de las plataformas | Sin API para anfitriones; 2FA, detección de bots y condiciones de uso (D-13 D) |
| Cierres como eventos sueltos de Calendar, o temporada en `Config` | Menos fiable de calcular y dos mecanismos; se prefirió una hoja y un único concepto (D-13.2, D-13.4) |
| Avisar sin bloquear la reserva en un día cerrado | Va contra "prevenir errores" (§6.1); abrir cuesta dos toques (D-13.3) |
| Usar lo cobrado por reserva como precio | No es lo que ve el cliente al decidir y no existe en los días sin reserva (corrección del usuario) |
| Un único precio de referencia por canal | Perdería que la subida de agosto fue distinta por tramo |
| Columna `Fecha_Reserva_Canal` | Basta `Fecha_Registro` con la regla de exclusión de §3.5 (usuario) |
| Cargar reservas de 2025 | No existen: la actividad empieza en 2026 (usuario) |
| Veredicto o frases automáticas | Con pocas reservas darían conclusiones falsas |

## 5. Riesgos y preguntas abiertas
- **D-53 — Dónde se guardan las tarifas: resuelta (usuario, 2026-10-03):** una hoja `Tarifas` con el modelo de cada canal en `Catálogo_Canales`. Descartada: una hoja por canal (cada canal nuevo obligaría a crear una hoja y programarla).
- **DI-27 — Experimentos de varios canales: resuelta (usuario, 2026-10-03):** no; **un experimento = un canal**. Los cambios simultáneos en otro canal del mismo espacio se avisan en el resultado.
- **Doble apunte de cierres:** si un cierre se marca en la plataforma pero no en la app, la ocupación sale más baja. Mitigación futura, fuera de alcance: contrastar con el iCal de Airbnb.
- **Pocos datos:** con unas 15 reservas al año, el análisis describe y no demuestra; mejora con cada temporada.
- **Fecha aproximada de Airbnb (19/09/2026):** se corrige en la hoja si el usuario da la exacta.
- **Grupos de más de 20 personas en Cocopool:** no hay tramo; la tarifa aplicable sale vacía y la reserva queda fuera del análisis de precios, con aviso.

## 6. Plan
| Sprint | Contenido | Esfuerzo |
|---|---|---|
| **S36** | Demo y validación de *Cerrar días* y de Estadísticas → HU/RF nuevos (con ↑/↓) → §3.1–§3.3 → tests de dominio y de endpoints | 14–18 h |
| **S37** | Demo y validación de *Precios* → HU/RF → §3.4–§3.6, semillas y experimento de agosto → tests | 12–16 h |

Los E2E de las pantallas nuevas van en la DoD del release (§8.3 de CLAUDE.md).
