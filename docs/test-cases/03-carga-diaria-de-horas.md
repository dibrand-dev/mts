# Módulo 03: Carga Diaria de Horas y Control Operativo

Este documento contiene los casos de prueba manuales para ejecución por IA en navegador (CHROME) y scripts complementarios (SCRIPT) para el módulo de Carga Diaria de Horas (`/daily-entry`).

---

## Bloque de Ejecución CHROME 02: Registro Operativo y Casos Borde
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Precondiciones del Seed:**
  - Cliente: `ZZTEST-CAT Logística Portuaria` (ID: `c1000000-0000-0000-0000-000000000001`)
  - Lugar: `ZZTEST-LUGAR-01 - Muelle Central` (ID: `l1000000-0000-0000-0000-000000000001`)
  - Empleados: `ZZTEST-GOMEZ JUAN` (DNI: `20999001`), `ZZTEST-LOPEZ PEDRO` (DNI: `20999002`)
  - Puesto: `Operario Portuario` (ID: `p1000000-0000-0000-0000-000000000001`)

---

### TC-DAILY-01: Carga estándar de turno diurno de lunes a viernes (8 horas)
- **Módulo / Funcionalidad:** Carga Diaria / Registro Estándar
- **Objetivo:** Verificar que un turno regular de 8 horas en día de semana calcule exactamente 8 horas normales, 0 horas al 50% y 0 horas al 100%, y persista correctamente.
- **Prioridad:** P0 (Cálculo Crítico de Negocio)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-05` (Lunes)
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Lugar: `ZZTEST-LUGAR-01 - Muelle Central`
  - Empleado: `ZZTEST-GOMEZ JUAN`
  - Puesto: `Operario Portuario`
  - Horario: `08:00` a `16:00`
- **Cálculo manual paso a paso:**
  - Duración total = $16:00 - 08:00 = 8\text{ horas}$.
  - Día de inicio = Lunes (día hábil entre 1 y 5).
  - Regla: Jornada máxima normal = $8\text{ horas}$.
  - Exceso sobre 8 hs = $\max(0, 8 - 8) = 0\text{ horas}$.
  - Horas normales calculadas = `8.00`
  - Horas al 50% calculadas = `0.00`
  - Horas al 100% calculadas = `0.00`
- **Precondiciones:**
  - Sesión iniciada con `zztest-admin@example.com`.
  - Navegar a `http://localhost:3000/daily-entry`.
- **Pasos de Ejecución:**
  1. Hacer clic en el botón "Cargar Horas" (`daily-entry-btn-cargar-horas`). Se despliega el panel lateral.
  2. En "Fecha" (`daily-entry-input-date`), seleccionar o escribir `2026-10-05`.
  3. En el desplegable "Cliente" (`daily-entry-select-client`), elegir `ZZTEST-CAT Logística Portuaria`.
  4. En el desplegable "Lugar de Trabajo" (`daily-entry-select-location`), elegir `ZZTEST-LUGAR-01 - Muelle Central`.
  5. En el desplegable "Operario" (`daily-entry-select-employee`), elegir `ZZTEST-GOMEZ JUAN`.
  6. En el desplegable "Puesto" (`daily-entry-select-position`), elegir `Operario Portuario`.
  7. En "Hora Inicio" (`daily-entry-input-start-time`), escribir `08:00`.
  8. En "Hora Fin" (`daily-entry-input-end-time`), escribir `16:00`.
  9. Observar los campos numéricos de horas calculadas automáticamente:
     - "Horas Normales" (`daily-entry-input-regular-hours`): debe mostrar `8` o `8.00`.
     - "Horas 50%" (`daily-entry-input-overtime-50`): debe mostrar `0` o `0.00`.
     - "Horas 100%" (`daily-entry-input-overtime-100`): debe mostrar `0` o `0.00`.
  10. Hacer clic en el botón "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - El panel lateral se cierra automáticamente.
  - La tabla principal muestra el registro con fecha `05/10/2026`, operario `ZZTEST-GOMEZ JUAN`, cliente `ZZTEST-CAT Logística Portuaria`, y exactamente `8.00` hs normales.
- **Datos que crea:** Registro en `daily_work_logs` y `daily_staff_entries` para el día `2026-10-05`.

---

