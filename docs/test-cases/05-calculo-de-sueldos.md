# Módulo 05: Liquidación de Sueldos y Haberes del Personal

Este documento detalla los casos de prueba para el módulo de Sueldos y Liquidaciones (`/payroll`). Se incluyen los cálculos manuales aritméticos paso a paso en formato `es-AR` para validar importes brutos, retención de anticipos y montos netos a cobrar.

---

## Bloque de Ejecución CHROME 04: Liquidación de Haberes y Reporte de Sueldos
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Precondiciones del Seed:**
  - Empleado 1: `ZZTEST-GOMEZ JUAN` (Legajo: `ZZ-001`, DNI: `20999001`, Puesto: `Operario Portuario`)
  - Empleado 2: `ZZTEST-LOPEZ PEDRO` (Legajo: `ZZ-002`, DNI: `20999002`, Puesto: `Operario Portuario`)
  - Tarifas vigentes aplicadas:
    - Normal (REGULAR): `$ 10.000,00` por hora.
    - Suplementaria 50% (OVERTIME_50): `$ 15.000,00` por hora.
    - Suplementaria 100% (OVERTIME_100): `$ 20.000,00` por hora.
  - Turnos en el período de prueba (`2026-09-01` a `2026-09-15`):
    - `ZZTEST-GOMEZ JUAN`:
      - Turno 01/09/2026: 8 hs reg, 0 hs 50%, 0 hs 100%, anticipo = `$ 5.000,00`.
      - Turno 02/09/2026: 8 hs reg, 2 hs 50%, 0 hs 100%, anticipo = `$ 0,00`.
    - `ZZTEST-LOPEZ PEDRO`:
      - Turno 03/09/2026: 8 hs reg, 0 hs 50%, 4 hs 100%, anticipo = `$ 10.000,00`.

---

### TC-PAY-01: Cálculo exacto de Sueldo Bruto, Anticipos y Sueldo Neto individual
- **Módulo / Funcionalidad:** Liquidación de Sueldos / Cálculo Individual
- **Objetivo:** Verificar que el sistema liquide con precisión matemática las horas normales, horas extras y reste los anticipos para el operario `ZZTEST-GOMEZ JUAN`.
- **Prioridad:** P0 (Cálculo Financiero y Sueldos)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Empleado: `ZZTEST-GOMEZ JUAN`
  - Período: `2026-09-01` a `2026-09-15`
- **Cálculo manual paso a paso (según `payroll.ts`):**
  1. **Turno 1 (01/09/2026):**
     - Horas: 8.00 hs reg.
     - Bruto Turno 1 = $8.00 \times \$ 10.000,00 = \$ 80.000,00$.
     - Anticipo Turno 1 = $\$ 5.000,00$.
     - Neto Turno 1 = $\$ 80.000,00 - \$ 5.000,00 = \$ 75.000,00$.
  2. **Turno 2 (02/09/2026):**
     - Horas: 8.00 hs reg + 2.00 hs 50%.
     - Importe reg = $8.00 \times \$ 10.000,00 = \$ 80.000,00$.
     - Importe 50% = $2.00 \times \$ 15.000,00 = \$ 30.000,00$.
     - Bruto Turno 2 = $\$ 80.000,00 + \$ 30.000,00 = \$ 110.000,00$.
     - Anticipo Turno 2 = $\$ 0,00$.
     - Neto Turno 2 = $\$ 110.000,00$.
  3. **Consolidado Quincenal de ZZTEST-GOMEZ JUAN:**
     - Horas Normales acumuladas = $8.00 + 8.00 = 16.00\text{ hs}$.
     - Horas 50% acumuladas = $2.00\text{ hs}$.
     - **Sueldo Bruto Total = $\$ 80.000,00 + \$ 110.000,00 = \$ 190.000,00$.**
     - **Total Anticipos a Descontar = $\$ 5.000,00$.**
     - **Sueldo Neto a Cobrar = $\$ 190.000,00 - \$ 5.000,00 = \$ 185.000,00$.**
- **Precondiciones:**
  - Sesión activa con `zztest-admin@example.com`.
  - Navegar a `http://localhost:3000/payroll`.
- **Pasos de Ejecución:**
  1. En el selector de rango de fechas de `/payroll`, seleccionar fecha inicial `2026-09-01` y fecha final `2026-09-15`.
  2. En la tabla de liquidación, localizar la fila del operario `ZZTEST-GOMEZ JUAN` (Legajo `ZZ-001`).
  3. Verificar las columnas numéricas de la fila:
     - Columna "Hs. Norm.": debe mostrar `16` o `16.00`.
     - Columna "Hs. 50%": debe mostrar `2` o `2.00`.
     - Columna "Hs. 100%": debe mostrar `0` o `0.00`.
     - Columna "Bruto ($)": debe mostrar exactamente `$ 190.000,00`.
     - Columna "Anticipos ($)": debe mostrar exactamente `$ 5.000,00`.
     - Columna "Neto ($)": debe mostrar exactamente `$ 185.000,00`.
- **Resultado Esperado:**
  - Los números coinciden al centavo con el cálculo manual sin desfasajes ni errores de redondeo.
- **Datos que crea:** Ninguno (cálculo en memoria sobre los registros de `daily_staff_entries`).

