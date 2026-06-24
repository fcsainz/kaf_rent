# Story Map — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** Jeff Patton — User Story Mapping  

---

## Cómo leer este Story Map

- **Eje horizontal (izquierda → derecha):** Actividades del usuario en orden cronológico (el flujo completo de uso)
- **Eje vertical (arriba → abajo):** Nivel de detalle y prioridad por release (arriba = más prioritario)
- **Releases:** Cada fila horizontal de tareas define el alcance de un release

---

## Backbone — Actividades del Usuario

```
[AUTENTICARSE] → [INICIO (HUB)] → [CREAR RESERVA] → [GESTIONAR RESERVA] → [VER ESTADÍSTICAS E INFORMES] → [GESTIONAR GASTOS]
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

### Actividad 2: INICIO (HUB)

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Elegir tarea | Tres botones: "Crear Reserva", "Gestionar Reserva", "Estadísticas" | | |
| Ver últimas 5 reservas | Tabla de las 5 más recientes: Espacio, Fecha Inicio, Fecha Fin, Nombre, Importe Neto | | |
| Ordenar la tabla | Orden ascendente/descendente por cualquier columna | | |
| Ver calendario de ocupación | Enlace/embed del Google Calendar de la cuenta operativa | | |
| Ver alertas y tareas pendientes | | Badge/panel de pendientes | |

---

### Actividad 3: CREAR RESERVA

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Buscar reserva (disponibilidad) | Subsección "Buscar Reserva": por nombre y/o fecha + botón "Buscar" | | |
| Estado vacío de la búsqueda | Mensaje "No hay reservas registradas" | | |
| Seleccionar espacio | Dropdown con espacios activos del catálogo | | |
| Seleccionar canal | Dropdown filtrado por espacio seleccionado | | |
| Introducir fechas modo Día+Hora | Date picker + hora entrada + hora salida | | |
| Introducir fechas modo Rango | Date picker check-in + date picker check-out | | |
| Indicar número de adultos | Campo numérico ≥ 1 | | |
| Indicar número de menores | Campo numérico ≥ 0 | | |
| Seleccionar servicios extra | Lista filtrada por espacio, con cantidad por servicio | | |
| Introducir nombre del huésped | Campo texto obligatorio | | |
| Introducir teléfono del huésped | Campo opcional con validación de formato | | |
| Introducir email del huésped | Campo opcional con validación de formato | | |
| Validar solapamientos | Bloqueo automático si el espacio ya está reservado | | |
| Confirmar y guardar reserva | Guardado con ID, metadatos y estado inicial | | |
| Crear evento en Calendar | Evento de ocupación en el Google Calendar de la cuenta operativa | | |
| Recibir email de confirmación de reserva | Aviso a los tres de que se ha registrado una reserva | | |
| Recibir email de cierre de canales | Notificación automática si 2+ canales activos | | |

---

### Actividad 4: GESTIONAR RESERVA

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Ver lista de reservas activas | Abiertas (todas) + Completadas no vencidas; nunca Canceladas | | |
| Filtrar por fecha rápida | Opciones "Próxima Semana" / "Próximo Mes" | | |
| Buscar por nombre | Campo de texto libre | | |
| Ver detalle completo | Todos los campos de la reserva visibles | | |
| Editar datos básicos | Espacio, canal, fechas, personas, contacto | | |
| Registrar importe y servicios | Importe alquiler, % comisión, servicios extra (coste/precio snapshot) → neto/margen | | |
| Registrar estado de cobro | "No ingresado" → "Ingresado" | | |
| Subir contrato | Upload JPG/PNG/PDF → almacenado en Drive | | |
| Registrar incidencia | "Sin incidentes" / "Con incidentes" | | |
| Registrar comunicación de incidencia | Check si se comunicó al canal | | |
| Marcar incidencia resuelta | "Sí" / "No" — condición de cierre (compensada o no) | | |
| Registrar compensación por daños | "No recibida" / "Recibida" — informativo | | |
| Ver estado calculado de la reserva | Abierta / Completada / Cancelada + motivo | | |
| Ver qué falta para completar | Indicador de acciones pendientes | | |
| Cancelar reserva | Botón dedicado con confirmación modal | | |
| Sincronizar evento de Calendar | Actualizar el evento al editar; eliminarlo al cancelar | | |
| Recibir email de reapertura de canales | Notificación automática al cancelar | | |
| Ver historial de cambios | Tabla: fecha, usuario, campo, valor anterior, nuevo | | |
| Añadir notas libres | Campo de texto libre | | |
| Registrar viajeros | | Formulario público externo (Fase 2) | |

---

### Actividad 5: VER ESTADÍSTICAS E INFORMES

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Ver estadísticas por zona | 3 zonas (Todos / Piscina-Jardín / Habitación): total reservas año natural + ingresos netos | | |
| Refresco diario de estadísticas | Trigger 03:00 → `Estadisticas_Cache`; UI "Las estadísticas se actualizan cada 24 horas" | | |
| Recibir informe mensual y trimestral | Email automático con resumen por espacio/canal (dos cadencias) | | |
| Ampliar métricas de estadísticas | | Nuevas métricas por zona | |
| Ver informe en app | | Vista in-app de informes históricos | |
| Exportar datos | | | Export a Excel/CSV |
| Informe anual de cierre | | | Generación manual |

---

### Actividad 6: GESTIONAR GASTOS Y REPARTO (IRPF)

> **En scope Fase 1, pendiente de discovery detallado** (estructura de datos, reglas de reparto y cálculo de IRPF).

| Tarea | Release 1 — MVP | Release 2 | Futuro |
|---|---|---|---|
| Registrar un gasto | Fecha, concepto, categoría, importe, pagado_por (hoja `Gastos`) | | |
| Ver/repartir gastos entre los tres | Reparto y cálculo de IRPF *(reglas pendientes de definir)* | | |
| Exportar para declaración | | | Export a Excel/CSV |

---

## Priorización MoSCoW — Release 1 (MVP)

### Must Have *(imprescindible para el lanzamiento)*

- Autenticación con Google + verificación de acceso por lista
- Inicio (hub) con tres botones (Crear / Gestionar / Estadísticas) y tabla de las 5 últimas reservas, ordenable
- Sección Crear Reserva con "Buscar Reserva" (nombre y/o fecha) + formulario de creación completo
- Validación automática de solapamientos (bloqueo duro)
- Sección Gestionar Reserva: lista de activas (Abiertas + Completadas no vencidas) con filtros (fechas rápidas + nombre) y edición de todos los campos
- Ciclo de vida automático del estado (`Abierta` / `Completada` / `Cancelada`)
- Subida de contrato a Google Drive con cambio automático de estado
- Auditoría campo a campo en `Historial_Cambios`
- Email de cierre de canales al crear reserva (si 2+ canales activos)
- Email de reapertura de canales al cancelar reserva (si 2+ canales activos)
- Email de confirmación de reserva generada (a los tres)
- Sincronización con Google Calendar (evento por reserva) y calendario de ocupación

### Should Have *(muy importante, incluir si el tiempo lo permite)*

- Informes mensual y trimestral automáticos por email
- Vista de historial de cambios en la pantalla "Gestionar Reserva"
- Indicador claro de qué falta para que una reserva pase a "Completada"
- Sección Estadísticas (3 zonas) con cálculo cacheado diario (trigger 03:00)
- Módulo de Gastos / reparto IRPF *(pendiente de discovery detallado)*

### Could Have *(deseable, no crítico)*

- Recordatorios automáticos de tareas pendientes (cobro, contrato)
- Validación de solapamientos en tiempo real (antes de guardar, al cambiar fechas)

### Won't Have en Fase 1 *(explícitamente excluido)*

- Formulario de registro de viajeros (SES.Hospedajes) → Fase 2
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
            [Inicio (hub)]
            ├── 3 botones: Crear Reserva · Gestionar Reserva · Estadísticas
            ├── Tabla "5 Últimas Reservas" (Espacio, Fecha Inicio, Fecha Fin, Nombre, Importe Neto — ordenable)
            ├── Enlace/embed → [Calendario de ocupación] (Google Calendar)
            │
            ├── [Crear Reserva]
            │       ├── [Buscar Reserva] (nombre y/o fecha + "Buscar")
            │       └── [Formulario Crear Reserva]
            │               └── Guardar → crea evento en Calendar + email a los tres → vuelta al Inicio
            │
            ├── [Gestionar Reserva]
            │       ├── Lista de activas + filtros (Próxima Semana / Próximo Mes · nombre)
            │       └── [Editar Reserva]
            │               ├── Guardar cambios → actualiza evento de Calendar → vuelta al Inicio
            │               └── Cancelar reserva → confirmar → elimina evento de Calendar → vuelta al Inicio
            │
            ├── [Estadísticas]
            │       └── 3 zonas (lee de Estadisticas_Cache)
            │
            └── [Gestionar Gastos] (ubicación en la navegación pendiente de diseño)
                    └── Registro de gastos + reparto IRPF (pendiente de detallar)
```
