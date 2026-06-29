# SDD — Documento de Diseño del Sistema
## Webapp de gestión de alquileres — Calle 16

> Documento vivo: se va ampliando a medida que se cierran nuevas pantallas y funcionalidades. Las decisiones con alternativas relevantes tienen su propio ADR en `docs/solution/`; aquí se recoge el diseño consolidado.

## 1. Visión general
Webapp única para gestionar dos tipos de alquiler — Piscina/Jardín y Habitación Interior — sustituyendo procesos dispersos por una sola interfaz. Sin coste de infraestructura, usando exclusivamente recursos de una cuenta de Google personal (gmail.com).

## 2. Arquitectura
- **Cuenta operativa**: la cuenta de Gmail dedicada `operaciontangai@gmail.com` es **propietaria** del proyecto Apps Script, el Sheet, la carpeta de Drive y el Calendar; estos recursos se **comparten** (editor) con las tres cuentas personales. La Web App se ejecuta **como el usuario que accede** (`executeAs: USER_ACCESSING`) para poder identificarlo (ver ADR-0001).
- **Plataforma**: Google Apps Script, usando el HTML Service para servir la interfaz (ver ADR-0008; ADR-0002 documenta la estructura original, ya superseded).
- **Base de datos**: Google Sheet, con hojas separadas para datos transaccionales, catálogos de configuración, control de acceso, logs/errores e histórico de informes.
- **Calendario**: Google Calendar de la cuenta operativa, donde cada reserva genera un evento de ocupación (ver ADR-0010).
- **Desarrollo**: código escrito y versionado en VS Code, desplegado por copia/pega manual en el editor de Apps Script (clasp se descartó por la fricción de `clasp login` con tres cuentas Google); control de versiones con Git.
- **Acceso**: login obligatorio con la cuenta de Google **personal** de cada usuario; el script verifica el correo de la sesión contra `Usuarios_Autorizados` (ver ADR-0001). Los tres usuarios tienen el mismo nivel de permisos.
- **Notificaciones**: todos los emails del sistema (avisos de canal, confirmación de reserva, informes) se envían a los **tres** usuarios, a las direcciones configuradas en `Config`.

## 3. Modelo de datos (hojas del Google Sheet)

