-- Migration: Add operational_role and is_compensation_shift to daily_staff_entries for Vessel Proformas
-- Description:
-- 1. Adds operational_role (e.g. 'RAMPA', 'DAÑOS', 'RELEVO', 'ENCARGADO') to daily_staff_entries
--    so that Vessel Proformas (GOODWOOD OPERATIVA & PLUS) display the exact operational post in PUESTO
--    instead of the category (Encargado / Apuntador).
-- 2. Adds is_compensation_shift BOOLEAN DEFAULT false to daily_staff_entries to mark continuous work shifts (*)
--    that belong to the Horas de Compensación agreement with CAT Argentina.
-- 3. Backfills existing vessel shifts with operational_role ('ENCARGADO', 'RAMPA', 'DAÑOS', 'RELEVO').

ALTER TABLE public.daily_staff_entries
ADD COLUMN IF NOT EXISTS operational_role VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_compensation_shift BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.daily_staff_entries.operational_role IS 'Puesto operativo específico en proforma de buque (ej: RAMPA, DAÑOS, RELEVO, ENCARGADO)';
COMMENT ON COLUMN public.daily_staff_entries.is_compensation_shift IS 'Indica si el turno corresponde al acuerdo de Horas de Compensación / Trabajo Corrido (*)';

-- Backfill operational_role on existing daily_staff_entries where null
UPDATE public.daily_staff_entries dse
SET operational_role = CASE
    WHEN p.name ILIKE '%encargado%' THEN 'ENCARGADO'
    WHEN p.name ILIKE '%rampa%' THEN 'RAMPA'
    WHEN p.name ILIKE '%daño%' OR p.name ILIKE '%dano%' THEN 'DAÑOS'
    WHEN p.name ILIKE '%relevo%' THEN 'RELEVO'
    ELSE 'RAMPA'
END
FROM public.positions p
WHERE dse.position_id = p.id
  AND dse.operational_role IS NULL;

NOTIFY pgrst, 'reload schema';

