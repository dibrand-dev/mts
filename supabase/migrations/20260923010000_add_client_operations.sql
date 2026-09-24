-- Migration: Add client_operations catalog for controlled vessels and operations tracking
CREATE TABLE IF NOT EXISTS public.client_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50) NOT NULL DEFAULT 'vessel', -- 'vessel', 'yard', 'deposit', 'general'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_client_operations_name UNIQUE(client_id, name)
);

CREATE INDEX IF NOT EXISTS idx_client_operations_lookup
ON public.client_operations(client_id, is_active);

-- Enable RLS
ALTER TABLE public.client_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access client_operations" ON public.client_operations
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Auditors read client_operations" ON public.client_operations
    FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

-- Seed real known vessels & operations for existing clients
DO $$
DECLARE
    cat_id UUID;
    dd_id UUID;
    coop_id UUID;
    danchuk_id UUID;
BEGIN
    SELECT id INTO cat_id FROM public.clients WHERE company_name ILIKE '%CAT%' LIMIT 1;
    SELECT id INTO dd_id FROM public.clients WHERE company_name ILIKE '%DELTA DOCK%' LIMIT 1;
    SELECT id INTO coop_id FROM public.clients WHERE company_name ILIKE '%COOPTACORD%' LIMIT 1;
    SELECT id INTO danchuk_id FROM public.clients WHERE company_name ILIKE '%DANCHUK%' LIMIT 1;

    -- CAT Argentina: Buques y Plazoleta
    IF cat_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES 
            (cat_id, 'BRASILIA HWY', 'vessel'),
            (cat_id, 'INQUEBRANTABLE', 'vessel'),
            (cat_id, 'PLAZOLETA FISCAL', 'yard')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    -- Delta Dock: Depósitos y Silos
    IF dd_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES 
            (dd_id, 'DEPÓSITO ARROZ', 'deposit'),
            (dd_id, 'DEPÓSITO NACIONAL', 'deposit'),
            (dd_id, 'DEPÓSITO FISCAL', 'deposit')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    -- Cooptacord: Coparticipación Expo
    IF coop_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES 
            (coop_id, 'COPARTICIPACIÓN EXPO', 'yard')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    -- Sergio Danchuk: Operativa Zárate
    IF danchuk_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES 
            (danchuk_id, 'OPERATIVA TERMINAL ZÁRATE (CMP-TZ)', 'general')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;
END $$;