### TC-DAILY-02: Carga de turno diurno con horas suplementarias al 50%
- **Módulo / Funcionalidad:** Carga Diaria / Horas Extras Día Hábil
- **Objetivo:** Verificar que una jornada de 10 horas en día de semana asigne 8 horas normales y 2 horas al 50%.
- **Prioridad:** P0 (Cálculo de Sueldos y Facturación)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-06` (Martes)
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Lugar: `ZZTEST-LUGAR-01 - Muelle Central`
  - Empleado: `ZZTEST-LOPEZ PEDRO`
  - Horario: `08:00` a `18:00`
- **Cálculo manual paso a paso:**
  - Duración total = $18:00 - 08:00 = 10\text{ horas}$.
  - Día hábil = Martes.
  - Horas normales = $\min(8, 10) = 8.00\text{ horas}$.
  - Horas suplementarias al 50% = $10 - 8 = 2.00\text{ horas}$.
  - Horas al 100% = $0.00\text{ horas}$.
- **Pasos de Ejecución:**
  1. En `/daily-entry`, hacer clic en "Cargar Horas" (`daily-entry-btn-cargar-horas`).
  2. Ingresar Fecha `2026-10-06`, Cliente `ZZTEST-CAT Logística Portuaria`, Operario `ZZTEST-LOPEZ PEDRO`.
  3. Ingresar Hora Inicio `08:00` y Hora Fin `18:00`.
  4. Comprobar que en los campos calculados aparezca:
     - Horas Normales: `8`
     - Horas 50%: `2`
     - Horas 100%: `0`
  5. Hacer clic en "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - El registro se guarda y refleja en tabla `8.00` normales y `2.00` al 50%.
- **Datos que crea:** Registro en `daily_staff_entries` para `2026-10-06`.

---

### TC-DAILY-03: Turno de sábado con corte antes y después de las 13:00 hs
- **Módulo / Funcionalidad:** Carga Diaria / Límite CCT Sábado 13:00
- **Objetivo:** Verificar que en día sábado las horas previas a las 13:00 se computen como normales (hasta 8 hs) y las horas posteriores a las 13:00 se computen al 100%.
- **Prioridad:** P0 (Cálculo Crítico CCT)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-10` (Sábado)
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Empleado: `ZZTEST-GOMEZ JUAN`
  - Horario: `08:00` a `17:00`
- **Cálculo manual paso a paso:**
  - Duración total = $17:00 - 08:00 = 9\text{ horas}$.
  - Inicio: Sábado (`startDayOfWeek === 6`).
  - Límite de corte sábado = `13:00`.
  - Tramo antes de las 13:00: de 08:00 a 13:00 = $5\text{ horas}$.
  - Tramo posterior a las 13:00: de 13:00 a 17:00 = $4\text{ horas}$.
  - Horas normales = $\min(8, 5) = 5.00\text{ horas}$.
  - Horas al 50% = $\max(0, 5 - 8) = 0.00\text{ horas}$.
  - Horas al 100% = $4.00\text{ horas}$.
- **Pasos de Ejecución:**
  1. En `/daily-entry`, hacer clic en "Cargar Horas" (`daily-entry-btn-cargar-horas`).
  2. Ingresar Fecha `2026-10-10` (Sábado).
  3. Seleccionar Cliente `ZZTEST-CAT Logística Portuaria` y Operario `ZZTEST-GOMEZ JUAN`.
  4. Ingresar Hora Inicio `08:00` y Hora Fin `17:00`.
  5. Verificar los valores automáticos en pantalla:
     - Horas Normales (`daily-entry-input-regular-hours`): `5` o `5.00`.
     - Horas 50% (`daily-entry-input-overtime-50`): `0` o `0.00`.
     - Horas 100% (`daily-entry-input-overtime-100`): `4` o `4.00`.
  6. Hacer clic en "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - Guardado con éxito. Fila en tabla muestra `5.00` hs normales y `4.00` hs al 100%.
- **Datos que crea:** Registro en `daily_staff_entries` para `2026-10-10`.

---

