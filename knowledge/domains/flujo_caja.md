---
id: domain_flujo_caja
type: domain
title: Dominio: Flujo de Caja & Proyecciones Financieras
status: verified
last_updated: 2026-10-07
owner: finanzas@mts.com
tags: [domain, treasury, cash_flow, projections, finance]
---

# Dominio: Flujo de Caja & Proyecciones Financieras

El dominio de **Flujo de Caja** supervisa la liquidez operativa diaria y las proyecciones a corto y mediano plazo de MTS Logística, unificando cobranzas pendientes con erogaciones programadas.

## Alcance
* Registro de movimientos de tesorería (ingresos y egresos clasificados por área y detalle).
* Proyecciones dinámicas de saldo para fechas de corte arbitrarias (*Fin de Mes*, *Próxima Quincena*, *+30 Días*).
* Grilla cronológica ascendente (`ASC`) con cálculo continuo de saldo acumulado.
* Programación de obligaciones fiscales y comerciales futuras (ARCA, ARBA, 931, combustible, proveedores).

## Datasets Vinculados
* [cash_movements](../datasets/cash_movements.md) — Movimientos históricos y del día a día.
* [tax_invoices](../datasets/tax_invoices.md) — Facturas pendientes proyectadas como ingresos futuros.
* [proformas](../datasets/proformas.md) — Proformas en estado `approved` o `sent` computables como cobranza esperada.

## Métricas
* [Antigüedad de Deuda y Estado de Mora](../metrics/antiguedad_deuda_factura.md) — Estimación del momento real de cobro según comportamiento histórico.

## Navegación
* Volver al [Índice General](../index.md)
