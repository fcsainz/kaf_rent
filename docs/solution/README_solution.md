# Solution Documentation — KAF Rent

Documentación de **solución**: el **cómo** se construye el sistema. Define las decisiones técnicas y de diseño, complementando la documentación de discovery ([../discovery/](../discovery/)), que define el **qué** y el **por qué**.

---

## Documento vivo

| Documento | Propósito |
|---|---|
| [SDD.md](SDD.md) | System Design Document — diseño consolidado y vigente del sistema (modelo de datos, importes, pantallas, automatizaciones). Se actualiza a medida que se cierran decisiones. |
| [design-system.md](design-system.md) | Sistema de diseño visual — tokens de paleta, tipografía, espaciado, radios, sombras y componentes (fuente de verdad del estilo). |

## Architecture Decision Records (ADR)

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-autenticacion-google-cuentas-autorizadas.md) | Autenticación con cuenta de Google y lista de cuentas autorizadas | Aceptado |
| [0002](0002-estructura-interfaz-principal.md) | Estructura de la interfaz principal (panel con zonas) | **Superseded** por 0008 |
| [0003](0003-formulario-generar-reserva-catalogos.md) | Formulario "Crear Reserva" con catálogos configurables | Aceptado |
| [0004](0004-ciclo-vida-estado-reserva.md) | Ciclo de vida y estado de la reserva | Aceptado |
| [0005](0005-pantalla-gestionar-reserva-auditoria.md) | Pantalla "Gestionar Reserva" con auditoría y cancelación | Aceptado |
| [0006](0006-aviso-cierre-reapertura-canales.md) | Avisos de cierre/reapertura de canales (email) | Aceptado |
| [0007](0007-registro-de-viajeros-para-reservas-de-habitacion.md) | Registro de viajeros (SES.Hospedajes) | Aceptado — diferido a Fase 2 |
| [0008](0008-reestructuracion-navegacion-tres-secciones.md) | Reestructuración de la navegación en tres secciones | Aceptado |
| [0009](0009-estadisticas-calculo-cacheado-diario.md) | Estadísticas con cálculo cacheado diario | Aceptado |
| [0010](0010-integracion-google-calendar.md) | Integración con Google Calendar (calendario de ocupación) | Aceptado |
| [0011](0011-sistema-diseno-visual.md) | Sistema de diseño visual (paleta, tipografía, componentes) | Aceptado |
| [0012](0012-modulo-gastos-irpf.md) | Módulo de Gastos y reparto para el IRPF (caso simple, capital inmobiliario) | Aceptado (diseño) |

---

## Convenciones de los ADR

- Cada ADR sigue el formato: **Estado · Contexto · Decisión · Alternativas consideradas · Consecuencias · Pendiente**.
- Un ADR no se reescribe cuando una decisión se sustituye: se marca como **Superseded por NNNN** y se conserva como registro histórico (ver ADR-0002 → ADR-0008).
- Cuando una decisión de diseño cambia durante la implementación, se actualiza el ADR correspondiente **antes** de continuar (ver [CLAUDE.md](../../CLAUDE.md) §5).
