-- Migration: Extensible Invoicing Engine, Proforma Types and Service Rates
-- Description: Adds proforma_type to proformas, regular/overtime vehicle tracking to daily_work_logs,
-- and creates client_service_rates table for flexible non-hourly rates (shuttles, meals, vehicles, fixed fees, markups).

-- 1. Add proforma_type to proformas
ALTER TABLE public.proformas 
ADD COLUMN IF NOT EXISTS proforma_type VARCHAR(50) NOT NULL DEFAULT 'vessel';

CREATE INDEX IF NOT EXISTS idx_proformas_type 
ON public.proformas(proforma_type);

-- 2. Add vehicle tariff breakdown to daily_work_logs
ALTER TABLE public.daily_work_logs
ADD COLUMN IF NOT EXISTS vehicles_regular_time INT NOT NULL DEFAULT 0 CHECK (vehicles_regular_time >= 0),
ADD COLUMN IF NOT EXISTS vehicles_overtime INT NOT NULL DEFAULT 0 CHECK (vehicles_overtime >= 0);

-- 3. Create client_service_rates for complementary & non-hourly commercial rates
CREATE TABLE IF NOT EXISTS public.client_service_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL,
    description VARCHAR(150) NOT NULL,
    rate_value NUMERIC(14,2) NOT NULL CHECK (rate_value >= 0),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_client_service_rates UNIQUE(client_id, service_code, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_client_service_rates_lookup 
ON public.client_service_rates(client_id, service_code, effective_from);

-- 4. Enable RLS on client_service_rates
ALTER TABLE public.client_service_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access client_service_rates" ON public.client_service_rates
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Auditors read client_service_rates" ON public.client_service_rates
    FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

-- 5. Seed initial rates from real operational data for existing clients
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

    -- Rates for CAT ARGENTINA S.A.
    IF cat_id IS NOT NULL THEN
        INSERT INTO public.client_service_rates (client_id, service_code, description, rate_value, metadata)
        VALUES 
            (cat_id, 'VEHICLE_NORMAL', 'Vehículo Operado en Horario Hábil', 2744.17, '{"category": "vehicle"}'::jsonb),
            (cat_id, 'VEHICLE_OVERTIME', 'Vehículo Operado en Horario Inhábil (+100%)', 5488.11, '{"category": "vehicle"}'::jsonb),
            (cat_id, 'SHUTTLE', 'Transporte Remis Delta Dock', 35594.34, '{"category": "transport"}'::jsonb),
            (cat_id, 'PLUS_MARKUP', 'Coeficiente de Costos / Markup Plus', 0.52, '{"category": "markup"}'::jsonb)
        ON CONFLICT (client_id, service_code, effective_from) DO UPDATE 
        SET rate_value = EXCLUDED.rate_value, description = EXCLUDED.description;
    END IF;

    -- Rates for DELTA DOCK SA
    IF dd_id IS NOT NULL THEN
        INSERT INTO public.client_service_rates (client_id, service_code, description, rate_value, metadata)
        VALUES 
            (dd_id, 'FIXED_MONTHLY_DEPOSIT_NACIONAL', 'Tarifa Mensual Bonificada Depósito Nacional', 5466694.70, '{"category": "fixed_fee", "sector": "nacional"}'::jsonb),
            (dd_id, 'FIXED_MONTHLY_DEPOSIT_FISCAL', 'Tarifa Mensual Bonificada Depósito Fiscal', 5466694.70, '{"category": "fixed_fee", "sector": "fiscal"}'::jsonb),
            (dd_id, 'SHUTTLE_TRAMO', 'Transporte Diario Personal (por tramo)', 37249.77, '{"category": "transport"}'::jsonb)
        ON CONFLICT (client_id, service_code, effective_from) DO UPDATE 
        SET rate_value = EXCLUDED.rate_value, description = EXCLUDED.description;
    END IF;

    -- Rates for COOPTACORD SA
    IF coop_id IS NOT NULL THEN
        INSERT INTO public.client_service_rates (client_id, service_code, description, rate_value, metadata)
        VALUES 
            (coop_id, 'COPARTICIPATION_FACTOR', 'Factor de Coparticipación Plazoleta / Expo', 0.10, '{"category": "split"}'::jsonb),
            (coop_id, 'SHUTTLE', 'Transporte Remis Delta Dock', 35594.34, '{"category": "transport"}'::jsonb)
        ON CONFLICT (client_id, service_code, effective_from) DO UPDATE 
        SET rate_value = EXCLUDED.rate_value, description = EXCLUDED.description;
    END IF;

    -- Rates for SERGIO DANCHUK
    IF danchuk_id IS NOT NULL THEN
        INSERT INTO public.client_service_rates (client_id, service_code, description, rate_value, metadata)
        VALUES 
            (danchuk_id, 'MEAL', 'Vianda Personal Operativo', 6545.18, '{"category": "meal"}'::jsonb),
            (danchuk_id, 'SHUTTLE_CMP_TZ', 'Transporte Viajes Campana - Terminal Zárate', 37685.28, '{"category": "transport", "route": "CMP-TZ"}'::jsonb),
            (danchuk_id, 'SHUTTLE_ZARATE_TZ', 'Transporte Viajes Zárate - Terminal Zárate', 0.00, '{"category": "transport", "route": "ZARATE-TZ"}'::jsonb)
        ON CONFLICT (client_id, service_code, effective_from) DO UPDATE 
        SET rate_value = EXCLUDED.rate_value, description = EXCLUDED.description;
    END IF;
END $$;

