# Módulo 06: Tarifarios Comerciales, Puestos de Trabajo y Convenio CCT

Este documento describe los casos de prueba para la gestión de Puestos de Trabajo (`/positions`) y Tarifarios Comerciales por Cliente y Puesto (`/rates`), incluyendo el cálculo automático de horas con recargo (1.5x y 2.0x) y la protección de integridad referencial.

---

## Bloque de Ejecución CHROME 05: Tarifas Comerciales y Puestos Operativos
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Precondiciones del Seed:**
  - Cliente: `ZZTEST-CAT Logística Portuaria` (ID: `c1000000-0000-0000-0000-000000000001`)
  - Puesto existente con historial: `Operario Portuario` (ID: `p1000000-0000-0000-0000-000000000001`)
  - Puesto sin plus: `Apuntador Estándar` (ID: `p1000000-0000-0000-0000-000000000002`)

---

### TC-RATE-01: Alta de tarifa comercial con auto-cálculo de horas suplementarias
- **Módulo / Funcionalidad:** Tarifarios / Auto-cálculo 1.5x y 2.0x
- **Objetivo:** Verificar que al registrar una nueva tarifa comercial con la casilla de auto-cálculo activa, el sistema determine automáticamente los valores al 50% (1.5x) y al 100% (2.0x).
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Puesto: `Apuntador Estándar`
  - Fecha de vigencia: `2026-10-01`
  - Valor Hora Normal a ingresar: `$ 20.000,00` (`20000`)
- **Cálculo manual paso a paso:**
  - Hora Normal base = $\$ 20.000,00$.
  - Factor 50% = $1.5$ $\rightarrow$ Valor Hora 50% = $\$ 20.000,00 \times 1.5 = \$ 30.000,00$.
  - Factor 100% = $2.0$ $\rightarrow$ Valor Hora 100% = $\$ 20.000,00 \times 2.0 = \$ 40.000,00$.
- **Precondiciones:**
  - Sesión activa con `zztest-admin@example.com`.
  - Navegar a `http://localhost:3000/rates`.
- **Pasos de Ejecución:**
  1. En `/rates`, hacer clic en el botón "Nueva Tarifa" (`rates-btn-nueva-tarifa`).
  2. En el slideover:
     - Seleccionar Cliente (`rates-select-client`): `ZZTEST-CAT Logística Portuaria`.
     - Seleccionar Puesto (`rates-select-position`): `Apuntador Estándar`.
     - Fecha de Vigencia (`rates-input-effective-from`): `2026-10-01`.
     - Verificar que el checkbox "Calcular automáticamente horas 50% y 100%" (`rates-checkbox-auto-calculate`) está marcado.
     - En "Valor Hora Normal ($)" (`rates-input-regular`), escribir `20000`.
  3. Observar los campos subsecuentes:
     - "Valor Hora 50% ($)" (`rates-input-overtime-50`): debe completarse automáticamente con `30000`.
     - "Valor Hora 100% ($)" (`rates-input-overtime-100`): debe completarse automáticamente con `40000`.
  4. Hacer clic en "Guardar Tarifa" (`rates-btn-guardar`).
- **Resultado Esperado:**
  - Mensaje verde de éxito: `"Nueva tarifa registrada correctamente."`.
  - El panel se cierra y en la tabla de tarifas se visualiza la nueva fila con `$ 20.000,00`, `$ 30.000,00`, `$ 40.000,00`.
- **Datos que crea:** 3 registros en tabla `client_position_rates` (para tipos `REGULAR`, `OVERTIME_50`, `OVERTIME_100`).

---

### TC-RATE-02: Carga manual de tarifas desacoplada del auto-cálculo
- **Módulo / Funcionalidad:** Tarifarios / Personalización de Tarifas
- **Objetivo:** Verificar que al desmarcar la opción de auto-cálculo, el usuario pueda ingresar valores libres para horas 50% y 100% acordados por paritarias específicas.
- **Prioridad:** P1 (Flexibilidad Comercial)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Cliente: `ZZTEST-Delta Dock S.A.`
  - Puesto: `Apuntador Estándar`
  - Fecha vigencia: `2026-10-01`
  - Valores manuales: Normal = `$ 20.000,00`, 50% = `$ 28.500,00`, 100% = `$ 38.000,00`.
