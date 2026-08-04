-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'accounting_auditor');
CREATE TYPE public.proforma_concept_type AS ENUM ('general_hours', 'shuttles', 'export_tallymen');
CREATE TYPE public.proforma_status AS ENUM ('draft', 'sent', 'approved', 'invoiced', 'paid', 'overdue');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid');
CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role public.app_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for auto profile creation upon user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'admin')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Helper function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.app_role AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE TYPE public.location_status AS ENUM ('active', 'maintenance', 'inactive');

-- 3. CATALOG TABLES (ABMs)
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g. LOC-001
    name TEXT NOT NULL, -- e.g. Muelle Norte 1
    port_city TEXT NOT NULL, -- e.g. Puerto Valparaíso
    capacity TEXT NOT NULL, -- e.g. 5000 TEU, 12000 m2
    status public.location_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    tax_id VARCHAR(13) UNIQUE NOT NULL, -- CUIT
    billing_email TEXT NOT NULL,
    phone_number VARCHAR(30),
    payment_due_days INT NOT NULL DEFAULT 15 CHECK (payment_due_days >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- e.g. Salaries, ARBA, Shuttles
    type public.expense_type NOT NULL DEFAULT 'variable',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    requires_vehicle_bonus BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hour_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g. REGULAR, OVERTIME_50, OVERTIME_100
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.client_position_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
    hour_type_id UUID NOT NULL REFERENCES public.hour_types(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(12,2) NOT NULL CHECK (hourly_rate >= 0),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, position_id, hour_type_id, effective_from)
);

CREATE TABLE public.union_bonus_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_vehicles INT NOT NULL CHECK (min_vehicles >= 0),
    max_vehicles INT NOT NULL CHECK (max_vehicles >= min_vehicles),
    bonus_amount NUMERIC(12,2) NOT NULL CHECK (bonus_amount >= 0),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE public.employee_status AS ENUM ('active', 'inactive', 'on_leave');

CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id VARCHAR(20) UNIQUE NOT NULL, -- DNI
    file_number VARCHAR(20) UNIQUE, -- Legajo
    tax_id VARCHAR(13) UNIQUE, -- CUIL
    full_name TEXT NOT NULL,
    default_position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    phone_number VARCHAR(30),
    status public.employee_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DAILY OPERATIONS
CREATE TABLE public.daily_work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
    total_vehicles_handled INT NOT NULL DEFAULT 0 CHECK (total_vehicles_handled >= 0),
    is_export_day BOOLEAN NOT NULL DEFAULT false,
    logged_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_date, client_id)
);

CREATE TABLE public.daily_staff_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_work_log_id UUID NOT NULL REFERENCES public.daily_work_logs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE RESTRICT,
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    regular_hours NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (regular_hours >= 0),
    overtime_50_hours NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (overtime_50_hours >= 0),
    overtime_100_hours NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (overtime_100_hours >= 0),
    shuttles_count INT NOT NULL DEFAULT 0 CHECK (shuttles_count >= 0),
    plus_delta_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (plus_delta_amount >= 0),
    meal_allowance_count INT NOT NULL DEFAULT 0 CHECK (meal_allowance_count >= 0),
    advance_payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (advance_payment_amount >= 0),
    is_day_off BOOLEAN NOT NULL DEFAULT false,
    bonus_applied_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (bonus_applied_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICING AND PROFORMAS
CREATE TABLE public.proformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_number TEXT UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    fortnight_period VARCHAR(10) NOT NULL, -- e.g. '2026-08-Q1'
    concept_type public.proforma_concept_type NOT NULL,
    status public.proforma_status NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    public_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.proforma_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_id UUID NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tax_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_id UUID NOT NULL UNIQUE REFERENCES public.proformas(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL,
    pdf_storage_path TEXT NOT NULL,
    invoiced_amount NUMERIC(14,2) NOT NULL,
    status public.invoice_status NOT NULL DEFAULT 'pending',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_position_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.union_bonus_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_staff_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_invoices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
CREATE POLICY "Profiles read access" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access expense_categories" ON public.expense_categories FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access expenses" ON public.expenses FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access clients" ON public.clients FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access positions" ON public.positions FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access hour_types" ON public.hour_types FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access client_position_rates" ON public.client_position_rates FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access union_bonus_scales" ON public.union_bonus_scales FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access employees" ON public.employees FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access daily_work_logs" ON public.daily_work_logs FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access daily_staff_entries" ON public.daily_staff_entries FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access proformas" ON public.proformas FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access proforma_details" ON public.proforma_details FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access tax_invoices" ON public.tax_invoices FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read daily_work_logs" ON public.daily_work_logs FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read daily_staff_entries" ON public.daily_staff_entries FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read employees" ON public.employees FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Public read proforma via token" ON public.proformas FOR SELECT TO anon
    USING (true);

CREATE POLICY "Public read proforma_details via token" ON public.proforma_details FOR SELECT TO anon
    USING (
        EXISTS (
            SELECT 1 FROM public.proformas p
            WHERE p.id = proforma_details.proforma_id
        )
    );
