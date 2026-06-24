# Definition of Done (DoD) — KAF Rent

**Versión:** 0.5  
**Fecha:** 2026-06-24  
**Estado:** En diseño — revisado  
**Framework:** Scrum Guide — Definition of Done  

---

## Propósito

La Definition of Done (DoD) establece los criterios mínimos que debe cumplir un incremento de trabajo para considerarse **terminado**. Define la calidad mínima aceptable en cada nivel (story, feature, epic, release).

En un proyecto con un único desarrollador, la DoD actúa como lista de verificación personal que evita acumular deuda técnica silenciosa y garantiza que el trabajo esté realmente listo antes de pasar al siguiente.

---

## Definition of Ready (DoR)

Antes de empezar a trabajar en una historia, debe cumplir estos criterios:

- [ ] La historia tiene criterios de aceptación claros y verificables
- [ ] El ADR o diseño de referencia está identificado (si aplica)
- [ ] Los datos necesarios en los catálogos de Sheets están disponibles para pruebas
- [ ] No hay bloqueos técnicos conocidos sin resolver
- [ ] La historia es lo suficientemente pequeña para completarse en una sesión de trabajo

---

## Definition of Done — Nivel Story (Historia de Usuario)

Cada historia de usuario se considera **Done** cuando:

**Funcionalidad**
- [ ] El código que implementa la historia está escrito y desplegado en Google Apps Script vía `clasp push`
- [ ] Todos los criterios de aceptación de la historia han sido verificados manualmente en el navegador
- [ ] El flujo Happy Path (camino principal sin errores) funciona correctamente
- [ ] Los casos de error contemplados en los criterios de aceptación también funcionan correctamente

**Calidad**
- [ ] No hay errores en el log de ejecución de Google Apps Script
- [ ] Los datos se guardan correctamente en las hojas de Google Sheets correspondientes
- [ ] Los mensajes al usuario (éxito, error) son claros y accionables

**UX/UI**
- [ ] La interfaz cumple los Estándares de UX/UI ([CLAUDE.md](../../CLAUDE.md) §4): jerarquía visual clara, estados de carga/error/vacío resueltos, confirmación en acciones destructivas y accesibilidad básica (contraste, foco, etiquetas)
- [ ] El flujo se puede completar sin formación por un usuario no técnico (validado contra los User Journeys de [02_personas.md](02_personas.md))

**Regresión**
- [ ] El flujo que existía antes de este cambio sigue funcionando (no se rompió nada que ya funcionaba)

**Seguridad**
- [ ] La funcionalidad no expone datos sin autenticación
- [ ] No se introduce ninguna entrada de usuario no validada directamente en una llamada de servidor

---

## Definition of Done — Nivel Feature (Conjunto de Historias)

Una feature se considera **Done** cuando:

- [ ] Todas las User Stories que componen la feature están en estado Done (nivel story)
- [ ] El flujo completo de la feature ha sido probado end-to-end (de principio a fin)
- [ ] Los datos en Google Sheets son consistentes tras ejecutar el flujo completo
- [ ] Las notificaciones por email (si aplican en la feature) se envían y reciben correctamente
- [ ] El ADR correspondiente está actualizado si hubo cambios de diseño durante la implementación

---

## Definition of Done — Nivel Epic

Un epic se considera **Done** cuando:

- [ ] Todas las features que componen el epic están en estado Done
- [ ] Los tres usuarios han podido probar el flujo del epic de forma autónoma (UAT informal)
- [ ] El feedback de los usuarios no técnicos (Ana y Luis) ha sido recogido y los bloqueantes resueltos
- [ ] La hoja `SDD.md` en `docs/solution/` refleja el estado actual implementado si hubo cambios

---

## Definition of Done — Nivel Release

Un release se considera **Done** (listo para uso en producción) cuando:

**Funcional**
- [ ] Todos los épics y features de prioridad Must Have del release están en estado Done
- [ ] Los épics y features de prioridad Should Have del release están Done o hay acuerdo explícito de diferirlos
- [ ] UAT completo: los tres usuarios han probado los flujos principales y han dado su aprobación

**Técnico**
- [ ] La URL de la webapp está compartida y accesible para todos los usuarios autorizados
- [ ] La hoja `Usuarios_Autorizados` tiene los tres emails configurados y activos
- [ ] La hoja `Config` tiene todos los parámetros necesarios configurados (emails de notificación, horas por defecto, etc.)
- [ ] Los catálogos base (`Catálogo_Espacios`, `Catálogo_Canales`, `Catálogo_Servicios_Extra`) tienen los datos reales configurados
- [ ] Se ha realizado una copia de seguridad de la hoja de Google Sheets como respaldo

**Documentación**
- [ ] El `SDD.md` está actualizado con el estado real del sistema entregado
- [ ] Los ADRs afectados por cambios durante la implementación están actualizados
- [ ] Los documentos de discovery en `docs/discovery/` reflejan el alcance real del release

---

## Criterios de calidad transversales

Estos criterios aplican a cualquier nivel de Done:

| Criterio | Descripción |
|---|---|
| **Sin datos de prueba en producción** | Antes del release, todos los datos de prueba introducidos durante el desarrollo son eliminados de las hojas |
| **Sin credenciales en el código** | Ningún email, ID de hoja, ID de Drive o credencial está hardcodeada en el código; se usa la hoja `Config` |
| **Logs limpios** | Las hojas `Logs` y `Errores` no contienen errores sin resolver del proceso de desarrollo |
| **Consistencia de catálogos** | Los catálogos de Sheets son coherentes entre sí (un canal referencia un espacio que existe, etc.) |

---

## Notas para el desarrollador

- Como desarrollador único, la DoD actúa como tu checklist personal antes de pasar al siguiente ticket
- Para las revisiones con usuarios no técnicos (UAT), prepara un guión simple de prueba basado en los User Journeys del documento [02_personas.md](02_personas.md)
- Los criterios de Done de nivel Release son los más críticos: no salgas a producción hasta que todos estén marcados
