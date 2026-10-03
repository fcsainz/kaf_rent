# Problema, JTBD y contexto — KAF Rent

**Versión:** 1.0  
**Fecha:** 2026-09-25  
**Estado:** Vigente — refleja la Fase 1 implementada (v1) y la Fase 2 planificada  
**Framework:** Lean UX Problem Statement + Jobs To Be Done (formato *job story*) + Personas (Nielsen Norman Group) + Product Vision Board (Roman Pichler)  
**Sustituye a:** `01_product_vision.md`, `02_personas.md`, `03_problem_statement.md` (v0.5)

> Documento raíz de la trazabilidad: **Problema (P) → JTBD → Historia de usuario (HU) → Requisito funcional (RF) / no funcional (RNF)**. Cada documento lleva sus propias referencias ↑/↓ ([CLAUDE.md §5.3](../../CLAUDE.md)).

---

## 1. Visión de producto

> Proporcionar a los copropietarios de Calle 16 una herramienta centralizada, **sin coste de infraestructura**, para gestionar el ciclo de vida completo de sus alquileres con trazabilidad total, sincronización asistida de canales y datos económicos y fiscales listos para decidir y declarar.

| Sección (Vision Board) | Contenido |
|---|---|
| **Producto** | KAF Rent — webapp de gestión de alquileres sobre Google Apps Script + Sheets + Drive + Gmail + Calendar |
| **Grupo objetivo** | Los 3 copropietarios de los espacios de alquiler de Calle 16 |
| **Necesidades** | Un único punto de gestión sin riesgo de solapamiento, con historial de cambios, datos económicos de cada reserva, avisos de cierre/apertura de canales y soporte para el IRPF |
| **Funcionalidades clave** | Crear y gestionar reservas, ciclo de vida automático, auditoría, contratos y vídeos en Drive, avisos por email, calendario de ocupación, estadísticas, informes, gastos y resumen fiscal |
| **Objetivos de negocio** | Cero reservas dobles, menos tiempo de coordinación, visibilidad completa del estado y la rentabilidad, y maximizar el rendimiento económico de los espacios |

---

## 2. Contexto

### 2.1 Espacios y modos de reserva

| Espacio | Modo de fecha | Descripción |
|---|---|---|
| Piscina / Jardín | `Dia_y_Hora` | Reserva de un día con hora de llegada y de salida en la misma jornada |
| Habitación Interior | `Rango_Dias` | Estancia de varias noches con check-in y check-out en días distintos |

Cada espacio puede tener **varios canales de venta activos** (plataformas online o venta directa). No hay *channel manager* de pago: la disponibilidad se cierra y se reabre a mano en cada plataforma.

### 2.2 Personas

| ID | Nombre ficticio | Rol real | Perfil técnico | Dispositivo | Frecuencia |
|---|---|---|---|---|---|
| **PER-01** | Carlos | Copropietario + único desarrollador y mantenedor | Alto | PC (Chrome) | Diaria |
| **PER-02** | Ana | Copropietaria, gestión operativa | Bajo | Móvil + tablet | Varias veces/semana |
| **PER-03** | Luis | Copropietario, consulta ocasional | Muy bajo | Móvil | Semanal o puntual |

Todas usan su **cuenta de Google personal** y tienen el mismo nivel de permisos. La referencia de usabilidad son **Ana y Luis**: si ellos no completan una tarea sin ayuda, el diseño está mal.

**PER-01 — Carlos (administrador-desarrollador)**
- *Objetivos:* visibilidad completa en un único lugar; datos consistentes; poder ampliar el sistema sin coste; saber qué canales cerrar o abrir.
- *Dolores:* reservas repartidas entre plataformas sin vista unificada; olvidar cerrar un canal; ningún historial de cambios; tiempo perdido reconciliando conversaciones.
- *Comportamiento:* crea la mayoría de las reservas, gestiona contratos y catálogos, y actúa sobre los avisos de canal.
- *Cita:* "Necesito saber de un vistazo qué reservas hay activas, qué contratos están pendientes y si hay algo que resolver."

**PER-02 — Ana (copropietaria operativa)**
- *Objetivos:* registrar rápido una reserva recibida por un canal; saber si un espacio está libre antes de confirmar; ver el estado de cobro con claridad; recibir avisos claros de qué canales cerrar.
- *Dolores:* tiene que preguntar a Carlos por la disponibilidad; busca datos de reservas en WhatsApp; recibe recordatorios informales.
- *Comportamiento:* recibe reservas por uno o dos canales; solo necesita estado, fechas y datos del huésped.
- *Cita:* "Quiero poner los datos de la reserva y que el sistema me diga si hay problema. Nada más complicado que eso."

