-- Migration: Add shift approval, vessel tracking, vehicle operations breakdown, and multi-tab proforma liquidation payload

-- 1. Add approval fields to daily_staff_entries
ALTER TABLE public.daily_staff_entries 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_daily_staff_entries_approval 
ON public.daily_staff_entries(daily_work_log_id, is_approved);

-- 2. Add vessel and vehicle operation counters to daily_work_logs
ALTER TABLE public.daily_work_logs
ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicles_discharged INT NOT NULL DEFAULT 0 CHECK (vehicles_discharged >= 0),
ADD COLUMN IF NOT EXISTS vehicles_loaded INT NOT NULL DEFAULT 0 CHECK (vehicles_loaded >= 0),
ADD COLUMN IF NOT EXISTS vehicles_shifted INT NOT NULL DEFAULT 0 CHECK (vehicles_shifted >= 0);

-- 3. Enhance proformas table to support maritime vessel liquidation format and payload
ALTER TABLE public.proformas
ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS operation_dates VARCHAR(100),
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 3.00,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_operativa NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_encargado NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal_compensacion NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_neto NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(14,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS calculation_payload JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT[] DEFAULT ARRAY[]::TEXT[];

