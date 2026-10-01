# Módulo 04: Facturación, Modelos de Proforma y Cuentas por Cobrar

Este documento contiene los casos de prueba para el módulo de Facturación y Proformas (`/invoicing`). Cada caso incluye cálculos manuales paso a paso con números exactos en formato `es-AR` para verificar la matemática de las 4 estrategias de facturación (`vessel`, `fiscal_yard`, `fixed_deposit`, `shared_expo`).

---

## Bloque de Ejecución CHROME 03: Emisión de Proformas y Transición de Estados
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Precondiciones del Seed:**
  - Clientes de test:
    - `ZZTEST-CAT Logística Portuaria` (ID: `c1000000-0000-0000-0000-000000000001`, Modelo: `vessel`)
    - `ZZTEST-Delta Dock S.A.` (ID: `c1000000-0000-0000-0000-000000000002`, Modelo: `fixed_deposit`)
    - `ZZTEST-Cooptacord Coop.` (ID: `c1000000-0000-0000-0000-000000000003`, Modelo: `shared_expo`)
    - `ZZTEST-Depósito Fiscal Austral` (ID: `c1000000-0000-0000-0000-000000000004`, Modelo: `fiscal_yard`)
  - Tarifas comerciales base cargadas en `commercial_rates` y `service_rates`.
  - Proformas pre-creadas en el seed: `ZZTEST-PRF-CAT-001` (`approved`), `ZZTEST-PRF-DELTA-001` (`invoiced`).

---

### TC-INV-01: Generación y cálculo exacto de Proforma Modelo Buque Ro-Ro (`vessel`)
- **Módulo / Funcionalidad:** Facturación / Estrategia `vessel`
- **Objetivo:** Verificar el cálculo determinístico de la liquidación de buque con desglose de vehículos, personal operativo, horas compensación bonificadas al 3%, encargado a bordo e IVA 21%.
- **Prioridad:** P0 (Facturación Crítica de Alto Monto)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Modelo: `Operativa Buque Automotores (Ro-Ro)` (`vessel`)
  - Buque: `BRASILIA HWY`
  - Período: `2026-09-13` a `2026-09-15`
  - Descuento comercial: `3.0%`
- **Cálculo manual paso a paso (basado en `vessel.strategy.ts`):**
  1. **Tarifas base aplicadas:**
     - Encargado: Regular = `$ 38.452,18`, 50% = `$ 57.678,27`, 100% = `$ 76.904,36`
     - Apuntador: Regular = `$ 31.602,72`, 50% = `$ 47.404,08`, 100% = `$ 63.205,44`
     - Vehículo Hábil = `$ 2.744,17`, Vehículo Inhábil = `$ 5.488,11`, Traslado Remis = `$ 35.594,34`
     - Coeficiente Markup Plus = `0.52` (52%)
  2. **Tab 2: Encargado a Bordo:**
     - Horas: 27.0 hs Reg, 18.5 hs 50%, 17.0 hs 100%.
     - $27.0 \times 38.452,18 = \$ 1.038.208,86$
     - $18.5 \times 57.678,27 = \$ 1.067.048,00$
     - $17.0 \times 76.904,36 = \$ 1.307.374,12$
     - Importe Encargados = $\$ 1.038.208,86 + 1.067.048,00 + 1.307.374,12 = \$ 3.412.630,98$.
     - Plus Base = $\$ 313.745,74$. Incidencia extras = $\$ 45.346,06$.
     - Total Plus Encargado con Markup = $(\$ 313.745,74 + 45.346,06) \times 1.52 = \$ 545.819,54$.
     - Neto Encargado = $\$ 3.412.630,98 + 545.819,54 = \$ 3.958.450,52$.
     - Bonificación 3% = $\$ 3.958.450,52 \times 0.03 = \$ 118.753,52$.
     - Subtotal Encargado Bonificado = $\$ 3.958.450,52 - 118.753,52 = \$ 3.839.697,00$.
  3. **Tab 3: Horas Compensación Trabajo Corrido:**
     - Encargado (8 hs Reg, 37.5 hs 50%, 17 hs 100%) = $\$ 307.617,44 + 2.162.935,13 + 1.307.374,12 = \$ 3.777.926,69$.
     - Apuntador (24 hs Reg, 112.5 hs 50%, 51 hs 100%) = $\$ 758.465,28 + 5.332.959,00 + 3.223.477,44 = \$ 9.314.901,72$.
     - Neto Compensación = $\$ 3.777.926,69 + 9.314.901,72 = \$ 13.092.828,41$.
     - Bonificación 3% = $\$ 13.092.828,41 \times 0.03 = \$ 392.784,85$.
     - Subtotal Compensación Bonificado = $\$ 13.092.828,41 - 392.784,85 = \$ 12.700.043,56$.
  4. **Tab 1: Operativa Rampa y Vehículos:**
     - 2.774 vehículos hábiles $\times 2.744,17 = \$ 7.612.327,58$
     - 1.062 vehículos inhábiles $\times 5.488,11 = \$ 5.828.372,82$
     - Apuntadores Operativa (227 hs Reg, 247.5 hs 50%, 168 hs 100%) = $\$ 7.173.817,44 + 11.732.509,80 + 10.618.513,92 = \$ 29.524.841,16$.
     - Plus Operativa con Markup = $(\$ 3.137.457,40 + 621.772,16) \times 1.52 = \$ 5.714.028,93$.
     - Transporte (30 viajes $\times 35.594,34$) = $\$ 1.067.830,20$.
     - Subtotal Operativa = $\$ 49.747.400,69$.
  5. **Consolidado Final:**
     - Total Neto = $\$ 49.747.400,69 + 12.700.043,56 + 3.839.697,00 = \$ 66.287.141,25$.
     - IVA 21% = $\$ 66.287.141,25 \times 0.21 = \$ 13.920.299,66$.
     - **Total Factura Final = $\$ 66.287.141,25 + 13.920.299,66 = \$ 80.207.440,91$.**
