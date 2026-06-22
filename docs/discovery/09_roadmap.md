# Roadmap & Sprint Plan — KAF App Rent

**Versión:** 0.1-draft  
**Fecha:** 2026-06-22  
**Estado:** Draft — pendiente de revisión  
**Framework:** Scrum — Sprint Planning  

---

## Contexto

- **Equipo de desarrollo:** 1 persona (co-propietario desarrollador)
- **Usuarios para UAT:** 2 personas no técnicas (Ana y Luis)
- **Metodología:** Scrum adaptado a equipo individual (no hay Sprint Reviews formales, pero sí demos informales con los usuarios)
- **Cadencia de sprint:** 2 semanas
- **Estimación:** Las stories se priorizan por MoSCoW; no se usan story points (equipo individual sin histórico de velocidad)
- **Herramienta de gestión:** Este documento + git commits como trazabilidad

---

## Fases del Proyecto

```
┌─────────────────────────────────┐    ┌──────────────────────────────────────┐
│         FASE 1 — MVP            │    │          FASE 2 — Viajeros           │
│    (Sprints 1 a 5 — 10 sem.)   │    │         (Sprints 6+ — TBD)           │
│                                 │    │                                      │
│  S1: Setup + Auth + Dashboard   │    │  S6: Formulario registro viajeros    │
│  S2: Dashboard + Crear Res. I   │    │  S7: Integración SES.Hospedajes      │
│  S3: Crear Reserva II + Valid.  │    │                                      │
│  S4: Gestionar Reserva + Audit  │    │  Fecha inicio: TBD (post Fase 1)     │
│  S5: Informes + UAT + Deploy    │    │                                      │
└─────────────────────────────────┘    └──────────────────────────────────────┘
```

---

## Fase 1 — MVP (10 semanas)

### Sprint 1 — Infraestructura, Autenticación y Shell de la App

**Duración:** 2 semanas  
**Objetivo del sprint:** Tener la estructura base del proyecto en pie, con autenticación funcionando y el shell del dashboard visible para un usuario autorizado.

**Historias incluidas:**

| Story | Descripción | Prioridad |
|---|---|---|
| US-001 | Login con Google | Must |
| US-002 | Verificación de acceso por lista autorizada | Must |
| US-003 | Identificación automática del usuario activo | Must |
| *(técnica)* | Setup del proyecto GAS + clasp + estructura de ficheros | Must |
| *(técnica)* | Crear estructura de la hoja Google Sheets (todas las hojas con cabeceras) | Must |
| *(técnica)* | Shell del HTML (navegación entre secciones con show/hide) | Must |

**Milestone M1:** Autenticación funcionando en Google — un usuario autorizado ve el dashboard (vacío); uno no autorizado ve la pantalla de denegación.

**Criterio de salida del sprint:**
- El co-propietario desarrollador puede acceder con su cuenta Google y ve el dashboard
- Si intenta con una cuenta no autorizada, se muestra "Acceso denegado"
- El intento no autorizado queda registrado en la hoja `Logs`

---

### Sprint 2 — Dashboard con Datos y Formulario de Reserva (Parte I)

**Duración:** 2 semanas  
**Objetivo del sprint:** El dashboard muestra reservas reales de Sheets. El formulario de creación muestra los campos estáticos y carga los catálogos.

**Historias incluidas:**

| Story | Descripción | Prioridad |
|---|---|---|
| US-004 | Ver tabla de reservas por espacio en el dashboard | Must |
| US-005 | Navegar a las acciones principales (botones Generar / Gestionar) | Must |
| US-006 | Seleccionar espacio con filtrado en cascada | Must |
| US-007 | Seleccionar canal y autocomplete de comisión | Must |
| US-010 | Introducir datos de personas y servicios | Must |
| US-011 | Introducir datos de contacto del huésped | Must |

**Criterio de salida del sprint:**
- El dashboard muestra las reservas que haya en Sheets, organizadas por espacio
- El formulario carga los catálogos y el filtrado en cascada (espacio → canal + servicios) funciona
- Se pueden rellenar todos los campos estáticos del formulario

---

### Sprint 3 — Formulario de Reserva (Parte II) + Validaciones + Guardado

**Duración:** 2 semanas  
**Objetivo del sprint:** El formulario es completamente funcional: fechas por modo, validación de solapamientos, guardado y notificación de canales.

**Historias incluidas:**

| Story | Descripción | Prioridad |
|---|---|---|
| US-008 | Introducir fechas en modo Día + Hora (Piscina/Jardín) | Must |
| US-009 | Introducir fechas en modo Rango de Días (Habitación Interior) | Must |
| US-012 | Validación de solapamiento de reservas (bloqueo duro) | Must |
| US-013 | Guardar reserva con estado inicial automático | Must |
| US-014 | Notificación de cierre de canales al crear reserva | Must |

**Milestone M2:** Primera reserva creada end-to-end — desde el formulario hasta la hoja Sheets, con email de cierre de canales recibido.

**Criterio de salida del sprint:**
- Crear una reserva para Piscina/Jardín con Día+Hora funciona completamente
- Crear una reserva para Habitación Interior con Rango funciona completamente
- Intentar crear una reserva solapada muestra el error y no se guarda nada
- El email de cierre de canales llega al destinatario configurado

---

### Sprint 4 — Gestionar Reserva, Ciclo de Vida y Auditoría

**Duración:** 2 semanas  
**Objetivo del sprint:** Flujo completo de gestión de reserva: edición, ciclo de vida automático, subida de contratos, historial de cambios y cancelación.

**Historias incluidas:**