**PER-03 — Luis (copropietario ocasional)**
- *Objetivos:* consultar reservas activas; registrar una reserva urgente en ausencia de los otros; entender cobro e incidencias sin explicaciones.
- *Dolores:* depende de que otros le informen; no sabe qué datos poner ni en qué orden; abandona ante cualquier complejidad.
- *Cita:* "Si tengo que buscar en un manual para registrar una reserva, mejor me lo hace otro."

---

## 3. Situación actual (As-Is)

La gestión está fragmentada entre:
- **Mensajería** (WhatsApp) para coordinarse entre los tres.
- **Notas y hojas de cálculo sueltas** para registrar reservas.
- **Gestión manual en cada plataforma** para cerrar y abrir disponibilidad.
- **Email o mensajería** para compartir contratos, confirmar cobros y guardar vídeos del estado del espacio.
- **Recopilación manual de gastos y facturas** a final de año para la declaración de la renta de cada copropietario.

No existe un sistema centralizado ni automatización de las tareas repetitivas.

## 4. Declaración del problema

**Hemos observado que** los copropietarios no tienen un sistema unificado para gestionar sus alquileres, ni sus ingresos y gastos.

**Lo que provoca** riesgo de reservas dobles entre canales, tiempo perdido coordinándose, falta de visibilidad del estado real y de la rentabilidad de cada reserva, y trabajo manual e incierto al declarar el IRPF.

**Esto afecta a** la fiabilidad del negocio, la relación entre los tres copropietarios, la experiencia del huésped y el cumplimiento legal (RGPD, fiscalidad y, en Fase 2, registro de viajeros).

**Una solución exitosa sería** una aplicación web centralizada y sin coste que valide solapamientos, gestione el ciclo de vida con auditoría, avise de la sincronización de canales y consolide los datos económicos y fiscales.

---

## 5. Problemas específicos y Jobs To Be Done

Formato del JTBD (*job story*): **Cuando** [situación], **quiero** [motivación], **para** [resultado esperado].

| ID | Problema | Impacto | Frecuencia | Personas |
|---|---|---|---|---|
| **P-01** | Sin validación de solapamientos → riesgo de reserva doble en el mismo espacio | **Alto** — huésped afectado y reputación en las plataformas | Cada nueva reserva | Todas |
| **P-02** | El cierre manual de los demás canales tras una reserva puede olvidarse → reserva duplicada desde otra plataforma | **Alto** | Cada nueva reserva | Todas |
| **P-03** | Sin historial de cambios → imposible saber quién modificó qué y cuándo | Medio — disputas internas sin datos | Cada modificación | PER-01 |
| **P-04** | Cobro, contrato, incidencias y revisiones de la reserva gestionados en sitios distintos | Medio — no se sabe qué falta para cerrar una reserva | Diaria | Todas |
| **P-05** | Sin vista unificada de la ocupación y de las reservas activas | Medio — varias fuentes para saber qué está reservado | Cada consulta de disponibilidad | Todas |
| **P-06** | Tras una cancelación los canales pueden no reabrirse a tiempo | Medio — ingresos perdidos | Cada cancelación | Todas |
| **P-07** | Contratos, vídeos de entrada/salida y checklists dispersos y sin vínculo con la reserva | Bajo-Medio — sin pruebas localizables ante una disputa o daño | Cada estancia | PER-01, PER-02 |
| **P-08** | Sin visibilidad económica: ingresos netos reales, comisiones, costes de servicios y rendimiento por espacio y canal | Medio — decisiones de precio y canal a ciegas | Mensual / anual | PER-01 |
| **P-09** | Obligación fiscal (IRPF, copropiedad a tercios) sin datos ni justificantes organizados | Medio-Alto — deducciones perdidas o mal justificadas ante la AEAT | Anual | Todas |
| **P-10** | Obligación legal de registrar viajeros de la Habitación (RD 933/2021, SES.Hospedajes) | Alto (legal) — sanción por incumplimiento | Cada estancia en Habitación | Todas + huésped |
| **P-11** | Registrar una reserva es lento y propenso a errores para usuarios no técnicos (datos sin guía, cálculos a mano) | Medio — abandono de la herramienta (R-10) | Cada nueva reserva | PER-02, PER-03 |
| **P-12** | Datos de huéspedes y del negocio sin control de acceso ni protección ante pérdida | Alto — exposición RGPD y pérdida irreversible | Continua | Todas |

### Jobs To Be Done

