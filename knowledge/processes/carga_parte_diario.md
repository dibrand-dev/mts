---
id: process_carga_parte_diario
type: process
title: Proceso: Carga de Parte Diario de Operaciones
status: verified
last_updated: 2026-10-07
owner: operaciones@mts.com
tags: [process, runbook, operations, daily_entry, step_by_step]
---

# Proceso: Carga de Parte Diario de Operaciones

Guía de procedimiento para supervisores y despachantes en muelle para el registro de jornales en `/daily-entry`.

## Paso 1: Configurar la Cabecera del Turno
1. Ingresar al módulo **Carga Diaria** (`/daily-entry`).
2. Seleccionar la **Fecha de Operación** (`work_date`), el **Cliente** y la **Locación**.
3. Si la jornada involucró descarga/carga de buque, ingresar el número de **Unidades Operadas** (`total_vehicles_handled`).
4. Si el operativo correspondió a embarque de exportación aduanera, activar el switch **Día de Exportación** (`is_export_day = true`).

## Paso 2: Registrar Colaboradores en la Cuadrilla
1. Definir el horario de inicio y fin del turno.
2. En el campo de colaborador con autocompletado (Typeahead), buscar por Nombre, Apellido, DNI o Legajo.
3. El sistema verificará el puesto asignado por defecto y aplicará la [Bonificación Gremial](../rules/bonificacion_gremial.md) de forma transparente si el puesto lo exige.
4. Si el operario es el encargado, ingresar la cantidad de remises/combis (`shuttles_count`).
5. Presionar **Guardar Colaborador**.

## Paso 3: Aprovechar la Retención de Contexto
* Según la regla de [Retención de Memoria en Carga Diaria](../rules/retencion_memoria_carga_diaria.md), el formulario mantendrá fecha, cliente, locación y horarios intactos.
* Inmediatamente escribir el nombre del siguiente operario y guardar. Repetir hasta completar la dotación.

## Paso 4: Finalizar el Turno
1. Una vez cargado el último operario, presionar **Finalizar Turno**.
2. Los datos quedarán asentados en [daily_work_logs](../datasets/daily_work_logs.md) y [daily_staff_entries](../datasets/daily_staff_entries.md).
3. La grilla inferior reflejará las entradas ordenadas por fecha de forma cronológica ascendente (`ASC`).
