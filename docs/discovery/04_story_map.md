# Story Map — KAF App Rent

**Versión:** 0.1-draft  
**Fecha:** 2026-06-22  
**Estado:** Draft — pendiente de revisión  
**Framework:** Jeff Patton — User Story Mapping  

---

## Cómo leer este Story Map

- **Eje horizontal (izquierda → derecha):** Actividades del usuario en orden cronológico (el flujo completo de uso)
- **Eje vertical (arriba → abajo):** Nivel de detalle y prioridad por release (arriba = más prioritario)
- **Releases:** Cada fila horizontal de tareas define el alcance de un release

---

## Backbone — Actividades del Usuario

```
[AUTENTICARSE] → [VER DASHBOARD] → [CREAR RESERVA] → [GESTIONAR RESERVA] → [CONSULTAR INFORMES]
```

---

## Story Map Completo

### Actividad 1: AUTENTICARSE

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Iniciar sesión con Google | Login obligatorio con cuenta Google | | |
| Verificar autorización | Check email contra `Usuarios_Autorizados` | | |
| Acceso denegado | Pantalla informativa + log del intento | | |
| Cerrar sesión | Logout de la sesión activa | | |
| Gestionar lista de usuarios | *(manual en Sheet)* | UI de gestión de acceso | |

---

### Actividad 2: VER DASHBOARD

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Ver reservas Piscina/Jardín | Tabla con reservas activas del espacio | | |
| Ver reservas Habitación Interior | Tabla con reservas activas del espacio | | |
| Navegar a crear reserva | Botón "Generar Reserva" | | |
| Navegar a gestionar reserva | Botón "Gestionar Reserva" | | |
| Ver disponibilidad visual | | Calendario de ocupación por espacio | |
| Ver alertas y tareas pendientes | | Badge/panel de pendientes | |

---

### Actividad 3: CREAR RESERVA

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Seleccionar espacio | Dropdown con espacios activos del catálogo | | |
| Seleccionar canal | Dropdown filtrado por espacio seleccionado | | |
| Introducir fechas modo Día+Hora | Date picker + hora entrada + hora salida | | |
| Introducir fechas modo Rango | Date picker check-in + date picker check-out | | |
| Indicar número de adultos | Campo numérico ≥ 1 | | |
| Indicar número de menores | Campo numérico ≥ 0 | | |
| Seleccionar servicios extra | Checkboxes filtrados por espacio | | |
| Introducir nombre del huésped | Campo texto obligatorio | | |
| Introducir teléfono del huésped | Campo opcional con validación de formato | | |
| Introducir email del huésped | Campo opcional con validación de formato | | |
| Validar solapamientos | Bloqueo automático si el espacio ya está reservado | | |
| Confirmar y guardar reserva | Guardado con ID, metadatos y estado inicial | | |
| Recibir email de cierre de canales | Notificación automática si 2+ canales activos | | |

---

### Actividad 4: GESTIONAR RESERVA

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Buscar/localizar reserva | Por ID de reserva *(criterio de búsqueda TBD)* | Búsqueda por nombre/fecha/canal | |
| Ver detalle completo | Todos los campos de la reserva visibles | | |
| Editar datos básicos | Espacio, canal, fechas, personas, contacto | | |
| Registrar importe y comisión | Importe bruto, % comisión, gastos asociados | | |
| Registrar estado de cobro | "No ingresado" → "Ingresado" | | |
| Subir contrato | Upload JPG/PNG/PDF → almacenado en Drive | | |
| Registrar incidencia | "Sin incidentes" / "Con incidentes" | | |
| Registrar comunicación de incidencia | Check si se comunicó al canal | | |
| Registrar compensación por daños | "No recibida" / "Recibida" | | |
| Ver estado calculado de la reserva | Abierta / Completada / Cancelada + motivo | | |
| Ver qué falta para completar | Indicador de acciones pendientes | | |
| Cancelar reserva | Botón dedicado con confirmación modal | | |
| Recibir email de reapertura de canales | Notificación automática al cancelar | | |
| Ver historial de cambios | Tabla: fecha, usuario, campo, valor anterior, nuevo | | |
| Añadir notas libres | Campo de texto libre | | |
| Registrar viajeros | | Formulario público externo (Fase 2) | |

---

### Actividad 5: CONSULTAR INFORMES

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Recibir informe trimestral | Email automático con resumen por espacio/canal | | |
| Ver informe en app | | Vista in-app de informes históricos | |
| Exportar datos | | | Export a Excel/CSV |
| Informe anual de cierre | | | Generación manual |

---

## Priorización MoSCoW — Release 1 (MVP)

### Must Have *(imprescindible para el lanzamiento)*

- Autenticación con Google + verificación de acceso por lista
- Dashboard con tablas de reservas por espacio
- Formulario de creación de reservas completo (todos los campos)
- Validación automática de solapamientos (bloqueo duro)
- Gestión de reservas: edición de todos los campos
- Ciclo de vida automático del estado (`Abierta` / `Completada` / `Cancelada`)
- Subida de contrato a Google Drive con cambio automático de estado
- Auditoría campo a campo en `Historial_Cambios`
- Email de cierre de canales al crear reserva (si 2+ canales activos)
- Email de reapertura de canales al cancelar reserva (si 2+ canales activos)

### Should Have *(muy importante, incluir si el tiempo lo permite)*

- Informe trimestral automático por email
- Vista de historial de cambios en la pantalla "Gestionar Reserva"
- Indicador claro de qué falta para que una reserva pase a "Completada"

### Could Have *(deseable, no crítico)*

- Búsqueda de reservas por nombre de huésped o fecha
- Recordatorios automáticos de tareas pendientes (cobro, contrato)
- Validación de solapamientos en tiempo real (antes de guardar, al cambiar fechas)

### Won't Have en Fase 1 *(explícitamente excluido)*

- Formulario de registro de viajeros (SES.Hospedajes) → Fase 2
- Calendario visual de ocupación → Fase 2
- Integración API con plataformas de alquiler → Futuro
- Control de acceso por roles → Futuro
- Bot de Telegram → Futuro

---

## Flujo de navegación de la aplicación

```
Carga de la app (URL pública)
        │
        ▼
[Pantalla de Login Google]
        │
        ├── Email NO autorizado → [Pantalla: Acceso denegado] + Log del intento
        │
        └── Email autorizado →
                    │
                    ▼
            [Dashboard]
            ├── Tabla Piscina/Jardín (reservas activas)
            ├── Tabla Habitación Interior (reservas activas)
            ├── [Botón: Generar Reserva]
            │       └── [Formulario Crear Reserva]
            │               └── Guardar → vuelta a Dashboard
            │
            └── [Botón: Gestionar Reserva]
                    └── [Búsqueda/Selección de Reserva]
                            └── [Formulario Gestionar Reserva]
                                    ├── Guardar cambios → vuelta a Dashboard
                                    └── Cancelar reserva → confirmar → vuelta a Dashboard
```
