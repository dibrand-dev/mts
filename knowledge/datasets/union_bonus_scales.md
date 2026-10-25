---
id: dataset_union_bonus_scales
type: dataset
title: Dataset: Escalas de Bonificación Gremial CCT (union_bonus_scales)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, union, payroll, cct]
---

# Dataset: union_bonus_scales

Almacena la tabla paramétrica de escalas salariales por volumen de vehículos operados (buques) según el Convenio Colectivo de Trabajo (CCT).

## Tabla Física (PostgreSQL)
`public.union_bonus_scales`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria. |
| `min_vehicles` | `INTEGER` | Sí | Límite inferior inclusivo de unidades operadas. |
| `max_vehicles` | `INTEGER` | No | Límite superior inclusivo (`NULL` representa sin límite superior / infinito). |
| `bonus_amount` | `NUMERIC(12,2)`| Sí | Monto fijo de bonificación en moneda local a acreditar en el turno. |
| `effective_from` | `DATE` | Sí | Fecha desde la cual rige la escala salarial. |
| `created_at` | `TIMESTAMPTZ` | Sí | Timestamp de auditoría. |

## Escala Salarial CCT Vigente
| Rango de Vehículos | Monto Bonificación ($) |
|---|---|
| 0 a 1.499 | $ 88.200,48 |
| 1.500 a 1.999 | $ 102.015,99 |
| 2.000 a 2.499 | $ 118.540,55 |
| 2.500 a 2.999 | $ 135.065,11 |
| 3.000 a 3.499 | $ 143.503,04 |
| 3.500 en adelante | $ 155.000,00 |

## Consultas Típicas
Para determinar el bono de un turno donde se manipularon `N` vehículos:
```sql
SELECT bonus_amount 
FROM union_bonus_scales
WHERE effective_from <= :work_date
  AND :vehicles >= min_vehicles 
  AND (:vehicles <= max_vehicles OR max_vehicles IS NULL)
ORDER BY effective_from DESC, min_vehicles DESC
LIMIT 1;
```

## Relaciones
* **Regla de Negocio:** [Bonificación Gremial por Vehículos](../rules/bonificacion_gremial.md)
* **Destino:** [daily_staff_entries](./daily_staff_entries.md)
* **Origen de Volumen:** [daily_work_logs](./daily_work_logs.md)
