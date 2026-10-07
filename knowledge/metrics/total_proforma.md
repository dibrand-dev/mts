---
id: metric_total_proforma
type: metric
title: Métrica: Total Liquidado por Proforma Quincenal
status: verified
last_updated: 2026-10-07
owner: facturacion@mts.com
tags: [metric, billing, proformas, amounts]
---

# Métrica: Total Liquidado por Proforma Quincenal

Calcula la valuación monetaria total de los servicios prestados a un cliente durante una quincena para un concepto determinado (`general_hours`, `shuttles` o `export_tallymen`).

## Fórmula de Cálculo
Para la proforma de tipo `general_hours`:
$$\text{Total} = \sum_{e \in \text{entries}} \Big( (\text{regular\_hours} \times \text{rate}_{\text{reg}}) + (\text{overtime\_50} \times \text{rate}_{50}) + (\text{overtime\_100} \times \text{rate}_{100}) \Big)$$

Para la proforma de tipo `shuttles`:
$$\text{Total} = \sum (\text{shuttles\_count} \times \text{tarifa\_remis\_cliente})$$

Para la proforma de tipo `export_tallymen`:
$$\text{Total} = \sum_{\text{is\_export\_day} = \text{true}} (\text{horas\_apuntador} \times \text{tarifa\_apuntador})$$

## Fuentes de Datos
* Detalle de turnos: [daily_staff_entries](../datasets/daily_staff_entries.md)
* Tarifario vigente por cliente: [client_position_rates](../datasets/client_position_rates.md)
* Proforma destino: [proformas](../datasets/proformas.md)

## Entidades Relacionadas
* Dominio: [Plazoleta Fiscal & Facturación](../domains/plazoleta_fiscal.md)
* Regla: [Cierre Quincenal y División de Proformas](../rules/cierre_quincenal_proformas.md)
