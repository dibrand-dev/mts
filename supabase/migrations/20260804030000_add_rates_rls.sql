-- Add RLS policies for client_position_rates and hour_types
CREATE POLICY "Admins full access client_position_rates fix" ON public.client_position_rates FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read client_position_rates" ON public.client_position_rates FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read hour_types" ON public.hour_types FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read positions" ON public.positions FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read clients" ON public.clients FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