### TC-DAILY-04: Turno dominical completo al 100%
- **Módulo / Funcionalidad:** Carga Diaria / Domingo
- **Objetivo:** Verificar que cualquier turno iniciado en domingo se compute íntegramente al 100% de recargo.
- **Prioridad:** P0 (Cálculo CCT)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-11` (Domingo)
  - Empleado: `ZZTEST-LOPEZ PEDRO`
  - Horario: `08:00` a `16:00`
- **Cálculo manual paso a paso:**
  - Duración total = $16:00 - 08:00 = 8\text{ horas}$.
  - Día de inicio = Domingo (`startDayOfWeek === 0`).
  - Regla: Toda hora en domingo = 100%.
  - Horas normales = `0.00`.
  - Horas al 50% = `0.00`.
  - Horas al 100% = `8.00`.
- **Pasos de Ejecución:**
  1. Abrir "Cargar Horas" (`daily-entry-btn-cargar-horas`).
  2. Seleccionar Fecha `2026-10-11`.
  3. Ingresar Horario `08:00` a `16:00`.
  4. Verificar:
     - Horas Normales: `0`
     - Horas 50%: `0`
     - Horas 100%: `8`
  5. Guardar el registro.
- **Resultado Esperado:**
  - La fila del turno muestra `0.00` normales y `8.00` al 100%.
- **Datos que crea:** Registro para `2026-10-11`.

---

### TC-DAILY-05: Caso borde: Turno nocturno con cruce de medianoche (Viernes a Sábado)
- **Módulo / Funcionalidad:** Carga Diaria / Turno Nocturno y Discrepancia D-01
- **Objetivo:** Verificar el comportamiento del cálculo automático cuando el turno inicia a las 22:00 del viernes y finaliza a las 06:00 del sábado.
- **Prioridad:** P0 (Identificación de Discrepancia de Cálculo D-01)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Fecha: `2026-10-09` (Viernes)
  - Horario: `22:00` a `06:00`
- **Cálculo manual esperado teóricamente vs Implementación real:**
  - Duración total = $(24:00 - 22:00) + (06:00 - 00:00) = 2 + 6 = 8\text{ horas}$.
  - **En el código actual (`daily-entries.ts` líneas 138-150 / Discrepancia D-01):**
    - Dado que el día de inicio es Viernes (`startDayOfWeek === 5`), el sistema aplica la rama `Weekday`:
      - `regular_hours` = $\min(8, 8) = 8.00$.
      - `overtime_50_hours` = $0.00$.
      - `overtime_100_hours` = $0.00$.
- **Pasos de Ejecución:**
  1. En `/daily-entry`, abrir panel "Cargar Horas".
  2. Fecha: `2026-10-09` (Viernes).
  3. Hora Inicio: `22:00`.
  4. Hora Fin: `06:00`.
  5. Observar el auto-cálculo: el sistema computa `8` horas normales en lugar de arrojar error negativo por cruce de día.
  6. Finalizar turno y registrar en reporte si el comportamiento coincide con D-01.
- **Resultado Esperado:**
  - El sistema detecta que `06:00 < 22:00`, suma 24 horas a la fecha de fin y arroja `8.00` horas totales.
- **Datos que crea:** Registro para `2026-10-09`.

---

### TC-DAILY-06: Caso borde: Hora inicio idéntica a hora fin (08:00 a 08:00)
- **Módulo / Funcionalidad:** Carga Diaria / Borde 24 horas
- **Objetivo:** Verificar cómo reacciona el cálculo automático cuando se ingresa la misma hora de inicio y de fin.
- **Prioridad:** P1 (Validación de Límites)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-07` (Miércoles)
  - Horario: `08:00` a `08:00`
- **Cálculo manual en código:**
  - Al cumplirse `endDt <= startDt`, la lógica le suma 24 horas exactas a `endDt`.
  - Duración total = $24.00\text{ horas}$.
  - Horas normales = $\min(8, 24) = 8.00\text{ horas}$.
  - Horas al 50% = $24 - 8 = 16.00\text{ horas}$.
  - Horas al 100% = $0.00\text{ horas}$.
- **Pasos de Ejecución:**
  1. Abrir panel "Cargar Horas".
  2. Fecha `2026-10-07`, Hora Inicio `08:00`, Hora Fin `08:00`.
  3. Observar que el campo Horas Normales muestra `8` y Horas 50% muestra `16`.
- **Resultado Esperado:**
  - El sistema no se traba ni calcula números negativos o NaN.
- **Datos que crea:** Ninguno (cancelar panel tras verificación).

---

