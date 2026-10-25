-- Migration: Add 3000-3499 bracket ($143.503,04) to union_bonus_scales and sync Goodwood vessel
-- Description:
-- 1. Updates union_bonus_scales to include the official bracket:
--    3000 to 3499 units = $143.503,04 (as per Cat CCT table, e.g., buque Goodwood with 3120 vehicles).
--    3500+ units = $155.000,00.
-- 2. Retroactively synchronizes all daily_staff_entries belonging to vessel operations (such as Goodwood)
--    with total_vehicles_handled between 3000 and 3499 where bonus_applied_amount was assigned $155.000,00.

-- 1. Update existing 3000+ row to 3000-3499 with $143.503,04
UPDATE public.union_bonus_scales
SET max_vehicles = 3499,
    bonus_amount = 143503.04
WHERE min_vehicles = 3000;

-- 2. Insert 3500+ bracket ($155.000,00) if not exists
INSERT INTO public.union_bonus_scales (min_vehicles, max_vehicles, bonus_amount, effective_from)
SELECT 3500, 99999, 155000.00, '2026-01-01'
WHERE NOT EXISTS (
    SELECT 1 FROM public.union_bonus_scales WHERE min_vehicles = 3500
);

-- 3. If there are no rows with min_vehicles = 3000 at all, insert it
INSERT INTO public.union_bonus_scales (min_vehicles, max_vehicles, bonus_amount, effective_from)
SELECT 3000, 3499, 143503.04, '2026-01-01'
WHERE NOT EXISTS (
    SELECT 1 FROM public.union_bonus_scales WHERE min_vehicles = 3000
);

-- 4. Retroactively sync daily_staff_entries on vessel operations with 3000-3499 vehicles
UPDATE public.daily_staff_entries dse
SET bonus_applied_amount = 143503.04
FROM public.daily_work_logs dwl
WHERE dse.daily_work_log_id = dwl.id
  AND dwl.total_vehicles_handled >= 3000
  AND dwl.total_vehicles_handled <= 3499
  AND dse.bonus_applied_amount = 155000.00;

