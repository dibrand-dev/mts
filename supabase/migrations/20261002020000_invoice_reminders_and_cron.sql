-- Migration: Invoice Reminders, Overdue Cadence, and Daily Cron Tracking
-- Description: Adds tracking fields to tax_invoices, creates invoice_reminder_logs for idempotency and audit,
-- adds overdue cadence parameter to clients and master_variables.

-- 1. Add reminder tracking columns to tax_invoices
ALTER TABLE public.tax_invoices
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reminder_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS reminders_sent_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tax_invoices_status_date
ON public.tax_invoices(status, invoice_date);

-- 2. Add client-specific cadence override if desired (default 3 days)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS overdue_reminder_cadence_days INT NOT NULL DEFAULT 3 CHECK (overdue_reminder_cadence_days > 0);

-- 3. Create invoice_reminder_logs audit table
CREATE TABLE IF NOT EXISTS public.invoice_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_invoice_id UUID NOT NULL REFERENCES public.tax_invoices(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'upcoming_3_days', 'due_today', 'overdue'
    days_difference INT NOT NULL, -- -3 (3 days before), 0 (due today), >0 (overdue days)
    recipient_email TEXT NOT NULL,
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    brevo_message_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent', 'mocked', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_invoice_reminder_daily UNIQUE (tax_invoice_id, reminder_type, sent_date)
);

CREATE INDEX IF NOT EXISTS idx_invoice_reminder_logs_invoice 
ON public.invoice_reminder_logs(tax_invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_reminder_logs_client 
ON public.invoice_reminder_logs(client_id);

CREATE INDEX IF NOT EXISTS idx_invoice_reminder_logs_sent_date 
ON public.invoice_reminder_logs(sent_date);

-- 4. Enable RLS on invoice_reminder_logs
ALTER TABLE public.invoice_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access invoice_reminder_logs" ON public.invoice_reminder_logs
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Auditors read invoice_reminder_logs" ON public.invoice_reminder_logs
    FOR SELECT TO authenticated
    USING (public.get_user_role(auth.uid()) = 'accounting_auditor');

-- 5. Seed default master variable for overdue cadence if master_variables table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_variables') THEN
        INSERT INTO public.master_variables (code, name, numeric_value, is_active)
        VALUES ('OVERDUE_CADENCE_DAYS', 'Cadencia de Reclamo Factura Vencida (Días)', 3.0, true)
        ON CONFLICT (code) DO NOTHING;
    END IF;
END $$;

