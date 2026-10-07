---
id: metric_horas_equivalentes
type: metric
title: Métrica: Horas Equivalentes de Operación
status: verified
last_updated: 2026-10-07
owner: operaciones@mts.com
tags: [metric, operations, payroll, hours, overtime]
---

# Métrica: Horas Equivalentes de Operación

Normaliza la carga horaria total trabajada por un operario o cuadrilla convirtiendo las horas extraordinarias a unidades de hora base estándar para costeo y análisis de productividad.

## Fórmula
$$\text{Horas Equivalentes} = \text{regular\_hours} + (\text{overtime\_50\_hours} \times 1.5) + (\text{overtime\_100\_hours} \times 2.0)$$

## Casos de Uso
1. **Control de Sobrecarga:** Detección de fatiga laboral en operarios con exceso de horas nocturnas o de fin de semana.
2. **Comparativa Interanual de Dotación:** Medición del esfuerzo operativo real sin distorsión por turnos rotativos.
3. **Cálculo de Costo Laboral:** Base para estimar la provisión salarial antes del cierre de liquidación formal.

## Fuentes de Datos
* Detalle de Jornales: [daily_staff_entries](../datasets/daily_staff_entries.md)
* Dominio: [Sueldos & Liquidación de Jornales](../domains/sueldos.md)
