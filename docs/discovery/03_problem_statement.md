# Problem Statement — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** Lean UX — Problem Statement  

---

## Situación Actual (As-Is)

Los co-propietarios de Calle 16 gestionan el alquiler de dos espacios (Piscina/Jardín y Habitación Interior) a través de múltiples canales de venta (plataformas online de alquiler). La gestión actual está fragmentada entre:

- **Conversaciones de mensajería** (WhatsApp u otras) para coordinación interna entre los tres co-propietarios
- **Herramientas dispersas** (notas, hojas de cálculo manuales u otros métodos informales) para registrar reservas
- **Gestión manual e independiente** en cada plataforma de alquiler para cerrar y abrir la disponibilidad de los espacios
- **Mensajería o email** para compartir contratos firmados y confirmar estados de cobro

No existe un sistema centralizado que consolide toda esta información ni que automatice las tareas repetitivas de sincronización.

---

## Declaración del Problema

**Hemos observado que** los co-propietarios no disponen de un sistema unificado para gestionar sus alquileres.

**Lo que provoca que** exista riesgo de solapamiento de reservas entre canales, se invierta tiempo innecesario coordinándose entre ellos, y no dispongan de visibilidad del estado real de cada reserva en cada momento.

**Esto afecta a** la fiabilidad operativa del negocio de alquileres, genera fricción entre los tres co-propietarios y aumenta el riesgo de errores operativos con impacto directo en los huéspedes.

**Una solución exitosa sería** una aplicación web centralizada que permita registrar reservas con validación automática de solapamientos, gestionar el ciclo de vida completo de cada reserva con auditoría de cambios, y enviar alertas automáticas para la sincronización de canales — todo ello sin coste adicional de infraestructura.

---

## Problemas Específicos Identificados

| ID | Problema | Impacto | Frecuencia estimada |
|---|---|---|---|
| P-01 | Sin validación de solapamientos → riesgo de reserva doble en el mismo espacio | **Alto** — afecta directamente al huésped y a la reputación en las plataformas | Potencial en cada nueva reserva |
| P-02 | Cierre manual de canales puede olvidarse → reserva duplicada desde otra plataforma | **Alto** — mismo impacto que P-01 pero originado por olvido humano | Potencial en cada nueva reserva |
| P-03 | Sin historial de cambios → imposible auditar quién modificó qué y cuándo | **Medio** — impacta en resolución de disputas internas y trazabilidad | En cada modificación de reserva |
| P-04 | Estado de cobro, contrato e incidencias gestionados en lugares distintos | **Medio** — pérdida de tiempo buscando información antes de cada decisión | Diaria |
| P-05 | Sin vista unificada de reservas activas por espacio | **Medio** — requiere consultar múltiples fuentes para saber qué está reservado | Cada vez que se quiere verificar disponibilidad |
| P-06 | Sin notificaciones automáticas al cancelar → los canales pueden no reabrirse a tiempo | **Medio** — puede suponer pérdida de ingresos por oportunidades de alquiler no captadas | En cada cancelación |
| P-07 | Contratos dispersos en email, Drive o mensajería sin vinculación a la reserva | **Bajo-Medio** — dificulta la localización del contrato en caso de disputa | En cada contrato gestionado manualmente |

---

## Situación Deseada (To-Be)

| Área | Situación actual | Situación deseada |
|---|---|---|
| **Disponibilidad** | Se verifica consultando múltiples plataformas | Se valida automáticamente al crear la reserva |
| **Sincronización de canales** | Manual, propensa a olvidos | Notificación automática por email al crear/cancelar |
| **Registro de reservas** | Herramientas informales y dispersas | Formulario centralizado con campos validados |
| **Estado de la reserva** | Sin seguimiento formal | Ciclo de vida automático (Abierta → Completada / Cancelada) |
| **Contratos** | Dispersos en email o mensajería | Vinculados a cada reserva y almacenados en Drive |
| **Auditoría** | Sin historial de cambios | Registro campo a campo de cada modificación |
| **Coordinación entre co-propietarios** | Vía mensajería informal | Vía el sistema, con datos en tiempo real accesibles para todos |

---

## Hipótesis de Solución

> Si los co-propietarios disponen de una interfaz unificada con validación automática de solapamientos y alertas de sincronización de canales, entonces eliminarán las reservas dobles y reducirán el tiempo de coordinación en al menos un 50%.

> Si el sistema proporciona un ciclo de vida estructurado para cada reserva (cobro, contrato, incidencias), entonces los co-propietarios sabrán en todo momento qué acciones están pendientes sin necesidad de coordinación informal.

---

## Restricciones conocidas

| Restricción | Descripción |
|---|---|
| **Coste** | La solución no puede generar costes adicionales de infraestructura. Debe basarse en el ecosistema Google ya disponible (Apps Script, Sheets, Drive, Gmail). |
| **Usuarios técnicos** | Solo el desarrollador tiene perfil técnico. Los otros dos usuarios necesitan una interfaz muy sencilla e intuitiva. |
| **Integración con canales** | No se integrará con las APIs de las plataformas de alquiler en Fase 1. La sincronización seguirá siendo manual, asistida por notificaciones automáticas. |
| **Mantenimiento** | El sistema será mantenido únicamente por el co-propietario desarrollador. Debe ser mantenible de forma independiente. |
| **Legal** | Los datos de huéspedes deben gestionarse conforme al RGPD. El registro de viajeros (SES.Hospedajes) es un requisito legal diferido a Fase 2. |