### TC-DAILY-07: Sobreescritura manual de horas calculadas automáticamente
- **Módulo / Funcionalidad:** Carga Diaria / Flexibilidad Operativa
- **Objetivo:** Verificar que el usuario pueda corregir o ajustar manualmente las horas normales y extras sin que el formulario las restaure de forma imprevista antes de guardar.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-08` (Jueves)
  - Horario: `08:00` a `16:00` (auto-calcula 8 hs normales).
  - Valores manuales a forzar: Horas Normales = `7`, Horas 50% = `1`.
- **Pasos de Ejecución:**
  1. Abrir panel "Cargar Horas".
  2. Ingresar Inicio `08:00` y Fin `16:00`.
  3. Hacer clic en el campo "Horas Normales" (`daily-entry-input-regular-hours`), borrar el valor y tipear `7`.
  4. Hacer clic en el campo "Horas 50%" (`daily-entry-input-overtime-50`), borrar y tipear `1`.
  5. Completar los demás campos obligatorios y pulsar "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - El registro se guarda con los valores sobreescritos manualmente (`7.00` normales y `1.00` al 50%), comprobables en la tabla.
- **Datos que crea:** Registro en `daily_staff_entries` para `2026-10-08`.

---

### TC-DAILY-08: Flujo de carga continua "Guardar y Seguir"
- **Módulo / Funcionalidad:** Carga Diaria / Eficiencia de Carga Masiva
- **Objetivo:** Verificar que al presionar "Guardar y Seguir" el registro se guarde en la base de datos pero el panel lateral permanezca abierto con la fecha y cliente seleccionados para agilizar la carga del siguiente operario.
- **Prioridad:** P1 (Usabilidad y Rendimiento)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fecha: `2026-10-05`
  - Cliente: `ZZTEST-CAT Logística Portuaria`
  - Operario 1: `ZZTEST-GOMEZ JUAN`
  - Operario 2: `ZZTEST-LOPEZ PEDRO`
- **Pasos de Ejecución:**
  1. Abrir panel "Cargar Horas".
  2. Completar los datos para el Operario 1 (`ZZTEST-GOMEZ JUAN`).
  3. Hacer clic en el botón "Guardar y Seguir" (`daily-entry-btn-guardar-seguir`).
  4. Verificar que el panel lateral continúa visible y no se cerró.
  5. Verificar que los datos del encabezado (Fecha, Cliente, Lugar) se mantienen seleccionados.
  6. Cambiar el operario a `ZZTEST-LOPEZ PEDRO` y hacer clic en "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - Ambos registros se persisten exitosamente y se observan en la tabla principal.
- **Datos que crea:** Dos registros de staff entry para la misma jornada de trabajo.

---

### TC-DAILY-09: Aprobación individual de turno desde la tabla
- **Módulo / Funcionalidad:** Carga Diaria / Workflow de Aprobación
- **Objetivo:** Verificar que un administrador pueda alternar el estado de aprobación de un turno mediante el botón de verificación en la tabla.
- **Prioridad:** P0 (Control Previo a Facturación)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Fila del turno no aprobado creado en el seed: `ZZTEST-LOPEZ PEDRO` en fecha `2026-09-02`.
- **Precondiciones:**
  - Registro existe con `is_approved = false`.
- **Pasos de Ejecución:**
  1. En `/daily-entry`, localizar en la tabla la fila del operario `ZZTEST-LOPEZ PEDRO` correspondiente a `2026-09-02`.
  2. Observar el estado de la celda de aprobación (ícono atenuado o sin tilde).
  3. Hacer clic en el botón de alternar aprobación (`daily-entry-btn-toggle-approval`).
- **Resultado Esperado:**
  - El botón cambia de apariencia visual inmediatamente a un tilde verde o badge activo.
  - Al recargar la página (`F5`), el turno permanece en estado aprobado (`is_approved = true`).
- **Datos que crea:** Actualización de `is_approved` a `true` en `daily_staff_entries`.

---

### TC-DAILY-10: Edición de un turno aprobado existente
- **Módulo / Funcionalidad:** Carga Diaria / Modificación de Registros
- **Objetivo:** Verificar que al editar un turno existente, el formulario cargue sus datos previos y permita actualizar conceptos adicionales (ej. viandas o anticipos).
- **Prioridad:** P1 (Mantenimiento de Registros)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Registro de `ZZTEST-GOMEZ JUAN` en `2026-09-01`.
  - Nuevo valor de vianda a ingresar: `$ 5.000,00` (`5000`).
- **Pasos de Ejecución:**
  1. En la fila del registro, hacer clic en el botón de edición (`daily-entry-btn-edit-entry`).
  2. Se abre el panel lateral con los datos del turno cargados.
  3. En el campo "Vianda ($)" (`daily-entry-input-meal`), tipear `5000`.
  4. Hacer clic en "Finalizar Turno" (`daily-entry-btn-finalizar-turno-slideover`).
- **Resultado Esperado:**
  - El panel se cierra y la fila del turno refleja el valor de vianda actualizado a `$ 5.000,00`.
- **Datos que crea:** Actualización del campo `meal_allowance` en `daily_staff_entries`.
