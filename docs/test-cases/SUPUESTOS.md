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
