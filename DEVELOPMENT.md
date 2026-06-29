# Desarrollo y despliegue — KAF Rent

El código de la app vive en [`src/`](src/) (Google Apps Script). Se edita en VS Code, se versiona con Git y se sincroniza con Google **copiando/pegando manualmente** los ficheros en el editor de Apps Script (no se usa clasp: las tres cuentas de Google hacen de `clasp login` un engorro).

## Estructura del código

```
src/
├── appsscript.json          # Manifiesto (zona horaria, V8, Web App: executeAs USER_ACCESSING)
├── Code.gs                  # doGet() — punto de entrada de la Web App
├── auth.gs                  # Verificación de usuario autorizado y log de accesos (ADR-0001)
├── catalogo.gs              # Lectura de catálogos en cascada del formulario (ADR-0003)
├── reservas.gs              # Crear reserva (fechas, solapamiento, importes, ID) + lectura Inicio/Buscar
├── gestion.gs               # Gestionar Reserva: lista, edición, auditoría, ciclo de vida, cancelación (ADR-0004/0005)
├── drive.gs                 # Subida de contratos y vídeos in/out a Drive (ADR-0014)
├── calendario.gs            # Evento de ocupación por reserva en Google Calendar (ADR-0010)
├── notificaciones.gs        # Emails: cierre/reapertura de canales, confirmación, informes (ADR-0006)
├── estadisticas.gs          # Recálculo y lectura del cache de estadísticas (ADR-0009)
├── informes.gs              # Informes mensual y trimestral por email (US-021)
├── mantenimiento.gs         # Tareas nocturnas: backup, purga, e instalarTriggers() (ADR-0013)
├── gastos.gs                # Gastos y resumen fiscal por ejercicio, reparto a tercios (ADR-0012)
├── config.gs                # Lectura cacheada de parámetros desde la hoja Config
├── setup.gs                 # Esquema de la BD + inicializarBaseDeDatos() + menú
├── utils.gs                 # Utilidades (acceso a hojas, fechas, logging de errores)
├── index.html               # Shell de la app (Inicio + 3 secciones + formularios)
├── estilos.html             # Tokens del sistema de diseño (ADR-0011)
├── cliente.html             # JS de cliente (navegación, Crear Reserva, Inicio, Buscar)
├── gestion_interfaz.html    # JS de cliente (Gestionar Reserva, Estadísticas, enlace Calendar)
├── gastos_interfaz.html     # JS de cliente (Gastos y resumen fiscal)
└── acceso-denegado.html     # Pantalla de acceso denegado
```

> **Importante (Apps Script):** un fichero no puede tener el mismo nombre que otro aunque sean de tipo distinto. Por eso los HTML cuyo módulo `.gs` comparte nombre llevan el sufijo `_interfaz` (`gestion_interfaz`, `gastos_interfaz`); los `include(...)` de `index.html` usan ese mismo nombre.

## Puesta en marcha (una vez)

1. **Cuenta operativa:** inicia sesión con `operaciontangai@gmail.com`. Todo (Sheet, Drive, Calendar) será propiedad de esta cuenta.
2. **Crear la base de datos:** crea un Google Sheet en blanco (será la base de datos).
3. **Crear el proyecto de script:** en ese Sheet, `Extensiones → Apps Script`.
4. **Pegar el código:** en el editor de Apps Script, crea cada fichero de `src/` y pega su contenido.
   - Los `.gs` como tipo **Script**.
   - Los HTML como tipo **HTML**, con el **nombre exacto sin extensión** (`index`, `estilos`, `cliente`, `acceso-denegado`).
   - El manifiesto `appsscript.json` se edita activando "Mostrar el archivo de manifiesto" en `Configuración del proyecto`.
5. **Inicializar las hojas:** abre el Sheet → menú **KAF Rent → Inicializar / reparar hojas** (o ejecuta `inicializarBaseDeDatos` desde el editor). Crea todas las hojas con sus cabeceras y siembra `Config`, `Catálogo_Espacios` y `Catálogo_Categorias_Gasto`.
6. **Dar de alta usuarios:** en la hoja `Usuarios_Autorizados`, añade las tres cuentas personales (Email, Activo = Sí).
7. **Compartir recursos:** comparte el Sheet (y la carpeta de Drive y el Calendar) con las **tres cuentas personales** como editor. La Web App se ejecuta como el usuario que accede (ver ADR-0001), por lo que necesitan acceso.
8. **Desplegar la Web App:** `Implementar → Nueva implementación → Aplicación web`. En el diálogo, **"Ejecutar como" → Usuario que accede** (este desplegable MANDA sobre `appsscript.json` y revierte a `USER_DEPLOYING` si no lo eliges) y acceso **cualquiera con cuenta de Google**. Comparte la URL con los tres.

## Día a día

- Tras cambiar un `.gs` o un HTML en VS Code, **vuelve a pegar ese fichero** en el editor de Apps Script.
- Usa la URL `/dev` (botón **Probar implementaciones**) para iterar sin crear una implementación nueva cada vez; recarga `/dev` tras pegar los cambios.
- Crea una nueva versión de implementación solo cuando quieras publicar a los usuarios.

> `.gitignore` excluye `.clasp.json`/`.clasprc.json` y `node_modules/` por si en el futuro se retoma clasp; hoy no se usan.
