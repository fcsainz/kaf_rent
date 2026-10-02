# DD-01 — Checklists digitales de check-in y check-out

**Estado:** implementado en S16 (2026-09-27) · pendiente: crear las hojas en el Sheet real al desplegar · **Fecha:** 2026-09-27 · **Sprint:** S16
**Trazabilidad:** ↑ F-14, HU-24 (checklists ya existentes como Pendiente/Hecho) · ↓ RF nuevos al aprobar · ADR: no hace falta (patrón de catálogos, ADR-0003/0008)

## 1. Problema y objetivo
Hoy la checklist de Piscina/Jardín es un PDF impreso ([Checklist_Piscina_Jardin.pdf](../../../docs_work/doc_check/Checklist_Piscina_Jardin.pdf)) y en la app solo se marca "Check-in: Hecho / Pendiente". No queda constancia de **qué** se revisó ni de quién, y la Habitación no tiene checklist.
**Objetivo:** hacer check-in y check-out desde el móvil, punto por punto, con constancia de quién y cuándo; que una reserva no se cierre sin check-out; y que el admin pueda mejorar las listas desde la app.
**Criterio de éxito:** en una reserva real, el responsable completa check-in y check-out en el móvil sin papel, en menos de 5 minutos cada uno.

## 2. Alcance
- **Incluye:** 4 listas (Exterior-In, Exterior-Out, Interior-In, Interior-Out); bloque Barbacoa y extras solo si están contratados; opción **"No aplica"** en cada punto; confirmación antes de dar la lista por terminada; vídeo de inicio/fin y **fotos de desperfectos** desde la propia checklist; cierre de la reserva = cobrado + check-out hecho; **editor de la checklist para el admin** (activar/desactivar puntos, crear puntos y bloques).
- **No incluye:** firma del huésped; checklists de mantenimiento sin reserva (F-03).

## 3. Diseño

### 3.1 Datos (solo se añade; nada se renombra ni se borra)
| Hoja | Columnas | Para qué |
|---|---|---|
| `Catálogo_Checklist` (nueva) | ID_Punto · Espacio · Momento (Check-in/Check-out) · Bloque · Punto · Tipo (Casilla / Fecha) · Servicios_Requeridos · Condicion · Punto_Pareja · Orden · Activo | Los puntos de cada lista. Se editan desde la app (admin) o desde el Sheet. |
| `Registro_Checklist` (nueva) | ID_Reserva · Momento · ID_Punto · Estado (Hecho / No aplica / Pendiente) · Valor (fecha, en puntos de tipo Fecha) · Usuario · Fecha_Hora | Qué se marcó, quién y cuándo. |
| `Catálogo_Servicios_Extra` | fila nueva: Piscina / Jardín · **Pistolas de agua** | Para que su punto salga solo si se contrata (precio a definir, §5). |

- `Servicios_Requeridos`: vacío = el punto sale siempre; con nombres de servicios separados por `|` = solo si la reserva tiene alguno contratado. Así funcionan Barbacoa y extras, distintos en cada espacio.
- `Tipo = Fecha`: el punto se resuelve eligiendo una fecha en un calendario (p. ej. el día en que se limpió el WC, que puede no ser el del check-out).
- `Condicion`: `Siguiente_Pronto` = solo si la siguiente reserva del mismo espacio empieza en ≤ N días; `Siguiente_Lejos` = si empieza después o no hay ninguna. N = `Config.Dias_Office_Reponer` (3).
- **"No aplica" en el check-in → no sale en el check-out:** si todos los puntos registrados de un bloque del check-in son "No aplica", ese bloque no sale en el check-out; y un punto de check-out con `Punto_Pareja` no sale si su pareja fue "No aplica" (la pareja la fija el admin cuando haga falta).
- `Checkin_Revisado` y `Checkout_Revisado` se mantienen: pasan a "Hecho" cuando el usuario confirma la lista.

