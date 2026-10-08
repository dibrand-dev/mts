---
id: dataset_projected_obligations
type: dataset
title: Dataset: Obligaciones Financieras Proyectadas (projected_obligations)
status: verified
last_updated: 2026-10-07
owner: finanzas@mts.com
tags: [database, postgresql, table, treasury, projections, cash_flow]
---

# Dataset: projected_obligations

Almacena las obligaciones futuras fiscales y operativas programadas (cargas fiscales ARCA/ARBA, liquidaciones salariales estimadas, retenciones, combustibles, proveedores) utilizadas para calcular proyecciones de saldo en `/cash-flow/projections`.

## Tabla Física (PostgreSQL)
`public.projected_obligations`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria (`gen_random_uuid()`). |
| `due_date` | `DATE` | Sí | Fecha estimada o límite de la obligación. |
| `type` | `ENUM` | Sí | Tipo de flujo: `expense` (egreso) o `income` (ingreso). Por defecto `expense`. |
| `category` | `TEXT` | Sí | Categoría de imputación (ej: `ARCA`, `ARBA`, `IVA`, `Sueldos`, `Comisiones`, `Proveedores`, `Otros`). |
| `title` | `TEXT` | Sí | Nombre o concepto resumido de la obligación. |
| `notes` | `TEXT` | No | Observaciones detalladas adicionales. |
| `amount` | `NUMERIC(14,2)`| Sí | Importe monetario positivo estimado. |
| `status` | `TEXT` | Sí | Estado del compromiso: `projected` (proyectado), `realized` (ejecutado), `cancelled` (cancelado). |
| `created_by` | `UUID` | No | FK hacia `auth.users(id)` del usuario creador. |
| `created_at` | `TIMESTAMPTZ` | Sí | Timestamp de registro. |
| `updated_at` | `TIMESTAMPTZ` | Sí | Timestamp de última modificación. |

## Reglas y Uso
* Se combina en tiempo real con facturación pendiente (`tax_invoices`) y proformas aprobadas para construir la grilla cronológica de saldos proyectados a fecha futura.
* El ordenamiento en la vista de proyecciones es estrictamente ascendente por `due_date ASC`.

## Relaciones
* **Dominio:** [Flujo de Caja & Proyecciones](../domains/flujo_caja.md)
* **Movimientos Reales:** [cash_movements](./cash_movements.md)
* **Facturación Proyectada:** [tax_invoices](./tax_invoices.md) y [proformas](./proformas.md)

