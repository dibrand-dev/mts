---
id: domain_plazoleta_fiscal
type: domain
title: Dominio: Plazoleta Fiscal & Facturación Quincenal
status: verified
last_updated: 2026-10-07
owner: facturacion@mts.com
tags: [domain, billing, proformas, arca, taxes]
---

# Dominio: Plazoleta Fiscal & Facturación Quincenal

El dominio de **Plazoleta Fiscal** administra el circuito comercial y de cobranzas de MTS Logística frente a sus clientes terminales portuarios y agencias marítimas. Se caracteriza por liquidaciones quincenales subdivididas por conceptos regulatorios.

## Alcance
* Agrupación de partes operativos en periodos quincenales (`YYYY-MM-Q1` y `YYYY-MM-Q2`).
* Generación automática de tres proformas independientes por cliente y quincena.
* Validación y auditoría por parte del rol `accounting_auditor`.
* Emisión y enlace con comprobantes fiscales (`tax_invoices`) y gestión de mora.

## Datasets Vinculados
* [proformas](../datasets/proformas.md) — Borradores y comprobantes quincenales por concepto.
* [tax_invoices](../datasets/tax_invoices.md) — Facturas emitidas con archivo PDF respaldatorio.
* [client_position_rates](../datasets/client_position_rates.md) — Tarifario acordado por cliente, puesto y tipo de hora.

## Reglas de Negocio
* [Cierre Quincenal y División de Proformas](../rules/cierre_quincenal_proformas.md) — Separación en horas, shuttles y apuntadores de exportación.
* [Control de Vencimientos y Cobranzas (Brevo)](../rules/control_vencimientos_brevo.md) — Seguimiento de días de pago acordados y notificaciones por correo.

## Métricas
* [Total de Proforma Quincenal](../metrics/total_proforma.md) — Valuación del periodo.
* [Antigüedad de Deuda y Estado de Mora](../metrics/antiguedad_deuda_factura.md) — Aging de facturación pendiente.

## Procesos Asociados
* [Emisión y Auditoría de Proformas](../processes/emision_y_auditoria_proformas.md) — Workflow desde borrador hasta factura.
* [Gestión de Cobranzas y Recordatorios](../processes/gestion_cobranzas_y_recordatorios.md) — Cron y panel de reclamos.

## Navegación
* Volver al [Índice General](../index.md)