---

### TC-PAY-02: Liquidación de horas al 100% y anticipos para segundo empleado
- **Módulo / Funcionalidad:** Liquidación de Sueldos / Cálculo con Horas 100%
- **Objetivo:** Verificar la liquidación de horas extraordinarias al 100% y descuento de anticipo para el operario `ZZTEST-LOPEZ PEDRO`.
- **Prioridad:** P0 (Cálculo Financiero)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Empleado: `ZZTEST-LOPEZ PEDRO` (Legajo `ZZ-002`)
  - Período: `2026-09-01` a `2026-09-15`
- **Cálculo manual paso a paso:**
  - Turno 03/09/2026: 8.00 hs reg + 4.00 hs 100%.
  - Importe reg = $8.00 \times \$ 10.000,00 = \$ 80.000,00$.
  - Importe 100% = $4.00 \times \$ 20.000,00 = \$ 80.000,00$.
  - Sueldo Bruto = $\$ 80.000,00 + \$ 80.000,00 = \$ 160.000,00$.
  - Total Anticipo = $\$ 10.000,00$.
  - **Sueldo Neto = $\$ 160.000,00 - \$ 10.000,00 = \$ 150.000,00$.**
- **Pasos de Ejecución:**
  1. En `/payroll` con período `01/09/2026` a `15/09/2026`, localizar la fila de `ZZTEST-LOPEZ PEDRO`.
  2. Verificar los valores de la fila:
     - Hs. Norm.: `8.00`, Hs. 100%: `4.00`.
     - Bruto: `$ 160.000,00`.
     - Anticipos: `$ 10.000,00`.
     - Neto: `$ 150.000,00`.
- **Resultado Esperado:**
  - Todos los montos se muestran de forma exacta según el desglose aritmético.
- **Datos que crea:** Ninguno.

---

### TC-PAY-03: Filtrado rápido por botones preset de fecha
- **Módulo / Funcionalidad:** Liquidación de Sueldos / Presets de Período
- **Objetivo:** Verificar que los botones "Esta Quincena", "Este Mes" y "Esta Semana" actualicen los selectores de fecha de manera coherente.
- **Prioridad:** P1 (Usabilidad de Liquidación)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Pasos de Ejecución:**
  1. En la parte superior de `/payroll`, hacer clic en el botón preset "Esta Quincena" (`payroll-btn-preset-fortnight`).
  2. Observar los campos de fecha: el inicio debe ser el día 1 o 16 del mes actual y el fin el día 15 o último del mes.
  3. Hacer clic en "Este Mes" (`payroll-btn-preset-month`).
  4. Observar que el rango se expande del primer día al último día del mes en curso.
- **Resultado Esperado:**
  - Los inputs de fecha cambian automáticamente y la tabla recarga los datos correspondientes al intervalo.
- **Datos que crea:** Ninguno.

---

### TC-PAY-04: Exportación de la nómina liquidada a archivo CSV
- **Módulo / Funcionalidad:** Liquidación de Sueldos / Exportación de Datos
- **Objetivo:** Verificar que el botón "Exportar CSV" genere la descarga de un archivo con el formato tabular de liquidación.
- **Prioridad:** P1 (Integración y Reportes)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Período: `2026-09-01` a `2026-09-15`.
- **Pasos de Ejecución:**
  1. En `/payroll`, con los datos del período de prueba en pantalla, hacer clic en "Exportar CSV" (`payroll-btn-export-csv`).
  2. Verificar la descarga en el navegador de un archivo denominado `liquidacion_sueldos_2026-09-01_2026-09-15.csv` (o patrón equivalente).
- **Resultado Esperado:**
  - El archivo se descarga sin errores.
  - El contenido del CSV incluye las cabeceras: `Legajo,Empleado,Puesto,Contrato,Horas_Normales,Horas_50,Horas_100,Sueldo_Bruto,Anticipos,Plus_Viaticos,Sueldo_Neto`.
  - Contiene las filas para `ZZTEST-GOMEZ JUAN` y `ZZTEST-LOPEZ PEDRO` con sus valores brutos y netos respectivos.
- **Datos que crea:** Descarga de archivo local en el cliente.

---

### TC-PAY-05: Modal de detalle y desglose de turnos de un empleado
- **Módulo / Funcionalidad:** Liquidación de Sueldos / Auditoría de Turnos
- **Objetivo:** Verificar que al hacer clic en un operario se despliegue el detalle de cada uno de sus turnos individuales que componen el bruto.
- **Prioridad:** P2 (Auditoría y Transparencia)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Empleado: `ZZTEST-GOMEZ JUAN`
- **Pasos de Ejecución:**
  1. En `/payroll`, hacer clic sobre la fila o nombre de `ZZTEST-GOMEZ JUAN`.
  2. Se abre el panel o modal con el detalle de turnos (`shifts`).
  3. Verificar que se listan los 2 turnos (01/09/2026 y 02/09/2026) con sus horarios, cliente asociado y desglose individual.
- **Resultado Esperado:**
  - La sumatoria de los turnos en el modal coincide exactamente con el total de la fila principal ($190.000,00 bruto).
- **Datos que crea:** Ninguno.
