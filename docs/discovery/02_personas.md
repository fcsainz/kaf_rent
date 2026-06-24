# Personas & User Journeys — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** Nielsen Norman Group — Persona Template  

---

## Resumen de personas

| ID | Nombre ficticio | Rol real | Perfil técnico | Frecuencia de uso |
|---|---|---|---|---|
| P-01 | Carlos | Co-propietario + desarrollador | Alto | Diaria |
| P-02 | Ana | Co-propietaria, gestión operativa | Bajo | Varias veces/semana |
| P-03 | Luis | Co-propietario, consulta ocasional | Muy bajo | Semanal o puntual |

---

## Persona 1 — Carlos (Administrador-Desarrollador)

**Rol real:** Co-propietario + único desarrollador y mantenedor del sistema  

### Perfil

| Atributo | Valor |
|---|---|
| Perfil técnico | Alto — construye y mantiene la aplicación |
| Dispositivo principal | PC sobremesa, chrome, vs code, warp |
| Cuenta Google | Personal (gmail.com) |
| Frecuencia de uso | Diaria (gestión) + esporádica (mantenimiento técnico) |
| Acciones principales | Crear reservas, gestionar estado completo, subir contratos, revisar historial, mantener catálogos |

### Objetivos

- Tener visibilidad completa del estado de todos los alquileres en un único lugar
- Asegurarse de que los datos son consistentes y el sistema funciona correctamente
- Poder ampliar y mantener el sistema sin dependencias externas de coste
- Saber en todo momento qué canales hay que cerrar o abrir

### Pain Points actuales

- Gestionar reservas entre múltiples plataformas sin vista unificada
- Riesgo de olvidar cerrar un canal manualmente tras registrar una reserva
- Sin historial de cambios cuando algo se modifica en una reserva
- Tiempo invertido en reconciliar información dispersa entre conversaciones y herramientas

### Comportamientos clave

- Revisa el estado de reservas varias veces por semana
- Es responsable de crear la mayoría de las reservas
- Gestiona contratos y subidas de documentos
- Recibe y actúa sobre las notificaciones de sincronización de canal
- Único responsable de actualizar catálogos (espacios, canales, servicios)

### Cita representativa

> "Necesito saber de un vistazo qué reservas hay activas, qué contratos están pendientes y si hay algo que resolver. Sin tener que abrir cuatro pestañas distintas."

---

## Persona 2 — Ana (Copropietaria Operativa)

**Rol real:** Co-propietaria, involucrada en la gestión diaria de reservas

### Perfil

| Atributo | Valor |
|---|---|
| Perfil técnico | Bajo — usa apps del día a día (WhatsApp, Google Maps, correo) |
| Dispositivo principal | Móvil + tablet |
| Cuenta Google | Personal (gmail.com) |
| Frecuencia de uso | Varias veces por semana |
| Acciones principales | Crear reservas, consultar estado, registrar cobros |

### Objetivos

- Registrar nuevas reservas rápidamente cuando las recibe por un canal
- Ver si un espacio está disponible antes de confirmar una reserva a un huésped
- Saber el estado de cobro de cada reserva de forma clara
- Recibir avisos claros de qué canales tiene que cerrar después de registrar una reserva

### Pain Points actuales

- Tiene que preguntar a Carlos si un espacio está disponible para una fecha antes de confirmar
- Pierde tiempo buscando información de una reserva entre conversaciones de WhatsApp
- Recibe recordatorios informales (mensajes) en lugar de notificaciones automáticas del sistema

### Comportamientos clave

- Recibe reservas principalmente por uno o dos canales
- Confirma reservas informalmente antes de registrarlas en el sistema
- No necesita ver detalles técnicos: solo el estado, las fechas y los datos del huésped
- No gestiona contratos con frecuencia

### Cita representativa

> "Quiero poner los datos de la reserva y que el sistema me diga si hay problema. Nada más complicado que eso."

---

## Persona 3 — Luis (Copropietario Ocasional)

**Rol real:** Co-propietario, menos involucrado en la gestión diaria

### Perfil

| Atributo | Valor |
|---|---|
| Perfil técnico | Muy bajo — usuario básico de smartphone |
| Dispositivo principal | Móvil |
| Cuenta Google | Personal (gmail.com) |
| Frecuencia de uso | Semanal o puntual |
| Acciones principales | Consultar reservas activas, crear reservas ocasionalmente |

### Objetivos

- Consultar el estado de reservas activas cuando lo necesita
- Poder registrar una reserva en ausencia de los otros dos cuando es urgente
- Entender el estado de cobro e incidencias sin necesitar explicaciones

