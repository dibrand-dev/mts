-- Add shift_start_date and shift_end_date columns to daily_staff_entries

ALTER TABLE public.daily_staff_entries 
ADD COLUMN IF NOT EXISTS shift_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS shift_end_date DATE DEFAULT CURRENT_DATE;

-- Backfill existing rows with parent work_log date if NULL
UPDATE public.daily_staff_entries e
SET shift_start_date = l.work_date,
    shift_end_date = l.work_date
FROM public.daily_work_logs l
WHERE e.daily_work_log_id = l.id
  AND (e.shift_start_date IS NULL OR e.shift_end_date IS NULL);
