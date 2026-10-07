---
id: metric_antiguedad_deuda_factura
type: metric
title: Métrica: Antigüedad de Deuda y Estado de Mora
status: verified
last_updated: 2026-10-07
owner: cobranzas@mts.com
tags: [metric, billing, collections, aging, finance]
---

# Métrica: Antigüedad de Deuda y Estado de Mora

Mide la cantidad de días transcurridos respecto a la fecha legal de vencimiento para facturas en estado `pending`.

## Fórmulas
$$\text{Días para Vencimiento} = (\text{invoice\_date} + \text{client.payment\_due\_days}) - \text{fecha\_actual}$$

$$\text{Días de Mora} = \begin{cases} 
0 & \text{si } \text{Días para Vencimiento} \ge 0 \\
|\text{Días para Vencimiento}| & \text{si } \text{Días para Vencimiento} < 0 
\end{cases}$$

## Segmentación por Estados
* **Al Día / En Término:** $\text{Días para Vencimiento} > 3$.
* **Próximo Vence:** $0 < \text{Días para Vencimiento} \le 3$ (Dispara aviso `upcoming_due`).
* **Vence Hoy:** $\text{Días para Vencimiento} = 0$ (Dispara aviso `due_today`).
* **En Mora:** $\text{Días de Mora} > 0$ (Dispara aviso `overdue` cada `OVERDUE_CADENCE_DAYS` días).

## Fuentes de Datos
* [tax_invoices](../datasets/tax_invoices.md)
* Regla: [Control de Vencimientos y Cobranzas (Brevo)](../rules/control_vencimientos_brevo.md)
* Dominio: [Flujo de Caja & Proyecciones](../domains/flujo_caja.md)
