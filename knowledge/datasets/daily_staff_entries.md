---
id: dataset_daily_staff_entries
type: dataset
title: Dataset: Jornales y Turnos de Colaboradores (daily_staff_entries)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, payroll, operations]
---

# Dataset: daily_staff_entries

Almacena el detalle individual de cada colaborador asignado a un turno dentro de un parte diario. Es la fuente para la liquidación de sueldos y la facturación de horas.

## Tabla Física (PostgreSQL)
`public.daily_staff_entries`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria (`gen_random_uuid()`). |
| `daily_work_log_id` | `UUID` | Sí | FK hacia [daily_work_logs](./daily_work_logs.md). |
| `employee_id` | `UUID` | Sí | FK hacia `employees(id)`. |
| `position_id` | `UUID` | Sí | FK hacia `positions(id)` desempeñado en este turno. |
| `shift_start_time` | `TIME` | Sí | Hora de inicio del turno. |
| `shift_end_time` | `TIME` | Sí | Hora de finalización del turno. |
| `regular_hours` | `NUMERIC(5,2)` | Sí | Cantidad de horas normales. |
| `overtime_50_hours` | `NUMERIC(5,2)` | Sí | Horas extraordinarias al 50%. |
| `overtime_100_hours` | `NUMERIC(5,2)` | Sí | Horas extraordinarias al 100%. |
| `shuttles_count` | `INTEGER` | Sí | Cantidad de traslados/remises asignados al encargado. |
| `plus_delta_amount` | `NUMERIC(12,2)`| Sí | Importe adicional fijo por complejidad o turno. |
| `meal_allowance_count` | `INTEGER` | Sí | Viáticos de comida otorgados. |
| `advance_payment_amount` | `NUMERIC(12,2)` | Sí | Adelantos de sueldo entregados en mano. |
| `is_day_off` | `BOOLEAN` | Sí | Flag si el operario prestó servicio en día de descanso. |
| `bonus_applied_amount` | `NUMERIC(12,2)` | Sí | Monto calculado automáticamente según escala gremial. |

## Reglas de Integridad
* Se permite solapamiento horario para el mismo operario si participó en múltiples roles.
* Los remises (`shuttles_count`) se asignan como unidades exclusivamente al encargado del turno.

## Relaciones
* **Cabecera:** [daily_work_logs](./daily_work_logs.md)
* **Regla asociada:** [Bonificación Gremial](../rules/bonificacion_gremial.md)
* **Métricas:** [Horas Equivalentes](../metrics/horas_equivalentes.md) y [Plus Delta](../metrics/plus_delta.md)
