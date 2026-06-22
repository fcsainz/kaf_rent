# SDD — Documento de Diseño del Sistema
## Webapp de gestión de alquileres — Calle 16

> Documento vivo: se va ampliando a medida que se cierran nuevas pantallas y funcionalidades. Las decisiones con alternativas relevantes tienen su propio ADR en `docs/adr/`; aquí se recoge el diseño consolidado.

## 1. Visión general
Webapp única para gestionar dos tipos de alquiler — Piscina/Jardín y Habitación Interior — sustituyendo procesos dispersos por una sola interfaz. Sin coste de infraestructura, usando exclusivamente recursos de una cuenta de Google personal (gmail.com).

## 2. Arquitectura
- **Plataforma**: Google Apps Script, usando el HTML Service para servir la interfaz (ver ADR-0002).
- **Base de datos**: Google Sheet, con hojas separadas para datos transaccionales, catálogos de configuración, control de acceso, logs/errores e histórico de informes.
- **Desarrollo**: código escrito y versionado en VS Code, desplegado mediante `clasp`; control de versiones con Git.
- **Acceso**: login obligatorio con cuenta de Google; el script verifica el correo de la sesión contra `Usuarios_Autorizados` (ver ADR-0001). Los tres usuarios tienen el mismo nivel de permisos.

## 3. Modelo de datos (hojas del Google Sheet)

### 3.1 `Reservas`
| Campo | Tipo | Notas |
|---|---|---|
| ID_Reserva | Texto | Autogenerado |
| Espacio | Texto | Desde `Catálogo_Espacios` |
| Canal | Texto | Desde `Catálogo_Canales`, filtrado por Espacio |
| Fecha_Hora_Inicio | Fecha+Hora | Ver ADR-0003 para cómo se construye según el Espacio |
| Fecha_Hora_Fin | Fecha+Hora | Idem |
| Nombre_Huesped | Texto | Obligatorio. Nombre y primer apellido |
| Telefono_Huesped | Texto | Opcional. Validado: exactamente 9 cifras, sin prefijo internacional |
| Email_Huesped | Texto | Opcional. Validado: formato básico usuario@dominio.algo |
| Adultos | Entero | ≥ 1 |
| Menores | Entero | ≥ 0 |
| Servicios_Extra | Texto/lista | Servicios marcados, desde `Catálogo_Servicios_Extra` |
| Importe_Bruto | Número | |
| %_Comisión | Número | Se autocompleta desde el Canal, editable |
| Importe_Comisión | Número | Calculado |
| Gastos_Asociados | Número | |
| Importe_Neto | Número | Calculado |
| Estado_Cobro | Texto | No ingresado / Ingresado (ver ADR-0004) |
| Contrato_Estado | Texto | Gestionado por canal / Pendiente / Firmado (ver ADR-0004) |
| Contrato_Archivo | URL | Enlace al documento en Drive, si aplica |
| Incidencias | Texto | Sin incidentes / Con incidentes (ver ADR-0004) |
| Incidente_Comunicado | Booleano | Solo si hay incidencias |
| Compensación_Daños | Texto | No recibida / Recibida — solo si hay incidencias |
| Estado_Reserva | Texto | Abierta / Completada / Cancelada — calculado, ver ADR-0004 |
| Registro_Viajeros_Estado | Texto | Pendiente / Completado — solo Habitación, calculado, ver ADR-0007 |
| Notas | Texto | |
| Registrado_Por | Email | Automático |
| Fecha_Registro | Fecha+Hora | Automático |
| Modificado_Por | Email | Automático |
| Fecha_Última_Modificación | Fecha+Hora | Automático |

### 3.2 `Catálogo_Espacios`
Nombre_Espacio, Activo, Modo_Fecha (`Dia_y_Hora` \| `Rango_Dias`). Ver ADR-0003.

### 3.3 `Catálogo_Canales`
Espacio, Nombre_Canal, Activo, %_Comisión_Default, Gestión_Contrato (`Automática` \| `Manual`). Ver ADR-0003 y ADR-0004.

### 3.4 `Catálogo_Servicios_Extra`
Espacio, Nombre_Servicio, Activo. Ver ADR-0003.

### 3.5 `Config`
Variables clave-valor: emails de aviso (cierre/reapertura de canales, informes trimestrales), mensaje de bloqueo por solapamiento, hora de check-in/check-out por defecto para espacios en modo `Rango_Dias`, etc.

### 3.6 `Usuarios_Autorizados`
Email, Activo, Rol (previsto para el futuro, hoy sin uso real). Ver ADR-0001.

