---
id: metric_plus_delta
type: metric
title: Métrica: Plus Delta Operativo
status: verified
last_updated: 2026-10-07
owner: rrhh@mts.com
tags: [metric, payroll, operations, bonus, delta]
---

# Métrica: Plus Delta Operativo

Representa un adicional salarial discrecional o por productividad pactado para turnos con complejidades operativas no contempladas en las tarifas estándar (por ejemplo: condiciones climáticas adversas, estiba riesgosa o urgencias portuarias).

## Criterio de Imputación
* Se registra como importe monetario directo en el campo `plus_delta_amount` dentro de [daily_staff_entries](../datasets/daily_staff_entries.md).
* A diferencia del bono gremial por buque ([Bonificación Gremial](../rules/bonificacion_gremial.md)), el plus delta no depende del volumen de vehículos sino de la autorización del supervisor de turno.
* Se liquida íntegramente al trabajador y, según contrato con el cliente, puede o no ser trasladado a la proforma quincenal.

## Fuentes de Datos
* [daily_staff_entries](../datasets/daily_staff_entries.md)
* Dominio: [Sueldos & Liquidación de Jornales](../domains/sueldos.md)
