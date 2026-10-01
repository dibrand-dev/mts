# Módulo 07: ABM de Personal, Clientes y Lugares de Trabajo

Este documento contiene los casos de prueba para los módulos maestros de la aplicación: Gestión de Empleados (`/employees`), Gestión de Clientes (`/clients`) y Lugares de Trabajo (`/locations`), haciendo énfasis en la validación de unicidad de DNI, CUIT, Legajo y Código de lugar.

---

## Bloque de Ejecución CHROME 06: Mantenimiento de Entidades Maestras
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Precondiciones del Seed:**
  - Empleado existente: `ZZTEST-GOMEZ JUAN` (DNI: `20999001`, Legajo: `ZZ-001`)
  - Cliente existente: `ZZTEST-CAT Logística Portuaria` (CUIT: `30712345671`)
  - Lugar existente: `ZZTEST-LUGAR-01 - Muelle Central` (Código: `ZZTEST-LUG-01`)

---

### TC-ABM-EMP-01: Alta exitosa de nuevo empleado
- **Módulo / Funcionalidad:** Empleados / Alta de Personal
- **Objetivo:** Registrar un nuevo operario con todos sus datos identificatorios y laborales obligatorios.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Nombre completo: `ZZTEST-PEREZ CARLOS`
  - DNI: `20999050`
  - Legajo: `ZZ-050`
  - CUIL: `20209990508`
  - Teléfono: `1199990050`
  - Estado: Activo (`active`)
- **Pasos de Ejecución:**
  1. En `/employees`, hacer clic en "Nuevo Operario" (`employees-btn-nuevo-empleado`).
  2. En el slideover:
     - Nombre (`employees-input-fullname`): `ZZTEST-PEREZ CARLOS`.
     - DNI (`employees-input-dni`): `20999050`.
     - Legajo (`employees-input-file-number`): `ZZ-050`.
     - CUIL (`employees-input-tax-id`): `20209990508`.
     - Teléfono (`employees-input-phone`): `1199990050`.
     - Estado (`employees-select-status`): `Activo`.
  3. Hacer clic en "Guardar Empleado" (`employees-btn-guardar`).
- **Resultado Esperado:**
  - El formulario se cierra y la fila de `ZZTEST-PEREZ CARLOS` aparece listada en la tabla con DNI `20999050` y Legajo `ZZ-050`.
- **Datos que crea:** Registro en tabla `employees`.

---

### TC-ABM-EMP-02: Rechazo de alta por DNI duplicado
- **Módulo / Funcionalidad:** Empleados / Validación de Unicidad
- **Objetivo:** Verificar que el sistema impida el alta de dos empleados con el mismo número de DNI.
- **Prioridad:** P0 (Integridad de Datos)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - DNI duplicado: `20999001` (ya perteneciente a `ZZTEST-GOMEZ JUAN`).
  - Nombre a intentar: `ZZTEST-CLON GOMEZ`.
- **Pasos de Ejecución:**
  1. Abrir "Nuevo Operario" (`employees-btn-nuevo-empleado`).
  2. Ingresar Nombre `ZZTEST-CLON GOMEZ`.
  3. Ingresar DNI `20999001`.
  4. Ingresar Legajo único `ZZ-999`.
  5. Hacer clic en "Guardar Empleado" (`employees-btn-guardar`).
- **Resultado Esperado:**
  - El sistema detecta la colisión del índice único en `employees.national_id`.
  - Aparece un cuadro de error rojo en el formulario informando que el DNI ya se encuentra registrado.
  - No se inserta ningún registro duplicado en la base de datos.
- **Datos que crea:** Ninguno.

---

### TC-ABM-CLI-01: Alta de nuevo cliente con plazo comercial y CUIT único
- **Módulo / Funcionalidad:** Clientes / Alta Comercial
- **Objetivo:** Registrar un nuevo cliente corporativo con su condición de pago y correo de facturación.
- **Prioridad:** P1 (Gestión Comercial)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Razón Social: `ZZTEST-Naviera del Plata S.A.`
  - CUIT: `30799990019`
  - Email de Facturación: `zztest-billing@example.com`
  - Teléfono: `1140008888`
  - Plazo de Pago: `30 Días` (`30`)
