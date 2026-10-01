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
> **REGLA DE SEGURIDAD N° 1:** `BREVO_API_KEY` **DEBE permanecer vacía**. Con esta variable vacía, [`src/lib/brevo/client.ts`](file:///home/carluis/Work/dibrand/mts/src/lib/brevo/client.ts#L97) intercepta cualquier intento de envío, emite un aviso por consola y retorna `{ success: true, mocked: true }` sin conectar con los servidores de Brevo.

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

Dado que los cron jobs no están configurados como endpoints automáticos en `/api/cron/*` (ver [DISCREPANCIAS.md](file:///home/carluis/Work/dibrand/mts/docs/test-cases/DISCREPANCIAS.md)), se documenta cómo probar los flujos asociados manualmente:

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
