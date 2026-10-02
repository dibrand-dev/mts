-- Migration: Add projected_obligations table for financial cash-flow projections
-- Allows admins to schedule future tax (ARCA, ARBA, IVA), salary, commission, and supplier obligations

CREATE TABLE IF NOT EXISTS public.projected_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    due_date DATE NOT NULL,
    type public.cash_movement_type NOT NULL DEFAULT 'expense',
    category TEXT NOT NULL, -- e.g. 'ARCA', 'ARBA', 'IVA', 'Sueldos', 'Comisiones', 'Proveedores', 'Otros'
    title TEXT NOT NULL,
    notes TEXT,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'projected', -- 'projected', 'realized', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.projected_obligations ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projected_obligations TO authenticated;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Admins full access projected_obligations" ON public.projected_obligations
        FOR ALL TO authenticated
        USING (public.get_user_role(auth.uid()) = 'admin')
        WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Accounting auditor read projected_obligations" ON public.projected_obligations
        FOR SELECT TO authenticated
        USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Initial seed obligations if empty
INSERT INTO public.projected_obligations (due_date, type, category, title, amount, notes)
SELECT m.due_date, m.type, m.category, m.title, m.amount, m.notes
FROM (VALUES
    ('2026-10-20'::DATE, 'expense'::public.cash_movement_type, 'ARCA', 'Anticipo Ganancias e Impuestos ARCA', 120500.00, 'Estimación liquidación impositiva'),
    ('2026-10-22'::DATE, 'expense'::public.cash_movement_type, 'ARBA', 'Ingresos Brutos ARBA Provincia Bs As', 45200.00, 'Declaración jurada mensual'),
    ('2026-10-24'::DATE, 'expense'::public.cash_movement_type, 'IVA', 'Pago Saldo IVA Período', 85000.00, 'Vencimiento según terminación CUIT'),
    ('2026-10-28'::DATE, 'expense'::public.cash_movement_type, 'Comisiones', 'Comisiones de Logística y Despacho', 65000.00, 'Liquidación operativa mensual')
) AS m(due_date, type, category, title, amount, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.projected_obligations);
