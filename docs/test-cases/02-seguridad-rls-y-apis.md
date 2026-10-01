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
