---
id: process_emision_y_auditoria_proformas
type: process
title: Proceso: Emisión, Auditoría y Aprobación de Proformas
status: verified
last_updated: 2026-10-07
owner: facturacion@mts.com
tags: [process, runbook, billing, proformas, auditing]
---

# Proceso: Emisión, Auditoría y Aprobación de Proformas

Guía para el equipo de Facturación y el rol `accounting_auditor` para procesar el cierre quincenal de Plazoleta Fiscal.

## Paso 1: Generación de Borradores Quincenales
1. Al cumplirse el corte de quincena (día 15 o fin de mes), ingresar a **Facturación** (`/invoicing`).
2. Seleccionar el Cliente y el Periodo Quincenal correspondiente (`YYYY-MM-Q1` o `YYYY-MM-Q2`).
3. El sistema ejecuta el cruce transaccional entre [daily_staff_entries](../datasets/daily_staff_entries.md) y el tarifario comercial de [client_position_rates](../datasets/client_position_rates.md).
4. Se generan las 3 proformas según la regla de [Cierre Quincenal y División de Proformas](../rules/cierre_quincenal_proformas.md):
   * `general_hours`
   * `shuttles`
   * `export_tallymen`

## Paso 2: Auditoría y Envío al Cliente
1. El auditor revisa la cantidad de horas y traslados computados.
2. Cada proforma posee un `public_token` criptográfico que genera un enlace seguro de consulta sin necesidad de credenciales.
3. Se envía la proforma por correo al cliente (`status` cambia a `sent`).

## Paso 3: Aprobación y Facturación ARCA
1. Si el cliente da el visto bueno o transcurren 5 días corridos sin objeciones, la proforma pasa a `approved`.
2. El equipo contable genera el comprobante fiscal definitivo en ARCA y carga el número y el PDF en el panel, creando el registro en [tax_invoices](../datasets/tax_invoices.md).
3. La proforma cambia su estado a `invoiced`.