- **Pasos de Ejecución:**
  1. En `/invoicing`, hacer clic en "Nueva Proforma" (`invoicing-btn-nueva-proforma`).
  2. En el slideover:
     - Cliente (`invoicing-select-client`): seleccionar `ZZTEST-CAT Logística Portuaria`.
     - Modelo (`invoicing-select-model`): seleccionar `Operativa Buque Automotores (Ro-Ro)`.
     - Desde (`invoicing-input-from-date`): `2026-09-13`.
     - Hasta (`invoicing-input-to-date`): `2026-09-15`.
     - Descuento (`invoicing-input-discount`): `3`.
  3. Observar la vista previa del total en el slideover (`invoicing-preview-total`).
  4. Hacer clic en "Emitir Proforma" (`invoicing-btn-emitir-proforma`).
- **Resultado Esperado:**
  - El sistema genera la proforma con prefijo de código `ZZTEST-PRF-` y la inserta en estado `draft` o `sent`.
  - El subtotal neto visible es `$ 66.287.141,25` y el total con IVA es `$ 80.207.440,91`.
- **Datos que crea:** Registro en tabla `proformas` con items y desglose payload JSON.

---

### TC-INV-02: Generación y cálculo de Proforma Modelo Abono Fijo (`fixed_deposit`)
- **Módulo / Funcionalidad:** Facturación / Estrategia `fixed_deposit`
- **Objetivo:** Verificar el cálculo del abono quincenal de depósitos combinados ($5.466.694,70) más horas extras y tramos de transporte.
- **Prioridad:** P0 (Cálculo Financiero)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Cliente: `ZZTEST-Delta Dock S.A.`
  - Período: `2026-09-01` a `2026-09-15`
  - Sector: Ambos depósitos (`both`)
- **Cálculo manual paso a paso (basado en `fixed-deposit.strategy.ts`):**
  1. Abono mensual nacional = $\$ 5.466.694,70$; fiscal = $\$ 5.466.694,70$.
  2. Cuota quincenal = $(\$ 5.466.694,70 + \$ 5.466.694,70) / 2 = \$ 5.466.694,70$.
  3. Extras registradas: 0 hs al 50%, 0 hs al 100%. Importe extras = $\$ 0,00$.
  4. Transporte: 10.5 tramos $\times \$ 37.249,77 = \$ 391.122,59$.
  5. Total Neto = $\$ 5.466.694,70 + \$ 391.122,59 = \$ 5.857.817,29$.
  6. IVA 21% = $\$ 5.857.817,29 \times 0.21 = \$ 1.230.141,63$.
  7. **Total Final Factura = $\$ 5.857.817,29 + \$ 1.230.141,63 = \$ 7.087.958,92$.**
