# Discovery — KAF Rent

Documentación de **qué** se construye y **por qué**. El **cómo** está en [../solution/](../solution/) (arc42 + ADR en formato MADR).

## Estructura y orden de lectura

| Doc | Archivo | Contenido | Framework |
|---|---|---|---|
| 01 | [01_problema.md](01_problema.md) | Visión, contexto, personas, problemas **P-xx** con sus **JTBD**, To-Be, KPI, alcance, restricciones y journeys | Lean UX + JTBD + NN/g + Vision Board |
| 02 | [02_historias_usuario.md](02_historias_usuario.md) | Historias **HU-xx** por épica (backbone del story map), Gherkin, MoSCoW, estado | INVEST + BDD + Story Mapping |
| 03 | [03_requisitos_funcionales.md](03_requisitos_funcionales.md) | Requisitos funcionales **RF-xx**: ↑ HU, ↓ RNF, ADR, implementación, test, ↓ sprint, estado | ISO/IEC/IEEE 29148 |
| 04 | [04_requisitos_no_funcionales.md](04_requisitos_no_funcionales.md) | Requisitos no funcionales **RNF-xx** medibles: ↑ origen, ↓ RF, ↓ sprint | ISO/IEC 25010:2023 |

## Qué pasó con los documentos de la v0.5

| Documento v0.5 | Destino |
|---|---|
| `01_product_vision.md`, `02_personas.md`, `03_problem_statement.md` | Fusionados en **01_problema.md** |
| `04_story_map.md`, `05_user_stories.md` | Fusionados en **02_historias_usuario.md** (el backbone del story map ordena las épicas) |
| `06_nfr.md` | Rehecho como **04_requisitos_no_funcionales.md** |
| `07_definition_of_done.md` | Pasa a **[CLAUDE.md §8](../../CLAUDE.md)** (regla de trabajo) |
| `08_risk_register.md` | Pasa a **[arc42 §11](../solution/arc42.md#11-riesgos-y-deuda-técnica)** (riesgos y deuda técnica) |
| `09_roadmap.md` | Pasa a **[PROXIMOS_PASOS.md](../../PROXIMOS_PASOS.md)** (sprints autogenerados + histórico) |

## Reglas

- IDs estables: un ID nunca se reutiliza. Si algo se elimina, se marca como retirado.
- Todo cambio de alcance actualiza a la vez HU, RF/RNF, la matriz de trazabilidad y, si afecta al diseño, el ADR. Ver [CLAUDE.md §5](../../CLAUDE.md).
