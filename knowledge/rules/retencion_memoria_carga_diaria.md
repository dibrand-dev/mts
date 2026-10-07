---
id: rule_retencion_memoria_carga_diaria
type: business_rule
title: Regla: Retención de Contexto en Carga Diaria de Personal
status: verified
last_updated: 2026-10-07
owner: ux@dibrand.com
tags: [business_rule, ui, operations, daily_entry]
---

# Regla: Retención de Contexto en Carga Diaria de Personal

Optimiza la velocidad y ergonomía de carga de cuadrillas operativas en muelles y plazoletas para supervisores en campo (`/daily-entry`).

## Comportamiento de Interfaz
Al registrar un colaborador dentro de un turno de trabajo:
1. **Datos Preservados en Memoria de Formulario:**
   * Fecha operativa (`work_date`)
   * Cliente seleccionado (`client_id`)
   * Locación o muelle (`location_id`)
   * Rango horario del turno (`shift_start_time` y `shift_end_time`)
   * Puesto por defecto del turno (`position_id`)
   * Unidades de buque (`total_vehicles_handled`) y flag de exportación
2. **Campos Blanqueados Tras Guardado Exitoso:**
   * Selector con autocompletado (Typeahead) del colaborador (`employee_id`).
   * Adicionales individuales (horas extras atípicas, plus delta individual, adelantos).
3. **Cierre de Ciclo:**
   * La retención de memoria de turno persiste activamente hasta que el supervisor presiona explícitamente el botón **"Finalizar Turno"** o cambia de pestaña.

## Beneficio Operativo
Reduce el tiempo de carga de dotaciones de 20 a 50 operarios por buque de más de 15 minutos a menos de 2 minutos.

## Entidades Relacionadas
* Cabecera: [daily_work_logs](../datasets/daily_work_logs.md)
* Detalle de Jornales: [daily_staff_entries](../datasets/daily_staff_entries.md)
* Proceso: [Carga de Parte Diario](../processes/carga_parte_diario.md)
* Dominio: [Operaciones](../domains/operaciones.md)