- **Pasos de Ejecución:**
  1. Abrir "Nueva Tarifa" (`rates-btn-nueva-tarifa`).
  2. Completar Cliente y Puesto.
  3. Desmarcar la casilla "Calcular automáticamente..." (`rates-checkbox-auto-calculate`).
  4. Escribir Normal `20000`, 50% `28500`, 100% `38000`.
  5. Verificar que al modificar la hora normal no se recalculan ni sobreescriben las horas 50% ni 100%.
  6. Guardar la tarifa.
- **Resultado Esperado:**
  - Los importes persisten exactamente con los valores personalizados ingresados.
- **Datos que crea:** Registros en `client_position_rates`.

---

### TC-RATE-03: Eliminación de grupo tarifario
- **Módulo / Funcionalidad:** Tarifarios / Baja de Tarifas
- **Objetivo:** Verificar que una tarifa registrada pueda ser eliminada mediante su acción de fila en la tabla.
- **Prioridad:** P2 (Mantenimiento)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Tarifa creada en TC-RATE-02.
- **Pasos de Ejecución:**
  1. Localizar la tarifa de `ZZTEST-Delta Dock S.A.` con fecha `2026-10-01`.
  2. Hacer clic en el botón de eliminar (`rates-btn-delete`).
  3. Confirmar la acción en el modal de advertencia.
- **Resultado Esperado:**
  - Notificación de éxito: `"Tarifa eliminada con éxito."`.
  - La fila desaparece de la tabla de tarifas comerciales.
- **Datos que crea:** Eliminación en `client_position_rates`.

---

### TC-POS-01: Alta de nuevo puesto de trabajo con Plus Vehicular CCT
- **Módulo / Funcionalidad:** Puestos y Funciones / Alta con Convenio
- **Objetivo:** Verificar la creación de un nuevo puesto operativo habilitando la aplicación del Plus Vehicular regulado por CCT.
- **Prioridad:** P1 (Configuración CCT)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Nombre del Puesto: `ZZTEST-Conductor Guinche Portuario`
  - Plus Vehicular CCT: Habilitado (`true`)
- **Precondiciones:**
  - Navegar a `http://localhost:3000/positions`.
- **Pasos de Ejecución:**
  1. En `/positions`, hacer clic en el botón "Nuevo Puesto" (`positions-btn-nuevo-puesto`).
  2. En el slideover lateral:
     - Nombre del Puesto (`positions-input-name`): tipear `ZZTEST-Conductor Guinche Portuario`.
     - Marcar el checkbox "Habilitar Plus Vehicular CCT" (`positions-checkbox-vehicle-bonus`).
  3. Hacer clic en "Guardar Puesto" (`positions-btn-guardar`).
- **Resultado Esperado:**
  - El slideover se cierra y el nuevo puesto aparece listado en la cuadrícula/tarjetas.
  - La tarjeta del puesto muestra una insignia o indicador visible confirmando que cuenta con Plus Vehicular activo.
- **Datos que crea:** Registro en tabla `positions` con `name = 'ZZTEST-Conductor Guinche Portuario'` y `applies_vehicle_bonus = true`.

---

### TC-POS-02: Protección de integridad referencial al intentar eliminar puesto con turnos
- **Módulo / Funcionalidad:** Puestos / Integridad Referencial
- **Objetivo:** Verificar que el sistema impida eliminar un puesto que ya tiene turnos de trabajo registrados o tarifas asociadas, evitando registros huérfanos.
- **Prioridad:** P0 (Integridad de la Base de Datos)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Puesto: `Operario Portuario` (ID: `p1000000-0000-0000-0000-000000000001`, cuenta con turnos asociados en `daily_staff_entries`).
- **Pasos de Ejecución:**
  1. En `/positions`, localizar la tarjeta de `Operario Portuario`.
  2. Hacer clic en el botón de eliminar puesto (`positions-btn-delete`).
  3. Confirmar la acción en el diálogo de alerta.
- **Resultado Esperado:**
  - La operación es rechazada.
  - Se despliega un mensaje de error claro en pantalla informando que el puesto no puede ser eliminado porque posee turnos de trabajo o tarifas asignadas.
  - El puesto permanece activo en la base de datos.
- **Datos que crea:** Ninguno.