### 3.1 `Reservas`
| Campo | Tipo | Notas |
|---|---|---|
| ID_Reserva | Texto | Autogenerado — correlativo anual global; almacenado `AAAA-NNN` (`2026-001`), mostrado `NN/AA` (`01/26`), en Drive `NN-AA`. Ver ADR-0014 |
| Espacio | Texto | Desde `Catálogo_Espacios` |
| Canal | Texto | Desde `Catálogo_Canales`, filtrado por Espacio |
| Fecha_Hora_Inicio | Fecha+Hora | Ver ADR-0003 para cómo se construye según el Espacio |
| Fecha_Hora_Fin | Fecha+Hora | Idem |
| Nombre_Huesped | Texto | Obligatorio. Nombre y primer apellido |
| Telefono_Huesped | Texto | Opcional. Validado: exactamente 9 cifras, sin prefijo internacional |
| Email_Huesped | Texto | Opcional. Validado: formato básico usuario@dominio.algo |
| Adultos | Entero | ≥ 1 |
| Menores | Entero | ≥ 0 |
| Servicios_Extra | Texto/lista | Resumen legible de los servicios contratados; el detalle con coste/precio vive en `Reserva_Servicios` |
| Importe_Alquiler | Número | Precio del alquiler del espacio, sin servicios |
| Servicios_Precio_Total | Número | Calculado — suma de (Cantidad × precio snapshot) de los servicios contratados |
| Servicios_Coste_Total | Número | Calculado — suma de (Cantidad × coste snapshot) de los servicios contratados |
| Importe_Bruto | Número | Calculado — `Importe_Alquiler + Servicios_Precio_Total` (total que paga el huésped) |
| %_Comisión | Número | Se autocompleta desde el Canal, editable; puede ser 0 (alquiler sin plataforma) |
| Importe_Comisión | Número | Calculado — `Importe_Bruto × %_Comisión / 100` |
| Margen_Servicios | Número | Calculado — `Servicios_Precio_Total − Servicios_Coste_Total` |
| Importe_Neto | Número | Calculado — `Importe_Bruto − Importe_Comisión − Servicios_Coste_Total` |
| Estado_Cobro | Texto | No ingresado / Ingresado (ver ADR-0004) |
| Contrato_Estado | Texto | Gestionado por canal / Pendiente / Firmado (ver ADR-0004) |
| Contrato_Archivo | URL | Enlace al documento en Drive, si aplica |
| Incidencias | Texto | Sin incidentes / Con incidentes (ver ADR-0004) |
| Incidente_Comunicado | Booleano | Solo si hay incidencias |
| Compensación_Daños | Texto | No recibida / Recibida — solo si hay incidencias; informativo, no condiciona el cierre |
| Incidencia_Resuelta | Texto | Sí / No — solo si hay incidencias; condición de cierre a Completada (ver ADR-0004) |
| Estado_Reserva | Texto | Abierta / Completada / Cancelada — calculado, ver ADR-0004 |
| Registro_Viajeros_Estado | Texto | Pendiente / Completado — solo Habitación, calculado, ver ADR-0007 |
| Checkin_Revisado | Texto | Pendiente / Hecho — revisión del checklist de check-in (ver ADR-0004/0005) |
| Checkout_Revisado | Texto | Pendiente / Hecho — revisión del checklist de check-out (ver ADR-0004/0005) |
| Calendar_Event_Id | Texto | ID del evento de Google Calendar asociado (ver ADR-0010); vacío si no se pudo crear |
| Notas | Texto | |
| Registrado_Por | Email | Automático |
| Fecha_Registro | Fecha+Hora | Automático |
| Modificado_Por | Email | Automático |
| Fecha_Última_Modificación | Fecha+Hora | Automático |
| Video_In_Url | URL | Enlace al vídeo de check-in en Drive; lo rellena la subida o se pega a mano. Ver ADR-0014 |
| Video_Out_Url | URL | Enlace al vídeo de check-out en Drive; lo rellena la subida o se pega a mano. Ver ADR-0014 |

### 3.2 `Catálogo_Espacios`
Nombre_Espacio, Activo, Modo_Fecha (`Dia_y_Hora` \| `Rango_Dias`). Ver ADR-0003.

### 3.3 `Catálogo_Canales`
Espacio, Nombre_Canal, Activo, %_Comisión_Default, Gestión_Contrato (`Automática` \| `Manual`). Ver ADR-0003 y ADR-0004.

### 3.4 `Catálogo_Servicios_Extra`
Espacio, Nombre_Servicio, Activo, Coste_Unitario (lo que nos cuesta), Precio_Unitario (lo que paga el huésped). Ver ADR-0003.

### 3.5 `Config`
Variables clave-valor: emails de aviso (cierre/reapertura de canales, confirmación de reserva, informes), mensaje de bloqueo por solapamiento, hora de check-in/check-out por defecto para espacios en modo `Rango_Dias`, los parámetros de **amortización** del IRPF (`Valor_Construccion` y `Proporcion_Alquilada`, ver ADR-0012), los **IDs de carpetas de Drive** (`Carpeta_Raiz_Id`, `Carpeta_Videos_Id`, `Carpeta_Documentos_Id`, `Carpeta_Backups_Id`) y los parámetros de **copias de seguridad y retención** (`Backup_Cada_Dias`, `Backup_Max_Copias`, `Retencion_Logs_Dias`, `Retencion_Errores_Dias`, `Retencion_Videos_Dias`; ver ADR-0013 y ADR-0014), etc.

### 3.6 `Usuarios_Autorizados`
Email, Activo, Rol (previsto para el futuro, hoy sin uso real). Ver ADR-0001. *(El reparto del IRPF es a partes iguales, 33,33 % cada uno; no requiere campo de porcentaje — ver ADR-0012.)*

### 3.7 `Logs` / `Errores`
Registro de eventos del sistema y errores, incluyendo intentos de acceso denegado.