| Story | Descripción | Prioridad |
|---|---|---|
| US-015 | Editar campos de una reserva existente + registro de auditoría | Must |
| US-016 | Ciclo de vida automático del estado de reserva | Must |
| US-017 | Subir contrato a Google Drive | Must |
| US-018 | Cancelar una reserva con confirmación | Must |
| US-019 | Ver historial de cambios de una reserva | Should |
| US-020 | Notificación de reapertura de canales al cancelar | Must |

**Milestone M3:** Primera reserva completada con ciclo de vida completo — creada, cobrada, contrato subido, estado "Completada" calculado automáticamente.

**Criterio de salida del sprint:**
- Editar una reserva actualiza los campos y registra el cambio en Historial_Cambios
- Marcar cobro como "Ingresado" + sin incidencias → Estado pasa a "Completada" automáticamente
- Subir un contrato PDF/JPG cambia el estado del contrato a "Firmado" y guarda la URL en Drive
- Cancelar una reserva con confirmación funciona y envía el email de reapertura
- El historial de cambios es visible en la pantalla de gestión

---

### Sprint 5 — Informes Trimestrales + Bug Fixes + UAT + Deploy

**Duración:** 2 semanas  
**Objetivo del sprint:** Completar la funcionalidad de informes, corregir bugs encontrados, hacer UAT con los tres usuarios y hacer el deploy final.

**Historias incluidas:**

| Story | Descripción | Prioridad |
|---|---|---|
| US-021 | Informe trimestral automático por email | Should |
| *(técnica)* | Trigger programado en GAS para informe trimestral | Should |
| *(técnica)* | Revisión y corrección de bugs encontrados | Must |
| *(técnica)* | UAT con Ana y Luis (User Acceptance Testing) | Must |
| *(técnica)* | Configuración de todos los parámetros reales en `Config` | Must |
| *(técnica)* | Configuración de catálogos reales (espacios, canales, servicios) | Must |
| *(técnica)* | Limpieza de datos de prueba de las hojas | Must |
| *(técnica)* | Deploy final + compartir URL con todos los usuarios | Must |

**Milestone M4:** MVP en producción — los tres co-propietarios tienen acceso a la webapp con datos reales y el sistema está listo para uso diario.

**Criterio de salida del sprint (= Release Done):**
- Todos los criterios de la [Definition of Done — Nivel Release](07_definition_of_done.md) están cumplidos
- Los tres usuarios han probado los flujos principales y han dado su aprobación
- Los catálogos y la configuración tienen los datos reales de Calle 16

---

## Fase 2 — Registro de Viajeros (TBD)

**Inicio:** A definir tras completar y estabilizar Fase 1  
**Duración estimada:** 4-6 semanas (2-3 sprints)

### Sprint 6 — Formulario Público de Registro de Viajeros

**Objetivo:** Formulario web accesible sin autenticación para que los huéspedes registren sus datos de viajero (requerido por normativa española RD 933/2021).

**Alcance estimado:**
- Formulario público vinculado a una reserva por ID
- Campos: nombre completo, tipo/número de documento, soporte, nacionalidad, fecha de nacimiento, dirección, teléfono, email, vínculo con reservante, fotos documento (anverso/reverso)
- Almacenamiento en hoja `Registro_Viajeros` vinculada a `Reservas`
- Estado de registro actualizado en la reserva (`Registro_Viajeros_Estado`)

### Sprint 7 — Integración con SES.Hospedajes

**Objetivo:** Enviar automáticamente los datos de viajeros al sistema del Ministerio del Interior (SES.Hospedajes) según el Real Decreto 933/2021.

**Alcance estimado:**
- Integración con la API de SES.Hospedajes
- Envío automático al completar el registro de viajeros
- Confirmación de registro y manejo de errores de la API
- Actualización del estado de registro en la reserva

---

## Milestones del Proyecto

| Milestone | Sprint | Descripción |
|---|---|---|
| **M1** | Sprint 1 | Autenticación funcionando en Google con control de acceso |
| **M2** | Sprint 3 | Primera reserva creada end-to-end con notificación de canales |
| **M3** | Sprint 4 | Primera reserva completada (ciclo de vida completo) |
| **M4** | Sprint 5 | **MVP en producción** — sistema en uso real por los 3 co-propietarios |
| **M5** | Sprint 6 *(Fase 2)* | Formulario de registro de viajeros activo |
| **M6** | Sprint 7 *(Fase 2)* | Integración SES.Hospedajes en producción |

---

## Riesgos que pueden afectar al roadmap

| Riesgo | Impacto en roadmap | Referencia |
|---|---|---|
| Complejidad de la subida de contratos (R-04) | Puede añadir 2-3 días al Sprint 4 | [Risk Register R-04](08_risk_register.md) |
| Baja adopción en UAT (R-10) | Puede añadir 1 sprint de ajustes UX entre S4 y S5 | [Risk Register R-10](08_risk_register.md) |
| Único desarrollador no disponible (R-06) | Pausa total del roadmap durante la indisponibilidad | [Risk Register R-06](08_risk_register.md) |
| API SES.Hospedajes con documentación insuficiente | Puede retrasar o ampliar el Sprint 7 de Fase 2 | [Risk Register R-03](08_risk_register.md) |

---

## Backlog de ítems futuros (post-Fase 2)

Estos ítems están fuera del roadmap actual pero documentados para no perder el contexto:

- Calendario visual de ocupación por espacio
- Recordatorios automáticos (cobro pendiente, check-in próximo)
- Bot de Telegram como alternativa a email para notificaciones
- Control de acceso por roles (campo `Rol` ya reservado en `Usuarios_Autorizados`)
- Módulo de gestión de gastos y cálculo compartido de IRPF
- Export de datos a Excel/CSV para declaraciones fiscales
- Vista in-app de informes históricos
