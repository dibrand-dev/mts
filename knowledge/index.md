---
id: mts_knowledge_root
type: index
title: MTS Gestión Logística - Base de Conocimiento (OKF)
status: verified
last_updated: 2026-10-07
owner: tech@dibrand.com
tags: [root, index, architecture, operations, billing, payroll]
---

# MTS Gestión Logística - Knowledge Graph

Bienvenido al grafo de conocimiento central de **MTS Gestión Logística**, estructurado bajo el estándar **Open Knowledge Format (OKF)**.
Este directorio actúa como la fuente de verdad estructurada y navegable tanto para desarrolladores como para agentes autónomos de IA y flujos de integración continua.

---

## 🗺️ Mapa de Dominios de Negocio
Los módulos operacionales y comerciales principales del sistema:

* [Operaciones Portuarias Diarias](./domains/operaciones.md) — Registro de partes diarios, dotación, horas y buques.
* [Plazoleta Fiscal & Facturación](./domains/plazoleta_fiscal.md) — Facturación divisible quincenal, proformas y emisión fiscal.
* [Sueldos & Liquidación de Jornales](./domains/sueldos.md) — Liquidación de horas normales, extras, plus delta y escalas CCT.
* [Flujo de Caja & Proyecciones](./domains/flujo_caja.md) — Movimientos de tesorería, conciliaciones y obligaciones fiscales proyectadas.

---

## 🗄️ Datasets y Tablas Principales
Entidades transaccionales y catálogos de base de datos (PostgreSQL 17):

* [daily_work_logs](./datasets/daily_work_logs.md) — Cabecera de partes de trabajo diarios y buques.
* [daily_staff_entries](./datasets/daily_staff_entries.md) — Jornales de colaboradores, horas y conceptos diarios.
* [proformas](./datasets/proformas.md) — Liquidaciones quincenales por cliente y concepto.
* [tax_invoices](./datasets/tax_invoices.md) — Comprobantes fiscales oficiales, almacenamiento PDF y seguimiento.
* [union_bonus_scales](./datasets/union_bonus_scales.md) — Escalas salariales dinámicas por volumen de vehículos operados (CCT).
* [client_position_rates](./datasets/client_position_rates.md) — Tarifario comercial cruzado (Cliente x Puesto x Tipo de Hora).
* [cash_movements](./datasets/cash_movements.md) — Registro de ingresos y egresos de caja operativa.

---

## ⚡ Reglas Críticas de Negocio
Políticas operacionales y lógicas determinísticas del sistema:

* [Bonificación Gremial por Vehículos](./rules/bonificacion_gremial.md) — Lógica de cálculo invisible del plus CCT según buque.
* [Cierre Quincenal y División de Proformas](./rules/cierre_quincenal_proformas.md) — Corte 1-15 y 16-fin de mes en 3 conceptos independientes.
* [Control de Vencimientos y Cobranzas (Brevo)](./rules/control_vencimientos_brevo.md) — Disparadores preventivos, al vencimiento y mora.
* [Retención de Memoria en Carga Diaria](./rules/retencion_memoria_carga_diaria.md) — UX de alta rápida de colaboradores en turnos.

---

## 📊 Métricas e Indicadores
Definiciones de cálculos de negocio y fórmulas:

* [Total de Proforma Quincenal](./metrics/total_proforma.md) — Consolidación de horas, tarifas y conceptos.
* [Horas Equivalentes de Operación](./metrics/horas_equivalentes.md) — Ponderación de horas regulares y horas extras al 50% y 100%.
* [Plus Delta Operativo](./metrics/plus_delta.md) — Adicionales por productividad o turnos complejos.
* [Antigüedad de Deuda y Estado de Mora](./metrics/antiguedad_deuda_factura.md) — Medición de días de crédito y desvíos de cobro.

---

## 🔄 Procesos y Runbooks
Guías paso a paso de los flujos de trabajo del negocio:

* [Carga de Parte Diario](./processes/carga_parte_diario.md) — Flujo operativo del despachante o supervisor de turno.
* [Emisión y Auditoría de Proformas](./processes/emision_y_auditoria_proformas.md) — Revisión quincenal, tokens públicos y pase a facturación.
* [Gestión de Cobranzas y Recordatorios](./processes/gestion_cobranzas_y_recordatorios.md) — Cron diario automático e interfaz de auditoría.
