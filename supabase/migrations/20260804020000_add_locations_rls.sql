-- Add RLS Policies for locations table
CREATE POLICY "Admins full access locations" ON public.locations FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read locations" ON public.locations FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
