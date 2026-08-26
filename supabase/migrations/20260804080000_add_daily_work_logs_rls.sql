-- Add explicit RLS policies for daily_work_logs and daily_staff_entries

DROP POLICY IF EXISTS "Admins full access daily_work_logs" ON public.daily_work_logs;
DROP POLICY IF EXISTS "Admins full access daily_staff_entries" ON public.daily_staff_entries;

CREATE POLICY "Admins full access daily_work_logs fix" ON public.daily_work_logs FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access daily_staff_entries fix" ON public.daily_staff_entries FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read daily_work_logs fix" ON public.daily_work_logs FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read daily_staff_entries fix" ON public.daily_staff_entries FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