- **Pasos de Ejecución:**
  1. En `/invoicing`, hacer clic en "Nueva Proforma" (`invoicing-btn-nueva-proforma`).
  2. Seleccionar Cliente `ZZTEST-Delta Dock S.A.` y Modelo `Abono Fijo Depósitos / Almacenes`.
  3. Ingresar Fechas `01/09/2026` a `15/09/2026`.
  4. Hacer clic en "Emitir Proforma" (`invoicing-btn-emitir-proforma`).
- **Resultado Esperado:**
  - Proforma creada con total neto exacto de `$ 5.857.817,29` y total con IVA de `$ 7.087.958,92`.
- **Datos que crea:** Proforma en `proformas`.

---

### TC-INV-03: Generación y cálculo de Proforma Modelo Coparticipación 10% (`shared_expo`)
- **Módulo / Funcionalidad:** Facturación / Estrategia `shared_expo`
- **Objetivo:** Verificar la liquidación coparticipada donde se imputa el 10% de las horas totales base del servicio.
- **Prioridad:** P0 (Cálculo Coparticipación)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Cliente: `ZZTEST-Cooptacord Coop.`
  - Período: `2026-09-01` a `2026-09-15`
  - Factor de coparticipación: `0.10` (10%)
- **Cálculo manual paso a paso (basado en `shared-expo.strategy.ts`):**
  1. Horas base por defecto si no hay turnos: 176.0 hs normales, 38.0 hs al 50%.
  2. Horas imputadas al 10%:
     - Normales: $176.0 \times 0.10 = 17.6\text{ hs}$.
     - Horas 50%: $38.0 \times 0.10 = 3.8\text{ hs}$.
  3. Tarifas horarias: Normal = $\$ 31.602,72$; 50% = $\$ 47.404,08$.
  4. Importe Normales = $17.6 \times 31.602,72 = \$ 556.207,87$.
  5. Importe 50% = $3.8 \times 47.404,08 = \$ 180.135,50$.
  6. Total Neto = $\$ 556.207,87 + \$ 180.135,50 = \$ 736.343,37$.
  7. IVA 21% = $\$ 736.343,37 \times 0.21 = \$ 154.632,11$.
  8. **Total Final Factura = $\$ 736.343,37 + \$ 154.632,11 = \$ 890.975,48$.**
- **Pasos de Ejecución:**
  1. Abrir "Nueva Proforma" (`invoicing-btn-nueva-proforma`).
  2. Seleccionar `ZZTEST-Cooptacord Coop.` y modelo `Horas Compartidas / Coparticipación Porcentual`.
  3. Ingresar Fechas `01/09/2026` a `15/09/2026`.
  4. Emitir la proforma.
- **Resultado Esperado:**
  - Total neto emitido: `$ 736.343,37`. Total final con IVA: `$ 890.975,48`.
- **Datos que crea:** Proforma en `proformas`.

---

### TC-INV-04: Generación y cálculo de Proforma Plazoleta Fiscal Quincenal (`fiscal_yard`)
- **Módulo / Funcionalidad:** Facturación / Estrategia `fiscal_yard`
- **Objetivo:** Verificar la consolidación de horas de plazoleta bonificadas al 3%, viajes de remis y control EXPO (factor 0.90).
- **Prioridad:** P0 (Cálculo Multiconcepto)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Cliente: `ZZTEST-Depósito Fiscal Austral`
  - Período: `2026-09-01` a `2026-09-15`
  - Descuento: `3%`
