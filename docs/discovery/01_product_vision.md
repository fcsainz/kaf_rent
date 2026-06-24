# Product Vision — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** Roman Pichler — Product Vision Board  

---

## Vision Statement

> Proporcionar a los co-propietarios de Calle 16 una herramienta centralizada, sin coste de infraestructura, para gestionar el ciclo de vida completo de sus alquileres con trazabilidad total y sincronización automática de canales.

---

## Product Vision Board

| Sección | Contenido |
|---|---|
| **Producto** | KAF Rent — webapp de gestión de alquileres sobre Google Apps Script |
| **Target Group** | Los 3 co-propietarios de los espacios de alquiler de Calle 16 |
| **Needs** | Un único punto de gestión sin riesgo de solapamiento, con historial de cambios, gestión de economicas y datos de las resevas, así como avisos automáticos de cierre/apertura de canales |
| **Key Features** | Crear reservas, gestionar estado, subir contratos, registrar datos de reservas, así como servicios extras, auditoría campo a campo, notificaciones de canal |
| **Business Goals** | Eliminar reservas dobles, reducir tiempo de gestión, obtener visibilidad completa del estado de todos los alquileres, tener datos centralizados y usarlos para analisis y mejorar la gestión de las reservas. Para maximizar el rendimiento económico de los espacios para alquiler de Calle 16 |

---

## Problema que resuelve

Los co-propietarios gestionan actualmente dos tipos de espacios de alquiler a través de múltiples canales (plataformas online) sin ninguna herramienta centralizada. Esto provoca:

- **Riesgo de doble reserva** — sin validación automática de solapamientos entre canales
- **Falta de trazabilidad** — sin historial de quién cambió qué y cuándo
- **Gestión manual de canales** — cierre/apertura de disponibilidad en cada plataforma de forma manual y propensa a errores
- **Dispersión de información** — contratos, estados de cobro e incidencias gestionados en herramientas y conversaciones distintas

---

## Propuesta de Valor

KAF Rent es la única herramienta que los co-propietarios de Calle 16 necesitan para gestionar el ciclo de vida completo de sus alquileres con:

- **Coste cero** de infraestructura (Google Apps Script + Google Sheets + Drive + Gmail)
- **Acceso unificado** con la cuenta Google personal que ya tienen
- **Bloqueo automático** de solapamientos entre canales antes de confirmar cualquier reserva
- **Auditoría completa** de todos los cambios realizados sobre cada reserva
- **Alertas automáticas** por email para sincronización manual de canales al crear o cancelar una reserva
- **Datos Centralizados** usar la cantidad de datos que se genera en una reserva para poder tanto en la hora de gestión y ejecución de los alquiler tener mejor gestionado y posteriormente poder analizar y sacar puntos de mejora.
---

## Espacios gestionados y modos de reserva

| Espacio | Modo de fecha | Descripción |
|---|---|---|
| Piscina / Jardín | Día + franja horaria | Reserva por día con hora de entrada y salida dentro de la misma jornada |
| Habitación Interior | Rango de días | Reserva con fecha de check-in y check-out en días distintos |

Cada espacio puede tener múltiples canales de venta activos (plataformas de alquiler).

---

## Métricas de Éxito (KPIs)

| Métrica | Objetivo Fase 1 |
|---|---|
| Reservas registradas en el sistema | 100% de las reservas reales |
| Reservas dobles por solapamiento | 0 |
| Tiempo medio para crear una reserva | < 5 minutos |
| Notificaciones de cierre de canal enviadas | 100% automático en cada reserva creada |
| Cambios sobre reservas auditados | 100% de las ediciones registradas en historial |
| Disponibilidad de la aplicación | > 99% (gestionado por Google infrastructure) |

---

## Usuarios del sistema

| Usuario | Perfil técnico | Rol en el sistema |
|---|---|---|
| Co-propietario A (desarrollador) | Alto | Administrador + usuario con plenas capacidades |
| Co-propietario B | Bajo | Usuario final (crear y gestionar reservas) |
| Co-propietario C | Bajo | Usuario final (crear y gestionar reservas) |

> Todos los usuarios tienen el mismo nivel de permisos en Fase 1. El campo `Rol` está reservado para control de acceso por roles en fases futuras.

---

## Alcance

### En scope — Fase 1 (MVP)

- Autenticación con Google + control de acceso por lista en Sheet `Usuarios_Autorizados`
- Pantalla de Inicio (hub) con accesos a Crear / Gestionar / Estadísticas y tabla de las últimas reservas
- Formulario dinámico de creación de reservas con campos dependientes y validación de solapamientos
- Pantalla de gestión de reservas con edición de todos los campos y auditoría campo a campo
- Ciclo de vida automático del estado de reserva (`Abierta` / `Completada` / `Cancelada`)
- Subida de contratos (JPG, PNG, PDF) a Google Drive con enlace en la reserva
- Notificaciones email de cierre de canales al crear una reserva
- Notificación email de reserva generada
- Notificaciones email de reapertura de canales al cancelar una reserva
- Informe mensual y trimestral automático por email
- Calendario de ocupación en Google Calendar (evento por reserva en la cuenta operativa)
- Gestión de gastos / cálculo compartido de IRPF *(pendiente de discovery detallado)*

### Fuera de scope — Fase 1

- Registro de viajeros (SES.Hospedajes) → diferido a Fase 2
- Integración API con plataformas de alquiler (Airbnb, Booking, etc.) → futuro
- Bot de Telegram para alertas → futuro

---

## Supuestos de partida

1. Los 3 usuarios disponen de cuenta Google personal activa (gmail.com)
2. El co-propietario desarrollador es el único responsable del mantenimiento técnico
3. El volumen de reservas y usuarios no superará los límites de cuota de Google Apps Script
4. Los contratos se recibirán en formato JPG, PNG o PDF únicamente
5. El acceso principal será desde Chrome en escritorio y móvil deseable 
6. Los datos de huéspedes se gestionan bajo base legal de gestión contractual (GDPR)
