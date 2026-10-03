# KAF Rent

Webapp de gestión de alquileres para los copropietarios de Calle 16, construida sobre **Google Apps Script + Google Sheets + Drive + Calendar + Gmail**, con **coste de infraestructura cero**.

Sustituye una gestión dispersa (mensajería, hojas sueltas, sincronización manual de plataformas) por una única interfaz que centraliza el ciclo de vida de las reservas, evita solapamientos, avisa de la sincronización de canales y consolida los datos económicos y fiscales.

> **Estado actual (2026-10-03):** en producción, con código en capas, tests automáticos (unitarios, de endpoints y E2E con Playwright) e integración continua; comunicación a SES.Hospedajes activa. Recién hecho: el rediseño de Reservas (DD-03). Ver [PROXIMOS_PASOS.md](docs_work/PROXIMOS_PASOS.md) y el [CHANGELOG](CHANGELOG.md).

---

## Qué resuelve

- **Cero overbooking:** bloqueo automático de solapamientos al crear una reserva.
- **Ciclo de vida con auditoría:** estado calculado (`Abierta` / `Cerrada` / `Cancelada`) e historial campo a campo.
- **Sincronización de canales:** avisos por email para cerrar y reabrir disponibilidad (sin *channel manager* de pago).
- **Visibilidad:** Inicio con las próximas o últimas reservas, buscador y calendario de ocupación; Gestionar en tarjetas pensado para el móvil; estadísticas e informes mensuales y trimestrales.
- **Tareas de cada estancia:** checklists digitales de entrada y salida, validación de identidades con comunicación a **SES.Hospedajes**, contrato firmado en fotos y cobro de servicios extra, con avisos por email de cobros y checklists pendientes.
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
- **Despliegue:** VS Code → `clasp` con credenciales locales de la cuenta operativa ([ADR-0015](docs_dev/solution/adr/0015-despliegue-con-clasp-multicuenta.md)); Git y GitHub. Ver [DEVELOPMENT.md](docs_dev/DEVELOPMENT.md).

## Estructura del repositorio

```
.
├── CLAUDE.md          # Reglas de trabajo y estándares; mapa completo del repositorio en su §1
├── README.md · CHANGELOG.md · package.json · eslint.config.js · .clasp.json.example
├── .github/workflows/ # CI: lint, tests y E2E en cada push
├── tests/             # Unitarios, endpoints, interfaz, E2E (Playwright) y script del Form
├── docs_dev/          # Producto: src/ (Apps Script), src_form_checkin/ (script del Form), DEVELOPMENT.md, discovery/, solution/
└── docs_work/         # Trabajo: PROXIMOS_PASOS.md, valor_dev.md, docs_mejoras/, emails_propuesta/, docs_ses/, doc_hacienda/, doc_check/
```

El detalle de cada carpeta está en [CLAUDE.md §1](CLAUDE.md).

## Cómo leer la documentación

1. [01_problema.md](docs_dev/discovery/01_problema.md): por qué existe el producto y para quién.
2. [02_historias_usuario.md](docs_dev/discovery/02_historias_usuario.md) → [03](docs_dev/discovery/03_requisitos_funcionales.md) y [04](docs_dev/discovery/04_requisitos_no_funcionales.md): qué hace y con qué calidad; cada documento enlaza hacia arriba (↑) y hacia abajo (↓) con los demás.
3. [arc42.md](docs_dev/solution/arc42.md) y los [ADR](docs_dev/solution/adr/README.md): cómo está construido y por qué.
4. [CLAUDE.md](CLAUDE.md): cómo se trabaja en el repositorio.

## Acceso

Aplicación privada: solo los correos activos en la hoja `Usuarios_Autorizados` pueden usarla (login con cuenta de Google). Ver [ADR-0001](docs_dev/solution/adr/0001-autenticacion-google-cuentas-autorizadas.md).
