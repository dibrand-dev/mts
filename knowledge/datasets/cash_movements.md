---
id: dataset_cash_movements
type: dataset
title: Dataset: Movimientos de Flujo de Caja (cash_movements)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, treasury, cash_flow]
---

# Dataset: cash_movements

Registra todos los ingresos y egresos de fondos de la operación diaria (caja chica, pagos a proveedores, cobranzas bancarias, combustibles y retiros).

## Tabla Física (PostgreSQL)
`public.cash_movements`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria. |
| `movement_date` | `DATE` | Sí | Fecha efectiva del movimiento financiero. |
| `type` | `ENUM` | Sí | Tipo de flujo: `income` (ingreso) o `expense` (egreso). |
| `area` | `TEXT` | Sí | Área responsable o imputación del gasto (ej: Operaciones, Administración, Flota). |
| `detail` | `TEXT` | Sí | Descripción conceptual del gasto o ingreso. |
| `amount` | `NUMERIC(14,2)`| Sí | Importe monetario positivo. |
| `created_by` | `UUID` | No | FK hacia `profiles(id)` del operador. |
| `created_at` | `TIMESTAMPTZ` | Sí | Timestamp de auditoría. |

## Relaciones
* **Dominio:** [Flujo de Caja & Proyecciones](../domains/flujo_caja.md)
* **Facturas Relacionadas:** [tax_invoices](./tax_invoices.md)
