-- Migration: Add RLS read policy for accounting_auditor and seed data for union_bonus_scales

-- 1. Ensure read access for accounting_auditor and authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'union_bonus_scales' 
        AND policyname = 'Auditors read access union_bonus_scales'
    ) THEN
        CREATE POLICY "Auditors read access union_bonus_scales" 
        ON public.union_bonus_scales 
        FOR SELECT 
        TO authenticated 
        USING (public.get_user_role(auth.uid()) IN ('admin', 'accounting_auditor'));
    END IF;
END $$;

-- 2. Seed initial CCT union bonus scale levels if table is empty
INSERT INTO public.union_bonus_scales (min_vehicles, max_vehicles, bonus_amount, effective_from)
SELECT v.min_v, v.max_v, v.bonus, CURRENT_DATE
FROM (VALUES
    (0, 1499, 88200.48),
    (1500, 1999, 102015.99),
    (2000, 2499, 118540.55),
    (2500, 2999, 135065.11),
    (3000, 99999, 155000.00)
) AS v(min_v, max_v, bonus)
WHERE NOT EXISTS (SELECT 1 FROM public.union_bonus_scales LIMIT 1);