### 3.8 `Historico_Informes`
Resumen agregado por periodo (mes/trimestre), con ingresos brutos/netos, comisiones, nº de reservas y ocupación por Espacio y Canal. Alimenta los informes mensual y trimestral por email y un futuro cierre anual. Histórico append-only; distinto de `Estadisticas_Cache` (snapshot diario sobrescrito).

### 3.9 `Historial_Cambios`
Fecha_Hora, Usuario, ID_Reserva, Campo, Valor_Anterior, Valor_Nuevo. Una fila por cada campo modificado desde "Gestionar Reserva", independiente de `Logs`/`Errores`. Ver ADR-0005.

### 3.10 `Registro_Viajeros`
Datos de cada viajero alojado en una reserva de Habitación, exigidos por la normativa de registro de viajeros (SES.Hospedajes): ID_Reserva (vínculo), nombre completo, tipo y número de documento, número de soporte, nacionalidad, fecha de nacimiento, dirección, teléfono, email, parentesco con el titular, fotos del documento (anverso/reverso). Se rellena por el propio huésped desde un formulario público independiente de la webapp interna. Ver ADR-0007 — **funcionalidad documentada, implementación diferida a una fase posterior**.

### 3.11 `Reserva_Servicios`
Una fila por cada servicio extra contratado en una reserva (la lista de servicios crece, por lo que no escala como columnas fijas en `Reservas`): ID_Reserva (vínculo), Nombre_Servicio, **Cantidad**, Coste_Unitario_Snapshot, Precio_Unitario_Snapshot. Los valores de coste y precio se copian del `Catálogo_Servicios_Extra` en el momento de añadir el servicio (snapshot), de modo que un cambio futuro de tarifas no altera reservas pasadas. Los totales agregados se consolidan en `Reservas`: `Servicios_Precio_Total` = suma de (Cantidad × Precio_Unitario_Snapshot) y `Servicios_Coste_Total` = suma de (Cantidad × Coste_Unitario_Snapshot). Ver ADR-0003.

### 3.12 `Estadisticas_Cache`
Snapshot de los agregados de la sección Estadísticas (por zona: Todos / Piscina-Jardín / Habitación → total de reservas del año natural e ingresos netos), recalculado a diario por un trigger a las 03:00 y sobrescrito en cada ejecución. Incluye la marca de tiempo de la última actualización. La pantalla de Estadísticas solo lee de aquí. Ver ADR-0009.

### 3.13 `Gastos`
Registro de gastos del negocio para que los tres copropietarios desgraven su parte en el IRPF (rendimiento del capital inmobiliario; ver **ADR-0012**). Campos:

| Campo | Tipo | Notas |
|---|---|---|
| ID_Gasto | Texto | Autogenerado |
| Fecha | Fecha | Fecha del gasto |
| Ejercicio | Entero | Año fiscal — calculado de Fecha |
| Concepto | Texto | Descripción del gasto |
| Categoria | Texto | Desde `Catálogo_Categorias_Gasto` |
| Espacio | Texto | Piscina/Jardín \| Habitación \| Común (los comunes se reparten entre ambos) |
| Importe | Número | Importe del gasto (IVA incluido; el alquiler está exento de IVA) |
| Deducible | Texto | Sí / No |
| Pagado_Por | Texto | Cuenta operativa o comunero (A/B/C) |
| Justificante | URL | Enlace a la factura/recibo en Drive |
| Notas | Texto | |

### 3.14 `Catálogo_Categorias_Gasto`
Categorías de gasto deducible del capital inmobiliario, lo más completo posible para maximizar la deducción legal (art. 23 LIRPF). Campos: `Nombre_Categoria`, `Descripcion` (ejemplos), `Activo`, `Deducible_Default`, `Es_Amortizacion`. Datos semilla:

