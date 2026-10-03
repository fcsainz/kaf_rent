# Architecture Decision Records — KAF Rent

Formato **[MADR 4.0](https://adr.github.io/madr/)** (Markdown Architectural Decision Records), en español. Plantilla: [plantilla-madr.md](plantilla-madr.md).

| ADR | Decisión | Estado | Fecha |
|---|---|---|---|
| [0001](0001-autenticacion-google-cuentas-autorizadas.md) | Autenticación con Google y lista de cuentas autorizadas | accepted; ejecución sustituida por ADR-0017 | 2026-09-25 |
| [0002](0002-estructura-interfaz-principal.md) | Panel principal con zonas por espacio | superseded by ADR-0008 | 2026-06-22 |
| [0003](0003-formulario-generar-reserva-catalogos.md) | Formulario "Crear Reserva" con catálogos en cascada | accepted; horas sustituidas por ADR-0019 | 2026-09-25 |
| [0004](0004-ciclo-vida-estado-reserva.md) | Estado único y calculado de la reserva | accepted | 2026-06-24 |
| [0005](0005-pantalla-gestionar-reserva-auditoria.md) | Gestionar Reserva con auditoría y cancelación controlada | accepted | 2026-09-25 |
| [0006](0006-aviso-cierre-reapertura-canales.md) | Avisos de canales por email | accepted | 2026-06-24 |
| [0007](0007-registro-de-viajeros-para-reservas-de-habitacion.md) | Registro de viajeros (Fase 2) | accepted (diferido); formulario, casado, fotos y envío sustituidos por ADR-0018 | 2026-06-24 |
| [0008](0008-reestructuracion-navegacion-tres-secciones.md) | Inicio (hub) + secciones por tarea | accepted | 2026-06-29 |
| [0009](0009-estadisticas-calculo-cacheado-diario.md) | Estadísticas precalculadas a diario | accepted | 2026-09-25 |
| [0010](0010-integracion-google-calendar.md) | Calendario de ocupación en Google Calendar | accepted | 2026-09-25 |
| [0011](0011-sistema-diseno-visual.md) | Sistema de diseño visual | accepted | 2026-06-24 |
| [0012](0012-modulo-gastos-irpf.md) | Gastos y reparto a tercios para el IRPF | accepted | 2026-06-29 |
| [0013](0013-copias-seguridad-y-retencion-datos.md) | Copias de seguridad y retención | accepted; rotación sustituida por ADR-0016 | 2026-06-29 |
| [0014](0014-organizacion-drive-documentos-videos.md) | Organización de Drive y referencia `NN/AA` | accepted | 2026-09-25 |
| [0015](0015-despliegue-con-clasp-multicuenta.md) | Despliegue con clasp y credenciales locales multicuenta | accepted | 2026-09-27 |
| [0016](0016-rotacion-copias-abuelo-padre-hijo.md) | Rotación abuelo-padre-hijo de las copias del Sheet | accepted | 2026-09-27 |
| [0017](0017-ejecutar-como-usuario-que-accede.md) | Ejecutar como el usuario que accede y compartir los recursos | accepted | 2026-09-27 |
| [0018](0018-comunicacion-ses-hospedajes.md) | Comunicación automática a SES.Hospedajes desde el Google Form, con validación presencial | accepted; anulaciones sustituidas por ADR-0022 | 2026-10-02 |
| [0019](0019-horas-obligatorias-en-todos-los-espacios.md) | Hora de llegada y de salida obligatorias en todos los espacios | accepted | 2026-10-02 |
| [0020](0020-una-fila-por-checklist.md) | Registro de checklists con una fila por checklist | accepted | 2026-10-02 |
| [0021](0021-script-propio-del-form-de-viajeros.md) | Script propio ligado al Form de viajeros, sin credenciales de SES | accepted | 2026-10-02 |
| [0022](0022-anulacion-en-ses-al-cancelar.md) | Al cancelar una reserva ya comunicada, se anula en SES tras confirmarlo | accepted | 2026-10-02 |

## Reglas

- **Una decisión relevante = un ADR.** Es relevante si tiene alternativas reales, afecta a varios módulos o es cara de revertir.
- **Nadie decide sin OK:** Claude redacta el ADR como `proposed`, lo explica con pros y contras y solo pasa a `accepted` cuando el usuario lo aprueba ([CLAUDE.md §2.1](../../../CLAUDE.md)).
- **No se reescribe la historia:** si una decisión cambia, se crea un ADR nuevo y el anterior pasa a `superseded by ADR-NNNN`. Los ajustes menores se anotan como *Revisión AAAA-MM-DD* dentro del ADR y actualizan `date`.
- Cada ADR enlaza en *Más información* sus **HU, RF y RNF**, y sus cuestiones abiertas con el ID de [PROXIMOS_PASOS.md](../../../docs_work/PROXIMOS_PASOS.md).
- La sección 9 de [arc42](../arc42.md#9-decisiones-de-arquitectura) remite a este índice.
