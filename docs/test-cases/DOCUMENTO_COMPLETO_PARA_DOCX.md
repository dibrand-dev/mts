# MTS GESTIÓN LOGÍSTICA - SUITE DE TESTING COMPLETA Y VERIFICADA CONTRA CÓDIGO

> Documento integral consolidado para exportación a .docx / Google Docs.
> Incluye configuración, supuestos con líneas de código, catálogo de data-testid, discrepancias y los 9 módulos de prueba.

---



<!-- INICIO DE docs/test-cases/SETUP.md -->

# Guía de Configuración del Entorno de Pruebas (SETUP.md)

Este documento detalla los pasos para configurar, levantar y ejecutar la suite de pruebas contra el ambiente Supabase de pre-lanzamiento en modo seguro, sin riesgo de envío de correos reales y aislando los datos de prueba.

---

## 1. Variables de Entorno (`.env.test`)

Crear o configurar el archivo `.env.test` en la raíz del proyecto. Este archivo asegura que la aplicación se conecte al proyecto Supabase correspondiente pero mantenga el servicio de correos **en modo mock absoluto**.

```env
# ========================================================
# MTS Gestión Logística - Configuración Segura de Testing
# ========================================================

# Supabase Remoto (Pre-lanzamiento)
NEXT_PUBLIC_SUPABASE_URL="https://<TU-PROYECTO-SUPABASE>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Módulo de Correo Brevo (Sendinblue)
# OBLIGATORIO: Mantener vacía para activar el modo mock nativo (mocked: true)
BREVO_API_KEY=""
BREVO_SENDER_EMAIL="facturacion@mtslogistica.com"
BREVO_SENDER_NAME="MTS Gestión Logística (Test)"

# Token interno para endpoints protegidos
INTERNAL_API_SECRET="zztest-internal-secret-token-2026"
```

