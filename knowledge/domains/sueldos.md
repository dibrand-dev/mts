---
id: domain_sueldos
type: domain
title: Dominio: Sueldos & Liquidación de Jornales
status: verified
last_updated: 2026-10-25
owner: rrhh@mts.com
tags: [domain, payroll, salaries, hours, union, excel]
---

# Dominio: Sueldos & Liquidación de Jornales

El dominio de **Sueldos** consolida el cálculo de haberes para los trabajadores portuarios, choferes, apuntadores y encargados de turno que prestan servicios para MTS Logística.

## Alcance
* Liquidación de horas normales y suplementarias (50% y 100%) basada en los valores de bolsillo del personal (`positions` y `employees`: `hourly_rate_regular`, `hourly_rate_overtime_50`, `hourly_rate_overtime_100`), desacoplados del tarifario comercial a clientes.
* Estimación salarial oficial según planilla `CALCULO DE SUELDOS.xls`:
  * **Antigüedad:** 1% por año de antigüedad acumulado sobre el básico bruto a partir de la fecha de ingreso (`hire_date`).
  * **Presentismo:** 3% sobre el básico bruto.
  * **Régimen laboral:** Jornalizado (base 8 horas diarias) vs Mensualizado (base 192 horas mensuales estándar).
  * **Cómputo Neto Legal:** Deducción del 21% por aportes de ley (`Neto = Bruto * 0.79 - Anticipos`).
* Exportación nativa a planillas Excel 2003 XML (`.xls`) con celdas de moneda sumables (`$ #,##0.00`) y fórmulas `=SUM(...)`:
  * **Exportar Pre-Liquidación:** Grilla consolidada por colaborador con turnos, horas, básicos, pluses y totales netos.
  * **Exportar Liquidación:** Reporte estructurado para estudio contable (reemplaza el formato texto plano anterior).
  * **Exportar Estimación Completa:** Planilla de 24 columnas idéntica a `CALCULO DE SUELDOS.xls`.
* Balance y cómputo de francos compensatorios (`day_off_count`: +1 generado, -1 tomado).
* Asignación de viáticos o gastos de comida (`meal_allowance_count`).
* Registro de adelantos en efectivo (`advance_payment_amount`).
* Cálculo invisible y automático de la bonificación gremial por volumen de vehículos en buque.
* Liquidación de adicionales especiales (`plus_delta_amount`).

## Datasets Vinculados
* [daily_staff_entries](../datasets/daily_staff_entries.md) — Registros individuales de jornales por turno.
* [union_bonus_scales](../datasets/union_bonus_scales.md) — Escalas de bonificación gremial según convenio colectivo.

## Reglas de Negocio
* [Bonificación Gremial por Vehículos](../rules/bonificacion_gremial.md) — Aplicación condicionada a puestos con `requires_vehicle_bonus = true`.

## Métricas
* [Horas Equivalentes de Operación](../metrics/horas_equivalentes.md) — Ponderación de jornada normal y extraordinaria.
* [Plus Delta Operativo](../metrics/plus_delta.md) — Rendimiento y conceptos extraordinarios.

## Navegación
* Volver al [Índice General](../index.md)
