---
id: domain_operaciones
type: domain
title: Dominio: Operaciones Portuarias Diarias
status: verified
last_updated: 2026-10-07
owner: operaciones@mts.com
tags: [domain, operations, daily_logs, ports]
---

# Dominio: Operaciones Portuarias Diarias

El dominio de **Operaciones** gestiona el día a día de las actividades logísticas y portuarias de MTS: la descarga y carga de buques, estiba, transporte, verificación y asignación de personal a turnos específicos en plazoletas y muelles.

## Alcance
* Registro diario de cabeceras de trabajo por cliente, locación y fecha.
* Conteo de vehículos totales manipulados en la jornada (`total_vehicles_handled`).
* Indicador de día de exportación (`is_export_day`).
* Dotación individual de operarios asignados a cada turno.

## Datasets Vinculados
* [daily_work_logs](../datasets/daily_work_logs.md) — Cabecera de partes operativos.
* [daily_staff_entries](../datasets/daily_staff_entries.md) — Detalle de horas trabajadas por colaborador.
* [union_bonus_scales](../datasets/union_bonus_scales.md) — Escala de bonificación aplicable según volumen operado.

## Reglas de Negocio
* [Retención de Memoria en Carga Diaria](../rules/retencion_memoria_carga_diaria.md) — Permite agilizar la carga sucesiva de dotación sin reingresar datos del turno.
* [Bonificación Gremial por Vehículos](../rules/bonificacion_gremial.md) — Aplica adicionales salariales según el volumen de vehículos.

## Procesos Asociados
* [Carga de Parte Diario](../processes/carga_parte_diario.md) — Protocolo de carga ejecutado por supervisores y despachantes.

## Navegación
* Volver al [Índice General](../index.md)
