# Desarrollo y despliegue — KAF Rent

El código de la app vive en [`src/`](src/) (Google Apps Script). Se edita en VS Code y se sincroniza con Google mediante **clasp**.

## Estructura del código

```
src/
├── appsscript.json          # Manifiesto (zona horaria, V8, Web App: executeAs USER_ACCESSING)
├── Code.gs                  # doGet() — punto de entrada de la Web App
├── auth.gs                  # Verificación de usuario autorizado y log de accesos (ADR-0001)
├── config.gs                # Lectura de parámetros desde la hoja Config
├── setup.gs                 # Esquema de la BD + inicializarBaseDeDatos() + menú
├── utils.gs                 # Utilidades (acceso a hojas, logging de errores)
├── index.html               # Shell de la app (Inicio + 3 secciones)
├── estilos.html             # Tokens del sistema de diseño (ADR-0011)
├── cliente.html             # JS de cliente (navegación entre secciones)
└── acceso-denegado.html     # Pantalla de acceso denegado
```

## Puesta en marcha (una vez)

1. **Cuenta operativa:** inicia sesión con `operaciontangai@gmail.com`. Todo (Sheet, Drive, Calendar) será propiedad de esta cuenta.
2. **Crear la base de datos:** crea un Google Sheet en blanco (será la base de datos).
3. **Crear el proyecto de script:** en ese Sheet, `Extensiones → Apps Script`. Copia el **Script ID** desde `Configuración del proyecto`.
4. **clasp:**
   ```bash
   npm install -g @google/clasp
   clasp login            # inicia sesión con la cuenta operativa
   cp .clasp.json.example .clasp.json   # pega el Script ID en .clasp.json
   clasp push             # sube el código de src/ al proyecto
   ```
5. **Inicializar las hojas:** abre el Sheet → menú **KAF Rent → Inicializar / reparar hojas** (o ejecuta `inicializarBaseDeDatos` desde el editor). Crea todas las hojas con sus cabeceras y siembra `Config`, `Catálogo_Espacios` y `Catálogo_Categorias_Gasto`.
6. **Dar de alta usuarios:** en la hoja `Usuarios_Autorizados`, añade las tres cuentas personales (Email, Activo = Sí).
7. **Compartir recursos:** comparte el Sheet (y la carpeta de Drive y el Calendar) con las **tres cuentas personales** como editor. La Web App se ejecuta como el usuario que accede (ver ADR-0001), por lo que necesitan acceso.
8. **Desplegar la Web App:** `Implementar → Nueva implementación → Aplicación web`, ejecutar **como el usuario que accede**, acceso **cualquiera con cuenta de Google**. Comparte la URL con los tres.

## Día a día

```bash
clasp push      # subir cambios
clasp pull      # traer cambios hechos en el editor web
```

> `.clasp.json` y `.clasprc.json` están en `.gitignore` (contienen IDs/credenciales locales).