### 3.2 Pantalla (móvil primero)
En **Gestionar → Modificar**, dos bloques plegables: **Check-in** y **Check-out**, con sus secciones en el orden de §3.5. Cada punto: casilla grande (≥ 44 px) y botón **"No aplica"**. Contador "12 de 20" (los "No aplica" cuentan como resueltos). Observaciones al final.
- **Vídeo:** el punto de vídeo tiene su botón de subida; al subirlo, se marca solo.
- **Fotos de desperfectos (check-out):** botón "Añadir foto" junto al vídeo; se guardan en la carpeta de la reserva en Drive.
- **Daños:** si "Sin daños…" no se marca, la app lleva a registrar la incidencia.
- **Terminar:** cuando todo está resuelto, **"Dar el check-in por terminado"** abre una confirmación; solo al confirmar pasa a "Hecho".

### 3.3 Editor de la checklist (solo Admin, RF-84)
Pestaña **Checklist** en la sección del admin: elegir espacio y momento → ver bloques y puntos → activar/desactivar, editar texto, reordenar, **añadir punto** a un bloque o **añadir bloque nuevo**. Nunca se borra un punto usado en reservas: se desactiva (el histórico sigue legible).

### 3.4 Servidor
- `cargarChecklist(idReserva, momento)` · `guardarChecklist(idReserva, momento, estados, observaciones)` · `confirmarChecklist(idReserva, momento)` · `subirFotoDesperfecto(idReserva, archivo)`.
- Admin: `cargarCatalogoChecklist(espacio, momento)` · `guardarPuntoChecklist(punto)` (alta, edición, activar/desactivar).
- Dominio puro: `puntosAplicables_` (espacio, momento, servicios, parejas "No aplica"), `checklistResuelta_`.

### 3.5 Regla de cierre (cambia `calcularEstadoReserva_`)
Completada = cobro Ingresado **y** check-out Hecho **y** sin incidencia abierta. Comprobado en el Sheet (2026-09-27): las 6 reservas completadas tienen el check-out en "Hecho"; ninguna vuelve atrás.

## 4. Contenido de las 4 listas

Archivado y mantenido en [docs_work/doc_check/checklists-check-in-out.md](../../../docs_work/doc_check/checklists-check-in-out.md) (versión 1.0, aprobada el 2026-09-27). Es la semilla del catálogo.

## 5. Preguntas abiertas
- **Interior — Check-out:** no lo revisaste punto a punto; lo he completado haciendo de espejo de tus cambios del check-in (cajones, TV, persiana, llaves, office, terraza).
- **Pistolas de agua:** resuelto (D-22, 2026-10-02): sin precio mientras nadie las pida.
- **"Pieza de alimento"** (Interior, office): se deja con ese texto; editable después desde el editor.

## 6. Alternativas descartadas
| Alternativa | Por qué se descarta |
|---|---|
| Puntos escritos en el código | Cada mejora exigiría un despliegue (va contra "ampliar por datos", CLAUDE.md §3.1). |
| Una columna por punto en `Reservas` | ~100 columnas nuevas en la hoja principal; imposible de mantener. |
| Borrar puntos desde el editor | Dejaría registros de reservas pasadas apuntando a puntos inexistentes; se desactivan. |

## 7. Plan
1. Esquema: `Catálogo_Checklist` y `Registro_Checklist` + semilla §4 + servicio "Pistolas de agua" (S) — tests de esquema.
2. Dominio: `puntosAplicables_`, `checklistResuelta_`, nueva regla de estado (S) — unitarios.
3. Endpoints de checklist, foto y editor admin + auditoría (M) — tests de endpoints.
4. Pantallas: checklist en Gestionar y editor del admin (M–L) — E2E en el release (CLAUDE.md §8.3).
5. Sheet real (vía clasp): crear las dos hojas, cargar la semilla y añadir el servicio, sin tocar lo existente.
