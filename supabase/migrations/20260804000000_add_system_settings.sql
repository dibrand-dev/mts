-- Add system settings and master variables tables to support System Configuration screen

CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    support_email TEXT NOT NULL,
    base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL, -- e.g. VAR-001
    name TEXT NOT NULL,
    numeric_value NUMERIC(14,4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access company_settings" ON public.company_settings FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access master_variables" ON public.master_variables FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');
