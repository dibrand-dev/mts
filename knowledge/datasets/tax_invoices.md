---
id: dataset_tax_invoices
type: dataset
title: Dataset: Facturas Fiscales Emitidas (tax_invoices)
status: verified
last_updated: 2026-10-07
owner: data-engineering@dibrand.com
tags: [database, postgresql, table, billing, taxes, arca]
---

# Dataset: tax_invoices

Almacena los comprobantes fiscales definitivos emitidos ante el fisco (ARCA) asociados a una o varias proformas aprobadas.

## Tabla Física (PostgreSQL)
`public.tax_invoices`

## Estructura de Campos
| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | `UUID` | Sí | Clave primaria. |
| `proforma_id` | `UUID` | Sí | FK hacia [proformas](./proformas.md). |
| `invoice_number` | `TEXT` | Sí | Número legal de comprobante (ej: `A-0001-00004523`). |
| `pdf_storage_path`| `TEXT` | No | Ruta del archivo PDF en Supabase Storage Bucket. |
| `invoiced_amount` | `NUMERIC(14,2)`| Sí | Monto total facturado con impuestos. |
| `status` | `ENUM` | Sí | `pending` o `paid`. |
| `invoice_date` | `DATE` | Sí | Fecha fiscal de emisión del comprobante. |
| `last_reminder_sent_at` | `TIMESTAMPTZ` | No | Timestamp del último correo de reclamo emitido vía Brevo. |
| `last_reminder_type` | `TEXT` | No | Tipo del último aviso (`upcoming_3_days`, `due_today`, `overdue`). |
| `reminders_sent_count` | `INTEGER` | Sí | Contador acumulado de alertas despachadas (`DEFAULT 0`). |

## Relaciones
* **Proforma:** [proformas](./proformas.md)
* **Regla de Cobranzas:** [Control de Vencimientos y Cobranzas (Brevo)](../rules/control_vencimientos_brevo.md)
* **Métrica:** [Antigüedad de Deuda y Estado de Mora](../metrics/antiguedad_deuda_factura.md)
* **Proceso:** [Gestión de Cobranzas y Recordatorios](../processes/gestion_cobranzas_y_recordatorios.md)
