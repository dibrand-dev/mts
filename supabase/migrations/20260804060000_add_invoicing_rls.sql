-- Add complete RLS policies for proformas, proforma_details, and tax_invoices
CREATE POLICY "Admins full access proformas fix" ON public.proformas FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access proforma_details fix" ON public.proforma_details FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins full access tax_invoices fix" ON public.tax_invoices FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin')
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Accounting auditor read proformas fix" ON public.proformas FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read proforma_details fix" ON public.proforma_details FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

CREATE POLICY "Accounting auditor read tax_invoices fix" ON public.tax_invoices FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');
