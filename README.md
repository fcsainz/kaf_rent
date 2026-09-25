# KAF Rent

Webapp de gestión de alquileres para los copropietarios de Calle 16, construida sobre **Google Apps Script + Google Sheets + Drive + Calendar + Gmail**, con **coste de infraestructura cero**.

Sustituye una gestión dispersa (mensajería, hojas sueltas, sincronización manual de plataformas) por una única interfaz que centraliza el ciclo de vida de las reservas, evita solapamientos, avisa de la sincronización de canales y consolida los datos económicos y fiscales.

> **Estado actual:** Fase 1 implementada (**v1**, código en [`src/`](../src/)). Sin tests automáticos todavía. En curso: **v2** (reorganización, seguridad y tests; ver sprints). Pendiente prioritario: **seguridad de las funciones expuestas** y la infraestructura de tests. Ver [PROXIMOS_PASOS.md](../PROXIMOS_PASOS.md).

---

## Qué resuelve

- **Cero overbooking:** bloqueo automático de solapamientos al crear una reserva.
- **Ciclo de vida con auditoría:** estado calculado (`Abierta` / `Completada` / `Cancelada`) e historial campo a campo.
- **Sincronización de canales:** avisos por email para cerrar y reabrir disponibilidad (sin *channel manager* de pago).
- **Visibilidad:** Inicio con últimas reservas, buscador y calendario de ocupación; estadísticas e informes mensuales y trimestrales.
- **Evidencias:** contratos y vídeos de entrada y salida en Drive, por espacio y reserva.
- **Fiscalidad:** gastos con justificante y resumen del IRPF a tercios.
- **Configuración sin código:** espacios, canales, servicios, emails y parámetros viven en el Sheet.

## Espacios y modos de reserva

| Espacio | Modo de fecha |
|---|---|
| Piscina / Jardín | Día + franja horaria |
| Habitación Interior | Rango de días (check-in / check-out) |

## Stack

- **Backend:** Google Apps Script (V8, JavaScript ES2019+), ficheros `.gs`.
- **Frontend:** HTML Service (HTML/CSS/JS servido desde Apps Script), mobile-first.
- **Datos:** Google Sheets. **Archivos:** Google Drive. **Ocupación:** Google Calendar. **Email:** MailApp.
- **Despliegue:** VS Code → `clasp` con credenciales locales de la cuenta operativa (en implantación, [ADR-0015](solution/adr/0015-despliegue-con-clasp-multicuenta.md)); Git y GitHub. Ver [DEVELOPMENT.md](DEVELOPMENT.md).

## Estructura del repositorio

```
.
├── CLAUDE.md               # Reglas de trabajo y estándares (código, docs, UX, tests, DoD)
├── PROXIMOS_PASOS.md       # Decisiones pendientes, sprints, backlog e histórico (se regenera cada sesión)
├── CHANGELOG.md            # Keep a Changelog + SemVer
├── .clasp.json.example     # Plantilla de configuración de clasp (ADR-0015)
├── src/                    # Código Apps Script (.gs + HTML Service)
├── docs_dev/               # Documentación de desarrollo del producto
│   ├── README.md           # Este documento
│   ├── DEVELOPMENT.md      # Puesta en marcha, clasp, despliegue y día a día
│   ├── discovery/          # QUÉ y POR QUÉ: problema+JTBD, HU, RF, RNF (trazabilidad ↑/↓ en cada uno)
│   └── solution/           # CÓMO: arc42.md, adr/ (MADR), design-system.md
└── docs_work/
    └── docs_ses/           # (propósito por definir, ver PROXIMOS_PASOS D-11)
```

## Cómo leer la documentación

1. [01_problema.md](discovery/01_problema.md): por qué existe el producto y para quién.
2. [02_historias_usuario.md](discovery/02_historias_usuario.md) → [03](discovery/03_requisitos_funcionales.md) y [04](discovery/04_requisitos_no_funcionales.md): qué hace y con qué calidad; cada documento enlaza hacia arriba (↑) y hacia abajo (↓) con los demás.
3. [arc42.md](solution/arc42.md) y los [ADR](solution/adr/README.md): cómo está construido y por qué.
4. [CLAUDE.md](../CLAUDE.md): cómo se trabaja en el repositorio.

## Acceso

Aplicación privada: solo los correos activos en la hoja `Usuarios_Autorizados` pueden usarla (login con cuenta de Google). Ver [ADR-0001](solution/adr/0001-autenticacion-google-cuentas-autorizadas.md).
