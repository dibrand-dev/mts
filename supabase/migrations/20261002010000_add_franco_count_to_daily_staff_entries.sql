-- Migration: Add day_off_count to daily_staff_entries
-- Allows tracking compensatory days off (francos) by quantity (+1 = earned franco, -1 = used franco, 0 = regular)

ALTER TABLE public.daily_staff_entries 
ADD COLUMN IF NOT EXISTS day_off_count INT NOT NULL DEFAULT 0;

-- Sync historical records where is_day_off was true
UPDATE public.daily_staff_entries
SET day_off_count = 1
WHERE is_day_off = true AND day_off_count = 0;

COMMENT ON COLUMN public.daily_staff_entries.day_off_count IS 'Cantidad de francos: +1 cuando genera franco, -1 cuando lo toma, 0 normal';