| Nombre_Categoria | Descripción / ejemplos | Deducible_Default | Es_Amortizacion |
|---|---|---|---|
| Intereses y financiación | Intereses de hipoteca/préstamo de adquisición o mejora, comisiones bancarias asociadas | Sí | No |
| Conservación y reparación | Pintura, fontanería, electricidad, sustitución de caldera, reparaciones de la piscina (no mejoras) | Sí | No |
| Tributos y tasas no estatales | IBI, tasa de basuras, alcantarillado, vado | Sí | No |
| Comunidad de propietarios | Cuotas ordinarias de comunidad | Sí | No |
| Seguros | Hogar, responsabilidad civil, impago de alquiler | Sí | No |
| Suministros | Agua, luz, gas, internet (si los paga el arrendador) | Sí | No |
| Servicios y administración | Limpieza, jardinería, gestoría/administrador, publicidad, comisiones de plataformas | Sí | No |
| Saldos de dudoso cobro | Impagos (con las condiciones legales) | Sí | No |
| Amortización inmueble | 3 % del valor de construcción (excluido el suelo) | Sí | Sí |
| Amortización muebles | Muebles y electrodomésticos cedidos (≈10 %/año según tablas) | Sí | Sí |

Cada gasto se registra en `Gastos` (§3.13) con su categoría → el **desglose por categoría** del ejercicio (lo que se lleva a la declaración) se obtiene agregando `Gastos` por `Categoria` en `Resumen_Fiscal` (§3.15). Ver ADR-0012.

### 3.15 `Resumen_Fiscal` *(opcional)*
Agregado por Ejercicio y Espacio: ingresos íntegros, gastos deducibles por categoría y rendimiento neto, mostrando el **tercio (33,33 %)** que corresponde a cada copropietario. Puede calcularse al vuelo o almacenarse aquí. Ver ADR-0012.

### 3.16 Almacenamiento en Drive y copias de seguridad
Toda la infraestructura de archivos cuelga de la carpeta raíz del proyecto `KAF. KAF Rent` (junto al propio Sheet `BBDD_KAF_Rent`):
- **Documentos** (contratos, fotos de documentos): `Documentos / {Espacio} / {reserva} /`, nombrados `{NN-AA} - {tipo} - {DDMMAA}.ext`. **No se borran** (justificantes, conservación ≥ 4 años, ADR-0012); su URL se enlaza en `Contrato_Archivo`.
- **Vídeos in/out**: `Videos / {Espacio} / {reserva} /`, nombrados `Video In|Out {NN-AA} {Nombre} {DDMMAA}.mp4`. Se **borran a los 180 días** (`Retencion_Videos_Dias`). No se enlazan en `Reservas` (se localizan por nombre).
- **Copias de seguridad**: `Backups /`, una copia del Sheet cada 2 días, conservando las últimas 15.

Los IDs de carpeta y los parámetros de retención viven en `Config`. Detalle en **ADR-0014** (Drive) y **ADR-0013** (copias y retención de `Logs`/`Errores`/vídeos).

## 4. Modelo de importes y rentabilidad
- `Importe_Bruto = Importe_Alquiler + Servicios_Precio_Total` — total que paga el huésped.
- `Importe_Comisión = Importe_Bruto × %_Comisión / 100` — comisión de la plataforma (`%_Comisión` puede ser 0 si el alquiler no se hace por plataforma).
- `Importe_Neto = Importe_Bruto − Importe_Comisión − Servicios_Coste_Total` — ganancia real de la reserva.
- `Margen_Servicios = Servicios_Precio_Total − Servicios_Coste_Total` — rentabilidad aislada de los servicios extra, para análisis.

La comisión de plataforma se aplica sobre el **total** (`Importe_Bruto`), es decir, también sobre los servicios extra.

## 5. Pantallas

### 5.1 Inicio (hub)
Pantalla de entrada. Ver ADR-0008. Arriba, el título de la app y los botones de tarea —**Crear Reserva**, **Gestionar Reserva**, **Estadísticas**, **Gastos**—. Bajo el rótulo "5 Últimas Reservas", una tabla con las **5 reservas más recientes** (por `Fecha_Registro`), **ordenable ascendente/descendente por cualquier columna**: **Espacio**, **Fecha Inicio**, **Fecha Fin**, **Nombre** (= `Nombre_Huesped`), **Importe Neto**. Incluye también **Buscar Reserva** (campo Nombre y campo Fecha, ninguno obligatorio + botón "Buscar") para comprobar reservas de un huésped o una fecha; si no hay coincidencias, muestra "No hay reservas registradas". *(El buscador estaba originalmente en "Crear Reserva"; trasladado al Inicio en la implementación, ver ADR-0008.)*

