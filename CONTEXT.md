# CONTEXT.md - MTS Gestión Logística (Dibrand)

Este documento es la **fuente única de verdad** sobre el estado, arquitectura, diseño y reglas del proyecto MTS Gestión Logística. Se actualiza continuamente ante cualquier cambio.

---

## 📌 Visión General del Proyecto
Plataforma web moderna orientada a automatizar la gestión operativa diaria, facturación divisible quincenal (Plazoleta Fiscal) y liquidación de sueldos para **MTS Logística**. Reemplaza el uso de múltiples hojas de cálculo desconectadas por un sistema inteligente con visibilidad en tiempo real.

---

## 🛠️ Tech Stack & Arquitectura
- **Frontend & Server Components:** Next.js 15+ (App Router, Server Actions, React Server Components).
- **Backend & Database:** Supabase PostgreSQL 17 (Auth, RLS, Storage Buckets).
- **Cliente Supabase:** `@supabase/ssr` (manejo de sesiones en Server, Browser y Middleware).
- **Estilos & UI:** Tailwind CSS v4, Lucide Icons.
- **Validaciones & Tipado:** TypeScript (Modo Estricto 100% en Inglés para el esquema de la DB y código) + Zod.
- **Alertas & Automatizaciones:** Cron Jobs (Vercel/Supabase) + API de Brevo (Sendinblue) para cobro de facturas.
- **Hosting:** Vercel + Supabase Local (Docker) para desarrollo.

---

## 🎨 Diseño e Interfaz (UI/UX - `stitch_mts`)
El diseño se rige estrictamente por la especificación de `stitch_mts/DESIGN.md`:
- **App Shell Layout Inmutable:** Sidebar maestro (`#0F2547`) y TopNav superior. El contenido dinámico se inyecta en `MainContent` (`#F8FAFC`).
- **Alto Contraste B2B:** Formularios/Tarjetas de carga rápida en celeste (`#0EA5E9`) con inputs en blanco puro (`#FFFFFF`) y bordes oscuros (`#0F2547`).
- **Paneles Slideovers:** Creación y edición masiva mediante paneles laterales superpuestos para no perder contexto de las grillas.
- **Página de Login:** Split layout con background overlay Azul Puerto (`#2b56a3` / `#1E5BB4`) y acreditación *"Desarrollado por Dibrand"*.

---

## 🗄️ Esquema de Base de Datos PostgreSQL (100% Inglés)

### 1. Perfiles y Enums
- `profiles`: `id`, `full_name`, `role` (`admin` | `accounting_auditor`).
- `app_role`: `'admin'`, `'accounting_auditor'`.
- `location_status`: `'active'`, `'maintenance'`, `'inactive'`.
- `employee_status`: `'active'`, `'inactive'`, `'on_leave'`.
- `proforma_concept_type`: `'general_hours'`, `'shuttles'`, `'export_tallymen'`.
- `proforma_status`: `'draft'`, `'sent'`, `'approved'`, `'invoiced'`, `'paid'`, `'overdue'`.
- `invoice_status`: `'pending'`, `'paid'`.
- `expense_type`: `'fixed'`, `'variable'`.

### 2. Catálogos y Mantenedores (ABMs)
- `clients`: `company_name`, `tax_id` (CUIT), `billing_email`, `phone_number`, `payment_due_days` (default 15), `is_active`.
- `locations`: `code` (ej. LOC-001), `name`, `port_city`, `capacity`, `status`.
- `positions`: `name`, `requires_vehicle_bonus`.
- `hour_types`: `code` (REGULAR, OVERTIME_50, OVERTIME_100), `description`.
- `client_position_rates`: `client_id`, `position_id`, `hour_type_id`, `hourly_rate`, `effective_from`.
- `union_bonus_scales`: `min_vehicles`, `max_vehicles`, `bonus_amount`, `effective_from`.
- `employees`: `national_id` (DNI), `file_number` (Legajo), `tax_id` (CUIL), `full_name`, `default_position_id`, `phone_number`, `status`.
- `expense_categories`: `name`, `type`.
- `expenses`: `category_id`, `description`, `amount`, `expense_date`.

### 3. Operaciones Diarias (Transaccional)
- `daily_work_logs`: `work_date`, `client_id`, `location_id`, `total_vehicles_handled`, `is_export_day` (boolean), `logged_by`.
- `daily_staff_entries`: `daily_work_log_id`, `employee_id`, `position_id`, `shift_start_time`, `shift_end_time`, `regular_hours`, `overtime_50_hours`, `overtime_100_hours`, `shuttles_count`, `plus_delta_amount`, `meal_allowance_count`, `advance_payment_amount`, `is_day_off`, `bonus_applied_amount`.

### 4. Facturación, Proformas y ARCA
- `proformas`: `proforma_number`, `client_id`, `fortnight_period` (ej. '2026-08-Q1'), `concept_type`, `status`, `subtotal`, `total`, `public_token` (UUID público), `issue_date`, `due_date`.
- `proforma_details`: `proforma_id`, `description`, `quantity`, `unit_price`, `subtotal`.
- `tax_invoices`: `proforma_id`, `invoice_number`, `pdf_storage_path` (Bucket Supabase), `invoiced_amount`, `status` (`pending` | `paid`), `invoice_date`.

---

## ⚡ Reglas Críticas de Negocio

1. **Ordenamiento de Grillas Operativas:**
   - Toda tabla de horas trabajadas se ordena estrictamente por `work_date ASC` (fecha de la operación), ignorando `created_at`.
2. **Retención de Memoria en Carga Diaria:**
   - Al guardar un empleado en un turno, se conservan fecha, cliente, ubicación y rango horario; solo se blanquea el selector de empleado (con Typeahead). Se limpia al presionar "Finalizar Turno".
