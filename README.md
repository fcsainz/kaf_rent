# KAF Rent

Webapp de gestión de alquileres para los co-propietarios de Calle 16, construida sobre **Google Apps Script + Google Sheets + Drive + Gmail**, con **coste de infraestructura cero**.

Sustituye una gestión dispersa (mensajería, hojas sueltas, sincronización manual de plataformas) por una única interfaz que centraliza el ciclo de vida completo de las reservas, evita solapamientos y automatiza los avisos de sincronización de canales.

> **Estado actual:** **Fase 1 funcionalmente completa** (código en [`src/`](src/), pendiente de pruebas end-to-end en producción): autenticación, Inicio + Buscar, Crear Reserva (con solapamientos, importes y notificaciones), Gestionar Reserva (edición con auditoría, ciclo de vida, contrato/vídeos a Drive, cancelación), Google Calendar, Estadísticas, informes y mantenimiento nocturno, y módulo de Gastos/IRPF. Ver [DEVELOPMENT.md](DEVELOPMENT.md) y el [roadmap](docs/discovery/09_roadmap.md).

---

## Qué resuelve

- **Cero overbooking**: validación automática (bloqueo duro) de solapamientos al crear una reserva.
- **Ciclo de vida con auditoría**: estado calculado (`Abierta` / `Completada` / `Cancelada`) e historial campo a campo de cada cambio.
- **Sincronización de canales**: avisos automáticos por email para cerrar/reabrir disponibilidad (no hay channel manager de pago).
- **Visibilidad**: pantalla de Inicio con accesos y últimas reservas; sección de Estadísticas de rentabilidad.
- **Configuración sin código**: espacios, canales, servicios, precios, emails y parámetros viven en hojas de Google Sheets.

## Espacios y modos de reserva

| Espacio | Modo de fecha |
|---|---|
| Piscina / Jardín | Día + franja horaria |
| Habitación Interior | Rango de días (check-in / check-out) |

## Stack

- **Backend:** Google Apps Script (V8, JavaScript ES2019+), ficheros `.gs`.
- **Frontend:** HTML Service (HTML/CSS/JS servido desde GAS).
- **Datos:** Google Sheets (transaccional + catálogos + configuración + logs).
- **Ficheros:** Google Drive (contratos). **Email:** Gmail/MailApp.
- **Despliegue:** código en VS Code → copia/pega manual en el editor de Apps Script; control de versiones con Git. Ver [DEVELOPMENT.md](DEVELOPMENT.md).

## Estructura del repositorio

```
.
├── CLAUDE.md                 # Estándares de código, documentación y UX/UI del proyecto
├── README.md                 # Este documento
├── CHANGELOG.md              # Histórico de cambios de la documentación/proyecto
├── DEVELOPMENT.md            # Cómo desarrollar y desplegar (puesta en marcha, copia/pega manual)
├── src/                      # Código Google Apps Script (.gs + HTML del HTML Service)
└── docs/
    ├── discovery/            # QUÉ se construye y POR QUÉ (PRD ágil)
    │   ├── README_discovery.md
    │   ├── 01_product_vision.md
    │   ├── 02_personas.md
    │   ├── 03_problem_statement.md
    │   ├── 04_story_map.md
    │   ├── 05_user_stories.md
    │   ├── 06_nfr.md
    │   ├── 07_definition_of_done.md
    │   ├── 08_risk_register.md
    │   └── 09_roadmap.md
    └── solution/             # CÓMO se construye (ADRs + SDD)
        ├── SDD.md            # Documento vivo del diseño del sistema
        └── 0001..0012-*.md   # Architecture Decision Records
```

## Cómo leer la documentación

1. Empieza por la [visión de producto](docs/discovery/01_product_vision.md) y las [personas](docs/discovery/02_personas.md).
2. El [story map](docs/discovery/04_story_map.md) y las [user stories](docs/discovery/05_user_stories.md) detallan el alcance.
3. El [SDD](docs/solution/SDD.md) consolida el diseño; cada decisión relevante tiene su **ADR** en [docs/solution/](docs/solution/).
4. Los estándares de código y UX/UI que rigen la construcción están en [CLAUDE.md](CLAUDE.md).

## Roadmap (resumen)

| Fase | Contenido |
|---|---|
| **Fase 1 — MVP** (Sprints 1–5) | Auth, Inicio, Crear/Gestionar reservas, ciclo de vida, contratos, avisos, informes y estadísticas |
| **Fase 2 — Viajeros** | Registro de viajeros (SES.Hospedajes, RD 933/2021) |

Detalle completo en el [roadmap](docs/discovery/09_roadmap.md).

## Acceso

Aplicación privada: solo los correos activos en la hoja `Usuarios_Autorizados` pueden acceder (login con cuenta de Google). Ver [ADR-0001](docs/solution/0001-autenticacion-google-cuentas-autorizadas.md).