### Pain Points actuales

- Depende de que Carlos o Ana le informen del estado de las reservas
- Cuando tiene que registrar algo, no sabe qué información poner ni en qué orden
- Cualquier complejidad en la interfaz le hace abandonar y delegar en otro

### Comportamientos clave

- Accede al sistema de forma esporádica
- Necesita una interfaz muy guiada, sin ambigüedades
- No gestiona contratos ni incidencias complejas

### Cita representativa

> "Si tengo que buscar en un manual para registrar una reserva, mejor me lo hace otro."

---

## User Journeys

### Journey 1 — Crear una reserva (Ana o Carlos)

```
Recibe reserva confirmada por un canal externo
        │
        ▼
Abre KAF Rent → Login con Google → Inicio
        │
        ▼
Click "Crear Reserva" → subsección "Buscar Reserva"
        │  Introduce nombre y/o fecha → "Buscar"
        ├── Devuelve reservas → el espacio está ocupado → no crea la reserva
        │
        └── "No hay reservas registradas" → procede a crear
        │
        ▼
Subsección "Crear Reserva" (formulario)
        │
        ▼
Selecciona Espacio → se filtran Canal y Servicios automáticamente
        │
        ▼
Selecciona Canal → se autocompleta % comisión
        │
        ▼
Introduce fechas/horas (modo según espacio seleccionado)
        │
        ▼
Introduce nº de personas (adultos + menores)
        │
        ▼
Selecciona servicios extra (si aplica)
        │
        ▼
Introduce datos de contacto del huésped
        │
        ▼
Click "Guardar"
        │
        ├── [Solapamiento detectado] → Mensaje de error claro → Revisa fechas
        │
        └── [Sin solapamiento] → Reserva guardada en estado "Abierta"
                    │
                    ▼
            [Si 2+ canales activos] → Email automático de cierre de canales
```

---

### Journey 2 — Completar el ciclo de vida de una reserva (Carlos)

```
Reserva en estado "Abierta" en la lista de Gestionar Reserva
        │
        ▼
"Gestionar Reserva" → busca y abre la reserva
        │
        ▼
El huésped realiza el pago
→ Cambia Estado_Cobro a "Ingresado"
        │
        ▼
Si el contrato no está gestionado por el canal:
→ Sube PDF/imagen firmada
→ Contrato_Estado cambia a "Firmado" automáticamente
        │
        ▼
Sin incidencias:
→ Sistema calcula Estado_Reserva = "Completada" automáticamente
        │
        ▼
Con incidencia:
→ Registra "Con incidentes" + comunica al canal
→ (Opcional) Recibe compensación → Compensación_Daños = "Recibida"
→ Marca Incidencia_Resuelta = "Sí" (compensada o no)
→ Sistema calcula Estado_Reserva = "Completada"
```

---

### Journey 3 — Cancelar una reserva (Carlos o Ana)

```
Reserva activa en la lista de Gestionar Reserva
        │
        ▼
"Gestionar Reserva" → abre la reserva
        │
        ▼
Click "Cancelar Reserva" (botón dedicado, separado del flujo de edición)
        │
        ▼
Modal de confirmación: "¿Seguro que quieres cancelar esta reserva?"
        │
        ├── [Cancelar] → Vuelve a la reserva sin cambios
        │
        └── [Confirmar] → Estado_Reserva = "Cancelada"
                    │     + Registro en Historial_Cambios
                    │
                    ▼
            [Si 2+ canales activos] → Email automático de reapertura de canales
                    │
                    ▼
            Regresa al Inicio
```

---

### Journey 4 — Consultar historial de cambios (Carlos)

```
Necesita saber quién cambió qué en una reserva
        │
        ▼
"Gestionar Reserva" → busca y abre la reserva
        │
        ▼
Sección "Historial de Cambios" → tabla con:
Fecha | Usuario | Campo | Valor anterior | Valor nuevo
        │
        ▼
Identifica el cambio y el responsable
```

---

### Journey 5 — Buscar una reserva por fecha o nombre (cualquiera)

```
Quiere saber si un espacio está ocupado un día concreto
        │
        ▼
Inicio → "Crear Reserva" → subsección "Buscar Reserva"
        │
        ▼
Introduce nombre y/o fecha → "Buscar"
        │
        ├── Hay reservas → se muestran (el espacio está ocupado)
        │
        └── No hay reservas → mensaje "No hay reservas registradas"
                    │
                    ▼
            Procede a "Crear Reserva" (formulario)
```
