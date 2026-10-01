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
