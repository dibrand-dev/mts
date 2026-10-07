---
id: dataset_daily_work_logs
type: dataset
title: Dataset: Partes Diarios de Operaciones (daily_work_logs)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, operations]
---

# Dataset: daily_work_logs

Representa la cabecera operacional de una jornada de trabajo en una locación y cliente determinados. Agrupa a todos los colaboradores y turnos que participaron de dicha operativa.

## Tabla Física (PostgreSQL)
`public.daily_work_logs`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria generada por defecto (`gen_random_uuid()`). |
| `work_date` | `DATE` | Sí | Fecha en que se realizó la operación (clave para el ordenamiento cronológico). |
| `client_id` | `UUID` | Sí | FK hacia `clients(id)` receptor del servicio logístico. |
| `location_id` | `UUID` | Sí | FK hacia `locations(id)` (puerto, muelle o plazoleta). |
| `total_vehicles_handled` | `INTEGER` | No | Total de vehículos manipulados (buque). Base para la bonificación gremial. |
| `is_export_day` | `BOOLEAN` | Sí | Flag booleano (`DEFAULT false`). Si es `true`, los apuntadores se facturan en proforma separada. |
| `logged_by` | `UUID` | No | FK hacia `profiles(id)` del usuario que registró el parte. |
| `created_at` | `TIMESTAMPTZ` | Sí | Timestamp de creación del registro. |

## Reglas e Índices
* **Ordenamiento:** Toda consulta en frontend debe ordenarse por `work_date ASC` e ignorar `created_at`.
* **Disparadores de Cálculo:** Cambios en `total_vehicles_handled` recalculan de forma transparente el `bonus_applied_amount` en los registros asociados de [daily_staff_entries](./daily_staff_entries.md).

## Relaciones
* **Dominio:** [Operaciones](../domains/operaciones.md)
* **Dotación:** [daily_staff_entries](./daily_staff_entries.md)
* **Regla asociada:** [Bonificación Gremial](../rules/bonificacion_gremial.md)
* **Proceso:** [Carga de Parte Diario](../processes/carga_parte_diario.md)
