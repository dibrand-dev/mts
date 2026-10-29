-- Migration: Support nullable position_id, shift_number, shift_turn, and new vessel positions
-- Date: 2026-10-29
-- Description:
-- 1. Makes public.daily_staff_entries.position_id NULLABLE so Plazoleta Fiscal and Delta Dock
--    deposits can record staff hours without assigning a port position (position_id = null).
-- 2. Adds shift_number INT DEFAULT 1 and shift_turn INT to public.daily_staff_entries to assign operational shift
--    (Turno 1, 2, 3...) per employee from Carga Diaria de Horas and print it in Proformas.
-- 3. Seeds missing operational positions in public.positions: Colectado, Encargado a bordo, Daños, Rampa, Relevo.
-- 4. Cleans up accidental 'RAMPA' operational_role on existing Plazoleta Fiscal and Delta Dock shifts.

-- 1. Make position_id nullable in daily_staff_entries
ALTER TABLE public.daily_staff_entries
ALTER COLUMN position_id DROP NOT NULL;

-- 2. Add shift_number and shift_turn to daily_staff_entries
ALTER TABLE public.daily_staff_entries
ADD COLUMN IF NOT EXISTS shift_number INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS shift_turn INT CHECK (shift_turn > 0);

COMMENT ON COLUMN public.daily_staff_entries.shift_number IS 'Número de turno operativo (1, 2, 3, 4...) asignado al empleado en la jornada';
COMMENT ON COLUMN public.daily_staff_entries.shift_turn IS 'Alias para compatibilidad del número de turno operativo en buques y barcazas';

-- 3. Seed operational positions in public.positions
INSERT INTO public.positions (name, requires_vehicle_bonus, hourly_rate_regular, hourly_rate_overtime_50, hourly_rate_overtime_100)
VALUES 
    ('Colectado', true, 8983.68, 13475.53, 17967.37),
    ('Encargado a bordo', true, 10777.06, 16165.60, 21554.13),
    ('Daños', true, 8983.68, 13475.53, 17967.37),
    ('Rampa', true, 8983.68, 13475.53, 17967.37),
    ('Relevo', true, 8983.68, 13475.53, 17967.37)
ON CONFLICT (name) DO UPDATE SET
    requires_vehicle_bonus = EXCLUDED.requires_vehicle_bonus,
    hourly_rate_regular = EXCLUDED.hourly_rate_regular,
    hourly_rate_overtime_50 = EXCLUDED.hourly_rate_overtime_50,
    hourly_rate_overtime_100 = EXCLUDED.hourly_rate_overtime_100;

-- 4. Clean up any accidental 'RAMPA' operational roles on Plazoleta Fiscal and Depósitos
UPDATE public.daily_staff_entries dse
SET operational_role = NULL
FROM public.daily_work_logs dwl
LEFT JOIN public.locations loc ON dwl.location_id = loc.id
WHERE dse.daily_work_log_id = dwl.id
  AND (
    loc.code IN ('LOC-002', 'LOC-003', 'LOC-004')
    OR loc.name ILIKE '%plazoleta%'
    OR loc.name ILIKE '%deposito%'
    OR loc.name ILIKE '%depósito%'
    OR dwl.vessel_name ILIKE '%deposito%'
    OR dwl.vessel_name ILIKE '%depósito%'
    OR dwl.vessel_name ILIKE '%plazoleta%'
  )
  AND dse.operational_role = 'RAMPA';

NOTIFY pgrst, 'reload schema';
