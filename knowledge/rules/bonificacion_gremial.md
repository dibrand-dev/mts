---
id: rule_bonificacion_gremial
type: business_rule
title: Regla: Bonificación Gremial por Manipulación de Vehículos (CCT)
status: verified
last_updated: 2026-10-07
owner: rrhh@mts.com
tags: [business_rule, union, payroll, bonus, cct]
---

# Regla: Bonificación Gremial por Manipulación de Vehículos

Establece el mecanismo automático e invisible para computar el adicional salarial que perciben los trabajadores portuarios en función del volumen total de unidades automotrices manipuladas en la jornada de buque.

## Criterios de Aplicación
1. **Condición de Puesto:** Solo aplica si el puesto asignado en el turno (`position_id`) tiene el flag `requires_vehicle_bonus = true` (por ejemplo: *Encargado de Turno*, *Chofer de Muelle*). Puestos como *Apuntador* tienen este flag en `false` y reciben `$ 0`.
2. **Volumen de Buque:** Se toma el valor de `total_vehicles_handled` registrado en la cabecera del parte diario ([daily_work_logs](../datasets/daily_work_logs.md)).
3. **Escala CCT Vigente:** Se busca en [union_bonus_scales](../datasets/union_bonus_scales.md) el registro cuya vigencia sea aplicable a la fecha del parte y donde:
   $$\text{min\_vehicles} \le \text{total\_vehicles\_handled} \le \text{max\_vehicles}$$
4. **Asignación Invisible:** El monto resultante se persiste de forma automática en la columna `bonus_applied_amount` de cada registro aplicable en [daily_staff_entries](../datasets/daily_staff_entries.md). Si no hay escala que coincida o las unidades son 0, se guarda `0.00`.
5. **Sincronización Transaccional:** Si un supervisor modifica posteriormente el número de vehículos en el parte diario, el servicio de backend actualiza en lote el `bonus_applied_amount` de todas las entradas del turno.

## Entidades Relacionadas
* Dataset de Escalas: [union_bonus_scales](../datasets/union_bonus_scales.md)
* Detalle de Jornales: [daily_staff_entries](../datasets/daily_staff_entries.md)
* Cabecera Operativa: [daily_work_logs](../datasets/daily_work_logs.md)
* Dominio: [Sueldos & Liquidación de Jornales](../domains/sueldos.md)