### 5.2 Crear Reserva
Formulario personalizado con campos dependientes según el Espacio elegido. Ver ADR-0003 (estructura del formulario y catálogos) y ADR-0004 (campos que se inicializan automáticamente: Cobro, Contrato, Incidencias, Estado_Reserva). Validación de solapamientos: al guardar, si la franja de `Fecha_Hora_Inicio`/`Fin` se cruza con otra reserva activa del mismo Espacio (en cualquier canal), se bloquea el guardado con el mensaje configurado en `Config`. Avisos automáticos: si el Espacio tiene más de un canal activo, al registrar la reserva se envía un email **a los tres** avisando qué canales cerrar para esa franja; al cancelarse, el aviso inverso para reabrir disponibilidad.

### 5.3 Gestionar Reserva
Sección con la **lista de reservas activas** y la **edición** de una reserva concreta (ver ADR-0008 y ADR-0005).
- **Lista (vista estándar)**: muestra **todas las reservas modificables** (no canceladas: Abiertas y Completadas, sin importar la fecha); nunca **Canceladas**. Columnas: dos botones **Ver más / Modificar**, **Estado** (badge de color — Abierta azul, Completada verde, Cancelada gris), **ID Reserva**, **Canal**, **Entrada**, **Salida**, **Check-in revisado**, **Check-out revisado**, **Nombre** e **Ingreso** (estado de cobro, badge — Ingresado verde / No ingresado rojo). En PC la tabla se adapta; en móvil tiene scroll horizontal. Encima, filtros: fechas rápidas "Próxima Semana" / "Próximo Mes" y búsqueda por nombre. **Ver más** despliega una ficha de solo lectura (Resumen económico · Documentos con enlaces a contrato y vídeos · Resto de datos); **Modificar** despliega el formulario de edición; ambos se abren **a ancho completo bajo la tabla**. Al guardar/cerrar se vuelve al listado.
- **Edición de una reserva**: se editan los campos de gestión (huésped, personas, importe, % comisión, cobro, contrato, incidencias, checklists, notas); `ID_Reserva`, `Registrado_Por`, `Fecha_Registro` son inmutables, `Estado_Reserva` es calculado (ADR-0004) y Espacio/Canal/Fechas/Servicios quedan de solo lectura en esta versión (para no rehacer la validación de solapamientos). Cada campo modificado queda registrado en `Historial_Cambios`. La cancelación se hace con un botón dedicado que pide confirmación (modal) y dispara el aviso de reapertura de canales. La subida del contrato (JPG/PNG/PDF) se archiva en Drive y enlaza en `Contrato_Archivo`. Se marcan los checklists (`Checkin_Revisado`/`Checkout_Revisado`) y se suben los vídeos in/out a Drive, cuyo enlace queda en `Video_In_Url`/`Video_Out_Url` (rellenables también a mano). Ver ADR-0005 y ADR-0014.

### 5.4 Estadísticas
Tres zonas —Todos los alquileres, Piscina/Jardín, Habitación—, cada una con el total de reservas del año natural y los ingresos netos. Datos precalculados a diario (trigger a las 03:00) y leídos de `Estadisticas_Cache`; la UI muestra el texto fijo "Las estadísticas se actualizan cada 24 horas". Ver ADR-0009.

### 5.5 Calendario de ocupación
El calendario de ocupación es un **único Google Calendar** (Config `Calendar_Id`; vacío = calendario por defecto de la cuenta operativa) con **color por espacio**. Cada reserva crea un evento al guardar y lo elimina al cancelar; el ID queda en `Calendar_Event_Id`. La app lo **enlaza** (no lo embebe) desde el Inicio mediante `Calendar_Url`. Ver ADR-0010.

### 5.6 Recordatorios automáticos
**Pendiente de diseño.**