3. **Remises:**
   - Se ingresan como cantidad (unidades) exclusivamente al encargado del turno.
4. **Solapamiento de Horarios:**
   - Se permite cargar turnos superpuestos para el mismo operario en un mismo día.
5. **División de Proformas (Plazoleta Fiscal):**
   - Se generan 3 borradores por quincena: 
     a) Horas trabajadas.
     b) Remises utilizados.
     c) Apuntadores asignados en días con `is_export_day = true`.
6. **Caducidad de Proforma:**
   - Pasa de `sent` a `approved` automáticamente tras 5 días corridos sin objeciones.
7. **Control de Cobranzas (Cron Job 00:00 hs):**
   - Evalúa `payment_due_days` del cliente vs. fecha de emisión de factura `pending` y envía alertas por Brevo a los -3 días, día 0 y posvencimiento.

---

## 📂 Estructura del Código Actual

```text
src/
├── app/
│   ├── (dashboard)/                   # Route Group con App Shell compartida (Sidebar, TopNav, Footer)
│   │   ├── layout.tsx                 # Contenedor maestro del Dashboard
│   │   ├── page.tsx                   # Ruta raíz (/): Tablero Principal / Dashboard Operativo
│   │   ├── cash-flow/                 # /cash-flow
│   │   ├── change-password/           # /change-password
│   │   ├── clients/                   # /clients
│   │   ├── daily-entry/               # /daily-entry
│   │   ├── employees/                 # /employees
│   │   ├── invoicing/                 # /invoicing
│   │   ├── locations/                 # /locations
│   │   ├── payroll/                   # /payroll
│   │   ├── rates/                     # /rates
│   │   ├── reports/                   # /reports
│   │   └── settings/                  # /settings
│   ├── login/
│   │   └── page.tsx                   # Ruta /login aislada del App Shell
│   └── globals.css                    # Variables CSS B2B y Tailwind v4
├── components/
│   └── layout/
│       ├── Sidebar.tsx                # Menú lateral maestro inmutable
│       ├── TopNav.tsx                 # Barra superior maestra con buscador y desplegable
│       └── Footer.tsx                 # Pie de página maestro (stitch_mts/pie-de-pagina)
├── lib/
│   └── supabase/
│       ├── client.ts                  # createBrowserClient (@supabase/ssr)
│       └── server.ts                  # createServerClient (@supabase/ssr)
└── types/
    └── database.types.ts              # Tipos TypeScript derivados de la DB en inglés
supabase/
├── migrations/
│   └── 20260801000000_initial_schema.sql  # Esquema relacional SQL completo + RLS
└── config.toml                        # Configuración de Supabase Local
```

---

## 📌 Historial de Cambios Recientes
- **2026-08-04:** Reestructuración de la arquitectura de rutas con Route Groups de Next.js App Router `src/app/(dashboard)`. La URL raíz `/` es ahora el **Tablero Principal / Dashboard Operativo**, y todas las vistas operativas conviven directamente bajo la raíz (`/daily-entry`, `/payroll`, `/invoicing`, `/rates`, `/cash-flow`, `/employees`, `/locations`, `/clients`, `/reports`, `/settings`, `/change-password`).
- **2026-08-04:** Maquetación e integración de la pantalla **Modificación de Contraseña** (`/change-password`) con validación visual interactiva de requisitos de seguridad, medidor de fortaleza y toggles de visibilidad.
- **2026-08-04:** Alineación exacta de la **Barra Superior** (`TopNav.tsx`) con la especificación `stitch_mts/barra-superior` (buscador central con atajo `⌘K`, botón de notificaciones con alerta, acceso a configuración y menú desplegable del perfil de usuario).
- **2026-08-04:** Creación e integración global del **Pie de Página Maestro** (`Footer.tsx`) en el `DashboardLayout`, respetando la especificación exacta de `stitch_mts/pie-de-pagina`.
- **2026-08-04:** Ajuste del estilo del `Sidebar` a la paleta oficial de `stitch_mts/menu-lateral` (fondo azul claro `#d7e2ff`, íconos e ítems `#4b5e84`, activo y CTA en `#1e5bb4`).
- **2026-08-04:** Integración del logo oficial `/mts_logo.png` en la cabecera del `Sidebar` y en el formulario de `Login`.
- **2026-08-04:** Maquetación exacta según los diseños de `stitch_mts` para las pantallas operativas con paneles *Slide-over* interactivos para altas/ediciones.
- **2026-08-04:** Ampliación del esquema SQL en Supabase (`20260804000000_add_system_settings.sql`) agregando las tablas `company_settings` y `master_variables` (100% en inglés con RLS).
- **2026-08-04:** Traducción de toda la interfaz visual y menú lateral a español manteniendo el código fuente y modelos DB en inglés.
- **2026-08-04:** Implementación de diseño responsive-first con menú drawer deslizable en móviles/tablets y corrección de desborde/scroll horizontal.
- **2026-08-01:** Creación e inicialización del proyecto Next.js 15, Tailwind v4 y `@supabase/ssr`.
- **2026-08-01:** Implementación de migración SQL relacional 100% en inglés con soporte para RLS por roles (`admin` y `accounting_auditor`).
- **2026-08-01:** Integración del diseño visual `stitch_mts`: Login Split y App Shell Layout (`Sidebar`, `TopNav`, `MainContent` con tokens B2B).
- **2026-08-01:** Actualización del esquema relacional con tablas de `locations`, `expenses`, `expense_categories`, campos para `is_export_day`, `payment_due_days` y desglose de horas/turnos.
- **2026-08-01:** Creación del archivo `CONTEXT.md` para seguimiento continuo.
