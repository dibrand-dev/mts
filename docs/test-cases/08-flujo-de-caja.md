# Módulo 08: Flujo de Caja y Control de Tesorería

Este documento contiene los casos de prueba para el módulo de Flujo de Caja (`/cash-flow`). Se diseñaron bajo la Regla 11 para no depender de totales globales acumulados del cliente, operando mediante fechas exclusivas de test (`2026-10-15`) o medición de variaciones (deltas).

---

## Bloque de Ejecución CHROME 07: Movimientos de Tesorería y Saldo Progresivo
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Fecha exclusiva de test:** `2026-10-15` (Día sin movimientos previos de producción o del cliente).

---

### TC-CASH-01: Registro de Ingreso y cálculo de Saldo Progresivo
- **Módulo / Funcionalidad:** Flujo de Caja / Alta de Ingreso
- **Objetivo:** Registrar un ingreso en una fecha exclusiva y verificar la actualización inmediata de los KPIs de tesorería y el saldo operativo.
- **Prioridad:** P1 (Control de Fondos)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-15`
  - Tipo: Ingreso (`income`)
  - Área: `Operaciones`
  - Concepto: `ZZTEST-Cobro Anticipo Flete Portuario`
  - Monto: `$ 100.000,00` (`100000`)
- **Cálculo manual paso a paso:**
  - Total Ingresos previos en fecha de test = $\$ 0,00$.
  - Total Egresos previos en fecha de test = $\$ 0,00$.
  - Ingreso registrado = $\$ 100.000,00$.
  - Saldo Operativo esperado = $\$ 100.000,00 - \$ 0,00 = \$ 100.000,00$.
- **Precondiciones:**
  - Navegar a `http://localhost:3000/cash-flow`.
- **Pasos de Ejecución:**
  1. En `/cash-flow`, hacer clic en "Nuevo Movimiento" (`cash-flow-btn-nuevo-movimiento`).
  2. En el slideover:
     - Fecha (`cash-flow-input-date`): `2026-10-15`.
     - Tipo (`cash-flow-select-type`): `Ingreso`.
     - Área (`cash-flow-select-area`): seleccionar `Operaciones` (o primera opción disponible).
     - Detalle / Concepto (`cash-flow-input-detail`): `ZZTEST-Cobro Anticipo Flete Portuario`.
     - Monto ($) (`cash-flow-input-amount`): `100000`.
  3. Hacer clic en "Guardar Movimiento" (`cash-flow-btn-guardar`).
  4. Filtrar la vista de caja seleccionando el día `15/10/2026`.
- **Resultado Esperado:**
  - La fila del movimiento aparece con monto positivo en verde: `$ 100.000,00`.
  - La tarjeta KPI "Total Ingresos" (`cash-flow-kpi-total-ingresos`) refleja `$ 100.000,00`.
  - La tarjeta KPI "Saldo Operativo" (`cash-flow-kpi-saldo-operativo`) refleja `$ 100.000,00`.
- **Datos que crea:** Registro en tabla `cash_flow_movements`.

---

### TC-CASH-02: Registro de Egreso y actualización de Saldo Neto Progresivo
- **Módulo / Funcionalidad:** Flujo de Caja / Alta de Egreso y Saldo Progresivo
- **Objetivo:** Registrar un egreso en la misma fecha y comprobar la deducción exacta del saldo operativo de la jornada.
- **Prioridad:** P0 (Cálculo Financiero de Caja)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-15`
  - Tipo: Egreso (`expense`)
  - Concepto: `ZZTEST-Pago Combustible Móvil`
  - Monto: `$ 35.000,00` (`35000`)
- **Cálculo manual paso a paso:**
  - Ingresos acumulados fecha = $\$ 100.000,00$.
  - Egreso a imputar = $\$ 35.000,00$.
  - Total Egresos acumulados = $\$ 35.000,00$.
  - **Saldo Progresivo resultante = $\$ 100.000,00 - \$ 35.000,00 = \$ 65.000,00$.**
- **Pasos de Ejecución:**
  1. En `/cash-flow`, hacer clic en "Nuevo Movimiento" (`cash-flow-btn-nuevo-movimiento`).
  2. Fecha: `2026-10-15`.
  3. Tipo: `Egreso`.
  4. Detalle: `ZZTEST-Pago Combustible Móvil`.
  5. Monto: `35000`.
  6. Guardar el movimiento.
- **Resultado Esperado:**
  - El egreso aparece en la tabla con monto negativo en rojo: `- $ 35.000,00`.
  - KPI "Total Egresos" (`cash-flow-kpi-total-egresos`): muestra `$ 35.000,00`.
  - KPI "Saldo Operativo" (`cash-flow-kpi-saldo-operativo`): muestra exactamente `$ 65.000,00`.
- **Datos que crea:** Registro en tabla `cash_flow_movements`.

---

### TC-CASH-03: Tercer movimiento y consolidación de saldo acumulado
- **Módulo / Funcionalidad:** Flujo de Caja / Saldo Progresivo Continuo
- **Objetivo:** Registrar un segundo ingreso y validar el nuevo saldo consolidado.
- **Prioridad:** P1 (Verificación Continua)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-15`
  - Tipo: Ingreso (`income`)
  - Concepto: `ZZTEST-Cobro de Honorarios Extra`
  - Monto: `$ 50.000,00` (`50000`)
- **Cálculo manual paso a paso:**
  - Saldo previo = $\$ 65.000,00$.
  - Nuevo ingreso = $\$ 50.000,00$.
  - Total Ingresos = $\$ 100.000,00 + \$ 50.000,00 = \$ 150.000,00$.
  - Total Egresos = $\$ 35.000,00$.
  - **Nuevo Saldo Operativo = $\$ 150.000,00 - \$ 35.000,00 = \$ 115.000,00$.**
- **Pasos de Ejecución:**
  1. Registrar ingreso de `50000` con fecha `2026-10-15`.
  2. Guardar movimiento.
- **Resultado Esperado:**
  - KPI Ingresos: `$ 150.000,00`.
  - KPI Egresos: `$ 35.000,00`.
  - KPI Saldo Operativo: `$ 115.000,00`.
- **Datos que crea:** Registro en `cash_flow_movements`.
