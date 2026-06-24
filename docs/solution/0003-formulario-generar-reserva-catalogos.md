# ADR-0003: Formulario "Crear Reserva" — arquitectura personalizada con catálogos configurables

## Estado
Aceptado

## Contexto
- Apps Script permite incrustar formularios HTML personalizados (la pantalla "Crear Reserva", ubicada en la sección homónima de ADR-0008) en lugar de usar Google Forms.
- El alquiler abarca distintos "Espacios" (Piscina/Jardín, Habitación Interior, y potencialmente otros en el futuro), cada uno con sus propios canales, servicios extra y forma de registrar fecha/hora.
- Requisito explícito: poder añadir, quitar o activar/desactivar canales, servicios extra, o incluso espacios nuevos, sin tocar código.
- Requisito explícito: aprovechar que el formulario se programa a medida (en vez de usar Google Forms) para dar mejor experiencia de uso — validaciones, campos dependientes, selector de calendario, etc.
- Piscina/Jardín se reserva por día y franja horaria dentro de ese día; Habitación se reserva por un rango de días (varias noches).

## Decisión
Se construye un formulario HTML personalizado, servido desde la Web App de Apps Script, en vez de usar Google Forms.

Tres catálogos en cascada controlan las listas dinámicas del formulario, todos editables desde el Sheet sin tocar código:

| Hoja | Columnas | Propósito |
|---|---|---|
| `Catálogo_Espacios` | Nombre_Espacio, Activo, Modo_Fecha (`Dia_y_Hora` \| `Rango_Dias`) | Qué espacios existen y cómo se registra su fecha |
| `Catálogo_Canales` | Espacio, Nombre_Canal, Activo, %_Comisión_Default, Gestión_Contrato (`Automática` \| `Manual`) | Canales disponibles por espacio |
| `Catálogo_Servicios_Extra` | Espacio, Nombre_Servicio, Activo, Coste_Unitario, Precio_Unitario | Servicios extra disponibles por espacio, con su coste (lo que nos cuesta) y precio (lo que paga el huésped) |

Campos del formulario y su comportamiento:

1. **Espacio a reservar**: desplegable desde `Catálogo_Espacios`, solo activos.
2. **Canal de reserva**: desplegable filtrado por el Espacio elegido, desde `Catálogo_Canales`, solo activos.
3. **Fecha de la reserva**: el formulario cambia según el `Modo_Fecha` del Espacio elegido:
   - `Dia_y_Hora` (ej. Piscina/Jardín): un selector de fecha única + Hora de llegada + Hora de salida (mismo día).
   - `Rango_Dias` (ej. Habitación): selector de fecha de entrada + fecha de salida.
   En ambos casos, el selector de fecha no permite elegir días anteriores al actual; incluye icono de calendario y también acepta escritura manual en formato DD/MM/AAAA.
4. **Nº de personas**: Adultos (entero ≥ 1) y Menores (entero ≥ 0), validados en el propio formulario antes de enviar.
5. **Servicios extra**: lista filtrada por el Espacio elegido, desde `Catálogo_Servicios_Extra` (solo activos). Por cada servicio contratado se indica una **cantidad** (entero ≥ 1; p. ej. 2 sacos de hielo). Cada servicio (hielo, BBQ, carbón, etc. — lista en aumento) tiene un **coste unitario** (lo que nos cuesta) y un **precio unitario** (lo que paga el huésped); la diferencia es nuestro margen. Se pueden añadir tanto al crear la reserva como durante su gestión posterior. Al añadir un servicio a una reserva se copian el coste y el precio unitarios vigentes del catálogo (**snapshot**), de modo que un cambio futuro de tarifas no altera los importes de reservas pasadas. Las líneas de servicio de cada reserva se almacenan en una hoja propia `Reserva_Servicios` (una fila por servicio: ID_Reserva, Nombre_Servicio, Cantidad, Coste_Unitario_Snapshot, Precio_Unitario_Snapshot), porque la lista de servicios crece y no escala como columnas fijas en `Reservas`. Los totales agregados (Cantidad × precio y Cantidad × coste) se consolidan en `Reservas` para el cálculo de importes y los informes de rentabilidad (ver SDD §4).
6. **Datos de contacto del huésped/cliente**: Nombre (obligatorio, nombre y primer apellido en un único campo de texto), Teléfono y Email (ambos opcionales, ya que muchos canales no facilitan estos datos al anfitrión). Si se rellena el Teléfono, se valida que sean exactamente 9 cifras (móvil, sin prefijo internacional); si se rellena el Email, se valida el formato básico (usuario@dominio.algo). Ambas validaciones se hacen en el cliente, para dar feedback inmediato, y se repiten en el servidor antes de guardar.

Independientemente del `Modo_Fecha`, la reserva se almacena siempre con `Fecha_Hora_Inicio` y `Fecha_Hora_Fin` (datetime completo), construidos así:
- `Dia_y_Hora`: Fecha_Hora_Inicio = Fecha + Hora_Llegada; Fecha_Hora_Fin = Fecha + Hora_Salida.
- `Rango_Dias`: Fecha_Hora_Inicio = Fecha_Entrada + hora de check-in por defecto (de `Config`); Fecha_Hora_Fin = Fecha_Salida + hora de check-out por defecto (de `Config`).

Esto mantiene un único modelo de datos para la validación de solapamientos y los informes, aunque el formulario se vea distinto según el espacio elegido.

## Alternativas consideradas
- **Usar Google Forms**: descartado, no permite campos dependientes dinámicos basados en datos del Sheet ni el nivel de validación/UX buscado, y no aprovecharía que el proyecto se programa a medida.
- **Hardcodear espacios/canales/servicios en el código del formulario**: descartado, contradice el requisito explícito de poder cambiarlos sin tocar código.
- **Un único modo de fecha para todos los espacios**: descartado; Piscina/Jardín necesita franja horaria dentro de un día y Habitación necesita rango de noches, forzar un único formato perjudicaría a uno de los dos casos.

## Consecuencias

**Positivas**
- Máxima flexibilidad operativa: añadir un canal, un servicio extra, o incluso un espacio nuevo es simplemente editar una fila del Sheet.
- Experiencia de usuario mejor que un Google Forms genérico (validaciones en el momento, campos que aparecen/desaparecen según contexto).
- El modelo de datos de fechas queda unificado (Fecha_Hora_Inicio/Fin) pese a que el formulario varíe visualmente según el espacio.

**Negativas / riesgos**
- Mayor complejidad de desarrollo que un Google Forms: hay que programar la lógica de campos dependientes y las llamadas a los catálogos del Sheet.
- Cada catálogo nuevo implica una lectura adicional del Sheet al cargar el formulario; con el volumen de este proyecto es irrelevante, pero conviene agrupar/cachear las lecturas si en el futuro hay más catálogos.
- Hay que documentar bien la convención de columnas de cada catálogo, para que editarlo a mano en el Sheet no rompa el formulario.

## Pendiente
- Definir el detalle de las validaciones del formulario (mensajes de error concretos, límites de capacidad si los hubiera).
- La comisión de plataforma se aplica sobre el total (`Importe_Bruto`), incluidos los servicios extra (ver SDD §4).