- **Cálculo manual paso a paso (basado en `fiscal-yard.strategy.ts`):**
  1. Plazoleta horas: Encargado (80 hs Reg, 18 hs 50%) = $\$ 3.076.174,40 + \$ 1.038.208,86 = \$ 4.114.383,26$.
  2. Apuntador (1.048 hs Reg, 264 hs 50%) = $\$ 33.119.650,56 + \$ 12.514.677,12 = \$ 45.634.327,68$.
  3. Subtotal Personal Plazoleta = $\$ 4.114.383,26 + \$ 45.634.327,68 = \$ 49.748.710,94$.
  4. Bonif. 3% Plazoleta = $\$ 49.748.710,94 \times 0.03 = \$ 1.492.461,33$.
  5. Subtotal Plazoleta Bonificado = $\$ 49.748.710,94 - \$ 1.492.461,33 = \$ 48.256.249,61$.
  6. Transporte (56 viajes $\times \$ 35.594,34$) = $\$ 1.993.283,04$.
  7. Control EXPO: (176 hs Reg $\times 0.90 = 158.4\text{ hs}$) $\times \$ 31.602,72 = \$ 5.005.870,85$; (38 hs 50% $\times 0.90 = 34.2\text{ hs}$) $\times \$ 47.404,08 = \$ 1.621.219,54$.
  8. Subtotal EXPO = $\$ 5.005.870,85 + \$ 1.621.219,54 = \$ 6.627.090,39$.
  9. Total Neto = $\$ 48.256.249,61 + \$ 1.993.283,04 + \$ 6.627.090,39 = \$ 56.876.623,04$.
  10. IVA 21% = $\$ 56.876.623,04 \times 0.21 = \$ 11.944.090,84$.
  11. **Total Factura = $\$ 56.876.623,04 + \$ 11.944.090,84 = \$ 68.820.713,88$.**
- **Pasos de Ejecución:**
  1. Abrir "Nueva Proforma", seleccionar `ZZTEST-Depósito Fiscal Austral`, modelo `Plazoleta Fiscal Quincenal Consolidada`.
  2. Período `01/09/2026` a `15/09/2026`.
  3. Emitir proforma.
- **Resultado Esperado:**
  - Total Neto: `$ 56.876.623,04`. Total con IVA: `$ 68.820.713,88`.
- **Datos que crea:** Proforma en `proformas`.

---

### TC-INV-05: Transición de Proforma a Factura Fiscal
- **Módulo / Funcionalidad:** Facturación / Ciclo de Vida de Proforma
- **Objetivo:** Verificar que una proforma en estado `approved` pueda convertirse a factura asignándole su número oficial emitido por AFIP/ARCA.
- **Prioridad:** P0 (Ciclo de Vida de Facturación)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Proforma del seed: `ZZTEST-PRF-CAT-001` (Cliente: `ZZTEST-CAT Logística Portuaria`, Estado actual: `approved`).
  - Número de Factura: `A-0001-00009999`.
- **Precondiciones:**
  - Proforma `ZZTEST-PRF-CAT-001` existe en estado `approved`.
- **Pasos de Ejecución:**
  1. En `/invoicing`, localizar en la tabla la proforma `ZZTEST-PRF-CAT-001`.
  2. Verificar que su badge de estado es "Aprobada" (`approved`).
  3. En la columna de acciones, hacer clic en el botón "Facturar" (`invoicing-btn-facturar`).
  4. En el modal emergente, ingresar en el campo de texto (`invoicing-input-factura-numero`): `A-0001-00009999`.
  5. Hacer clic en el botón "Confirmar" (`invoicing-btn-confirmar-factura`).
- **Resultado Esperado:**
  - El modal se cierra.
  - El badge de estado de la fila cambia a "Facturada" (`invoiced`).
  - El número de factura `A-0001-00009999` queda visible en la columna correspondiente.
- **Datos que crea:** Actualización de `status = 'invoiced'` y `invoice_number = 'A-0001-00009999'` en `proformas`.

---

### TC-INV-06: Transición de Factura a Cobrada (`paid`)
- **Módulo / Funcionalidad:** Facturación / Cuentas por Cobrar
- **Objetivo:** Verificar que una proforma facturada (`invoiced`) pueda registrarse como cobrada (`paid`).
- **Prioridad:** P1 (Gestión de Cobranzas)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Proforma del seed: `ZZTEST-PRF-DELTA-001` (Estado actual: `invoiced`).
- **Pasos de Ejecución:**
  1. En la tabla de `/invoicing`, ubicar la fila de `ZZTEST-PRF-DELTA-001`.
  2. Hacer clic en el botón "Marcar como Cobrada" (`invoicing-btn-marcar-cobrada`).
- **Resultado Esperado:**
  - El estado se actualiza a "Cobrada" (`paid`).
  - La fila refleja el nuevo estado con badge distintivo (verde).
