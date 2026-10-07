---
id: domain_sueldos
type: domain
title: Dominio: Sueldos & Liquidación de Jornales
status: verified
last_updated: 2026-10-07
owner: rrhh@mts.com
tags: [domain, payroll, salaries, hours, union]
---

# Dominio: Sueldos & Liquidación de Jornales

El dominio de **Sueldos** consolida el cálculo de haberes para los trabajadores portuarios, choferes, apuntadores y encargados de turno que prestan servicios para MTS Logística.

## Alcance
* Liquidación de horas normales y horas suplementarias (recargo al 50% y 100%).
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
