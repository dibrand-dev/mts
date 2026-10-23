-- Migration: Allow decimal shuttle tramos (e.g. 0.50 for Depósito Fiscal) and seed real operations
-- Description:
-- 1. Alters public.daily_staff_entries.shuttles_count from INT to NUMERIC(6,2) so 0.50 tramos can be stored.
-- 2. Seeds October 2026 operations and vessels (GOODWOOD, INSPECCIONES ESPECIALES, etc.) into client_operations.

-- 1. Change shuttles_count to NUMERIC(6,2)
ALTER TABLE public.daily_staff_entries
ALTER COLUMN shuttles_count TYPE NUMERIC(6,2) USING shuttles_count::NUMERIC(6,2);

ALTER TABLE public.daily_staff_entries
ALTER COLUMN shuttles_count SET DEFAULT 0;

COMMENT ON COLUMN public.daily_staff_entries.shuttles_count IS 'Cantidad de viajes o tramos de remis (admite decimales como 0.50 para Depósito Fiscal)';

-- 1b. Allow multiple operations/deposits per client on the same date (e.g. DEPÓSITO NACIONAL + DEPÓSITO FISCAL on same work_date)
ALTER TABLE public.daily_work_logs
DROP CONSTRAINT IF EXISTS daily_work_logs_work_date_client_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_work_logs_date_client_vessel
ON public.daily_work_logs (work_date, client_id, COALESCE(vessel_name, ''));

-- 2. Seed updated client_operations for CAT Argentina, Delta Dock, Cooptacord, Danchuk
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

    IF cat_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES
            (cat_id, 'GOODWOOD', 'vessel'),
            (cat_id, 'BRASILIA HWY', 'vessel'),
            (cat_id, 'INQUEBRANTABLE', 'vessel'),
            (cat_id, 'PLAZOLETA FISCAL', 'yard'),
            (cat_id, 'INSPECCIONES ESPECIALES', 'yard')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    IF dd_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES
            (dd_id, 'DEPÓSITO NACIONAL', 'deposit'),
            (dd_id, 'DEPÓSITO FISCAL', 'deposit'),
            (dd_id, 'DEPÓSITO ARROZ', 'deposit')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    IF coop_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES
            (coop_id, 'APUNTADORES PLAZ. FISCAL (10%)', 'yard')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;

    IF danchuk_id IS NOT NULL THEN
        INSERT INTO public.client_operations (client_id, name, operation_type)
        VALUES
            (danchuk_id, 'PLAZOLETA FISCAL TERMINAL ZÁRATE', 'general')
        ON CONFLICT (client_id, name) DO UPDATE SET is_active = true, operation_type = EXCLUDED.operation_type;
    END IF;
END $$;