- **Datos que crea:** Actualización de `status = 'paid'` en `proformas`.

---

### TC-INV-07: Exclusión de turnos no aprobados en la emisión de proforma
- **Módulo / Funcionalidad:** Facturación / Filtro de Aprobación
- **Objetivo:** Confirmar que los turnos con `is_approved = false` no se incorporen en los importes calculados de la proforma.
- **Prioridad:** P0 (Control de Cobro)
- **Ejecutor:** SCRIPT & CHROME
- **Datos de test usados:**
  - Turno de prueba no aprobado: `ZZTEST-LOPEZ PEDRO` en fecha `2026-09-02` para cliente `ZZTEST-CAT Logística Portuaria`.
- **Pasos de Ejecución:**
  1. Verificar que el turno no aprobado existe en la base.
  2. Calcular proforma para el período de septiembre 2026.
  3. Revisar el desglose de turnos auditables (`shift_breakdown`).
- **Resultado Esperado:**
  - El turno de `2026-09-02` con `is_approved = false` no figura en `shift_breakdown` y sus horas no son sumadas.
  - La propiedad `unapproved_shifts_count` del resultado refleja la cantidad de turnos no aprobados omitidos.
- **Datos que crea:** Ninguno.

---

### TC-INV-08: Intento de emisión duplicada para mismo cliente y período
- **Módulo / Funcionalidad:** Facturación / Control de Duplicidad
- **Objetivo:** Evaluar la reacción del sistema cuando se intenta generar una proforma para un cliente y período que ya cuentan con una proforma activa.
- **Prioridad:** P1 (Integridad Operativa)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Período: `2026-09-13` a `2026-09-15` (mismo período de `ZZTEST-PRF-CAT-001`).
- **Pasos de Ejecución:**
  1. Abrir "Nueva Proforma".
  2. Cargar los mismos parámetros que la proforma ya existente.
  3. Intentar emitir la proforma.
- **Resultado Esperado:**
  - El sistema muestra una alerta de advertencia o genera un nuevo borrador independiente sin sobrescribir la proforma aprobada anterior.
- **Datos que crea:** Evaluar si se permite duplicar según lógica actual.

---

### TC-INV-09: Caducidad automática de proformas a los 5 días vs 6 días (Discrepancia D-05)
- **Módulo / Funcionalidad:** Facturación / Cron de Caducidad
- **Objetivo:** Verificar la regla de negocio que establece la caducidad automática de proformas en estado `sent` a los 5 días corridos.
- **Prioridad:** P1 (Discrepancia D-05)
- **Ejecutor:** SCRIPT (`tests/scripts/test-proforma-expiration.ts`)
- **Datos de test usados:**
  - Proforma A: emitida hace 4 días y 23 horas.
  - Proforma B: emitida hace 5 días y 2 horas.
- **Pasos de Ejecución:**
  1. Evaluar si existe la ruta cron `/api/cron/expire-proformas` o función Postgres equivalente.
  2. Confirmar en reporte la Discrepancia **D-05**: la regla de negocio está documentada pero no existe el endpoint cron ni el job de base de datos implementado en el repositorio.
- **Resultado Esperado:**
  - Documentar PASS en la verificación de código que constata la ausencia de dicho cron.
- **Datos que crea:** Ninguno.

---

### TC-INV-10: Eliminación de proforma en estado Borrador (`draft`)
- **Módulo / Funcionalidad:** Facturación / Mantenimiento de Proformas
- **Objetivo:** Verificar que una proforma en estado borrador pueda ser eliminada sin afectar registros de turnos de trabajo.
- **Prioridad:** P2 (Usabilidad)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Proforma creada en estado `draft` con prefijo `ZZTEST-TEMP-DELETE`.
- **Pasos de Ejecución:**
  1. En la fila de la proforma borrador, hacer clic en el botón de eliminar (`invoicing-btn-delete-proforma`).
  2. Confirmar la eliminación en el diálogo del navegador o modal.
- **Resultado Esperado:**
  - La proforma desaparece de la lista.
  - Los turnos de trabajo asociados permanecen intactos en la tabla de Carga Diaria.
- **Datos que crea:** Creación temporal y borrado de proforma.
