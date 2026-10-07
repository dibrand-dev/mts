---
id: dataset_proformas
type: dataset
title: Dataset: Proformas de Facturación (proformas)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, billing, proformas]
---

# Dataset: proformas

Contiene los comprobantes de liquidación previa quincenal emitidos a clientes para su revisión antes de la emisión de la factura fiscal ARCA.

## Tabla Física (PostgreSQL)
`public.proformas`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Identificador único de la proforma. |
| `proforma_number` | `TEXT` | Sí | Numeración correlativa legible (ej: `PRF-2026-001`). |
| `client_id` | `UUID` | Sí | FK hacia `clients(id)`. |
| `fortnight_period` | `TEXT` | Sí | Identificador del periodo (formato `YYYY-MM-Q1` o `YYYY-MM-Q2`). |
| `concept_type` | `ENUM` | Sí | `general_hours`, `shuttles` o `export_tallymen`. |
| `status` | `ENUM` | Sí | `draft`, `sent`, `approved`, `invoiced`, `paid`, `overdue`. |
| `subtotal` | `NUMERIC(14,2)`| Sí | Suma de los conceptos sin impuestos. |
| `total` | `NUMERIC(14,2)`| Sí | Total neto facturable al cliente. |
| `public_token` | `UUID` | Sí | Token público único para acceso web sin login del cliente. |
| `issue_date` | `DATE` | Sí | Fecha de emisión de la proforma. |
| `due_date` | `DATE` | Sí | Fecha límite para objeciones o pago. |

## Estados y Ciclo de Vida
```
draft ──► sent ──► approved ──► invoiced ──► paid
                     ▲
            (Auto tras 5 días)
```

## Relaciones
* **Dominio:** [Plazoleta Fiscal](../domains/plazoleta_fiscal.md)
* **Regla asociada:** [Cierre Quincenal y División de Proformas](../rules/cierre_quincenal_proformas.md)
* **Factura asociada:** [tax_invoices](./tax_invoices.md)
* **Métrica:** [Total de Proforma Quincenal](../metrics/total_proforma.md)
