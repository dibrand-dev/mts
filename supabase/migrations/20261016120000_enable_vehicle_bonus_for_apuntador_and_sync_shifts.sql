-- Migration: Enable vehicle bonus for Apuntadores and sync historic buque shifts
-- Description:
-- 1. Sets requires_vehicle_bonus = true for Apuntador positions (and ensures Encargado remains true)
--    so all port personnel operating vessel units receive the CCT union vehicle bonus.
-- 2. Retroactively synchronizes bonus_applied_amount for all daily_staff_entries belonging to
--    daily_work_logs with total_vehicles_handled > 0 whose bonus_applied_amount is 0.

-- 1. Enable requires_vehicle_bonus on Apuntador position
UPDATE public.positions
SET requires_vehicle_bonus = true
WHERE name ILIKE '%apuntador%' OR name ILIKE '%encargado%';

-- 2. Retroactively update staff entries on vessel operations where vehicles were handled
UPDATE public.daily_staff_entries dse
SET bonus_applied_amount = COALESCE(
    (
        SELECT ubs.bonus_amount
        FROM public.union_bonus_scales ubs
        WHERE ubs.effective_from <= dwl.work_date
          AND dwl.total_vehicles_handled >= ubs.min_vehicles
          AND (dwl.total_vehicles_handled <= ubs.max_vehicles OR ubs.max_vehicles IS NULL)
        ORDER BY ubs.effective_from DESC, ubs.min_vehicles DESC
        LIMIT 1
    ),
    0
)
FROM public.daily_work_logs dwl,
     public.positions p
WHERE dse.daily_work_log_id = dwl.id
  AND dse.position_id = p.id
  AND dwl.total_vehicles_handled > 0
  AND p.requires_vehicle_bonus = true
  AND (dse.bonus_applied_amount IS NULL OR dse.bonus_applied_amount = 0);
