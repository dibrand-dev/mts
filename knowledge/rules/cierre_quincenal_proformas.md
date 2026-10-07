---
id: rule_cierre_quincenal_proformas
type: business_rule
title: Regla: Cierre Quincenal y División de Proformas
status: verified
last_updated: 2026-10-07
owner: facturacion@mts.com
tags: [business_rule, billing, proformas, plazoleta_fiscal]
---

# Regla: Cierre Quincenal y División de Proformas

Gobierna el modelo de liquidación periódica para la Plazoleta Fiscal, adaptado a los requisitos aduaneros y comerciales de las agencias marítimas clientes.

## Periodos Quincenales
* **Q1 (Primera Quincena):** Del día 1 al 15 de cada mes calendario (identificador: `YYYY-MM-Q1`).
* **Q2 (Segunda Quincena):** Del día 16 al último día del mes calendario (identificador: `YYYY-MM-Q2`).

## Regla de División en Tres Proformas
Para un mismo cliente y periodo quincenal se generan **tres borradores de proforma independientes** para facilitar la imputación contable diferenciada del cliente:
1. `general_hours`: Agrupa las horas normales y suplementarias trabajadas por el personal operativo general.
2. `shuttles`: Agrupa la cantidad de traslados/remises contratados para la movilidad de las cuadrillas.
3. `export_tallymen`: Agrupa de forma aislada a los apuntadores portuarios asignados a jornadas marcadas como día de exportación (`is_export_day = true`).

## Aprobación Tácita (Caducidad de Observaciones)
* Al ser emitida y enviada una proforma al cliente (`status = 'sent'`), se inicia un plazo de **5 días corridos**.
* Si el cliente no presenta objeciones dentro de esa ventana temporal, el sistema o auditor realiza la transición automática a estado `approved`.
* Una proforma en estado `approved` queda habilitada para que el equipo contable asigne el comprobante fiscal en [tax_invoices](../datasets/tax_invoices.md).

## Entidades Relacionadas
* Dataset de Proformas: [proformas](../datasets/proformas.md)
* Detalle de Jornales: [daily_staff_entries](../datasets/daily_staff_entries.md)
* Dominio: [Plazoleta Fiscal & Facturación](../domains/plazoleta_fiscal.md)
* Proceso: [Emisión y Auditoría de Proformas](../processes/emision_y_auditoria_proformas.md)
