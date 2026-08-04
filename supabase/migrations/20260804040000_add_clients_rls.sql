-- Add RLS policies for clients table
CREATE POLICY "Admins full access clients fix" ON public.clients FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read clients fix" ON public.clients FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