### 3.7 `Logs` / `Errores`
Registro de eventos del sistema y errores, incluyendo intentos de acceso denegado.

### 3.8 `Historico_Informes`
Resumen agregado por periodo (trimestre), con ingresos brutos/netos, comisiones, nº de reservas y ocupación por Espacio y Canal. Alimenta tanto el informe trimestral por email como un futuro cierre anual.

### 3.9 `Historial_Cambios`
Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo. Una fila por cada campo modificado desde "Gestionar Reserva", independiente de `Logs`/`Errores`. Ver ADR-0005.

### 3.10 `Registro_Viajeros`
Datos de cada viajero alojado en una reserva de Habitación, exigidos por la normativa de registro de viajeros (SES.Hospedajes): ID_Reserva (vínculo), nombre completo, tipo y número de documento, número de soporte, nacionalidad, fecha de nacimiento, dirección, teléfono, email, parentesco con el titular, fotos del documento (anverso/reverso). Se rellena por el propio huésped desde un formulario público independiente de la webapp interna. Ver ADR-0007 — **funcionalidad documentada, implementación diferida a una fase posterior**.

## 4. Pantallas

### 4.1 Panel principal
Ver ADR-0002: tres zonas (acciones rápidas, tabla Piscina/Jardín, tabla Habitación). Columnas exactas de las tablas: **pendiente**.

### 4.2 Generar Reserva
Formulario personalizado con campos dependientes según el Espacio elegido. Ver ADR-0003 (estructura del formulario y catálogos) y ADR-0004 (campos que se inicializan automáticamente tras la creación: Cobro, Contrato, Incidencias, Estado_Reserva).

Validación de solapamientos: al guardar, si la franja de Fecha_Hora_Inicio/Fin se cruza con otra reserva activa del mismo Espacio (en cualquier canal), se bloquea el guardado con el mensaje configurado en `Config`.

Avisos automáticos: si el Espacio tiene más de un canal activo, al registrar la reserva se envía un email avisando qué canales cerrar para esa franja; al cancelarse, se envía el aviso inverso para reabrir disponibilidad.

### 4.3 Gestionar Reserva
Pantalla de edición de una reserva existente. Se pueden editar casi todos los campos de `Reservas`, salvo `ID_Reserva`, `Registrado_Por`, `Fecha_Registro` (inmutables) y `Estado_Reserva` (calculado, ver ADR-0004). Cada campo modificado queda registrado en `Historial_Cambios` con su valor anterior y nuevo. La cancelación se hace con un botón dedicado que pide confirmación y dispara el aviso de reapertura de canales. La subida del contrato (foto JPG/PNG o PDF) se archiva en Drive y enlaza en `Contrato_Archivo`. Ver ADR-0005.

### 4.4 Calendario visual de ocupación
**Pendiente de diseño.**

### 4.5 Recordatorios automáticos
**Pendiente de diseño.**

### 4.6 Gestión de incidencias/mantenimiento
Los campos de incidencias por reserva (Incidencias, Incidente_Comunicado, Compensación_Daños) están definidos en ADR-0004. El flujo completo de gestión (pantalla, si hay mantenimiento independiente de una reserva concreta) **está pendiente de diseño**.

### 4.7 Registro de viajeros (formulario público para el huésped)
Formulario público, sin login, independiente de la webapp interna, donde el huésped de una reserva de Habitación introduce sus datos y los de sus acompañantes (incluyendo fotos de DNI/NIF) para cumplir con la normativa de registro de viajeros. Identificación de la reserva por nombre + fechas de estancia, no por ID. Ver ADR-0007. **Diseñado, implementación diferida a una fase posterior.**

## 5. Automatizaciones
- Validación de solapamientos (bloqueo duro, ver 4.2).
- Avisos de cierre/reapertura de canales (ver 4.2).
- Informe trimestral por email con KPIs y gráficas (servicio Charts de Apps Script), archivando solo los datos agregados en `Historico_Informes`.

## 6. Pendiente general
- Columnas exactas de las tablas del panel principal.
- Diseño visual/disposición de los campos en "Gestionar Reserva".
- Tamaño máximo de archivo para la subida del contrato.
- Calendario visual de ocupación.
- Recordatorios automáticos.
- Flujo completo de incidencias/mantenimiento.

## 7. Fuera de alcance de la primera versión (fase 2)
- Módulo de gastos / reparto IRPF entre los tres.
- Registro de viajeros (Guardia Civil / SES.Hospedajes): construcción del formulario público y la hoja `Registro_Viajeros` (diseño ya cerrado en ADR-0007).
- Investigación de la API de SES.Hospedajes para automatizar el envío.