### 5.7 Gestión de incidencias/mantenimiento
Los campos de incidencias por reserva (Incidencias, Incidente_Comunicado, Compensación_Daños, Incidencia_Resuelta) están definidos en ADR-0004. El flujo completo de gestión (pantalla, si hay mantenimiento independiente de una reserva concreta) **está pendiente de diseño**.

### 5.8 Gestión de gastos y reparto (IRPF)
Pantalla para registrar gastos del negocio (con justificante en Drive) y obtener el resumen fiscal por ejercicio y espacio, mostrando el **tercio (33,33 %)** que corresponde a cada copropietario para su IRPF (rendimiento del capital inmobiliario; no es actividad económica). El objetivo es **deducir todo lo posible dentro de la ley**, incluida la amortización. Marco y reglas en **ADR-0012**; datos en `Gastos` (§3.13), `Catálogo_Categorias_Gasto` (§3.14) y `Resumen_Fiscal` (§3.15). **Pendiente de confirmar con el gestor** qué gastos son deducibles y en qué proporción.

### 5.9 Registro de viajeros (formulario público para el huésped)
Formulario público, sin login, independiente de la webapp interna, donde el huésped de una reserva de Habitación introduce sus datos y los de sus acompañantes (incluyendo fotos de DNI/NIF) para cumplir con la normativa de registro de viajeros. Identificación de la reserva por nombre + fechas de estancia, no por ID. Ver ADR-0007. **Diseñado, implementación diferida a una fase posterior.**

## 6. Automatizaciones
- Validación de solapamientos (bloqueo duro, ver 5.2).
- Avisos de cierre/reapertura de canales a los tres co-propietarios (ver 5.2).
- **Email de confirmación de reserva generada** a los tres, al crear una reserva (resumen de la reserva).
- **Sincronización con Google Calendar**: crear/actualizar/eliminar el evento de ocupación según el ciclo de vida de la reserva (ver ADR-0010).
- Informes por email a los tres, con KPIs y gráficas (servicio Charts de Apps Script), archivando los datos agregados en `Historico_Informes`, con **dos cadencias**: **mensual** y **trimestral** (triggers programados).
- Recálculo diario de estadísticas: trigger temporal a las 03:00 que recalcula los agregados por zona y los sobrescribe en `Estadisticas_Cache` (ver ADR-0009).
- **Mantenimiento nocturno** (mismo trigger de las 03:00, ver ADR-0013): copia de seguridad del Sheet cada 2 días conservando 15 copias; purga de `Logs` (> 90 días) y `Errores` (> 365 días); y borrado de los vídeos in/out con más de 180 días (ADR-0014).
- **Subida de archivos a Drive** (ver ADR-0014): al subir un documento o un vídeo in/out, se archiva en la carpeta `{Espacio} / {reserva}` correspondiente con la convención de nombres del proyecto.

## 7. Pendiente general
- Columnas exactas y orden por defecto de la tabla de Gestionar Reserva (las de la tabla de últimas 5 del Inicio ya están definidas en ADR-0008).
- Diseño visual/disposición de los campos en la edición de "Gestionar Reserva".
- Tamaño máximo de archivo para la subida del contrato.
- **Módulo de Gastos / reparto IRPF:** caso simple (capital inmobiliario, reparto a tercios) definido en ADR-0012; pendiente de **confirmar con el gestor** la deducibilidad y la proporción de cada gasto, los datos de amortización y el criterio de prorrateo de gastos comunes.
- Calendario de ocupación: un calendario por espacio vs. colores; embeber vs. enlazar (ADR-0010).
- Recordatorios automáticos.
- Flujo completo de incidencias/mantenimiento.
- Sistema de diseño visual (paleta, tipografía, componentes) — sesión de diseño.

## 8. Fuera de alcance de la primera versión (fase 2)
- Registro de viajeros (Guardia Civil / SES.Hospedajes): construcción del formulario público y la hoja `Registro_Viajeros` (diseño ya cerrado en ADR-0007).
- Investigación de la API de SES.Hospedajes para automatizar el envío.
