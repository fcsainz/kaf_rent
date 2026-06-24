# ADR-0001: Autenticación mediante cuenta de Google y lista de cuentas autorizadas en el Sheet

## Estado
Aceptado

## Contexto
- El proyecto se monta sobre una **cuenta de Gmail operativa dedicada** (`operaciontangai@gmail.com`), distinta de las cuentas personales de los tres usuarios. Esa cuenta es la **propietaria de toda la infraestructura**: el proyecto de Apps Script, el Google Sheet (base de datos), la carpeta de Drive (contratos), el Calendar (ocupación) y el buzón desde el que se envían los emails.
- Al ser una cuenta personal de Gmail (no Google Workspace), no existe el control nativo de "compartir solo con usuarios de mi dominio" que sí tienen las cuentas corporativas.
- La webapp la usarán tres personas, cada una con **su propia cuenta de Google personal**, con el mismo nivel de permisos. No comparten la cuenta operativa; se autentican con la suya.
- Requisito explícito: que nadie más, aparte de esas tres personas, pueda acceder a la aplicación.
- Requisito explícito: poder saber qué persona registró o modificó cada reserva (trazabilidad).
- Restricción del proyecto: coste de infraestructura cero.

## Decisión
- Toda la infraestructura (proyecto Apps Script, Sheet, Drive, Calendar) es **propiedad** de la cuenta operativa `operaciontangai@gmail.com`, y esos recursos se **comparten** (editor) con las tres cuentas personales.
- La Web App se despliega con acceso "Cualquiera con cuenta de Google" y **ejecutándose como el usuario que accede** (`executeAs: USER_ACCESSING`). Es necesario para que `Session.getActiveUser().getEmail()` devuelva el correo de cada usuario: con cuentas personales (no Workspace), ejecutar "como propietario" devolvería el correo **en blanco**, impidiendo el control de acceso y la auditoría.
- La Web App de Apps Script se despliega con acceso "Cualquier persona con cuenta de Google", de forma que Google exige login antes de poder cargar la interfaz.
- En cada `doGet`, el script obtiene el correo de la persona que ha iniciado sesión mediante `Session.getActiveUser().getEmail()`.
- Ese correo se compara contra una hoja `Usuarios_Autorizados` en el Google Sheet, con columnas Email y Activo (se deja la columna Rol prevista para el futuro, aunque hoy los tres comparten el mismo nivel de acceso).
- Si el correo no aparece en la hoja, o aparece marcado como inactivo, se muestra una pantalla de acceso denegado en lugar del formulario, y el intento queda registrado en la hoja `Logs`.
- Si el correo está autorizado, se carga la interfaz con normalidad, y ese mismo correo se reutiliza para rellenar automáticamente los campos de auditoría (Registrado_Por / Modificado_Por) de cualquier reserva que esa sesión cree o edite.

## Alternativas consideradas
- **Acceso "Cualquiera, incluso anónimo"**: descartado, no cumple el requisito de restringir el acceso a las tres personas.
- **Acceso "Solo yo"**: descartado, impediría el acceso a las otras dos personas del proyecto.
- **Login propio con usuario/contraseña gestionado dentro del Sheet**: descartado; reinventa un sistema de autenticación que Google ya ofrece gratis y de forma más segura, y obligaría a gestionar altas, bajas y recuperación de contraseñas a mano.
- **Google Workspace con cuentas corporativas y restricciones de dominio**: descartado por la restricción explícita de no invertir en infraestructura (Workspace tiene coste mensual).

## Consecuencias

**Positivas**
- Coste cero: se reutiliza el login nativo de Google, sin sistema de autenticación propio.
- La lista de personas autorizadas es completamente editable desde el Sheet, sin tocar código: dar o quitar acceso a alguien es añadir, borrar o desactivar una fila.
- La trazabilidad de quién hizo qué sale "gratis", reutilizando el correo de la sesión ya autenticada.
- No hay contraseñas que gestionar, resetear ni proteger.

**Negativas / riesgos**
- Al ejecutarse "como el usuario que accede", los recursos (Sheet/Drive/Calendar) deben compartirse con las tres cuentas, y los **emails interactivos** salen desde la cuenta del usuario que ejecuta la acción (los **programados** —informes, estadísticas— salen desde la cuenta operativa, que es quien crea los triggers). A revisar si se quiere un remitente único.
- Si una de las tres personas pierde el acceso a su cuenta de Google, pierde el acceso a la app; la recuperación depende enteramente de Google, no hay mecanismo propio.
- La comprobación de autorización se hace en cada carga de la interfaz; a tres usuarios es irrelevante en términos de rendimiento, pero si la lista creciera mucho en el futuro habría que revisar el enfoque.
- Es necesario verificar en el despliegue real que `Session.getActiveUser().getEmail()` devuelve el correo esperado (y no vacío) en el contexto concreto de Web App, ya que su comportamiento puede variar según la configuración de permisos de la implementación.
