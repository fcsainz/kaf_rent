# DD-NN — {Funcionalidad}

**Estado:** borrador | en revisión | aprobado | implementado · **Fecha:** AAAA-MM-DD · **Sprint:** Sn
**Trazabilidad:** ↑ HU-NN, F-NN · ↓ RF-NN, ADR-NNNN (si sale alguna decisión de arquitectura)

> Un design doc se escribe **antes** de programar una funcionalidad grande (talla L o más, o que cambie hojas).
> Cuenta el diseño completo en 1–3 páginas; cada decisión de arquitectura que salga de aquí va a su ADR.
> Estándar elegido en D-09: arc42 + C4 para el sistema, un design doc por funcionalidad grande.

## 1. Problema y objetivo
Qué problema resuelve, para quién, y cómo sabremos que funciona (criterio medible).

## 2. Alcance
- **Incluye:** …
- **No incluye:** … (y por qué)

## 3. Diseño
- **Pantallas y flujo:** qué ve y hace el usuario, en móvil primero (CLAUDE.md §6).
- **Datos:** hojas y columnas nuevas o cambiadas. Siempre **añadir al final**, nunca renombrar ni borrar mientras la versión en uso las necesite.
- **Servidor:** endpoints nuevos (qué reciben y devuelven), funciones de dominio, adaptadores.
- **Reglas de negocio:** cálculos y validaciones, con su fuente (ley, HU, decisión).

## 4. Alternativas descartadas
| Alternativa | Por qué se descarta |
|---|---|

## 5. Riesgos y preguntas abiertas
- …

## 6. Plan
Pasos en orden, con talla; qué tests unitarios lleva cada uno. Los E2E van en el release (CLAUDE.md §8.3).
