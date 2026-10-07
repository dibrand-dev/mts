---
id: process_gestion_cobranzas_y_recordatorios
type: process
title: Proceso: Gestión de Cobranzas y Recordatorios de Vencimiento
status: verified
last_updated: 2026-10-07
owner: cobranzas@mts.com
tags: [process, runbook, billing, collections, brevo, cron]
---

# Proceso: Gestión de Cobranzas y Recordatorios de Vencimiento

Describe el circuito operativo para la cobranza de facturas y el control de las alertas automáticas vía Brevo.

## Ejecución Automática (Cron Job)
1. Diariamente a las 00:00 hs ART, el cron job de Vercel/Supabase invoca `/api/cron/check-due-invoices`.
2. El servicio evalúa todas las facturas en estado `pending` dentro de [tax_invoices](../datasets/tax_invoices.md).
3. Contrasta la fecha de emisión más los días pactados del cliente según [Control de Vencimientos y Cobranzas (Brevo)](../rules/control_vencimientos_brevo.md).
4. Emite los correos correspondientes según el tramo de vencimiento o mora (`upcoming_due`, `due_today`, `overdue`).

## Gestión Manual y Simulación (Panel Web)
1. En **Facturación** (`/invoicing`), el usuario administrador o contable presiona el botón **Control de Vencimientos**.
2. Se abre el panel interactivo `InvoiceRemindersModal`.
3. Es posible ejecutar un **DRY-RUN** simulando cualquier fecha de calendario para visualizar qué facturas recibirían avisos sin enviar correos reales.
4. Tras verificar, el operador puede gatillar un envío manual inmediato si una cobranza prioritaria lo amerita.
5. Los registros de envío se reflejan en tiempo real con sus respectivos badges de estado.
