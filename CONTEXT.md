# CONTEXT.md - MTS Gestión Logística (Dibrand)

Este documento es la **bitácora técnica y de arquitectura viva** sobre el estado, infraestructura, diseño y evolución técnica de MTS Gestión Logística.
> **Fuente de Verdad Funcional:** Para el desglose detallado de reglas de negocio, métricas y runbooks operativos bajo el estándar Open Knowledge Format (OKF), consultar la base de conocimiento en [`knowledge/index.md`](file:///home/carluis/Work/dibrand/mts/knowledge/index.md).

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
El diseño se rige estrictamente por la especificación de [`stitch_mts/DESIGN.md`](file:///home/carluis/Work/dibrand/mts/stitch_mts/DESIGN.md):
- **App Shell Layout Inmutable:** Sidebar maestro (`#0F2547`) y TopNav superior. El contenido dinámico se inyecta en `MainContent` (`#F8FAFC`).
- **Alto Contraste B2B:** Formularios/Tarjetas de carga rápida en celeste (`#0EA5E9`) con inputs en blanco puro (`#FFFFFF`) y bordes oscuros (`#0F2547`).
- **Paneles Slideovers:** Creación y edición masiva mediante paneles laterales superpuestos para no perder contexto de las grillas.
- **Página de Login:** Split layout con background overlay Azul Puerto (`#2b56a3` / `#1E5BB4`) y acreditación *"Desarrollado por Dibrand"*.

---

## 🗄️ Esquema de Base de Datos PostgreSQL (100% Inglés)
*Especificación modular detallada por dataset en [`knowledge/datasets/`](file:///home/carluis/Work/dibrand/mts/knowledge/datasets/) y tipado en [`src/types/database.types.ts`](file:///home/carluis/Work/dibrand/mts/src/types/database.types.ts).*

### 1. Perfiles y Enums
- `profiles`: `id`, `full_name`, `email`, `role` (`admin` | `accounting_auditor`), `is_active` (`BOOLEAN DEFAULT true`), `created_at`.
- `app_role`: `'admin'`, `'accounting_auditor'`.
- `location_status`: `'active'`, `'maintenance'`, `'inactive'`.
- `employee_status`: `'active'`, `'inactive'`, `'on_leave'`.
- `proforma_concept_type`: `'general_hours'`, `'shuttles'`, `'export_tallymen'`.
- `proforma_status`: `'draft'`, `'sent'`, `'approved'`, `'invoiced'`, `'paid'`, `'overdue'`.
- `invoice_status`: `'pending'`, `'paid'`.
- `cash_movement_type`: `'income'`, `'expense'`.
- `expense_type`: `'fixed'`, `'variable'`.

### 2. Catálogos y Mantenedores (ABMs)
- `clients`: `company_name`, `tax_id` (CUIT), `billing_email`, `phone_number`, `payment_due_days` (default 15), `overdue_reminder_cadence_days` (default 3), `is_active`.
- `locations`: `code` (ej. LOC-001), `name`, `port_city`, `status`.
- `positions`: `name`, `requires_vehicle_bonus`, más tarifas de sueldo de bolsillo (`hourly_rate_regular`, `hourly_rate_overtime_50`, `hourly_rate_overtime_100`, `salary_effective_from`).
- `hour_types`: `code` (`REGULAR`, `OVERTIME_50`, `OVERTIME_100`), `description`.
- `client_position_rates`: `client_id`, `position_id`, `hour_type_id`, `hourly_rate`, `effective_from` *(Tarifario comercial facturable)*.
- `union_bonus_scales`: `min_vehicles`, `max_vehicles`, `bonus_amount`, `effective_from` *(Escalas CCT por buque)*.
- `employees`: `national_id` (DNI), `file_number` (Legajo), `tax_id` (CUIL), `full_name`, `default_position_id`, `phone_number`, `status`, más valores de sueldo individuales (`hourly_rate_regular`, `hourly_rate_overtime_50`, `hourly_rate_overtime_100`, `salary_effective_from`).
- `expense_categories`: `name`, `type`.
- `expenses`: `category_id`, `description`, `amount`, `expense_date`.
- `cash_movements`: `movement_date`, `type` (`income` | `expense`), `area`, `detail`, `amount`, `created_by`.
- `projected_obligations`: `due_date`, `type`, `category` (ARCA, ARBA, Sueldos, Proveedores), `title`, `amount`, `status`, `notes`.

### 3. Operaciones Diarias (Transaccional)
- `daily_work_logs`: `work_date`, `client_id`, `location_id`, `total_vehicles_handled`, `is_export_day` (boolean), `logged_by`.
- `daily_staff_entries`: `daily_work_log_id`, `employee_id`, `position_id`, `shift_start_time`, `shift_end_time`, `regular_hours`, `overtime_50_hours`, `overtime_100_hours`, `shuttles_count`, `plus_delta_amount`, `meal_allowance_count`, `advance_payment_amount`, `is_day_off`, `day_off_count`, `bonus_applied_amount`.

### 4. Facturación, Proformas, ARCA y Cobranzas
- `proformas`: `proforma_number`, `client_id`, `fortnight_period` (ej. '2026-08-Q1'), `concept_type`, `status`, `subtotal`, `total`, `public_token` (UUID público), `issue_date`, `due_date`.
- `proforma_details`: `proforma_id`, `description`, `quantity`, `unit_price`, `subtotal`.
- `tax_invoices`: `proforma_id`, `invoice_number`, `pdf_storage_path` (Bucket Supabase), `invoiced_amount`, `status` (`pending` | `paid`), `invoice_date`, `last_reminder_sent_at`, `last_reminder_type`, `reminders_sent_count`.
- `invoice_reminder_logs`: `tax_invoice_id`, `reminder_type` (`upcoming_3_days`, `due_today`, `overdue`), `sent_date`, `recipient_email`, `status`, con clave única `UNIQUE(tax_invoice_id, reminder_type, sent_date)`.

---

## ⚡ Reglas Críticas de Negocio
*El detalle de políticas operacionales y cálculos está centralizado en [`knowledge/rules/`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/) y [`knowledge/metrics/`](file:///home/carluis/Work/dibrand/mts/knowledge/metrics/).*

1. **Ordenamiento de Grillas Operativas:**
   - Toda tabla de horas trabajadas se ordena estrictamente por `work_date ASC` (fecha de la operación), ignorando `created_at`.
2. **Retención de Memoria en Carga Diaria:** ([`retencion_memoria_carga_diaria.md`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/retencion_memoria_carga_diaria.md))
   - Al guardar un empleado en un turno, se conservan fecha, cliente, ubicación y rango horario; solo se blanquea el selector de empleado (con Typeahead). Se limpia al presionar "Finalizar Turno".
3. **Bonificación Gremial por Vehículos (CCT):** ([`bonificacion_gremial.md`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/bonificacion_gremial.md))
   - Cálculo automático e invisible del plus salarial según `total_vehicles_handled` en buque para puestos con `requires_vehicle_bonus = true`.
4. **División de Proformas Quincenales:** ([`cierre_quincenal_proformas.md`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/cierre_quincenal_proformas.md))
   - Se generan 3 borradores por cliente y quincena (Q1 del 1-15 y Q2 del 16-fin de mes): `general_hours`, `shuttles` y `export_tallymen`.
5. **Caducidad y Aprobación Tácita de Proforma:** ([`cierre_quincenal_proformas.md`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/cierre_quincenal_proformas.md))
   - Pasa de `sent` a `approved` automáticamente tras 5 días corridos sin objeciones del cliente.
6. **Control de Cobranzas Automáticas (API Brevo):** ([`control_vencimientos_brevo.md`](file:///home/carluis/Work/dibrand/mts/knowledge/rules/control_vencimientos_brevo.md))
   - Cron diario a medianoche (00:00 hs ART = 03:00 UTC) evaluando `payment_due_days`. Disparadores: -3 días (`upcoming_3_days`), Día 0 (`due_today`) y posvencimiento (`overdue`). Idempotencia con `invoice_reminder_logs`.
7. **Remises:**
   - Se ingresan como cantidad (unidades) exclusivamente al encargado del turno.
8. **Solapamiento de Horarios:**
   - Se permite cargar turnos superpuestos para el mismo operario en un mismo día.

---

## 📂 Estructura del Código Actual

```text
src/
├── app/
│   ├── (dashboard)/                   # Route Group con App Shell compartida (Sidebar, TopNav, Footer)
│   │   ├── layout.tsx                 # Contenedor maestro del Dashboard (Metadata: Tablero Principal)
│   │   ├── page.tsx                   # Ruta raíz (/): Tablero Principal & Flujo de Caja (stitch_mts/Dashboard)
│   │   ├── cash-flow/                 # /cash-flow - Movimientos de caja y conciliaciones
│   │   │   └── projections/           # /cash-flow/projections - Proyecciones financieras con saldo dinámico
│   │   ├── change-password/           # /change-password - Actualización de credenciales
│   │   ├── clients/                   # /clients - ABM de Clientes y plazos de pago
│   │   ├── daily-entry/               # /daily-entry - Carga diaria de horas con memoria de turno y buques
│   │   ├── employees/                 # /employees - Personal, puestos asignados y auditoría de turnos
│   │   ├── invoicing/                 # /invoicing - Emisión y liquidación transaccional de proformas
│   │   │   └── due-reminders/         # /invoicing/due-reminders - Monitor y auditoría de cobranzas Brevo
│   │   ├── locations/                 # /locations - Lugares de Trabajo portuarios
│   │   ├── payroll/                   # /payroll - Liquidación de jornales y haberes
│   │   ├── positions/                 # /positions - Puestos de Trabajo y tarifas salariales de bolsillo
│   │   ├── rates/                     # /rates - Tarifario Comercial de Clientes y Escalas CCT
│   │   ├── reports/                   # /reports - Centro de reportes y exportaciones
│   │   ├── settings/                  # /settings - Parámetros generales y cadencia de mora
│   │   └── users/                     # /users - Gestión de Usuarios, Roles (admin/contable) y estados
│   ├── p/[token]/                     # Consulta pública de proformas sin login
│   ├── proforma/[token]/              # Enlace alternativo público de proforma
│   ├── login/
│   │   ├── layout.tsx                 # Metadata: Iniciar Sesión
│   │   └── page.tsx                   # Ruta /login aislada del App Shell
│   ├── layout.tsx                     # Root Layout con plantilla de metadatos %s | MTS Gestión Logística
│   └── globals.css                    # Variables CSS B2B y Tailwind v4
├── components/
│   └── layout/
│       ├── Sidebar.tsx                # Menú lateral maestro inmutable
│       ├── TopNav.tsx                 # Barra superior maestra con buscador y desplegable
│       └── Footer.tsx                 # Pie de página maestro (stitch_mts/pie-de-pagina)
├── lib/
│   ├── brevo/                         # Módulo de correos con Brevo API v3 y EmailBuilder
│   │   ├── builder.ts                 # EmailBuilder fluido con componentes B2B
│   │   ├── client.ts                  # Cliente Brevo HTTP con mock y normalizador
│   │   ├── index.ts                   # Barril de exportación público
│   │   ├── service.ts                 # Servicios de alto nivel (sendEmail, sendProforma, etc.)
│   │   ├── templates.ts               # Plantillas para proformas, cobranzas y avisos
│   │   └── types.ts                   # Tipado estricto TS para el módulo de correo
│   ├── services/
│   │   ├── cash-flow.ts               # CRUD de Movimientos de Flujo de Caja
│   │   ├── clients.ts                 # CRUD de Clientes
│   │   ├── daily-entries.ts           # Turnos, horas transaccionales y cálculo automático
│   │   ├── employees.ts               # CRUD de Empleados y auditoría de horas
│   │   ├── invoice-reminders.ts       # Cron y evaluación de vencimientos de facturas
│   │   ├── invoicing.ts               # Proformas, facturación y cruce de tarifas
│   │   ├── locations.ts               # CRUD de Lugares de Trabajo
│   │   ├── positions.ts               # CRUD de Puestos de Trabajo, asignación de personal y salarios
│   │   ├── projections.ts             # Obligaciones proyectadas y saldos acumulados
│   │   ├── rates.ts                   # CRUD de Tarifario Comercial y tipos de hora
│   │   └── union-scales.ts            # Escalas CCT y bonificaciones
│   └── supabase/
│       ├── client.ts                  # createBrowserClient (@supabase/ssr)
│       └── server.ts                  # createServerClient (@supabase/ssr)
└── types/
    └── database.types.ts              # Tipos TypeScript derivados de la DB en inglés
supabase/
├── migrations/                        # Migraciones SQL incrementales con RLS
└── config.toml                        # Configuración de Supabase Local
```

---

## 📌 Historial de Cambios Recientes
- **2026-10-07:** Implementación de **Sueldos Desacoplados del Tarifario Comercial y Alineación de Documentación (OKF)**:
  1. **Valores Hora de Bolsillo para Liquidación de Personal:** Migraciones `20261007200000_add_salary_rates_to_positions.sql` y `20261007210000_add_salary_rates_to_employees.sql` incorporando columnas de sueldo (`hourly_rate_regular`, `hourly_rate_overtime_50`, `hourly_rate_overtime_100`, `salary_effective_from`) pre-sembradas con los salarios oficiales de Excel (Encargados: $10.777,06 / $16.165,60 / $21.554,13; Apuntadores: $8.983,68 / $13.475,53 / $17.967,37). Desacopla el costo salarial interno del tarifario comercial facturado a clientes (`client_position_rates`).
  2. **Especialización y Alineación Documental (Opción 1):** Establecimiento formal de [`knowledge/`](file:///home/carluis/Work/dibrand/mts/knowledge) como fuente única de verdad funcional (Open Knowledge Format) y `CONTEXT.md` como bitácora técnica de arquitectura y changelog. Normalización de identificadores de recordatorios Brevo a `upcoming_3_days`, documentación del dataset `projected_obligations` y adición del seguimiento de francos compensatorios (`day_off_count`).
- **2026-10-02:** Implementación del **Control Automático de Vencimientos de Facturas y Cron de Cobranzas (API Brevo)**:
  1. **Ejecución Diaria Programada (00:00 hs ART):** Configuración de `vercel.json` con cron diario a las 03:00 UTC (00:00 hs Buenos Aires) apuntando a `/api/cron/check-due-invoices` (con alias `/api/cron/invoice-reminders`), y Supabase Edge Function en `supabase/functions/check-due-invoices/index.ts`.
  2. **Motor de Evaluación de Vencimientos y Cruce Comercial (`src/lib/services/invoice-reminders.ts`):** Lectura transaccional de comprobantes fiscales `tax_invoices` con estado `pending`, cálculo de fecha de vencimiento sumando los `payment_due_days` del cliente correspondiente y evaluación precisa de diferencias de días.
  3. **Disparador Inteligente de Correos vía Brevo (`src/lib/brevo/`):**
     - **-3 Días:** Disparo de *"Aviso de Próximo Vencimiento"* (asunto y preheader de recordatorio previo, badge `AVISO DE PAGO PRÓXIMO`).
     - **Día 0:** Disparo de *"Vencimiento Hoy"* (badge `VENCE HOY`, recordatorio de regularización en el día de la fecha).
     - **Factura Vencida (+N Días):** Disparo de *"Aviso de Factura Vencida"* (badge `FACTURA VENCIDA (+N DÍAS)`, datos de cuenta bancaria y enlace de consulta) con cadencia de repetición parametrizada (por defecto cada 3 días, configurable por cliente o globalmente).
  4. **Protección de Idempotencia y Registro de Auditoría:** Migración `20261002020000_invoice_reminders_and_cron.sql` con tabla `invoice_reminder_logs` protegida por clave única diaria `(tax_invoice_id, reminder_type, sent_date)` para garantizar que ningún cliente reciba correos duplicados en el mismo día, y columnas `last_reminder_sent_at`, `last_reminder_type`, `reminders_sent_count` en `tax_invoices`.
  5. **Panel Interactivo de Control y Herramientas CLI:**
     - En Gestión de Facturación (`/invoicing`): Botón *"Control de Vencimientos"* con panel modal `InvoiceRemindersModal.tsx` para simular fechas (DRY-RUN), ejecutar controles manuales y visualizar el historial de envíos.
     - En Configuración del Sistema (`/settings`): Parametrización de la cadencia de reclamo mediante la variable maestra `OVERDUE_CADENCE_DAYS`.
     - Script CLI independiente: `scripts/check-due-invoices.ts` ejecutable vía `pnpm run cron:invoices` con opciones `--date`, `--cadence`, `--dry-run` y `--mock-db`.
  6. **Suite de Pruebas Automatizada (DoD):** Creación de `tests/scripts/test-invoice-reminders-cron.ts` verificando los 24 criterios de aceptación (cálculo de vencimiento por cliente, disparador -3 días, Día 0, cadencias de repetición cada 3 y 7 días, idempotencia y mocks Brevo) integrada en `tests/scripts/run-all-tests.ts`.
- **2026-10-02:** Implementación de **Escalas Dinámicas CCT y Cálculo Invisible de Bonificación Vehicular**:
  1. **Mantenedor de Escala Dinámica en Tarifario Comercial (`/rates`):** Incorporación de la 3ª pestaña *"Escalas CCT (Vehículos)"* en `/rates` (`src/components/rates/UnionBonusScalesTab.tsx`) para la administración completa (CRUD) de rangos de unidades (*Desde / Hasta*) y montos monetarios asociados según CCT. Incluye panel *Slide-over* con diseño de alto contraste B2B (`#0EA5E9`), inputs blancos con borde `#0F2547`, tabla paginada y modal de confirmación para bajas.
  2. **Cálculo Invisible en Carga Operativa (`/daily-entry`):** Campo interactivo `Unidades Operadas` (`total_vehicles_handled`) en la sección de buques del panel lateral de turnos. Al ingresar la cantidad de unidades, el sistema determina automáticamente en tiempo real el nivel salarial correspondiente desde `union_bonus_scales` y lo asigna de forma silenciosa e invisible en la base de datos a `bonus_applied_amount` para puestos con `requires_vehicle_bonus = true` (ej: *Encargado*), dejando en `$ 0` los puestos sin plus vehicular (ej: *Apuntador*).
  3. **Persistencia y Base de Datos:** Migración `20261002000000_union_scales_rls_and_seed.sql` con políticas de RLS para administradores y auditores, auto-sembrado inicial de escalas CCT en `supabase/seed.sql` y sincronización automática de entradas existentes ante actualizaciones del volumen de buque en `src/lib/services/daily-entries.ts`.
  4. **Servicios y Validación:** Creación de `src/lib/services/union-scales.ts`, esquemas Zod en `src/lib/schemas/union-scales.ts`, query keys en `queryKeys.ts`, tipos en `src/types/database.types.ts` y suite automatizada de pruebas `tests/scripts/test-union-scales.ts` integrada en `run-all-tests.ts`.
- **2026-10-02:** Implementación del Módulo Independiente de **Proyecciones de Flujo de Caja** (`/cash-flow/projections`):
  1. **Navegación e Interfaz Dedicada:** Pantalla de proyección financiera accesible exclusivamente desde `/cash-flow` a través del botón *"Ver Proyecciones"* en cabecera, con botón de retorno *"Volver a Flujo de Caja"*, respetando la jerarquía modular sin alterar `Sidebar.tsx`.
  2. **Selector de Fecha de Corte ("Saldo para fecha X"):** Selector de fecha objetivo interactivo en tarjeta Celeste B2B (`#0EA5E9`) con botones de preset rápido (*Fin de Mes*, *Próxima Quincena*, *Fin Próximo Mes*, *+30 Días*), que recalcula en tiempo real el saldo acumulado hasta la fecha límite seleccionada.
  3. **Grilla Cronológica Ascendente (`ASC`) y Saldo Progresivo:** Tabla unificada con ordenamiento automático por fecha ascendente que consolida Facturación por cobrar (`tax_invoices` y `proformas`) y egresos programados (Sueldos, ARCA, ARBA, IVA, Comisiones). Columna `SALDO` que suma ingresos y resta egresos de forma progresiva, culminando en el saldo proyectado final a la fecha seleccionada.
  4. **Persistencia en Supabase:** Migración `20261002000000_add_projected_obligations.sql` con tabla `projected_obligations` y RLS para `admin` y `accounting_auditor`. Panel *Slide-over* interactivo para programar y editar obligaciones tributarias y comerciales futuras.
  5. **Capa de Servicios y Tipos:** Implementación de `src/lib/services/projections.ts`, query keys en `queryKeys.ts` y tipado estricto en `database.types.ts`.
- **2026-09-24:** Implementación integral del CRUD de Puestos de Trabajo (`/positions`), Asignación de Personal y Vinculación al Tarifario Comercial por Cliente:
  1. **Capa de Servicios (`src/lib/services/positions.ts`):** 
     - Funciones tipadas para lectura enriquecida (`getPositionsWithDetails`), creación (`createPosition`), actualización (`updatePosition`) y eliminación segura (`deletePosition` con protección contra borrado si el puesto ya cuenta con turnos en `daily_staff_entries`).
     - Asignación masiva y desasignación de colaboradores (`bulkAssignEmployeesToPosition`, `getAllEmployeesForPositionAssignment`).
     - Gestión directa de tarifas horarias por cliente desde el puesto (`assignPositionClientRate`, `removePositionClientRate`).
  2. **Interfaz de Gestión de Puestos de Trabajo (`/positions`):**
     - Métricas KPI superiores (*Puestos Totales*, *Personal Asignado*, *Plus Vehicular CCT*, *Tarifas Activas en Clientes*).
     - Barra de búsqueda y filtros rápidos por aplicación de Plus Vehicular y estado de asignación de personal en tarjeta Celeste B2B (`#0EA5E9`).
     - Panel lateral *Slide-over* para creación y edición de puestos con toggle explicativo de Bonificación por Vehículos (CCT).
     - Modal interactivo de **Asignación de Personal** con buscador en tiempo real de colaboradores por Nombre/DNI/Legajo, badges de puesto actual y asignación por checkbox.
     - Modal de **Tarifario Comercial por Cliente** para visualizar tarifas horarias activas (Normal, Extra 50%, Extra 100%) y formulario rápido para cargar/actualizar tarifas por cliente con cálculo automático de horas extras.
     - Modal de confirmación de eliminación con advertencias de colaboradores y tarifas dependientes.
  3. **Integración con Navegación y Vistas Existentes:**
     - Agregado del ítem **Puestos de Trabajo** con icono `Briefcase` en `Sidebar.tsx`.
     - En **Tarifario Comercial (`/rates`)**: Botón de acceso directo a *Gestionar Puestos de Trabajo* y filtro desplegable por *Puesto Operativo* en la barra de búsqueda.
     - En **Gestión de Personal (`/employees`)**: Botón de acceso a *Puestos de Trabajo* en la cabecera y badges distintivos para el puesto asignado en la grilla de colaboradores.
  4. **Base de Datos y Rendimiento:**
     - Creación de la migración `20260924000000_positions_management.sql` con índices en `positions(name)`, `employees(default_position_id)` y `client_position_rates(position_id)`.
- **2026-10-02:** Implementación Integral de la Pantalla Interna de Gestión de Usuarios, Invitaciones y Asignación de Roles (Owner/Admin):
  1. **Restricción de Acceso (DoD 1):**
     - Pantalla interna accesible de forma exclusiva para usuarios con rol máximo de "Owner/Administrador Principal" (`admin`).
     - Protección multicapa: Middleware (`src/lib/supabase/middleware.ts`) redirige automáticamente a usuarios no administradores que intenten acceder a `/users` hacia el Tablero Principal (`/`), y a usuarios inactivos hacia `/login?error=account_inactive`.
     - En `Sidebar.tsx`, `TopNav.tsx` y `settings/page.tsx`, el acceso a la pantalla solo se renderiza si el usuario activo tiene rol `admin`.
     - Para usuarios con rol Contable (`accounting_auditor`), la barra lateral muestra un distintivo visual permanente: *"Rol Contable • Acceso Solo Lectura"*.
  2. **Creación de Usuarios e Invitaciones (DoD 2):**
     - Formulario interactivo en panel lateral *Slide-over* (`#0EA5E9`) con inputs blancos y bordes oscuros según la especificación B2B de `stitch_mts`.
     - Campos solicitados: `Nombre Completo` (`fullName`), `Correo Electrónico` (`email`) y `Rol Asignado` (`role`: Administrador o Contable).
     - Validación estricta con esquemas Zod en `src/lib/schemas/users.ts` y normalización automática de emails.
  3. **Roles y Permisos (DoD 3):**
     - *Administrador:* Acceso irrestricto a carga diaria de horas, mantenedores/catálogos, emisión de proformas, facturación, sueldos y tesorería/finanzas.
     - *Contable (`accounting_auditor`):* Acceso acotado de "Solo Lectura", habilitado para auditar reportes, consultar catálogos operativos y exportar la liquidación mensual de haberes en Excel.
     - Migración SQL `20261002030000_user_management_and_roles.sql` agrega políticas RLS `SELECT` para `accounting_auditor` en tablas de catálogo (`positions`, `hour_types`, `client_position_rates`, `union_bonus_scales`).
  4. **Integración con Supabase Auth & Brevo (DoD 4):**
     - Creación programática de la cuenta de usuario en Supabase Auth mediante el cliente administrativo (`src/lib/supabase/admin.ts`) usando `SUPABASE_SERVICE_ROLE_KEY`.
     - Generación de enlace de invitación seguro (`inviteUserByEmail` / `generateLink`) dirigido a `/change-password` para que el nuevo usuario establezca su contraseña.
     - Sincronización automática de perfil en `public.profiles` (`id`, `full_name`, `email`, `role`, `is_active`).
     - Despacho de correo transaccional de bienvenida con `EmailBuilder` de Brevo (`createUserInviteEmail`) con diseño institucional B2B, detalle del rol asignado, resumen de permisos y botón de activación de cuenta con aviso de seguridad de 24 horas.
  5. **Gestión de Estado y Bloqueo Inmediato (DoD 5):**
     - Grilla interactiva de usuarios en `/users` con tarjetas KPI (*Total Usuarios*, *Administradores*, *Contables*, *Inactivos*), buscador en tiempo real y filtros rápidos por rol y estado.
     - Toggle de cambio de estado a "Inactivo" con diálogo modal de confirmación.
     - **Corte de Acceso Inmediato en 4 Capas:**
       1. *Base de Datos / RLS:* La función `public.get_user_role(user_id)` verifica `WHERE is_active = true`. Si el usuario pasa a inactivo, la función devuelve `NULL` inmediatamente, revocando el acceso a todas las tablas protegidas por RLS al instante sin esperar expiración de JWT.
       2. *Supabase Auth Admin API:* Aplica un baneo (`ban_duration: '876000h'`) para invalidar el refresh de sesión en los clientes de Supabase.
       3. *Middleware:* Intercepta cualquier petición subsiguiente del usuario inactivo y lo expulsa a `/login?error=account_inactive`.
       4. *Página de Login:* Valida el estado activo post-autenticación y muestra mensaje explicativo si la cuenta fue suspendida.
     - **Protección de Seguridad:** Bloqueo explícito tanto en frontend como en el backend API (`/api/users/[id]`) que impide que un Administrador Principal inactive o degrade su propia cuenta.
  6. **Testing Automatizado (DoD):**
     - Suite completa `tests/scripts/test-user-management-dod.ts` (32 pruebas de criterios de aceptación verificadas, 100% PASS) incorporada al runner general `run-all-tests.ts`.
- **2026-10-02:** Automatización de Control de Vencimientos y Reclamo de Cobranzas (Cron + API Brevo):
  1. **Regla de Negocio y Criterios DoD:**
     - Cron Job diario a medianoche (00:00 hs ART = 03:00 UTC) configurado en `vercel.json` (`/api/cron/check-due-invoices`) y Supabase Edge Function (`supabase/functions/check-due-invoices/index.ts`).
     - Lectura automática de facturas en estado "Pendiente" (`status = 'pending'`), cruzando su fecha de emisión (`invoice_date`) con el plazo de pago del cliente (`clients.payment_due_days`).
     - Disparadores Brevo:
       - **-3 Días:** Aviso de Próximo Vencimiento (`upcoming_3_days`).
       - **Día 0:** Vencimiento Hoy (`due_today`).
       - **Vencida (> 0 días):** Aviso de Factura Vencida (`overdue`) con cadencia configurable (`overdue_reminder_cadence_days`, por ej. cada 3 o 7 días).
     - Protección estricta de idempotencia en `invoice_reminder_logs` con clave única `(tax_invoice_id, reminder_type, sent_date)`.
  2. **Interfaz de Usuario y Navegación:**
     - **Acceso en Menú Lateral (`Sidebar.tsx`):** Ítem dedicado **"Control de Vencimientos"** (`/invoicing/due-reminders`) con ícono de reloj (`Clock`) ubicado debajo de *Gestión de Facturación*.
     - **Pantalla Completa Dedicada (`/invoicing/due-reminders`):** Panel interactivo con KPIs (*Facturas Pendientes*, *Próximas a Vencer*, *Vencen Hoy*, *Vencidas*), filtros rápidos, tabla detallada con fecha de emisión, vencimiento calculado, días de diferencia, estado de recordatorios y botón para disparar auditoría/simulación manual.
     - **Acceso en Gestión de Facturación (`/invoicing`):** Botón directo en la barra superior de acciones junto a "Nueva Proforma Comercial".
     - **Acceso en Tablero Principal (`/`):** Acceso directo en el pie del acordeón de *Facturas a Cobrar*.
  3. **Scripts y Testing Integral:**
     - CLI `scripts/check-due-invoices.ts` para pruebas manuales y CI/CD con flags `--date`, `--cadence`, `--dry-run` y `--mock-db`.
     - Suite de pruebas automatizadas `tests/scripts/test-invoice-reminders-cron.ts` (24 casos DoD aprobados, 100% PASS).
- **2026-09-22:** Implementación de ajustes operativos prioritarios:
  1. **Tablero Principal (`/`):** Incorporación de la columna Fecha en las tablas de los acordeones *Facturas a Enviar* y *Facturas a Cobrar*, manteniendo la estructura estática solicitada.
  2. **Carga Diaria de Horas (`/daily-entry`):** 
     - Agregado de columna dedicada e independiente para **Lugar de Trabajo** en la tabla principal y limpieza del campo Cliente.
     - Fijación de la columna de **Acciones** (`sticky right-0`) para evitar desbordes y ocultamiento ante zoom del navegador.
     - **Retención estricta de variables de turno:** Se conservan automáticamente fecha, cliente, lugar, horarios y puesto al cargar múltiples operarios consecutivos con el botón *"Guardar y Seguir"*.
     - Protección de puesto en `handleEmployeeChange` para evitar que la selección del operario sobreescriba el puesto definido para la cuadrilla.
     - Implementación de la acción interactiva **"Finalizar Turno"** en la cabecera y en el panel lateral Slide-over para limpiar la memoria de turno.
     - Actualización segura de `getOrCreateDailyWorkLog` para evitar violaciones de clave única `UNIQUE(work_date, client_id)`.
  3. **Cálculo de Sueldos (`/payroll`):**
     - Configuración del preset por defecto a **"Mes Completo"** (`getCurrentMonthDates`) para visualizar de inmediato todas las jornadas de septiembre (ej. 1 de septiembre).
     - Incorporación de listener de auto-refresco reactivo al enfocar la ventana (`window.focus`).
  4. **Flujo de Caja (`/cash-flow`):**
     - Modificación de la lógica de filtrado por fecha: si el usuario especifica una fecha sin fecha de fin, se filtran **estrictamente los movimientos de esa fecha exacta**, eliminando la visualización no deseada de registros posteriores.
- **2026-09-15:** Implementación del Módulo Transaccional de Correos con **Brevo** y **EmailBuilder**:
  1. **Arquitectura Desacoplada y Nativa:** Implementación de `src/lib/brevo/` utilizando la API REST v3 oficial de Brevo (`POST https://api.brevo.com/v3/smtp/email`) con `fetch` nativo (sin dependencias externas pesadas, 100% compatible con Next.js 15+/16 Server Actions y Route Handlers).
  2. **Constructor Fluido (`EmailBuilder`):** Herramienta componible para armar correos B2B en pocas líneas (`.to()`, `.subject()`, `.badge()`, `.title()`, `.paragraph()`, `.summary()`, `.callout()`, `.button()`, `.attachFromBase64()`, `.attachFromUrl()`, `.send()`).
  3. **Plantillas Corporativas B2B:** Soporte nativo para proformas quincenales (`createProformaEmail`), recordatorios automatizados de cobranzas (`createInvoiceReminderEmail` para -3 días, hoy y vencida) y notificaciones generales (`createGenericNotificationEmail`).
  4. **Normalización de Destinatarios:** Admisión transparente de emails individuales, arrays y cadenas separadas por coma/punto y coma (compatibilidad directa con el campo `clients.billing_email`).
  5. **Modo Seguro de Desarrollo:** Si `BREVO_API_KEY` no está configurada, el cliente simula el envío con logs detallados en consola y retorna `mocked: true` sin interrumpir los flujos de la aplicación.
  6. **Endpoint y Configuración:** Creación del Route Handler autenticado `src/app/api/mail/send/route.ts` y archivo `.env.example`.
- **2026-09-03:** Implementación integral del Formulario y Módulo de Ingreso de Flujo de Caja (`/cash-flow`):
  1. **Persistencia Real en Supabase:** Creación de la migración `20260903000000_add_cash_movements.sql`, enum `cash_movement_type` (`income` | `expense`), tabla `cash_movements` con RLS para `admin` y `accounting_auditor`, y datos semilla.
  2. **Capa de Servicios Tipada:** Implementación de `src/lib/services/cash-flow.ts` (`getCashMovements`, `createCashMovement`, `updateCashMovement`, `deleteCashMovement`) y tipado estricto en `database.types.ts`.
  3. **Formulario Slide-over y UX de Flujo de Caja:** Integración en tiempo real del formulario B2B (`#0EA5E9`, inputs blancos con bordes oscuros `#0F2547`), soporte para altas y ediciones de ingresos y egresos, validaciones, modal interactivo de confirmación de eliminación, tarjetas KPI superiores (*Total Ingresos*, *Total Egresos*, *Saldo Operativo*) y cálculo progresivo de saldo acumulativo.
- **2026-08-25:** Implementación de requerimientos clave de negocio y actualización de Dashboard:
  1. **Optimización del Data Entry (Panel Slide-over y Retención de Sesión):** En `/daily-entry`, el formulario de imputación de personal se transformó en un panel **Slide-over lateral derecho** desplegable mediante el botón **"Cargar Horas"** (o *"Agregar"* / *"Cargar Primer Operario"*). Mantiene la retención de sesión de fecha, cliente, lugar y horas al imputar un registro para carga masiva ultra rápida con opciones *"Guardar y Seguir"* y *"Guardar y Cerrar"*. Se conserva el botón interactivo **"Finalizar Turno"** en la cabecera para resetear la memoria de sesión.
  2. **Automatización Real de Proformas:** En `/invoicing`, se eliminó el input manual de subtotales. La liquidación de proforma se autocalcula de forma reactiva en tiempo real cruzando cliente + período seleccionado + horas transaccionales (`daily_staff_entries`) + tarifario comercial (`client_position_rates`), bloqueando la emisión si no existen horas cargadas.
  3. **Buscadores Temporales y Auditoría de Empleados:** En `/employees`, se incorporó el filtro por rango de fechas (con presets quincenales Q1, Q2 y Mes) y la columna de resumen de horas trabajadas. Se añadió el panel modal interactivo **"Auditar Horas"** para inspeccionar la lista detallada de turnos por operario en el período quincenal y cotejar con la liquidación recibida.
  4. **Rediseño del Dashboard según `stitch_mts/Dashboard`:** En `/`, se implementó la nueva interfaz con pestañas superiores (*Dashboard* y *Flujo de Caja*), tarjetas KPI estilizadas (*Saldo Banco*, *Total Facturado*, *Total Sueldos*, *Egresos Proyectados* ARCA/ARBA/Echeqs/Cheques/Servicios) y acordeones colapsables para *Proformas a Enviar*, *Facturas a Enviar* y *Facturas a Cobrar* con datos de prueba.
  5. **Configuración de Metadatos y Títulos Semánticos de Página:** Se reemplazó el título por defecto *"Create Next App"* por una plantilla jerárquica `%s | MTS Gestión Logística` en `src/app/layout.tsx` y layouts dedicados en todas las rutas del sistema (`Carga Diaria de Horas`, `Gestión de Facturación`, `Cálculo de Sueldos`, `Tarifario Comercial`, `Ingreso y Flujo de Caja`, `Gestión de Personal`, `Lugares de Trabajo`, `Gestión de Clientes`, `Centro de Reportes`, `Configuración del Sistema`, `Modificación de Contraseña`, `Iniciar Sesión`).
- **2026-08-15:** Implementación de requerimientos operativos:
  1. Múltiples emails en Gestión de Clientes (`/clients`) mediante chips/tags interactivos que se agregan con coma (`,`) o Enter y se almacenan como texto separado por comas (`email1@mail.com,email2@mail.com`).
  2. Opción de plazo de pago a 7 días en el alta/edición de clientes y en el filtro de tarifas comerciales (`/rates`).
  3. Renombrado integral en toda la interfaz de usuario de "Locaciones" a "Lugares de Trabajo" (`Sidebar.tsx`, `/locations`, `/reports`, `/daily-entry`), asegurando 100% de coherencia en español y eliminando el campo/columna de capacidad.
  4. Filtro interactivo de rango de fechas en Tablero Principal (`/`) y Cálculo de Sueldos (`/payroll`), configurando por defecto como fecha máxima el último día de la semana actual (domingo).
- **2026-08-04:** Corrección del error en alta de tarifas comerciales mediante la migración `20260804050000_seed_hour_types.sql` y auto-sembrado inteligente de tipos de hora (`REGULAR`, `OVERTIME_50`, `OVERTIME_100`) en `src/lib/services/rates.ts`, garantizando la existencia de los códigos de hora requeridos.
- **2026-08-04:** Implementación completa del CRUD de Gestión de Clientes (`src/lib/services/clients.ts`) e integración en la vista `/clients` (lectura en tiempo real, búsqueda multidominio por Razón Social / CUIT / Email, filtrado por estado Activo/Inactivo, panel *Slide-over* de alta y edición con campos de plazo de pago en días, y diálogo modal de eliminación con confirmación). Se añadieron políticas RLS adicionales en `20260804040000_add_clients_rls.sql`.

- **2026-08-04:** Implementación completa del CRUD de Tarifario Comercial (`src/lib/services/rates.ts`) e integración en la vista `/rates` (agrupación y cálculo dinámico de horas Normales, 50% y 100%, búsqueda en tiempo real, filtro por plazo de pago, panel *Slide-over* de alta/edición y modal de eliminación con confirmación). Se añadieron políticas RLS en `20260804030000_add_rates_rls.sql` y datos semilla para `hour_types` y `clients` en `supabase/seed.sql`.

- **2026-08-04:** Implementación completa del CRUD de locaciones en Supabase (`src/lib/services/locations.ts`) e integración en la vista `/locations` (lectura en tiempo real, filtrado por texto y estado, panel *Slide-over* de alta/edición y modal de eliminación con confirmación).

- **2026-08-04:** Adición de políticas RLS para la tabla `locations` en Supabase (`20260804020000_add_locations_rls.sql`), habilitando permisos de inserción, actualización, lectura y eliminación para usuarios autenticados con rol `admin` y lectura para `accounting_auditor`.
- **2026-08-04:** Implementación integral del CRUD de empleados en Supabase (`src/lib/services/employees.ts`) e integración completa en la vista interactiva `/employees` (lectura en tiempo real, búsqueda multidominio, filtrado por puesto y estado, panel *Slide-over* de creación/edición y diálogo modal de eliminación con confirmación).
- **2026-08-04:** Ajuste de permisos RLS y privilegios de esquema en Supabase (`20260804010000_fix_employees_rls.sql`) y carga inicial de semillas para puestos de trabajo en `supabase/seed.sql`.
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

