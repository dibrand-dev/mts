-- Migration: Add cash_movements table and cash_movement_type enum

DO $$ BEGIN
    CREATE TYPE public.cash_movement_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type public.cash_movement_type NOT NULL DEFAULT 'income',
    area TEXT NOT NULL, -- e.g. 'Cobros', 'Sueldos', 'Proveedores', 'Impuestos', 'Otros'
    detail TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Admins full access cash_movements" ON public.cash_movements FOR ALL TO authenticated
        USING (public.get_user_role(auth.uid()) = 'admin')
        WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Accounting auditor read cash_movements" ON public.cash_movements FOR SELECT TO authenticated
        USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Initial seed movements
INSERT INTO public.cash_movements (movement_date, type, area, detail, amount)
SELECT m.movement_date, m.type, m.area, m.detail, m.amount
FROM (VALUES
    ('2026-10-15'::DATE, 'income'::public.cash_movement_type, 'Cobros', 'Factura #4589 - Cliente A', 12500.00),
    ('2026-10-14'::DATE, 'expense'::public.cash_movement_type, 'Impuestos', 'Pago IVA Septiembre', 4200.00),
    ('2026-10-12'::DATE, 'expense'::public.cash_movement_type, 'Sueldos', 'Nómina Quincenal', 28400.00),
    ('2026-10-10'::DATE, 'income'::public.cash_movement_type, 'Cobros', 'Factura #4588 - Cliente B', 8900.00),
    ('2026-10-08'::DATE, 'expense'::public.cash_movement_type, 'Proveedores', 'Mantenimiento Flota', 5150.00)
) AS m(movement_date, type, area, detail, amount)
WHERE NOT EXISTS (SELECT 1 FROM public.cash_movements);

