---
id: dataset_client_position_rates
type: dataset
title: Dataset: Tarifario Comercial por Cliente (client_position_rates)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, rates, billing]
---

# Dataset: client_position_rates

Representa la matriz comercial cruzada donde se definen las tarifas horarias vigentes acordadas con cada cliente según el puesto desempeñado y el tipo de hora.

## Tabla Física (PostgreSQL)
`public.client_position_rates`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria. |
| `client_id` | `UUID` | Sí | FK hacia `clients(id)`. |
| `position_id` | `UUID` | Sí | FK hacia `positions(id)` (ej: Chofer, Encargado, Apuntador). |
| `hour_type_id` | `UUID` | Sí | FK hacia `hour_types(id)` (`REGULAR`, `OVERTIME_50`, `OVERTIME_100`). |
| `hourly_rate` | `NUMERIC(12,2)`| Sí | Tarifa por hora acordada comercialmente. |
| `effective_from` | `DATE` | Sí | Fecha a partir de la cual entra en vigencia la tarifa. |
| `created_at` | `TIMESTAMPTZ` | Sí | Timestamp de registro. |

## Reglas de Cruce Tarifario
* La liquidación de proforma toma la tarifa cuya `effective_from` sea `<= work_date` de la operación más reciente.
* Si no existe tarifa de horas extras explícita, se calcula como recargo sobre la tarifa regular (50% o 100%).

## Relaciones
* **Dominio:** [Plazoleta Fiscal](../domains/plazoleta_fiscal.md)
* **Liquidación:** [proformas](./proformas.md)
* **Métrica:** [Total de Proforma Quincenal](../metrics/total_proforma.md)
