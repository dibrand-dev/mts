-- Migration: Allow changing and coexisting locations per client and date
-- Date: 2026-11-09
-- Description: Updates idx_daily_work_logs_date_client_vessel to also include location_id
-- so that a client can have separate logs for different work locations (e.g. Depósito Nacional, Depósito Fiscal, Cap Jackson)
-- without unique constraint conflicts even when vessel_name is null.

DROP INDEX IF EXISTS public.idx_daily_work_logs_date_client_vessel;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_work_logs_date_client_vessel_loc
ON public.daily_work_logs (
    work_date, 
    client_id, 
    COALESCE(vessel_name, ''), 
    COALESCE(location_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
