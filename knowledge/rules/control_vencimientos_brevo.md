---
id: rule_control_vencimientos_brevo
type: business_rule
title: Regla: Control de Vencimientos y Cobranzas Automáticas (Brevo)
status: verified
last_updated: 2026-10-07
owner: cobranzas@mts.com
tags: [business_rule, billing, collections, brevo, cron]
---

# Regla: Control de Vencimientos y Cobranzas Automáticas (Brevo)

Define la lógica del motor de alertas preventivas y reclamos de mora para facturas fiscales pendientes de cobro.

## Cron Job y Frecuencia
* **Ejecución:** Diaria a las 00:00 hs hora local de Buenos Aires (03:00 UTC).
* **Endpoint:** `/api/cron/check-due-invoices` (y Edge Function de Supabase).

## Cálculo de la Fecha de Vencimiento
$$\text{Fecha de Vencimiento} = \text{invoice\_date} + \text{client.payment\_due\_days}$$
Donde `payment_due_days` es un valor acordado por contrato con cada cliente (por defecto, 15 días corridos).

## Triggers de Envío de Correo (API Brevo)
1. **Preventivo (-3 Días):** Se envía un recordatorio amistoso informando que la factura está próxima a vencer (`upcoming_due`).
2. **Día de Vencimiento (Día 0):** Se envía una notificación recordando que el plazo de cancelación opera en la fecha (`due_today`).
3. **Mora (+N Días):** Para facturas con días vencidos mayores a 0, se dispara una notificación de reclamo de pago (`overdue`) con datos de la cuenta bancaria. La repetición se ejecuta según la cadencia configurada (`OVERDUE_CADENCE_DAYS`, por defecto cada 3 días).

## Idempotencia y Blindaje
* Para evitar envíos duplicados ante reintentos del cron, cada despacho se registra en la tabla `invoice_reminder_logs` protegida por la clave única:
  $$\text{UNIQUE}(tax\_invoice\_id, reminder\_type, sent\_date)$$
* Las columnas `last_reminder_sent_at`, `last_reminder_type` y `reminders_sent_count` se actualizan transaccionalmente en [tax_invoices](../datasets/tax_invoices.md).

## Entidades Relacionadas
* Facturas Fiscales: [tax_invoices](../datasets/tax_invoices.md)
* Métrica: [Antigüedad de Deuda y Estado de Mora](../metrics/antiguedad_deuda_factura.md)
* Proceso: [Gestión de Cobranzas y Recordatorios](../processes/gestion_cobranzas_y_recordatorios.md)