- **Pasos de Ejecución:**
  1. En `/clients`, hacer clic en "Nuevo Cliente" (`clients-btn-nuevo-cliente`).
  2. En el slideover:
     - Razón Social (`clients-input-company-name`): `ZZTEST-Naviera del Plata S.A.`.
     - CUIT (`clients-input-tax-id`): `30799990019`.
     - Email (`clients-input-billing-email`): `zztest-billing@example.com`.
     - Teléfono (`clients-input-phone`): `1140008888`.
     - Plazo de Pago (`clients-select-payment-due-days`): `30`.
  3. Hacer clic en "Guardar Cliente" (`clients-btn-guardar`).
- **Resultado Esperado:**
  - El cliente queda registrado y se muestra en la tabla con condición de pago a 30 días y estado Activo.
- **Datos que crea:** Registro en tabla `clients`.

---

### TC-ABM-CLI-02: Rechazo de CUIT duplicado
- **Módulo / Funcionalidad:** Clientes / Validación de CUIT
- **Objetivo:** Confirmar que no se permita registrar un cliente con un CUIT que ya existe en la base.
- **Prioridad:** P0 (Integridad Tributaria)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - CUIT duplicado: `30712345671` (perteneciente a `ZZTEST-CAT Logística Portuaria`).
- **Pasos de Ejecución:**
  1. Abrir "Nuevo Cliente" (`clients-btn-nuevo-cliente`).
  2. Escribir Razón Social `ZZTEST-EMPRESA DUPLICADA`.
  3. Escribir CUIT `30712345671`.
  4. Intentar guardar.
- **Resultado Esperado:**
  - Mensaje de error visible en pantalla advirtiendo que el CUIT ya se encuentra asignado a otro cliente.
- **Datos que crea:** Ninguno.

---

### TC-ABM-LOC-01: Alta de nuevo lugar de trabajo y validación de código único
- **Módulo / Funcionalidad:** Lugares de Trabajo / Alta Operativa
- **Objetivo:** Registrar una nueva locación física de operación y validar que su código identificador sea único.
- **Prioridad:** P1 (Configuración de Operaciones)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Código: `ZZTEST-LUG-02`
  - Nombre: `ZZTEST-Terminal Muelle Sur 2`
  - Puerto/Ciudad: `Campana`
  - Estado: `Activo`
- **Pasos de Ejecución:**
  1. En `/locations`, hacer clic en "Nuevo Lugar de Trabajo" (`locations-btn-nuevo-lugar`).
  2. En el slideover:
     - Código (`locations-input-code`): `ZZTEST-LUG-02`.
     - Nombre (`locations-input-name`): `ZZTEST-Terminal Muelle Sur 2`.
     - Puerto/Ciudad (`locations-input-port-city`): `Campana`.
     - Estado (`locations-select-status`): `Activo`.
  3. Hacer clic en "Crear Lugar de Trabajo" (`locations-btn-guardar`).
- **Resultado Esperado:**
  - El lugar se crea satisfactoriamente y aparece en la tabla de locaciones.
- **Datos que crea:** Registro en tabla `locations`.

---

### TC-ABM-LOC-02: Rechazo de código de locación duplicado
- **Módulo / Funcionalidad:** Lugares / Validación de Código Único
- **Objetivo:** Verificar que el formulario rechace códigos de lugar repetidos.
- **Prioridad:** P1 (Validación de Datos)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Código repetido: `ZZTEST-LUG-01` (ya existente en el seed).
- **Pasos de Ejecución:**
  1. Abrir "Nuevo Lugar de Trabajo" (`locations-btn-nuevo-lugar`).
  2. Escribir Código `ZZTEST-LUG-01`.
  3. Escribir Nombre `ZZTEST-Lugar Repetido`.
  4. Ciudad `Zárate`.
  5. Intentar guardar.
- **Resultado Esperado:**
  - Alerta de error visible indicando que el código de locación ya existe.
- **Datos que crea:** Ninguno.