| ID | ↑ Problema | Job story | ↓ Historias (HU) |
|---|---|---|---|
| **JTBD-01** | P-01 | **Cuando** recibo una solicitud de reserva por cualquier canal, **quiero** saber al instante si el espacio está libre en esa franja y que el sistema me impida duplicarla, **para** no aceptar nunca a dos huéspedes a la vez. | HU-06, HU-15, HU-38 |
| **JTBD-02** | P-02 | **Cuando** se registra una reserva, **quiero** que me digan exactamente qué canales tengo que cerrar para esa franja, **para** que ninguna otra plataforma la venda. | HU-17 |
| **JTBD-03** | P-03 | **Cuando** algún dato de una reserva no cuadra, **quiero** ver quién cambió qué, cuándo y desde qué valor, **para** resolverlo con datos y sin discusiones. | HU-03, HU-23, HU-27 |
| **JTBD-04** | P-04 | **Cuando** gestiono una reserva, **quiero** tener en un único sitio su cobro, contrato, incidencias y revisiones, y que su estado se calcule solo, **para** saber qué falta sin preguntar a nadie. | HU-16, HU-21, HU-22, HU-23, HU-25, HU-37, HU-38, HU-41, HU-43 |
| **JTBD-05** | P-05 | **Cuando** quiero saber qué hay reservado, **quiero** verlo de un vistazo (últimas reservas, buscador, lista de activas, calendario), **para** contestar rápido a un huésped o a otro copropietario. | HU-04, HU-06, HU-07, HU-18, HU-19, HU-21, HU-39 |
| **JTBD-06** | P-06 | **Cuando** se cancela una reserva, **quiero** que se me recuerde qué canales reabrir, **para** no perder la oportunidad de volver a alquilar esa franja. | HU-20, HU-26 |
| **JTBD-07** | P-07 | **Cuando** empieza o termina una estancia, **quiero** guardar el contrato, los vídeos y el checklist vinculados a la reserva, **para** tener pruebas localizables ante una disputa. | HU-22, HU-28, HU-29, HU-30, HU-41, HU-43 |
| **JTBD-08** | P-08 | **Cuando** reviso cómo va el negocio, **quiero** conocer reservas, ingresos brutos y netos y comisiones por espacio y canal, **para** decidir precios y canales con datos. | HU-12, HU-14, HU-24, HU-31, HU-32, HU-42 |
| **JTBD-09** | P-09 | **Cuando** llega la declaración de la renta, **quiero** tener los ingresos, los gastos deducibles con justificante y el tercio de cada copropietario, **para** declarar bien y deducir todo lo que la ley permite. | HU-33, HU-34 |
| **JTBD-10** | P-10 | **Cuando** un huésped se aloja en la Habitación, **quiero** que él mismo aporte sus datos de viajero de forma sencilla, **para** cumplir con el registro obligatorio sin perseguirle. | HU-35, HU-36 |
| **JTBD-11** | P-11 | **Cuando** tengo que registrar una reserva, **quiero** un formulario que me guíe, solo me ofrezca opciones válidas y calcule los importes, **para** hacerlo sin ayuda y sin errores. | HU-05, HU-08, HU-09, HU-10, HU-11, HU-12, HU-13, HU-14, HU-39, HU-40 |
| **JTBD-12** | P-12 | **Cuando** alguien accede a los datos del negocio, **quiero** que solo puedan hacerlo los tres copropietarios y que los datos no se pierdan, **para** cumplir el RGPD y no depender de la suerte. | HU-01, HU-02 |

> Qué historias resuelven cada JTBD: columna **↓ Historias (HU)**; cada HU remite de vuelta a su problema y su JTBD en [02_historias_usuario.md](02_historias_usuario.md).

---

## 6. Situación deseada (To-Be)

| Área | Antes | Después |
|---|---|---|
| Disponibilidad | Consulta manual de varias plataformas | Validación automática al guardar (bloqueo duro) + buscador + calendario |
| Sincronización de canales | Manual y olvidable | Email automático de cierre y de reapertura |
| Registro de reservas | Notas informales | Formulario guiado con catálogos en cascada e importes calculados |
| Estado de la reserva | Sin seguimiento | Ciclo de vida automático (Abierta → Completada / Cancelada) |
| Contratos y evidencias | Dispersos | En Drive, por espacio y reserva, enlazados desde la reserva |
| Auditoría | Inexistente | Registro campo a campo de cada cambio |
| Economía | Sin datos | Estadísticas diarias e informes mensual y trimestral |
| Fiscalidad | Recopilación anual manual | Gastos con justificante y resumen fiscal a tercios |
| Coordinación | Mensajería | Datos compartidos en tiempo real |

## 7. Hipótesis y métricas de éxito

> **H1.** Si los copropietarios tienen una interfaz única con validación de solapamientos y avisos de canal, eliminarán las reservas dobles y reducirán al menos un 50 % el tiempo de coordinación.  
> **H2.** Si cada reserva tiene un ciclo de vida estructurado (cobro, contrato, incidencias), sabrán en todo momento qué queda pendiente sin coordinarse de forma informal.  
> **H3.** Si ingresos y gastos se registran al momento con su justificante, la declaración anual dejará de requerir una recopilación manual.