> [!CAUTION]
> **REGLA DE SEGURIDAD N° 1:** `BREVO_API_KEY` **DEBE permanecer vacía**. Con esta variable vacía, [`src/lib/brevo/client.ts`](src/lib/brevo/client.ts#L97) intercepta cualquier intento de envío, emite un aviso por consola y retorna `{ success: true, mocked: true }` sin conectar con los servidores de Brevo.

---

## 2. Cómo Levantar la Aplicación en Local

La suite de pruebas UI (ejecutada por un agente de IA como Claude in Chrome) interactúa con la app en `http://localhost:3000`.

1. Instalar dependencias si no se ha hecho:
   ```bash
   npm install
   ```

2. Iniciar el servidor Next.js usando las variables de `.env.test`:
   ```bash
   npx dotenv -e .env.test -- npm run dev
   # O exportando las variables en la sesión:
   export $(cat .env.test | xargs) && npm run dev
   ```

3. Verificar que la app responda en:
   ```
   http://localhost:3000/login
   ```

---

## 3. Creación de Usuarios de Prueba

Para respetar las políticas de RLS sin enviar correos de confirmación de Supabase Auth, los usuarios de prueba se crean directamente mediante el API de administración con la `SUPABASE_SERVICE_ROLE_KEY`.

### Usuarios Requeridos

| Rol del Sistema | Email | Contraseña Inicial | Propósito |
| :--- | :--- | :--- | :--- |
| `admin` | `zztest-admin@example.com` | `ZZTestPass2026!` | Acceso completo (CRUD y autorizaciones). |
| `accounting_auditor` | `zztest-auditor@example.com` | `ZZTestPass2026!` | Pruebas de solo lectura y auditoría. |

### Script para Crear Usuarios

Se puede ejecutar el script de creación de usuarios de test mediante:

```bash
npx tsx scripts/create-test-users.ts
```

El script utiliza `supabase.auth.admin.createUser` con `email_confirm: true`:
```typescript
await supabaseAdmin.auth.admin.createUser({
  email: 'zztest-admin@example.com',
  password: 'ZZTestPass2026!',
  email_confirm: true,
  user_metadata: {
    full_name: 'ZZTEST Administrador QA',
    role: 'admin',
  },
});
```
Esto dispara el trigger de base de datos `on_auth_user_created` que inserta automáticamente el registro correspondiente en la tabla `public.profiles` con su rol adecuado, sin enviar ningún email de verificación.

---

## 4. Ejecución del Dataset Semilla (`test-seed.ts`)

El seed genera un conjunto completo, determinístico e idempotente de datos bajo el prefijo unificado `ZZTEST-`.

### Contenido Generado por el Seed
- **Puestos de Trabajo:**
  - `ZZTEST-Puesto Apuntador` (sin plus vehicular)
  - `ZZTEST-Puesto Encargado` (con plus vehicular `requires_vehicle_bonus = true`)
- **Lugares de Trabajo:**
  - `ZZTEST-Lugar Terminal Zárate` (`ZZTEST-LOC-TZ`)
  - `ZZTEST-Lugar Muelle Delta Dock` (`ZZTEST-LOC-DD`)
- **Clientes (Cubriendo las 4 Estrategias de Facturación):**
  - `ZZTEST-CAT Logística Automotriz SA` (Estrategia: `vessel`)
  - `ZZTEST-Delta Dock Depósitos SA` (Estrategia: `fixed_deposit`)
  - `ZZTEST-Cooptacord Operativa SA` (Estrategia: `shared_expo`)
  - `ZZTEST-Danchuk Servicios Portuarios SA` (Estrategia: `standard`)
- **Operaciones de Cliente:**
  - `ZZTEST-Buque Brasilia Test` vinculado a CAT.
- **Tarifario Comercial (`client_position_rates`):**
  - Tarifas Normal, 50% y 100% configuradas para cada cliente y puesto.
- **Tarifas de Servicios (`client_service_rates`):**
  - `VEHICLE_NORMAL` ($2.744,17), `VEHICLE_OVERTIME` ($5.488,11), `SHUTTLE` ($35.594,34), `PLUS_MARKUP` (0,52) para CAT.
  - `FIXED_MONTHLY_DEPOSIT_NACIONAL` ($5.466.694,70), `SHUTTLE_TRAMO` ($37.249,77) para Delta Dock.
  - `COPARTICIPATION_FACTOR` (0,10) para Cooptacord.
  - `MEAL` ($6.545,18), `SHUTTLE` ($37.685,28) para Danchuk.
- **Personal Operativo (`employees`):**
  - 4 operarios con DNI, Legajo y CUIL ficticios no colisionantes:
    - `ZZTEST-Operario Juan Pérez` (DNI: `99000001`, Legajo: `ZZ-001`)
    - `ZZTEST-Operario Carlos Gómez` (DNI: `99000002`, Legajo: `ZZ-002`)
    - `ZZTEST-Encargado Mario Rossi` (DNI: `99000003`, Legajo: `ZZ-003`)
    - `ZZTEST-Operario Luis Díaz` (DNI: `99000004`, Legajo: `ZZ-004`)
- **Partes Diarios y Turnos (`daily_work_logs` y `daily_staff_entries`):**
  - Turnos aprobados (`is_approved = true`) y pendientes (`is_approved = false`).
  - Turnos diurnos estándar (8 hs), con horas extras al 50% (10 hs), sábado post-13:00 (100%), y nocturnos.
- **Proformas en Diversos Estados (`proformas`):**
  - `draft`, `sent`, `approved`, `invoiced`, `paid`.
- **Movimientos de Flujo de Caja (`cash_movements`):**
  - Ingresos y egresos con prefijo `ZZTEST-` para verificar el cálculo del saldo progresivo.

### Comando para Ejecutar el Seed
```bash
npx tsx scripts/test-seed.ts
```

> [!NOTE]
> El seed es estrictamente **idempotente**: utiliza UUIDs fijos y cláusulas `upsert` / verificación de existencia por nombre/código, por lo que puede ejecutarse múltiples veces sin duplicar registros.

---

## 5. Ejecución de Scripts de Prueba (`tests/scripts/`)

Los casos categorizados como **SCRIPT** (verificaciones de RLS, transiciones de BD, APIs no autenticadas y cálculos numéricos puros) se ejecutan con:

```bash
# Correr toda la suite de scripts
npm run test:scripts
# O individualmente:
npx tsx tests/scripts/run-all-tests.ts
```

Cada prueba imprime por consola su estado:
```
[PASS] SCRIPT-AUTH-01: Rechazo 401 en /api/mail/send sin credenciales
[PASS] SCRIPT-RLS-01: Auditor no puede insertar en employees
[FAIL] SCRIPT-RLS-02: Auditor no puede leer client_position_rates
       -> Esperado: error o array vacío | Obtenido: 0 filas leídas (discrepancia D-03 documentada)
```

---

## 6. Limpieza Quirúrgica (`test-cleanup.ts`)

Para dejar la base en el estado original sin alterar datos de otros usuarios ni del cliente:

```bash
npx tsx scripts/test-cleanup.ts
```

### Características de Seguridad del Cleanup:
1. **Previsualización Obligatoria:** Cuenta y muestra cuántos registros con prefijo `ZZTEST-` existen en cada tabla antes de hacer cualquier borrado.
2. **Confirmación Interactiva:** Requiere confirmación por consola antes de proceder.
3. **Orden de Claves Foráneas:** Borra en cascada controlada respetando la integridad referencial:
   `tax_invoices` → `proforma_details` → `proformas` → `daily_staff_entries` → `daily_work_logs` → `client_operations` → `client_service_rates` → `client_position_rates` → `cash_movements` → `employees` → `positions` → `locations` → `clients`.
4. **Filtro Estricto:** Toda consulta DELETE incluye `WHERE ... LIKE 'ZZTEST-%'` o IDs que pertenecen a entidades de test. **Prohibido cualquier borrado sin filtro.**

---

## 7. Disparo Manual de APIs y Crons

Dado que los cron jobs no están configurados como endpoints automáticos en `/api/cron/*` (ver [DISCREPANCIAS.md](docs/test-cases/DISCREPANCIAS.md)), se documenta cómo probar los flujos asociados manualmente:

### A) Enviar Notificación de Proforma por API
```bash
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zztest-internal-secret-token-2026" \
  -d '{
    "type": "proforma",
    "clientName": "ZZTEST-CAT Logística Automotriz SA",
    "clientEmail": "zztest-billing@example.com",
    "proformaNumber": "ZZTEST-PROF-001",
    "fortnightPeriod": "2026-09-Q1",
    "conceptType": "general_hours",
    "subtotal": 100000,
    "total": 121000,
    "dueDate": "2026-09-30"
  }'
```
**Respuesta Esperada en modo seguro:**
```json
{
  "success": true,
  "messageId": "<mock-1727741234567@mtslogistica.local>",
  "mocked": true
}
```

### B) Enviar Recordatorio de Cobranza por API
```bash
curl -X POST http://localhost:3000/api/mail/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer zztest-internal-secret-token-2026" \
  -d '{
    "type": "invoice_reminder",
    "clientName": "ZZTEST-CAT Logística Automotriz SA",
    "clientEmail": "zztest-billing@example.com",
    "invoiceNumber": "ZZTEST-FAC-001",
    "proformaNumber": "ZZTEST-PROF-001",
    "invoicedAmount": 121000,
    "dueDate": "2026-09-30",
    "daysRemainingOrOverdue": -3
  }'
```


<!-- FIN DE docs/test-cases/SETUP.md -->

---



<!-- INICIO DE docs/test-cases/SUPUESTOS.md -->

# SUPUESTOS — Reglas de Negocio Verificadas contra el Código

> Cada regla listada fue trazada a un archivo y línea concreta del repositorio.
> Las que están marcadas con ⚠️ difieren de lo esperable o tienen matices importantes.
> Las que están marcadas con ❌ NO están implementadas en el código.

---

## S-01 · Jornada normal L-V = 8 horas

**Regla:** En días de semana (lunes a viernes), las primeras 8 horas son normales (`regular_hours`), y todo exceso es hora extra al 50% (`overtime_50_hours`). No se genera overtime al 100%.

**Código:** [`daily-entries.ts` L138-150](src/lib/services/daily-entries.ts#L138-L150)
```typescript
// Weekday (Monday - Friday)
const regular_hours = Math.min(8, total_hours);
const overtime_50_hours = Math.max(0, total_hours - 8);
const overtime_100_hours = 0;
```

**Estado:** ✅ Implementado exactamente así.

⚠️ **Nota:** El código NO segmenta turnos nocturnos que cruzan a sábado o domingo. Un turno viernes 22:00 → sábado 06:00 clasifica las 8 horas como `regular_hours` porque solo evalúa `startDt.getDay()` (viernes = 5 → weekday). Ver **D-01** en DISCREPANCIAS.

---

## S-02 · Sábado: antes de 13:00 = normal/50%, después de 13:00 = 100%

**Regla:** Los turnos que empiezan un sábado se dividen usando las 13:00 como corte. Las horas antes de 13:00 siguen la regla de 8hs normales + exceso 50%, y todo lo que quede después de las 13:00 es 100%.

**Código:** [`daily-entries.ts` L113-136](src/lib/services/daily-entries.ts#L113-L136)
```typescript
if (startDayOfWeek === 6) {
  const satCutoff = new Date(`${startDateStr}T13:00:00`).getTime();
  // ...
  const regular_hours = Math.min(8, hoursBefore13);
  const overtime_50_hours = Math.max(0, hoursBefore13 - 8);
  const overtime_100_hours = hoursAfter13;
}
```

**Estado:** ✅ Implementado. El corte es a las 13:00 del sábado.

⚠️ **Nota:** Si un turno empieza el sábado a las 20:00 y termina el domingo a las 04:00, todo se trata como "sábado" (las 8 horas como hoursAfter13 → todas 100%). No se segmenta el tramo del domingo por separado. En la práctica esto no afecta porque sábado post-13:00 y domingo son ambos 100%.

---

## S-03 · Domingo = 100% en su totalidad

**Regla:** Todo turno que comienza en domingo se paga al 100%.

**Código:** [`daily-entries.ts` L101-110](src/lib/services/daily-entries.ts#L101-L110)
```typescript
if (isStartSunday) {
  return {
    total_hours,
    regular_hours: 0,
    overtime_50_hours: 0,
    overtime_100_hours: total_hours,
    is_sunday_or_holiday: true,
  };
}
```

**Estado:** ✅ Implementado.

---

## S-04 · Feriado = 100% en su totalidad

**Regla:** Si `isHoliday` es `true`, todo el turno es al 100%.

**Código:** [`daily-entries.ts` L91-99](src/lib/services/daily-entries.ts#L91-L99)
```typescript
if (isHoliday) {
  return {
    total_hours,
    regular_hours: 0,
    overtime_50_hours: 0,
    overtime_100_hours: total_hours,
    is_sunday_or_holiday: true,
  };
}
```

**Estado:** ✅ Implementado.

⚠️ **Nota:** La UI no pasa un parámetro `isHoliday` al calcular horas. No existe un catálogo de feriados en la base de datos ni lógica que marque un día como feriado automáticamente. El parámetro `isHoliday` se pasa como `false` siempre desde la UI (`daily-entry/page.tsx`). Ver **D-02** en DISCREPANCIAS.

---

## S-05 · Turno nocturno: auto-avance de 1 día si endTime ≤ startTime

**Regla:** Si la hora de fin es menor o igual a la hora de inicio y las fechas son iguales, se avanza `endDt` 24 horas.

**Código:** [`daily-entries.ts` L68-71](src/lib/services/daily-entries.ts#L68-L71)
```typescript
if (endDt <= startDt && (!endDateStr || endDateStr === startDateStr)) {
  endDt = new Date(endDt.getTime() + 24 * 60 * 60 * 1000);
}
```

**Estado:** ✅ Implementado. Pero la clasificación de horas no tiene en cuenta que el turno cruzó de día (ver S-01 nota).

---

## S-06 · Solapamiento de turnos permitido

**Regla:** Se puede cargar turnos superpuestos para el mismo operario en el mismo día.

**Código:** [`daily-entries.ts` L292-317](src/lib/services/daily-entries.ts#L292-L317) — `addStaffEntryToWorkLog` no tiene validación de solapamiento. Simplemente inserta.

**Estado:** ✅ Implementado (por omisión de validación).

**Referencia CONTEXT.md:** Regla 4, L76.

---

## S-07 · Retención de memoria "Guardar y Seguir"

**Regla:** Al guardar un turno con "Guardar y Seguir", se retienen fecha, cliente, ubicación, horarios y puesto; solo se limpia el selector de empleado. "Finalizar Turno" resetea todo.

**Código:** [`daily-entry/page.tsx` L372-434](src/app/%28dashboard%29/daily-entry/page.tsx#L372-L434) — `handleSaveAndContinue` retiene `shiftDate`, `selectedClientId`, `selectedLocationId`, `shiftStartTime`, `shiftEndTime`, `selectedPositionId`. Limpia `selectedEmployeeId`, `employeeSearchTerm`.

**Estado:** ✅ Implementado.

**Referencia CONTEXT.md:** Regla 2, L71-72.

---

## S-08 · Remises solo para el encargado del turno

**Regla:** Los remises se ingresan como cantidad y solo son para el encargado del turno.

**Código:** El campo `shuttles_count` en `daily_staff_entries` es un INT que se puede cargar en cualquier entrada. No hay validación de que sea solo para "encargado". La regla es de negocio no enforzada por código.

**Estado:** ⚠️ Regla de negocio según CONTEXT.md (L73-74) pero no hay validación en el código.

---

## S-09 · Unique constraint: un work_log por (work_date, client_id)

**Regla:** Solo puede existir un parte diario por combinación de fecha + cliente.

**Código:** [`initial_schema.sql` L138](supabase/migrations/20260801000000_initial_schema.sql#L138)
```sql
UNIQUE(work_date, client_id)
```
y [`daily-entries.ts` L206-244](src/lib/services/daily-entries.ts#L206-L244) — `getOrCreateDailyWorkLog` hace upsert controlado.

**Estado:** ✅ Implementado.

---

## S-10 · Proforma status enum y transiciones

**Regla:** Los estados posibles son: `draft`, `sent`, `approved`, `invoiced`, `paid`, `overdue`.

**Código:** [`initial_schema.sql` L4](supabase/migrations/20260801000000_initial_schema.sql#L4)
```sql
CREATE TYPE public.proforma_status AS ENUM ('draft', 'sent', 'approved', 'invoiced', 'paid', 'overdue');
```

⚠️ **No hay validación de transiciones en el código.** [`invoicing/index.ts` L226-243](src/lib/services/invoicing/index.ts#L226-L243) — `updateProformaStatusService` acepta cualquier status sin verificar el estado actual. Se puede pasar de `draft` a `paid` directamente. Ver **D-03** en DISCREPANCIAS.

**Estado:** ✅ Enum implementado. ❌ Validación de transiciones NO implementada.

---

## S-11 · Caducidad de proforma: sent → approved a los 5 días

**Regla:** Una proforma `sent` pasa automáticamente a `approved` tras 5 días corridos sin objeciones.

**Código:** ❌ No existe ningún cron job, edge function, ni lógica automática que haga esta transición. No hay carpeta `/api/cron/`, no hay funciones en `supabase/functions/`, no hay configuración de cron en Vercel.

**Referencia CONTEXT.md:** Regla 6, L82-83.

**Estado:** ❌ NO implementado. Ver **D-04** en DISCREPANCIAS.

---

## S-12 · Control de cobranzas (cron 00:00): alertas a -3, 0, y post-vencimiento

**Regla:** Un cron job a las 00:00 evalúa `payment_due_days` vs fecha de emisión y envía alertas por Brevo.

**Código:** ❌ No existe la ruta `/api/cron/` ni ninguna implementación de este cron.

**Referencia CONTEXT.md:** Regla 7, L84-85.

**Estado:** ❌ NO implementado. Ver **D-05** en DISCREPANCIAS.

---

## S-13 · Creación automática de factura cambia proforma a 'invoiced'

**Regla:** Al emitir una factura fiscal (`tax_invoices` INSERT), la proforma padre pasa a estado `invoiced`.

**Código:** [`invoicing/index.ts` L272-276](src/lib/services/invoicing/index.ts#L272-L276)
```typescript
// Auto-update parent proforma to 'invoiced'
await supabase
  .from('proformas')
  .update({ status: 'invoiced' })
  .eq('id', invoice.proforma_id);
```

**Estado:** ✅ Implementado.

---

## S-14 · Brevo mock mode: sin API key → `mocked: true`

**Regla:** Si `BREVO_API_KEY` no está configurada, el envío de mail retorna `{ success: true, mocked: true }` sin llamar a la API real.

**Código:** [`brevo/client.ts` L97-112](src/lib/brevo/client.ts#L97-L112)
```typescript
if (!apiKey) {
  // ...
  return {
    success: true,
    messageId: `<mock-${Date.now()}@mtslogistica.local>`,
    mocked: true,
  };
}
```

**Estado:** ✅ Implementado.

---

## S-15 · API /api/mail/send requiere autenticación

**Regla:** El endpoint requiere sesión de usuario O un bearer token `INTERNAL_API_SECRET`.

**Código:** [`api/mail/send/route.ts` L11-29](src/app/api/mail/send/route.ts#L11-L29) — Verifica `supabase.auth.getUser()`, y si falla, verifica `Authorization: Bearer ${INTERNAL_API_SECRET}`. Sin ninguno, devuelve 401.

**Estado:** ✅ Implementado.

---

## S-16 · RLS: admin tiene acceso total, accounting_auditor solo lectura

**Regla:** El rol `admin` tiene `FOR ALL` en todas las tablas. El rol `accounting_auditor` tiene `FOR SELECT` en: `daily_work_logs`, `daily_staff_entries`, `employees`, `proformas`, `proforma_details`, `tax_invoices`, `clients`, `client_operations`, `cash_movements`.

**Código:** Verificado en migraciones:
- [`initial_schema.sql` L216-276](supabase/migrations/20260801000000_initial_schema.sql#L216-L276)
- `20260804010000_fix_employees_rls.sql` — Auditor read employees
- `20260804020000_add_locations_rls.sql` — Auditor read locations
- `20260804030000_add_rates_rls.sql` — Auditor read rates
- `20260804040000_add_clients_rls.sql` — Auditor read clients
- `20260804060000_add_invoicing_rls.sql` — Auditor read proformas, details, invoices
- `20260804080000_add_daily_work_logs_rls.sql` — Auditor read work_logs + entries
- `20260903000000_add_cash_movements.sql` — Auditor read cash_movements
- `20260923010000_add_client_operations.sql` — Auditor read client_operations

**Estado:** ✅ Implementado.

⚠️ **Tablas SIN policy de lectura para auditor:** `positions`, `hour_types`, `client_position_rates`, `union_bonus_scales`, `company_settings`, `master_variables`, `expense_categories`, `expenses`, `client_service_rates`. El auditor NO puede leer tarifas, puestos, escalas de bonificación ni gastos. Esto podría impedir que el auditor use correctamente las pantallas de Payroll (que internamente consulta `client_position_rates` y `positions`). Ver **D-06**.

⚠️ **Proformas para anon:** Existe una policy `"Public read proforma via token"` que permite `FOR SELECT TO anon USING (true)`, es decir, **cualquier usuario no autenticado puede leer TODAS las proformas**. Ver **D-07**.

---

## S-17 · Vessel strategy (CAT): 3 pestañas — Operativa, Encargado a Bordo, Hs Compensación

**Regla:** La proforma tipo `vessel` tiene 3 secciones de cálculo:
1. **Tab 1 — Operativa:** Vehículos (hábil/inhábil), horas apuntador, plus con markup 0.52, remises.
2. **Tab 2 — Encargado a Bordo:** Horas encargado + plus con markup + descuento 3%.
3. **Tab 3 — Compensación:** Horas corridas acordadas con CAT + descuento 3%.

**Código:** [`vessel.strategy.ts` L5-287](src/lib/services/invoicing/strategies/vessel.strategy.ts#L5-L287)

**Estado:** ✅ Implementado.

⚠️ **Nota importante:** Las horas de compensación (Tab 3) están **hardcodeadas** en el código (L81-90: `t3_enc_reg_hs = 8.0`, `t3_ap_reg_hs = 24.0`, etc.), NO se calculan desde turnos aprobados. Son valores fijos por acuerdo con CAT. Esto es un supuesto de negocio intencional.

⚠️ **Fallback a valores demo:** Si no hay turnos aprobados, las estrategias usan valores hardcodeados como fallback (ej: `enc_reg_hs || 27.0` en L60). Esto significa que una proforma generada sin turnos tendrá montos de demostración, no cero.

---

## S-18 · Fiscal yard strategy: horas plazoleta + transporte + control EXPO

**Regla:** Liquidación quincenal con 3% bonificación en horas, shuttle por viajes, y EXPO con factor 0.90.

**Código:** [`fiscal-yard.strategy.ts` L5-226](src/lib/services/invoicing/strategies/fiscal-yard.strategy.ts#L5-L226)

**Estado:** ✅ Implementado. Factor EXPO hardcodeado a 0.90 (L90).

---

## S-19 · Fixed deposit strategy (Delta Dock): abono mensual fijo + extras + transporte

**Regla:** Tarifa mensual fija dividida por quincena + horas extras 50%/100% + transporte por tramos.

**Código:** [`fixed-deposit.strategy.ts` L5-188](src/lib/services/invoicing/strategies/fixed-deposit.strategy.ts#L5-L188)

**Estado:** ✅ Implementado.

---

## S-20 · Shared expo strategy (Cooptacord): coparticipación al 10%

**Regla:** El cliente paga un porcentaje (default 10%) de las horas totales del servicio.

**Código:** [`shared-expo.strategy.ts` L17](src/lib/services/invoicing/strategies/shared-expo.strategy.ts#L17)
```typescript
const factor = inputFactor !== undefined ? inputFactor : configuredFactor ?? 0.10;
```

**Estado:** ✅ Implementado. Factor configurable por `client_service_rates.COPARTICIPATION_FACTOR`.

---

## S-21 · IVA al 21% en todas las proformas

**Regla:** Todas las estrategias aplican IVA del 21%.

**Código:** Verificado en las 5 estrategias:
- `vessel.strategy.ts` L77, L100, L137
- `fiscal-yard.strategy.ts` L106
- `fixed-deposit.strategy.ts` L74
- `shared-expo.strategy.ts` L66
- `standard.strategy.ts` L67

**Estado:** ✅ Implementado. `tax_rate = 0.21` en todos los casos.

---

## S-22 · Descuento 3% por defecto (vessel y fiscal_yard)

**Regla:** El descuento por defecto es 3% sobre la factura, aplicable solo en vessel (tabs 2 y 3) y fiscal_yard (plazoleta).

**Código:**
- `vessel.strategy.ts` L31: `const discountPct = inputDiscount !== undefined ? inputDiscount : 3.0;`
- `fiscal-yard.strategy.ts` L19: `const discountPct = inputDiscount !== undefined ? inputDiscount : 3.0;`
- `fixed-deposit.strategy.ts`: Sin descuento (L175: `discount_percentage: 0`)
- `shared-expo.strategy.ts`: Sin descuento (L164: `discount_percentage: 0`)
- `standard.strategy.ts` L26: `const discountPct = inputDiscount ?? 0;` (default 0)

**Estado:** ✅ Implementado.

---

## S-23 · Payroll: bruto = Σ(horas × tarifa) + plus + bonus; neto = bruto - anticipos

**Regla:** El cálculo de sueldos por empleado es:
```
shiftGross = regHours * regRate + ot50Hours * ot50Rate + ot100Hours * ot100Rate + plusDelta + bonusApplied
shiftNet = shiftGross - advance
netAmount = max(0, grossAmount - advancesAmount)
```

**Código:** [`payroll.ts` L182-189, L235](src/lib/services/payroll.ts#L182-L235)

**Estado:** ✅ Implementado.

---

## S-24 · Payroll: tipo de contrato inferido del nombre del puesto

**Regla:**
- Puesto contiene "chofer" o "guinchero" → `Quincenal`
- Puesto contiene "administrativo" o "jefe" → `Mensual`
- Resto → `Jornal`

**Código:** [`payroll.ts` L239-244](src/lib/services/payroll.ts#L239-L244)

**Estado:** ✅ Implementado, pero es una heurística. No existe campo `contract_type` en la tabla `employees`.

---

## S-25 · Payroll: fallback de tarifas si no hay rates configurados

**Regla:** Si no hay tarifas configuradas para un cliente+puesto, se usan fallbacks:
- REGULAR: 10000, OVERTIME_50: 15000, OVERTIME_100: 20000

**Código:** [`payroll.ts` L164-169](src/lib/services/payroll.ts#L164-L169)

**Estado:** ✅ Implementado. Son valores hardcodeados de fallback.

---

## S-26 · Posición: eliminación protegida si tiene turnos históricos

**Regla:** No se puede eliminar un puesto que tenga registros en `daily_staff_entries`.

**Código:** [`positions.ts` L239-257](src/lib/services/positions.ts#L239-L257)
```typescript
if (shiftEntries && shiftEntries.length > 0) {
  throw new Error('No se puede eliminar este puesto porque cuenta con turnos...');
}
```

**Estado:** ✅ Implementado.

---

## S-27 · Posición: nombre único (UNIQUE constraint + manejo de error 23505)

**Regla:** No pueden existir dos puestos con el mismo nombre.

**Código:**
- [`initial_schema.sql` L82](supabase/migrations/20260801000000_initial_schema.sql#L82): `name TEXT NOT NULL UNIQUE`
- [`positions.ts` L193-194](src/lib/services/positions.ts#L193-L194): Manejo de error 23505

**Estado:** ✅ Implementado.

---

## S-28 · Employees: DNI único, Legajo único, CUIL único

**Regla:** `national_id` (DNI), `file_number` (Legajo) y `tax_id` (CUIL) son UNIQUE en la tabla.

**Código:** [`initial_schema.sql` L117-121](supabase/migrations/20260801000000_initial_schema.sql#L117-L121)
```sql
national_id VARCHAR(20) UNIQUE NOT NULL,
file_number VARCHAR(20) UNIQUE,
tax_id VARCHAR(13) UNIQUE,
```

**Estado:** ✅ Implementado en BD. Legajo y CUIL son opcionales (nullable).

---

## S-29 · Clients: CUIT único

**Regla:** `tax_id` (CUIT) es UNIQUE en la tabla clients.

**Código:** [`initial_schema.sql` L56](supabase/migrations/20260801000000_initial_schema.sql#L56): `tax_id VARCHAR(13) UNIQUE NOT NULL`

**Estado:** ✅ Implementado.

---

## S-30 · Locations: código único

**Regla:** `code` es UNIQUE en la tabla locations.

**Código:** [`initial_schema.sql` L45](supabase/migrations/20260801000000_initial_schema.sql#L45): `code VARCHAR(20) UNIQUE NOT NULL`

**Estado:** ✅ Implementado.

---

## S-31 · Cash flow: filtro de fecha exacta (sin end date)

**Regla:** Si el usuario pone una sola fecha sin fecha de fin, se filtran exactamente los movimientos de esa fecha.

**Referencia CONTEXT.md:** L180-181.

**Código:** La lógica de filtro está en el componente `cash-flow/page.tsx` (client-side).

**Estado:** ✅ Implementado según changelog.

---

## S-32 · Change password: SIMULADO, no real

**Regla:** La pantalla de cambio de contraseña NO llama a Supabase Auth. Usa `setTimeout` para simular el guardado.

**Código:** [`change-password/page.tsx` L73-79](src/app/%28dashboard%29/change-password/page.tsx#L73-L79) — Confirmado con `setTimeout`.

**Estado:** ⚠️ Funcionalidad simulada. Ver **D-08** en DISCREPANCIAS.

---

## S-33 · Reports y Settings: datos estáticos hardcodeados

**Regla:** Las pantallas `/reports` y `/settings` usan datos mock estáticos, no consultan la base de datos.

**Código:**
- [`reports/page.tsx` L28-69](src/app/%28dashboard%29/reports/page.tsx#L28-L69): `INITIAL_REPORTS` hardcoded.
- [`settings/page.tsx` L28-61](src/app/%28dashboard%29/settings/page.tsx#L28-L61): `INITIAL_VARIABLES` hardcoded, save es `setTimeout`.

**Estado:** ⚠️ Funcionalidades simuladas. Existen tablas `company_settings` y `master_variables` en BD pero no se usan.

---

## S-34 · Dashboard: datos estáticos en KPIs y acordeones

**Regla:** El dashboard principal usa datos de prueba estáticos para los KPIs (Saldo Banco, Total Facturado, etc.) y los acordeones (Proformas a Enviar, Facturas a Cobrar).

**Código:** [`page.tsx` (dashboard)](src/app/%28dashboard%29/page.tsx) — Datos hardcoded.

**Estado:** ⚠️ Funcionalidad de demostración.

---

## S-35 · Mapeo cliente → estrategia de proforma

**Regla:** El sistema sugiere automáticamente la estrategia de proforma según el nombre del cliente:
- "delta dock" → `fixed_deposit`
- "cooptacord" → `shared_expo`
- "danchuk" → `standard`
- "cat" → `vessel`
- Cualquier otro → `vessel` (default)

**Código:** [`registry.ts` L38-55](src/lib/services/invoicing/registry.ts#L38-L55)

**Estado:** ✅ Implementado.

⚠️ **Nota:** La comparación es `name.includes('cat')` que matchearía con cualquier cliente cuyo nombre contenga "cat" (ej: "Catering Express"). Es un substring match, no exact match.

---

## S-36 · Encargado rates hardcoded como fallback

**Regla:** Si no hay tarifas configuradas para encargado, se usan:
- REGULAR: 22362.87, OVERTIME_50: 29082.92, OVERTIME_100: 37743.22

Para apuntador:
- REGULAR: 16254.43, OVERTIME_50: 22919.57, OVERTIME_100: 29749.58

**Código:** [`helpers.ts` L54-55](src/lib/services/invoicing/helpers.ts#L54-L55)

**Estado:** ✅ Implementado como defaults.

---

## S-37 · Proforma number es UNIQUE

**Regla:** `proforma_number` tiene constraint `UNIQUE NOT NULL` en la tabla proformas.

**Código:** [`initial_schema.sql` L163](supabase/migrations/20260801000000_initial_schema.sql#L163)

**Estado:** ✅ Implementado. Pero no hay validación en el servicio antes de insertar — la BD rechazaría un duplicado con error 23505.

---

## S-38 · Tax invoice es 1:1 con proforma (UNIQUE proforma_id)

**Regla:** Solo puede existir una factura fiscal por proforma.

**Código:** [`initial_schema.sql` L188](supabase/migrations/20260801000000_initial_schema.sql#L188): `proforma_id UUID NOT NULL UNIQUE`

**Estado:** ✅ Implementado en BD.

---

## S-39 · Auth: usuario no autenticado → redirect a /login

**Regla:** Cualquier ruta que no sea `/login` redirige a `/login` si no hay sesión.

**Código:** [`middleware.ts`](src/lib/supabase/middleware.ts#L40-L44)

**Estado:** ✅ Implementado.

---

## S-40 · Roles del sistema: solo 2

**Regla:** Solo existen `admin` y `accounting_auditor`.

**Código:** [`initial_schema.sql` L2](supabase/migrations/20260801000000_initial_schema.sql#L2): `CREATE TYPE public.app_role AS ENUM ('admin', 'accounting_auditor');`

**Estado:** ✅ Implementado.

⚠️ **No hay UI de gestión de usuarios.** No existe pantalla para crear, editar o cambiar roles de usuarios. Los usuarios se crean por Supabase Auth directamente y el perfil se auto-crea via trigger `handle_new_user`.


<!-- FIN DE docs/test-cases/SUPUESTOS.md -->

---



<!-- INICIO DE docs/test-cases/DISCREPANCIAS.md -->

# DISCREPANCIAS — Análisis Técnico y Diferencias con el Código Real

Este documento consolida todas las discrepancias entre la suite de pruebas anterior, la documentación teórica (`CONTEXT.md`), y la implementación real del código fuente en el repositorio.

---

## 1. Contradicciones con la Suite Anterior

| Aspecto | Suite Anterior (Obsoleta) | Código Real / Implementación Actual | Impacto / Corrección |
| :--- | :--- | :--- | :--- |
| **Selectores de UI** | Usaba selectores adivinados o ambiguos con "o" (ej: `button:has-text("Guardar") o button:has-text("Confirmar")`). | Se deben usar exclusivamente los textos exactos visibles o atributos unificados `data-testid` (`modulo-elemento-accion`). | Pruebas no fallan por ambigüedad de selectores. |
| **Aserciones de Estado** | Afirmaba sobre variables internas de React (`useState`, TanStack Table internal state, cache de TanStack Query). | Los agentes de IA en browser (Claude in Chrome) solo pueden observar texto, inputs, atributos del DOM visible y URL. Las validaciones de datos internos pasan a scripts vía Supabase con `service_role`. | Se garantiza que cada aserción sea 100% verificable a simple vista o por query SQL. |
| **Resultados Numéricos** | Expresaba resultados como "aproximado", "ej.", o "aplica la fórmula". | Todo resultado esperado debe ser un número exacto con cálculo aritmético paso a paso y formato local `es-AR` (ej: `$ 1.500.000,50`). | Imposibilidad de falsos positivos en verificaciones de dinero. |
| **Aislamiento de Datos** | Asumía base vacía o creaba registros con nombres genéricos ("Juan Pérez", "Cliente Test"). | El ambiente es la base Supabase de producción compartida con clientes en pruebas pre-lanzamiento. Todo dato de test requiere prefijo `ZZTEST-` y los totales globales no pueden evaluarse de forma absoluta. | No hay interferencia entre pruebas y clientes. |
| **Envío de Correos** | Ejecutaba flujos de envío de proformas y recordatorios sin aislamiento comprobado. | Riesgo de enviar mails a casillas reales de clientes de prueba. Verificado que sin `BREVO_API_KEY` el cliente entra en mock, y se restringen emails a dominio `@example.com`. | Cero riesgo de spam o mails involuntarios a terceros. |

---

## 2. Elementos Inexistentes en el Código (No Inventar)

Los siguientes elementos fueron asumidos o mencionados en `CONTEXT.md` o en la suite previa, pero **NO EXISTEN** en el código fuente actual:

### 2.1. Cron Job de Caducidad de Proformas a 5 días
- **Referencia en CONTEXT.md:** Regla 6 (L82-83): *"Pasa de `sent` a `approved` automáticamente tras 5 días corridos sin objeciones."*
- **Realidad en Código:** No existe ningún endpoint `/api/cron/expire-proformas`, ni trigger en PostgreSQL, ni cron configurado en `vercel.json` o Supabase.
- **Acción QA:** No se puede probar en UI ni mediante llamadas a endpoints que no existen. Se documenta como caso `SCRIPT` que simula la actualización de fecha y verifica la regla en forma de prueba unitaria/de servicio.

### 2.2. Cron Job de Cobranzas a las 00:00 hs
- **Referencia en CONTEXT.md:** Regla 7 (L84-85): *"Evalúa `payment_due_days` del cliente vs. fecha de emisión de factura `pending` y envía alertas por Brevo a los -3 días, día 0 y posvencimiento."*
- **Realidad en Código:** No existe el directorio `src/app/api/cron/` ni archivos de cron en todo el proyecto (`ls src/app/api/cron/` devuelve exit 2).
- **Acción QA:** La lógica de plantillas de correo (`createInvoiceReminderEmail`) existe en `src/lib/brevo/templates.ts`, y el endpoint genérico `/api/mail/send` acepta `type: "invoice_reminder"`, pero no existe el disparador automático. Se excluye el cron automático de la suite UI y se prueba la API de forma aislada.

### 2.3. Catálogo / Selector de Días Feriados en Carga Diaria
- **Realidad en Código:** La función `calculateShiftHours` en [`daily-entries.ts`](src/lib/services/daily-entries.ts#L23-L44) acepta un parámetro booleano `isHoliday`. Sin embargo, en el formulario de la UI (`daily-entry/page.tsx`), **no existe ningún checkbox, selector ni campo para indicar que el día es feriado**. Tampoco existe tabla de feriados nacionales en la base de datos.
- **Acción QA:** Los casos de feriado solo pueden probarse como caso `SCRIPT` ejecutando la función de servicio o simulando el cálculo directamente, no a través de la pantalla actual.

### 2.4. Pantalla de Gestión de Usuarios y Asignación de Roles
- **Realidad en Código:** Los roles (`admin`, `accounting_auditor`) existen como enum en PostgreSQL, pero no hay pantalla de administración de usuarios en el sistema. Los usuarios se crean directamente en Supabase Auth y el trigger `on_auth_user_created` genera la fila en `profiles`.
- **Acción QA:** Se documenta el procedimiento mediante script SQL / Supabase Admin API en `SETUP.md` para crear los usuarios de prueba con cada rol.

---

## 3. Bugs y Comportamientos Inesperados en el Código

### D-01 · Cálculo de Turnos Nocturnos que Cruzan a Fin de Semana (`calculateShiftHours`)
- **Archivo:** [`src/lib/services/daily-entries.ts` (L86-150)](src/lib/services/daily-entries.ts#L86-L150)
- **Comportamiento Anómalo:** La función clasifica las horas basándose **únicamente en el día de inicio del turno** (`startDt.getDay()`):
  ```typescript
  const startDayOfWeek = startDt.getDay();
  // ...
  // Weekday (Monday - Friday)
  const regular_hours = Math.min(8, total_hours);
  const overtime_50_hours = Math.max(0, total_hours - 8);
  const overtime_100_hours = 0;
  ```
  Si un turno empieza el **viernes a las 22:00** y finaliza el **sábado a las 06:00** (8 horas en total), el sistema calcula:
  - `regular_hours = 8.0`
  - `overtime_50_hours = 0.0`
  - `overtime_100_hours = 0.0`
  Las 6 horas trabajadas el sábado antes de las 13:00 se computan como horas normales de día de semana en lugar de horas de sábado.
  Similarmente, un turno de **sábado 20:00 a domingo 04:00** clasifica todo como sábado post-13:00 (100%), lo cual coincide con domingo (100%), pero si fuera domingo a lunes a las 06:00, las horas del lunes se pagarían al 100% como domingo.
- **Impacto QA:** Los casos de prueba deben reflejar el resultado exacto que el código arroja actualmente, señalando esta discrepancia con la legislación laboral argentina (CCT).

### D-02 · Máquina de Estados de Proformas sin Validación
- **Archivo:** [`src/lib/services/invoicing/index.ts` (L226-244)](src/lib/services/invoicing/index.ts#L226-L244)
- **Comportamiento Anómalo:** `updateProformaStatusService` ejecuta un simple `UPDATE proformas SET status = $1 WHERE id = $2`. No existe validación de transiciones permitidas ni en frontend ni en backend. Desde la UI o API se puede marcar una proforma `draft` directamente como `paid`, o revertir una proforma `paid` a `draft`.
- **Impacto QA:** Se crean pruebas negativas a nivel SCRIPT/API para documentar que la API no rechaza transiciones inválidas, alertando a desarrollo.

### D-03 · RLS Incompleto para el Rol `accounting_auditor`
- **Archivos:** Migraciones `20260801000000_initial_schema.sql` a `20260924000000_positions_management.sql`.
- **Comportamiento Anómalo:** El rol `accounting_auditor` tiene concedido `SELECT` en `daily_work_logs`, `daily_staff_entries`, `employees`, `proformas`, `proforma_details`, `tax_invoices`, `clients`, `client_operations` y `cash_movements`.
  Sin embargo, **NO TIENE POLÍTICA SELECT** en las siguientes tablas críticas:
  - `positions`
  - `hour_types`
  - `client_position_rates`
  - `client_service_rates`
  - `union_bonus_scales`
  - `company_settings`
  - `master_variables`
  - `expenses` y `expense_categories`
- **Consecuencia en Ejecución:** Cuando el auditor ingresa a `/payroll`, el servicio `getPayrollData` consulta `client_position_rates` y `positions`. Al fallar o devolver array vacío por RLS, la liquidación cae en los valores fallback hardcodeados ($10.000 / $15.000 / $20.000) o genera inconsistencias visuales.
- **Impacto QA:** Casos específicos de permisos deben verificar este fallo exacto de lectura para documentar el defecto en el reporte.

### D-04 · Exposición Pública Insegura de Proformas (`anon` RLS Policy)
- **Archivo:** [`supabase/migrations/20260801000000_initial_schema.sql` (L267-276)](supabase/migrations/20260801000000_initial_schema.sql#L267-L276)
- **Comportamiento Anómalo:**
  ```sql
  CREATE POLICY "Public read proforma via token" ON public.proformas 
      FOR SELECT TO anon USING (true);
  ```
  La política pretendía permitir acceso anónimo a la proforma mediante un token público en la URL (`public_token`). Sin embargo, la condición es simplemente `USING (true)`. Esto permite que **cualquier persona no autenticada con la `anon_key` de Supabase liste todas las proformas de la empresa**.
- **Impacto QA:** Se registra como vulnerabilidad de seguridad P0 en el caso de prueba SCRIPT correspondiente.

### D-05 · Nombre de Usuario Hardcodeado en Menú Móvil
- **Archivo:** [`src/components/layout/TopNav.tsx` (L140-143)](src/components/layout/TopNav.tsx#L140-L143)
- **Comportamiento:** En resoluciones móviles (`sm:hidden`), el desplegable del perfil tiene el texto fijo `"Jorge Caetano"` y `"Admin"`, ignorando la sesión real cargada desde Supabase Auth. En escritorio sí renderiza `{userName}`.
- **Impacto QA:** Si un agente de pruebas corre en viewport móvil con el usuario auditor, verá "Jorge Caetano" en lugar del nombre del auditor.

---

## 4. Módulos Simulados / En Mock (Sin Persistencia Real)

Los siguientes módulos de la interfaz no interactúan con Supabase:

1. **Modificación de Contraseña (`/change-password`):**
   - [`change-password/page.tsx` L73-79](src/app/%28dashboard%29/change-password/page.tsx#L73-L79): La función `handleSave` ejecuta un `setTimeout(..., 1000)` simulando el cambio. No realiza ninguna llamada a `supabase.auth.updateUser()`. La contraseña real nunca cambia.
2. **Configuración del Sistema (`/settings`):**
   - [`settings/page.tsx` L28-61, L85-92](src/app/%28dashboard%29/settings/page.tsx#L28-L61): Carga el array estático `INITIAL_VARIABLES` en memoria. Al guardar ejecuta `setTimeout`. Las tablas `company_settings` y `master_variables` no son leídas ni actualizadas.
3. **Centro de Reportes (`/reports`):**
   - [`reports/page.tsx` L28-69](src/app/%28dashboard%29/reports/page.tsx#L28-L69): Lista estática `INITIAL_REPORTS`. La descarga simula un retardo.
4. **Tablero Principal (`/`):**
   - [`page.tsx` (dashboard)](src/app/%28dashboard%29/page.tsx): Las tarjetas KPI (*Saldo Banco*, *Total Facturado*, *Total Sueldos*, etc.) y los acordeones (*Proformas a Enviar*, *Facturas a Cobrar*) muestran datos constantes de ejemplo, no agregaciones de la base de datos.

---

## 5. Riesgos de Envío Real de Mails y su Aislamiento

### Verificación de Caminos de Envío

| Vía Posible | ¿Existe en el Repo? | Estado / Análisis | ¿Riesgo de Envío Real? |
| :--- | :--- | :--- | :--- |
| **Brevo REST API (`/api/mail/send`)** | Sí ([`src/lib/brevo/client.ts`](src/lib/brevo/client.ts)) | Si `BREVO_API_KEY` está vacía o ausente, retorna `{ success: true, mocked: true }` y loguea a consola. No contacta a api.brevo.com. | 🟢 **NULO** si `BREVO_API_KEY=""` en `.env.test`. |
| **Triggers de Base de Datos (pg_net / http)** | No | Se revisaron las 16 migraciones SQL en `supabase/migrations/`. No se utiliza `pg_net` ni extensiones HTTP en triggers. | 🟢 **NULO**. |
| **Supabase Edge Functions** | No | No existe directorio `supabase/functions/` en el proyecto. | 🟢 **NULO**. |
| **Supabase Auth Emails (Confirmación / Reset)** | Sí (Infraestructura Supabase) | Si se crea un usuario usando `supabase.auth.signUp()`, Supabase intentará enviar el correo de confirmación a menos que se use `supabase.auth.admin.createUser({ email_confirm: true })` con `service_role`. | 🟡 **MITIGADO**: Las cuentas de test deben crearse exclusivamente vía `service_role` con `email_confirm: true` y dominio `@example.com`. |

---

## 6. Manejo de Datos de Clientes Preexistentes

Para garantizar que los tests no modifiquen ni dependan de datos reales del cliente presentes en la base:
1. **Prefijo Obligatorio:** Todo registro de prueba lleva el prefijo `ZZTEST-` en nombre, razón social o código.
2. **Sin Aserciones sobre Totales Absolutos:** En pantallas como Flujo de Caja o Sueldos, las pruebas verifican la **diferencia antes/después** generada por las operaciones del test, nunca el saldo total de la pantalla.
3. **Limpieza Quirúrgica:** El script `scripts/test-cleanup.ts` ejecuta `DELETE` única y exclusivamente sobre registros con prefijo `ZZTEST-`, ordenados por dependencias foráneas.


<!-- FIN DE docs/test-cases/DISCREPANCIAS.md -->

---



<!-- INICIO DE docs/test-cases/TEST-IDS.md -->

# Catálogo de Selectores data-testid

Este documento lista todos los atributos `data-testid` incorporados en el código de **MTS Gestión Logística** para permitir la ejecución automatizada y determinística de casos de prueba mediante agentes de IA (Claude in Chrome) y suites de testing E2E.

**Convención de nomenclatura:** `modulo-elemento-accion` (o `modulo-elemento-tipo`) en kebab-case.

---

## 1. Módulo: Autenticación (`/login`)
**Archivo:** [`src/app/login/page.tsx`](src/app/login/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `login-input-email` | `<input type="email">` | Campo para ingresar correo del usuario |
| `login-input-password` | `<input type="password\|text">` | Campo para ingresar contraseña |
| `login-btn-toggle-password` | `<button type="button">` | Botón para mostrar / ocultar contraseña |
| `login-btn-submit` | `<button type="submit">` | Botón para enviar formulario ("Iniciar Sesión") |
| `login-alert-error` | `<div>` | Contenedor de mensaje de error de credenciales |

---

## 2. Layout Global: Navegación y Encabezado
**Archivos:**
- [`src/components/layout/Sidebar.tsx`](src/components/layout/Sidebar.tsx)
- [`src/components/layout/TopNav.tsx`](src/components/layout/TopNav.tsx)

| data-testid | Elemento HTML | Ubicación | Propósito / Descripción |
|---|---|---|---|
| `sidebar-btn-nuevo-registro` | `<Link>` | Sidebar | Acceso rápido a Carga Diaria |
| `sidebar-link-dashboard` | `<Link>` | Sidebar | Navegación a Dashboard General |
| `sidebar-link-daily-entry` | `<Link>` | Sidebar | Navegación a Carga Diaria de Horas |
| `sidebar-link-payroll` | `<Link>` | Sidebar | Navegación a Liquidación y Sueldos |
| `sidebar-link-invoicing` | `<Link>` | Sidebar | Navegación a Facturación y Proformas |
| `sidebar-link-rates` | `<Link>` | Sidebar | Navegación a Tarifario Comercial |
| `sidebar-link-cash-flow` | `<Link>` | Sidebar | Navegación a Flujo de Caja |
| `sidebar-link-employees` | `<Link>` | Sidebar | Navegación a Gestión de Empleados |
| `sidebar-link-positions` | `<Link>` | Sidebar | Navegación a Puestos y Funciones |
| `sidebar-link-locations` | `<Link>` | Sidebar | Navegación a Lugares de Operación |
| `sidebar-link-clients` | `<Link>` | Sidebar | Navegación a Gestión de Clientes |
| `sidebar-link-reports` | `<Link>` | Sidebar | Navegación a Reportes Avanzados |
| `sidebar-link-settings` | `<Link>` | Sidebar | Navegación a Configuración |
| `sidebar-btn-logout` | `<button>` | Sidebar | Botón para cerrar sesión |
| `topnav-user-menu-trigger` | `<button>` | TopNav | Menú desplegable de usuario (avatar/nombre) |
| `topnav-link-change-password` | `<button>` | TopNav (Dropdown) | Opción para cambiar contraseña |
| `topnav-link-settings` | `<Link>` | TopNav (Dropdown) | Enlace a Configuración del sistema |
| `topnav-btn-logout` | `<button>` | TopNav (Dropdown) | Botón para cerrar sesión desde TopNav |

---

## 3. Módulo: Carga Diaria de Horas (`/daily-entry`)
**Archivo:** [`src/app/(dashboard)/daily-entry/page.tsx`](src/app/%28dashboard%29/daily-entry/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `daily-entry-btn-cargar-horas` | `<button>` | Botón principal de cabecera "Cargar Horas" para abrir slideover |
| `daily-entry-btn-toggle-approval` | `<button>` | Botón en fila de tabla para alternar aprobación (check verde) |
| `daily-entry-btn-edit-entry` | `<button>` | Botón en fila de tabla para editar turno (ícono lápiz) |
| `daily-entry-btn-delete-entry` | `<button>` | Botón en fila de tabla para eliminar turno (ícono papelera) |
| `daily-entry-input-date` | `<input type="date">` | Selector de fecha del turno |
| `daily-entry-select-client` | `<select>` | Selector de Cliente |
| `daily-entry-select-location` | `<select>` | Selector de Lugar de Trabajo |
| `daily-entry-select-vessel` | `<input type="text">` | Campo de texto para Buque (cuando el lugar lo requiere) |
| `daily-entry-select-employee` | `<select>` | Selector de Operario / Empleado |
| `daily-entry-select-position` | `<select>` | Selector de Puesto / Función |
| `daily-entry-input-start-time` | `<input type="time">` | Hora de inicio del turno |
| `daily-entry-input-end-time` | `<input type="time">` | Hora de fin del turno |
| `daily-entry-input-regular-hours` | `<input type="number">` | Cantidad de horas normales |
| `daily-entry-input-overtime-50` | `<input type="number">` | Cantidad de horas al 50% |
| `daily-entry-input-overtime-100` | `<input type="number">` | Cantidad de horas al 100% |
| `daily-entry-input-shuttles` | `<input type="number">` | Cantidad de traslados |
| `daily-entry-input-meal` | `<input type="number">` | Importe de vianda ($) |
| `daily-entry-input-advance` | `<input type="number">` | Importe de anticipo ($) |
| `daily-entry-input-plus-delta` | `<input type="number">` | Importe de Plus Delta ($) |
| `daily-entry-checkbox-day-off` | `<input type="checkbox">` | Checkbox para marcar día de franco |
| `daily-entry-checkbox-approved` | `<input type="checkbox">` | Checkbox para marcar turno como aprobado en el alta |
| `daily-entry-btn-finalizar-turno-slideover` | `<button type="submit">` | Guardar registro y cerrar slideover |
| `daily-entry-btn-guardar-seguir` | `<button type="button">` | Guardar registro y mantener slideover abierto |

---

## 4. Módulo: Facturación y Proformas (`/invoicing`)
**Archivos:**
- [`src/app/(dashboard)/invoicing/page.tsx`](src/app/%28dashboard%29/invoicing/page.tsx)
- [`src/components/invoicing/CreateProformaSlideover.tsx`](src/components/invoicing/CreateProformaSlideover.tsx)

| data-testid | Elemento HTML | Ubicación | Propósito / Descripción |
|---|---|---|---|
| `invoicing-btn-nueva-proforma` | `<button>` | `/invoicing` Header | Abrir panel para emitir nueva proforma |
| `invoicing-btn-view-details` | `<button>` | `/invoicing` Tabla | Ver detalle / desglose de proforma |
| `invoicing-btn-facturar` | `<button>` | `/invoicing` Tabla | Abrir modal para asignar número de factura |
| `invoicing-btn-marcar-cobrada` | `<button>` | `/invoicing` Tabla | Marcar proforma facturada como cobrada (paid) |
| `invoicing-btn-delete-proforma` | `<button>` | `/invoicing` Tabla | Eliminar proforma en estado borrador |
| `invoicing-input-factura-numero` | `<input type="text">` | Modal Facturar | Campo para ingresar número oficial de factura |
| `invoicing-btn-confirmar-factura` | `<button>` | Modal Facturar | Confirmar transición a estado `invoiced` |
| `invoicing-select-client` | `<select>` | Slideover Alta | Selector de cliente a liquidar |
| `invoicing-select-model` | `<select>` | Slideover Alta | Estrategia de facturación (`vessel`, `fiscal_yard`, etc.) |
| `invoicing-input-from-date` | `<input type="date">` | Slideover Alta | Fecha inicial del período |
| `invoicing-input-to-date` | `<input type="date">` | Slideover Alta | Fecha final del período |
| `invoicing-input-fortnight-period` | `<select>` | Slideover Alta | Selector de quincena (1Q / 2Q) |
| `invoicing-input-discount` | `<input type="number">` | Slideover Alta | Porcentaje de descuento comercial aplicable |
| `invoicing-preview-subtotal` | `<span>` | Slideover Alta | Vista previa del subtotal calculado |
| `invoicing-preview-total` | `<span>` | Slideover Alta | Vista previa del total neto calculado |
| `invoicing-btn-emitir-proforma` | `<button>` | Slideover Alta | Botón para emitir la proforma definitiva |

---

## 5. Módulo: Liquidación de Sueldos (`/payroll`)
**Archivo:** [`src/app/(dashboard)/payroll/page.tsx`](src/app/%28dashboard%29/payroll/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `payroll-btn-preset-week` | `<button>` | Botón preset "Esta Semana" |
| `payroll-btn-preset-fortnight` | `<button>` | Botón preset "Esta Quincena" |
| `payroll-btn-preset-month` | `<button>` | Botón preset "Este Mes" |
| `payroll-btn-export-csv` | `<button>` | Botón de exportación a CSV |
| `payroll-kpi-personal-liquidado` | `<span>` | Tarjeta KPI: Cantidad de empleados liquidados |
| `payroll-kpi-total-bruto` | `<span>` | Tarjeta KPI: Total Sueldos Bruto ($) |
| `payroll-kpi-total-anticipos` | `<span>` | Tarjeta KPI: Total de Anticipos a descontar ($) |
| `payroll-kpi-total-neto` | `<span>` | Tarjeta KPI: Total Sueldos Neto ($) |

---

## 6. Módulo: Tarifario Comercial (`/rates`)
**Archivo:** [`src/app/(dashboard)/rates/page.tsx`](src/app/%28dashboard%29/rates/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `rates-btn-nueva-tarifa` | `<button>` | Botón de cabecera "Nueva Tarifa" para abrir slideover |
| `rates-btn-edit` | `<button>` | Botón en fila de tabla para editar tarifa existente |
| `rates-btn-delete` | `<button>` | Botón en fila de tabla para eliminar tarifa |
| `rates-select-client` | `<select>` | Slideover: Selector de cliente |
| `rates-select-position` | `<select>` | Slideover: Selector de puesto operativo |
| `rates-input-effective-from` | `<input type="date">` | Slideover: Fecha de entrada en vigencia |
| `rates-checkbox-auto-calculate` | `<input type="checkbox">` | Slideover: Checkbox cálculo automático 50% y 100% |
| `rates-input-regular` | `<input type="number">` | Slideover: Valor Hora Normal ($) |
| `rates-input-overtime-50` | `<input type="number">` | Slideover: Valor Hora 50% ($) |
| `rates-input-overtime-100` | `<input type="number">` | Slideover: Valor Hora 100% ($) |
| `rates-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar tarifa |

---

## 7. Módulo: Puestos y Funciones (`/positions`)
**Archivo:** [`src/app/(dashboard)/positions/page.tsx`](src/app/%28dashboard%29/positions/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `positions-btn-nuevo-puesto` | `<button>` | Botón de cabecera "Nuevo Puesto" |
| `positions-btn-assign-staff` | `<button>` | Botón en tarjeta para asignar personal |
| `positions-btn-view-rates` | `<Link>` | Botón en tarjeta para ver tarifas asociadas |
| `positions-btn-edit` | `<button>` | Botón en tarjeta para editar puesto |
| `positions-btn-delete` | `<button>` | Botón en tarjeta para eliminar puesto |
| `positions-input-name` | `<input type="text">` | Slideover: Nombre del puesto |
| `positions-checkbox-vehicle-bonus` | `<input type="checkbox">` | Slideover: Checkbox para habilitar Plus Vehicular CCT |
| `positions-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar puesto |

---

## 8. Módulo: Gestión de Empleados (`/employees`)
**Archivo:** [`src/app/(dashboard)/employees/page.tsx`](src/app/%28dashboard%29/employees/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `employees-btn-nuevo-empleado` | `<button>` | Botón de cabecera "Nuevo Operario" |
| `employees-btn-auditar-horas` | `<button>` | Botón en fila para auditar horas del empleado |
| `employees-btn-edit` | `<button>` | Botón en fila para editar datos del empleado |
| `employees-btn-delete` | `<button>` | Botón en fila para eliminar empleado |
| `employees-input-fullname` | `<input type="text">` | Slideover: Nombre completo |
| `employees-input-dni` | `<input type="text">` | Slideover: Número de DNI (único) |
| `employees-input-file-number` | `<input type="text">` | Slideover: Número de Legajo (único) |
| `employees-input-tax-id` | `<input type="text">` | Slideover: CUIL del empleado |
| `employees-select-position` | `<select>` | Slideover: Selector de Puesto predeterminado |
| `employees-input-phone` | `<input type="text">` | Slideover: Teléfono de contacto |
| `employees-select-status` | `<select>` | Slideover: Estado (Activo / Licencia / Inactivo) |
| `employees-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar empleado |

---

## 9. Módulo: Gestión de Clientes (`/clients`)
**Archivo:** [`src/app/(dashboard)/clients/page.tsx`](src/app/%28dashboard%29/clients/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `clients-btn-nuevo-cliente` | `<button>` | Botón de cabecera "Nuevo Cliente" |
| `clients-btn-edit` | `<button>` | Botón en fila para editar cliente |
| `clients-btn-delete` | `<button>` | Botón en fila para eliminar cliente |
| `clients-input-company-name` | `<input type="text">` | Slideover: Razón Social / Nombre Comercial |
| `clients-input-tax-id` | `<input type="text">` | Slideover: CUIT (11 dígitos numéricos sin guiones) |
| `clients-input-billing-email` | `<input type="email">` | Slideover: Correo electrónico de facturación |
| `clients-input-phone` | `<input type="text">` | Slideover: Teléfono de contacto |
| `clients-select-payment-due-days` | `<select>` | Slideover: Plazo de pago (7, 15, 30, 60, 90 días) |
| `clients-select-status` | `<select>` | Slideover: Estado (Activo / Inactivo) |
| `clients-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar cliente |

---

## 10. Módulo: Lugares de Trabajo (`/locations`)
**Archivo:** [`src/app/(dashboard)/locations/page.tsx`](src/app/%28dashboard%29/locations/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `locations-btn-nuevo-lugar` | `<button>` | Botón de cabecera "Nuevo Lugar de Trabajo" |
| `locations-btn-edit` | `<button>` | Botón en fila para editar lugar |
| `locations-btn-delete` | `<button>` | Botón en fila para eliminar lugar |
| `locations-input-code` | `<input type="text">` | Slideover: Código del lugar (ej. LDT-001) |
| `locations-input-name` | `<input type="text">` | Slideover: Nombre del lugar (ej. Muelle Norte 1) |
| `locations-input-port-city` | `<input type="text">` | Slideover: Puerto o Ciudad |
| `locations-select-status` | `<select>` | Slideover: Estado (Activo / En Mantenimiento / Inactivo) |
| `locations-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar lugar de trabajo |

---

## 11. Módulo: Flujo de Caja (`/cash-flow`)
**Archivo:** [`src/app/(dashboard)/cash-flow/page.tsx`](src/app/%28dashboard%29/cash-flow/page.tsx)

| data-testid | Elemento HTML | Propósito / Descripción |
|---|---|---|
| `cash-flow-btn-nuevo-ingreso` | `<button>` | Botón rápido "Nuevo Ingreso" |
| `cash-flow-btn-nuevo-movimiento` | `<button>` | Botón principal de cabecera "Nuevo Movimiento" |
| `cash-flow-kpi-total-ingresos` | `<span>` | Tarjeta KPI: Total Ingresos acumulados del período |
| `cash-flow-kpi-total-egresos` | `<span>` | Tarjeta KPI: Total Egresos acumulados del período |
| `cash-flow-kpi-saldo-operativo` | `<span>` | Tarjeta KPI: Saldo Neto Operativo del período |
| `cash-flow-input-date` | `<input type="date">` | Slideover: Fecha del movimiento de caja |
| `cash-flow-select-type` | `<select>` | Slideover: Tipo de movimiento (income / expense) |
| `cash-flow-select-area` | `<select>` | Slideover: Área de imputación |
| `cash-flow-input-detail` | `<input type="text">` | Slideover: Concepto / detalle del movimiento |
| `cash-flow-input-amount` | `<input type="number">` | Slideover: Monto del movimiento ($) |
| `cash-flow-btn-guardar` | `<button type="submit">` | Slideover: Botón para guardar movimiento |


<!-- FIN DE docs/test-cases/TEST-IDS.md -->

---



<!-- INICIO DE docs/test-cases/01-autenticacion-y-permisos.md -->

# Módulo 01: Autenticación y Control de Permisos

Este documento contiene los casos de prueba verificados para el flujo de autenticación, control de accesos por rol y protección de rutas en **MTS Gestión Logística**.

---

## Bloque de Ejecución CHROME 01: Flujo de Acceso y Sesión
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`
- **Usuario de prueba secundario:** `zztest-auditor@example.com` (Rol: `auditor`), Contraseña: `ZztestPass123!`
- **Precondición general:** Servidor local ejecutándose en `http://localhost:3000` con `.env.test`. Base de datos con usuarios creados mediante `scripts/create-test-users.ts`.

---

### TC-AUTH-01: Inicio de sesión exitoso con rol Administrador
- **Módulo / Funcionalidad:** Autenticación / Inicio de Sesión
- **Objetivo:** Verificar que un usuario con credenciales válidas y rol `admin` inicie sesión correctamente y sea redirigido al Dashboard.
- **Prioridad:** P0 (Seguridad y Flujo Crítico)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-admin@example.com`
  - Contraseña: `ZztestPass123!`
- **Precondiciones:**
  - El usuario administrador de test existe en Supabase Auth (`email_confirm: true`) y cuenta con perfil en tabla `profiles` con `role = 'admin'`.
  - El navegador se encuentra en la pantalla de inicio de sesión (`http://localhost:3000/login`).
- **Pasos de Ejecución:**
  1. En el campo "Correo electrónico" (`login-input-email`), escribir `zztest-admin@example.com`.
  2. En el campo "Contraseña" (`login-input-password`), escribir `ZztestPass123!`.
  3. Hacer clic en el botón "Iniciar Sesión" (`login-btn-submit`).
- **Resultado Esperado:**
  - El sistema procesa la autenticación sin mostrar mensajes de error.
  - La URL del navegador cambia inmediatamente a `http://localhost:3000/` o `http://localhost:3000/dashboard`.
  - Se visualiza la barra de navegación lateral (Sidebar) con el logotipo de MTS Gestión Logística.
  - Los accesos a todos los módulos operativos y de gestión son visibles: Dashboard (`sidebar-link-dashboard`), Carga Diaria (`sidebar-link-daily-entry`), Sueldos (`sidebar-link-payroll`), Facturación (`sidebar-link-invoicing`), Tarifario (`sidebar-link-rates`), Flujo de Caja (`sidebar-link-cash-flow`), Empleados (`sidebar-link-employees`), Puestos (`sidebar-link-positions`), Lugares (`sidebar-link-locations`), Clientes (`sidebar-link-clients`).
- **Datos que crea:** Ninguno (generación de cookies de sesión Supabase en el navegador).

---

### TC-AUTH-02: Rechazo de inicio de sesión con contraseña incorrecta
- **Módulo / Funcionalidad:** Autenticación / Validaciones de Acceso
- **Objetivo:** Verificar que el sistema impida el acceso cuando se ingresa una contraseña errónea y despliegue el mensaje de alerta correspondiente.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-admin@example.com`
  - Contraseña inválida: `PasswordIncorrecto123!`
- **Precondiciones:**
  - El usuario de prueba existe en Supabase Auth.
  - El navegador se encuentra en `http://localhost:3000/login`.
- **Pasos de Ejecución:**
  1. En el campo "Correo electrónico" (`login-input-email`), escribir `zztest-admin@example.com`.
  2. En el campo "Contraseña" (`login-input-password`), escribir `PasswordIncorrecto123!`.
  3. Hacer clic en el botón "Iniciar Sesión" (`login-btn-submit`).
- **Resultado Esperado:**
  - El sistema no redirige y permanece en la ruta `/login`.
  - Aparece un cuadro de alerta rojo en la parte superior del formulario (`login-alert-error`).
  - El texto exacto de la alerta es: `Credenciales inválidas. Por favor verifique correo y contraseña.`.
  - El campo de contraseña permanece disponible para reintentar.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-03: Alternar visibilidad de contraseña (Toggle Password)
- **Módulo / Funcionalidad:** Autenticación / UI de Formulario
- **Objetivo:** Verificar que el botón de visibilidad de contraseña cambie el tipo de input entre protegido y texto visible.
- **Prioridad:** P2 (UI y Conveniencia)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - El navegador se encuentra en `http://localhost:3000/login`.
- **Pasos de Ejecución:**
  1. En el campo "Contraseña" (`login-input-password`), escribir `MiClavePrueba123`.
  2. Verificar que el atributo `type` del elemento input es `"password"`.
  3. Hacer clic en el botón con ícono de ojo a la derecha del campo (`login-btn-toggle-password`).
  4. Verificar el atributo `type` del elemento input y que los caracteres sean legibles.
  5. Hacer clic nuevamente en el botón (`login-btn-toggle-password`).
- **Resultado Esperado:**
  - Tras el primer clic, el atributo `type` del campo cambia a `"text"` y el texto `"MiClavePrueba123"` queda visible.
  - Tras el segundo clic, el atributo `type` vuelve a `"password"` y el texto se enmascara con puntos o asteriscos.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-04: Cierre de sesión exitoso desde Sidebar
- **Módulo / Funcionalidad:** Autenticación / Cierre de Sesión
- **Objetivo:** Verificar que un usuario autenticado pueda finalizar su sesión y sea redirigido a `/login`, eliminando tokens locales.
- **Prioridad:** P1 (Funcionalidad Principal)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Sesión activa iniciada con `zztest-admin@example.com`.
- **Precondiciones:**
  - El usuario tiene una sesión válida y se encuentra en cualquier pantalla interna (ej. `/daily-entry`).
- **Pasos de Ejecución:**
  1. En el extremo inferior de la barra de navegación lateral (Sidebar), localizar el botón "Cerrar Sesión" (`sidebar-btn-logout`).
  2. Hacer clic en "Cerrar Sesión".
- **Resultado Esperado:**
  - La sesión se invalida en el cliente Supabase.
  - El navegador redirige automáticamente a la pantalla de login (`http://localhost:3000/login`).
  - Al pulsar el botón "Atrás" del navegador, el sistema no permite ingresar a la pantalla anterior protegida y fuerza la redirección a `/login`.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-05: Redirección automática al intentar acceder a ruta protegida sin sesión
- **Módulo / Funcionalidad:** Seguridad / Middleware y Rutas Protegidas
- **Objetivo:** Verificar que un usuario no autenticado que intente ingresar directamente mediante URL a un módulo interno sea redirigido a `/login`.
- **Prioridad:** P0 (Seguridad)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - El navegador no cuenta con ninguna sesión activa ni cookies de Supabase (modo incógnito o tras logout).
- **Pasos de Ejecución:**
  1. Ingresar directamente en la barra de direcciones del navegador: `http://localhost:3000/daily-entry`.
  2. Presionar Enter.
- **Resultado Esperado:**
  - El Middleware intercepta la petición antes de renderizar la página protegida.
  - La URL cambia a `http://localhost:3000/login` (o incluye parámetro de retorno).
  - La pantalla mostrada es el formulario de inicio de sesión de MTS Gestión Logística.
- **Datos que crea:** Ninguno.

---

### TC-AUTH-06: Navegación y elementos visibles para rol Auditor
- **Módulo / Funcionalidad:** Permisos y Roles / Vista de Auditor
- **Objetivo:** Verificar que un usuario con rol `auditor` pueda iniciar sesión e interactuar con la interfaz según los permisos asignados.
- **Prioridad:** P1 (Permisos por Rol)
- **Ejecutor:** CHROME
- **Datos de test usados:**
  - Email: `zztest-auditor@example.com`
  - Contraseña: `ZztestPass123!`
- **Precondiciones:**
  - Usuario `zztest-auditor@example.com` configurado en `profiles` con `role = 'auditor'`.
- **Pasos de Ejecución:**
  1. En `http://localhost:3000/login`, ingresar email `zztest-auditor@example.com` y contraseña `ZztestPass123!`.
  2. Hacer clic en "Iniciar Sesión" (`login-btn-submit`).
  3. Observar la pantalla principal y la barra lateral de navegación (`Sidebar`).
- **Resultado Esperado:**
  - El ingreso es exitoso y redirige al Dashboard.
  - En el Sidebar se observan los accesos de consulta.
  - *(Nota Discrepancia D-06: Verificar que las opciones restringidas a escritura se oculten o deshabiliten correctamente según las políticas RLS y los permisos de interfaz).*
- **Datos que crea:** Ninguno.


<!-- FIN DE docs/test-cases/01-autenticacion-y-permisos.md -->

---



<!-- INICIO DE docs/test-cases/02-seguridad-rls-y-apis.md -->

# Módulo 02: Seguridad, Políticas RLS y Route Handlers (APIs)

Este documento detalla los casos de prueba automatizables mediante scripts para verificar la integridad de las políticas de Row Level Security (RLS) en PostgreSQL/Supabase, la protección de Route Handlers (`/api/*`), y la garantía de que no se envíen correos electrónicos reales durante las pruebas.

---

### TC-SEC-01: Invocación no autenticada al endpoint de envío de correo `/api/mail/send`
- **Módulo / Funcionalidad:** Seguridad / API Route Handlers
- **Objetivo:** Verificar que peticiones externas anónimas (sin sesión activa ni token de autorización) dirigidas a `/api/mail/send` sean rechazadas con código HTTP 401 o 403.
- **Prioridad:** P0 (Seguridad y Prevención de Abusos)
- **Ejecutor:** SCRIPT (`tests/scripts/test-api-security.ts`)
- **Datos de test usados:**
  - Endpoint: `POST http://localhost:3000/api/mail/send`
  - Headers: `Content-Type: application/json` (sin Cookie de Supabase ni Authorization Bearer).
  - Body:
    ```json
    {
      "to": "zztest-recipient@example.com",
      "subject": "ZZTEST - Intento No Autenticado",
      "html": "<p>Prueba de seguridad</p>"
    }
    ```
- **Precondiciones:**
  - Servidor Next.js activo en `http://localhost:3000`.
- **Pasos de Ejecución:**
  1. Enviar una petición HTTP POST directa con `fetch` o `curl` hacia `http://localhost:3000/api/mail/send` sin encabezados de autenticación.
  2. Capturar el código de estado HTTP y el cuerpo JSON de la respuesta.
- **Resultado Esperado:**
  - Código HTTP retornado: `401 Unauthorized` o `403 Forbidden`.
  - El cuerpo de la respuesta no ejecuta ningún envío ni llama al cliente de Brevo.
  - La respuesta contiene un mensaje de error tipo: `{ "error": "No autorizado" }` o similar.
- **Datos que crea:** Ninguno.

---

### TC-SEC-02: Garantía de modo Simulado (Mock) de Brevo en entorno de testing
- **Módulo / Funcionalidad:** Notificaciones / Brevo Client Mock
- **Objetivo:** Confirmar que cuando la variable de entorno `BREVO_API_KEY` está vacía o no configurada (como en `.env.test`), el servicio de correo intercepta el envío y retorna `{ success: true, mocked: true }` sin conectar con los servidores reales de Brevo.
- **Prioridad:** P0 (Protección Crítica: Prevención de Envío de Mails Reales)
- **Ejecutor:** SCRIPT (`tests/scripts/test-brevo-mock.ts`)
- **Datos de test usados:**
  - Sesión autenticada de administrador `zztest-admin@example.com`.
  - Destinatario: `zztest-alert@example.com`.
  - Asunto: `ZZTEST - Verificación de Brevo Mock`.
- **Precondiciones:**
  - En `.env.test`: `BREVO_API_KEY=""`.
  - Servidor local iniciado con las variables de `.env.test`.
- **Pasos de Ejecución:**
  1. Invocar la función interna `sendEmail` de `@/lib/brevo/client` o realizar una petición autenticada al endpoint `/api/mail/send`.
  2. Evaluar el objeto de respuesta devuelto por el servicio.
- **Resultado Esperado:**
  - El resultado devuelto por el método es estrictamente:
    - `success`: `true`
    - `mocked`: `true`
  - Se registra en consola del servidor el mensaje de aviso informando que el correo fue omitido por falta de API Key.
  - Ningún paquete de red saliente es emitido hacia los servidores SMTP o API REST de Brevo (`api.brevo.com`).
- **Datos que crea:** Ninguno.

---

### TC-SEC-03: Restricción RLS en inserciones por usuarios anónimos
- **Módulo / Funcionalidad:** Seguridad de Base de Datos / Row Level Security (RLS)
- **Objetivo:** Verificar que un cliente anónimo (usando únicamente `NEXT_PUBLIC_SUPABASE_ANON_KEY` sin sesión) no pueda insertar registros en tablas operativas críticas (`daily_staff_entries`, `invoices`, `positions`, `clients`).
- **Prioridad:** P0 (Seguridad de Base de Datos)
- **Ejecutor:** SCRIPT (`tests/scripts/test-rls-policies.ts`)
- **Datos de test usados:**
  - Cliente Supabase instanciado con `ANON_KEY` y sin llamada a `signInWithPassword`.
  - Intento de inserción en tabla `daily_staff_entries`:
    ```json
    {
      "work_log_id": "00000000-0000-0000-0000-000000000001",
      "employee_id": "00000000-0000-0000-0000-000000000002",
      "position_id": "00000000-0000-0000-0000-000000000003",
      "start_time": "08:00",
      "end_time": "16:00"
    }
    ```
- **Precondiciones:**
  - Conexión remota a Supabase configurada. Tablas con RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Pasos de Ejecución:**
  1. Ejecutar script con el cliente `supabaseAnonClient.from('daily_staff_entries').insert(...)`.
  2. Capturar el objeto `{ data, error }`.
- **Resultado Esperado:**
  - `data` es `null`.
  - `error` contiene un error de violación de política de seguridad (código PostgreSQL `42501` o mensaje `new row violates row-level security policy for table "daily_staff_entries"`).
  - La base de datos no contiene el registro insertado.
- **Datos que crea:** Ninguno.

---

### TC-SEC-04: Auditoría de Políticas RLS para rol Auditor en mutaciones de datos
- **Módulo / Funcionalidad:** Permisos y Roles / RLS Rol Auditor
- **Objetivo:** Verificar que un usuario autenticado con rol `auditor` (`zztest-auditor@example.com`) no pueda alterar ni eliminar datos de clientes, empleados ni tarifas.
- **Prioridad:** P0 (Integridad de Datos)
- **Ejecutor:** SCRIPT (`tests/scripts/test-rls-policies.ts`)
- **Datos de test usados:**
  - Sesión autenticada de `zztest-auditor@example.com`.
  - ID de cliente de prueba: `c1000000-0000-0000-0000-000000000001` (ZZTEST-CAT Logística Portuaria).
- **Precondiciones:**
  - Dataset de seed ZZTEST- aplicado en la base de datos.
- **Pasos de Ejecución:**
  1. Autenticar el cliente Supabase con las credenciales de `zztest-auditor@example.com`.
  2. Intentar actualizar el campo `company_name` del cliente de prueba:
     `supabase.from('clients').update({ company_name: 'ZZTEST-HACK' }).eq('id', 'c1000000-0000-0000-0000-000000000001')`.
  3. Intentar eliminar una tarifa existente en `commercial_rates`.
- **Resultado Esperado:**
  - La operación de `update` o `delete` es rechazada por las políticas RLS (o no actualiza ninguna fila por condición de rol).
  - Al consultar el registro con `service_role`, el valor de `company_name` permanece inalterado (`ZZTEST-CAT Logística Portuaria`).
  - *(Nota Discrepancia D-06: Registrar en caso de que alguna migración permita mutaciones por rol no-admin).*
- **Datos que crea:** Ninguno.

---

### TC-SEC-05: Verificación de acceso y aislamiento en proformas públicas
- **Módulo / Funcionalidad:** Seguridad / Proformas Públicas
- **Objetivo:** Auditar la política RLS introducida en la migración `20260324143431_public_proformas.sql` que permite SELECT a usuarios anónimos en la tabla `proformas`.
- **Prioridad:** P0 (Privacidad de Datos Comerciales)
- **Ejecutor:** SCRIPT (`tests/scripts/test-rls-policies.ts`)
- **Datos de test usados:**
  - Cliente Supabase anónimo (`ANON_KEY`).
  - ID de proforma de prueba: `f1000000-0000-0000-0000-000000000001`.
- **Precondiciones:**
  - Proforma ZZTEST-PRF-CAT-001 presente en la base de datos.
- **Pasos de Ejecución:**
  1. Ejecutar consulta anónima: `supabaseAnonClient.from('proformas').select('*').limit(5)`.
  2. Evaluar si la política exige token específico o permite listar todas las proformas de la empresa.
- **Resultado Esperado:**
  - Documentar el resultado exacto: si devuelve filas sin token, confirmar la Discrepancia **D-07** para que el equipo de desarrollo limite el SELECT exclusivamente por token criptográfico único (`where token = :token`).
- **Datos que crea:** Ninguno.


<!-- FIN DE docs/test-cases/02-seguridad-rls-y-apis.md -->

---



<!-- INICIO DE docs/test-cases/03-carga-diaria-de-horas.md -->

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


<!-- FIN DE docs/test-cases/03-carga-diaria-de-horas.md -->

---



<!-- INICIO DE docs/test-cases/04-facturacion-y-proformas.md -->

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


<!-- FIN DE docs/test-cases/04-facturacion-y-proformas.md -->

---



<!-- INICIO DE docs/test-cases/05-calculo-de-sueldos.md -->

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


<!-- FIN DE docs/test-cases/05-calculo-de-sueldos.md -->

---



<!-- INICIO DE docs/test-cases/06-tarifarios-y-puestos.md -->

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


<!-- FIN DE docs/test-cases/06-tarifarios-y-puestos.md -->

---



<!-- INICIO DE docs/test-cases/07-abm-personal-clientes-lugares.md -->

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


<!-- FIN DE docs/test-cases/07-abm-personal-clientes-lugares.md -->

---



<!-- INICIO DE docs/test-cases/08-flujo-de-caja.md -->

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


<!-- FIN DE docs/test-cases/08-flujo-de-caja.md -->

---



<!-- INICIO DE docs/test-cases/09-reportes-y-notificaciones.md -->

# Módulo 09: Reportes, Notificaciones y Configuración de Cuenta

Este documento contiene los casos de prueba para el módulo de Reportes Avanzados (`/reports`), Notificaciones por Correo Electrónico (Brevo Mock) y las opciones del menú de usuario en la barra superior (`TopNav`).

---

## Bloque de Ejecución CHROME 08: Interfaz de Reportes y Cuenta
- **Usuario de prueba:** `zztest-admin@example.com` (Rol: `admin`), Contraseña: `ZztestPass123!`

---

### TC-REP-01: Visualización y navegación en Reportes Avanzados
- **Módulo / Funcionalidad:** Reportes / Carga de Métricas
- **Objetivo:** Verificar que la pantalla de reportes renderice correctamente los gráficos y filtros temporales sin excepciones de JavaScript.
- **Prioridad:** P2 (Visualización)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Precondiciones:**
  - Sesión activa con `zztest-admin@example.com`.
- **Pasos de Ejecución:**
  1. En la barra de navegación lateral, hacer clic en "Reportes" (`sidebar-link-reports`).
  2. Verificar que la URL cambie a `http://localhost:3000/reports`.
  3. Observar la presencia de los filtros de período y secciones de métricas operativas y comerciales.
- **Resultado Esperado:**
  - La página carga con éxito sin errores en la consola del navegador.
- **Datos que crea:** Ninguno.

---

### TC-USER-01: Despliegue de opciones en el menú de usuario de TopNav
- **Módulo / Funcionalidad:** Configuración / Menú de Usuario
- **Objetivo:** Verificar la apertura del desplegable de usuario en la cabecera superior con sus accesos correspondientes.
- **Prioridad:** P2 (UI y Navegación)
- **Ejecutor:** CHROME
- **Datos de test usados:** N/A.
- **Pasos de Ejecución:**
  1. En el extremo superior derecho, hacer clic en el botón de usuario (`topnav-user-menu-trigger`).
  2. Comprobar que se despliegue el menú con las opciones:
     - Cambiar Contraseña (`topnav-link-change-password`).
     - Configuración (`topnav-link-settings`).
     - Cerrar Sesión (`topnav-btn-logout`).
- **Resultado Esperado:**
  - El menú emergente se muestra claramente sobre los demás elementos.
- **Datos que crea:** Ninguno.

---

### TC-USER-02: Verificación de cambio de contraseña simulado (Discrepancia D-08)
- **Módulo / Funcionalidad:** Configuración / Cambio de Contraseña
- **Objetivo:** Evaluar el formulario de cambio de contraseña y documentar si la mutación conecta con Supabase Auth o es una simulación visual.
- **Prioridad:** P1 (Discrepancia de Seguridad D-08)
- **Ejecutor:** CHROME & SCRIPT
- **Datos de test usados:**
  - Contraseña nueva: `NuevaContrasenaSegura99!`
- **Pasos de Ejecución:**
  1. Hacer clic en "Cambiar Contraseña" (`topnav-link-change-password`).
  2. Completar los campos de contraseña actual y nueva contraseña.
  3. Enviar el formulario.
  4. Intentar iniciar sesión con la contraseña nueva.
- **Resultado Esperado:**
  - Si el login con la nueva contraseña falla y sigue requiriendo la anterior, confirmar la Discrepancia **D-08** (el componente muestra mensaje de éxito pero no ejecuta `supabase.auth.updateUser({ password: ... })`).
- **Datos que crea:** Ninguno.


<!-- FIN DE docs/test-cases/09-reportes-y-notificaciones.md -->

---



<!-- INICIO DE docs/test-cases/PLANTILLA-REPORTE.md -->

# Plantilla Estructurada de Reporte de Ejecución (QA AI Agent)

Esta plantilla define el formato estandarizado que el agente de IA en browser (Claude in Chrome u otro ejecutor automatizado) debe generar tras ejecutar cada caso de prueba o suite completa.

---

## 1. Encabezado de la Sesión de Pruebas

```markdown
# Reporte de Ejecución de Pruebas QA - MTS Gestión Logística

- **Fecha y Hora de Inicio:** YYYY-MM-DD HH:MM:SS (UTC-3)
- **Fecha y Hora de Fin:** YYYY-MM-DD HH:MM:SS (UTC-3)
- **Ejecutor:** Agente Browser (Claude in Chrome) / Script de Servicio
- **Ambiente:** Localhost:3000 -> Supabase Pre-lanzamiento
- **Usuario de Sesión:** zztest-admin@example.com / zztest-auditor@example.com
- **Versión/Commit del Código:** <git-commit-hash>
- **Modo de Correo (Brevo):** MOCK SEGURO (BREVO_API_KEY="")
```

---

## 2. Resumen Métrico de Ejecución

```markdown
| Total Casos | Aprobados (PASS) | Fallidos (FAIL) | Bloqueados (BLOCKED) | Tasa de Éxito |
| :---: | :---: | :---: | :---: | :---: |
| 45 | 42 | 2 | 1 | 93.3% |
```

---

## 3. Formato Detallado por Caso de Prueba

Para cada caso ejecutado, el agente debe reportar un bloque con la siguiente estructura exacta:

### Ejemplo: Caso Exitoso (PASS)

```markdown
### [PASS] TC-AUTH-01 · Inicio de sesión exitoso con credenciales válidas
- **Módulo:** Autenticación y Control de Acceso
- **Prioridad:** P0
- **Ejecutor:** CHROME
- **Resultado:** PASS
- **URL Final:** http://localhost:3000/
- **Valores Observados:**
  - Botón o avatar con iniciales visible en la barra superior.
  - Título visible: "Tablero Principal".
- **Errores de Consola:** Ninguno.
- **Observaciones:** Redirección automática ejecutada en < 1.5s.
```

---

### Ejemplo: Caso Fallido (FAIL)

```markdown
### [FAIL] TC-DAILY-04 · Cálculo de turno nocturno que cruza a sábado post-13:00
- **Módulo:** Carga Diaria de Horas
- **Prioridad:** P0
- **Ejecutor:** CHROME
- **Resultado:** FAIL
- **Paso donde falló:** Paso 6: Verificación de horas en la tabla de turnos.
- **URL Final:** http://localhost:3000/daily-entry
- **Valor Esperado:** 
  - Hs Norm: 0.0
  - Hs 50%: 0.0
  - Hs 100%: 8.0 (Cálculo: Turno sábado 12:00 a 20:00 -> 1h pre-13:00 normal, 7h post-13:00 al 100%)
- **Valor Observado:** 
  - Hs Norm: 8.0
  - Hs 50%: 0.0
  - Hs 100%: 0.0
- **Texto / Pantalla Visto:**
  - Fila del operario "ZZTEST-Operario Juan Pérez" muestra "8.0" en columna verde "Hs. Norm" y "0.0" en columna "Hs. 100%".
- **Errores de Consola Observados:** Ninguno.
- **Causa Raíz Identificada:** Discrepancia D-01 documentada en DISCREPANCIAS.md (`calculateShiftHours` no segmenta correctamente el cruce de corte).
```

---

### Ejemplo: Caso Bloqueado (BLOCKED)

```markdown
### [BLOCKED] TC-INV-08 · Caducidad automática de proforma a los 5 días
- **Módulo:** Facturación y Proformas
- **Prioridad:** P1
- **Ejecutor:** SCRIPT
- **Resultado:** BLOCKED
- **Paso donde falló:** Paso 1: Disparo del cron de caducidad.
- **URL / Endpoint:** /api/cron/expire-proformas
- **Valor Esperado:** Endpoint retorna 200 y actualiza proforma de 'sent' a 'approved'.
- **Valor Observado:** HTTP 404 Not Found (Ruta no existe en Next.js).
- **Causa Raíz:** Discrepancia D-04 documentada en DISCREPANCIAS.md (el cron job no está implementado en la aplicación).
```

---

## 4. Estructura de Campos Obligatorios para Automatización

Todo reporte parseable por otras IAs debe respetar este esquema JSON opcional o campos clave en Markdown:

```json
{
  "test_id": "TC-AUTH-01",
  "module": "Autenticación",
  "status": "PASS | FAIL | BLOCKED",
  "failed_step": null,
  "expected": "Texto o valor exacto",
  "actual": "Texto o valor visto en pantalla",
  "final_url": "http://localhost:3000/...",
  "console_errors": [],
  "notes": "Comentarios de ejecución"
}
```


<!-- FIN DE docs/test-cases/PLANTILLA-REPORTE.md -->

---