| KPI | Objetivo |
|---|---|
| Reservas reales registradas en el sistema | 100 % |
| Reservas dobles por solapamiento | 0 |
| Tiempo medio para crear una reserva | < 5 minutos |
| Avisos de cierre de canal enviados | 100 % automáticos |
| Ediciones auditadas | 100 % |
| Gastos del ejercicio con justificante | 100 % |
| Disponibilidad de la aplicación | > 99 % (heredada de Google) |

---

## 8. Alcance

**Fase 1 (MVP, implementada en v1):** acceso con Google y lista autorizada; Inicio con últimas reservas, buscador y enlace al calendario; Crear Reserva guiada con solapamientos e importes; Gestionar Reserva con edición auditada, ciclo de vida, servicios, contrato, vídeos, checklists y cancelación; avisos por email; Google Calendar; estadísticas; informes; mantenimiento nocturno; y Gastos/IRPF.

**Fase 2:** registro de viajeros (formulario público + SES.Hospedajes).

**Fuera de alcance:** integración por API con las plataformas de alquiler, bot de Telegram, control de acceso por roles, exportación a CSV y vista de informes en la app (backlog futuro, ver [PROXIMOS_PASOS.md](../../docs_work/PROXIMOS_PASOS.md)).

## 9. Restricciones y supuestos

| Tipo | Descripción |
|---|---|
| **Coste** | Coste cero de infraestructura y de herramientas: ecosistema Google de una cuenta Gmail personal; la calidad (tests, CI) también debe ser gratuita. |
| **Usuarios** | Solo un usuario técnico; los otros dos necesitan una interfaz muy sencilla. |
| **Canales** | Sin integración por API con las plataformas: la sincronización es manual, asistida por avisos. |
| **Mantenimiento** | Un único mantenedor (riesgo R-06): la solución debe ser simple, documentada y mantenible por una persona. |
| **Legal** | RGPD/LOPDGDD para los datos de huéspedes; LIRPF para la fiscalidad; RD 933/2021 para los viajeros (Fase 2). |
| **Supuestos** | Los 3 usuarios tienen cuenta de Google activa; el volumen no supera las cuotas de Apps Script; los contratos llegan en JPG, PNG o PDF. |

---

## Anexo A — User Journeys (validación de usabilidad)

Se usan para validar los flujos con Ana y Luis (UAT) y como base de los tests E2E ([CLAUDE.md §7](../../CLAUDE.md)).

**J-1 Crear una reserva (Ana o Carlos)** → HU-06, HU-08 a HU-19
1. Recibe una reserva por un canal y abre KAF Rent (login con Google) → Inicio.
2. *(Opcional)* En **Buscar Reserva** (Inicio) introduce nombre y/o fecha: si aparecen reservas, el espacio está ocupado.
3. Pulsa **Crear Reserva** → elige Espacio (se filtran canal y servicios) → Canal (se autocompleta la comisión) → fechas según el modo del espacio → personas → servicios con cantidad → datos del huésped → importe del alquiler (ve el resumen económico en vivo).
4. Pulsa **Guardar**: si hay solapamiento, ve un mensaje claro y corrige; si no, la reserva queda en "Abierta", se crea el evento en Calendar y llegan los emails de confirmación y, si procede, de cierre de canales.

**J-2 Completar el ciclo de vida (Carlos)** → HU-21 a HU-25, HU-28 a HU-30
1. **Gestionar Reserva** → localiza la reserva (filtros) → **Modificar**.
2. Marca el cobro como "Ingresado"; si el contrato es manual, lo sube (pasa a "Firmado"); marca los checklists y sube los vídeos.
3. Sin incidencias, o con la incidencia marcada como resuelta → el estado pasa solo a "Completada".

**J-3 Cancelar una reserva (Carlos o Ana)** → HU-26, HU-19, HU-20
1. **Gestionar Reserva** → **Modificar** → **Cancelar reserva** → modal de confirmación.
2. Si confirma: estado "Cancelada", se audita, se borra el evento de Calendar y llega el aviso de reapertura de canales.

**J-4 Consultar el historial de cambios (Carlos)** → HU-27
1. **Gestionar Reserva** → **Modificar** → Historial: fecha, usuario, campo, valor anterior y nuevo, del más reciente al más antiguo.

**J-5 Comprobar la ocupación de un día (cualquiera)** → HU-06, HU-07
1. En el Inicio, **Buscar Reserva** por fecha, o abrir el **Calendario de ocupación**.

**J-6 Registrar un gasto y preparar la renta (Carlos)** → HU-33, HU-34
1. **Gastos** → rellena el gasto y adjunta el justificante → **Guardar**.
2. Elige el ejercicio → ve ingresos, gastos deducibles, rendimiento neto y el tercio de cada copropietario.
